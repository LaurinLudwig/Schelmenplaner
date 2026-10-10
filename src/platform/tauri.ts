import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, readFile, remove, stat, writeFile } from '@tauri-apps/plugin-fs';
import { FILE_EXTENSION } from '../core/fileFormat';
import type { Platform } from './types';

const FILTERS = [{ name: 'Schelmeplaner-Projekt', extensions: [FILE_EXTENSION] }];
const baseName = (path: string) => path.split(/[\\/]/).pop() ?? path;
const withExtension = (name: string) => (name.endsWith(`.${FILE_EXTENSION}`) ? name : `${name}.${FILE_EXTENSION}`);

/** Sicherung neben der Projektdatei, bei unbenannten Projekten im App-Datenverzeichnis. */
async function autosavePath(projectPath: string | null): Promise<string> {
  if (projectPath) return `${projectPath}.autosave`;
  const dir = await appLocalDataDir();
  if (!(await exists(dir))) await mkdir(dir, { recursive: true });
  return join(dir, `unbenannt.${FILE_EXTENSION}.autosave`);
}

export const tauriPlatform: Platform = {
  kind: 'tauri',

  async pickProjectFile() {
    const path = await openDialog({ multiple: false, directory: false, filters: FILTERS });
    if (typeof path !== 'string') return null;
    return { bytes: await readFile(path), path, name: baseName(path) };
  },

  async writeProjectFile(bytes, path, suggestedName) {
    const target = path ?? (await saveDialog({ defaultPath: withExtension(suggestedName), filters: FILTERS }));
    if (!target) return null;
    await writeFile(target, bytes);
    return { path: target, name: baseName(target) };
  },

  async writeAutosave(projectPath, bytes) {
    await writeFile(await autosavePath(projectPath), bytes);
  },

  async readAutosave(projectPath) {
    const p = await autosavePath(projectPath);
    if (!(await exists(p))) return null;
    const info = await stat(p);
    if (projectPath) {
      const main = await stat(projectPath);
      if (main.mtime && info.mtime && info.mtime <= main.mtime) return null;
    }
    return { bytes: await readFile(p), time: info.mtime };
  },

  async removeAutosave(projectPath) {
    try {
      const p = await autosavePath(projectPath);
      if (await exists(p)) await remove(p);
    } catch {
      /* Eine übrig gebliebene Sicherung ist harmlos */
    }
  },

  setWindowTitle(title) {
    document.title = title;
    void getCurrentWindow().setTitle(title);
  },

  guardClose(isDirty, confirmClose) {
    let unlisten: (() => void) | null = null;
    let disposed = false;
    const win = getCurrentWindow();
    void win
      .onCloseRequested(async (event) => {
        if (!isDirty()) return;
        event.preventDefault();
        if (await confirmClose()) await win.destroy();
      })
      .then((fn) => (disposed ? fn() : (unlisten = fn)));
    return () => {
      disposed = true;
      unlisten?.();
    };
  },
};
