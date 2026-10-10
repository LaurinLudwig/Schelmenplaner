import { addPage } from '../../state/pages';
import { useStore } from '../../state/store';
import { Icon } from '../icons/Icon';
import { tip } from '../shortcuts/tip';

/** Start-Page. Statistik, Listen, Tabelle und Projekteinstellungen folgen in M6. */
export function StartPage() {
  const project = useStore((s) => s.project);
  const setUi = useStore((s) => s.setUi);
  return (
    <section className="startpage">
      <h1>{project.name}</h1>
      <p className="sub">
        {project.pages.length} {project.pages.length === 1 ? 'Festplatz' : 'Festplätze'}
      </p>
      <div className="cards">
        {project.pages.map((p) => (
          <button key={p.id} type="button" className="card link" onClick={() => setUi({ activePage: p.id })}>
            <h2>{p.name}</h2>
            <p>
              {p.stands.length} Geschäfte · {p.areas.length} Grundflächen
            </p>
          </button>
        ))}
        <button type="button" className="card link" onClick={() => addPage()} {...tip({ shortcut: 'page.new', ariaLabel: false })}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="add" size={16} /> Neuer Festplatz
          </h2>
          <p>Leere Festplatz-Page anlegen</p>
        </button>
      </div>
      <div className="placeholder">
        Kennzahlen, Freiflächen-Liste, Geschäftstabelle und Projekteinstellungen folgen in Meilenstein 6.
      </div>
    </section>
  );
}
