import { fmt } from '../../core/format';
import { CONNECTION_LABEL } from '../../core/label';
import type { FestplatzPage } from '../../core/model/types';
import { CONNECTION_KEYS, pagePower, POWER_LIMIT } from '../../core/power';
import { setBlockOverLimit, setPowerLimit } from '../../state/pageSettings';
import { NumberField } from './NumberField';

const LEVEL_TEXT = { ok: '', warn: 'ab 90 % des Limits', over: 'Limit überschritten', none: '' } as const;

/**
 * Strom der Festplatz-Page (M5-07 bis M5-11): Limit, Blockieren, Balken (grün, gelb ab 90 %, rot über
 * dem Limit) und Summen je Anschlussart. Immer sichtbar, auch bei Auswahl (spec.md §6).
 */
export function PowerPanel({ page }: { page: FestplatzPage }) {
  const p = pagePower(page);
  const pct = p.ratio === null ? null : Math.round(p.ratio * 100);
  return (
    <section className="panel" aria-label="Strom">
      <div className="panel-head">
        <span>Strom</span>
        <span className={`panel-badge power-${p.level}`} data-testid="power-sum">
          {p.limitKw === null ? `${fmt(p.sumKw)} kW` : `${fmt(p.sumKw)} / ${fmt(p.limitKw)} kW`}
        </span>
      </div>
      <div className="panel-body form">
        {p.limitKw !== null && (
          <div className="power-meter" data-testid="power-meter" data-level={p.level}>
            <div
              className={`power-bar ${p.level}`}
              role="meter"
              aria-label="Stromsumme gegenüber dem Limit"
              aria-valuemin={0}
              aria-valuemax={p.limitKw}
              aria-valuenow={p.sumKw}
              aria-valuetext={`${fmt(p.sumKw)} von ${fmt(p.limitKw)} kW`}
            >
              <span style={{ width: `${Math.min(100, (p.ratio ?? 0) * 100)}%` }} />
            </div>
            <span className="power-text">
              {fmt(p.sumKw)} / {fmt(p.limitKw)} kW ({pct} %){LEVEL_TEXT[p.level] && ` · ${LEVEL_TEXT[p.level]}`}
            </span>
          </div>
        )}
        <div className="fields-2">
          <NumberField
            id="power-limit"
            label="Limit"
            unit="kW"
            value={page.powerLimitKw}
            min={POWER_LIMIT.min}
            max={POWER_LIMIT.max}
            step={10}
            placeholder="kein Limit"
            onCommit={(v) => setPowerLimit(page.id, v)}
            onClear={() => setPowerLimit(page.id, null)}
          />
          <label className="check align-end">
            <input type="checkbox" checked={page.blockOverLimit} disabled={page.powerLimitKw === null} onChange={(e) => setBlockOverLimit(page.id, e.target.checked)} />
            Überschreitung blockieren
          </label>
        </div>
        <table className="power-table" data-testid="power-table">
          <tbody>
            {CONNECTION_KEYS.map((k) => (
              <tr key={k} className={p.byConnection[k].count ? '' : 'empty'}>
                <th>{k === 'none' ? 'ohne Angabe' : CONNECTION_LABEL[k]}</th>
                <td>
                  {p.byConnection[k].count} {p.byConnection[k].count === 1 ? 'Stand' : 'Stände'}
                </td>
                <td>{fmt(p.byConnection[k].kw)} kW</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Es zählen alle Geschäfte des Festplatzes. Leeres Limit = kein Limit.</p>
      </div>
    </section>
  );
}
