/**
 * Objekte einer Festplatz-Page (Grundflächen, Geschäfte): anlegen, finden, kopieren (M3).
 */
import { newId } from './id';
import type { Area, FestplatzPage, Id, LayerId, Rect, Stand } from './model/types';

export type ObjectKind = 'area' | 'stand';

/** Standardmaße und Grenzen. */
export const AREA_DEFAULT = { w: 20, d: 8 };
export const STAND_DEFAULT = { w: 3, d: 3 };
export const LIMITS: Record<ObjectKind, { min: number; max: number }> = {
  area: { min: 0.5, max: 2000 },
  stand: { min: 0.1, max: 100 },
};
export const LAYER_OF: Record<ObjectKind, LayerId> = { area: 'areas', stand: 'stands' };

/**
 * Beim Aufziehen zählt eine Geste mit weniger als 0,5 m in einer Richtung als Klick (Standardmaß),
 * damit versehentlich flache Rechtecke wie 10 × 0,1 m nicht entstehen (QA-M3-L2).
 */
export const MIN_DRAW_SIZE = 0.5;

/** Neutrale Farbe für Stände ohne Kategorie und eigene Farbe. */
export const DEFAULT_STAND_COLOR = '#a7adb3';

/** Feste Farbpalette für Kategorien und eigene Standfarben. */
export const PALETTE = ['#e57373', '#f0a35e', '#f2d15c', '#9ccc65', '#4db6ac', '#4fc3f7', '#7986cb', '#ba68c8', '#f06292', '#a1887f', '#90a4ae', '#ffffff'];

export function createArea(rect: Rect, name = ''): Area {
  return { id: newId(), name, cx: rect.cx, cy: rect.cy, w: rect.w, d: rect.d, rot: rect.rot };
}

export function createStand(rect: Rect, fields: Partial<Omit<Stand, 'id'>> = {}): Stand {
  return {
    id: newId(),
    nr: '',
    nrLocked: false,
    name: '',
    owner: '',
    ware: '',
    powerKw: 0,
    connection: null,
    note: '',
    categoryId: null,
    color: null,
    suppressOutsideWarning: false,
    ...fields,
    cx: rect.cx,
    cy: rect.cy,
    w: rect.w,
    d: rect.d,
    rot: rect.rot,
  };
}

export type PageObject = { kind: 'area'; obj: Area } | { kind: 'stand'; obj: Stand };

export function findObject(page: FestplatzPage, id: Id): PageObject | null {
  const a = page.areas.find((x) => x.id === id);
  if (a) return { kind: 'area', obj: a };
  const s = page.stands.find((x) => x.id === id);
  return s ? { kind: 'stand', obj: s } : null;
}

export function findObjects(page: FestplatzPage, ids: readonly Id[]): PageObject[] {
  return ids.map((id) => findObject(page, id)).filter((o): o is PageObject => !!o);
}

/** Darf ein Objekt dieser Art ausgewählt werden (Ebene sichtbar und nicht gesperrt)? */
export const selectable = (page: FestplatzPage, kind: ObjectKind) => {
  const l = page.layers[LAYER_OF[kind]];
  return l.visible && !l.locked;
};

/** Zwischenablage: Kopien der Objekte und die Page, von der sie stammen. */
export interface Clipboard {
  areas: Area[];
  stands: Stand[];
  sourcePageId: Id;
}

/**
 * Kopien mit neuen IDs, um (dx, dy) verschoben. Kopierte Stände bekommen eine leere, nicht fixierte
 * Platznummer, damit keine Nummer doppelt vorkommt.
 */
export function cloneObjects(areas: readonly Area[], stands: readonly Stand[], dx: number, dy: number): { areas: Area[]; stands: Stand[] } {
  return {
    areas: areas.map((a) => ({ ...structuredClone(a), id: newId(), cx: a.cx + dx, cy: a.cy + dy })),
    stands: stands.map((s) => ({ ...structuredClone(s), id: newId(), cx: s.cx + dx, cy: s.cy + dy, nr: '', nrLocked: false })),
  };
}
