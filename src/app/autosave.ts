import { platform } from '../platform';
import { headId } from '../state/history';
import { selectDirty, useStore } from '../state/store';
import { currentBytes } from './fileActions';

export const AUTOSAVE_INTERVAL_MS = 30_000;

/**
 * Schreibt alle 30 s eine Sicherung, wenn es ungespeicherte, noch nicht gesicherte Änderungen gibt.
 *
 * Wird das Projekt wieder „sauber“ (z. B. Undo bis zum gespeicherten Stand), entfernt es die
 * Sicherung, die diese Sitzung geschrieben hat, sofort. Sonst würde beim nächsten Start ein
 * bewusst verworfener Stand zur Wiederherstellung angeboten (QA-M1-03).
 */
export function startAutosave(): () => void {
  let lastHead = -2;
  /** Pfad der Sicherung, die diese Sitzung geschrieben hat (null = unbenannt); undefined = keine. */
  let written: string | null | undefined;

  const discardOwnBackup = () => {
    if (written === undefined) return;
    const path = written;
    written = undefined;
    lastHead = -2;
    void platform.removeAutosave(path);
  };

  const timer = setInterval(async () => {
    const s = useStore.getState();
    if (!selectDirty(s)) {
      discardOwnBackup();
      return;
    }
    const head = headId(s.history);
    if (head === lastHead) return;
    try {
      await platform.writeAutosave(s.filePath, currentBytes());
      lastHead = head;
      written = s.filePath;
    } catch (e) {
      console.warn('Autosave fehlgeschlagen', e);
    }
  }, AUTOSAVE_INTERVAL_MS);

  // Sofort reagieren, wenn das Projekt sauber wird – nicht erst beim nächsten Intervall.
  // Nur für dieselbe Datei: Beim Öffnen einer anderen Datei kümmert sich fileActions um die Sicherungen.
  const unsubscribe = useStore.subscribe((s, prev) => {
    if (selectDirty(prev) && !selectDirty(s) && s.filePath === written) discardOwnBackup();
  });

  return () => {
    clearInterval(timer);
    unsubscribe();
  };
}
