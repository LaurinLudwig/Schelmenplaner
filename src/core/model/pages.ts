import { newId } from '../id';
import type { FestplatzPage } from './types';

/** „Festplatz n“ mit der kleinsten Zahl n ≥ Anzahl+1, die noch nicht vergeben ist. */
export function nextPageName(pages: readonly FestplatzPage[]): string {
  const names = new Set(pages.map((p) => p.name));
  let n = pages.length + 1;
  while (names.has(`Festplatz ${n}`)) n++;
  return `Festplatz ${n}`;
}

/** „Name (Kopie)“, bei Bedarf „Name (Kopie 2)“ usw. */
export function copyName(name: string, pages: readonly FestplatzPage[]): string {
  const names = new Set(pages.map((p) => p.name));
  const base = name.replace(/ \(Kopie(?: \d+)?\)$/, '');
  let candidate = `${base} (Kopie)`;
  for (let i = 2; names.has(candidate); i++) candidate = `${base} (Kopie ${i})`;
  return candidate;
}

/** Tiefe Kopie einer Page mit neuen IDs für die Page und alle Objekte darauf. */
export function clonePage(page: FestplatzPage, name: string): FestplatzPage {
  const copy = structuredClone(page);
  copy.id = newId();
  copy.name = name;
  for (const list of [copy.areas, copy.stands, copy.infra]) for (const o of list) o.id = newId();
  return copy;
}
