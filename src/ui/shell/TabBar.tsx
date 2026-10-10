import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { confirmDeletePage, runCommand } from '../../app/commands';
import type { Id } from '../../core/model/types';
import { addPage, duplicatePage, movePage, renamePage } from '../../state/pages';
import { selectCanRedo, selectCanUndo, selectDirty, START_PAGE, useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { tip } from '../shortcuts/tip';
import { Menu, type MenuItem } from './Menu';

interface DragState {
  id: Id;
  startX: number;
  active: boolean;
  /** Zielindex in der Liste nach dem Entfernen der gezogenen Page. */
  target: number;
}

export function TabBar() {
  const pages = useStore((s) => s.project.pages);
  const active = useStore((s) => s.ui.activePage);
  const renaming = useStore((s) => s.ui.renamingPage);
  const dirty = useStore(selectDirty);
  const fileName = useStore((s) => s.fileName);
  const canUndo = useStore(selectCanUndo);
  const canRedo = useStore(selectCanRedo);
  const theme = useStore((s) => s.ui.theme);
  const setUi = useStore((s) => s.setUi);

  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const tabRefs = useRef(new Map<Id, HTMLElement>());

  const openAppMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cmd = (id: string) => () => runCommand(id);
    setMenu({
      x: r.left,
      y: r.bottom,
      items: [
        { label: 'Neues Projekt', shortcut: 'file.new', onSelect: cmd('file.new') },
        { label: 'Öffnen …', shortcut: 'file.open', onSelect: cmd('file.open') },
        { label: 'Speichern', shortcut: 'file.save', onSelect: cmd('file.save') },
        { label: 'Speichern unter …', shortcut: 'file.saveAs', onSelect: cmd('file.saveAs') },
        'separator',
        { label: 'Rückgängig', shortcut: 'edit.undo', onSelect: cmd('edit.undo'), disabled: !canUndo },
        { label: 'Wiederholen', shortcut: 'edit.redo', onSelect: cmd('edit.redo'), disabled: !canRedo },
        'separator',
        { label: theme === 'dark' ? 'Helles Design' : 'Dunkles Design', shortcut: 'ui.theme', onSelect: cmd('ui.theme') },
        { label: 'Tastaturkürzel', shortcut: 'ui.shortcuts', onSelect: cmd('ui.shortcuts') },
      ],
    });
  };

  const openTabMenu = (e: React.MouseEvent, id: Id) => {
    e.preventDefault();
    setUi({ activePage: id });
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Umbenennen', shortcut: 'page.rename', onSelect: () => setUi({ renamingPage: id }) },
        { label: 'Duplizieren', shortcut: 'page.duplicate', onSelect: () => duplicatePage(id) },
        'separator',
        { label: 'Löschen', shortcut: 'page.delete', danger: true, onSelect: () => void confirmDeletePage(id) },
      ],
    });
  };

  // ---------- Umsortieren per Ziehen (Zeigerereignisse statt HTML5-Drag&Drop, das in Tauri unter Windows kollidiert) ----------
  const onTabPointerDown = (e: ReactPointerEvent, id: Id) => {
    if (e.button !== 0 || renaming === id) return;
    setUi({ activePage: id });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id, startX: e.clientX, active: false, target: pages.findIndex((p) => p.id === id) });
  };
  const onTabPointerMove = (e: ReactPointerEvent) => {
    if (!drag) return;
    if (!drag.active && Math.abs(e.clientX - drag.startX) < 5) return;
    const others = pages.filter((p) => p.id !== drag.id);
    let target = others.length;
    for (let i = 0; i < others.length; i++) {
      const r = tabRefs.current.get(others[i]!.id)?.getBoundingClientRect();
      if (r && e.clientX < r.left + r.width / 2) {
        target = i;
        break;
      }
    }
    setDrag({ ...drag, active: true, target });
  };
  const onTabPointerUp = () => {
    if (drag?.active) movePage(drag.id, drag.target);
    setDrag(null);
  };

  // Markierung, wo die gezogene Page landet
  const dropClass = (id: Id): string => {
    if (!drag?.active || id === drag.id) return '';
    const others = pages.filter((p) => p.id !== drag.id);
    const i = others.findIndex((p) => p.id === id);
    if (i === drag.target) return ' drop-before';
    if (i === others.length - 1 && drag.target === others.length) return ' drop-after';
    return '';
  };

  return (
    <header className="tabbar">
      <button
        type="button"
        className="menu-btn"
        aria-haspopup="menu"
        aria-expanded={!!menu}
        onClick={openAppMenu}
        {...tip({ label: 'Menü', desc: 'Datei, Bearbeiten, Darstellung' })}
      >
        <Icon name="menu" />
      </button>
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={active === START_PAGE}
          onClick={() => setUi({ activePage: START_PAGE })}
          {...tip({ shortcut: 'page.start', label: 'Start-Page', desc: 'Statistik, Listen und Projekteinstellungen' })}
        >
          <Icon name="home" size={15} />
          <span className="label">Start</span>
        </button>
        {pages.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              if (el) tabRefs.current.set(p.id, el);
              else tabRefs.current.delete(p.id);
            }}
            role="tab"
            tabIndex={0}
            className={`tab${drag?.active && drag.id === p.id ? ' dragging' : ''}${dropClass(p.id)}`}
            aria-selected={active === p.id}
            onPointerDown={(e) => onTabPointerDown(e, p.id)}
            onPointerMove={onTabPointerMove}
            onPointerUp={onTabPointerUp}
            onPointerCancel={() => setDrag(null)}
            onDoubleClick={() => setUi({ renamingPage: p.id })}
            onContextMenu={(e) => openTabMenu(e, p.id)}
            {...(i < 9 ? tip({ shortcut: `page.goto${i + 1}`, label: p.name, desc: 'Doppelklick: umbenennen · Rechtsklick: Menü · Ziehen: umsortieren' }) : tip({ label: p.name }))}
          >
            {renaming === p.id ? (
              <RenameInput
                initial={p.name}
                onDone={(name) => {
                  if (name !== null) renamePage(p.id, name);
                  setUi({ renamingPage: null });
                }}
              />
            ) : (
              <span className="label">{p.name}</span>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="tab-add" onClick={() => addPage()} {...tip({ shortcut: 'page.new', desc: 'Neue Festplatz-Page anlegen' })}>
        <Icon name="add" />
      </button>
      <div className="spacer" />
      <div className="file-state" {...tip({ label: dirty ? 'Ungespeicherte Änderungen' : 'Gespeichert', side: 'bottom' })}>
        {dirty && <span className="dot" />}
        <span>{fileName ?? 'Nicht gespeichert'}</span>
      </div>
      {menu && <Menu {...menu} onClose={() => setMenu(null)} />}
    </header>
  );
}

function RenameInput({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const finish = (value: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(value);
  };
  return (
    <input
      ref={ref}
      defaultValue={initial}
      aria-label="Name des Festplatzes"
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => finish(e.currentTarget.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(e.currentTarget.value);
        if (e.key === 'Escape') finish(null);
      }}
    />
  );
}
