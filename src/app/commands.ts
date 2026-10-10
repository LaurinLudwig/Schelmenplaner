import { addPage, cyclePage, deletePage, duplicatePage, gotoPage } from '../state/pages';
import { saveInvertPan, saveTheme, selectCanRedo, selectCanUndo, START_PAGE, useStore, type ToolId } from '../state/store';
import { setGridVisible } from '../state/pageSettings';
import { copySelection, cutSelection, deleteSelection, duplicateSelection, hasClipboard, nudge, paste, selectAll, selectedIds } from '../state/objects';
import { importBackground } from './backgroundImport';
import { confirm } from './dialogs';
import { notify } from './notify';
import { newProject, openProject, saveProject } from './fileActions';
import { fitView, visibleBounds, zoomBy } from './view';

/**
 * Befehle, die über Shortcuts, Menüs und Buttons ausgelöst werden. Der Schlüssel entspricht
 * der ID in ui/shortcuts/definitions.ts.
 */
export interface Command {
  run: () => void;
  enabled?: () => boolean;
  /** Hinweis, wenn der Befehl per Taste ausgelöst wird, aber gerade nicht möglich ist. */
  disabledMessage?: string;
}

const s = () => useStore.getState();
const onDrawingPage = () => s().ui.activePage !== START_PAGE;
const activePage = () => s().project.pages.find((p) => p.id === s().ui.activePage) ?? null;
const hasBackground = () => !!activePage()?.background;
const setTool = (tool: ToolId) => () => s().setUi({ tool });
const hasObjects = () => onDrawingPage() && selectedIds().length > 0;
const nudgeCmd = (dx: number, dy: number): Command => ({ run: () => nudge(dx, dy), enabled: hasObjects });

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
  'edit.cut': { run: cutSelection, enabled: hasObjects },
  'edit.copy': { run: copySelection, enabled: hasObjects },
  'edit.paste': { run: () => paste(visibleBounds()), enabled: () => onDrawingPage() && hasClipboard() },
  'edit.duplicate': { run: duplicateSelection, enabled: hasObjects },
  'edit.delete': { run: deleteSelection, enabled: hasObjects },
  'edit.selectAll': { run: selectAll, enabled: onDrawingPage },
  'edit.deselect': { run: () => s().setUi({ selection: null }), enabled: () => onDrawingPage() && !!s().ui.selection },
  'edit.nudgeLeft': nudgeCmd(-0.1, 0),
  'edit.nudgeRight': nudgeCmd(0.1, 0),
  'edit.nudgeUp': nudgeCmd(0, -0.1),
  'edit.nudgeDown': nudgeCmd(0, 0.1),
  'edit.nudgeLeftBig': nudgeCmd(-1, 0),
  'edit.nudgeRightBig': nudgeCmd(1, 0),
  'edit.nudgeUpBig': nudgeCmd(0, -1),
  'edit.nudgeDownBig': nudgeCmd(0, 1),

  'tool.select': { run: setTool('select'), enabled: onDrawingPage },
  'tool.hand': { run: setTool('hand'), enabled: onDrawingPage },
  'tool.zoom': { run: setTool('zoom'), enabled: onDrawingPage },
  'tool.area': { run: setTool('area'), enabled: onDrawingPage },
  'tool.stand': { run: setTool('stand'), enabled: onDrawingPage },
  'tool.measure': { run: setTool('measure'), enabled: onDrawingPage },
  'tool.calibrate': {
    run: setTool('calibrate'),
    enabled: hasBackground,
    disabledMessage: 'Kalibrieren: Zuerst einen Hintergrund importieren (Cmd/Strg+Shift+P).',
  },
  'file.importBackground': { run: () => void importBackground(), enabled: onDrawingPage },
  'view.grid': {
    run: () => {
      const page = activePage();
      if (page) setGridVisible(page.id, !page.grid.visible);
    },
    enabled: onDrawingPage,
  },

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
  'ui.invertPan': {
    run: () => {
      const on = !s().ui.invertPan;
      saveInvertPan(on);
      s().setUi({ invertPan: on });
      notify(on ? 'Wischrichtung umgekehrt (gegen die Systemeinstellung).' : 'Wischrichtung wie in der Systemeinstellung.');
    },
  },
  'ui.shortcuts': { run: () => s().setUi({ shortcutsOpen: !s().ui.shortcutsOpen }) },
};

export function runCommand(id: string): boolean {
  const cmd = COMMANDS[id];
  if (!cmd) return false;
  if (cmd.enabled && !cmd.enabled()) {
    if (cmd.disabledMessage && onDrawingPage()) notify(cmd.disabledMessage);
    return false;
  }
  cmd.run();
  return true;
}
