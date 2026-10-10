# QA-Nachprüfung Meilenstein 1 (M1)

Datum: 2026-10-10 · Grundlage: erster Bericht `qa/M1.md` (Commit 5177483) · geprüfter Stand:
Arbeitskopie auf 5177483. Seit dem QA-Commit gibt es **keinen neuen Commit**; alle Änderungen sind
uncommittet (`git status`: 13 geänderte Dateien, u. a. `src/app/autosave.ts`, `src/ui/canvas/wheel.ts`,
`src/ui/shell/TabBar.tsx`, `src/ui/shortcuts/tip.ts`, `src/ui/startpage/StartPage.tsx`, `.oxlintrc.json`,
drei E2E-Dateien, `BACKLOG.md`, `CLAUDE.md`, `qa/M1.md`).

## Zusammenfassung

| | Anzahl |
|---|---|
| Befunde der ersten Runde geprüft | 6 |
| behoben | 5 (QA-M1-01, -03, -04, -05, -06) |
| teilweise behoben | 1 (QA-M1-02) |
| nicht behoben / bewusst verschoben | 0 |
| neue Befunde | 6 (QA-M1-07 bis -12): 2 × mittel, 4 × gering |
| Regressionen in bestehenden M1-Tests | keine (alle 138 bisherigen E2E-Tests grün) |

**Gesamturteil: Nacharbeit nötig (geringer Umfang).** Die Fixes wirken für die gemeldeten Fälle. Zwei
neue Punkte mittlerer Schwere: Die umgedrehte Wischrichtung muss geklärt werden (QA-M1-07), und eine
„behaltene“ Sicherung geht verloren (QA-M1-08, M1-19 auf `[!]`). Nichts davon blockiert M2.

## Checks

| Check | Ergebnis | Log |
|---|---|---|
| `npm run typecheck` | OK (Exit 0), auch nach den neuen Tests | `qa/logs/recheck-typecheck.log`, `recheck-typecheck-final.log` |
| `npm run lint` | OK (Exit 0, 0 Meldungen), auch nach den neuen Tests | `qa/logs/recheck-lint.log`, `recheck-lint-final.log` |
| `npm test` | 5 Dateien, **28/28** bestanden | `qa/logs/recheck-test.log` |
| `npm run build` | OK | `qa/logs/recheck-build.log` |
| `npm run check` | OK (Exit 0) | `qa/logs/recheck-check.log` |
| `npm run test:e2e`, Stand des Entwicklers | **138 bestanden, 2 übersprungen** (140), kein „expected to fail but passed“ | `qa/logs/recheck-e2e.log` |
| `npm run test:e2e` mit neuen QA-Tests | **166**: 160 bestanden (davon 8 erwartete Fehlschläge per `test.fail`), 6 übersprungen, 0 rot, kein „expected to fail but passed“ | `qa/logs/recheck-e2e-final.log` |
| `cargo check` (src-tauri) | OK. `cargo` liegt nur unter `~/.cargo/bin` und ist nicht im Standard-PATH der Shell | `qa/logs/recheck-cargo-check.log` |

## Status der Befunde aus Runde 1

| Befund | Status | Beleg |
|---|---|---|
| QA-M1-01 Abschluss M1 widersprüchlich | **behoben** | `BACKLOG.md` „Abschluss M1“: M1-01 `[x]`, 28 Unit-Tests (stimmt mit `recheck-test.log` überein), „Smoke + 69 Testfälle“ (stimmt: 70 je Browser), Klicktest als nicht eingechecktes Skript benannt. Neuer Widerspruch durch diese Nachprüfung: „Alle 24 Einträge sind `[x]`“ stimmt nicht mehr, weil M1-19 jetzt `[!]` ist. |
| QA-M1-02 Maus/Trackpad-Heuristik | **teilweise behoben** | Heuristik unverändert (`src/ui/canvas/wheel.ts:26-31`). Mausrad-E2E weiter nur Chromium (`tests/e2e/m1-canvas.spec.ts:53`, `test.skip` zu Recht noch da). Pinch laut Laurin auf Hardware bestätigt; Restrisiko unter „Bekannte Bugs“ und auf der Checkliste. Die Änderung der Wischrichtung (`wheel.ts:44`) ist neu und klärungsbedürftig → QA-M1-07. Backlog-Eintrag auf `[!]`. |
| QA-M1-03 Veraltete Sicherung nach Undo | **behoben** | `src/app/autosave.ts:30-33` (Intervall) und `:47-49` (Store-Abo). Tests: `m1-file.spec.ts` „Zurück-Undo …“ grün ohne `test.fail`; neu `m1-recheck.spec.ts:30` (Sicherung sofort weg, ohne Intervall), `:41` (Redo → erneut gesichert und wiederherstellbar), `:60` (wiederhergestelltes Projekt bleibt ungespeichert, Sicherung bleibt). Randfall → QA-M1-08. |
| QA-M1-04 Aktive Page in voller Tab-Leiste | **behoben** (gemeldeter Fall) | `src/ui/shell/TabBar.tsx:37-45`. Tests: `m1-browser.spec.ts` „Neu angelegte Page …“ grün ohne `test.fail`; neu `m1-recheck.spec.ts:113` (Alt+1, Alt+0, Strg+Tab-Umlauf in beide Richtungen), `:132` (Duplizieren + Undo), `:164` (Mausrad scrollt Leiste seitwärts, Chromium). Screenshot `qa/screenshots/recheck-tabs-overflow.png`. Restfälle → QA-M1-09. |
| QA-M1-05 Reinheit `src/core/` | **behoben** | `.oxlintrc.json:50-130` (Override `src/core/**`). Gegenprobe in Kopie außerhalb von `src/`: React, react-dom, `@tauri-apps/*`, zustand, `../../state|ui|platform`, dynamisches `import('react')`, `window`, `document`, `navigator`, `localStorage`, `Blob` werden gemeldet; `../format` und `src/ui/` nicht. Automatisiert in `tests/e2e/m1-recheck-lint.spec.ts:37`. Lücken → QA-M1-10. |
| QA-M1-06 Doppelter zugänglicher Name | **behoben** | `src/ui/startpage/StartPage.tsx:25` (`ariaLabel: false`), `src/ui/shell/TabBar.tsx:182` („Festplatz-Tab hinzufügen“), `src/ui/shortcuts/tip.ts:19-25`. Test `m1-recheck.spec.ts` „Karte und „+“-Button …“: Karte ohne `aria-label`, Name beginnt mit „Neuer Festplatz“, „+“ heißt „Festplatz-Tab hinzufügen“, genau ein Button „Neuer Festplatz“, beide Tooltips zeigen weiter „Neuer Festplatz“, beide legen eine Page an. |

## Prüfung der Markierungen `test.fail` / `test.fixme` / `test.skip`

Suche in `tests/` nach `test.fail`, `test.fixme`, `test.skip`, `.only`:

**Stand des Entwicklers (vor meinen Tests):**
- `tests/e2e/m1-canvas.spec.ts:53` `test.skip` (WebKit, Mausrad-Test). Gehört zu QA-M1-02. Die Heuristik ist unverändert, die Markierung ist also **zu Recht noch da**.
- `tests/e2e/m1-canvas.spec.ts:111` `test.skip` (Chromium, GestureEvent gibt es nur in WebKit). Technisch bedingt, kein Befund.
- Keine `test.fail`/`test.fixme` mehr. Entfernt wurden `m1-file.spec.ts` (QA-M1-03) und `m1-browser.spec.ts` (QA-M1-04). Beide Befunde sind behoben, beide Tests sind ohne Markierung grün. Es steht **keine Markierung für einen behobenen Befund** mehr drin, und es wurde **keine Markierung für einen offenen Befund** entfernt.
- Keine Meldung „expected to fail but passed“ (`grep` in beiden E2E-Logs: 0 Treffer).

**Von mir neu angelegt (je mit Befund-ID; Grund des Fehlschlags mit `QA_SHOW=1` ohne Markierung gegengeprüft):**
- `tests/e2e/m1-recheck.spec.ts:82` `test.fail` → QA-M1-08 (Dialog fehlt beim Neuladen, Zeile 99)
- `tests/e2e/m1-recheck.spec.ts:144` und `:156` `test.fail` → QA-M1-09 (aktiver Tab nicht sichtbar, `false` statt `true`)
- `tests/e2e/m1-recheck.spec.ts:199` `test.fail` → QA-M1-07 (Vorzeichen +1 statt −1, Zeile 220); `:196` `test.skip` für WebKit
- `tests/e2e/m1-recheck.spec.ts:165` `test.skip` für WebKit (Mausrad über der Tab-Leiste; `page.mouse.wheel` ist in WebKit nicht verlässlich, siehe QA-M1-02)
- `tests/e2e/m1-recheck-lint.spec.ts:67` `test.fail` → QA-M1-10 (oxlint meldet keine der 6 Probezeilen); `:34` `test.skip` für WebKit (läuft ohne Browser, nur einmal)

## Neue Befunde

### QA-M1-07 – Wischrichtung läuft gegen die Systemkonvention
- Backlog-ID: M1-24 (Folge der Änderung zu QA-M1-02) · **Schwere: mittel (Klärung nötig)**
- Erwartet laut SPEC (§ Layout, `spec.md:156`): „Zwei-Finger-Wischen verschiebt“. Die Richtung legt die Spec nicht fest. Üblich (Browser, Figma, Illustrator, auch die eigene Tab-Leiste): Der Inhalt folgt der Scrollrichtung des Systems. Ein Rad-Ereignis mit `deltaY > 0` bedeutet „nach unten scrollen“, der Inhalt wandert nach oben. Das gilt unabhängig von der macOS-Einstellung, weil das System die Deltas schon umkehrt.
- Tatsächlich: `src/ui/canvas/wheel.ts:44` liefert jetzt `dx: +deltaX, dy: +deltaY`. Die Zeichenfläche bewegt sich damit entgegengesetzt zu jeder anderen scrollbaren Fläche im selben System. Mit der macOS-Standardeinstellung „Natürliche Scrollrichtung = ein“ bewegt sich der Plan **gegen** die Finger. Laurins Beobachtung („lief invertiert“) passt zur vorherigen Implementierung nur, wenn die natürliche Scrollrichtung bei ihm ausgeschaltet ist. Das ist nicht dokumentiert. Auch der Code-Kommentar in `wheel.ts:42-43` setzt voraus, dass Nutzer die Systemeinstellung umstellen.
- Reproduktion (Chromium): 16 Pages anlegen, Alt+1. Über der Tab-Leiste `page.mouse.wheel(60, 0)`: der Inhalt der Tab-Leiste wandert nach **links**. Über der Zeichenfläche dieselbe Geste: Der Ursprung wandert nach **rechts**.
- Beleg: `tests/e2e/m1-recheck.spec.ts:195` (`test.fail`; ohne Markierung: `Expected: -1, Received: 1`). Dazu die geänderte Testerwartung `tests/e2e/m1-canvas.spec.ts:104-107`.
- Empfehlung: Laurin fragen, ob „Natürliche Scrollrichtung“ bei ihm an ist, und die Wischrichtung auf einem zweiten Mac mit Standardeinstellung gegenprüfen. Wenn die jetzige Richtung gewollt ist, `m1-recheck.spec.ts:195` löschen und E-09 (Einstellung „Wischrichtung umkehren“) einplanen.

### QA-M1-08 – „Behaltene“ Sicherung geht verloren
- Backlog-ID: M1-19 (→ `[!]`) · **Schwere: mittel**
- Erwartet laut SPEC (§10, `spec.md:124`): „Autosave schreibt in eine Sicherungsdatei, die beim Öffnen zur Wiederherstellung angeboten wird.“ Schließt man den Dialog „Sicherung gefunden“ mit Esc oder per Klick daneben (`cancelId: 'keep'`, `src/app/fileActions.ts:95`), bleibt die Sicherung stehen und sollte beim nächsten Öffnen wieder angeboten werden.
- Tatsächlich: Arbeitet man danach weiter, überschreibt der nächste Autosave diese Sicherung mit dem neuen Stand (`src/app/autosave.ts:37`; das war schon vor dem Fix so, siehe `git show 5177483:src/app/autosave.ts`, Zeile 14-17). Seit dem Fix zu QA-M1-03 wird sie nach einem Undo zum sauberen Stand außerdem gelöscht (`autosave.ts:21-27`). Beim nächsten Start wird nichts mehr angeboten, und der alte Stand ist weg. In der Desktop-App gibt es für unbenannte Projekte ebenfalls nur eine Datei (`src/platform/tauri.ts:17`, `unbenannt.schelme.autosave`). Betroffen ist also auch die Desktop-App, nicht nur der Browser-Modus.
- Reproduktion: Page in „Alter Stand“ umbenennen, 30 s warten, neu laden → Dialog mit **Esc** schließen → „+“, 30 s warten, Strg/Cmd+Z → neu laden: Es erscheint kein Dialog mehr. Ohne das Undo erscheint zwar ein Dialog, er bietet aber den neuen Stand an, nicht „Alter Stand“.
- Beleg: `tests/e2e/m1-recheck.spec.ts:80` (`test.fail`; ohne Markierung schlägt Zeile 99 fehl, „element(s) not found“).
- Hinweis: Fremde Sicherungen nicht überschreiben, solange über sie nicht entschieden ist, oder Esc wie „Verwerfen“ behandeln und das im Dialog sagen. Die Entscheidung liegt bei Laurin.

### QA-M1-09 – Tab-Leiste: aktiver Tab nach Fenstergröße/Umbenennen nicht sichtbar
- Backlog-ID: M1-04 (Rest von QA-M1-04) · **Schwere: gering**
- Erwartet: Der aktive Tab bleibt in einer übervollen Leiste sichtbar (Ziel von QA-M1-04).
- Tatsächlich: `src/ui/shell/TabBar.tsx:37-45` scrollt nur, wenn sich `active` ändert. (a) Fenster von 1280 auf 800 px verkleinern: Der aktive letzte Tab liegt ganz außerhalb (Tab 1047–1143 px, sichtbarer Bereich 30–663 px). (b) Aktiven Tab in einen langen Namen umbenennen: Der Tab wird breiter und rechts vom „+“ verdeckt.
- Reproduktion: 15 Pages anlegen, letzte aktiv, Fenster verkleinern bzw. F2 → „Ein sehr langer Festplatzname für den Obermarkt Gelnhausen“ → Enter.
- Beleg: `tests/e2e/m1-recheck.spec.ts:142`, `:154` (je `test.fail`), Screenshots `qa/screenshots/recheck-tab-rename-cut.png`, `qa/screenshots/recheck-tab-after-resize-and-rename.png`.

### QA-M1-10 – Lint-Sperre für `src/core/` hat Lücken
- Backlog-ID: — (Rest von QA-M1-05, Querschnitt Q-06) · **Schwere: gering (Risiko)**
- Erwartet (CLAUDE.md): `src/core/` bleibt frei von DOM, „der Linter erzwingt das“.
- Tatsächlich: `no-restricted-globals` ist eine Verbotsliste mit 11 Namen. Nicht gemeldet werden u. a. `globalThis.document`, `new DOMParser()`, `new Image()`, `self.location`, `fetch(...)` und DOM-Typen wie `HTMLDivElement`, weil `tsconfig.json` `lib: ["DOM"]` für alles freigibt. `require('@tauri-apps/api')` wird ebenfalls nicht erkannt (im ESM-Projekt unwahrscheinlich).
- Beleg: `tests/e2e/m1-recheck-lint.spec.ts:65` (`test.fail`; oxlint meldet keine der 6 Probezeilen). Gegenprobe im Scratchpad mit 24 Zeilen: 17 Meldungen; die genannten Zeilen fehlen.
- Empfehlung: zusätzlich `src/core/tsconfig.json` mit `lib: ["ES2023"]` (ohne DOM), von `npm run typecheck` mitgeprüft.

### QA-M1-11 – QA-Artefakte vom Entwickler geändert, Statustexte widersprüchlich
- Backlog-ID: — · **Schwere: gering (Dokumentation/Prozess)**
- Tatsächlich: (a) An `qa/M1.md` wurde ein Abschnitt „Behoben (Nacharbeit, 2026-10-10)“ angehängt (`git diff qa/M1.md`, ab Zeile 190). Der QA-Bericht mischt damit zwei Urheber. (b) Die Erwartung des QA-Tests „M1-24: Zwei-Finger-Wischen“ wurde umgedreht (`tests/e2e/m1-canvas.spec.ts:104-107`, −12/−30 → +12/+30). Das ist begründet und dokumentiert, war aber eine fachliche Änderung an einem QA-Test, ohne dass die QA gefragt wurde (siehe QA-M1-07). (c) QA-M1-02 steht in BACKLOG.md als „erledigt“, in `qa/M1.md` als „teilweise“. Die Einträge zu QA-M1-03/-04 nennen noch `test.fail`, die Markierungen sind aber entfernt. (d) „Abschluss M1 → Nicht umgesetzt“ sagt „Alle 24 Einträge sind `[x]` und von der QA bestätigt“; nach dieser Nachprüfung ist M1-19 `[!]`.
- Empfehlung: Nacharbeit künftig in BACKLOG.md („QA-Nacharbeit M1“) dokumentieren, nicht im QA-Bericht. Fachliche Änderungen an QA-Tests vorher mit der QA abstimmen.

### QA-M1-12 – E2E-Lauf verändert eingecheckten Screenshot
- Backlog-ID: — · **Schwere: gering (Test-Infrastruktur)**
- Tatsächlich: `tests/e2e/m1-file.spec.ts:193` schreibt bei jedem Lauf `qa/screenshots/m1-recovery-dialog.png`. Der Dialog enthält Datum und Uhrzeit, deshalb ist die Datei nach jedem `npm run test:e2e` geändert (`git status`: ` M qa/screenshots/m1-recovery-dialog.png`). Den Screenshot der ersten Runde habe ich nach meinen Läufen mit `git checkout` wiederhergestellt. Meine neuen Tests schreiben Screenshots nur mit `QA_SHOT=1`.
- Empfehlung: Screenshots in Tests nur über eine Umgebungsvariable schreiben oder nach `test-results/` legen.

## Regressionsprüfung

- Alle 70 bisherigen E2E-Testfälle je Browser laufen grün (Chromium und WebKit). Keine neue Konsolen- oder Seitenfehlermeldung.
- `tip()` (`src/ui/shortcuts/tip.ts:25`): Ohne `ariaLabel` bleibt das alte Verhalten (`aria-label` = Tooltip-Name). Werkzeug- und Layout-Tests mit `aria-label`-Selektoren sind grün.
- Mausrad über der Tab-Leiste (`TabBar.tsx:47-49`) greift nur bei `deltaX === 0`. Waagerechtes Trackpad-Wischen bleibt natives Scrollen. Das Zoomen auf der Zeichenfläche ist davon nicht betroffen.
- Autosave: Speichern, Verwerfen und Wiederherstellen verhalten sich wie vor dem Fix (bestehende M1-19-Tests grün). Neu ist nur die Löschung beim Sauberwerden; der Randfall dazu ist QA-M1-08.
- `cargo check` grün; der Rust-Teil ist unverändert.

## Nicht geprüft (mit Grund)

- **Echte Wischrichtung auf Hardware** (QA-M1-07): Nur synthetische Ereignisse möglich. Die Systemeinstellung „Natürliche Scrollrichtung“ ist im Test nicht nachstellbar.
- **Autosave mit echten Dateipfaden** (Desktop): Im Browser-Modus sind alle Pfade `null`. Die Pfadvergleiche in `autosave.ts:47-49` (Sicherung von Datei A, Wechsel zu Datei B, erneutes Öffnen derselben Datei) laufen nur in der Desktop-App. Bei „gleiche Datei erneut öffnen, Nicht speichern“ ist nach Code-Lesung ein Wettlauf zwischen `removeAutosave` (`autosave.ts:25`, ohne `await`) und `offerRecovery` möglich. Nur manuell prüfbar.
- **Desktop-App im Lauf, native Dialoge, Windows**: wie in Runde 1.

## Manuell testen (Checkliste für Laurin)

Zusätzlich zur Checkliste in `qa/M1.md`:

- [ ] **Wischrichtung (QA-M1-07):** Systemeinstellungen → Trackpad → „Natürliche Scrollrichtung“ notieren. Dann in der App: Zwei Finger nach oben wischen. Bewegt sich der Plan in dieselbe Richtung wie eine Webseite in Safari bei derselben Geste? Danach mit umgestellter Einstellung wiederholen.
- [ ] Gleiche Prüfung auf einem zweiten Mac mit Werkseinstellung und unter Windows (Präzisions-Touchpad).
- [ ] **Echte Maus:** Mausrad zoomt um den Zeiger (unverändert offen aus QA-M1-02). Mausrad über der Tab-Leiste scrollt sie seitwärts.
- [ ] **Autosave, Desktop, Undo (QA-M1-03):** Datei öffnen, ändern, über 30 s warten (`.autosave` liegt neben der Datei), Cmd+Z bis zum gespeicherten Stand → die `.autosave`-Datei verschwindet sofort.
- [ ] **Autosave, Desktop, zwei Dateien:** Datei A ändern, über 30 s warten, Datei B öffnen („Nicht speichern“) → `A.schelme.autosave` ist weg, B ohne Rückfrage geöffnet.
- [ ] **Gleiche Datei erneut öffnen:** A ändern, über 30 s warten, Cmd+O auf A, „Nicht speichern“ → keine Rückfrage „Sicherung gefunden“ für den eben verworfenen Stand.
- [ ] **Behaltene Sicherung (QA-M1-08):** Bei „Sicherung gefunden“ Esc drücken, weiterarbeiten, über 30 s warten, App beenden → Welche Sicherung wird beim nächsten Start angeboten? (Erwartung laut Spec: die alte.)
- [ ] **Tab-Leiste:** Viele Pages, Fenster schmaler ziehen → bleibt der aktive Tab sichtbar? (Bekannt: nein, QA-M1-09.)
- [ ] **Screenreader (VoiceOver):** Start-Page-Karte wird als „Neuer Festplatz, Leere Festplatz-Page anlegen“ vorgelesen, der „+“-Button als „Festplatz-Tab hinzufügen“.

## Geänderte und angelegte Dateien (QA)

- neu: `qa/M1-nachpruefung.md` (dieser Bericht)
- neu: `tests/e2e/m1-recheck.spec.ts`, `tests/e2e/m1-recheck-lint.spec.ts`
- neu: `qa/logs/recheck-*.log` (typecheck, typecheck-final, lint, lint-final, test, build, check, e2e, e2e-final, cargo-check)
- neu: `qa/screenshots/recheck-tabs-overflow.png`, `recheck-tab-rename-cut.png`, `recheck-tab-after-resize-and-rename.png`
- geändert: `BACKLOG.md` (QA-Vermerke an QA-M1-01 bis -06, QA-M1-02 auf `[!]`, M1-19 auf `[!]`, neue Einträge QA-M1-07 bis -12 unter „Eingang“)
- nicht geändert: `qa/M1.md`, App-Code. Nichts committet.
