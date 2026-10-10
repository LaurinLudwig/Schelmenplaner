/**
 * Rechteck-Geometrie aus prototype/freiflaechen.html (Geo-Modul).
 * Ecken-Reihenfolge (lokal, ungedreht): 0 oben links, 1 oben rechts, 2 unten rechts, 3 unten links.
 */
import type { Rect, Vec } from '../model/types';
import type { Bounds } from '../viewport';
import { rotate, vec } from './vec';

/** Die vier Weltkoordinaten-Ecken eines gedrehten Rechtecks. */
export function rectCorners(r: Rect): Vec[] {
  return ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sy]) => {
    const p = rotate(vec((sx * r.w) / 2, (sy * r.d) / 2), r.rot);
    return vec(r.cx + p.x, r.cy + p.y);
  });
}

/** Achsenparalleles Hüllrechteck mehrerer gedrehter Rechtecke, oder null bei leerer Liste. */
export function boundsOfRects(rects: readonly Rect[]): Bounds | null {
  if (!rects.length) return null;
  const b: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const r of rects) {
    for (const p of rectCorners(r)) {
      b.minX = Math.min(b.minX, p.x);
      b.minY = Math.min(b.minY, p.y);
      b.maxX = Math.max(b.maxX, p.x);
      b.maxY = Math.max(b.maxY, p.y);
    }
  }
  return b;
}
