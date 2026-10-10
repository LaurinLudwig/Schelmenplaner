import { SHORTCUTS } from '../ui/shortcuts/definitions';
import { IS_MAC, matches, parseCombo } from '../ui/shortcuts/keys';
import { useDialogs } from './dialogs';
import { COMMANDS, runCommand } from './commands';

const compiled = SHORTCUTS.flatMap((def) => def.keys.map((k) => ({ id: def.id, combo: parseCombo(k) })));

const isTextField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** Globaler Tastatur-Handler: sucht den passenden Shortcut und führt den Befehl aus. */
export function startKeyboard(): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing) return;
    // Offene Dialoge behandeln ihre Tasten selbst.
    if (useDialogs.getState().queue.length) return;
    const inText = isTextField(e.target);
    for (const { id, combo } of compiled) {
      if (!COMMANDS[id] || !matches(combo, e, IS_MAC)) continue;
      // In Textfeldern nur Kombinationen mit Strg/Cmd (Speichern usw.), aber kein Undo – das gehört dem Feld.
      if (inText && (!(combo.mod || combo.ctrl) || id === 'edit.undo' || id === 'edit.redo')) return;
      e.preventDefault();
      runCommand(id);
      return;
    }
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
