import { runCommand } from '../../app/commands';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { ObjectPanel } from '../panels/ObjectPanel';
import { PagePanel } from '../panels/PagePanel';
import { CategoryPanel, FreeSpacePanel, LabelPanel, LayersPanel } from '../panels/ProjectPanels';
import { useSelectedObjects } from '../panels/selection';
import { tip } from '../shortcuts/tip';

/**
 * Rechte Seitenleiste: Eigenschaften der Auswahl (sonst die Einstellungen der Festplatz-Page),
 * darunter die projektweiten Bereiche Beschriftung, Freiflächen & Warnungen und Kategorien (bis M6)
 * und die Ebenen.
 */
export function Sidebar() {
  const page = useStore((s) => s.project.pages.find((p) => p.id === s.ui.activePage) ?? null);
  const sel = useSelectedObjects();
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
        {sel ? <ObjectPanel key={sel.objects.map((o) => o.obj.id).join(',')} sel={sel} /> : page && <PagePanel page={page} />}
        <LabelPanel />
        <FreeSpacePanel />
        <CategoryPanel />
        {page && <LayersPanel page={page} />}
      </div>
    </aside>
  );
}
