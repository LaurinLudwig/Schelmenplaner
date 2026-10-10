import { applyPatches, enablePatches, produceWithPatches, type Patch } from 'immer';
import type { Project } from '../core/model/types';

enablePatches();

export interface HistoryEntry {
  id: number;
  label: string;
  patches: Patch[];
  inverse: Patch[];
}

export interface History {
  past: HistoryEntry[];
  future: HistoryEntry[];
  /** Offene Transaktion: weitere Änderungen werden in diesen Eintrag gebündelt (z. B. ein Ziehvorgang). */
  open: HistoryEntry | null;
}

export const MAX_HISTORY = 500;
let nextEntryId = 1;

export const emptyHistory = (): History => ({ past: [], future: [], open: null });

/** ID des Eintrags, der den aktuellen Projektstand beschreibt (0 = Ausgangsstand). */
export const headId = (h: History): number => h.open?.id ?? h.past.at(-1)?.id ?? 0;

export type Recipe = (draft: Project) => void;

/** Wendet eine Änderung an und protokolliert sie. Liefert null, wenn sich nichts geändert hat. */
export function record(project: Project, h: History, label: string, recipe: Recipe): { project: Project; history: History } | null {
  const [next, patches, inverse] = produceWithPatches(project, recipe);
  if (!patches.length) return null;
  if (h.open) {
    const open = { ...h.open, patches: [...h.open.patches, ...patches], inverse: [...inverse, ...h.open.inverse] };
    return { project: next, history: { ...h, open } };
  }
  const entry: HistoryEntry = { id: nextEntryId++, label, patches, inverse };
  return { project: next, history: { past: [...h.past, entry].slice(-MAX_HISTORY), future: [], open: null } };
}

export function beginTransaction(h: History, label: string): History {
  if (h.open) return h;
  return { ...h, open: { id: nextEntryId++, label, patches: [], inverse: [] } };
}

export function commitTransaction(h: History): History {
  if (!h.open) return h;
  if (!h.open.patches.length) return { ...h, open: null };
  return { past: [...h.past, h.open].slice(-MAX_HISTORY), future: [], open: null };
}

export function undo(project: Project, h: History): { project: Project; history: History } | null {
  const h2 = commitTransaction(h);
  const entry = h2.past.at(-1);
  if (!entry) return null;
  return {
    project: applyPatches(project, entry.inverse),
    history: { past: h2.past.slice(0, -1), future: [entry, ...h2.future], open: null },
  };
}

export function redo(project: Project, h: History): { project: Project; history: History } | null {
  const h2 = commitTransaction(h);
  const entry = h2.future[0];
  if (!entry) return null;
  return {
    project: applyPatches(project, entry.patches),
    history: { past: [...h2.past, entry], future: h2.future.slice(1), open: null },
  };
}
