import { platform } from '../platform';
import { headId } from '../state/history';
import { selectDirty, useStore } from '../state/store';
import { currentBytes } from './fileActions';

export const AUTOSAVE_INTERVAL_MS = 30_000;

/** Schreibt alle 30 s eine Sicherung, wenn es ungespeicherte, noch nicht gesicherte Änderungen gibt. */
export function startAutosave(): () => void {
  let lastHead = -2;
  const timer = setInterval(async () => {
    const s = useStore.getState();
    const head = headId(s.history);
    if (!selectDirty(s) || head === lastHead) return;
    try {
      await platform.writeAutosave(s.filePath, currentBytes());
      lastHead = head;
    } catch (e) {
      console.warn('Autosave fehlgeschlagen', e);
    }
  }, AUTOSAVE_INTERVAL_MS);
  return () => clearInterval(timer);
}
