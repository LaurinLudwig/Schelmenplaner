/**
 * Papier-Elemente einer Page zusammengestellt (M7, spec.md §8): Blatt, Schriftfeld und Legende mit ihrer Lage auf
 * dem Plan. Gemeinsam für Zeichenfläche, Befehle (Ziehen, Pfeiltasten) und ab M8 den PDF-Export.
 */
import { pageFreeSpaces } from './freeSpace';
import { pageOccupants } from './infra';
import { legendEntries, legendLayout, type LegendLayout } from './legend';
import type { FestplatzPage, LayerId, LayerState, PaperAnchor, Project, Vec } from './model/types';
import { anchorToWorld, backgroundBounds, sheetFrame, titleBlockLayout, type SheetFrame, type TitleBlockLayout } from './sheet';

export type PaperKind = 'titleBlock' | 'legend';

export interface PaperElement<L> {
  layout: L;
  anchor: PaperAnchor;
  /** Linke obere Ecke auf dem Plan (Meter). */
  topLeft: Vec;
}

export interface PagePaper {
  frame: SheetFrame;
  titleBlock: PaperElement<TitleBlockLayout>;
  /** null: Die Legende hat keine Einträge (wird nicht gezeichnet). */
  legend: PaperElement<LegendLayout> | null;
}

type ProjectPart = Pick<Project, 'name' | 'categories' | 'infraTypes' | 'titleBlock'> & { settings: Pick<Project['settings'], 'minFreeWidth'> };

/** Wird auf der Page mindestens eine Freifläche angezeigt? (für den Legendeneintrag „Freifläche“) */
export function hasFreeSpace(page: FestplatzPage, project: ProjectPart): boolean {
  return pageFreeSpaces(page.areas, pageOccupants(page, project.infraTypes), project.settings.minFreeWidth).some((a) => a.free.length > 0);
}

/**
 * Blatt und Papier-Elemente der Page. `layers` = sichtbare Ebenen (Zeichenfläche: die der Page; ab M8: die des
 * Export-Profils); `freeShown` aus der Freiflächen-Berechnung des Aufrufers (sonst neu berechnet).
 */
export function pagePaper(page: FestplatzPage, project: ProjectPart, layers: Record<LayerId, LayerState> = page.layers, freeShown?: boolean): PagePaper {
  const frame = sheetFrame(page, backgroundBounds(page));
  const tLayout = titleBlockLayout({
    projectName: project.name,
    pageName: page.name,
    scale: frame.scale,
    sheet: page.sheet,
    dateText: project.titleBlock.dateText,
    version: project.titleBlock.version,
    freeText: page.titleBlockText,
  });
  const entries = legendEntries(page, project, layers, freeShown ?? hasFreeSpace(page, project));
  const lLayout = entries.length ? legendLayout(entries, frame.paper.h) : null;
  return {
    frame,
    titleBlock: { layout: tLayout, anchor: page.titleBlock, topLeft: anchorToWorld(frame, page.titleBlock, tLayout) },
    legend: lLayout ? { layout: lLayout, anchor: page.legend, topLeft: anchorToWorld(frame, page.legend, lLayout) } : null,
  };
}
