import { decodeProjectFile, encodeProjectFile } from '../core/fileFormat';
import { createProject } from '../core/model/defaults';
import { platform } from '../platform';
import { projectForSave, selectDirty, useStore } from '../state/store';
import { ask, showError } from './dialogs';

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const dateText = (d: Date | null) =>
  d ? d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : 'unbekannt';

export function currentBytes(): Uint8Array {
  const s = useStore.getState();
  return encodeProjectFile({ project: projectForSave(s), assets: s.assets });
}

/**
 * Fragt bei ungespeicherten Änderungen nach. Liefert true, wenn fortgefahren werden darf
 * (gespeichert oder bewusst verworfen).
 */
export async function confirmDiscard(): Promise<boolean> {
  if (!selectDirty(useStore.getState())) return true;
  const r = await ask({
    title: 'Ungespeicherte Änderungen',
    message: `Änderungen an „${useStore.getState().project.name}“ speichern?`,
    buttons: [
      { id: 'discard', label: 'Nicht speichern', variant: 'danger' },
      { id: 'cancel', label: 'Abbrechen' },
      { id: 'save', label: 'Speichern', variant: 'primary' },
    ],
    cancelId: 'cancel',
  });
  if (r === 'save') return saveProject(false);
  return r === 'discard';
}

export async function newProject() {
  if (!(await confirmDiscard())) return;
  await platform.removeAutosave(useStore.getState().filePath);
  useStore.getState().loadBundle({ project: createProject(), assets: {} }, { path: null, name: null });
}

export async function openProject() {
  if (!(await confirmDiscard())) return;
  let picked;
  try {
    picked = await platform.pickProjectFile();
  } catch (e) {
    await showError('Öffnen fehlgeschlagen', errorText(e));
    return;
  }
  if (!picked) return;
  try {
    const bundle = decodeProjectFile(picked.bytes);
    const previousPath = useStore.getState().filePath;
    useStore.getState().loadBundle(bundle, { path: picked.path, name: picked.name });
    if (previousPath !== picked.path) await platform.removeAutosave(previousPath);
    if (picked.path) await offerRecovery(picked.path);
  } catch (e) {
    await showError('Datei kann nicht geöffnet werden', errorText(e));
  }
}

/** Speichert; bei `saveAs` oder unbenanntem Projekt mit Dateidialog. Liefert true bei Erfolg. */
export async function saveProject(saveAs: boolean): Promise<boolean> {
  const s = useStore.getState();
  try {
    const result = await platform.writeProjectFile(currentBytes(), saveAs ? null : s.filePath, s.fileName ?? s.project.name);
    if (!result) return false;
    useStore.getState().markSaved(result.path, result.name);
    await platform.removeAutosave(s.filePath);
    if (result.path !== s.filePath) await platform.removeAutosave(result.path);
    return true;
  } catch (e) {
    await showError('Speichern fehlgeschlagen', errorText(e));
    return false;
  }
}

/**
 * Bietet eine vorhandene Sicherung zur Wiederherstellung an.
 * `path` = geöffnete Projektdatei; null = unbenanntes Projekt (beim App-Start).
 */
export async function offerRecovery(path: string | null) {
  const info = await platform.readAutosave(path).catch(() => null);
  if (!info) return;
  const r = await ask({
    title: 'Sicherung gefunden',
    message: path
      ? `Für diese Datei gibt es eine neuere automatische Sicherung vom ${dateText(info.time)}. Wiederherstellen?`
      : `Es gibt ein nicht gespeichertes Projekt vom ${dateText(info.time)}. Wiederherstellen?`,
    buttons: [
      { id: 'discard', label: 'Verwerfen', variant: 'danger' },
      { id: 'restore', label: 'Wiederherstellen', variant: 'primary' },
    ],
    cancelId: 'keep',
  });
  if (r === 'restore') {
    try {
      const bundle = decodeProjectFile(info.bytes);
      const s = useStore.getState();
      useStore.getState().loadBundle(bundle, { path, name: path ? s.fileName : null, dirty: true });
    } catch (e) {
      await showError('Sicherung ist beschädigt', errorText(e));
    }
  } else if (r === 'discard') {
    await platform.removeAutosave(path);
  }
}
