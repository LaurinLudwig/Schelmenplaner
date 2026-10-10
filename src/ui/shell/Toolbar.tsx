import { runCommand } from '../../app/commands';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { tip } from '../shortcuts/tip';
import { TOOL_GROUPS } from '../tools';

/** Vertikale Werkzeugleiste, nur Icons. Name, Beschreibung und Taste erscheinen im Tooltip. */
export function Toolbar() {
  const tool = useStore((s) => s.ui.tool);
  return (
    <nav className="toolbar" aria-label="Werkzeuge">
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} style={{ display: 'contents' }}>
          {gi > 0 && <div className="sep" />}
          {group.map((item) => {
            const pending = !!item.milestone;
            const pressed = item.kind === 'tool' && item.tool === tool;
            return (
              <button
                key={item.shortcut}
                type="button"
                className={`tool${item.kind === 'toggle' ? ' toggle' : ''}`}
                aria-pressed={pressed}
                disabled={pending}
                onClick={() => runCommand(item.shortcut)}
                {...tip({
                  shortcut: item.shortcut,
                  desc: pending ? `${item.description} – folgt in ${item.milestone}` : item.description,
                  side: 'right',
                })}
              >
                <Icon name={item.icon} size={18} />
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
