/**
 * Warnungen für Geschäfte (M4, spec.md §3):
 * - außerhalb: Ein Teil des Stands liegt mehr als TOL außerhalb der Vereinigung aller Grundflächen.
 * - Überlappung: Zwei Stände dringen mehr als TOL ineinander ein.
 * - doppelte Nummer (M5): berechnet in numbering.ts (`cachedDuplicates`), hier nur angezeigt und gezählt.
 * Die Rohdaten hängen nur von der Geometrie ab; ob eine Warnung angezeigt wird, entscheiden die
 * Projekteinstellungen und die Häkchen am Stand (`activeWarnings`).
 */
import { boundsTouch, clipConvex, dilateRect, distToRect, penetration, rectGeo, subtractAll, type Polygon } from './geometry/polygon';
import { exceedsTol, greaterThan, TOL, withinTol } from './geometry/tolerance';
import type { Area, Id, ProjectSettings, Stand } from './model/types';

export interface StandWarning {
  outside: boolean;
  /** IDs der Stände, mit denen sich dieser Stand überschneidet. */
  overlaps: Id[];
}

export interface OverlapRegion {
  a: Id;
  b: Id;
  polygon: Polygon;
}

export interface PageWarnings {
  byStand: Map<Id, StandWarning>;
  regions: OverlapRegion[];
}

/**
 * Liegt ein Teil des Stands mehr als TOL außerhalb der Vereinigung der Grundflächen (QA-M4-02)?
 * Gemessen wird der echte Abstand, auch für schräg herausragende Ecken gedrehter Stände.
 * 1. Alle Ecken höchstens TOL von derselben Grundfläche entfernt → innerhalb (Rechteck aufgeweitet ist konvex).
 * 2. Eine Ecke mehr als TOL von allen Grundflächen entfernt → außerhalb.
 * 3. Sonst genau: Stand minus alle um TOL aufgeweiteten Grundflächen; bleibt etwas übrig → außerhalb.
 */
export function isOutside(stand: Stand, areas: readonly Area[]): boolean {
  const { poly, bounds } = rectGeo(stand);
  const near = areas.filter((a) => boundsTouch(bounds, rectGeo(a).bounds, TOL));
  if (!near.length) return true;
  if (near.some((a) => poly.every((p) => withinTol(distToRect(a, p))))) return false;
  if (poly.some((p) => near.every((a) => exceedsTol(distToRect(a, p))))) return true;
  return subtractAll([poly], near.map((a) => dilateRect(a, TOL))).length > 0;
}

/** Paare sich überschneidender Stände (Sweep über die Hüllrechtecke, genau per SAT). */
export function overlappingPairs(stands: readonly Stand[]): OverlapRegion[] {
  const items = stands.map((s) => ({ s, g: rectGeo(s) })).toSorted((p, q) => p.g.bounds.minX - q.g.bounds.minX);
  const out: OverlapRegion[] = [];
  for (let i = 0; i < items.length; i++) {
    const p = items[i]!;
    for (let j = i + 1; j < items.length; j++) {
      const q = items[j]!;
      if (greaterThan(q.g.bounds.minX, p.g.bounds.maxX)) break;
      if (!boundsTouch(p.g.bounds, q.g.bounds)) continue;
      if (exceedsTol(penetration(p.g.poly, q.g.poly))) {
        const [a, b] = p.s.id < q.s.id ? [p.s.id, q.s.id] : [q.s.id, p.s.id];
        out.push({ a, b, polygon: clipConvex(p.g.poly, q.g.poly) });
      }
    }
  }
  return out;
}

/** „außerhalb“ je Stand zwischenspeichern: hängt nur vom Stand und der Liste der Grundflächen ab. */
const outsideCache = new WeakMap<Stand, { areas: readonly Area[]; outside: boolean }>();

export function pageWarnings(areas: readonly Area[], stands: readonly Stand[]): PageWarnings {
  const byStand = new Map<Id, StandWarning>();
  for (const s of stands) {
    let c = outsideCache.get(s);
    if (!c || c.areas !== areas) {
      c = { areas, outside: isOutside(s, areas) };
      outsideCache.set(s, c);
    }
    byStand.set(s.id, { outside: c.outside, overlaps: [] });
  }
  const regions = overlappingPairs(stands);
  for (const r of regions) {
    byStand.get(r.a)?.overlaps.push(r.b);
    byStand.get(r.b)?.overlaps.push(r.a);
  }
  return { byStand, regions };
}

export type WarnSettings = Pick<ProjectSettings, 'warnOutside' | 'warnOverlap' | 'warnDuplicateNr'>;

export interface ActiveWarnings {
  outside: boolean;
  overlap: boolean;
  duplicate: boolean;
}

/**
 * Angezeigte Warnungen eines Stands nach Projekteinstellung und eigenen Häkchen.
 * `duplicate` = der Stand hat eine doppelte Nummer (numbering.ts).
 */
export function activeWarnings(w: StandWarning | undefined, stand: Stand, settings: WarnSettings, duplicate = false): ActiveWarnings {
  return {
    outside: !!w?.outside && settings.warnOutside && !stand.suppressOutsideWarning,
    overlap: !!w?.overlaps.length && settings.warnOverlap && !stand.suppressOverlapWarning,
    duplicate: duplicate && settings.warnDuplicateNr && !stand.suppressDuplicateWarning,
  };
}

export interface WarningCount {
  /** Stände mit mindestens einer angezeigten Warnung. */
  stands: number;
  /** Je Art; ein Stand mit Überlappung zählt nur dort, sonst bei „außerhalb“. */
  outside: number;
  overlap: number;
  /** Stände mit doppelter Nummer (zusätzlich zu den beiden anderen gezählt). */
  duplicate: number;
}

export function countWarnings(w: PageWarnings, stands: readonly Stand[], settings: WarnSettings, duplicates?: ReadonlyMap<Id, unknown>): WarningCount {
  const n: WarningCount = { stands: 0, outside: 0, overlap: 0, duplicate: 0 };
  for (const s of stands) {
    const a = activeWarnings(w.byStand.get(s.id), s, settings, !!duplicates?.has(s.id));
    if (a.outside || a.overlap || a.duplicate) n.stands++;
    if (a.overlap) n.overlap++;
    else if (a.outside) n.outside++;
    if (a.duplicate) n.duplicate++;
  }
  return n;
}

/**
 * Warnungen einer Page, zwischengespeichert je Liste der Stände (Immer liefert bei unveränderter Page
 * dieselbe Liste). Für die Zähler an den Page-Tabs, die alle Pages betrachten.
 */
const pageCache = new WeakMap<readonly Stand[], { areas: readonly Area[]; result: PageWarnings }>();
export function cachedPageWarnings(areas: readonly Area[], stands: readonly Stand[]): PageWarnings {
  const hit = pageCache.get(stands);
  if (hit && hit.areas === areas) return hit.result;
  const result = pageWarnings(areas, stands);
  pageCache.set(stands, { areas, result });
  return result;
}
