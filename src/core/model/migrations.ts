/**
 * Formatversionen von `project.json` (Feld `schemaVersion`).
 *
 * Regel (CLAUDE.md): Jede Änderung am Dateiformat erhöht CURRENT_SCHEMA_VERSION und bringt eine
 * Migration „von n auf n+1“ mit Test mit (src/core/model/migrations.test.ts, Testdatei in
 * tests/fixtures/). Migrationen arbeiten auf den rohen JSON-Daten, verändern die Eingabe nicht und
 * ergänzen fehlende Felder mit Standardwerten. Danach prüft und vervollständigt `normalizeProject`
 * (schema.ts) das Ergebnis.
 *
 * Versionen:
 *   1  M1–M3: Projekt, Pages, Hintergrund, Grundflächen, Geschäfte, Kategorien.
 *   2  M4: Geschäft `suppressOverlapWarning`, Einstellung `warnOverlap` (Warnungen, Freiflächen).
 *   3  M5: Einstellungen `numbering.digits` und `warnDuplicateNr`, Geschäft `suppressDuplicateWarning`;
 *      `clockwise.startAngle` gilt relativ zur Nordrichtung der Page (vorher ohne Oberfläche, nie gesetzt).
 */
import { UserError } from '../errors';

export const CURRENT_SCHEMA_VERSION = 3;

type Obj = Record<string, unknown>;
type Migration = (project: Obj) => Obj;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Wendet `fn` auf jedes Element an; alles andere als ein Array bleibt unverändert (die Prüfung macht schema.ts). */
const mapList = (v: unknown, fn: (x: unknown) => unknown) => (Array.isArray(v) ? v.map(fn) : v);

/** MIGRATIONS[n] hebt ein Projekt von Version n auf n+1. */
export const MIGRATIONS: Record<number, Migration> = {
  /** 1 → 2 (M4): Überlappungswarnung pro Stand ignorierbar und projektweit abschaltbar. */
  1: (p) => ({
    ...p,
    settings: isObj(p.settings) ? { warnOverlap: true, ...p.settings } : p.settings,
    pages: mapList(p.pages, (pg) => (isObj(pg) ? { ...pg, stands: mapList(pg.stands, (s) => (isObj(s) ? { suppressOverlapWarning: false, ...s } : s)) } : pg)),
  }),
  /** 2 → 3 (M5): Stellenzahl der Nummern, Warnung „doppelte Nummer“ projektweit und pro Stand. */
  2: (p) => ({
    ...p,
    settings: isObj(p.settings)
      ? { warnDuplicateNr: true, ...p.settings, ...(isObj(p.settings.numbering) ? { numbering: { digits: 1, ...p.settings.numbering } } : {}) }
      : p.settings,
    pages: mapList(p.pages, (pg) => (isObj(pg) ? { ...pg, stands: mapList(pg.stands, (s) => (isObj(s) ? { suppressDuplicateWarning: false, ...s } : s)) } : pg)),
  }),
};

export function migrate(project: unknown, fromVersion: number): unknown {
  let p = project;
  for (let v = fromVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new UserError(`Die Datei hat Formatversion ${fromVersion}; diese Version kann Schelmeplaner nicht umwandeln.`);
    if (!isObj(p)) return p;
    p = step(p);
  }
  return p;
}
