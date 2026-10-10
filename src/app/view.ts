import { boundsOfRects } from '../core/geometry/rect';
import type { FestplatzPage, View } from '../core/model/types';
import { defaultView, fitBounds, zoomAt } from '../core/viewport';
import { START_PAGE, useStore } from '../state/store';

/** Ansicht der aktiven Page (Standardansicht, falls noch keine gesetzt ist). */
export function currentView(): View | null {
  const s = useStore.getState();
  const id = s.ui.activePage;
  if (id === START_PAGE) return null;
  const { w, h } = s.ui.viewport;
  return s.views[id] ?? defaultView(w, h);
}

function activePage(): FestplatzPage | null {
  const s = useStore.getState();
  return s.project.pages.find((p) => p.id === s.ui.activePage) ?? null;
}

/** Zoomt um die Mitte der Zeichenfläche. */
export function zoomBy(factor: number) {
  const page = activePage();
  const v = currentView();
  if (!page || !v) return;
  const { w, h } = useStore.getState().ui.viewport;
  useStore.getState().setView(page.id, zoomAt(v, factor, { x: w / 2, y: h / 2 }));
}

/** Passt alle Objekte der Page ins Fenster; leere Page → Standardansicht um den Ursprung. */
export function fitView() {
  const page = activePage();
  if (!page) return;
  const { w, h } = useStore.getState().ui.viewport;
  const bounds = boundsOfRects([...page.areas, ...page.stands, ...page.infra]);
  useStore.getState().setView(page.id, fitBounds(bounds, w, h));
}
