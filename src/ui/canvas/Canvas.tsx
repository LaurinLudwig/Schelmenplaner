import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { runCommand } from '../../app/commands';
import { fmt } from '../../core/format';
import type { FestplatzPage, Vec, View } from '../../core/model/types';
import { defaultView, screenToWorld, zoomAt } from '../../core/viewport';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { tip } from '../shortcuts/tip';
import { interpretWheel } from './wheel';

const isTextField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

interface PanDrag {
  pointerId: number;
  x0: number;
  y0: number;
  view0: View;
  moved: boolean;
}

/**
 * Zeichenfläche (SVG). Weltkoordinaten in Metern; die Ansicht `view` bildet sie auf Pixel ab.
 * M1: Zoom und Pan, Orientierungsraster, Statusleiste. Objekte folgen ab M3.
 */
export function Canvas({ page }: { page: FestplatzPage }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const size = useStore((s) => s.ui.viewport);
  const storedView = useStore((s) => s.views[page.id]);
  const tool = useStore((s) => s.ui.tool);
  const setView = useStore((s) => s.setView);
  const setUi = useStore((s) => s.setUi);
  const view = storedView ?? defaultView(size.w, size.h);
  // Aktuelle Ansicht für Ereignis-Handler (Rad, Ziehen), ohne sie bei jeder Änderung neu zu registrieren
  const viewRef = useRef(view);
  useLayoutEffect(() => {
    viewRef.current = view;
  });

  const [cursor, setCursor] = useState<Vec | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [altDown, setAltDown] = useState(false);
  const [panning, setPanning] = useState(false);
  const drag = useRef<PanDrag | null>(null);

  // Größe der Zeichenfläche verfolgen
  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => setUi({ viewport: { w: el.clientWidth, h: el.clientHeight } });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setUi]);

  // Leertaste = temporäre Hand, Alt = Zoom-Werkzeug verkleinert
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltDown(true);
      if (e.code !== 'Space' || isTextField(e.target) || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      // Fokussierte Buttons würden sonst per Leertaste ausgelöst
      if (e.target instanceof HTMLButtonElement) e.target.blur();
      setSpaceDown(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltDown(false);
      if (e.code === 'Space') setSpaceDown(false);
    };
    const reset = () => {
      setSpaceDown(false);
      setAltDown(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', reset);
    };
  }, []);

  // Mausrad und Pinch zoomen um den Mauszeiger, Zwei-Finger-Wischen verschiebt (siehe wheel.ts)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const at = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    // Direkt aus dem Store lesen: Trackpads feuern mehrere Ereignisse pro Bild, der Ref wäre dann veraltet.
    const current = () => useStore.getState().views[page.id] ?? viewRef.current;
    // Safari/WKWebView: Pinch kommt als Geste mit fortlaufendem Gesamtfaktor `scale`
    let gestureScale: number | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (gestureScale !== null) return;
      const legacy = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
      const action = interpretWheel({
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        ctrlKey: e.ctrlKey,
        ...(legacy !== undefined ? { wheelDeltaY: legacy } : {}),
      });
      const v = current();
      setView(page.id, action.kind === 'zoom' ? zoomAt(v, action.factor, at(e)) : { ...v, tx: v.tx + action.dx, ty: v.ty + action.dy });
    };
    type GestureLike = Event & { scale: number; clientX: number; clientY: number };
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureScale = 1;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as GestureLike;
      if (gestureScale === null || !(g.scale > 0)) return;
      const factor = g.scale / gestureScale;
      gestureScale = g.scale;
      setView(page.id, zoomAt(current(), factor, at(g)));
    };
    const onGestureEnd = (e: Event) => {
      e.preventDefault();
      gestureScale = null;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGestureStart);
    el.addEventListener('gesturechange', onGestureChange);
    el.addEventListener('gestureend', onGestureEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
      el.removeEventListener('gestureend', onGestureEnd);
    };
  }, [page.id, setView]);

  const localPoint = (e: React.PointerEvent): Vec => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const wantsPan = e.button === 1 || (e.button === 0 && (spaceDown || tool === 'hand'));
    if (wantsPan) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, view0: viewRef.current, moved: false };
      setPanning(true);
      return;
    }
    if (e.button === 0 && tool === 'zoom') {
      setView(page.id, zoomAt(viewRef.current, e.altKey ? 0.5 : 2, localPoint(e)));
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    setCursor(screenToWorld(viewRef.current, localPoint(e)));
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    d.moved = true;
    setView(page.id, { ...d.view0, tx: d.view0.tx + e.clientX - d.x0, ty: d.view0.ty + e.clientY - d.y0 });
  };

  const endPan = () => {
    drag.current = null;
    setPanning(false);
  };

  const grid = useMemo(() => buildGrid(view, size.w, size.h, page.grid.size), [view, size.w, size.h, page.grid.size]);
  const origin = { x: view.tx, y: view.ty };

  const classes = ['stage', `tool-${tool}`];
  if (spaceDown || panning) classes.push('panning');
  if (panning) classes.push('dragging');
  if (altDown) classes.push('alt');

  return (
    <main className={classes.join(' ')}>
      <svg
        ref={svgRef}
        className="canvas"
        aria-label={`Zeichenfläche ${page.name}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onPointerLeave={() => !drag.current && setCursor(null)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <path className="grid-minor" d={grid.minor} />
        <path className="grid-major" d={grid.major} />
        <path className="origin" d={`M${origin.x - 8} ${origin.y}H${origin.x + 8}M${origin.x} ${origin.y - 8}V${origin.y + 8}`} />
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>{/* Objekte ab M3 */}</g>
      </svg>
      <div className="statusbar">
        <span>
          x <b>{cursor ? fmt(cursor.x) : '–'}</b> y <b>{cursor ? fmt(cursor.y) : '–'}</b> m
        </span>
        <span>
          1 m = <b>{fmt(view.scale, view.scale < 10 ? 2 : 1)}</b> px
        </span>
        <div className="spacer" />
        <button type="button" className="icon-btn" onClick={() => runCommand('view.zoomOut')} {...tip({ shortcut: 'view.zoomOut', side: 'top' })}>
          <Icon name="zoomOut" size={16} />
        </button>
        <button type="button" className="icon-btn" onClick={() => runCommand('view.zoomIn')} {...tip({ shortcut: 'view.zoomIn', side: 'top' })}>
          <Icon name="zoom" size={16} />
        </button>
        <button type="button" className="icon-btn" onClick={() => runCommand('view.fit')} {...tip({ shortcut: 'view.fit', side: 'top' })}>
          <Icon name="fit" size={16} />
        </button>
      </div>
    </main>
  );
}

/**
 * Orientierungsraster in Bildschirmkoordinaten (Linien pixelgenau, wie im Prototyp).
 * Feine Linien im Abstand `step`, kräftige alle 10 Schritte; zu dichte Linien entfallen.
 */
function buildGrid(view: View, w: number, h: number, step: number): { minor: string; major: string } {
  let minor = '';
  let major = '';
  if (!(step > 0) || w === 0 || h === 0) return { minor, major };
  const { scale: k, tx, ty } = view;
  const minorOn = step * k >= 6;
  const majorStep = step * 10;
  if (majorStep * k < 6) return { minor, major };
  const unit = minorOn ? step : majorStep;
  const x0 = Math.floor(-tx / k / unit);
  const x1 = Math.ceil((w - tx) / k / unit);
  const y0 = Math.floor(-ty / k / unit);
  const y1 = Math.ceil((h - ty) / k / unit);
  const isMajor = (i: number) => (minorOn ? i % 10 === 0 : true);
  for (let i = x0; i <= x1; i++) {
    const sx = Math.round(tx + i * unit * k) + 0.5;
    const seg = `M${sx} 0V${h}`;
    if (isMajor(i)) major += seg;
    else minor += seg;
  }
  for (let i = y0; i <= y1; i++) {
    const sy = Math.round(ty + i * unit * k) + 0.5;
    const seg = `M0 ${sy}H${w}`;
    if (isMajor(i)) major += seg;
    else minor += seg;
  }
  return { minor, major };
}
