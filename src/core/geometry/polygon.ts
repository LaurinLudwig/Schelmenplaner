/**
 * Konvexe Polygone (M4): Fläche, Zuschneiden, Abziehen, Eindringtiefe.
 * `polygonArea`, `clipConvex` (Sutherland–Hodgman) und der SAT-Test stammen aus
 * prototype/freiflaechen.html (Geo-Modul: polygonArea, clipPolygon, rectsOverlap).
 * Alle Funktionen arbeiten für beide Umlaufrichtungen.
 */
import type { Rect, Vec } from '../model/types';
import type { Bounds } from '../viewport';
import { rectCorners } from './rect';
import { add, cross, dot, mul, normalize, sub, vec } from './vec';

export type Polygon = Vec[];

/** Vorzeichenbehaftete Fläche (Shoelace). Betrag = Fläche in m². */
export function polygonArea(poly: readonly Vec[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) a += cross(poly[i]!, poly[(i + 1) % poly.length]!);
  return a / 2;
}

/** Schnittpunkt der Strecke p1→p2 mit der Geraden durch a und b. */
function lineIntersect(p1: Vec, p2: Vec, a: Vec, b: Vec): Vec {
  const r = sub(p2, p1);
  const s = sub(b, a);
  const den = cross(r, s);
  if (Math.abs(den) < 1e-12) return p1;
  return add(p1, mul(r, cross(sub(a, p1), s) / den));
}

/** Schneidet `poly` mit der Halbebene links (orient > 0) bzw. rechts der Geraden a→b. */
function clipHalfPlane(poly: readonly Vec[], a: Vec, b: Vec, orient: number, keepInside: boolean): Polygon {
  const e = sub(b, a);
  const inside = (p: Vec) => {
    const c = orient * cross(e, sub(p, a));
    return keepInside ? c >= -1e-12 : c <= 1e-12;
  };
  const out: Polygon = [];
  for (let j = 0; j < poly.length; j++) {
    const cur = poly[j]!;
    const prev = poly[(j + poly.length - 1) % poly.length]!;
    const cIn = inside(cur);
    const pIn = inside(prev);
    if (cIn) {
      if (!pIn) out.push(lineIntersect(prev, cur, a, b));
      out.push(cur);
    } else if (pIn) {
      out.push(lineIntersect(prev, cur, a, b));
    }
  }
  return out;
}

const orientation = (poly: readonly Vec[]) => Math.sign(polygonArea(poly)) || 1;

/** Teil von `subject`, der im KONVEXEN Polygon `clip` liegt (evtl. leer). */
export function clipConvex(subject: readonly Vec[], clip: readonly Vec[]): Polygon {
  const orient = orientation(clip);
  let out: Polygon = subject.slice();
  for (let i = 0; i < clip.length && out.length; i++) out = clipHalfPlane(out, clip[i]!, clip[(i + 1) % clip.length]!, orient, true);
  return out.length >= 3 ? out : [];
}

/**
 * Konvexes `p` minus konvexes `c`: höchstens so viele konvexe, sich nicht überschneidende Stücke wie
 * `c` Kanten hat. Stück i = Rest von p, der innerhalb der Kanten 0…i-1 und außerhalb von Kante i liegt.
 * Stücke dünner als `minThickness` (Rechenrauschen an gemeinsamen Kanten) entfallen.
 */
export function subtractConvex(p: readonly Vec[], c: readonly Vec[], minThickness = 1e-6): Polygon[] {
  const orient = orientation(c);
  const pieces: Polygon[] = [];
  let rest: Polygon = p.slice();
  for (let i = 0; i < c.length && rest.length >= 3; i++) {
    const a = c[i]!;
    const b = c[(i + 1) % c.length]!;
    const outside = clipHalfPlane(rest, a, b, orient, false);
    if (outside.length >= 3 && thickness(outside) > minThickness) pieces.push(outside);
    rest = clipHalfPlane(rest, a, b, orient, true);
  }
  return pieces;
}

/** Zieht alle konvexen Polygone `cutters` von den Stücken ab. */
export function subtractAll(pieces: readonly Polygon[], cutters: readonly (readonly Vec[])[], minThickness = 1e-6): Polygon[] {
  let out = pieces.slice();
  for (const c of cutters) {
    if (!out.length) break;
    out = out.flatMap((piece) => subtractConvex(piece, c, minThickness));
  }
  return out;
}

/** Projektion aller Punkte auf die Richtung `axis` (Einheitsvektor), relativ zu `origin`. */
export function projectOn(poly: readonly Vec[], origin: Vec, axis: Vec): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const p of poly) {
    const s = dot(sub(p, origin), axis);
    if (s < min) min = s;
    if (s > max) max = s;
  }
  return [min, max];
}

/**
 * Eindringtiefe zweier konvexer Polygone (Separating-Axis-Test): kleinste Überdeckung über alle
 * Kantennormalen. ≤ 0 heißt getrennt oder berührend.
 */
export function penetration(pa: readonly Vec[], pb: readonly Vec[]): number {
  let best = Infinity;
  for (const poly of [pa, pb]) {
    for (let i = 0; i < poly.length; i++) {
      const e = sub(poly[(i + 1) % poly.length]!, poly[i]!);
      if (e.x === 0 && e.y === 0) continue;
      const n = normalize(vec(-e.y, e.x));
      const [minA, maxA] = projectOn(pa, vec(0, 0), n);
      const [minB, maxB] = projectOn(pb, vec(0, 0), n);
      const o = Math.min(maxA, maxB) - Math.max(minA, minB);
      if (o < best) best = o;
      if (best <= 0) return best;
    }
  }
  return best;
}

/** Kleinste Ausdehnung eines konvexen Polygons (Breite über alle Kantennormalen). */
export function thickness(poly: readonly Vec[]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const e = sub(poly[(i + 1) % poly.length]!, poly[i]!);
    if (Math.hypot(e.x, e.y) < 1e-12) continue;
    const n = normalize(vec(-e.y, e.x));
    const [min, max] = projectOn(poly, vec(0, 0), n);
    best = Math.min(best, max - min);
  }
  return best === Infinity ? 0 : best;
}

/** Rechteck um `by` Meter an jeder Seite verkleinert (nie negativ). */
export const insetRect = <T extends Rect>(r: T, by: number): T => ({ ...r, w: Math.max(0, r.w - 2 * by), d: Math.max(0, r.d - 2 * by) });

/** Achsenparalleles Hüllrechteck eines Polygons. */
export function polyBounds(poly: readonly Vec[]): Bounds {
  const b: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const p of poly) {
    if (p.x < b.minX) b.minX = p.x;
    if (p.y < b.minY) b.minY = p.y;
    if (p.x > b.maxX) b.maxX = p.x;
    if (p.y > b.maxY) b.maxY = p.y;
  }
  return b;
}

/** Schneiden sich zwei Hüllrechtecke (mit Rand `pad`)? */
export const boundsTouch = (a: Bounds, b: Bounds, pad = 0) => a.minX <= b.maxX + pad && b.minX <= a.maxX + pad && a.minY <= b.maxY + pad && b.minY <= a.maxY + pad;

/** Schwerpunkt eines Polygons (bei Fläche 0 der Mittelwert der Punkte). */
export function centroid(poly: readonly Vec[]): Vec {
  const a = polygonArea(poly);
  if (Math.abs(a) < 1e-12) {
    const s = poly.reduce((m, p) => add(m, p), vec(0, 0));
    return mul(s, 1 / (poly.length || 1));
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const f = cross(p, q);
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  return vec(cx / (6 * a), cy / (6 * a));
}

/** Hüllrechteck und Ecken eines gedrehten Rechtecks, je Objekt zwischengespeichert (Objekte sind unveränderlich). */
const geoCache = new WeakMap<Rect, { poly: Polygon; bounds: Bounds }>();
export function rectGeo(r: Rect): { poly: Polygon; bounds: Bounds } {
  let g = geoCache.get(r);
  if (!g) {
    const poly = rectCorners(r);
    g = { poly, bounds: polyBounds(poly) };
    geoCache.set(r, g);
  }
  return g;
}

/**
 * Schraffur eines konvexen Polygons: Strecken unter 45° (Richtung (1, −1) auf dem Bildschirm) im
 * senkrechten Abstand `spacing`, an festen Weltlinien ausgerichtet (x + y = k · spacing · √2), damit
 * benachbarte Flächen nahtlos aussehen. Als SVG-Pfad „M x y L x y …“.
 */
export function hatchPath(poly: readonly Vec[], spacing: number): string {
  if (poly.length < 3 || !(spacing > 0)) return '';
  const step = spacing * Math.SQRT2;
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of poly) {
    lo = Math.min(lo, p.x + p.y);
    hi = Math.max(hi, p.x + p.y);
  }
  let d = '';
  for (let k = Math.ceil(lo / step); k * step <= hi; k++) {
    const c = k * step;
    // Schnitt der Geraden x + y = c mit den Kanten
    const hits: Vec[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]!;
      const b = poly[(i + 1) % poly.length]!;
      const fa = a.x + a.y - c;
      const fb = b.x + b.y - c;
      if ((fa <= 0 && fb > 0) || (fa > 0 && fb <= 0)) {
        const t = fa / (fa - fb);
        hits.push(vec(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
      }
    }
    if (hits.length >= 2) {
      const [p, q] = hits as [Vec, Vec];
      // Ecken, die die Linie nur berühren, ergeben keine Strecke
      if (Math.abs(p.x - q.x) + Math.abs(p.y - q.y) < 1e-9) continue;
      d += `M${p.x.toFixed(3)} ${p.y.toFixed(3)}L${q.x.toFixed(3)} ${q.y.toFixed(3)}`;
    }
  }
  return d;
}
