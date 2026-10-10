import { normAngle, roundRect, setFront } from '../core/geometry/rect';
import { allSelectable } from '../core/hit';
import { newId } from '../core/id';
import type { Area, Category, EdgeIndex, FestplatzPage, Id, Project, Rect, Stand } from '../core/model/types';
import { cloneObjects, createArea, createStand, findObjects, LIMITS, PALETTE, STAND_DEFAULT, type Clipboard, type ObjectKind } from '../core/objects';
import { groupCenter, moveRects, type RectMap } from '../core/transform';
import type { Bounds } from '../core/viewport';
import { START_PAGE, useStore } from './store';

/**
 * Befehle für Grundflächen, Geschäfte und Kategorien (M3). Jede Änderung ist genau ein Undo-Schritt;
 * Werte werden beim Übernehmen gerundet (`roundRect`: 0,01 m bzw. 0,1°).
 */

const st = () => useStore.getState();

export function activePage(): FestplatzPage | null {
  const s = st();
  if (s.ui.activePage === START_PAGE) return null;
  return s.project.pages.find((p) => p.id === s.ui.activePage) ?? null;
}

export function selectedIds(): Id[] {
  const sel = st().ui.selection;
  return sel?.kind === 'objects' ? sel.ids : [];
}

export function select(ids: Id[]) {
  st().setUi({ selection: ids.length ? { kind: 'objects', ids } : null });
}

const pageOf = (p: Project, pageId: Id) => p.pages.find((x) => x.id === pageId);

function eachObject(page: FestplatzPage, ids: readonly Id[], fn: (o: Area | Stand, kind: ObjectKind) => void) {
  const set = new Set(ids);
  for (const a of page.areas) if (set.has(a.id)) fn(a, 'area');
  for (const s of page.stands) if (set.has(s.id)) fn(s, 'stand');
}

const assignRect = (o: Rect, r: Rect) => {
  const n = roundRect(r);
  o.cx = n.cx;
  o.cy = n.cy;
  o.w = n.w;
  o.d = n.d;
  o.rot = n.rot;
};

const clamp = (v: number, kind: ObjectKind) => Math.min(LIMITS[kind].max, Math.max(LIMITS[kind].min, v));

// ---------- Anlegen ----------

/** Zuletzt angelegtes Standmaß; neue Stände per Klick bekommen es (anfangs 3 × 3 m). */
let lastStandSize = { ...STAND_DEFAULT };
export const standDefaultSize = () => lastStandSize;

export function addArea(pageId: Id, rect: Rect): Id {
  const area = createArea(roundRect({ ...rect, w: clamp(rect.w, 'area'), d: clamp(rect.d, 'area') }));
  st().change('Grundfläche anlegen', (p) => void pageOf(p, pageId)?.areas.push(area));
  select([area.id]);
  return area.id;
}

export function addStand(pageId: Id, rect: Rect): Id {
  const stand = createStand(roundRect({ ...rect, w: clamp(rect.w, 'stand'), d: clamp(rect.d, 'stand') }));
  lastStandSize = { w: stand.w, d: stand.d };
  st().change('Geschäft anlegen', (p) => void pageOf(p, pageId)?.stands.push(stand));
  select([stand.id]);
  return stand.id;
}

// ---------- Geometrie ----------

/** Übernimmt die Rechtecke einer Geste (Ziehen, Drehen, Größe ändern) als einen Undo-Schritt. */
export function commitRects(pageId: Id, rects: RectMap, label: string) {
  st().change(label, (p) => {
    const page = pageOf(p, pageId);
    if (page) eachObject(page, Object.keys(rects), (o) => assignRect(o, rects[o.id]!));
  });
}

/** Breite, Tiefe oder Drehung für alle angegebenen Objekte setzen (Drehung um den eigenen Mittelpunkt). */
export function setRectField(pageId: Id, ids: Id[], field: 'w' | 'd' | 'rot', value: number) {
  const label = field === 'rot' ? 'Drehen' : field === 'w' ? 'Breite ändern' : 'Tiefe ändern';
  st().change(label, (p) => {
    const page = pageOf(p, pageId);
    if (!page) return;
    eachObject(page, ids, (o, kind) => {
      const v = field === 'rot' ? normAngle(value) : clamp(value, kind);
      assignRect(o, { ...o, [field]: v });
    });
  });
}

/** Verschiebt die Objekte so, dass die Mitte ihres Hüllrechtecks bei x bzw. y liegt. */
export function moveGroupTo(pageId: Id, ids: Id[], target: { x?: number; y?: number }) {
  const page = st().project.pages.find((p) => p.id === pageId);
  if (!page) return;
  const objs = findObjects(page, ids).map((o) => o.obj);
  const c = groupCenter(objs);
  if (!c) return;
  moveBy(pageId, ids, (target.x ?? c.x) - c.x, (target.y ?? c.y) - c.y, 'Verschieben');
}

export function moveBy(pageId: Id, ids: Id[], dx: number, dy: number, label: string, mergeKey?: string) {
  const page = st().project.pages.find((p) => p.id === pageId);
  if (!page) return;
  const rects: RectMap = Object.fromEntries(findObjects(page, ids).map((o) => [o.obj.id, o.obj]));
  const moved = moveRects(rects, { x: dx, y: dy });
  st().change(
    label,
    (p) => {
      const pg = pageOf(p, pageId);
      if (pg) eachObject(pg, ids, (o) => assignRect(o, moved[o.id]!));
    },
    mergeKey ? { mergeKey } : {},
  );
}

/** Pfeiltasten: eine gedrückt gehaltene Taste ergibt einen Undo-Schritt. */
export function nudge(dx: number, dy: number) {
  const page = activePage();
  const ids = selectedIds();
  if (!page || !ids.length) return;
  moveBy(page.id, ids, dx, dy, 'Verschieben', `nudge:${page.id}:${ids.join(',')}`);
}

/** Kante `edge` der Grundfläche wird Vorderseite; die Fläche bleibt an derselben Stelle. */
export function setAreaFront(pageId: Id, id: Id, edge: EdgeIndex) {
  if (edge === 2) return;
  st().change('Vorderseite festlegen', (p) => {
    const a = pageOf(p, pageId)?.areas.find((x) => x.id === id);
    if (a) assignRect(a, setFront(a, edge));
  });
}

// ---------- Attribute ----------

export function updateStands(pageId: Id, ids: Id[], patch: Partial<Omit<Stand, 'id' | keyof Rect>>, label: string) {
  st().change(label, (p) => {
    const page = pageOf(p, pageId);
    if (page) eachObject(page, ids, (o, kind) => kind === 'stand' && Object.assign(o, patch));
  });
}

export function updateArea(pageId: Id, id: Id, patch: Partial<Pick<Area, 'name'>>, label: string) {
  st().change(label, (p) => {
    const a = pageOf(p, pageId)?.areas.find((x) => x.id === id);
    if (a) Object.assign(a, patch);
  });
}

// ---------- Löschen, Kopieren, Einfügen ----------

export function deleteObjects(pageId: Id, ids: Id[]) {
  if (!ids.length) return;
  const set = new Set(ids);
  const n = ids.length;
  st().change(n === 1 ? 'Objekt löschen' : `${n} Objekte löschen`, (p) => {
    const page = pageOf(p, pageId);
    if (!page) return;
    page.areas = page.areas.filter((a) => !set.has(a.id));
    page.stands = page.stands.filter((s) => !set.has(s.id));
  });
  select([]);
}

export function deleteSelection() {
  const page = activePage();
  if (page) deleteObjects(page.id, selectedIds());
}

let clipboard: Clipboard | null = null;
/** Wie oft der aktuelle Inhalt der Zwischenablage je Page schon eingefügt wurde. */
let pasteCounts: Record<Id, number> = {};

export const hasClipboard = () => !!clipboard;

function copyInternal(cut: boolean): boolean {
  const page = activePage();
  const ids = new Set(selectedIds());
  if (!page || !ids.size) return false;
  clipboard = {
    areas: structuredClone(page.areas.filter((a) => ids.has(a.id))),
    stands: structuredClone(page.stands.filter((s) => ids.has(s.id))),
    sourcePageId: page.id,
    cut,
  };
  pasteCounts = {};
  return true;
}

export function copySelection() {
  copyInternal(false);
}

export function cutSelection() {
  if (copyInternal(true)) deleteSelection();
}

function insertObjects(pageId: Id, areas: Area[], stands: Stand[], label: string) {
  st().change(label, (p) => {
    const page = pageOf(p, pageId);
    if (!page) return;
    page.areas.push(...areas.map((a) => roundRect(a)));
    page.stands.push(...stands.map((s) => roundRect(s)));
  });
  select([...areas.map((a) => a.id), ...stands.map((s) => s.id)]);
}

/**
 * Einfügen: an derselben Position, wenn sie im sichtbaren Bereich `view` liegt, sonst mittig darin.
 * Liegen die Originale noch auf der Ziel-Page, rückt jede Kopie um 1 m weiter nach rechts unten.
 */
export function paste(view: Bounds | null) {
  const page = activePage();
  if (!page || !clipboard) return;
  const all = [...clipboard.areas, ...clipboard.stands];
  const c = groupCenter(all);
  if (!c) return;
  const n = pasteCounts[page.id] ?? 0;
  pasteCounts[page.id] = n + 1;
  const originalsHere = clipboard.sourcePageId === page.id && !clipboard.cut;
  let off = n + (originalsHere ? 1 : 0);
  let dx = off;
  let dy = off;
  if (view && (c.x < view.minX || c.x > view.maxX || c.y < view.minY || c.y > view.maxY)) {
    off = n;
    dx = (view.minX + view.maxX) / 2 - c.x + off;
    dy = (view.minY + view.maxY) / 2 - c.y + off;
  }
  const copies = cloneObjects(clipboard.areas, clipboard.stands, dx, dy);
  insertObjects(page.id, copies.areas, copies.stands, 'Einfügen');
}

/** Duplizieren: Kopie um 1 m nach rechts unten versetzt, danach ausgewählt. */
export function duplicateSelection() {
  const page = activePage();
  const ids = new Set(selectedIds());
  if (!page || !ids.size) return;
  const copies = cloneObjects(
    page.areas.filter((a) => ids.has(a.id)),
    page.stands.filter((s) => ids.has(s.id)),
    1,
    1,
  );
  insertObjects(page.id, copies.areas, copies.stands, 'Duplizieren');
}

export function selectAll() {
  const page = activePage();
  if (page) select(allSelectable(page));
}

// ---------- Kategorien (projektweit) ----------

export function addCategory(): Id {
  const cats = st().project.categories;
  const names = new Set(cats.map((c) => c.name));
  let i = cats.length + 1;
  while (names.has(`Kategorie ${i}`)) i++;
  const used = new Set(cats.map((c) => c.color));
  const cat: Category = { id: newId(), name: `Kategorie ${i}`, color: PALETTE.find((c) => !used.has(c)) ?? PALETTE[cats.length % PALETTE.length]! };
  st().change('Kategorie anlegen', (p) => void p.categories.push(cat));
  return cat.id;
}

export function updateCategory(id: Id, patch: Partial<Omit<Category, 'id'>>) {
  const label = patch.color !== undefined ? 'Kategorie umfärben' : 'Kategorie umbenennen';
  st().change(label, (p) => {
    const c = p.categories.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
  });
}

/** Anzahl der Stände (alle Pages) mit dieser Kategorie. */
export function categoryUsage(project: Project, id: Id): number {
  return project.pages.reduce((n, pg) => n + pg.stands.filter((s) => s.categoryId === id).length, 0);
}

/** Löscht die Kategorie; ihre Stände verlieren sie (ein Undo-Schritt). */
export function deleteCategory(id: Id) {
  st().change('Kategorie löschen', (p) => {
    p.categories = p.categories.filter((c) => c.id !== id);
    for (const pg of p.pages) for (const s of pg.stands) if (s.categoryId === id) s.categoryId = null;
  });
}

// ---------- Beschriftung (projektweit) ----------

export function setLabelTemplate(template: string) {
  st().change('Beschriftungsvorlage ändern', (p) => void (p.settings.labelTemplate = template));
}

export function setLabelFontSize(size: number) {
  if (!(size > 0)) return;
  st().change('Schriftgröße ändern', (p) => void (p.settings.labelFontSize = Math.round(size * 100) / 100));
}
