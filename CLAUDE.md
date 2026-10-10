# Schelmeplaner – Hinweise für Claude

BACKLOG.md ist die Quelle für den Projektstand. Vor jeder Arbeit lesen, nach jeder Arbeit aktualisieren.
Ändern sich Anforderungen, wird SPEC.md (`spec.md`) angepasst und BACKLOG.md nachgezogen.

## Arbeitsweise
- Immer nur einen Meilenstein pro Durchgang.
- Bugs, Ideen und Lücken, die während der Arbeit auffallen, kommen in BACKLOG.md unter „Eingang“
  und werden nicht ungefragt umgesetzt.
- Am Ende jedes Meilensteins: BACKLOG.md mit spec.md abgleichen, dann Abschnitt „Abschluss Mx“
  schreiben (umgesetzt, nicht umgesetzt/verschoben, Abweichungen, bekannte Bugs, offene Fragen).
- `src/core/` bleibt frei von React-, DOM- und Tauri-Importen und ist mit Vitest getestet.
- Betriebssystem-Zugriffe (Dateien, Dialoge, Fenster) laufen ausschließlich über `src/platform/`
  (`platform` aus `src/platform/index.ts`). Nur `src/platform/tauri.ts` importiert `@tauri-apps/*`;
  `src/platform/browser.ts` ist der Ersatz für den normalen Browser.

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
| `npm run typecheck` | TypeScript-Prüfung (`tsc --noEmit`) |
| `npm run lint` | Linter (oxlint, Warnungen gelten als Fehler) |
| `npm test` | Unit-Tests (Vitest, `src/**/*.test.ts`) |
| `npm run test:watch` | Unit-Tests im Watch-Modus |
| `npm run test:e2e` | E2E-Tests (Playwright, `tests/e2e/`, Chromium + WebKit; startet den Dev-Server selbst) |
| `npx playwright install chromium webkit` | Browser für die E2E-Tests installieren (einmalig) |
| `npm run build` | Typecheck + Produktions-Build nach `dist/` |
| `npm run check` | typecheck, lint, test und build nacheinander |
