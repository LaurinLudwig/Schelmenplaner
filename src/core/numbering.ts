/**
 * Standnummern (M5, spec.md §5): Reihenfolge der Stände, Format, Neu-Nummerieren mit Vorschau und
 * doppelte Nummern.
 *
 * - Links → rechts: alle Stände der Page nach der x-Koordinate ihrer Mitte, unabhängig von den Grundflächen.
 * - Uhrzeigersinn: nach dem Winkel der Standmitte um den Mittelpunkt, ab der Startrichtung (relativ
 *   zum Norden der Page).
 * - Nummernkreis „pro Festplatz“ oder „global“ (Pages in Tab-Reihenfolge, manuelle ausgelassen).
 * - Fixierte Nummern werden übersprungen und nie an einen anderen Stand desselben Nummernkreises vergeben.
 */
import { rectGeo } from './geometry/polygon';
import { normAngle } from './geometry/rect';
import { ANGLE_TOL, TOL } from './geometry/tolerance';
import type { ClockwiseSettings, FestplatzPage, Id, NumberingScope, Project, Stand, Vec } from './model/types';

/** Grenzen der Einstellungen. */
export const NUMBERING_LIMITS = { start: { min: 0, max: 99_999 }, digits: { min: 1, max: 4 } };
const clampInt = (n: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, Math.round(n)));
export const clampStart = (n: number) => clampInt(n, NUMBERING_LIMITS.start);
export const clampDigits = (n: number) => clampInt(n, NUMBERING_LIMITS.digits);

/** „A-“, 7, 2 → „A-07“. */
export const formatNr = (prefix: string, n: number, digits: number) => prefix + String(n).padStart(digits, '0');

/**
 * Vergleichsschlüssel einer Nummer: ohne Leerzeichen am Rand, ohne Groß/Klein, ohne führende Nullen in
 * Zahlen („A-012“ = „a-12“). Leere Nummer → ''.
 */
export const nrKey = (nr: string) =>
  nr
    .trim()
    .toLowerCase()
    .replace(/\d+/g, (d) => d.replace(/^0+(?=\d)/, ''));

/** Zwei Nummern gelten als gleich (leere nie). */
export const sameNr = (a: string, b: string) => nrKey(a) !== '' && nrKey(a) === nrKey(b);

// ---------- Reihenfolge ----------

const center = (r: Stand): Vec => ({ x: r.cx, y: r.cy });

/** Vergleich mit Toleranz: gleich, wenn höchstens `tol` auseinander. */
const cmpTol = (a: number, b: number, tol: number) => (Math.abs(a - b) <= tol + 1e-9 ? 0 : a - b);
const byId = (a: Stand, b: Stand) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Links → rechts über den ganzen Festplatz, unabhängig von den Grundflächen (Laurin, 2026-10-12): nach der
 * x-Koordinate der Standmitte, bei gleicher Lage (bis TOL) der obere Stand zuerst.
 */
export function orderLeftToRight(stands: readonly Stand[]): Stand[] {
  return stands.toSorted((a, b) => cmpTol(a.cx, b.cx, TOL) || cmpTol(a.cy, b.cy, TOL) || byId(a, b));
}

/** Winkel von `p` um `c` in Grad im Uhrzeigersinn ab „oben“ auf dem Bildschirm (y nach unten). */
const screenAngle = (c: Vec, p: Vec) => normAngle((Math.atan2(p.x - c.x, c.y - p.y) * 180) / Math.PI);

/** Richtung des Startstrahls auf dem Bildschirm (Grad im Uhrzeigersinn ab oben). */
export const clockwiseStartDirection = (cw: ClockwiseSettings, northAngle: number) => normAngle(northAngle + cw.startAngle);

/** Im Uhrzeigersinn um den Mittelpunkt, ab der Startrichtung (relativ zum Norden der Page). */
export function orderClockwise(stands: readonly Stand[], cw: ClockwiseSettings, northAngle: number): Stand[] {
  const start = clockwiseStartDirection(cw, northAngle);
  const keyed = stands.map((s) => {
    const dist = Math.hypot(s.cx - cw.center.x, s.cy - cw.center.y);
    let rel = dist > 1e-9 ? normAngle(screenAngle(cw.center, center(s)) - start) : 0;
    if (360 - rel <= ANGLE_TOL) rel = 0;
    return { s, rel, dist };
  });
  keyed.sort((p, q) => cmpTol(p.rel, q.rel, ANGLE_TOL) || cmpTol(p.dist, q.dist, TOL) || byId(p.s, q.s));
  return keyed.map((k) => k.s);
}

/** Mitte des Hüllrechtecks aller Grundflächen und Stände (Vorgabe für den Mittelpunkt), sonst null. */
export function defaultClockwiseCenter(page: Pick<FestplatzPage, 'areas' | 'stands'>): Vec | null {
  const all = [...page.areas, ...page.stands];
  if (!all.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of all) {
    const b = rectGeo(r).bounds;
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }
  return { x: Math.round(((minX + maxX) / 2) * 100) / 100, y: Math.round(((minY + maxY) / 2) * 100) / 100 };
}

/** Stände einer Page in Nummerierungsreihenfolge; im Modus „manuell“ leer. */
export function orderStands(page: FestplatzPage): Stand[] {
  if (page.numberingMode === 'manual') return [];
  if (page.numberingMode === 'clockwise') {
    const cw = page.clockwise ?? (defaultClockwiseCenter(page) ? { center: defaultClockwiseCenter(page)!, startAngle: 0 } : null);
    return cw ? orderClockwise(page.stands, cw, page.northAngle) : [];
  }
  return orderLeftToRight(page.stands);
}

// ---------- Doppelte Nummern ----------

export interface NrRef {
  pageId: Id;
  standId: Id;
}

/** Nummernkreis eines Stands: bei „global“ das Projekt, sonst die Page. */
const circleKey = (scope: NumberingScope, pageId: Id) => (scope === 'global' ? '' : pageId);

/**
 * Doppelte Nummern je Nummernkreis: Stand-ID → die anderen Stände mit gleicher Nummer.
 * `override` ersetzt Nummern (für die Vorschau des Neu-Nummerierens).
 */
export function findDuplicates(pages: readonly FestplatzPage[], scope: NumberingScope, override?: ReadonlyMap<Id, string>): Map<Id, NrRef[]> {
  const groups = new Map<string, NrRef[]>();
  for (const page of pages) {
    for (const s of page.stands) {
      const key = nrKey(override?.get(s.id) ?? s.nr);
      if (!key) continue;
      const g = `${circleKey(scope, page.id)}\u0000${key}`;
      let list = groups.get(g);
      if (!list) groups.set(g, (list = []));
      list.push({ pageId: page.id, standId: s.id });
    }
  }
  const out = new Map<Id, NrRef[]>();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    for (const r of list) out.set(r.standId, list.filter((o) => o !== r));
  }
  return out;
}

/** Wie `findDuplicates`, zwischengespeichert je Liste der Pages (Immer liefert bei unverändertem Projekt dieselbe). */
const dupCache = new WeakMap<readonly FestplatzPage[], { scope: NumberingScope; result: Map<Id, NrRef[]> }>();
export function cachedDuplicates(pages: readonly FestplatzPage[], scope: NumberingScope): Map<Id, NrRef[]> {
  const hit = dupCache.get(pages);
  if (hit && hit.scope === scope) return hit.result;
  const result = findDuplicates(pages, scope);
  dupCache.set(pages, { scope, result });
  return result;
}

// ---------- Neu nummerieren ----------

export interface NrChange extends NrRef {
  old: string;
  next: string;
}

export interface RenumberPlan {
  scope: NumberingScope;
  /** Betroffene Pages in Tab-Reihenfolge. */
  pageIds: Id[];
  /** Stände, deren Nummer sich ändert, in Nummerierungsreihenfolge. */
  changes: NrChange[];
  /** Fixierte Stände auf den betroffenen Pages (übersprungen). */
  fixed: number;
  /** Stände, die ihre Nummer behalten. */
  unchanged: number;
  /** Doppelte Nummern, die nach dem Übernehmen bleiben (Stand-ID → andere). */
  duplicates: Map<Id, NrRef[]>;
}

/**
 * Plan für „Neu nummerieren“: bei „pro Festplatz“ die Page `pageId`, bei „global“ alle Pages außer den
 * manuellen. Fixierte Nummern im selben Nummernkreis (bei „global“ auch alle Nummern manueller Pages)
 * werden nie vergeben.
 */
export function planRenumber(project: Pick<Project, 'pages' | 'settings'>, pageId: Id): RenumberPlan {
  const { scope, start, digits } = project.settings.numbering;
  const targets = scope === 'global' ? project.pages.filter((p) => p.numberingMode !== 'manual') : project.pages.filter((p) => p.id === pageId && p.numberingMode !== 'manual');
  const changes: NrChange[] = [];
  const override = new Map<Id, string>();
  let fixed = 0;
  let unchanged = 0;

  const reservedOf = (pages: readonly FestplatzPage[]) => {
    const keys = new Set<string>();
    for (const p of pages) for (const s of p.stands) if (s.nrLocked || p.numberingMode === 'manual') keys.add(nrKey(s.nr));
    keys.delete('');
    return keys;
  };
  const globalReserved = scope === 'global' ? reservedOf(project.pages) : null;

  let counter = start;
  for (const page of targets) {
    if (scope === 'perPage') counter = start;
    const reserved = globalReserved ?? reservedOf([page]);
    for (const s of orderStands(page)) {
      if (s.nrLocked) {
        fixed++;
        continue;
      }
      let next = formatNr(page.prefix, counter++, digits);
      while (reserved.has(nrKey(next))) next = formatNr(page.prefix, counter++, digits);
      if (next === s.nr) unchanged++;
      else {
        changes.push({ pageId: page.id, standId: s.id, old: s.nr, next });
        override.set(s.id, next);
      }
    }
  }
  return { scope, pageIds: targets.map((p) => p.id), changes, fixed, unchanged, duplicates: findDuplicates(project.pages, scope, override) };
}
