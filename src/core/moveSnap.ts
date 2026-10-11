/**
 * Fang beim Verschieben (M4, spec.md §3). Reine Funktion: bekommt die Ausgangsrechtecke der
 * Auswahl, die Mausbewegung und die übrigen Objekte und liefert die eingerasteten Rechtecke sowie
 * die Hilfslinien.
 *
 * Priorität: Vorderkante > Nachbarstände > Raster.
 * - Vorderkante (nur Stände): Die Vorderseite des Stands legt sich an die Vorderseite der Grundfläche
 *   und er übernimmt deren Drehung; danach gleitet er entlang (Hysterese: einrasten bei `tol`, lösen
 *   erst bei `release`). Entlang der Vorderseite fängt er an den Achsenenden und an Nachbarständen.
 *   Grundlage ist `snapToFront` aus prototype/freiflaechen.html.
 * - Nachbarstände: bündig anliegen oder fluchten, nur mit parallel stehenden Nachbarn.
 * - Raster: Rand oder Mitte des Hüllrechtecks der Auswahl je Achse an der nächsten Rasterlinie.
 * Bei Mehrfachauswahl gilt der Fang für das gegriffene Objekt; die Gruppe wird nur parallel verschoben.
 */
import { occupiedInterval } from './freeSpace';
import { boundsTouch, polyBounds, projectOn, rectGeo } from './geometry/polygon';
import { frameAngle, fromFrame, frontFrame, normAngle, rectCorners, toFrame } from './geometry/rect';
import { add, mul, rotate, vec } from './geometry/vec';
import type { Area, Id, Rect, Vec } from './model/types';
import { constrainDelta, moveRects, type RectMap } from './transform';

export interface SnapOptions {
  front: boolean;
  neighbors: boolean;
  /** Rasterweite, wenn der Raster-Fang greift (Umschalter an und Raster eingeblendet), sonst null. */
  grid: number | null;
}

/** Zustand zwischen zwei Mausbewegungen (Hysterese der Vorderkante). */
export interface SnapState {
  frontAreaId: Id | null;
}

export type Guide =
  | { kind: 'front'; a: Vec; b: Vec; label: string }
  | { kind: 'contact' | 'align' | 'end'; a: Vec; b: Vec };

export interface MoveSnapInput {
  rects0: RectMap;
  delta: Vec;
  /** Das gegriffene Objekt. */
  grabbed: Id | null;
  /** Welche der bewegten Objekte Stände sind. */
  standIds: ReadonlySet<Id>;
  /** Übrige (nicht bewegte) Grundflächen und Stände. */
  areas: readonly Area[];
  stands: readonly (Rect & { id: Id })[];
  options: SnapOptions;
  /** Fangabstand und Lösen-Abstand in Metern (Bildschirm-Pixel / Zoom). */
  tol: number;
  release: number;
  state: SnapState;
  shift: boolean;
}

export interface MoveSnapResult {
  rects: RectMap;
  state: SnapState;
  guides: Guide[];
}

const NO_SNAP: SnapState = { frontAreaId: null };
const ANGLE_EPS = 0.1;

/** Abweichung zweier Winkel modulo `period` (0 … period/2). */
const angleDiff = (a: number, b: number, period: number) => {
  const d = (((a - b) % period) + period) % period;
  return Math.min(d, period - d);
};

const translate = (rects: RectMap, off: Vec): RectMap => (off.x || off.y ? moveRects(rects, off) : rects);

export function computeMoveSnap(input: MoveSnapInput): MoveSnapResult {
  const { rects0, grabbed, options, state } = input;
  const keepFront = input.shift && state.frontAreaId !== null;
  const delta = input.shift && !keepFront ? constrainDelta(input.delta) : input.delta;
  const moved = moveRects(rects0, delta);
  const g = grabbed ? moved[grabbed] : undefined;
  if (!g || !grabbed) return { rects: moved, state: NO_SNAP, guides: [] };
  const isStand = input.standIds.has(grabbed);
  const multi = Object.keys(rects0).length > 1;

  // 1. Vorderkante
  if (options.front && isStand) {
    const fs = frontSnap(input, g, multi, keepFront);
    if (fs) {
      const rects = multi ? translate(moved, { x: fs.rect.cx - g.cx, y: fs.rect.cy - g.cy }) : { ...moved, [grabbed]: fs.rect };
      return { rects, state: { frontAreaId: fs.areaId }, guides: fs.guides };
    }
  }

  // 2. Nachbarstände, 3. Raster (je Achse, höhere Priorität zuerst)
  const guides: Guide[] = [];
  let off = vec(0, 0);
  let fixedX = false;
  let fixedY = false;
  if (options.neighbors && isStand) {
    const ns = neighborSnap(input, g);
    if (ns) {
      off = ns.offset;
      guides.push(...ns.guides);
      const aligned = angleDiff(g.rot, 0, 90) < ANGLE_EPS;
      // Bei schräg stehenden Ständen legen ihre Achsen beide Weltrichtungen fest
      fixedX = aligned ? ns.fixedX : true;
      fixedY = aligned ? ns.fixedY : true;
    }
  }
  if (options.grid && options.grid > 0 && (!fixedX || !fixedY)) {
    const all = Object.values(translate(moved, off)).flatMap((r) => rectCorners(r));
    const b = polyBounds(all);
    const step = options.grid;
    const best = (vals: number[]) => {
      let out: number | null = null;
      for (const v of vals) {
        const d = Math.round(v / step) * step - v;
        if (Math.abs(d) <= input.tol && (out === null || Math.abs(d) < Math.abs(out))) out = d;
      }
      return out;
    };
    const dx = fixedX ? null : best([b.minX, (b.minX + b.maxX) / 2, b.maxX]);
    const dy = fixedY ? null : best([b.minY, (b.minY + b.maxY) / 2, b.maxY]);
    off = add(off, vec(dx ?? 0, dy ?? 0));
  }
  return { rects: translate(moved, off), state: NO_SNAP, guides };
}

function frontSnap(input: MoveSnapInput, g: Rect, multi: boolean, keepFront: boolean): { rect: Rect; areaId: Id; guides: Guide[] } | null {
  const { areas, state, tol, release } = input;
  const center = vec(g.cx, g.cy);
  let best: { area: Area; s: number; score: number } | null = null;
  for (const area of areas) {
    const f = frontFrame(area);
    // Eine Gruppe wird nicht gedreht: nur einrasten, wenn der Stand schon parallel steht
    if (multi && angleDiff(g.rot, frameAngle(f), 360) > ANGLE_EPS) continue;
    const { s, t } = toFrame(f, center);
    const dist = Math.abs(t - g.d / 2);
    const current = state.frontAreaId === area.id;
    const forced = keepFront && current;
    if (!forced) {
      if (dist > (current ? release : tol)) continue;
      if (s + g.w / 2 <= 0 || s - g.w / 2 >= f.length) continue;
    }
    // Die bisherige Grundfläche behalten, solange sie greift (sonst springt der Stand an Ecken hin und her)
    const score = current ? -1 : dist;
    if (!best || score < best.score) best = { area, s, score };
  }
  if (!best) return null;
  const { area } = best;
  const f = frontFrame(area);
  let s = best.s;
  const guides: Guide[] = [{ kind: 'front', a: f.origin, b: fromFrame(f, f.length, 0), label: area.name.trim() || 'Grundfläche' }];

  // Entlang der Vorderseite: Achsenenden und (mit Nachbar-Fang) Kanten der Nachbarn
  const edges: { e: number; kind: 'end' | 'contact' }[] = [
    { e: 0, kind: 'end' },
    { e: f.length, kind: 'end' },
  ];
  if (input.options.neighbors) {
    const ab = rectGeo(area).bounds;
    for (const st of input.stands) {
      if (!boundsTouch(ab, rectGeo(st).bounds)) continue;
      const iv = occupiedInterval(area, f, st);
      if (iv) edges.push({ e: iv[0], kind: 'contact' }, { e: iv[1], kind: 'contact' });
    }
  }
  let shift: { ds: number; e: number; kind: 'end' | 'contact' } | null = null;
  for (const { e, kind } of edges) {
    for (const side of [-1, 1]) {
      const ds = e - (s + (side * g.w) / 2);
      if (Math.abs(ds) <= tol && (!shift || Math.abs(ds) < Math.abs(shift.ds))) shift = { ds, e, kind };
    }
  }
  if (shift) {
    s += shift.ds;
    guides.push({ kind: shift.kind, a: fromFrame(f, shift.e, 0), b: fromFrame(f, shift.e, Math.max(g.d, Math.min(f.depth, g.d * 1.5))) });
  }
  const c = fromFrame(f, s, g.d / 2);
  return { rect: { ...g, cx: c.x, cy: c.y, rot: multi ? g.rot : normAngle(frameAngle(f)) }, areaId: area.id, guides };
}

interface AxisHit {
  off: number;
  kind: 'contact' | 'align';
  /** Lage der Linie auf der Achse und Ausdehnung quer dazu (nach dem Einrasten). */
  at: number;
  span: [number, number];
  other: [number, number];
}

function neighborSnap(input: MoveSnapInput, g: Rect): { offset: Vec; guides: Guide[]; fixedX: boolean; fixedY: boolean } | null {
  const { tol } = input;
  const A = rotate(vec(1, 0), g.rot);
  const B = rotate(vec(0, 1), g.rot);
  const O = vec(0, 0);
  const gp = rectCorners(g);
  const gb = polyBounds(gp);
  const [ga0, ga1] = projectOn(gp, O, A);
  const [gb0, gb1] = projectOn(gp, O, B);
  let hitA: AxisHit | null = null;
  let hitB: AxisHit | null = null;
  const better = (h: AxisHit | null, c: AxisHit) => !h || Math.abs(c.off) < Math.abs(h.off) - 1e-9 || (Math.abs(c.off) <= Math.abs(h.off) + 1e-9 && c.kind === 'contact' && h.kind === 'align');
  for (const n of input.stands) {
    const ng = rectGeo(n);
    if (!boundsTouch(gb, ng.bounds, tol * 6)) continue;
    if (angleDiff(g.rot, n.rot, 90) > ANGLE_EPS) continue;
    const [na0, na1] = projectOn(ng.poly, O, A);
    const [nb0, nb1] = projectOn(ng.poly, O, B);
    const overlapA = Math.min(ga1, na1) - Math.max(ga0, na0);
    const overlapB = Math.min(gb1, nb1) - Math.max(gb0, nb0);
    const axis = (g0: number, g1: number, n0: number, n1: number, crossOverlap: number, cross: [number, number], ncross: [number, number]): AxisHit[] => {
      const out: AxisHit[] = [];
      const push = (off: number, kind: 'contact' | 'align', at: number) => {
        if (Math.abs(off) <= tol) out.push({ off, kind, at, span: cross, other: ncross });
      };
      // Anliegen nur, wenn sich die beiden quer dazu überdecken (sonst wäre es keine gemeinsame Kante)
      if (crossOverlap > -tol) {
        push(n1 - g0, 'contact', n1);
        push(n0 - g1, 'contact', n0);
      }
      push(n0 - g0, 'align', n0);
      push(n1 - g1, 'align', n1);
      return out;
    };
    for (const c of axis(ga0, ga1, na0, na1, overlapB, [gb0, gb1], [nb0, nb1])) if (better(hitA, c)) hitA = c;
    for (const c of axis(gb0, gb1, nb0, nb1, overlapA, [ga0, ga1], [na0, na1])) if (better(hitB, c)) hitB = c;
  }
  if (!hitA && !hitB) return null;
  const offA = hitA?.off ?? 0;
  const offB = hitB?.off ?? 0;
  const guides: Guide[] = [];
  const line = (h: AxisHit, dir: Vec, crossDir: Vec, crossShift: number): Guide => {
    const lo = Math.min(h.span[0] + crossShift, h.other[0]);
    const hi = Math.max(h.span[1] + crossShift, h.other[1]);
    return { kind: h.kind, a: add(mul(dir, h.at), mul(crossDir, lo)), b: add(mul(dir, h.at), mul(crossDir, hi)) };
  };
  if (hitA) guides.push(line(hitA, A, B, offB));
  if (hitB) guides.push(line(hitB, B, A, offA));
  // Welche Weltachse ist festgelegt? (nur aussagekräftig, wenn der Stand achsenparallel steht)
  const aIsX = Math.abs(A.x) > 0.5;
  return {
    offset: add(mul(A, offA), mul(B, offB)),
    guides,
    fixedX: aIsX ? !!hitA : !!hitB,
    fixedY: aIsX ? !!hitB : !!hitA,
  };
}
