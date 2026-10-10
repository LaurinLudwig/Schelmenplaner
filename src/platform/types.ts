/**
 * Schnittstelle zum Betriebssystem. Die App spricht nur über `platform` (siehe index.ts) mit
 * Dateien und Fenster. Es gibt zwei Implementierungen:
 * - tauri.ts:   Desktop-App mit nativen Dateidialogen und Dateisystem
 * - browser.ts: normaler Browser (`npm run dev`, E2E-Tests) mit Upload, Download und localStorage
 */

export interface PickedFile {
  bytes: Uint8Array;
  /** Vollständiger Pfad; im Browser null, weil Webseiten keine Pfade kennen. */
  path: string | null;
  name: string;
}

export interface FileFilter {
  name: string;
  /** Endungen ohne Punkt, z. B. ['pdf', 'png']. */
  extensions: string[];
}

export interface SavedFile {
  path: string | null;
  name: string;
}

export type AutosaveSlot = 'current' | 'kept';

export interface AutosaveInfo {
  bytes: Uint8Array;
  time: Date | null;
}

export interface Platform {
  kind: 'tauri' | 'browser';

  /** Projektdatei auswählen und lesen. null = abgebrochen. */
  pickProjectFile(): Promise<PickedFile | null>;
  /** Beliebige Datei mit den gegebenen Endungen auswählen und lesen (z. B. Hintergrundplan). */
  pickFile(filter: FileFilter): Promise<PickedFile | null>;
  /**
   * Projektdatei schreiben. Ohne `path` wird nach dem Ziel gefragt (Desktop) bzw. die Datei
   * heruntergeladen (Browser). null = abgebrochen.
   */
  writeProjectFile(bytes: Uint8Array, path: string | null, suggestedName: string): Promise<SavedFile | null>;

  /**
   * Sicherung schreiben; `projectPath` null = unbenanntes Projekt. `slot` „current“ ist die
   * laufende Sicherung, „kept“ eine im Wiederherstellen-Dialog behaltene (QA-M1-08), die die
   * laufende Sitzung nie überschreibt.
   */
  writeAutosave(projectPath: string | null, bytes: Uint8Array, slot?: AutosaveSlot): Promise<void>;
  /** Sicherung lesen, bei benannten Projekten nur, wenn sie neuer ist als die Datei. */
  readAutosave(projectPath: string | null, slot?: AutosaveSlot): Promise<AutosaveInfo | null>;
  removeAutosave(projectPath: string | null, slot?: AutosaveSlot): Promise<void>;

  setWindowTitle(title: string): void;
  /**
   * Schützt vor versehentlichem Schließen. `isDirty` wird beim Schließen abgefragt;
   * `confirmClose` darf nachfragen (nur Desktop – Browser zeigen dafür nur ihren eigenen Hinweis).
   * Liefert eine Funktion zum Abmelden.
   */
  guardClose(isDirty: () => boolean, confirmClose: () => Promise<boolean>): () => void;
}
