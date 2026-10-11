import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { moveBy as moveBackground, worldToBg, type BgTransform } from '../../../core/background';
import { boundsOfRects, resizeRect, type Handle } from '../../../core/geometry/rect';
import { objectsInBounds, pickObject } from '../../../core/hit';
import type { Area, EdgeIndex, Id, Stand, Vec } from '../../../core/model/types';
import { computeMoveSnap, type Guide, type SnapState } from '../../../core/moveSnap';
import { findObjects, LIMITS } from '../../../core/objects';
import { angleTo, rotateRects, snapAngle, type RectMap } from '../../../core/transform';
import { cloneForDrag, commitDuplicateDrag, commitRects, select, setAreaFront } from '../../../state/objects';
import { updateBackground } from '../../../state/pageSettings';
import { useStore } from '../../../state/store';
import { IS_MAC } from '../../shortcuts/keys';
import { tip } from '../../shortcuts/tip';
import { hitHandle, resizeCursor, selectionGeometry, type HandleHit } from './selectionGeometry';
import { SnapGuides } from './SnapGuides';
import { SNAP_PX, type ToolContext, type ToolHandlers, type ToolPointer } from './types';

/** Ab dieser Mausbewegung (px) wird aus einem Klick ein Ziehen. */
const DRAG_PX = 3;

type Gesture =
  /** Maus gedrückt, noch nicht bewegt: Klick oder Ziehen? */
  | { kind: 'pending'; start: Vec; startWorld: Vec; onClick: () => void; onDrag: 'move' | 'marquee' | 'none'; shift: boolean; grab: Id | null }
  | {
      kind: 'move';
      startWorld: Vec;
      rects0: RectMap;
      /** Gegriffenes Objekt: an ihm rastet der Fang ein (M4). */
      grabbed: Id | null;
      snap: SnapState;
      /** Kopien für Alt+Ziehen, sobald Alt einmal gedrückt war (M4-12). */
      copies: { areas: Area[]; stands: Stand[]; from: Record<Id, Id> } | null;
      last: ToolPointer;
    }
  | { kind: 'rotate'; pivot: Vec; a0: number; rects0: RectMap; single: number | null; start: Vec; moved: boolean }
  | { kind: 'resize'; id: Id; handle: Handle; rects0: RectMap; start: Vec; moved: boolean }
  | { kind: 'marquee'; start: Vec; cur: Vec; base: Id[] }
  | { kind: 'background'; start: Vec; transform0: BgTransform };

const LABEL = { move: 'Verschieben', rotate: 'Drehen', resize: 'Größe ändern' } as const;
/** Ein eingerasteter Stand löst sich erst bei diesem Abstand von der Vorderseite (Hysterese, M4-06). */
const RELEASE_PX = 2 * SNAP_PX;
const MODIFIER_KEYS = new Set(['Shift', 'Alt', 'Meta', 'Control']);
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
  const [hover, setHover] = useState<{ handle: HandleHit | null; object: boolean; alt: boolean } | null>(null);
  const [moving, setMoving] = useState<false | 'move' | 'copy'>(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const selection = useStore((s) => s.ui.selection);
  const ids = selection?.kind === 'objects' ? selection.ids : [];
  const geo = active ? selectionGeometry(ctx.page, ids, ctx.view) : null;
  const pageId = ctx.page.id;

  const rectsOf = (list: readonly Id[]): RectMap => {
    // Ausgangsrechtecke aus dem Projekt (nicht aus einer womöglich laufenden Vorschau)
    const page = useStore.getState().project.pages.find((p) => p.id === pageId);
    return page ? Object.fromEntries(findObjects(page, list).map((o) => [o.obj.id, o.obj])) : {};
  };
  /** Liegt der Weltpunkt auf dem Hintergrundplan? (geometrisch: Der Plan liegt in einer eigenen Ebene unter der Klickfläche) */
  const onBackground = (w: Vec) => {
    const bg = ctx.page.background;
    if (!bg) return false;
    const q = worldToBg(bg.transform, w);
    return q.x >= 0 && q.y >= 0 && q.x <= bg.pxSize.w && q.y <= bg.pxSize.h;
  };
  const setPreview = (rects: RectMap) => useStore.getState().setPreview({ pageId, rects });

  /**
   * Ein Schritt beim Verschieben: Shift beschränkt die Richtung, Alt dupliziert, Cmd/Strg schaltet den
   * Fang aus; sonst rasten Vorderkante, Nachbarstände und Raster ein (core/moveSnap.ts).
   */
  const moveStep = (g: Extract<Gesture, { kind: 'move' }>, p: ToolPointer) => {
    g.last = p;
    const st = useStore.getState();
    const stored = st.project.pages.find((x) => x.id === pageId);
    if (!stored) return;
    if (p.altKey && !g.copies) g.copies = cloneForDrag(stored, Object.keys(g.rects0));
    const copyIds = new Set(g.copies ? Object.keys(g.copies.from) : []);
    const movingIds = new Set(Object.keys(g.rects0));
    // Ziele des Fangs: alle übrigen sichtbaren Objekte; beim Duplizieren auch die Originale
    const isTarget = (id: Id) => !copyIds.has(id) && (p.altKey || !movingIds.has(id));
    const page = ctx.page;
    const snapCfg = st.project.settings.snap;
    const options = p.modKey
      ? { front: false, neighbors: false, grid: null }
      : { front: snapCfg.front, neighbors: snapCfg.neighbors, grid: snapCfg.grid && page.grid.visible ? page.grid.size : null };
    const r = computeMoveSnap({
      rects0: g.rects0,
      delta: { x: p.world.x - g.startWorld.x, y: p.world.y - g.startWorld.y },
      grabbed: g.grabbed,
      standIds: new Set(stored.stands.filter((x) => movingIds.has(x.id)).map((x) => x.id)),
      areas: page.layers.areas.visible ? page.areas.filter((a) => isTarget(a.id)) : [],
      stands: page.layers.stands.visible ? page.stands.filter((x) => isTarget(x.id)) : [],
      options,
      tol: SNAP_PX / ctx.view.scale,
      release: RELEASE_PX / ctx.view.scale,
      state: g.snap,
      shift: p.shiftKey,
    });
    g.snap = r.state;
    setGuides(r.guides);
    setMoving(p.altKey ? 'copy' : 'move');
    if (p.altKey && g.copies) {
      const c = g.copies;
      const place = <T extends Area | Stand>(o: T): T => {
        const q = r.rects[c.from[o.id]!];
        return q ? { ...o, cx: q.cx, cy: q.cy, w: q.w, d: q.d, rot: q.rot } : o;
      };
      st.setPreview({ pageId, rects: {}, added: { areas: c.areas.map(place), stands: c.stands.map(place) } });
    } else setPreview(r.rects);
  };

  const startGesture = (g: Gesture) => {
    gesture.current = g;
  };

  // Höchstens eine Verschiebung (Fang, Vorschau, Freiflächen) pro Bild: Mausbewegungen werden gesammelt
  // und im nächsten Animation-Frame verarbeitet; beim Loslassen sofort (QA-M4-03).
  const pendingMove = useRef<{ g: Extract<Gesture, { kind: 'move' }>; p: ToolPointer; raf: number } | null>(null);
  const flushMove = () => {
    const pm = pendingMove.current;
    if (!pm) return;
    cancelAnimationFrame(pm.raf);
    pendingMove.current = null;
    if (gesture.current === pm.g) moveStep(pm.g, pm.p);
  };
  const queueMove = (g: Extract<Gesture, { kind: 'move' }>, p: ToolPointer) => {
    if (pendingMove.current) {
      pendingMove.current.p = p;
      return;
    }
    pendingMove.current = { g, p, raf: requestAnimationFrame(() => flushMove()) };
  };
  /** Shift/Alt/Cmd geändert: sofort mit der letzten (auch noch wartenden) Mausposition rechnen. */
  const applyModifiers = (g: Extract<Gesture, { kind: 'move' }>, mods: Pick<ToolPointer, 'shiftKey' | 'altKey' | 'modKey'>) => {
    if (pendingMove.current) {
      pendingMove.current.p = { ...pendingMove.current.p, ...mods };
      flushMove();
    } else moveStep(g, { ...g.last, ...mods });
  };
  const dropMove = () => {
    if (pendingMove.current) cancelAnimationFrame(pendingMove.current.raf);
    pendingMove.current = null;
  };

  const finish = (commit: boolean) => {
    if (commit) flushMove();
    else dropMove();
    const g = gesture.current;
    gesture.current = null;
    setMarquee(null);
    setMoving(false);
    setGuides([]);
    const st = useStore.getState();
    if (!g) return;
    if (g.kind === 'background') {
      if (commit) st.commitTransaction();
      else st.abortTransaction();
      return;
    }
    if (g.kind === 'move' || g.kind === 'rotate' || g.kind === 'resize') {
      const preview = st.preview;
      if (commit && preview?.pageId === pageId) {
        // Alt beim Loslassen: Kopien einfügen (ein Undo-Schritt „Duplizieren“), Originale bleiben
        if (preview.added) commitDuplicateDrag(pageId, preview.added);
        else commitRects(pageId, preview.rects, LABEL[g.kind]);
      }
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
        startGesture({ kind: 'pending', start: p.screen, startWorld: p.world, shift: p.shiftKey, grab: id, onDrag: 'move', onClick: () => setAreaFront(pageId, id, edge) });
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
            grab: hit.id,
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
            grab: hit.id,
            onDrag: 'move',
            // Klick ohne Ziehen auf ein Objekt einer Mehrfachauswahl wählt nur dieses
            onClick: () => isSelected && current.length > 1 && select([hit.id]),
          });
          return true;
        }
        // Nicht ausgewählte Grundfläche: Klick wählt sie aus, Ziehen zieht ein Auswahlrechteck auf
        startGesture({ kind: 'pending', start: p.screen, startWorld: p.world, shift: false, grab: null, onDrag: 'marquee', onClick: () => select([hit.id]) });
        return true;
      }

      const page = ctx.page;
      const bg = page.background;
      if (bg && !bg.locked && page.layers.background.visible && onBackground(p.world)) {
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
        grab: null,
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
        const bg = ctx.page.background;
        const object = !handle && (!!pickObject(ctx.page, p.world) || (!!bg && !bg.locked && ctx.page.layers.background.visible && onBackground(p.world)));
        if (hover?.object !== object || hover.alt !== p.altKey || JSON.stringify(hover?.handle ?? null) !== JSON.stringify(handle)) setHover({ handle, object, alt: p.altKey });
        return;
      }
      switch (g.kind) {
        case 'pending': {
          if (Math.hypot(p.screen.x - g.start.x, p.screen.y - g.start.y) < DRAG_PX) return;
          const st = useStore.getState();
          if (g.onDrag === 'move') {
            const sel = st.ui.selection?.kind === 'objects' ? st.ui.selection.ids : [];
            const grabbed = g.grab && sel.includes(g.grab) ? g.grab : (sel[0] ?? null);
            startGesture({ kind: 'move', startWorld: g.startWorld, rects0: rectsOf(sel), grabbed, snap: { frontAreaId: null }, copies: null, last: p });
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
          queueMove(g, p);
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
      const g = gesture.current;
      if (!active || !g) return false;
      if (e.key === 'Escape') {
        // bricht jede Geste ab, auch das Verschieben des Hintergrunds (QA-M4-04)
        finish(false);
        return true;
      }
      // Shift/Alt/Cmd/Strg wirken sofort, auch ohne Mausbewegung
      if (g.kind === 'move' && MODIFIER_KEYS.has(e.key)) applyModifiers(g, modifiersOf(e));
      // Während einer Geste keine Kurzbefehle (sonst z. B. Cmd+Z mitten im Ziehen, M4-20)
      return true;
    },
    overlay: null,
    panel: null,
  };

  // Loslassen von Shift/Alt/Cmd/Strg während des Ziehens wirkt sofort. Einmal anmelden und die aktuelle
  // Funktion über einen Ref lesen: Ein Neuanmelden bei jedem Rendern ginge verloren, wenn ein anderer
  // keyup-Listener (Canvas: Alt) mitten im Ereignis synchron neu rendern lässt.
  const modifiersRef = useRef(applyModifiers);
  useLayoutEffect(() => {
    modifiersRef.current = applyModifiers;
  });
  useEffect(() => {
    if (!active) return;
    const up = (e: KeyboardEvent) => {
      const g = gesture.current;
      if (g?.kind === 'move' && MODIFIER_KEYS.has(e.key)) modifiersRef.current(g, modifiersOf(e));
    };
    window.addEventListener('keyup', up);
    return () => window.removeEventListener('keyup', up);
  }, [active, gesture, modifiersRef]);

  if (active) {
    const h = hover?.handle;
    const objectCursor = hover?.alt ? 'cursor-copy' : 'cursor-move';
    handlers.cursor = moving
      ? moving === 'copy'
        ? 'cursor-copy'
        : 'cursor-move'
      : !h
        ? hover?.object
          ? objectCursor
          : undefined
        : h.kind === 'rotate'
          ? 'cursor-rotate'
          : h.kind === 'resize' && geo
            ? resizeCursor(geo, h.handle)
            : 'cursor-pointer';
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
        {guides.length > 0 && <SnapGuides guides={guides} toScreen={ctx.toScreen} />}
      </g>
    );
  }
  return handlers;
}

const modifiersOf = (e: KeyboardEvent) => ({ shiftKey: e.shiftKey, altKey: e.altKey, modKey: IS_MAC ? e.metaKey : e.ctrlKey });

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
