import { useRef, useState } from 'react';
import { moveBy as moveBackground, type BgTransform } from '../../../core/background';
import { boundsOfRects, resizeRect, type Handle } from '../../../core/geometry/rect';
import { objectsInBounds, pickObject } from '../../../core/hit';
import type { EdgeIndex, Id, Vec } from '../../../core/model/types';
import { findObjects, LIMITS } from '../../../core/objects';
import { angleTo, moveRects, rotateRects, snapAngle, type RectMap } from '../../../core/transform';
import { commitRects, select, setAreaFront } from '../../../state/objects';
import { updateBackground } from '../../../state/pageSettings';
import { useStore } from '../../../state/store';
import { tip } from '../../shortcuts/tip';
import { hitHandle, resizeCursor, selectionGeometry, type HandleHit } from './selectionGeometry';
import type { ToolContext, ToolHandlers } from './types';

/** Ab dieser Mausbewegung (px) wird aus einem Klick ein Ziehen. */
const DRAG_PX = 3;

type Gesture =
  /** Maus gedrückt, noch nicht bewegt: Klick oder Ziehen? */
  | { kind: 'pending'; start: Vec; startWorld: Vec; onClick: () => void; onDrag: 'move' | 'marquee' | 'none'; shift: boolean }
  | { kind: 'move'; startWorld: Vec; rects0: RectMap }
  | { kind: 'rotate'; pivot: Vec; a0: number; rects0: RectMap; single: number | null; start: Vec; moved: boolean }
  | { kind: 'resize'; id: Id; handle: Handle; rects0: RectMap; start: Vec; moved: boolean }
  | { kind: 'marquee'; start: Vec; cur: Vec; base: Id[] }
  | { kind: 'background'; start: Vec; transform0: BgTransform };

const LABEL = { move: 'Verschieben', rotate: 'Drehen', resize: 'Größe ändern' } as const;
const EDGE_OF_HANDLE: Record<string, EdgeIndex> = { '0,-1': 0, '1,0': 1, '0,1': 2, '-1,0': 3 };

/**
 * Auswahlwerkzeug (V): Objekte auswählen (Klick, Shift+Klick, Auswahlrechteck), verschieben,
 * drehen (Drehgriff, Shift = 15°), Grundflächen per Griff skalieren, Vorderseite per Kantenklick.
 * Jede Geste läuft über die Vorschau im Store und wird beim Loslassen als EIN Undo-Schritt übernommen;
 * Esc bricht sie ab. Ein nicht gesperrter Hintergrund wird wie in M2 verschoben.
 */
export function useSelectTool(ctx: ToolContext, active: boolean): ToolHandlers {
  const gesture = useRef<Gesture | null>(null);
  const [marquee, setMarquee] = useState<{ a: Vec; b: Vec } | null>(null);
  const [hover, setHover] = useState<{ handle: HandleHit | null; object: boolean } | null>(null);
  const [moving, setMoving] = useState(false);
  const selection = useStore((s) => s.ui.selection);
  const ids = selection?.kind === 'objects' ? selection.ids : [];
  const geo = active ? selectionGeometry(ctx.page, ids, ctx.view) : null;
  const pageId = ctx.page.id;

  const rectsOf = (list: readonly Id[]): RectMap => {
    // Ausgangsrechtecke aus dem Projekt (nicht aus einer womöglich laufenden Vorschau)
    const page = useStore.getState().project.pages.find((p) => p.id === pageId);
    return page ? Object.fromEntries(findObjects(page, list).map((o) => [o.obj.id, o.obj])) : {};
  };
  const setPreview = (rects: RectMap) => useStore.getState().setPreview({ pageId, rects });

  const startGesture = (g: Gesture) => {
    gesture.current = g;
  };

  const finish = (commit: boolean) => {
    const g = gesture.current;
    gesture.current = null;
    setMarquee(null);
    setMoving(false);
    const st = useStore.getState();
    if (!g) return;
    if (g.kind === 'background') {
      st.commitTransaction();
      return;
    }
    if (g.kind === 'move' || g.kind === 'rotate' || g.kind === 'resize') {
      const preview = st.preview;
      if (commit && preview?.pageId === pageId) commitRects(pageId, preview.rects, LABEL[g.kind]);
      st.setPreview(null);
    }
  };

  const handlers: ToolHandlers = {
    onPointerDown(p) {
      if (!active) return false;
      const st = useStore.getState();
      const current = st.ui.selection?.kind === 'objects' ? st.ui.selection.ids : [];
      const handle = hitHandle(geo, p.screen);

      if (handle?.kind === 'rotate' && geo) {
        const rects0 = rectsOf(current);
        const single = current.length === 1 ? (rects0[current[0]!]?.rot ?? 0) : null;
        startGesture({ kind: 'rotate', pivot: geo.pivot, a0: angleTo(geo.pivot, p.world), rects0, single, start: p.screen, moved: false });
        return true;
      }
      if (handle?.kind === 'resize') {
        const id = current[0]!;
        startGesture({ kind: 'resize', id, handle: handle.handle, rects0: rectsOf([id]), start: p.screen, moved: false });
        return true;
      }
      if (handle?.kind === 'edge') {
        const edge: EdgeIndex = handle.edge;
        const id = current[0]!;
        startGesture({ kind: 'pending', start: p.screen, startWorld: p.world, shift: p.shiftKey, onDrag: 'move', onClick: () => setAreaFront(pageId, id, edge) });
        return true;
      }

      const hit = pickObject(ctx.page, p.world);
      if (hit) {
        const isSelected = current.includes(hit.id);
        if (p.shiftKey) {
          // Shift: umschalten; Ziehen auf einer schon ausgewählten Gruppe verschiebt sie
          const next = isSelected ? current.filter((x) => x !== hit.id) : [...current, hit.id];
          if (hit.kind === 'stand' || isSelected) select(next);
          startGesture({
            kind: 'pending',
            start: p.screen,
            startWorld: p.world,
            shift: true,
            onDrag: hit.kind === 'stand' && !isSelected ? 'move' : hit.kind === 'area' ? 'marquee' : 'none',
            onClick: () => hit.kind === 'area' && !isSelected && select(next),
          });
          return true;
        }
        if (hit.kind === 'stand' || isSelected) {
          if (!isSelected) select([hit.id]);
          startGesture({
            kind: 'pending',
            start: p.screen,
            startWorld: p.world,
            shift: false,
            onDrag: 'move',
            // Klick ohne Ziehen auf ein Objekt einer Mehrfachauswahl wählt nur dieses
            onClick: () => isSelected && current.length > 1 && select([hit.id]),
          });
          return true;
        }
        // Nicht ausgewählte Grundfläche: Klick wählt sie aus, Ziehen zieht ein Auswahlrechteck auf
        startGesture({ kind: 'pending', start: p.screen, startWorld: p.world, shift: false, onDrag: 'marquee', onClick: () => select([hit.id]) });
        return true;
      }

      const page = ctx.page;
      const bg = page.background;
      if (bg && !bg.locked && page.layers.background.visible && p.target?.closest('[data-kind="background"]')) {
        st.setUi({ selection: { kind: 'background' } });
        st.beginTransaction('Hintergrund verschieben');
        startGesture({ kind: 'background', start: p.world, transform0: bg.transform });
        return true;
      }

      startGesture({
        kind: 'pending',
        start: p.screen,
        startWorld: p.world,
        shift: p.shiftKey,
        onDrag: 'marquee',
        onClick: () => !p.shiftKey && st.ui.selection && st.setUi({ selection: null }),
      });
      return true;
    },

    onPointerMove(p) {
      if (!active) return;
      const g = gesture.current;
      if (!g) {
        const handle = hitHandle(geo, p.screen);
        const object = !handle && !!pickObject(ctx.page, p.world);
        if (hover?.object !== object || JSON.stringify(hover?.handle ?? null) !== JSON.stringify(handle)) setHover({ handle, object });
        return;
      }
      switch (g.kind) {
        case 'pending': {
          if (Math.hypot(p.screen.x - g.start.x, p.screen.y - g.start.y) < DRAG_PX) return;
          const st = useStore.getState();
          if (g.onDrag === 'move') {
            const sel = st.ui.selection?.kind === 'objects' ? st.ui.selection.ids : [];
            startGesture({ kind: 'move', startWorld: g.startWorld, rects0: rectsOf(sel) });
            setMoving(true);
          } else if (g.onDrag === 'marquee') {
            const base = g.shift && st.ui.selection?.kind === 'objects' ? st.ui.selection.ids : [];
            startGesture({ kind: 'marquee', start: g.startWorld, cur: g.startWorld, base });
          } else {
            gesture.current = null;
            return;
          }
          handlers.onPointerMove(p);
          return;
        }
        case 'move':
          setPreview(moveRects(g.rects0, { x: p.world.x - g.startWorld.x, y: p.world.y - g.startWorld.y }, undefined, { altKey: p.altKey }));
          return;
        case 'rotate': {
          // Unter 3 px ist es ein Klick: keine Änderung, kein Undo-Schritt (QA-M3-03)
          if (!g.moved && Math.hypot(p.screen.x - g.start.x, p.screen.y - g.start.y) < DRAG_PX) return;
          g.moved = true;
          const delta = angleTo(g.pivot, p.world) - g.a0;
          const step = p.shiftKey ? 15 : 1;
          const applied = g.single !== null ? snapAngle(g.single + delta, step) - g.single : snapAngle(delta, step);
          setPreview(rotateRects(g.rects0, g.pivot, applied));
          return;
        }
        case 'resize': {
          if (!g.moved && Math.hypot(p.screen.x - g.start.x, p.screen.y - g.start.y) < DRAG_PX) return;
          g.moved = true;
          const r0 = g.rects0[g.id];
          if (r0) setPreview({ [g.id]: resizeRect(r0, g.handle, p.world, LIMITS.area.min, LIMITS.area.max) });
          return;
        }
        case 'marquee':
          g.cur = p.world;
          setMarquee({ a: g.start, b: p.world });
          return;
        case 'background':
          updateBackground(pageId, 'Hintergrund verschieben', { transform: moveBackground(g.transform0, p.world.x - g.start.x, p.world.y - g.start.y) });
          return;
      }
    },

    onPointerUp() {
      if (!active) return;
      const g = gesture.current;
      if (g?.kind === 'pending') {
        gesture.current = null;
        g.onClick();
        return;
      }
      // Klick ohne Ziehen auf den Griff in einer Kantenmitte: diese Kante wird Vorderseite
      if (g?.kind === 'resize' && !g.moved) {
        const edge = EDGE_OF_HANDLE[`${g.handle.hx},${g.handle.hy}`];
        finish(false);
        if (edge !== undefined) setAreaFront(pageId, g.id, edge);
        return;
      }
      if (g?.kind === 'marquee') {
        const b = { minX: Math.min(g.start.x, g.cur.x), minY: Math.min(g.start.y, g.cur.y), maxX: Math.max(g.start.x, g.cur.x), maxY: Math.max(g.start.y, g.cur.y) };
        const found = objectsInBounds(ctx.page, b);
        select([...new Set([...g.base, ...found])]);
      }
      finish(true);
    },

    onKeyDown(e) {
      if (!active || e.key !== 'Escape' || !gesture.current) return false;
      if (gesture.current.kind === 'background') return false;
      finish(false);
      return true;
    },
    overlay: null,
    panel: null,
  };

  if (active) {
    const h = hover?.handle;
    handlers.cursor = moving ? 'cursor-move' : !h ? (hover?.object ? 'cursor-move' : undefined) : h.kind === 'rotate' ? 'cursor-rotate' : h.kind === 'resize' && geo ? resizeCursor(geo, h.handle) : 'cursor-pointer';
    handlers.overlay = (
      <g className="selection-overlay">
        {geo && (
          <>
            {geo.objects.length > 1 && <GroupBox ctx={ctx} ids={ids} />}
            {geo.edges.map((e) => (
              <line
                key={e.edge}
                className={`edge-hit${h?.kind === 'edge' && h.edge === e.edge ? ' hover' : ''}`}
                x1={e.a.x}
                y1={e.a.y}
                x2={e.b.x}
                y2={e.b.y}
                {...tip({ label: 'Als Vorderseite festlegen', desc: 'Klicken: diese Kante wird Vorderseite. Die Fläche bleibt, wo sie ist.', side: 'top' })}
              />
            ))}
            <line className="rotate-line" x1={geo.rotateBase.x} y1={geo.rotateBase.y} x2={geo.rotateHandle.x} y2={geo.rotateHandle.y} />
            <circle className="rotate-handle" data-testid="rotate-handle" cx={geo.rotateHandle.x} cy={geo.rotateHandle.y} r={5.5} />
            {geo.resize.map((r) => (
              <rect key={`${r.handle.hx}${r.handle.hy}`} className="resize-handle" data-handle={`${r.handle.hx},${r.handle.hy}`} x={r.p.x - 4} y={r.p.y - 4} width={8} height={8} />
            ))}
          </>
        )}
        {marquee && <MarqueeRect ctx={ctx} a={marquee.a} b={marquee.b} />}
      </g>
    );
  }
  return handlers;
}

function MarqueeRect({ ctx, a, b }: { ctx: ToolContext; a: Vec; b: Vec }) {
  const p = ctx.toScreen(a);
  const q = ctx.toScreen(b);
  return <rect className="marquee" x={Math.min(p.x, q.x)} y={Math.min(p.y, q.y)} width={Math.abs(q.x - p.x)} height={Math.abs(q.y - p.y)} />;
}

/** Gestricheltes Hüllrechteck einer Mehrfachauswahl. */
function GroupBox({ ctx, ids }: { ctx: ToolContext; ids: readonly Id[] }) {
  const b = boundsOfRects(findObjects(ctx.page, ids).map((o) => o.obj));
  if (!b) return null;
  const p = ctx.toScreen({ x: b.minX, y: b.minY });
  const q = ctx.toScreen({ x: b.maxX, y: b.maxY });
  return <rect className="group-box" x={p.x} y={p.y} width={q.x - p.x} height={q.y - p.y} />;
}
