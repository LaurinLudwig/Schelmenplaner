import { useMemo } from 'react';
import { freeOf } from '../../app/startPageData';
import { showWarnings } from '../../app/startPageNav';
import { fmt } from '../../core/format';
import { CONNECTION_LABEL } from '../../core/label';
import { CONNECTION_KEYS, type ConnectionKey } from '../../core/power';
import { projectStats } from '../../core/stats';
import type { WarningCount } from '../../core/warnings';
import { addPage } from '../../state/pages';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { PowerMeter } from '../panels/PowerMeter';
import { tip } from '../shortcuts/tip';

const CONN_SHORT: Record<ConnectionKey, string> = { ...CONNECTION_LABEL, none: 'ohne' };

/**
 * Kennzahlen-Leiste (M6-01, spec.md §7): „Gesamt“ und eine Karte je Festplatz mit Anzahl, Frontmeter, Strom gegen
 * das Limit, Anschlussarten und Warnzahl. Klick auf den Namen öffnet die Page, auf die Warnzahl die gefilterte Tabelle.
 */
export function StatsBar() {
  const pages = useStore((s) => s.project.pages);
  const settings = useStore((s) => s.project.settings);
  const setUi = useStore((s) => s.setUi);
  const stats = useMemo(() => projectStats({ pages, settings }, freeOf(settings.minFreeWidth)), [pages, settings]);
  const t = stats.total;
  return (
    <div className="sp-stats" data-testid="stats">
      <article className="stat-card total" data-testid="stat-total" aria-label="Gesamt">
        <h2>Gesamt</h2>
        <Figures stands={t.stands} frontM={t.frontM} freeFrontM={t.freeFrontM} />
        <div className="stat-power">
          <Icon name="bolt" size={14} /> {fmt(t.sumKw)} kW
        </div>
        <Connections by={t.byConnection} />
        <Warn count={t.warnings} pageId={null} />
      </article>
      {stats.pages.map((p) => (
        <article key={p.pageId} className="stat-card" data-testid="stat-page" aria-label={p.name}>
          <h2>
            <button type="button" className="link-btn" onClick={() => setUi({ activePage: p.pageId })} {...tip({ label: `${p.name} öffnen`, side: 'bottom' })}>
              {p.name}
            </button>
          </h2>
          <Figures stands={p.stands} frontM={p.frontM} freeFrontM={p.freeFrontM} />
          {p.power.limitKw === null ? (
            <div className="stat-power">
              <Icon name="bolt" size={14} /> {fmt(p.power.sumKw)} kW <span className="muted">· kein Limit</span>
            </div>
          ) : (
            <PowerMeter power={p.power} compact />
          )}
          <Connections by={p.power.byConnection} />
          <Warn count={p.warnings} pageId={p.pageId} />
        </article>
      ))}
      <button type="button" className="stat-card add card link" onClick={() => addPage()} {...tip({ shortcut: 'page.new', label: 'Neuer Festplatz', ariaLabel: false })}>
        <Icon name="add" size={16} /> Neuer Festplatz
      </button>
    </div>
  );
}

function Figures({ stands, frontM, freeFrontM }: { stands: number; frontM: number; freeFrontM: number }) {
  return (
    <dl className="stat-figures">
      <div>
        <dt>Geschäfte</dt>
        <dd data-testid="stat-stands">{fmt(stands, 0)}</dd>
      </div>
      <div>
        <dt>Frontmeter</dt>
        <dd data-testid="stat-front">{fmt(frontM)} m</dd>
      </div>
      <div title="Summe der Breiten aller Freiflächen ab der Mindestbreite">
        <dt>frei</dt>
        <dd data-testid="stat-free" className="free">
          {fmt(freeFrontM)} m
        </dd>
      </div>
    </dl>
  );
}

function Connections({ by }: { by: Record<ConnectionKey, { count: number; kw: number }> }) {
  const used = CONNECTION_KEYS.filter((k) => by[k].count > 0);
  if (!used.length) return null;
  return (
    <ul className="stat-conn" data-testid="stat-conn">
      {used.map((k) => (
        <li key={k}>
          <span>{CONN_SHORT[k]}</span>
          <span>
            {by[k].count} · {fmt(by[k].kw)} kW
          </span>
        </li>
      ))}
    </ul>
  );
}

function Warn({ count, pageId }: { count: WarningCount; pageId: string | null }) {
  if (!count.stands) return <div className="stat-ok">keine Warnungen</div>;
  const parts = [
    count.overlap ? `${count.overlap} Überlappung${count.overlap === 1 ? '' : 'en'}` : '',
    count.outside ? `${count.outside} außerhalb` : '',
    count.duplicate ? `${count.duplicate} mit doppelter Nummer` : '',
  ].filter(Boolean);
  return (
    <button
      type="button"
      className={`stat-warn${count.overlap ? ' overlap' : ''}`}
      data-testid="stat-warn"
      onClick={() => showWarnings(pageId)}
      {...tip({ label: `${parts.join(', ')} – in der Tabelle zeigen`, side: 'bottom', ariaLabel: false })}
    >
      <Icon name="warning" size={14} /> {count.stands} {count.stands === 1 ? 'Warnung' : 'Warnungen'}
    </button>
  );
}
