import { normAngle, rectCorners, roundRect } from '../../core/geometry/rect';
import { CONNECTION_LABEL } from '../../core/label';
import type { Area, Connection, EdgeIndex, FestplatzPage, Stand } from '../../core/model/types';
import { LIMITS } from '../../core/objects';
import { cachedPageWarnings } from '../../core/warnings';
import { setAreaFront, setRectField, setWarningIgnored, updateArea, updateStands, type WarningKind } from '../../state/objects';
import { useStore } from '../../state/store';
import { ColorField } from './ColorField';
import { NumberField } from './NumberField';
import { common, selectionTitle, type SelectionInfo } from './selection';
import { TextField } from './TextField';

/**
 * Eigenschaften der Auswahl in der Seitenleiste. Bei Mehrfachauswahl erscheinen die gemeinsamen
 * Felder; unterschiedliche Werte bleiben leer, eine Eingabe gilt für alle ausgewählten Objekte.
 */
export function ObjectPanel({ sel }: { sel: SelectionInfo }) {
  const { page, objects } = sel;
  const stands = objects.filter((o) => o.kind === 'stand').map((o) => o.obj as Stand);
  const areas = objects.filter((o) => o.kind === 'area').map((o) => o.obj as Area);
  const single = objects.length === 1;
  return (
    <section className="panel" aria-label="Eigenschaften">
      <div className="panel-head">
        <span>{selectionTitle(objects)}</span>
        {!single && <span className="panel-badge">{objects.length} ausgewählt</span>}
      </div>
      <div className="panel-body form">
        {areas.length === 1 && single && <AreaFields pageId={page.id} area={areas[0]!} />}
        {stands.length > 0 && !areas.length && <StandWarnings page={page} stands={stands} />}
        {stands.length > 0 && !areas.length && <StandFields pageId={page.id} stands={stands} />}
        <GeometryFields pageId={page.id} sel={sel} />
        {single && areas.length === 1 && <FrontPicker pageId={page.id} area={areas[0]!} />}
        {areas.length > 0 && stands.length > 0 && <p className="hint">Geschäfts-Attribute erscheinen, wenn nur Geschäfte ausgewählt sind.</p>}
      </div>
    </section>
  );
}

function GeometryFields({ pageId, sel }: { pageId: string; sel: SelectionInfo }) {
  const ids = sel.objects.map((o) => o.obj.id);
  const rects = sel.objects.map((o) => roundRect(o.obj));
  const onlyStands = sel.objects.every((o) => o.kind === 'stand');
  const min = onlyStands ? LIMITS.stand.min : LIMITS.area.min;
  const max = onlyStands ? LIMITS.stand.max : LIMITS.area.max;
  return (
    <div className="fields-3">
      <NumberField id="sb-w" label="Breite" unit="m" value={common(rects.map((r) => r.w))} min={min} max={max} step={0.1} onCommit={(v) => setRectField(pageId, ids, 'w', v)} />
      <NumberField id="sb-d" label="Tiefe" unit="m" value={common(rects.map((r) => r.d))} min={min} max={max} step={0.1} onCommit={(v) => setRectField(pageId, ids, 'd', v)} />
      <NumberField id="sb-rot" label="Drehung" unit="°" value={common(rects.map((r) => r.rot))} min={-360} max={360} step={1} digits={1} onCommit={(v) => setRectField(pageId, ids, 'rot', v)} />
    </div>
  );
}

function AreaFields({ pageId, area }: { pageId: string; area: Area }) {
  return <TextField id="area-name" label="Bezeichnung" value={area.name} placeholder="z. B. Obermarkt Nord" onCommit={(name) => updateArea(pageId, area.id, { name: name.trim() }, 'Grundfläche umbenennen')} />;
}

/** Richtung (auf dem Bildschirm), in die die Außenseite einer Kante zeigt. */
const DIRS = ['oben', 'rechts', 'unten', 'links'] as const;
const EDGE_NORMAL_ANGLE: Record<EdgeIndex, number> = { 0: 0, 1: 90, 2: 180, 3: 270 };
const edgeDirection = (area: Area, edge: EdgeIndex) => DIRS[Math.round(normAngle(EDGE_NORMAL_ANGLE[edge] + area.rot) / 90) % 4]!;

/** Kantenwähler: Mini-Abbild der Grundfläche, jede Kante anklickbar; die Vorderseite ist markiert. */
function FrontPicker({ pageId, area }: { pageId: string; area: Area }) {
  const W = 112;
  const H = 72;
  const pad = 10;
  const c = rectCorners({ ...area, cx: 0, cy: 0 });
  const span = Math.max(...c.map((p) => Math.abs(p.x))) * 2 || 1;
  const spanY = Math.max(...c.map((p) => Math.abs(p.y))) * 2 || 1;
  const k = Math.min((W - 2 * pad) / span, (H - 2 * pad) / spanY);
  const pts = c.map((p) => ({ x: W / 2 + p.x * k, y: H / 2 + p.y * k }));
  const edges = [0, 1, 2, 3] as const;
  return (
    <div className="field">
      <label>Vorderseite</label>
      <div className="front-pick">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
          <polygon className="fp-body" points={pts.map((p) => `${p.x},${p.y}`).join(' ')} />
          {edges.map((e) => {
            const a = pts[e]!;
            const b = pts[(e + 1) % 4]!;
            return (
              <g key={e}>
                <line className={`fp-edge${e === 2 ? ' on' : ''}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <line className="fp-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} onClick={() => setAreaFront(pageId, area.id, e)} />
              </g>
            );
          })}
        </svg>
        <div className="seg" role="group" aria-label="Vorderseite wählen">
          {edges.map((e) => (
            <button key={e} type="button" aria-pressed={e === 2} onClick={() => setAreaFront(pageId, area.id, e)}>
              {edgeDirection(area, e)}
            </button>
          ))}
        </div>
      </div>
      <p className="hint">Oder eine Kante der ausgewählten Fläche anklicken. Die Fläche bleibt, wo sie ist.</p>
    </div>
  );
}

/** Name eines Stands in Meldungen: „Nr. 12 · Name“, ohne beides „ohne Namen“. */
const standName = (s: Stand) => [s.nr && `Nr. ${s.nr}`, s.name].filter(Boolean).join(' · ') || 'Stand ohne Namen';

/**
 * Warnungen der ausgewählten Stände (M4-09, M4-10) mit den Häkchen „ignorieren“. Erscheint nur, wenn
 * ein Stand eine Warnung hat oder eine ignoriert. Die Häkchen gelten je Art und nur für den eigenen Stand.
 */
function StandWarnings({ page, stands }: { page: FestplatzPage; stands: Stand[] }) {
  const settings = useStore((s) => s.project.settings);
  const w = cachedPageWarnings(page.areas, page.stands);
  const byId = new Map(page.stands.map((s) => [s.id, s]));
  const outside = stands.filter((s) => w.byStand.get(s.id)?.outside);
  const overlap = stands.filter((s) => w.byStand.get(s.id)?.overlaps.length);
  const ids = stands.map((s) => s.id);
  const rows: { kind: WarningKind; label: string; hit: Stand[]; ignored: boolean; enabled: boolean }[] = [
    { kind: 'overlap', label: 'Überlappung ignorieren', hit: overlap, ignored: stands.every((s) => s.suppressOverlapWarning), enabled: settings.warnOverlap },
    { kind: 'outside', label: '„außerhalb“ ignorieren', hit: outside, ignored: stands.every((s) => s.suppressOutsideWarning), enabled: settings.warnOutside },
  ];
  const visible = rows.filter((r) => r.hit.length || stands.some((s) => (r.kind === 'outside' ? s.suppressOutsideWarning : s.suppressOverlapWarning)));
  if (!visible.length) return null;
  const single = stands.length === 1;
  return (
    <div className="field" data-testid="stand-warnings">
      <label>Warnungen</label>
      {visible.map((r) => (
        <div key={r.kind} className="form">
          {r.hit.length > 0 && (
            <div className={`warn-chip ${r.kind}`} data-testid={`warn-chip-${r.kind}`}>
              {r.kind === 'overlap'
                ? single
                  ? `Überlappt mit ${w.byStand.get(stands[0]!.id)!.overlaps.map((id) => standName(byId.get(id)!)).join(', ')}`
                  : `${r.hit.length} überlappen`
                : single
                  ? 'Außerhalb jeder Grundfläche'
                  : `${r.hit.length} außerhalb`}
              {!r.enabled && ' (projektweit ausgeschaltet)'}
            </div>
          )}
          <label className="check">
            <input type="checkbox" checked={r.ignored} onChange={(e) => setWarningIgnored(page.id, ids, r.kind, e.target.checked)} />
            {r.label}
          </label>
        </div>
      ))}
    </div>
  );
}

const CONNECTIONS: (Connection | null)[] = [null, '230V', 'CEE16', 'CEE32'];
const MIXED = '__mixed';

function StandFields({ pageId, stands }: { pageId: string; stands: Stand[] }) {
  const categories = useStore((s) => s.project.categories);
  const ids = stands.map((s) => s.id);
  const single = stands.length === 1;
  const text = (key: 'nr' | 'name' | 'owner' | 'ware' | 'note') => common(stands.map((s) => s[key]));
  const set = (patch: Partial<Stand>, label: string) => updateStands(pageId, ids, patch, label);
  const cat = common(stands.map((s) => s.categoryId ?? ''));
  const conn = common(stands.map((s) => s.connection ?? ''));
  const color = common(stands.map((s) => s.color));
  const mixedColor = !single && color === null && stands.some((s) => s.color !== null);
  return (
    <>
      {single && <TextField id="st-nr" label="Platznummer" value={text('nr')} onCommit={(nr) => set({ nr: nr.trim() }, 'Platznummer ändern')} />}
      <TextField id="st-name" label="Geschäftsname" value={text('name')} onCommit={(name) => set({ name }, 'Geschäftsname ändern')} />
      <TextField id="st-owner" label="Eigentümer" value={text('owner')} onCommit={(owner) => set({ owner }, 'Eigentümer ändern')} />
      <TextField id="st-ware" label="Typ/Ware" value={text('ware')} onCommit={(ware) => set({ ware }, 'Ware ändern')} />
      <div className="fields-2">
        <NumberField id="st-power" label="Strom" unit="kW" value={common(stands.map((s) => s.powerKw))} min={0} max={10000} step={0.5} onCommit={(powerKw) => set({ powerKw }, 'Strom ändern')} />
        <div className="field">
          <label htmlFor="st-conn">Anschlussart</label>
          <select id="st-conn" value={conn ?? MIXED} onChange={(e) => set({ connection: (e.target.value || null) as Connection | null }, 'Anschlussart ändern')}>
            {conn === null && <option value={MIXED} disabled hidden />}
            {CONNECTIONS.map((c) => (
              <option key={c ?? ''} value={c ?? ''}>
                {c ? CONNECTION_LABEL[c] : 'keine Angabe'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="st-cat">Kategorie</label>
        <select id="st-cat" value={cat ?? MIXED} onChange={(e) => set({ categoryId: e.target.value || null }, 'Kategorie zuordnen')}>
          {cat === null && <option value={MIXED} disabled hidden />}
          <option value="">keine Kategorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {!categories.length && <p className="hint">Kategorien legst du im Bereich „Kategorien“ an.</p>}
      </div>
      <ColorField
        id="st-color"
        label={mixedColor ? 'Eigene Farbe (unterschiedlich)' : 'Eigene Farbe'}
        value={color}
        onCommit={(c) => set({ color: c }, 'Farbe ändern')}
        onReset={() => set({ color: null }, 'Eigene Farbe entfernen')}
        resetLabel="Eigene Farbe entfernen (Farbe der Kategorie verwenden)"
        canReset={stands.some((s) => s.color !== null)}
      />
      <TextField id="st-note" label="Notiz" value={text('note')} multiline onCommit={(note) => set({ note }, 'Notiz ändern')} />
    </>
  );
}
