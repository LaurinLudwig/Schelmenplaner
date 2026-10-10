import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { runCommand } from '../../app/commands';
import { effectivePage } from '../../core/derive';
import { fmt } from '../../core/format';
import type { FestplatzPage, Rect, Vec, View } from '../../core/model/types';
import { findSnap, rectSnapSource } from '../../core/snap';
import { defaultView, screenToWorld, worldToScreen, zoomAt } from '../../core/viewport';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { tip } from '../shortcuts/tip';
import { BackgroundLayer } from './background/BackgroundLayer';
import { ObjectsLayer } from './objects/ObjectsLayer';
import type { ToolContext, ToolPointer } from './tools/types';
import { useCalibrateTool } from './tools/useCalibrateTool';
import { useCreateTool } from './tools/useCreateTool';
import { useMeasureTool } from './tools/useMeasureTool';
import { useSelectTool } from './tools/useSelectTool';
import { interpretWheel } from './wheel';

/** Fangradius in Bildschirmpixeln. */
const SNAP_PX = 8;
/** Unter dieser Schrifthöhe (px) wird die Beschriftung ausgeblendet. */
const MIN_LABEL_PX = 3;
/** Ab dieser Schrifthöhe (px) bekommt die Beschriftung einen hellen Rand (siehe ObjectsLayer). */
const HALO_LABEL_PX = 12;
const NO_SELECTION: ReadonlySet<string> = new Set();

const isTextField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

interface PanDrag {
  kind: 'pan';
  pointerId: number;
  x0: number;
  y0: number;
  view0: View;
}

/**
 * Zeichenfläche (SVG). Weltkoordinaten in Metern; die Ansicht `view` bildet sie auf Pixel ab.
 * Zoom und Pan, Raster, Hintergrund, Objekte (M3) und Werkzeuge. Während einer Geste zeigt sie die
 * Page mit eingesetzter Vorschau (core/derive.ts).
 */
export function Canvas({ page: storedPage }: { page: FestplatzPage }) {
  const preview = useStore((s) => s.preview);
  const page = useMemo(() => effectivePage(storedPage, preview), [storedPage, preview]);
  const categories = useStore((s) => s.project.categories);
  const labelTemplate = useStore((s) => s.project.settings.labelTemplate);
  const labelFontSize = useStore((s) => s.project.settings.labelFontSize);
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
  const selection = useStore((s) => s.ui.selection);
  const assets = useStore((s) => s.assets);
  const selectedIds = useMemo(() => (selection?.kind === 'objects' ? new Set(selection.ids) : NO_SELECTION), [selection]);

  // ---------- Werkzeuge ----------
  // Fang nur an sichtbaren Ebenen (M3-18); Quelle einmal pro Objektänderung aufbauen
  const snapSource = useMemo(() => {
    const rects: Rect[] = [];
    if (page.layers.areas.visible) rects.push(...page.areas);
    if (page.layers.stands.visible) rects.push(...page.stands);
    if (page.layers.infra.visible) rects.push(...page.infra);
    return rectSnapSource(rects);
  }, [page.areas, page.stands, page.infra, page.layers]);
  const ctx: ToolContext = {
    page,
    view,
    toScreen: (p) => worldToScreen(view, p),
    toWorld: (p) => screenToWorld(view, p),
    snap: (p) => findSnap(p, [snapSource], SNAP_PX / view.scale),
  };
  const measureTool = useMeasureTool(ctx, tool === 'measure');
  const calibrateTool = useCalibrateTool(ctx, tool === 'calibrate');
  const selectTool = useSelectTool(ctx, tool === 'select' && !spaceDown);
  const areaTool = useCreateTool(ctx, 'area', tool === 'area' && !spaceDown);
  const standTool = useCreateTool(ctx, 'stand', tool === 'stand' && !spaceDown);
  const activeTool =
    tool === 'measure' ? measureTool : tool === 'calibrate' ? calibrateTool : tool === 'select' ? selectTool : tool === 'area' ? areaTool : tool === 'stand' ? standTool : null;
  const activeToolRef = useRef(activeTool);
  useLayoutEffect(() => {
    activeToolRef.current = activeTool;
  });

  // Esc und weitere Tasten zuerst dem Werkzeug anbieten (bricht z. B. eine Geste ab); sonst greifen
  // die zentralen Shortcuts (Esc hebt dann die Auswahl auf, siehe edit.deselect)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTextField(e.target)) return;
      if (activeToolRef.current?.onKeyDown(e)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      const action = interpretWheel(
        {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaMode: e.deltaMode,
          ctrlKey: e.ctrlKey,
          ...(legacy !== undefined ? { wheelDeltaY: legacy } : {}),
        },
        useStore.getState().ui.invertPan,
      );
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

  const toolPointer = (e: React.PointerEvent): ToolPointer => {
    const screen = localPoint(e);
    return { screen, world: screenToWorld(viewRef.current, screen), shiftKey: e.shiftKey, altKey: e.altKey, target: e.target as Element | null };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const wantsPan = e.button === 1 || (e.button === 0 && (spaceDown || tool === 'hand'));
    if (wantsPan) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { kind: 'pan', pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, view0: viewRef.current };
      setPanning(true);
      return;
    }
    if (e.button !== 0) return;
    if (activeTool) {
      if (activeTool.onPointerDown(toolPointer(e))) e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'zoom') setView(page.id, zoomAt(viewRef.current, e.altKey ? 0.5 : 2, localPoint(e)));
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toolPointer(e);
    setCursor(p.world);
    activeTool?.onPointerMove(p);
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    setView(page.id, { ...d.view0, tx: d.view0.tx + e.clientX - d.x0, ty: d.view0.ty + e.clientY - d.y0 });
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current) {
      drag.current = null;
      setPanning(false);
      return;
    }
    activeTool?.onPointerUp(toolPointer(e));
  };

  const grid = useMemo(
    () => (page.grid.visible ? buildGrid(view, size.w, size.h, page.grid.size) : { minor: '', major: '' }),
    [view, size.w, size.h, page.grid.size, page.grid.visible],
  );
  const worldTransform = `translate(${view.tx} ${view.ty}) scale(${view.scale})`;
  const bg = page.background;
  const origin = { x: view.tx, y: view.ty };

  const classes = ['stage', `tool-${tool}`];
  if (spaceDown || panning) classes.push('panning');
  if (panning) classes.push('dragging');
  if (altDown) classes.push('alt');
  if (activeTool?.cursor && !spaceDown && !panning) classes.push(activeTool.cursor);

  return (
    <main className={classes.join(' ')}>
      <svg
        ref={svgRef}
        className={`canvas${bg && page.layers.background.visible ? ' has-bg' : ''}`}
        aria-label={`Zeichenfläche ${page.name}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => !drag.current && setCursor(null)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {bg && page.layers.background.visible && (
          <g transform={worldTransform}>
            <BackgroundLayer
              background={bg}
              bytes={assets[bg.assetId]}
              view={view}
              viewport={size}
              selected={selection?.kind === 'background'}
              interactive={tool === 'select' && !bg.locked && !spaceDown}
            />
          </g>
        )}
        <path className="grid-minor" d={grid.minor} />
        <path className="grid-major" d={grid.major} />
        <path className="origin" d={`M${origin.x - 8} ${origin.y}H${origin.x + 8}M${origin.x} ${origin.y - 8}V${origin.y + 8}`} />
        <g transform={worldTransform} className="world">
          <ObjectsLayer
            page={page}
            categories={categories}
            template={labelTemplate}
            fontSize={labelFontSize}
            selected={selectedIds}
            labelsTiny={labelFontSize * view.scale < MIN_LABEL_PX}
            labelHalo={labelFontSize * view.scale >= HALO_LABEL_PX}
          />
        </g>
        {activeTool?.overlay}
      </svg>
      {activeTool?.panel && <div className="tool-panel-host">{activeTool.panel}</div>}
      <NorthArrow angle={page.northAngle} />
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

/** Nordpfeil oben rechts; `angle` = Richtung Norden in Grad im Uhrzeigersinn ab „oben“. */
function NorthArrow({ angle }: { angle: number }) {
  return (
    <div className="north-arrow" {...tip({ label: `Norden: ${fmt(angle, 1)}°`, desc: 'Nordrichtung in der Seitenleiste einstellen', side: 'bottom' })}>
      <svg viewBox="-20 -20 40 40" width="40" height="40" aria-hidden="true">
        <circle r="18" className="north-ring" />
        <g transform={`rotate(${angle})`}>
          <path d="M0 -4 L4.5 13 L0 10 L-4.5 13 Z" className="north-needle" />
          <text y="-10.5" textAnchor="middle" dominantBaseline="central" className="north-n">
            N
          </text>
        </g>
      </svg>
    </div>
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
