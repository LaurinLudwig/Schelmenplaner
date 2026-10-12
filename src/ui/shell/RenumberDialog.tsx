import { useEffect, useRef } from 'react';
import { closeRenumber, useRenumber } from '../../app/renumber';
import { useStore } from '../../state/store';

/**
 * Vorschau „Neu nummerieren“ (M5-06): alt → neu für alle betroffenen Stände, dazu fixierte und
 * unveränderte. Übernehmen ist ein Undo-Schritt; Esc oder Klick daneben bricht ab.
 */
export function RenumberDialog() {
  const plan = useRenumber((s) => s.plan);
  const pages = useStore((s) => s.project.pages);
  const applyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!plan) return;
    applyRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeRenumber(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [plan]);

  if (!plan) return null;
  const pageById = new Map(pages.map((p) => [p.id, p]));
  const standName = (pageId: string, id: string) => pageById.get(pageId)?.stands.find((s) => s.id === id)?.name ?? '';
  const several = plan.pageIds.length > 1;
  const n = plan.changes.length;
  const scope = plan.scope === 'global' ? `alle Festplätze (global durchgehend${plan.pageIds.length < pages.length ? ', ohne manuelle' : ''})` : pageById.get(plan.pageIds[0]!)?.name;
  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && closeRenumber(false)}>
      <div className="dialog renumber" role="dialog" aria-modal="true" aria-labelledby="rn-title">
        <h2 id="rn-title">Neu nummerieren</h2>
        <p data-testid="renumber-summary">
          {scope}: {n} {n === 1 ? 'Nummer ändert' : 'Nummern ändern'} sich
          {plan.fixed > 0 && `, ${plan.fixed} fixiert`}
          {plan.unchanged > 0 && `, ${plan.unchanged} unverändert`}.
        </p>
        <div className="renumber-table">
          <table>
            <thead>
              <tr>
                {several && <th>Festplatz</th>}
                <th>Alt</th>
                <th aria-label="wird zu" />
                <th>Neu</th>
                <th>Geschäft</th>
              </tr>
            </thead>
            <tbody>
              {plan.changes.map((c) => (
                <tr key={c.standId} data-testid="renumber-row">
                  {several && <td>{pageById.get(c.pageId)?.name}</td>}
                  <td className={c.old ? 'num' : 'num muted'}>{c.old || '–'}</td>
                  <td className="arrow">→</td>
                  <td className="num">{c.next}</td>
                  <td className="name">{standName(c.pageId, c.standId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {plan.duplicates.size > 0 && (
          <p className="warn-chip outside" data-testid="renumber-duplicates">
            Danach bleiben {plan.duplicates.size} Stände mit doppelter Nummer (fixierte oder manuell nummerierte Stände).
          </p>
        )}
        <p className="hint">Übernehmen lässt sich mit Strg/Cmd+Z in einem Schritt rückgängig machen.</p>
        <div className="buttons">
          <button type="button" className="btn" onClick={() => closeRenumber(false)}>
            Abbrechen
          </button>
          <button ref={applyRef} type="button" className="btn primary" onClick={() => closeRenumber(true)}>
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
