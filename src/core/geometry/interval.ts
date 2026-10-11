/**
 * Intervalle auf der Achse einer Grundfläche (M4), nach prototype/freiflaechen.html
 * (mergeIntervals, subtractIntervals), ergänzt um Toleranz und die IDs der begrenzenden Stände.
 */
import type { Id } from '../model/types';

/** Belegtes Intervall [a, b] eines Stands. */
export interface Interval {
  a: number;
  b: number;
  id: Id;
}

/** Zusammengefasstes Intervall; `startId`/`endId` = Stand, der den Anfang bzw. das Ende bildet. */
export interface Merged {
  a: number;
  b: number;
  startId: Id;
  endId: Id;
}

/** Lücke [a, b]; `left`/`right` = begrenzender Stand oder `^`/`$` für Anfang/Ende der Achse. */
export interface Gap {
  a: number;
  b: number;
  left: Id;
  right: Id;
}

export const AXIS_START = '^';
export const AXIS_END = '$';

const minId = (ids: Id[]) => ids.reduce((m, x) => (x < m ? x : m));

/**
 * VEREINIGUNG: sortiert und fasst überlappende Intervalle sowie Lücken bis `tol` zusammen.
 * Begrenzen mehrere Stände ein Ende (innerhalb `tol`), gilt die kleinste ID; so hängt das Ergebnis
 * nicht von der Reihenfolge der Eingabe ab.
 */
export function mergeIntervals(list: readonly Interval[], tol: number): Merged[] {
  const sorted = list.toSorted((p, q) => p.a - q.a || p.b - q.b || (p.id < q.id ? -1 : p.id > q.id ? 1 : 0));
  const groups: Interval[][] = [];
  let end = -Infinity;
  for (const iv of sorted) {
    const g = groups[groups.length - 1];
    if (g && iv.a <= end + tol) {
      g.push(iv);
      end = Math.max(end, iv.b);
    } else {
      groups.push([iv]);
      end = iv.b;
    }
  }
  return groups.map((g) => {
    const a = Math.min(...g.map((x) => x.a));
    const b = Math.max(...g.map((x) => x.b));
    return {
      a,
      b,
      startId: minId(g.filter((x) => x.a <= a + tol).map((x) => x.id)),
      endId: minId(g.filter((x) => x.b >= b - tol).map((x) => x.id)),
    };
  });
}

/** SUBTRAKTION: [0, length] minus die zusammengefassten, sortierten Intervalle → alle Lücken. */
export function subtractIntervals(length: number, merged: readonly Merged[]): Gap[] {
  const gaps: Gap[] = [];
  let cursor = 0;
  let left: Id = AXIS_START;
  for (const m of merged) {
    if (m.a > cursor) gaps.push({ a: cursor, b: Math.min(m.a, length), left, right: m.startId });
    if (m.b > cursor) {
      cursor = m.b;
      left = m.endId;
    }
    if (cursor >= length) break;
  }
  if (cursor < length) gaps.push({ a: cursor, b: length, left, right: AXIS_END });
  return gaps;
}
