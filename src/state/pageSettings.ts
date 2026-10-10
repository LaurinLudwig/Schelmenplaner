import type { Background, FestplatzPage, Id } from '../core/model/types';
import { useStore } from './store';

/** Änderungen an einer Festplatz-Page (Hintergrund, Raster, Norden). Alle rückgängig machbar. */

function updatePage(pageId: Id, label: string, fn: (page: FestplatzPage) => void): boolean {
  return useStore.getState().change(label, (p) => {
    const page = p.pages.find((x) => x.id === pageId);
    if (page) fn(page);
  });
}

export function setBackground(pageId: Id, background: Background | null, label: string) {
  updatePage(pageId, label, (page) => {
    page.background = background;
  });
}

export function updateBackground(pageId: Id, label: string, patch: Partial<Background>) {
  updatePage(pageId, label, (page) => {
    if (page.background) Object.assign(page.background, patch);
  });
}

/** Rasterweite: inhaltliche Einstellung, rückgängig machbar. */
export function setGridSize(pageId: Id, size: number) {
  if (!(size > 0)) return;
  updatePage(pageId, 'Rasterweite ändern', (page) => {
    page.grid.size = size;
  });
}

/** Raster ein/aus: Ansichtseinstellung ohne Undo-Schritt und ohne Änderungsmarkierung (QA-M2-05). */
export function setGridVisible(pageId: Id, visible: boolean) {
  useStore.getState().changeView((p) => {
    const page = p.pages.find((x) => x.id === pageId);
    if (page) page.grid.visible = visible;
  });
}

export function setNorthAngle(pageId: Id, angle: number) {
  const a = ((angle % 360) + 360) % 360;
  updatePage(pageId, 'Nordrichtung ändern', (page) => {
    page.northAngle = a;
  });
}
