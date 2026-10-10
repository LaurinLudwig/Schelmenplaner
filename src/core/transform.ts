/**
 * Verschieben und Drehen mehrerer Objekte (M3). Arbeitet auf einer Abbildung ID → Rechteck,
 * damit Vorschau (während des Ziehens) und Übernahme dieselbe Rechnung nutzen.
 *
 * Erweiterung M4: `moveRects` nimmt optional einen `Snapper`, der die verschobenen Rechtecke
 * nachträglich einrasten lässt (Vorderkante, Raster, Nachbarn).
 */
import { boundsOfRects, normAngle, rotateAround } from './geometry/rect';
import type { Id, Rect, Vec } from './model/types';

export type RectMap = Record<Id, Rect>;

/** Fang beim Verschieben (ab M4). `altKey` kehrt den Fang temporär um. */
export type Snapper = (moved: RectMap, opts: { altKey: boolean }) => RectMap;

export function moveRects(rects: RectMap, delta: Vec, snapper?: Snapper, opts = { altKey: false }): RectMap {
  const out: RectMap = {};
  for (const [id, r] of Object.entries(rects)) out[id] = { ...r, cx: r.cx + delta.x, cy: r.cy + delta.y };
  return snapper ? snapper(out, opts) : out;
}

/** Dreht alle Rechtecke um `pivot`: Mittelpunkte wandern mit, jede Drehung wächst um `delta`. */
export function rotateRects(rects: RectMap, pivot: Vec, delta: number): RectMap {
  const out: RectMap = {};
  for (const [id, r] of Object.entries(rects)) {
    const c = rotateAround({ x: r.cx, y: r.cy }, pivot, delta);
    out[id] = { ...r, cx: c.x, cy: c.y, rot: normAngle(r.rot + delta) };
  }
  return out;
}

/** Mitte des Hüllrechtecks (bei einem einzelnen Objekt dessen Mittelpunkt). */
export function groupCenter(rects: readonly Rect[]): Vec | null {
  if (rects.length === 1) return { x: rects[0]!.cx, y: rects[0]!.cy };
  const b = boundsOfRects(rects);
  return b ? { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 } : null;
}

/** Winkel von `from` nach `to` in Grad (Bildschirm: im Uhrzeigersinn, 0° = rechts). */
export const angleTo = (from: Vec, to: Vec) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

/** Rastet einen Winkel auf Vielfache von `step` ein. */
export const snapAngle = (deg: number, step: number) => Math.round(deg / step) * step;
