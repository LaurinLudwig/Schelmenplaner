import { memo, useMemo } from 'react';
import { hatchPath } from '../../../core/geometry/polygon';
import { fromLocal, rectCorners } from '../../../core/geometry/rect';
import type { AreaFreeSpaces } from '../../../core/freeSpace';
import { approxTextWidth, areaLabel, formatLabel, freeSpaceLabel } from '../../../core/label';
import type { Area, Category, FestplatzPage, Id, ProjectSettings, Stand, Vec } from '../../../core/model/types';
import { DEFAULT_STAND_COLOR } from '../../../core/objects';
import type { Bounds } from '../../../core/viewport';
import { activeWarnings, type PageWarnings } from '../../../core/warnings';

/**
 * Grundflächen, Geschäfte und Beschriftung in Weltkoordinaten (Meter).
 *
 * Leistung (Abnahme: 500 Stände, ≥ 50 Bilder/s): Die Ebene bekommt die Ansicht NICHT als Prop.
 * Zoomen und Verschieben ändern nur das transform der umgebenden Gruppe; hier wird dann nichts neu
 * gerendert. Jedes Objekt ist memo; Immer teilt unveränderte Objekte, also rendern beim Ziehen nur
 * die bewegten neu.
 *
 * Reihenfolge der Ebenen: Grundflächen → Freiflächen → Geschäfte → Infrastruktur (M7) →
 * Warnsymbole → Beschriftung (oberste Ebene).
 *
 * Freiflächen (M4) kommen aus einem Zwischenspeicher (core/freeSpace.ts): Das Ergebnis einer
 * Grundfläche behält seine Identität, solange sie nicht neu berechnet wurde; die memo-Komponenten
 * je Grundfläche zeichnen dann nicht neu.
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
  free: readonly AreaFreeSpaces[];
  /** Linienabstand der Schraffur in Metern. */
  hatchSpacing: number;
  /** Freiflächen-Beschriftung zu klein zum Lesen: ausblenden (siehe Canvas.tsx). */
  freeLabelsTiny: boolean;
  /** Nur Freiflächen-Beschriftungen in diesem Bereich zeichnen (siehe Canvas.tsx `labelWindow`). */
  freeLabelWindow: Bounds;
  warnings: PageWarnings;
  warnSettings: Pick<ProjectSettings, 'warnOutside' | 'warnOverlap'>;
}

type WarnKind = 'outside' | 'overlap' | null;

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

export const ObjectsLayer = memo(function ObjectsLayer({ page, categories, template, fontSize, selected, labelsTiny, labelHalo, free, hatchSpacing, freeLabelsTiny, freeLabelWindow, warnings, warnSettings }: Props) {
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const L = page.layers;
  const warnOf = (s: Stand): WarnKind => {
    const a = activeWarnings(warnings.byStand.get(s.id), s, warnSettings);
    return a.overlap ? 'overlap' : a.outside ? 'outside' : null;
  };
  const shownWarnings = L.stands.visible ? page.stands.map((s) => ({ s, kind: warnOf(s) })).filter((x) => x.kind) : [];
  const overlapShown = new Set(shownWarnings.filter((x) => x.kind === 'overlap').map((x) => x.s.id));
  const freeVisible = L.free.visible && L.areas.visible;
  return (
    <>
      {L.areas.visible && (
        <g className={`layer-areas${L.areas.locked ? ' locked' : ''}`}>
          {page.areas.map((a) => (
            <AreaShape key={a.id} area={a} selected={selected.has(a.id)} />
          ))}
        </g>
      )}
      {freeVisible && (
        <g className="layer-free">
          {free.map((r) => (
            <FreeArea key={r.areaId} result={r} spacing={hatchSpacing} />
          ))}
        </g>
      )}
      {L.stands.visible && (
        <g className={`layer-stands${L.stands.locked ? ' locked' : ''}`}>
          {page.stands.map((s) => {
            const cat = s.categoryId ? catById.get(s.categoryId) : undefined;
            return <StandShape key={s.id} stand={s} color={standColor(s, cat)} selected={selected.has(s.id)} warn={warnOf(s)} />;
          })}
        </g>
      )}
      <g className={`layer-warnings${labelsTiny ? ' tiny' : ''}`}>
        {warnings.regions
          .filter((r) => overlapShown.has(r.a) || overlapShown.has(r.b))
          .map((r) => (
            <polygon key={`${r.a}|${r.b}`} className="overlap-region" points={polyPts(r.polygon)} />
          ))}
        {shownWarnings.map(({ s, kind }) => (
          <WarnIcon key={s.id} stand={s} kind={kind!} size={fontSize * 1.3} />
        ))}
      </g>
      {L.labels.visible && (
        <g className={`layer-labels${labelsTiny ? ' tiny' : ''}${labelHalo ? ' halo' : ''}`} transform={`scale(${1 / CM})`} fontSize={fontSize * CM} strokeWidth={fontSize * CM * 0.22}>
          {L.areas.visible && page.areas.map((a) => <AreaLabel key={a.id} area={a} fontSize={fontSize} />)}
          {freeVisible && !freeLabelsTiny && free.map((r) => <FreeLabels key={r.areaId} result={r} fontSize={fontSize} window={freeLabelWindow} />)}
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

const StandShape = memo(function StandShape({ stand, color, selected, warn }: { stand: Stand; color: string; selected: boolean; warn: WarnKind }) {
  return (
    <polygon
      className={`stand${selected ? ' selected' : ''}${warn ? ` warn-${warn}` : ''}`}
      data-id={stand.id}
      data-warning={warn ?? undefined}
      points={pts(stand)}
      fill={color}
    />
  );
});

const polyPts = (poly: readonly Vec[]) => poly.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');

/**
 * Freiflächen einer Grundfläche: hellgrün getönt und schraffiert. Die Schraffur sind echte Linien in
 * Metern (ein Pfad je Grundfläche), kein SVG-<pattern>: Musterfüllungen kosten in WebKit beim Zoomen
 * und Verschieben bis zu 25 Bilder/s (Lasttest M4-21).
 */
const FreeArea = memo(function FreeArea({ result, spacing }: { result: AreaFreeSpaces; spacing: number }) {
  if (!result.free.length) return null;
  const hatch = result.free.flatMap((f) => f.polygons.map((poly) => hatchPath(poly, spacing))).join('');
  return (
    <>
      {result.free.map((f) =>
        f.polygons.map((poly, i) => <polygon key={`${f.key}:${i}`} className="free-space" data-key={f.key} data-area={result.areaId} points={polyPts(poly)} />),
      )}
      <path className="free-hatch" d={hatch} />
    </>
  );
});

/** „Frei 20 × 10 m“: horizontal, mittig, feste Schriftgröße wie die Standbeschriftung. */
const FreeLabels = memo(function FreeLabels({ result, fontSize, window: win }: { result: AreaFreeSpaces; fontSize: number; window: Bounds }) {
  const inside = (p: Vec) => p.x >= win.minX && p.x <= win.maxX && p.y >= win.minY && p.y <= win.maxY;
  return (
    <>
      {result.free.filter((f) => inside(f.center)).map((f) => (
        <text key={f.key} className="free-label" data-key={f.key} textAnchor="middle" x={f.center.x * CM} y={(f.center.y + BASELINE * fontSize) * CM}>
          {freeSpaceLabel(f.width, f.depth)}
        </text>
      ))}
    </>
  );
});

/** Warndreieck an der Ecke oben rechts des Stands (Weltgröße, an die Schriftgröße gekoppelt). */
const WarnIcon = memo(function WarnIcon({ stand, kind, size }: { stand: Stand; kind: 'outside' | 'overlap'; size: number }) {
  const c = fromLocal(stand, { x: stand.w / 2, y: -stand.d / 2 });
  const r = size / 2;
  return (
    <g className="warn-icon-group" transform={`translate(${c.x} ${c.y})`}>
      <path className={`warn-icon ${kind}`} d={`M0 ${-r} L${r * 1.1} ${r * 0.85} L${-r * 1.1} ${r * 0.85} Z`} />
      <rect className="warn-icon-mark" x={-r * 0.09} y={-r * 0.45} width={r * 0.18} height={r * 0.75} />
      <rect className="warn-icon-mark" x={-r * 0.09} y={r * 0.42} width={r * 0.18} height={r * 0.18} />
    </g>
  );
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
