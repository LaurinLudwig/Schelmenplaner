import { addPage, cyclePage, deletePage, duplicatePage, gotoPage } from '../state/pages';
import { saveTheme, selectCanRedo, selectCanUndo, START_PAGE, useStore, type ToolId } from '../state/store';
import { confirm } from './dialogs';
import { newProject, openProject, saveProject } from './fileActions';
import { fitView, zoomBy } from './view';

/**
 * Befehle, die über Shortcuts, Menüs und Buttons ausgelöst werden. Der Schlüssel entspricht
 * der ID in ui/shortcuts/definitions.ts.
 */
export interface Command {
  run: () => void;
  enabled?: () => boolean;
}

const s = () => useStore.getState();
const onDrawingPage = () => s().ui.activePage !== START_PAGE;
const setTool = (tool: ToolId) => () => s().setUi({ tool });

export async function confirmDeletePage(id: string) {
  const page = s().project.pages.find((p) => p.id === id);
  if (!page) return;
  const count = page.areas.length + page.stands.length + page.infra.length;
  if (count > 0) {
    const ok = await confirm(
      'Festplatz löschen',
      `„${page.name}“ enthält ${count} Objekte. Trotzdem löschen? (Rückgängig mit Strg/Cmd+Z möglich.)`,
      'Löschen',
      true,
    );
    if (!ok) return;
  }
  deletePage(id);
}

const pageJumps: Record<string, Command> = Object.fromEntries(
  Array.from({ length: 9 }, (_, i) => [`page.goto${i + 1}`, { run: () => gotoPage(i + 1), enabled: () => s().project.pages.length > i }]),
);

export const COMMANDS: Record<string, Command> = {
  'file.new': { run: () => void newProject() },
  'file.open': { run: () => void openProject() },
  'file.save': { run: () => void saveProject(false) },
  'file.saveAs': { run: () => void saveProject(true) },

  'edit.undo': { run: () => s().undo(), enabled: () => selectCanUndo(s()) },
  'edit.redo': { run: () => s().redo(), enabled: () => selectCanRedo(s()) },

  'tool.select': { run: setTool('select'), enabled: onDrawingPage },
  'tool.hand': { run: setTool('hand'), enabled: onDrawingPage },
  'tool.zoom': { run: setTool('zoom'), enabled: onDrawingPage },

  'view.zoomIn': { run: () => zoomBy(1.25), enabled: onDrawingPage },
  'view.zoomOut': { run: () => zoomBy(1 / 1.25), enabled: onDrawingPage },
  'view.fit': { run: fitView, enabled: onDrawingPage },

  'page.next': { run: () => cyclePage(1) },
  'page.prev': { run: () => cyclePage(-1) },
  'page.start': { run: () => gotoPage(0) },
  ...pageJumps,
  'page.new': { run: () => void addPage() },
  'page.rename': { run: () => s().setUi({ renamingPage: s().ui.activePage }), enabled: onDrawingPage },
  'page.duplicate': { run: () => duplicatePage(s().ui.activePage), enabled: onDrawingPage },
  'page.delete': { run: () => void confirmDeletePage(s().ui.activePage), enabled: onDrawingPage },

  'ui.panels': { run: () => s().setUi({ panelsHidden: !s().ui.panelsHidden }) },
  'ui.sidebar': {
    run: () => {
      const ui = s().ui;
      // Bei ausgeblendeten Panels holt Shift+Tab die Seitenleiste zurück.
      s().setUi(ui.panelsHidden ? { panelsHidden: false, sidebarOpen: true } : { sidebarOpen: !ui.sidebarOpen });
    },
  },
  'ui.theme': {
    run: () => {
      const theme = s().ui.theme === 'dark' ? 'light' : 'dark';
      saveTheme(theme);
      s().setUi({ theme });
    },
  },
  'ui.shortcuts': { run: () => s().setUi({ shortcutsOpen: !s().ui.shortcutsOpen }) },
};

export function runCommand(id: string): boolean {
  const cmd = COMMANDS[id];
  if (!cmd || (cmd.enabled && !cmd.enabled())) return false;
  cmd.run();
  return true;
}
