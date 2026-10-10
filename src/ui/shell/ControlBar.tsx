import { runCommand } from '../../app/commands';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { tip } from '../shortcuts/tip';

/** Kontextabhängige Steuerungsleiste. Ab M3 erscheinen hier X, Y, Breite, Tiefe und Drehung der Auswahl. */
export function ControlBar() {
  const pageName = useStore((s) => s.project.pages.find((p) => p.id === s.ui.activePage)?.name ?? '');
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen);
  return (
    <div className="controlbar">
      <span className="title">{pageName}</span>
      <span>Keine Auswahl</span>
      <div className="spacer" />
      <button
        type="button"
        className="icon-btn"
        aria-pressed={sidebarOpen}
        onClick={() => runCommand('ui.sidebar')}
        {...tip({ shortcut: 'ui.sidebar', label: sidebarOpen ? 'Seitenleiste ausblenden' : 'Seitenleiste einblenden' })}
      >
        <Icon name={sidebarOpen ? 'sidebarClose' : 'sidebarOpen'} />
      </button>
    </div>
  );
}
