/**
 * Formatversionen von `project.json`. Bei jeder inkompatiblen Änderung:
 * CURRENT_SCHEMA_VERSION erhöhen und eine Migration „von n auf n+1“ ergänzen.
 */
export const CURRENT_SCHEMA_VERSION = 1;

type Migration = (project: unknown) => unknown;

/** MIGRATIONS[n] hebt ein Projekt von Version n auf n+1. */
const MIGRATIONS: Record<number, Migration> = {};

export function migrate(project: unknown, fromVersion: number): unknown {
  let p = project;
  for (let v = fromVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Keine Migration von Formatversion ${v} vorhanden.`);
    p = step(p);
  }
  return p;
}
