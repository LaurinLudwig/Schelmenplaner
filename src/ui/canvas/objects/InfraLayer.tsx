import { memo } from 'react';
import { fmt } from '../../../core/format';
import { rectCorners } from '../../../core/geometry/rect';
import { lineEnds, PASSAGE_TYPE_ID } from '../../../core/infra';
import type { Id, InfraObject, InfraTypeDef } from '../../../core/model/types';
import { WorldIcon } from '../../icons/infraIcons';

/**
 * Infrastruktur-Objekte in Weltkoordinaten (M7, spec.md §11). Wie ObjectsLayer ohne Ansicht als Prop:
 * Linienstärken auf dem Bildschirm kommen über `vector-effect: non-scaling-stroke` (CSS).
 *
 * - Rechteck: in Typfarbe getönt, mit Rand und Symbol in der Mitte.
 * - Linie: Typfarbe in ihrer Stärke, dazu eine Haarlinie (mindestens 2 px); mobile Sperre gestrichelt.
 * - Enge Durchfahrt: Maßlinie mit Endstrichen; die lichte Breite steht in der Beschriftung.
 * - Punkt (Marker): Symbol mit der Spitze auf dem Punkt.
 */
interface Props {
  infra: InfraObject[];
  types: ReadonlyMap<Id, InfraTypeDef>;
  selected: ReadonlySet<Id>;
  fontSize: number;
  markerSize: number;
  /** Objekte mit aktiver Warnung („Durchfahrt zu eng“). */
  warn: ReadonlySet<Id>;
}

export const InfraList = memo(function InfraList({ infra, types, selected, fontSize, markerSize, warn }: Props) {
  return infra.map((o) => {
    const t = types.get(o.typeId);
    return t ? <InfraShape key={o.id} obj={o} type={t} selected={selected.has(o.id)} fontSize={fontSize} markerSize={markerSize} warn={warn.has(o.id)} /> : null;
  });
});

const pts = (o: InfraObject) =>
  rectCorners(o)
    .map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)
    .join(' ');

const InfraShape = memo(function InfraShape({ obj: o, type: t, selected, fontSize, markerSize, warn }: { obj: InfraObject; type: InfraTypeDef; selected: boolean; fontSize: number; markerSize: number; warn: boolean }) {
  const cls = `infra infra-${t.geometry}${selected ? ' selected' : ''}${warn ? ' warn-narrow' : ''}`;
  if (t.geometry === 'point') {
    return (
      <g className={cls} data-id={o.id} data-type={t.id} style={{ color: t.color }}>
        <WorldIcon className="infra-icon" name={t.icon} c={{ x: o.cx, y: o.cy - markerSize / 2 }} size={markerSize} />
      </g>
    );
  }
  if (t.geometry === 'rect') {
    const icon = Math.min(Math.min(o.w, o.d) * 0.7, fontSize * 3);
    return (
      <g className={cls} data-id={o.id} data-type={t.id} style={{ color: t.color }}>
        <polygon className="infra-body" points={pts(o)} />
        <WorldIcon className="infra-icon" name={t.icon} c={{ x: o.cx, y: o.cy }} size={icon} />
      </g>
    );
  }
  const [a, b] = lineEnds(o);
  const dashed = t.id === 'barrierMobile';
  if (t.id === PASSAGE_TYPE_ID || o.d <= 0) {
    // Maßlinie: Endstriche senkrecht zur Linie
    const ux = (b.x - a.x) / (o.w || 1);
    const uy = (b.y - a.y) / (o.w || 1);
    const k = fontSize * 0.8;
    const tick = (p: { x: number; y: number }) => `M${p.x - uy * k} ${p.y + ux * k}L${p.x + uy * k} ${p.y - ux * k}`;
    return (
      <g className={cls} data-id={o.id} data-type={t.id} style={{ color: t.color }}>
        <line className="infra-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        <path className="infra-dim" d={`M${a.x} ${a.y}L${b.x} ${b.y}${tick(a)}${tick(b)}`} />
      </g>
    );
  }
  return (
    <g className={cls} data-id={o.id} data-type={t.id} style={{ color: t.color }}>
      <line className={`infra-stroke${dashed ? ' dashed' : ''}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={o.d} strokeDasharray={dashed ? `${o.d * 3} ${o.d * 2}` : undefined} />
      <line className={`infra-hair${dashed ? ' dashed' : ''}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
    </g>
  );
});

/** Zentimeter wie in ObjectsLayer (WebKit setzt sehr kleine Schriftgrößen ungenau). */
const CM = 100;
const BASELINE = 0.35;

/** Text eines Objekts: Bezeichnung; bei der Durchfahrt zusätzlich die lichte Breite. */
export function infraLabelText(o: InfraObject, t: InfraTypeDef): string {
  if (t.id === PASSAGE_TYPE_ID) return o.label ? `${o.label} · ${fmt(o.w)} m` : `${fmt(o.w)} m`;
  return o.label;
}

/**
 * Beschriftung der Infrastruktur (Ebene „Beschriftung“, Gruppe in Zentimetern): horizontal; Rechtecke unter dem
 * Symbol, Linien über der Mitte, Marker rechts neben dem Symbol.
 */
export const InfraLabelList = memo(function InfraLabelList({ infra, types, fontSize, markerSize }: { infra: InfraObject[]; types: ReadonlyMap<Id, InfraTypeDef>; fontSize: number; markerSize: number }) {
  return infra.map((o) => {
    const t = types.get(o.typeId);
    const text = t ? infraLabelText(o, t) : '';
    if (!t || !text) return null;
    let x = o.cx;
    let y = o.cy;
    let anchor: 'middle' | 'start' = 'middle';
    if (t.geometry === 'point') {
      x = o.cx + markerSize * 0.45;
      y = o.cy - markerSize * 0.55;
      anchor = 'start';
    } else if (t.geometry === 'rect') {
      y = o.cy + Math.min(Math.min(o.w, o.d) * 0.35, fontSize * 1.5) + fontSize * 0.7;
    } else {
      y = o.cy - fontSize * 0.9 - o.d / 2;
    }
    return (
      <text key={o.id} className="infra-label" data-id={o.id} textAnchor={anchor} x={x * CM} y={(y + BASELINE * fontSize) * CM}>
        {text}
      </text>
    );
  });
});
