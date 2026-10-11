/**
 * Warnungen für Geschäfte (M4, spec.md §3):
 * - außerhalb: Ein Teil des Stands liegt mehr als TOL außerhalb der Vereinigung aller Grundflächen.
 * - Überlappung: Zwei Stände dringen mehr als TOL ineinander ein.
 * Die Rohdaten hängen nur von der Geometrie ab; ob eine Warnung angezeigt wird, entscheiden die
 * Projekteinstellungen und die Häkchen am Stand (`activeWarnings`).
 */
import { boundsTouch, clipConvex, insetRect, penetration, rectGeo, subtractAll, type Polygon } from './geometry/polygon';
import { TOL } from './freeSpace';
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

/** Liegt der Stand (um TOL verkleinert) ganz in der Vereinigung der Grundflächen? */
export function isOutside(stand: Stand, areas: readonly Area[]): boolean {
  const inner = rectGeo(insetRect(stand, TOL)).poly;
  const b = rectGeo(stand).bounds;
  const cutters = areas.filter((a) => boundsTouch(b, rectGeo(a).bounds)).map((a) => rectGeo(a).poly);
  if (!cutters.length) return true;
  return subtractAll([inner], cutters).length > 0;
}

/** Paare sich überschneidender Stände (Sweep über die Hüllrechtecke, genau per SAT). */
export function overlappingPairs(stands: readonly Stand[]): OverlapRegion[] {
  const items = stands.map((s) => ({ s, g: rectGeo(s) })).toSorted((p, q) => p.g.bounds.minX - q.g.bounds.minX);
  const out: OverlapRegion[] = [];
  for (let i = 0; i < items.length; i++) {
    const p = items[i]!;
    for (let j = i + 1; j < items.length; j++) {
      const q = items[j]!;
      if (q.g.bounds.minX > p.g.bounds.maxX) break;
      if (q.g.bounds.minY > p.g.bounds.maxY || p.g.bounds.minY > q.g.bounds.maxY) continue;
      if (penetration(p.g.poly, q.g.poly) > TOL) {
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

type WarnSettings = Pick<ProjectSettings, 'warnOutside' | 'warnOverlap'>;

/** Angezeigte Warnungen eines Stands nach Projekteinstellung und eigenen Häkchen. */
export function activeWarnings(w: StandWarning | undefined, stand: Stand, settings: WarnSettings): { outside: boolean; overlap: boolean } {
  return {
    outside: !!w?.outside && settings.warnOutside && !stand.suppressOutsideWarning,
    overlap: !!w?.overlaps.length && settings.warnOverlap && !stand.suppressOverlapWarning,
  };
}

export interface WarningCount {
  /** Stände mit mindestens einer angezeigten Warnung. */
  stands: number;
  outside: number;
  overlap: number;
}

export function countWarnings(w: PageWarnings, stands: readonly Stand[], settings: WarnSettings): WarningCount {
  const n: WarningCount = { stands: 0, outside: 0, overlap: 0 };
  for (const s of stands) {
    const a = activeWarnings(w.byStand.get(s.id), s, settings);
    if (a.outside || a.overlap) n.stands++;
    if (a.overlap) n.overlap++;
    else if (a.outside) n.outside++;
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
