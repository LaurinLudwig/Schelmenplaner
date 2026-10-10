import { memo, useMemo } from 'react';
import { fromLocal, rectCorners } from '../../../core/geometry/rect';
import { approxTextWidth, areaLabel, formatLabel } from '../../../core/label';
import type { Area, Category, FestplatzPage, Id, Stand } from '../../../core/model/types';
import { DEFAULT_STAND_COLOR } from '../../../core/objects';

/**
 * Grundflächen, Geschäfte und Beschriftung in Weltkoordinaten (Meter).
 *
 * Leistung (Abnahme: 500 Stände, ≥ 50 Bilder/s): Die Ebene bekommt die Ansicht NICHT als Prop.
 * Zoomen und Verschieben ändern nur das transform der umgebenden Gruppe; hier wird dann nichts neu
 * gerendert. Jedes Objekt ist memo; Immer teilt unveränderte Objekte, also rendern beim Ziehen nur
 * die bewegten neu.
 *
 * Reihenfolge der Ebenen: Grundflächen → Freiflächen (M4) → Geschäfte → Infrastruktur (M7) →
 * Warnsymbole (M4) → Beschriftung (oberste Ebene).
 */
interface Props {
  page: FestplatzPage;
  categories: Category[];
  template: string;
  /** Schriftgröße der Beschriftung in Metern. */
  fontSize: number;
  selected: ReadonlySet<Id>;
  /** Beschriftung ist auf dem Bildschirm kleiner als lesbar: per CSS ausblenden, ohne neu zu rendern. */
  labelsTiny: boolean;
  /**
   * Heller Rand um die Schrift (bessere Lesbarkeit auf dunklem Grund). Teuer zu zeichnen (WebKit:
   * 500 Beschriftungen mit Rand ≈ 33 statt 60 Bilder/s), deshalb erst ab lesbarer Größe, wenn ohnehin
   * nur ein Ausschnitt des Plans im Bild ist.
   */
  labelHalo: boolean;
}

/**
 * Die Beschriftung rechnet in Zentimetern (Gruppe scale(0.01)). So bleiben die Schriftgrößen im
 * SVG zweistellig; sehr kleine font-size-Werte unter großem Skalierungsfaktor werden in WebKit
 * sonst ungenau gesetzt.
 */
const CM = 100;
const LINE = 1.2;
/** Versatz der Grundlinie, damit eine Zeile optisch auf ihrer Mittellinie sitzt (statt dominant-baseline, das WebKit an tspan ignoriert). */
const BASELINE = 0.35;

const pts = (r: Area | Stand) =>
  rectCorners(r)
    .map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)
    .join(' ');

export const standColor = (s: Stand, cat: Category | undefined) => s.color ?? cat?.color ?? DEFAULT_STAND_COLOR;

export const ObjectsLayer = memo(function ObjectsLayer({ page, categories, template, fontSize, selected, labelsTiny, labelHalo }: Props) {
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const L = page.layers;
  return (
    <>
      {L.areas.visible && (
        <g className={`layer-areas${L.areas.locked ? ' locked' : ''}`}>
          {page.areas.map((a) => (
            <AreaShape key={a.id} area={a} selected={selected.has(a.id)} />
          ))}
        </g>
      )}
      <g className="layer-free" />
      {L.stands.visible && (
        <g className={`layer-stands${L.stands.locked ? ' locked' : ''}`}>
          {page.stands.map((s) => {
            const cat = s.categoryId ? catById.get(s.categoryId) : undefined;
            return <StandShape key={s.id} stand={s} color={standColor(s, cat)} selected={selected.has(s.id)} />;
          })}
        </g>
      )}
      <g className="layer-warnings" />
      {L.labels.visible && (
        <g className={`layer-labels${labelsTiny ? ' tiny' : ''}${labelHalo ? ' halo' : ''}`} transform={`scale(${1 / CM})`} fontSize={fontSize * CM} strokeWidth={fontSize * CM * 0.22}>
          {L.areas.visible && page.areas.map((a) => <AreaLabel key={a.id} area={a} fontSize={fontSize} />)}
          {L.stands.visible &&
            page.stands.map((s) => (
              <StandLabel key={s.id} stand={s} template={template} fontSize={fontSize} categoryName={(s.categoryId && catById.get(s.categoryId)?.name) || ''} />
            ))}
        </g>
      )}
    </>
  );
});

const AreaShape = memo(function AreaShape({ area, selected }: { area: Area; selected: boolean }) {
  const c = rectCorners(area);
  return (
    <g className={`area${selected ? ' selected' : ''}`} data-id={area.id}>
      <polygon className="area-body" points={pts(area)} />
      {/* Vorderseite = Kante 2 (Ecke 2 → Ecke 3) */}
      <line className="area-front" x1={c[2]!.x} y1={c[2]!.y} x2={c[3]!.x} y2={c[3]!.y} />
    </g>
  );
});

const StandShape = memo(function StandShape({ stand, color, selected }: { stand: Stand; color: string; selected: boolean }) {
  return <polygon className={`stand${selected ? ' selected' : ''}`} data-id={stand.id} points={pts(stand)} fill={color} />;
});

/** Standbeschriftung: horizontal, mittig, feste Schriftgröße; darf über den Stand hinausragen. */
const StandLabel = memo(function StandLabel({ stand, template, fontSize, categoryName }: { stand: Stand; template: string; fontSize: number; categoryName: string }) {
  const lines = formatLabel(template, stand, categoryName);
  if (!lines.length) return null;
  const x = stand.cx * CM;
  const top = stand.cy - ((lines.length - 1) * LINE * fontSize) / 2 + BASELINE * fontSize;
  return (
    <text className="stand-label" data-id={stand.id} textAnchor="middle">
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={(top + i * LINE * fontSize) * CM}>
          {line}
        </tspan>
      ))}
    </text>
  );
});

/**
 * Grundflächen-Beschriftung: horizontal, außerhalb der Fläche vor der Mitte der Vorderseite.
 * Der Textblock wird entlang der Außennormalen so weit hinausgeschoben, dass er die Fläche nicht berührt.
 */
const AreaLabel = memo(function AreaLabel({ area, fontSize }: { area: Area; fontSize: number }) {
  const text = areaLabel(area);
  const mid = fromLocal(area, { x: 0, y: area.d / 2 });
  const rad = (area.rot * Math.PI) / 180;
  const n = { x: -Math.sin(rad), y: Math.cos(rad) };
  const hw = approxTextWidth(text, fontSize) / 2;
  const hh = (LINE * fontSize) / 2;
  const reach = Math.abs(n.x) * hw + Math.abs(n.y) * hh + 0.35 * fontSize;
  const c = { x: mid.x + n.x * reach, y: mid.y + n.y * reach };
  return (
    <text className="area-label" data-id={area.id} textAnchor="middle" x={c.x * CM} y={(c.y + BASELINE * fontSize) * CM}>
      {text}
    </text>
  );
});
