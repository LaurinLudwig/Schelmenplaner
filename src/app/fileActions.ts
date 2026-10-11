import { referencedAssets } from '../core/assets';
import { UserError, userMessage } from '../core/errors';
import { decodeProjectFile, encodeProjectFile, encodeProjectFileAsync } from '../core/fileFormat';
import { createProject } from '../core/model/defaults';
import { platform } from '../platform';
import { projectForSave, selectDirty, useStore } from '../state/store';
import { ask, showError } from './dialogs';

/** Deutsche Meldung; technische Details nur in der Konsole (QA-M2-02). */
const errorText = (e: unknown, fallback: string) => {
  if (!(e instanceof UserError)) console.warn(e);
  return userMessage(e, fallback);
};
const dateText = (d: Date | null) =>
  d ? d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : 'unbekannt';

/** Projektdatei mit allen verwendeten Hintergründen (ungenutzte bleiben nur im Speicher, für Undo). */
export function currentBytes(): Uint8Array {
  const s = useStore.getState();
  const project = projectForSave(s);
  return encodeProjectFile({ project, assets: referencedAssets(project, s.assets) });
}

/** Wie `currentBytes`, ohne den Hauptthread zu blockieren (Autosave). */
export function currentBytesAsync(): Promise<Uint8Array> {
  const s = useStore.getState();
  const project = projectForSave(s);
  return encodeProjectFileAsync({ project, assets: referencedAssets(project, s.assets) });
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
    await showError('Öffnen fehlgeschlagen', errorText(e, 'Die Datei konnte nicht gelesen werden.'));
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
    await showError('Datei kann nicht geöffnet werden', errorText(e, 'Die Datei ist beschädigt oder kein Schelmeplaner-Projekt.'));
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
    await showError('Speichern fehlgeschlagen', errorText(e, 'Die Datei konnte nicht geschrieben werden. Ist der Speicherort beschreibbar und nicht voll?'));
    return false;
  }
}

/**
 * Bietet vorhandene Sicherungen zur Wiederherstellung an: zuerst die laufende, dann eine früher
 * behaltene. `path` = geöffnete Projektdatei; null = unbenanntes Projekt (beim App-Start).
 *
 * Esc bzw. Klick neben den Dialog heißt „später entscheiden“: Die Sicherung wandert ins Fach
 * „behalten“, das die laufende Sitzung nicht überschreibt, und wird beim nächsten Mal wieder
 * angeboten (QA-M1-08). Gibt es dort schon eine ältere, wird sie durch die neuere ersetzt.
 */
export async function offerRecovery(path: string | null) {
  for (const slot of ['current', 'kept'] as const) {
    const info = await platform.readAutosave(path, slot).catch(() => null);
    if (!info) continue;
    const when = dateText(info.time);
    const r = await ask({
      title: 'Sicherung gefunden',
      message:
        slot === 'kept'
          ? `Es gibt eine früher behaltene Sicherung vom ${when}. Wiederherstellen?`
          : path
            ? `Für diese Datei gibt es eine neuere automatische Sicherung vom ${when}. Wiederherstellen?`
            : `Es gibt ein nicht gespeichertes Projekt vom ${when}. Wiederherstellen?`,
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
        // Der Inhalt lebt jetzt in der Sitzung weiter und wird von dort neu gesichert
        if (slot === 'kept') await platform.removeAutosave(path, 'kept');
      } catch (e) {
        await showError('Sicherung ist beschädigt', errorText(e, 'Die Sicherung kann nicht geladen werden.'));
      }
      return;
    }
    if (r === 'discard') {
      await platform.removeAutosave(path, slot);
      continue;
    }
    // Später entscheiden: laufende Sicherung ins Fach „behalten“ verschieben, damit sie erhalten bleibt
    if (slot === 'current') {
      await platform.writeAutosave(path, info.bytes, 'kept');
      await platform.removeAutosave(path, 'current');
    }
    return;
  }
}
