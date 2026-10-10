import { runCommand } from '../../app/commands';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { PagePanel } from '../panels/PagePanel';
import { tip } from '../shortcuts/tip';

/** Rechte Seitenleiste: Eigenschaften der Auswahl bzw. der Festplatz-Page, später Ebenen (M3). */
export function Sidebar() {
  const page = useStore((s) => s.project.pages.find((p) => p.id === s.ui.activePage) ?? null);
  return (
    <aside className="sidebar" aria-label="Seitenleiste">
      <div className="sidebar-head">
        <span>{page ? page.name : 'Eigenschaften'}</span>
        <div className="spacer" />
        <button type="button" className="icon-btn" onClick={() => runCommand('ui.sidebar')} {...tip({ shortcut: 'ui.sidebar', label: 'Seitenleiste ausblenden' })}>
          <Icon name="close" size={14} />
        </button>
      </div>
      <div className="sidebar-scroll">
        {page && <PagePanel page={page} />}
        <section className="panel">
          <div className="panel-head">Ebenen</div>
          <div className="panel-body">
            <p>Ebenen erscheinen, sobald es Objekte gibt (ab Meilenstein 3).</p>
          </div>
        </section>
      </div>
    </aside>
  );
}
