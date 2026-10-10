/**
 * Sicht auf eine Page während einer Geste: Die Vorschau-Rechtecke (Ziehen, Drehen, Größe ändern)
 * werden eingesetzt, ohne das Projekt zu ändern. Zeichenfläche, Steuerungsleiste und ab M4 die
 * Freiflächen und Warnungen lesen nur diese Sicht und rechnen so live mit.
 */
import type { FestplatzPage, Id, Rect } from './model/types';

export interface Preview {
  pageId: Id;
  rects: Record<Id, Rect>;
}

const apply = <T extends Rect & { id: Id }>(list: T[], rects: Record<Id, Rect>): T[] => {
  if (!list.some((o) => rects[o.id])) return list;
  return list.map((o) => {
    const r = rects[o.id];
    return r ? { ...o, cx: r.cx, cy: r.cy, w: r.w, d: r.d, rot: r.rot } : o;
  });
};

/** Page mit eingesetzter Vorschau; unveränderte Objekte behalten ihre Identität (wichtig für memo). */
export function effectivePage(page: FestplatzPage, preview: Preview | null): FestplatzPage {
  if (!preview || preview.pageId !== page.id) return page;
  return { ...page, areas: apply(page.areas, preview.rects), stands: apply(page.stands, preview.rects) };
}
