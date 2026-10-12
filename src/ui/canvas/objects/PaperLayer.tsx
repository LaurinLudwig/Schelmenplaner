import { memo } from 'react';
import type { LegendEntry, LegendLayout } from '../../../core/legend';
import { LEGEND_SWATCH, LEGEND_TEXT } from '../../../core/legend';
import type { PagePaper } from '../../../core/paper';
import { FORMAT_TEXT, mmToM, scaleText, type TitleBlockLayout } from '../../../core/sheet';
import type { Sheet, Vec } from '../../../core/model/types';
import { iconPath } from '../../icons/infraIcons';

/**
 * Blatt und Papier-Elemente in Weltkoordinaten (M7, spec.md §8). Schriftfeld und Legende werden innen in mm
 * gezeichnet und mit n/1000 skaliert: So sind sie auf dem Papier immer gleich groß, und die Schriftgrößen im SVG
 * bleiben handlich. Papier-Elemente sehen aus wie auf dem Ausdruck (weiß, dunkle Schrift), auch im dunklen Design.
 */
interface Props {
  paper: PagePaper;
  sheet: Sheet;
  showTitleBlock: boolean;
  showLegend: boolean;
  selected: 'sheet' | 'titleBlock' | 'legend' | null;
  locked: boolean;
}

export const PaperLayer = memo(function PaperLayer({ paper, sheet, showTitleBlock, showLegend, selected, locked }: Props) {
  const { frame } = paper;
  const b = frame.bounds;
  const k = mmToM(1, frame.scale);
  const label = `${FORMAT_TEXT(sheet)} · ${scaleText(frame.scale)}${frame.fit ? ' (angepasst)' : ''}`;
  return (
    <g className={`layer-sheet${locked ? ' locked' : ''}`}>
      <rect className={`sheet-frame${selected === 'sheet' ? ' selected' : ''}`} data-testid="sheet-frame" x={b.minX} y={b.minY} width={b.maxX - b.minX} height={b.maxY - b.minY} />
      <g transform={`translate(${b.minX} ${b.minY}) scale(${k})`}>
        <text className="sheet-label" data-testid="sheet-label" x={2} y={-2} fontSize={4}>
          {label}
        </text>
      </g>
      {showLegend && paper.legend && <Legend layout={paper.legend.layout} at={paper.legend.topLeft} k={k} selected={selected === 'legend'} />}
      {showTitleBlock && <TitleBlock layout={paper.titleBlock.layout} at={paper.titleBlock.topLeft} k={k} selected={selected === 'titleBlock'} />}
    </g>
  );
});

function TitleBlock({ layout, at, k, selected }: { layout: TitleBlockLayout; at: Vec; k: number; selected: boolean }) {
  return (
    <g className={`paper-el title-block${selected ? ' selected' : ''}`} data-testid="title-block" transform={`translate(${at.x} ${at.y}) scale(${k})`}>
      <rect className="paper-box" width={layout.w} height={layout.h} />
      {layout.rules.map((y) => (
        <line key={y} className="paper-rule" x1={0} x2={layout.w} y1={y} y2={y} />
      ))}
      {layout.texts.map((t, i) => (
        <text key={i} className="paper-text" x={t.x} y={t.y - t.size * 0.18} fontSize={t.size} fontWeight={t.weight}>
          {t.text}
        </text>
      ))}
    </g>
  );
}

function Legend({ layout, at, k, selected }: { layout: LegendLayout; at: Vec; k: number; selected: boolean }) {
  return (
    <g className={`paper-el legend${selected ? ' selected' : ''}`} data-testid="legend" transform={`translate(${at.x} ${at.y}) scale(${k})`}>
      <rect className="paper-box" width={layout.w} height={layout.h} />
      <text className="paper-text" x={layout.title.x} y={layout.title.y} fontSize={layout.title.size} fontWeight={600}>
        {layout.title.text}
      </text>
      {layout.rows.map((r) => (
        <g key={r.entry.key} data-entry={r.entry.key} transform={`translate(${r.x} ${r.y})`}>
          <Swatch entry={r.entry} />
          <text className="paper-text" x={3 + LEGEND_SWATCH.w + 2} y={LEGEND_TEXT * 1.15} fontSize={LEGEND_TEXT}>
            {r.text}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Farbfeld 8 × 4 mm je Eintrag, so wie das Objekt auf dem Plan aussieht. */
function Swatch({ entry: e }: { entry: LegendEntry }) {
  const { w, h } = LEGEND_SWATCH;
  const x = 3;
  const y = -0.5;
  if (e.kind === 'area') return <rect className="sw-area" x={x} y={y} width={w} height={h} />;
  if (e.kind === 'free') return <rect className="sw-free" x={x} y={y} width={w} height={h} />;
  if (e.kind === 'infra') {
    const icon = (
      <path d={iconPath(e.icon ?? 'info')} fill={e.color} transform={`translate(${x + w / 2 - h / 2} ${y + h}) scale(${h / 960})`} />
    );
    if (e.geometry === 'line')
      return (
        <g>
          <line x1={x} x2={x + w} y1={y + h / 2} y2={y + h / 2} stroke={e.color} strokeWidth={0.8} />
        </g>
      );
    if (e.geometry === 'point') return icon;
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={e.color} fillOpacity={0.3} stroke={e.color} strokeWidth={0.3} />
        {icon}
      </g>
    );
  }
  return <rect x={x} y={y} width={w} height={h} fill={e.color} stroke="#555" strokeWidth={0.2} />;
}
