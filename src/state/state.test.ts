import { beforeEach, describe, expect, it } from 'vitest';
import { createProject } from '../core/model/defaults';
import { addPage, cyclePage, deletePage, duplicatePage, movePage, renamePage } from './pages';
import { selectDirty, START_PAGE, useStore } from './store';

const names = () => useStore.getState().project.pages.map((p) => p.name);

beforeEach(() => {
  useStore.getState().loadBundle({ project: createProject('T'), assets: {} }, { path: null, name: null });
});

describe('Pages und Undo/Redo', () => {
  it('anlegen, umbenennen, duplizieren, löschen ist vollständig rückgängig machbar', () => {
    const id = addPage();
    renamePage(id, '  Obermarkt ');
    duplicatePage(id);
    expect(names()).toEqual(['Festplatz 1', 'Obermarkt', 'Obermarkt (Kopie)']);
    deletePage(id);
    expect(names()).toEqual(['Festplatz 1', 'Obermarkt (Kopie)']);
    const s = useStore.getState();
    for (let i = 0; i < 4; i++) s.undo();
    expect(names()).toEqual(['Festplatz 1']);
    for (let i = 0; i < 4; i++) s.redo();
    expect(names()).toEqual(['Festplatz 1', 'Obermarkt (Kopie)']);
  });

  it('aktive Page bleibt nach Undo gültig', () => {
    const id = addPage();
    expect(useStore.getState().ui.activePage).toBe(id);
    useStore.getState().undo();
    expect(useStore.getState().project.pages.some((p) => p.id === useStore.getState().ui.activePage)).toBe(true);
  });

  it('leerer Name und unveränderter Name erzeugen keinen Undo-Schritt', () => {
    const id = useStore.getState().project.pages[0]!.id;
    renamePage(id, '   ');
    renamePage(id, 'Festplatz 1');
    expect(useStore.getState().history.past.length).toBe(0);
  });

  it('movePage sortiert um', () => {
    const a = addPage();
    addPage();
    movePage(a, 2);
    expect(names()).toEqual(['Festplatz 1', 'Festplatz 3', 'Festplatz 2']);
  });

  it('cyclePage läuft über die Start-Page', () => {
    addPage();
    cyclePage(1);
    expect(useStore.getState().ui.activePage).toBe(START_PAGE);
    cyclePage(-1);
    expect(useStore.getState().ui.activePage).toBe(useStore.getState().project.pages[1]!.id);
  });

  it('dirty folgt Undo/Redo und Speichern', () => {
    const s = useStore.getState();
    expect(selectDirty(useStore.getState())).toBe(false);
    addPage();
    expect(selectDirty(useStore.getState())).toBe(true);
    s.undo();
    expect(selectDirty(useStore.getState())).toBe(false);
    s.redo();
    s.markSaved(null, 'x.schelme');
    expect(selectDirty(useStore.getState())).toBe(false);
  });

  it('Transaktion bündelt mehrere Änderungen zu einem Undo-Schritt', () => {
    const s = useStore.getState();
    s.beginTransaction('Ziehen');
    s.change('a', (p) => void (p.name = 'A'));
    s.change('b', (p) => void (p.name = 'B'));
    s.commitTransaction();
    expect(useStore.getState().history.past.length).toBe(1);
    s.undo();
    expect(useStore.getState().project.name).toBe('T');
  });
});
