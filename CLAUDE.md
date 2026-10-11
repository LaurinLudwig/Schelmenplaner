# Schelmeplaner – Hinweise für Claude

BACKLOG.md ist die Quelle für den Projektstand. Vor jeder Arbeit lesen, nach jeder Arbeit aktualisieren.
Ändern sich Anforderungen, wird SPEC.md (`spec.md`) angepasst und BACKLOG.md nachgezogen.

## Arbeitsweise
- Immer nur einen Meilenstein pro Durchgang.
- Bugs, Ideen und Lücken, die während der Arbeit auffallen, kommen in BACKLOG.md unter „Eingang“
  und werden nicht ungefragt umgesetzt.
- Am Ende jedes Meilensteins: BACKLOG.md mit spec.md abgleichen, dann Abschnitt „Abschluss Mx“
  schreiben (umgesetzt, nicht umgesetzt/verschoben, Abweichungen, bekannte Bugs, offene Fragen).
- `src/core/` bleibt frei von React-, DOM- und Tauri-Importen und ist mit Vitest getestet. Erzwungen durch den Linter (Override in `.oxlintrc.json`) und eine eigene Typprüfung ohne DOM (`src/core/tsconfig.json`; erlaubte plattformneutrale Funktionen nur über `src/core/env.d.ts`).
- Zahlen: Eingabefelder mit `fmtInput` (ohne Tausenderpunkt) und `parseNum`; reine Anzeigen mit `fmt`.
- Fehlermeldungen für den Nutzer nur auf Deutsch: `UserError` für fertige Meldungen, sonst `userMessage(e, fallback)`.
- Betriebssystem-Zugriffe (Dateien, Dialoge, Fenster) laufen ausschließlich über `src/platform/`
  (`platform` aus `src/platform/index.ts`). Nur `src/platform/tauri.ts` importiert `@tauri-apps/*`;
  `src/platform/browser.ts` ist der Ersatz für den normalen Browser.

- Screenshots und Logs aus Testläufen gehören nach `test-artifacts/` (ignoriert; Helfer `artifact()` in `tests/e2e/helpers.ts`). Unter `qa/` nur Belege, die in QA-Berichten verlinkt sind.
- Im Entwicklungsmodus ist der Store als `window.__schelmeStore` erreichbar (Fehlersuche, Tests).
- Dateiformat: Jede Änderung am Format von `project.json` (neue, umbenannte oder anders gedeutete Felder)
  erhöht `CURRENT_SCHEMA_VERSION` und bringt eine Migration „von n auf n+1“ in
  `src/core/model/migrations.ts` mit Test in `src/core/model/migrations.test.ts` mit. Dazu eine echte Datei der
  Vorgängerversion unter `tests/fixtures/` (nie neu erzeugen), deren Migration getestet wird. Dateien mit neuerer
  Version weist die App mit deutscher Meldung ab.

## QA
- Der QA-Agent (`.claude/agents/qa-tester.md`) prüft jeden Meilenstein und schreibt `qa/Mx.md`.
  Er setzt in BACKLOG.md den Status `[!]` (Nacharbeit nötig).
- Auftrag „QA-Bericht abarbeiten“: Befunde aus `qa/Mx.md` beheben, `[!]` wieder auf `[x]` setzen
  und im Bericht vermerken, was behoben wurde.
- Tests in `tests/e2e/` nicht verändern, außer ein Test ist nachweislich falsch. Dann Laurin
  ausdrücklich sagen, welcher Test und warum.

## Befehle
| Befehl | Zweck |
|---|---|
| `npm install` | Abhängigkeiten installieren |
| `npm run dev` | Frontend im Browser, http://localhost:1420 (ohne Tauri; Dateien per Upload/Download) |
| `npm run tauri dev` | Desktop-App starten (benötigt Rust; in Shells ohne Rust im PATH vorher `source ~/.cargo/env`) |
| `npm run tauri build` | Desktop-Installer bauen (benötigt Rust) |
| `npm run typecheck` | TypeScript-Prüfung: ganzes Projekt und zusätzlich `src/core` ohne DOM-Bibliothek (`tsc -p src/core`) |
| `npm run lint` | Linter (oxlint, Warnungen gelten als Fehler) |
| `npm test` | Unit-Tests (Vitest, `src/**/*.test.ts`) |
| `npm run test:watch` | Unit-Tests im Watch-Modus |
| `npm run test:e2e` | E2E-Tests (Playwright, `tests/e2e/`, Chromium + WebKit; startet den Dev-Server selbst). Ohne Lasttests |
| `npm run test:perf` | Lasttests (`tests/e2e/*perf.spec.ts`, 500 Stände, ≥ 50 Bilder/s) seriell mit einem Worker, getrennt von `test:e2e` (parallele Browser verfälschen die Bildrate) |
| `npx playwright install chromium webkit` | Browser für die E2E-Tests installieren (einmalig) |
| `npm run build` | Typecheck + Produktions-Build nach `dist/` |
| `npm run check` | typecheck, lint, test und build nacheinander |
| `node scripts/make-fixtures.mjs` | Testdateien in `tests/fixtures/` neu erzeugen (Maße siehe README dort) |
| `node scripts/make-load-project.mjs` | Testprojekt `tests/fixtures/last-500-staende.schelme` (500 Stände, 4 Festplätze) neu erzeugen |
| `node scripts/copy-pdfjs-assets.mjs` | pdf.js-Zusatzdateien nach `public/pdfjs/` kopieren (läuft automatisch vor `dev`/`build`) |
