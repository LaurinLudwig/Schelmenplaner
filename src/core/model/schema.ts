import { normAngle } from '../geometry/rect';
import { newId } from '../id';
import { UserError } from '../errors';
import { createPage, defaultLayers, DEFAULT_INFRA_TYPES, DEFAULT_SETTINGS } from './defaults';
import { CURRENT_SCHEMA_VERSION, migrate } from './migrations';
import { LAYER_IDS, type Area, type Background, type Category, type Connection, type FestplatzPage, type Project, type ProjectFile, type Stand, type Vec } from './types';

export class ProjectFileError extends UserError {
  override name = 'ProjectFileError';
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function toProjectFile(project: Project): ProjectFile {
  return { format: 'schelmeplaner', schemaVersion: CURRENT_SCHEMA_VERSION, project };
}

/**
 * Liest den Inhalt von `project.json`: prüft Format und Version, führt Migrationen aus und
 * ergänzt fehlende Felder mit Standardwerten. Wirft `ProjectFileError` mit deutscher Meldung.
 */
export function parseProjectFile(raw: unknown): Project {
  if (!isObj(raw) || raw.format !== 'schelmeplaner') {
    throw new ProjectFileError('Die Datei ist kein Schelmeplaner-Projekt.');
  }
  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new ProjectFileError('Die Datei hat keine gültige Formatversion.');
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new ProjectFileError(
      `Die Datei wurde mit einer neueren Version von Schelmeplaner erstellt (Format ${version}). Bitte die App aktualisieren.`,
    );
  }
  const migrated = migrate(raw.project, version);
  if (!isObj(migrated)) throw new ProjectFileError('Die Projektdaten fehlen oder sind beschädigt.');
  return normalizeProject(migrated);
}

function normalizeProject(p: Obj): Project {
  if (typeof p.id !== 'string' || !Array.isArray(p.pages)) {
    throw new ProjectFileError('Die Projektdaten sind unvollständig (ID oder Pages fehlen).');
  }
  const s = isObj(p.settings) ? p.settings : {};
  const numbering = isObj(s.numbering) ? s.numbering : {};
  const snap = isObj(s.snap) ? s.snap : {};
  const tb = isObj(p.titleBlock) ? p.titleBlock : {};
  const ids = new Set<string>();
  const objectIds = new Set<string>();
  const categories = normalizeCategories(p.categories);
  const categoryIds = new Set(categories.map((c) => c.id));
  return {
    id: p.id,
    name: str(p.name, 'Projekt'),
    settings: {
      minFreeWidth: num(s.minFreeWidth, DEFAULT_SETTINGS.minFreeWidth),
      labelFontSize: num(s.labelFontSize, DEFAULT_SETTINGS.labelFontSize),
      labelTemplate: str(s.labelTemplate, DEFAULT_SETTINGS.labelTemplate),
      numbering: {
        scope: numbering.scope === 'global' ? 'global' : 'perPage',
        start: num(numbering.start, DEFAULT_SETTINGS.numbering.start),
      },
      warnOutside: bool(s.warnOutside, DEFAULT_SETTINGS.warnOutside),
      snap: {
        front: bool(snap.front, DEFAULT_SETTINGS.snap.front),
        grid: bool(snap.grid, DEFAULT_SETTINGS.snap.grid),
        neighbors: bool(snap.neighbors, DEFAULT_SETTINGS.snap.neighbors),
      },
    },
    pages: p.pages.map((pg, i) => normalizePage(pg, i, ids, objectIds, categoryIds)),
    categories,
    infraTypes: Array.isArray(p.infraTypes) && p.infraTypes.length ? (p.infraTypes as Project['infraTypes']) : structuredClone(DEFAULT_INFRA_TYPES),
    exportProfiles: arr(p.exportProfiles),
    titleBlock: { dateText: str(tb.dateText, ''), version: str(tb.version, '') },
    unplaced: arr(p.unplaced),
  };
}

function normalizePage(raw: unknown, index: number, ids: Set<string>, objectIds: Set<string>, categoryIds: Set<string>): FestplatzPage {
  if (!isObj(raw) || typeof raw.id !== 'string' || ids.has(raw.id)) {
    throw new ProjectFileError(`Festplatz-Page Nr. ${index + 1} ist beschädigt (fehlende oder doppelte ID).`);
  }
  ids.add(raw.id);
  const base = createPage(str(raw.name, `Festplatz ${index + 1}`));
  const layersRaw = isObj(raw.layers) ? raw.layers : {};
  const layers = defaultLayers();
  for (const id of LAYER_IDS) {
    const l = layersRaw[id];
    if (isObj(l)) layers[id] = { visible: bool(l.visible, true), locked: bool(l.locked, false) };
  }
  const grid = isObj(raw.grid) ? raw.grid : {};
  const view = isObj(raw.view) ? raw.view : null;
  const tbp = isObj(raw.titleBlockPos) ? raw.titleBlockPos : {};
  const mode = raw.numberingMode;
  const background = normalizeBackground(raw.background);
  // E-13: Es gibt nur eine Hintergrund-Sperre (`background.locked`); eine alte Ebenen-Sperre wird übernommen.
  if (background && layers.background.locked) background.locked = true;
  layers.background.locked = false;
  return {
    ...base,
    id: raw.id,
    prefix: str(raw.prefix, ''),
    numberingMode: mode === 'clockwise' || mode === 'manual' ? mode : 'frontLtr',
    ...(isObj(raw.clockwise) ? { clockwise: raw.clockwise as unknown as FestplatzPage['clockwise'] } : {}),
    powerLimitKw: typeof raw.powerLimitKw === 'number' ? raw.powerLimitKw : null,
    blockOverLimit: bool(raw.blockOverLimit, false),
    northAngle: num(raw.northAngle, 0),
    grid: { size: num(grid.size, base.grid.size), visible: bool(grid.visible, base.grid.visible) },
    layers,
    background,
    areas: arr(raw.areas).map((a) => normalizeArea(a, objectIds)).filter((a): a is Area => !!a),
    stands: arr(raw.stands).map((st) => normalizeStand(st, objectIds, categoryIds)).filter((st): st is Stand => !!st),
    infra: arr(raw.infra),
    titleBlockPos: { x: num(tbp.x, 0), y: num(tbp.y, 0) },
    titleBlockText: str(raw.titleBlockText, ''),
    view: view ? { scale: num(view.scale, 10), tx: num(view.tx, 0), ty: num(view.ty, 0) } : null,
  };
}

const vecOrNull = (v: unknown): Vec | null =>
  isObj(v) && typeof v.x === 'number' && typeof v.y === 'number' ? { x: v.x, y: v.y } : null;

/** Hintergrund prüfen; ein unbrauchbarer Eintrag wird verworfen statt die ganze Datei abzulehnen. */
function normalizeBackground(raw: unknown): Background | null {
  if (!isObj(raw) || typeof raw.assetId !== 'string' || !raw.assetId) return null;
  const kind = raw.kind === 'pdf' || raw.kind === 'svg' || raw.kind === 'image' ? raw.kind : null;
  const size = isObj(raw.pxSize) ? raw.pxSize : {};
  const t = isObj(raw.transform) ? raw.transform : {};
  const w = num(size.w, 0);
  const h = num(size.h, 0);
  const metersPerPx = num(t.metersPerPx, 0);
  if (!kind || !(w > 0) || !(h > 0) || !(metersPerPx > 0)) return null;
  const cal = isObj(raw.calibration) ? raw.calibration : null;
  const p1 = cal ? vecOrNull(cal.p1) : null;
  const p2 = cal ? vecOrNull(cal.p2) : null;
  const meters = cal ? num(cal.meters, 0) : 0;
  return {
    assetId: raw.assetId,
    kind,
    fileName: str(raw.fileName, raw.assetId),
    ...(typeof raw.pdfPage === 'number' ? { pdfPage: raw.pdfPage } : {}),
    ...(typeof raw.pdfPageCount === 'number' ? { pdfPageCount: raw.pdfPageCount } : {}),
    pxSize: { w, h },
    transform: { x: num(t.x, 0), y: num(t.y, 0), metersPerPx, rot: num(t.rot, 0) },
    ...(p1 && p2 && meters > 0 ? { calibration: { p1, p2, meters } } : {}),
    ...(typeof raw.paperScale === 'number' && raw.paperScale > 0 ? { paperScale: raw.paperScale } : {}),
    opacity: Math.min(1, Math.max(0, num(raw.opacity, 1))),
    locked: bool(raw.locked, false),
  };
}

const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

function normalizeCategories(raw: unknown): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const c of arr(raw)) {
    if (!isObj(c) || typeof c.id !== 'string' || !c.id || seen.has(c.id)) continue;
    seen.add(c.id);
    out.push({ id: c.id, name: str(c.name, 'Kategorie'), color: isColor(c.color) ? c.color : '#a7adb3' });
  }
  return out;
}

/** Rechteckfelder prüfen; null, wenn Position oder Maße unbrauchbar sind. */
function rectOf(o: Obj) {
  const cx = num(o.cx, NaN);
  const cy = num(o.cy, NaN);
  const w = num(o.w, NaN);
  const d = num(o.d, NaN);
  if (![cx, cy].every(Number.isFinite) || !(w > 0) || !(d > 0)) return null;
  return { cx, cy, w, d, rot: normAngle(num(o.rot, 0)) };
}

/** Eindeutige Objekt-ID; doppelte oder fehlende IDs werden neu vergeben. */
function objectId(raw: unknown, ids: Set<string>): string {
  const id = typeof raw === 'string' && raw && !ids.has(raw) ? raw : newId();
  ids.add(id);
  return id;
}

/** Grundfläche prüfen; ein unbrauchbarer Eintrag wird verworfen statt die Datei abzulehnen. */
function normalizeArea(raw: unknown, ids: Set<string>): Area | null {
  if (!isObj(raw)) return null;
  const r = rectOf(raw);
  if (!r) return null;
  return { id: objectId(raw.id, ids), name: str(raw.name, ''), ...r };
}

const CONNECTIONS: readonly Connection[] = ['230V', 'CEE16', 'CEE32'];

function normalizeStand(raw: unknown, ids: Set<string>, categoryIds: Set<string>): Stand | null {
  if (!isObj(raw)) return null;
  const r = rectOf(raw);
  if (!r) return null;
  const cat = typeof raw.categoryId === 'string' && categoryIds.has(raw.categoryId) ? raw.categoryId : null;
  return {
    id: objectId(raw.id, ids),
    nr: str(raw.nr, ''),
    nrLocked: bool(raw.nrLocked, false),
    name: str(raw.name, ''),
    owner: str(raw.owner, ''),
    ware: str(raw.ware, ''),
    powerKw: Math.max(0, num(raw.powerKw, 0)),
    connection: CONNECTIONS.includes(raw.connection as Connection) ? (raw.connection as Connection) : null,
    note: str(raw.note, ''),
    categoryId: cat,
    color: isColor(raw.color) ? raw.color : null,
    suppressOutsideWarning: bool(raw.suppressOutsideWarning, false),
    ...r,
  };
}
