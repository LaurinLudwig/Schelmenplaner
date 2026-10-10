import { create } from 'zustand';
import type { Assets, ProjectBundle } from '../core/fileFormat';
import { createProject } from '../core/model/defaults';
import type { Id, Project, View } from '../core/model/types';
import * as H from './history';

export const START_PAGE = 'start';
export type PageRef = typeof START_PAGE | Id;

export type ToolId = 'select' | 'hand' | 'zoom';
export type Theme = 'dark' | 'light';

export interface UiState {
  activePage: PageRef;
  tool: ToolId;
  sidebarOpen: boolean;
  /** Tab blendet alle Panels aus (wie in Illustrator). */
  panelsHidden: boolean;
  shortcutsOpen: boolean;
  /** Page, deren Tab gerade umbenannt wird. */
  renamingPage: Id | null;
  theme: Theme;
  /** Größe der Zeichenfläche in px (für Zoom-Befehle ohne Mausposition). */
  viewport: { w: number; h: number };
}

export interface AppState {
  project: Project;
  assets: Assets;
  filePath: string | null;
  fileName: string | null;
  /** headId der Historie beim letzten Speichern; -1 = nie gespeichert, aber mit Inhalt (wiederhergestellt). */
  savedHead: number;
  history: H.History;
  /** Ansicht je Page. Gehört nicht zur Undo-Historie. */
  views: Record<Id, View>;
  ui: UiState;

  change: (label: string, recipe: H.Recipe) => boolean;
  beginTransaction: (label: string) => void;
  commitTransaction: () => void;
  undo: () => void;
  redo: () => void;
  loadBundle: (bundle: ProjectBundle, file: { path: string | null; name: string | null; dirty?: boolean }) => void;
  markSaved: (path: string | null, name: string) => void;
  setUi: (patch: Partial<UiState>) => void;
  setView: (pageId: Id, view: View) => void;
}

const THEME_KEY = 'schelmeplaner.theme';
function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}
export function saveTheme(t: Theme) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* Einstellung ist nur Komfort */
  }
}

/** Sorgt dafür, dass die aktive Page nach Undo/Löschen noch existiert. */
function validActive(project: Project, active: PageRef): PageRef {
  if (active === START_PAGE || project.pages.some((p) => p.id === active)) return active;
  return project.pages[0]?.id ?? START_PAGE;
}

function initialState(project: Project) {
  return {
    project,
    assets: {} as Assets,
    filePath: null,
    fileName: null,
    savedHead: 0,
    history: H.emptyHistory(),
    views: {} as Record<Id, View>,
  };
}

export const useStore = create<AppState>()((set, get) => {
  const first = createProject();
  return {
    ...initialState(first),
    ui: {
      activePage: first.pages[0]?.id ?? START_PAGE,
      tool: 'select',
      sidebarOpen: true,
      panelsHidden: false,
      shortcutsOpen: false,
      renamingPage: null,
      theme: loadTheme(),
      viewport: { w: 0, h: 0 },
    },

    change(label, recipe) {
      const s = get();
      const r = H.record(s.project, s.history, label, recipe);
      if (!r) return false;
      set({ project: r.project, history: r.history, ui: { ...s.ui, activePage: validActive(r.project, s.ui.activePage) } });
      return true;
    },
    beginTransaction(label) {
      set({ history: H.beginTransaction(get().history, label) });
    },
    commitTransaction() {
      set({ history: H.commitTransaction(get().history) });
    },
    undo() {
      const s = get();
      const r = H.undo(s.project, s.history);
      if (r) set({ project: r.project, history: r.history, ui: { ...s.ui, activePage: validActive(r.project, s.ui.activePage) } });
    },
    redo() {
      const s = get();
      const r = H.redo(s.project, s.history);
      if (r) set({ project: r.project, history: r.history, ui: { ...s.ui, activePage: validActive(r.project, s.ui.activePage) } });
    },
    loadBundle({ project, assets }, file) {
      const views: Record<Id, View> = {};
      for (const p of project.pages) if (p.view) views[p.id] = p.view;
      set({
        ...initialState(project),
        assets,
        filePath: file.path,
        fileName: file.name,
        savedHead: file.dirty ? -1 : 0,
        views,
        ui: { ...get().ui, activePage: project.pages[0]?.id ?? START_PAGE, tool: 'select' },
      });
    },
    markSaved(path, name) {
      set({ filePath: path, fileName: name, savedHead: H.headId(get().history) });
    },
    setUi(patch) {
      set({ ui: { ...get().ui, ...patch } });
    },
    setView(pageId, view) {
      set({ views: { ...get().views, [pageId]: view } });
    },
  };
});

export const selectDirty = (s: AppState) => H.headId(s.history) !== s.savedHead;
export const selectCanUndo = (s: AppState) => s.history.past.length > 0 || !!s.history.open?.patches.length;
export const selectCanRedo = (s: AppState) => s.history.future.length > 0;

/** Projekt mit den aktuellen Ansichten, so wie es gespeichert wird. */
export function projectForSave(s: AppState): Project {
  return { ...s.project, pages: s.project.pages.map((p) => ({ ...p, view: s.views[p.id] ?? p.view })) };
}
