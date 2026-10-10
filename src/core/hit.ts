/**
 * Treffertest und Rechteckauswahl auf einer Page (M3). Nur Objekte auf sichtbaren, nicht gesperrten
 * Ebenen sind auswählbar. Stände liegen über Grundflächen; innerhalb einer Art gewinnt das zuletzt
 * gezeichnete Objekt (Array-Ende).
 */
import { pointInRect, rectInBounds } from './geometry/rect';
import type { FestplatzPage, Id, Vec } from './model/types';
import { selectable, type ObjectKind } from './objects';
import type { Bounds } from './viewport';

export function pickObject(page: FestplatzPage, p: Vec, tol = 0): { kind: ObjectKind; id: Id } | null {
  if (selectable(page, 'stand')) {
    for (let i = page.stands.length - 1; i >= 0; i--) {
      const s = page.stands[i]!;
      if (pointInRect(s, p, tol)) return { kind: 'stand', id: s.id };
    }
  }
  if (selectable(page, 'area')) {
    for (let i = page.areas.length - 1; i >= 0; i--) {
      const a = page.areas[i]!;
      if (pointInRect(a, p, tol)) return { kind: 'area', id: a.id };
    }
  }
  return null;
}

/** IDs aller auswählbaren Objekte, die vollständig im Bereich liegen. */
export function objectsInBounds(page: FestplatzPage, b: Bounds): Id[] {
  const out: Id[] = [];
  if (selectable(page, 'area')) for (const a of page.areas) if (rectInBounds(a, b)) out.push(a.id);
  if (selectable(page, 'stand')) for (const s of page.stands) if (rectInBounds(s, b)) out.push(s.id);
  return out;
}

/** IDs aller auswählbaren Objekte der Page (Alles auswählen). */
export function allSelectable(page: FestplatzPage): Id[] {
  return [...(selectable(page, 'area') ? page.areas.map((a) => a.id) : []), ...(selectable(page, 'stand') ? page.stands.map((s) => s.id) : [])];
}
