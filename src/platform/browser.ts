import { FILE_EXTENSION } from '../core/fileFormat';
import type { Platform } from './types';

/**
 * Browser-Ersatz: Öffnen per Datei-Upload, Speichern per Download, Autosave in localStorage.
 * Im Browser gibt es keine Dateipfade; jedes Projekt gilt für die Sicherung als „unbenannt“.
 */
const LS_KEY = 'schelmeplaner.autosave';
const withExtension = (name: string) => (name.endsWith(`.${FILE_EXTENSION}`) ? name : `${name}.${FILE_EXTENSION}`);

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const browserPlatform: Platform = {
  kind: 'browser',

  pickProjectFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = `.${FILE_EXTENSION}`;
      input.addEventListener('change', async () => {
        const f = input.files?.[0];
        resolve(f ? { bytes: new Uint8Array(await f.arrayBuffer()), path: null, name: f.name } : null);
      });
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  },

  async writeProjectFile(bytes, _path, suggestedName) {
    const name = withExtension(suggestedName);
    const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { path: null, name };
  },

  async writeAutosave(_projectPath, bytes) {
    localStorage.setItem(LS_KEY, JSON.stringify({ time: Date.now(), data: toBase64(bytes) }));
  },

  async readAutosave(projectPath) {
    if (projectPath) return null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const { time, data } = JSON.parse(raw) as { time: number; data: string };
      return { bytes: Uint8Array.from(atob(data), (c) => c.charCodeAt(0)), time: new Date(time) };
    } catch {
      return null;
    }
  },

  async removeAutosave(projectPath) {
    if (projectPath) return;
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* Eine übrig gebliebene Sicherung ist harmlos */
    }
  },

  setWindowTitle(title) {
    document.title = title;
  },

  guardClose(isDirty) {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty()) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  },
};
