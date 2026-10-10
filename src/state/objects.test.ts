import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../core/model/defaults';
import { moveRects } from '../core/transform';
import {
  addArea,
  addCategory,
  addStand,
  commitRects,
  copySelection,
  cutSelection,
  deleteCategory,
  deleteSelection,
  duplicateSelection,
  moveGroupTo,
  nudge,
  paste,
  select,
  setAreaFront,
  setRectField,
  updateStands,
} from './objects';
import { addPage } from './pages';
import { setLayer } from './pageSettings';
import { selectDirty, useStore } from './store';

const s = () => useStore.getState();
const page = () => s().project.pages.find((p) => p.id === s().ui.activePage)!;
const past = () => s().history.past.length;

beforeEach(() => {
  s().loadBundle({ project: createProject('T'), assets: {} }, { path: null, name: null });
});
afterEach(() => vi.useRealTimers());

describe('Anlegen und Rundung', () => {
  it('Grundfläche und Geschäft: je ein Undo-Schritt, ausgewählt, gerundet', () => {
    const id = addArea(page().id, { cx: 10.123, cy: 5.456, w: 20.004, d: 8, rot: 0 });
    expect(page().areas[0]).toMatchObject({ cx: 10.12, cy: 5.46, w: 20 });
    expect(s().ui.selection).toEqual({ kind: 'objects', ids: [id] });
    addStand(page().id, { cx: 0, cy: 0, w: 0.01, d: 500, rot: 0 });
    expect(page().stands[0]).toMatchObject({ w: 0.1, d: 100 }); // Grenzen
    expect(past()).toBe(2);
    s().undo();
    expect(page().stands).toHaveLength(0);
    expect(s().ui.selection).toBeNull(); // Auswahl auf nicht mehr vorhandenes Objekt aufgehoben
  });
});

describe('Undo: eine Geste = ein Schritt (M3-21)', () => {
  it('viele Vorschau-Schritte, ein change beim Loslassen', () => {
    const pid = page().id;
    const id = addStand(pid, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    const n0 = past();
    const r0 = { [id]: page().stands[0]! };
    for (let i = 1; i <= 120; i++) s().setPreview({ pageId: pid, rects: moveRects(r0, { x: i * 0.1, y: i * 0.05 }) });
    expect(past()).toBe(n0); // die Vorschau ist nicht in der Historie
    expect(page().stands[0]!.cx).toBe(0); // und ändert das Projekt nicht
    commitRects(pid, s().preview!.rects, 'Verschieben');
    s().setPreview(null);
    expect(past()).toBe(n0 + 1);
    expect(page().stands[0]).toMatchObject({ cx: 12, cy: 6 });
    s().undo();
    expect(page().stands[0]).toMatchObject({ cx: 0, cy: 0 });
  });

  it('abgebrochene Geste hinterlässt nichts', () => {
    const pid = page().id;
    const id = addStand(pid, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    const n0 = past();
    s().setPreview({ pageId: pid, rects: { [id]: { cx: 9, cy: 9, w: 3, d: 3, rot: 45 } } });
    s().setPreview(null);
    expect(past()).toBe(n0);
    expect(selectDirty(s())).toBe(true); // nur durch das Anlegen
  });

  it('Werkzeugwechsel verwirft eine laufende Vorschau', () => {
    s().setPreview({ pageId: page().id, rects: {} });
    s().setUi({ tool: 'hand' });
    expect(s().preview).toBeNull();
  });

  it('gedrückt gehaltene Pfeiltaste = ein Schritt; nach einer Pause ein neuer', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    addStand(page().id, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    const n0 = past();
    for (let i = 0; i < 10; i++) {
      nudge(0.1, 0);
      vi.advanceTimersByTime(30);
    }
    expect(page().stands[0]!.cx).toBe(1);
    expect(past()).toBe(n0 + 1);
    vi.advanceTimersByTime(1500);
    nudge(0, 1);
    expect(past()).toBe(n0 + 2);
    s().undo();
    s().undo();
    expect(page().stands[0]).toMatchObject({ cx: 0, cy: 0 });
  });

  it('nach Speichern und weiterem Verschieben gilt das Projekt als geändert', () => {
    vi.useFakeTimers();
    addStand(page().id, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    nudge(1, 0);
    s().markSaved(null, 'x.schelme');
    nudge(1, 0); // innerhalb des Zeitfensters zusammengefasst
    expect(selectDirty(s())).toBe(true);
  });
});

describe('Felder bei Mehrfachauswahl (M3-12, M3-13)', () => {
  it('eine Eingabe gilt für alle; ein Undo-Schritt', () => {
    const pid = page().id;
    const a = addStand(pid, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    const b = addStand(pid, { cx: 10, cy: 0, w: 4, d: 2, rot: 30 });
    const n0 = past();
    setRectField(pid, [a, b], 'w', 5);
    setRectField(pid, [a, b], 'rot', -90);
    updateStands(pid, [a, b], { ware: 'Imbiss', powerKw: 3.5 }, 'Ware ändern');
    expect(page().stands.map((x) => [x.w, x.rot, x.ware, x.powerKw])).toEqual([
      [5, 270, 'Imbiss', 3.5],
      [5, 270, 'Imbiss', 3.5],
    ]);
    expect(past()).toBe(n0 + 3);
  });

  it('X/Y verschieben die Mitte der Auswahl', () => {
    const pid = page().id;
    const a = addStand(pid, { cx: 0, cy: 0, w: 2, d: 2, rot: 0 });
    const b = addStand(pid, { cx: 10, cy: 4, w: 2, d: 2, rot: 0 });
    moveGroupTo(pid, [a, b], { x: 105 });
    expect(page().stands.map((x) => [x.cx, x.cy])).toEqual([
      [100, 0],
      [110, 4],
    ]);
  });
});

describe('Vorderseite (M3-03)', () => {
  it('setAreaFront dreht das Koordinatensystem, die Fläche bleibt; ein Undo-Schritt', () => {
    const pid = page().id;
    const id = addArea(pid, { cx: 25, cy: 5, w: 50, d: 10, rot: 0 });
    setAreaFront(pid, id, 1);
    expect(page().areas[0]).toMatchObject({ cx: 25, cy: 5, w: 10, d: 50, rot: 270 });
    s().undo();
    expect(page().areas[0]).toMatchObject({ w: 50, d: 10, rot: 0 });
  });
});

describe('Löschen, Kopieren, Einfügen, Duplizieren (M3-16, M3-17)', () => {
  it('Duplizieren: 1 m versetzt, Platznummer leer, Kopie ausgewählt', () => {
    const pid = page().id;
    const id = addStand(pid, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    updateStands(pid, [id], { nr: '5', nrLocked: true, name: 'A' }, 'x');
    duplicateSelection();
    const copy = page().stands[1]!;
    expect(copy).toMatchObject({ cx: 1, cy: 1, nr: '', nrLocked: false, name: 'A' });
    expect(s().ui.selection).toEqual({ kind: 'objects', ids: [copy.id] });
  });

  it('Kopieren und Einfügen auf derselben Page versetzt, auf einer anderen Page an gleicher Stelle', () => {
    const pid = page().id;
    addStand(pid, { cx: 2, cy: 3, w: 3, d: 3, rot: 0 });
    copySelection();
    paste(null);
    paste(null);
    expect(page().stands.map((x) => [x.cx, x.cy])).toEqual([
      [2, 3],
      [3, 4],
      [4, 5],
    ]);
    addPage();
    paste({ minX: -50, minY: -50, maxX: 50, maxY: 50 });
    expect(page().stands.map((x) => [x.cx, x.cy])).toEqual([[2, 3]]);
  });

  it('außerhalb des sichtbaren Bereichs wird mittig eingefügt', () => {
    addStand(page().id, { cx: 500, cy: 500, w: 3, d: 3, rot: 0 });
    cutSelection();
    expect(page().stands).toHaveLength(0);
    paste({ minX: 0, minY: 0, maxX: 20, maxY: 10 });
    expect(page().stands[0]).toMatchObject({ cx: 10, cy: 5 });
  });

  it('Löschen der Auswahl ist ein Undo-Schritt', () => {
    const pid = page().id;
    const a = addArea(pid, { cx: 0, cy: 0, w: 10, d: 5, rot: 0 });
    const b = addStand(pid, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    select([a, b]);
    const n0 = past();
    deleteSelection();
    expect(page().areas.length + page().stands.length).toBe(0);
    expect(past()).toBe(n0 + 1);
    s().undo();
    expect(page().areas.length + page().stands.length).toBe(2);
  });
});

describe('Kategorien (M3-08)', () => {
  it('Löschen entfernt die Kategorie an allen Ständen; Undo stellt alles her', () => {
    const pid = page().id;
    const c = addCategory();
    const st = addStand(pid, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    updateStands(pid, [st], { categoryId: c }, 'Kategorie zuordnen');
    deleteCategory(c);
    expect(s().project.categories).toHaveLength(0);
    expect(page().stands[0]!.categoryId).toBeNull();
    s().undo();
    expect(page().stands[0]!.categoryId).toBe(c);
    expect(s().project.categories).toHaveLength(1);
  });

  it('neue Kategorien bekommen verschiedene Farben und Namen', () => {
    addCategory();
    addCategory();
    const [a, b] = s().project.categories;
    expect(a!.color).not.toBe(b!.color);
    expect(a!.name).not.toBe(b!.name);
  });
});

describe('Ebenen (M3-14)', () => {
  it('Ein-/Ausblenden ist kein Undo-Schritt und nimmt betroffene Objekte aus der Auswahl', () => {
    const pid = page().id;
    const a = addArea(pid, { cx: 0, cy: 0, w: 10, d: 5, rot: 0 });
    const b = addStand(pid, { cx: 0, cy: 0, w: 3, d: 3, rot: 0 });
    select([a, b]);
    const n0 = past();
    setLayer(pid, 'areas', { locked: true });
    expect(past()).toBe(n0);
    expect(s().ui.selection).toEqual({ kind: 'objects', ids: [b] });
    setLayer(pid, 'stands', { visible: false });
    expect(s().ui.selection).toBeNull();
  });
});
