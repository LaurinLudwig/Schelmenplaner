import { runCommand } from '../../app/commands';
import type { FestplatzPage, NumberingMode, NumberingScope } from '../../core/model/types';
import { defaultClockwiseCenter, formatNr, NUMBERING_LIMITS } from '../../core/numbering';
import { setClockwiseCenter, setClockwiseStart, setNumberingDigits, setNumberingMode, setNumberingScope, setNumberingStart, setPrefix } from '../../state/numbering';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { keyLabel, tip } from '../shortcuts/tip';
import { NumberField } from './NumberField';
import { TextField } from './TextField';

const MODES: { id: NumberingMode; label: string }[] = [
  { id: 'frontLtr', label: 'Links → rechts über den Festplatz' },
  { id: 'clockwise', label: 'Im Uhrzeigersinn um einen Mittelpunkt' },
  { id: 'manual', label: 'Manuell' },
];

/**
 * Nummerierung der Festplatz-Page (M5, spec.md §5): Modus, Präfix, im Uhrzeigersinn Mittelpunkt und
 * Startrichtung, projektweit Nummernkreis, Startnummer und Stellen; Neu nummerieren.
 */
export function NumberingPanel({ page }: { page: FestplatzPage }) {
  const numbering = useStore((s) => s.project.settings.numbering);
  const unnumbered = page.stands.filter((s) => !s.nr.trim()).length;
  const fixed = page.stands.filter((s) => s.nrLocked).length;
  const manual = page.numberingMode === 'manual';
  const canRun = numbering.scope === 'global' || !manual;
  const center = page.clockwise?.center ?? defaultClockwiseCenter(page);
  return (
    <section className="panel" aria-label="Nummerierung">
      <div className="panel-head">Nummerierung</div>
      <div className="panel-body form">
        <div className="field">
          <label htmlFor="nr-mode">Modus</label>
          <select id="nr-mode" value={page.numberingMode} onChange={(e) => setNumberingMode(page.id, e.target.value as NumberingMode)}>
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <TextField id="nr-prefix" label="Präfix dieses Festplatzes" value={page.prefix} placeholder="z. B. A-" onCommit={(v) => setPrefix(page.id, v.trim())} />

        {page.numberingMode === 'frontLtr' && <p className="hint">Alle Geschäfte von links nach rechts nach ihrer Mitte, unabhängig von den Grundflächen; bei gleicher Lage das obere zuerst.</p>}

        {page.numberingMode === 'clockwise' && (
          <>
            <div className="fields-3">
              <NumberField id="nr-cx" label="Mitte X" unit="m" value={center?.x ?? null} step={1} onCommit={(x) => setClockwiseCenter(page.id, { x })} />
              <NumberField id="nr-cy" label="Mitte Y" unit="m" value={center?.y ?? null} step={1} onCommit={(y) => setClockwiseCenter(page.id, { y })} />
              <NumberField id="nr-start" label="Start" unit="°" value={page.clockwise?.startAngle ?? 0} step={15} digits={1} min={-360} max={360} onCommit={(a) => setClockwiseStart(page.id, a)} />
            </div>
            <button type="button" className="btn wide" onClick={() => useStore.getState().setUi({ tool: 'numberCenter', selection: null })} {...tip({ label: 'Mittelpunkt setzen', desc: 'Auf die Zeichenfläche klicken; fängt an Objekten', ariaLabel: false })}>
              <Icon name="center" size={16} /> Mittelpunkt auf dem Plan setzen
            </button>
            <p className="hint">Start in Grad im Uhrzeigersinn ab Norden des Plans (0° = Norden).</p>
          </>
        )}

        <div className="subhead">
          Nummernkreis <span className="panel-badge muted">projektweit</span>
        </div>
        <div className="field">
          <label htmlFor="nr-scope">Zählung</label>
          <select id="nr-scope" value={numbering.scope} onChange={(e) => setNumberingScope(e.target.value as NumberingScope)}>
            <option value="perPage">pro Festplatz</option>
            <option value="global">global durchgehend (Reihenfolge der Tabs)</option>
          </select>
        </div>
        <div className="fields-2">
          <NumberField id="nr-start-number" label="Startnummer" value={numbering.start} step={1} digits={0} min={NUMBERING_LIMITS.start.min} max={NUMBERING_LIMITS.start.max} onCommit={setNumberingStart} />
          <NumberField id="nr-digits" label="Stellen" value={numbering.digits} step={1} digits={0} min={NUMBERING_LIMITS.digits.min} max={NUMBERING_LIMITS.digits.max} onCommit={setNumberingDigits} />
        </div>
        <p className="hint" data-testid="nr-example">
          Beispiel: {formatNr(page.prefix, numbering.start, numbering.digits)}, {formatNr(page.prefix, numbering.start + 1, numbering.digits)} …
        </p>

        <p className="hint" data-testid="nr-status">
          {page.stands.length} {page.stands.length === 1 ? 'Stand' : 'Stände'}
          {unnumbered > 0 && `, ${unnumbered} ohne Nummer`}
          {fixed > 0 && `, ${fixed} fixiert`}
        </p>
        <button type="button" className="btn primary wide" disabled={!canRun} onClick={() => runCommand('numbering.renumber')} {...tip({ shortcut: 'numbering.renumber', desc: 'Vorschau alt → neu, dann übernehmen', ariaLabel: false })}>
          Neu nummerieren … {keyLabel('numbering.renumber') && <kbd>{keyLabel('numbering.renumber')}</kbd>}
        </button>
        {manual && <p className="hint">{canRun ? 'Diese Page wird manuell nummeriert; ihre Nummern bleiben belegt.' : 'Manuell: Nummern im Feld „Platznummer“ der Geschäfte eintragen.'}</p>}
      </div>
    </section>
  );
}
