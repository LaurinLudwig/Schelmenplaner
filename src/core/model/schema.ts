import { createPage, defaultLayers, DEFAULT_INFRA_TYPES, DEFAULT_SETTINGS } from './defaults';
import { CURRENT_SCHEMA_VERSION, migrate } from './migrations';
import { LAYER_IDS, type FestplatzPage, type Project, type ProjectFile } from './types';

export class ProjectFileError extends Error {
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
    pages: p.pages.map((pg, i) => normalizePage(pg, i, ids)),
    categories: arr(p.categories),
    infraTypes: Array.isArray(p.infraTypes) && p.infraTypes.length ? (p.infraTypes as Project['infraTypes']) : structuredClone(DEFAULT_INFRA_TYPES),
    exportProfiles: arr(p.exportProfiles),
    titleBlock: { dateText: str(tb.dateText, ''), version: str(tb.version, '') },
    unplaced: arr(p.unplaced),
  };
}

function normalizePage(raw: unknown, index: number, ids: Set<string>): FestplatzPage {
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
    background: isObj(raw.background) ? (raw.background as unknown as FestplatzPage['background']) : null,
    areas: arr(raw.areas),
    stands: arr(raw.stands),
    infra: arr(raw.infra),
    titleBlockPos: { x: num(tbp.x, 0), y: num(tbp.y, 0) },
    titleBlockText: str(raw.titleBlockText, ''),
    view: view ? { scale: num(view.scale, 10), tx: num(view.tx, 0), ty: num(view.ty, 0) } : null,
  };
}
