import { SHORTCUTS } from '../ui/shortcuts/definitions';
import { IS_MAC, matches, parseCombo } from '../ui/shortcuts/keys';
import { useDialogs } from './dialogs';
import { usePagePicker } from './pagePicker';
import { useRenumber } from './renumber';
import { COMMANDS, runCommand } from './commands';

const compiled = SHORTCUTS.flatMap((def) => def.keys.map((k) => ({ id: def.id, combo: parseCombo(k) })));

/** Häkchen und Optionsfelder sind keine Textfelder: Cmd/Strg+Z usw. wirken dort global (M4: „ignorieren“ mit Undo). */
const isTextField = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || (t instanceof HTMLInputElement && t.type !== 'checkbox' && t.type !== 'radio'));

/** Liefert true, wenn die Taste verarbeitet wurde (z. B. Esc bricht eine Geste ab). */
export type InteractionKeyHandler = (e: KeyboardEvent) => boolean;

let interaction: InteractionKeyHandler | null = null;

/**
 * Meldet die laufende Interaktion an (das Werkzeug der Zeichenfläche: Ziehen, Aufziehen, Messen,
 * Kalibrieren). Sie bekommt jede Taste VOR den globalen Kurzbefehlen, unabhängig davon, wann sie
 * angemeldet wurde (QA-M3-01). Rückgabe: Abmelden.
 */
export function setInteractionKeyHandler(handler: InteractionKeyHandler): () => void {
  interaction = handler;
  return () => {
    if (interaction === handler) interaction = null;
  };
}

/**
 * Der einzige globale Tastatur-Handler. Reihenfolge, fest im Code statt über die Anmeldung von
 * Listenern: 1. offene Dialoge behandeln ihre Tasten selbst; 2. die laufende Interaktion;
 * 3. die Kurzbefehle aus der zentralen Konfiguration.
 */
export function handleKeyDown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.isComposing) return;
  if (useDialogs.getState().queue.length || usePagePicker.getState().request || useRenumber.getState().plan) return;
  const inText = isTextField(e.target);
  if (!inText && interaction?.(e)) {
    e.preventDefault();
    return;
  }
  for (const { id, combo } of compiled) {
    const cmd = COMMANDS[id];
    if (!cmd || !matches(combo, e, IS_MAC)) continue;
    // In Textfeldern nur Kombinationen mit Strg/Cmd (Speichern usw.), aber keine Bearbeiten-Befehle:
    // Undo, Kopieren, Einfügen, Alles auswählen usw. gehören dem Feld.
    if (inText && (!(combo.mod || combo.ctrl) || id.startsWith('edit.'))) return;
    const ran = runCommand(id, e);
    // Kombinationen mit Strg/Cmd immer abfangen (sonst z. B. Lesezeichen im Browser); einfache Tasten
    // wie Esc, Pfeile oder Entf nur, wenn der Befehl wirklich lief.
    if (ran || combo.mod || combo.ctrl) e.preventDefault();
    return;
  }
}

export function startKeyboard(): () => void {
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
