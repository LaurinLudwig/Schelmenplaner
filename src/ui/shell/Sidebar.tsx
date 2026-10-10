import { runCommand } from '../../app/commands';
import { Icon } from '../icons/Icon';
import { tip } from '../shortcuts/tip';

/** Rechte Seitenleiste: Eigenschaften der Auswahl und Ebenen. Inhalte folgen ab M3. */
export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Seitenleiste">
      <section className="panel">
        <div className="panel-head">
          <span>Eigenschaften</span>
          <div className="spacer" />
          <button type="button" className="icon-btn" onClick={() => runCommand('ui.sidebar')} {...tip({ shortcut: 'ui.sidebar', label: 'Seitenleiste ausblenden' })}>
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="panel-body">
          <p>Nichts ausgewählt.</p>
        </div>
      </section>
      <section className="panel">
        <div className="panel-head">Ebenen</div>
        <div className="panel-body">
          <p>Ebenen erscheinen, sobald es Objekte gibt (ab Meilenstein 3).</p>
        </div>
      </section>
    </aside>
  );
}
