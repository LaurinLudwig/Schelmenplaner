import { create } from 'zustand';
import { planRenumber, type RenumberPlan } from '../core/numbering';
import { applyRenumber } from '../state/numbering';
import { START_PAGE, useStore } from '../state/store';
import { notify } from './notify';

/** Neu nummerieren mit Vorschau (M5-06; Dialog: ui/shell/RenumberDialog.tsx). */
export const useRenumber = create<{ plan: RenumberPlan | null }>()(() => ({ plan: null }));

/** Bei „pro Festplatz“ die aktive Page; im Modus „manuell“ nicht möglich. Bei „global“ immer (sofern es eine nicht-manuelle Page gibt). */
export function canRenumber(): boolean {
  const s = useStore.getState();
  const page = s.project.pages.find((p) => p.id === s.ui.activePage);
  if (s.project.settings.numbering.scope === 'global') return s.project.pages.some((p) => p.numberingMode !== 'manual');
  return !!page && page.numberingMode !== 'manual';
}

export function openRenumber() {
  const s = useStore.getState();
  if (s.ui.activePage === START_PAGE && s.project.settings.numbering.scope !== 'global') return;
  const plan = planRenumber(s.project, s.ui.activePage);
  if (!plan.pageIds.length) {
    notify('Im Modus „manuell“ wird nicht automatisch nummeriert.');
    return;
  }
  if (!plan.changes.length) {
    notify(plan.duplicates.size ? 'Alle Nummern sind schon aktuell. Es gibt aber doppelte Nummern unter den fixierten Ständen.' : 'Alle Nummern sind schon aktuell.');
    return;
  }
  useRenumber.setState({ plan });
}

export function closeRenumber(apply: boolean) {
  const plan = useRenumber.getState().plan;
  useRenumber.setState({ plan: null });
  if (apply && plan) applyRenumber(plan);
}
