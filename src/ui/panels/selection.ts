import { useMemo } from 'react';
import { effectivePage } from '../../core/derive';
import type { FestplatzPage } from '../../core/model/types';
import { findObjects, type PageObject } from '../../core/objects';
import { useStore } from '../../state/store';

export interface SelectionInfo {
  page: FestplatzPage;
  objects: PageObject[];
}

/**
 * Ausgewählte Objekte der aktiven Page, mit eingesetzter Vorschau: Steuerungs- und Seitenleiste
 * zeigen beim Ziehen und Drehen die Werte live an.
 */
export function useSelectedObjects(): SelectionInfo | null {
  const stored = useStore((s) => s.project.pages.find((p) => p.id === s.ui.activePage) ?? null);
  const preview = useStore((s) => s.preview);
  const selection = useStore((s) => s.ui.selection);
  return useMemo(() => {
    if (!stored || selection?.kind !== 'objects') return null;
    const page = effectivePage(stored, preview);
    const objects = findObjects(page, selection.ids);
    return objects.length ? { page, objects } : null;
  }, [stored, preview, selection]);
}

/** Gemeinsamer Wert oder null, wenn die Werte verschieden sind (Mehrfachauswahl: leeres Feld). */
export function common<T>(values: readonly T[]): T | null {
  if (!values.length) return null;
  const first = values[0]!;
  return values.every((v) => v === first) ? first : null;
}

/** Bezeichnung der Auswahl: „Geschäft“, „Grundfläche“ oder „3 Objekte (…)“. */
export function selectionTitle(objects: readonly PageObject[]): string {
  if (objects.length === 1) return objects[0]!.kind === 'area' ? 'Grundfläche' : 'Geschäft';
  const a = objects.filter((o) => o.kind === 'area').length;
  const s = objects.length - a;
  const parts = [a ? `${a} ${a === 1 ? 'Grundfläche' : 'Grundflächen'}` : '', s ? `${s} ${s === 1 ? 'Geschäft' : 'Geschäfte'}` : ''].filter(Boolean);
  return parts.join(', ');
}
