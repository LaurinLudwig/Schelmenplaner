# Backlog – Marktplan-Editor Schelmenmarkt

Quelle für den Projektstand. Vor jeder Arbeit lesen, nach jeder Arbeit aktualisieren.
Ändern sich Anforderungen, wird zuerst `spec.md` angepasst, dann dieses Backlog.

Status: `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt · `[-]` verschoben (Grund → Ziel-Meilenstein) ·
`[!]` Nacharbeit nötig (vom QA-Agenten gesetzt, mit Verweis auf den Befund in `qa/Mx.md`)
Verweise `§n` beziehen sich auf die Abschnitte in `spec.md`.

---

## Eingang
Bugs, Ideen und Lücken, die während der Arbeit auffallen, und eigene Wünsche. Nichts davon wird
ungefragt umgesetzt; erst nach Freigabe wandert ein Eintrag in einen Meilenstein.

- ~~E-01 Trackpad-Verhalten~~ → entschieden und umgesetzt als M1-24.
- E-02 (Lücke) Doppelklick auf eine `.schelme`-Datei im Finder/Explorer: Die Dateizuordnung ist in `tauri.conf.json` eingetragen, aber die App öffnet die übergebene Datei noch nicht. Braucht etwas Rust-Code (Startargumente / macOS-Open-Event).
- E-03 (Idee) Natives Menü (macOS-Menüleiste, Windows-Fenstermenü) statt des In-App-Menüs links oben.
- E-04 (Idee) Liste „Zuletzt geöffnet“ im Menü.
- E-05 (Hinweis) Im Browser-Dev-Modus fängt der Browser einige Shortcuts selbst ab (z. B. Cmd/Strg+N, Cmd/Strg+Shift+N). Betrifft nur `npm run dev`, nicht die Desktop-App.
- E-06 (Hinweis) Die Tab-Taste blendet wie in Illustrator die Panels aus und steht damit nicht mehr zum Springen zwischen Bedienelementen zur Verfügung (Barrierefreiheit). In Textfeldern funktioniert Tab normal.
- E-07 (Hinweis) Die Tauri-Dateirechte erlauben Lesen und Schreiben im gesamten Dateisystem (`**`), damit Projekte überall liegen dürfen, auch auf USB-Sticks. Enger fassen, falls gewünscht.
- E-09 (Idee) Wischrichtung des Trackpads folgt der macOS-Einstellung „Natürliche Scrollrichtung“. Falls gewünscht: eigene Einstellung „Wischrichtung umkehren“ in der App.
- E-08 (Hinweis) Browser-Autosave nutzt localStorage (ca. 5 MB). Mit eingebetteten Hintergründen (M2) reicht das nicht; betrifft nur den Browser-Dev-Modus.
- [x] [QA] QA-M1-01 (gering, erledigt: Abschluss M1 korrigiert) Abschluss M1 widersprüchlich/veraltet: „M1-01 bleibt `[~]`“ vs. Status `[x]`; „24 Unit-Tests“, tatsächlich 28; der erwähnte „automatisierte Klicktest im Browser über alle obigen Funktionen“ liegt nicht im Repo (nur `tests/e2e/smoke.spec.ts`). Siehe `qa/M1.md`. (QA ✓ M1 Nachprüfung)
- [!] [QA] QA-M1-02 (gering, Risiko; erledigt: Pinch auf echter Hardware bestätigt, Wischrichtung nach Laurins Test umgedreht; echtes Mausrad bleibt auf der manuellen Checkliste) Maus/Trackpad-Erkennung ist eine Heuristik (`src/ui/canvas/wheel.ts:26-31`): In Playwright-WebKit wird ein synthetisches Mausrad (`wheelDeltaY` 300) als Trackpad gedeutet und verschiebt statt zu zoomen. Mit echter Hardware vermutlich korrekt, nur manuell prüfbar; umgekehrt kann ein Trackpad-Wischen mit glattem Delta (z. B. 120) einmal zoomen. Mausrad-E2E-Test läuft nur in Chromium. Siehe `qa/M1.md`. (QA M1-Nachprüfung: nur teilweise – Heuristik unverändert, Mausrad-Test weiter nur Chromium `tests/e2e/m1-canvas.spec.ts:53`, Restrisiko dokumentiert; die neue Wischrichtung ist klärungsbedürftig, siehe QA-M1-07 in `qa/M1-nachpruefung.md`)
- [x] [QA] QA-M1-03 (gering, erledigt: eigene Sicherung wird entfernt, sobald das Projekt wieder sauber ist) Autosave: Wird nach einer Sicherung per Undo zum gespeicherten Stand zurückgekehrt, bleibt die Sicherung liegen und wird beim nächsten Start/Öffnen angeboten. Test: `tests/e2e/m1-file.spec.ts` („Zurück-Undo …“, `test.fail`). (QA ✓ M1 Nachprüfung; Randfall „behaltene“ Sicherung siehe QA-M1-08)
- [x] [QA] QA-M1-04 (gering, erledigt: aktive Page wird in den sichtbaren Bereich gescrollt) Tab-Leiste: Läuft sie über, wird eine neu angelegte bzw. aktive Page nicht in den sichtbaren Bereich gescrollt. Test: `tests/e2e/m1-browser.spec.ts` (`test.fail`). (QA ✓ M1 Nachprüfung; Restfälle Fenstergröße/Umbenennen siehe QA-M1-09)
- [x] [QA] QA-M1-05 (gering, erledigt: oxlint-Override für `src/core/**`) Die Regel „`src/core/` ohne React/DOM/Tauri“ wird nicht automatisch geprüft (keine Lint-Regel, `tsconfig` gibt `DOM` für alles frei). Derzeit eingehalten. (QA ✓ M1 Nachprüfung; Lücken der Verbotsliste siehe QA-M1-10)
- [x] [QA] QA-M1-06 (gering, erledigt: eindeutige zugängliche Namen) Start-Page-Karte „Neuer Festplatz“ überschreibt per `aria-label` ihren Inhalt und hat denselben zugänglichen Namen wie der „+“-Button (`src/ui/startpage/StartPage.tsx:25`). (QA ✓ M1 Nachprüfung)
- [QA] QA-M1-07 (mittel, Klärung nötig; M1-24) Die nach Laurins Hardwaretest umgedrehte Wischrichtung (`src/ui/canvas/wheel.ts:44`, Inhalt bewegt sich mit +delta) läuft der Scrollrichtung des Systems entgegen: Dieselbe waagerechte Wischgeste schiebt den Inhalt der Tab-Leiste (natives Scrollen) nach links, den der Zeichenfläche nach rechts. Bei der macOS-Standardeinstellung „Natürliche Scrollrichtung“ bewegt sich der Plan damit gegen die Finger. Klären, mit welcher Einstellung getestet wurde. Test: `tests/e2e/m1-recheck.spec.ts` („QA-M1-07 …“, `test.fail`). Siehe `qa/M1-nachpruefung.md`.
- [QA] QA-M1-08 (mittel; M1-19) Eine per Esc/Klick daneben „behaltene“ Sicherung geht verloren: Der nächste Autosave überschreibt sie (schon vor dem Fix so), und seit dem Fix zu QA-M1-03 wird sie nach einem Undo zum sauberen Stand ganz gelöscht. Beim nächsten Start wird nichts mehr angeboten. Test: `tests/e2e/m1-recheck.spec.ts` („QA-M1-08 …“, `test.fail`).
- [QA] QA-M1-09 (gering; M1-04) Tab-Leiste: Der aktive Tab wird nur beim Wechsel der aktiven Page in Sicht gescrollt (`src/ui/shell/TabBar.tsx:37-45`, Abhängigkeit `[active]`). Nach Verkleinern des Fensters liegt er ganz außerhalb, nach Umbenennen in einen langen Namen ist er teilweise verdeckt. Tests: `tests/e2e/m1-recheck.spec.ts` (2 × `test.fail`), Screenshot `qa/screenshots/recheck-tab-rename-cut.png`.
- [QA] QA-M1-10 (gering, Risiko; QA-M1-05) Die Lint-Sperre für `src/core/` ist eine Verbotsliste und lässt weitere DOM-Zugriffe durch: `globalThis.document`, `DOMParser`, `Image`, `self`, `fetch`, DOM-Typen wie `HTMLDivElement`. Robuster wäre eine eigene `tsconfig` für `src/core/` ohne `lib: DOM`. Test: `tests/e2e/m1-recheck-lint.spec.ts` (`test.fail`).
- [QA] QA-M1-11 (gering, Dokumentation/Prozess) Die Entwicklung hat QA-Artefakte geändert: Abschnitt „Behoben“ an `qa/M1.md` angehängt und die Erwartung des QA-Tests „M1-24: Zwei-Finger-Wischen“ umgedreht (`tests/e2e/m1-canvas.spec.ts:104-107`, begründet). Dazu Widersprüche: QA-M1-02 steht hier als „erledigt“, in `qa/M1.md` als „teilweise“; die Einträge QA-M1-03/-04 nennen noch `test.fail`, obwohl die Markierungen entfernt sind.
- [QA] QA-M1-12 (gering, Test-Infrastruktur) `tests/e2e/m1-file.spec.ts:193` schreibt bei jedem E2E-Lauf `qa/screenshots/m1-recovery-dialog.png` neu. Der Dialog enthält Datum und Uhrzeit, deshalb ist die Arbeitskopie nach jedem Lauf verändert. Screenshots nur auf Anforderung schreiben, z. B. über eine Umgebungsvariable.

---

## Querschnitt (gilt für alle Meilensteine)
- [ ] Q-01 Läuft auf Windows und macOS (NFA)
- [ ] Q-02 Komplett offline, kein Server, kein Account (NFA)
- [~] Q-03 Personenbezogene Händlerdaten bleiben lokal; nichts wird von fremden Servern nachgeladen, auch keine Schriften oder Icons (NFA, DSGVO, Gestaltung) – bisher eingehalten: Schriften über @fontsource, Icons über npm, CSP erlaubt nur `self`
- [ ] Q-04 Flüssig mit mindestens 500 Ständen über alle Festplätze (NFA)
- [~] Q-05 TypeScript strict (NFA) – aktiv seit M1 (`strict`, `noUncheckedIndexedAccess`)
- [ ] Q-06 Geometrie-, Freiflächen- und Nummerierungslogik als reine, UI-unabhängige Module mit Unit-Tests (Vorgehen 4, NFA)
- [ ] Q-07 Builds für Windows und macOS über GitHub Actions (Tech-Stack)
- [~] Q-08 Oberfläche komplett auf Deutsch (UI/Allgemein) – bisher eingehalten
- [ ] Q-09 Jedes Werkzeug, jede Page und jeder wichtige Button hat einen Shortcut; neue Funktionen tragen sich in die zentrale Shortcut-Konfiguration ein (Tastaturkürzel)

## M1 – Grundgerüst
- [x] M1-01 Projekt-Setup: Tauri 2, React, TypeScript, Vite, Vitest (Tech-Stack) – Desktop-App kompiliert und startet; native Dialoge noch manuell zu prüfen (QA ✓ M1)
- [x] M1-02 Datenmodell Projekt → Pages, Dateiformat mit Schema-Version und Migrationen (Begriffe, §10) (QA ✓ M1)
- [x] M1-03 Start-Page: immer erste Page, nicht löschbar, vorerst leer (Begriffe, Meilenstein 1) (QA ✓ M1)
- [x] M1-04 Tab-Leiste oben: Start-Page ganz links, danach die Festplatz-Pages, Wechsel per Klick (Layout) (QA ✓ M1)
- [x] M1-05 „+“-Tab legt eine neue Festplatz-Page an (Layout, Begriffe) (QA ✓ M1)
- [x] M1-06 Page umbenennen per Doppelklick (Layout, Begriffe) (QA ✓ M1)
- [x] M1-07 Rechtsklick-Kontextmenü: Duplizieren, Löschen (Layout, Begriffe) (QA ✓ M1)
- [x] M1-08 Pages per Drag & Drop in der Tab-Leiste umsortieren (Begriffe) (QA ✓ M1)
- [x] M1-09 Pages per Shortcut durchschalten (Layout) (QA ✓ M1)
- [x] M1-10 Grundlayout: Tab-Leiste, Steuerungsleiste (vorerst leer), Werkzeugleiste links, Zeichenfläche Mitte, Seitenleiste rechts (Layout) (QA ✓ M1)
- [x] M1-11 Werkzeugleiste nur aus Icons; Tooltip mit Name, Kurzbeschreibung, Shortcut; aktive Werkzeuge und Umschalter farblich hervorgehoben (Layout) (QA ✓ M1)
- [x] M1-12 Material Symbols lokal gebündelt (npm, SVG) (Gestaltung) (QA ✓ M1)
- [x] M1-13 Gestaltung angelehnt an Illustrator: dunkles neutrales Grau als Standard, helles Theme optional, kompakte Panels, kleine Schrift, kein Adobe-Branding (Gestaltung) (QA ✓ M1)
- [x] M1-14 Seitenleiste per Button und Shortcut einklappbar; Tab blendet alle Panels aus (Layout) (QA ✓ M1)
- [x] M1-15 Zoom: Mausrad, Strg/Cmd + / −, „an Fenster anpassen“ Strg/Cmd+0 (Layout, Tastaturkürzel) (QA ✓ M1)
- [x] M1-16 Pan: Leertaste + Ziehen (temporäre Hand), Hand-Werkzeug H (Layout, Tastaturkürzel) (QA ✓ M1)
- [x] M1-24 Trackpad: Pinch zoomt, Zwei-Finger-Wischen verschiebt; Mausrad zoomt weiterhin (Layout, Entscheidung 2026-10-10, aus E-01) (QA ✓ M1)
- [x] M1-17 Werkzeuge Auswahl (V) und Zoom (Z) (Layout, Tastaturkürzel) (QA ✓ M1)
- [x] M1-18 Projekt als eine Datei speichern/laden (`.schelme` = ZIP mit `project.json` + Assets) (§10) (QA ✓ M1)
- [!] M1-19 Autosave in Sicherungsdatei mit Wiederherstellung beim Öffnen (§10) (erste QA ✓ M1; Nachprüfung: Nacharbeit nötig, QA-M1-08 in `qa/M1-nachpruefung.md`)
- [x] M1-20 Undo/Redo projektweit, Strg/Cmd+Z / Strg/Cmd+Shift+Z (§10, Tastaturkürzel) (QA ✓ M1)
- [x] M1-21 Shortcut-System: zentrale Konfiguration, Cmd auf macOS statt Strg, Illustrator-Konventionen (Tastaturkürzel) (QA ✓ M1)
- [x] M1-22 Shortcut-Übersicht per `?` (Tastaturkürzel) (QA ✓ M1)
- [x] M1-23 Tooltips mit Name und Shortcut beim Hovern über Buttons (Tastaturkürzel) (QA ✓ M1)

## M2 – Hintergrund, Maßstab, Raster, Messen
- [ ] M2-01 Hintergrundplan pro Festplatz-Page importieren: PDF mit Seitenauswahl bei mehrseitigen PDFs (§1)
- [ ] M2-02 Hintergrund-Import SVG, JPEG, PNG (§1)
- [ ] M2-03 Deckkraft des Hintergrunds einstellbar (§1)
- [ ] M2-04 Hintergrund sperrbar (§1)
- [ ] M2-05 Hintergrund austauschbar ohne Verlust der gezeichneten Objekte (§1)
- [ ] M2-06 Kalibrierungs-Werkzeug: zwei Punkte klicken, realen Abstand in m eingeben, Hintergrund wird skaliert; jederzeit wiederholbar (§1, Layout)
- [ ] M2-07 Hintergrund verschieben und drehen (§1)
- [ ] M2-08 Nordrichtung pro Festplatz-Page einstellbar (§1)
- [ ] M2-09 Raster mit einstellbarer Weite; Umschalter „Raster ein/aus“ in der Werkzeugleiste (§1, Layout)
- [ ] M2-10 Messwerkzeug: zwei Punkte klicken, Abstand in m; bleibt bis zum nächsten Werkzeugwechsel sichtbar (Messwerkzeug, Layout)

## M3 – Grundflächen, Geschäfte, Seitenleiste, Steuerungsleiste, Beschriftung
- [ ] M3-01 Grundfläche = Rechteck, frei rotierbar, Breite = Länge der Vorderseite, Tiefe senkrecht dazu; nur Rechtecke (Begriffe)
- [ ] M3-02 Grundflächen-Werkzeug: Rechteck aufziehen und drehen (§2, Layout)
- [ ] M3-03 Vorderseite per Klick auf eine Kante festlegen, deutlich markiert (§2)
- [ ] M3-04 Automatische Grundflächen-Beschriftung mit Maßen, z. B. „50 × 10 m“ (§2)
- [ ] M3-05 Geschäfts-Werkzeug: Stand B × T anlegen (§3, Layout)
- [ ] M3-06 Geschäfte frei verschieben und drehen; Drehung numerisch; Shift rastet in 15°-Schritten ein (§3)
- [ ] M3-07 Geschäfts-Attribute in der Seitenleiste: Platznummer, Geschäftsname, Eigentümer, Typ/Ware, Breite, Tiefe, Strom in kW, Anschlussart (230 V / CEE 16 A / CEE 32 A), Notiz (§3)
- [ ] M3-08 Farbe/Kategorie pro Geschäft; Kategorien mit Name und Farbe im Projekt (§3)
- [ ] M3-09 Standbeschriftung mittig aus konfigurierbarer Vorlage, z. B. `{nr}` / `{name}` / `{breite}×{tiefe} m` (§3)
- [ ] M3-10 Standbeschriftung immer horizontal, unabhängig von der Drehung, auf oberster Ebene (§3)
- [ ] M3-11 Feste Schriftgröße in Planeinheiten, skaliert mit dem Zoom; Text darf über den Stand ragen, nichts wird gekürzt oder verkleinert (§3)
- [ ] M3-12 Steuerungsleiste: X, Y, Breite, Tiefe, Drehung des ausgewählten Objekts direkt bearbeitbar (Layout)
- [ ] M3-13 Seitenleiste: Eigenschaften des ausgewählten Objekts (Layout)
- [ ] M3-14 Ebenen-Panel: Ebenen (Hintergrund, Grundflächen, Freiflächen, Geschäfte, Infrastruktur, Beschriftung) ein-/ausblendbar und sperrbar; jede Ebene erscheint, sobald ihre Objekte existieren (Layout, Allgemein)
- [ ] M3-15 Mehrfachauswahl: Shift+Klick, Auswahlrechteck (Allgemein)
- [ ] M3-16 Kopieren/Einfügen, Duplizieren (Allgemein)
- [ ] M3-17 Verschieben per Pfeiltasten (0,1 m, mit Shift 1 m), Entf löscht (Allgemein)
- [ ] M3-18 Messwerkzeug fängt an Ecken und Kanten von Objekten (Messwerkzeug)

## M4 – Freiflächen, Fang, Warnungen
- [ ] M4-01 Freiflächen-Kernlogik aus dem Prototyp mit Unit-Tests: Achse entlang der Vorderseite [0, Breite], belegtes Intervall = Projektion der Schnittmenge, Freiflächen = [0, Breite] minus Vereinigung, volle Tiefe, nie hinter einem Stand (§4)
- [ ] M4-02 Freiflächen werden nie manuell gezeichnet, nur berechnet und angezeigt (Begriffe, §4)
- [ ] M4-03 Mindestbreite für Freiflächen (Standard 0,5 m, einstellbar) (§4)
- [ ] M4-04 Live-Neuberechnung beim Verschieben, Drehen, Ändern der Maße, Löschen (§4)
- [ ] M4-05 Freiflächen-Beschriftung horizontal mit fester Schriftgröße, wie bei Ständen (§4)
- [ ] M4-06 Fang an der Vorderseite: Stand rastet beim Ziehen in eine Grundfläche an der Vorderseite ein und übernimmt deren Ausrichtung (§3)
- [ ] M4-07 Fang-Umschalter in der Werkzeugleiste, einzeln schaltbar: Vorderkante, Raster, Nachbarstände (§3, Layout)
- [ ] M4-08 Alt kehrt den Fang beim Ziehen temporär um (§3)
- [ ] M4-09 Warnung, wenn ein Geschäft außerhalb von Grundflächen steht; keine Blockade; global und pro Stand deaktivierbar (§3)
- [ ] M4-10 Warnung bei Überlappung zweier Stände (§3)

## M5 – Nummerierung, Strom
- [ ] M5-01 Nummerierung links → rechts entlang der Vorderseite, Grundflächen in festlegbarer Reihenfolge (§5)
- [ ] M5-02 Nummerierung im Uhrzeigersinn um einen pro Festplatz manuell gesetzten Mittelpunkt mit Startrichtung (§5)
- [ ] M5-03 Manueller Nummerierungsmodus (§5)
- [ ] M5-04 Startnummer, Präfix pro Festplatz (z. B. „A-“), global durchgehend oder pro Festplatz (§5)
- [ ] M5-05 Manuelle Nummern fixierbar; die Automatik überspringt den Stand und seine Nummer (keine Duplikate) (§5)
- [ ] M5-06 Neu nummerieren nur per Button mit Vorschau (§5)
- [ ] M5-07 Optionales Stromlimit pro Festplatz in kW (§6)
- [ ] M5-08 Strombalken auf der Festplatz-Page (grün, gelb ab 90 %, rot über Limit) (§6)
- [ ] M5-09 Warnung beim Überschreiten des Stromlimits, Blockieren optional (§6)

## M6 – Start-Page: Statistik, Listen, Tabelle, Einstellungen
- [ ] M6-01 Kennzahlen global und pro Festplatz: Anzahl Geschäfte, Summe Frontmeter, belegte Fläche, Stromsumme vs. Limit inkl. Strombalken (§6, §7)
- [ ] M6-02 Liste aller Freiflächen (Festplatz, Grundfläche, Maße); Klick wechselt die Page, zoomt hin und hebt die Fläche kurz hervor (§7)
- [ ] M6-03 Tabelle aller Geschäfte über alle Festplätze: sortier- und filterbar (§7)
- [ ] M6-04 Tabelle direkt editierbar, Änderungen wirken sofort im Plan; Klick springt zum Stand (§7)
- [ ] M6-05 Projekteinstellungen: Projektname, Nummerierungsschema, Mindestbreite Freiflächen, Schriftgröße der Standbeschriftung (§7)

## M7 – Infrastruktur, Schriftfeld, Legende
- [ ] M7-01 Infrastruktur-Objekte: mobile Sperre, feste Sperre, Sanitätsdienst, RTW-Platz, Toilette, Müllcontainer, enge Durchfahrt (mit lichter Breite), freier Marker mit Text; je Typ eigene Farbe/Symbol (Begriffe)
- [ ] M7-02 Infrastruktur als aufklappbare Werkzeuggruppe in der Werkzeugleiste (Layout)
- [ ] M7-03 Pro Infrastruktur-Typ einstellbar, ob er die Fläche belegt (dann keine Freifläche an dieser Stelle) (Begriffe, §4)
- [ ] M7-04 Legende auf der Festplatz-Page mit allen verwendeten Typen (Begriffe)
- [ ] M7-05 Schriftfeld pro Festplatz-Page: Projektname, Festplatz, Datum/Version, optionales Freitextfeld (Begriffe, §8)
- [ ] M7-06 Schriftfeld frei verschiebbar, einheitliches Layout auf allen Pages; Schriftfeld-Werkzeug (§8, Layout)

## M8 – PDF-Export
- [ ] M8-01 Export Gesamtplan (alle Festplatz-Pages, optional Start-Page-Listen als Anhang) oder einzelne Pages (§9)
- [ ] M8-02 Papierformat A4–A0, Hoch/Quer (§9)
- [ ] M8-03 Maßstab wählbar (z. B. 1:200, 1:500) oder „an Seite anpassen“ (§9)
- [ ] M8-04 Maßstabsbalken, Nordpfeil, Legende im PDF (§9)
- [ ] M8-05 Vektor-PDF mit durchsuchbarem Text; PDF-Hintergründe bleiben Vektor (§9)
- [ ] M8-06 Ebenen beim Export ein-/ausblendbar (§9)
- [ ] M8-07 Export-Profile speicherbar, z. B. „Sanität/Ordnungsamt“ ohne Eigentümer und Strom, „intern“ mit allem (§9)

## M9 – Phase 2: Händler-Import, Jahresvorlage, CSV/XLSX
- [ ] M9-01 Händlerliste aus CSV/XLSX importieren mit Spaltenzuordnung (§10)
- [ ] M9-02 Liste „noch nicht platziert“; Händler per Drag & Drop platzieren (§10)
- [ ] M9-03 Projekt als Vorlage fürs nächste Jahr duplizieren (§10)
- [ ] M9-04 Export der Tabellen als CSV/XLSX (§7)

---

## Zuordnungsprüfung (Stand 2026-10-10)
Jede Anforderung aus `spec.md` ist genau einem Eintrag zugeordnet. Abschnitte ohne Anforderungen
(Kontext, Vorgehen 1–3, Meilensteinliste) sind Arbeitsanweisungen und erscheinen nicht als Features.
Zuordnungen, die in der Meilensteinliste der Spec nicht ausdrücklich stehen:
- Autosave (M1-19) und Undo/Redo (M1-20) → M1, weil Store und Dateiformat sie von Anfang an tragen müssen.
- Ebenen-Panel (M3-14), Mehrfachauswahl/Kopieren/Pfeiltasten (M3-15 bis M3-17) → M3, sobald es Objekte gibt.
- Messwerkzeug-Fang an Objekten (M3-18) → M3, weil es in M2 noch keine Objekte gibt.
- Legende auf der Zeichenfläche (M7-04) → M7, im PDF → M8-04.
- Strom auf der Start-Page → M6-01, auf der Festplatz-Page → M5-08.
- CSV/XLSX-Export der Tabellen (§7) → M9-04, wie in der Meilensteinliste.

---

## Abschluss M1 (2026-10-10)

Abgleich mit `spec.md` vor diesem Abschluss: Die Entscheidungen aus den Rückfragen (Infrastruktur
belegt Fläche pro Typ, Freiflächen-Beschriftung horizontal, ZIP-Dateiformat, Hintergrund drehbar,
Nordrichtung pro Page, fixierte Nummern, manueller Uhrzeigersinn-Mittelpunkt, SVG-Zeichenfläche)
stehen jetzt in `spec.md`. Jede davon hat einen Backlog-Eintrag. Keine Anforderung fehlt.

_Stand korrigiert am 2026-10-10 nach QA (QA-M1-01). Die Abschnitte „Nachtrag M1“, „Antworten auf die
offenen Fragen“ und „QA-Nacharbeit M1“ unten beschreiben, was nach dem ersten Abschluss dazukam._

### Umgesetzt
- Projekt-Setup: React 19, TypeScript 7 (strict), Vite 8, Vitest; Tauri-2-Hülle (`src-tauri/`) mit Dialog- und Dateisystem-Plugin, App-Icons, Dateizuordnung `.schelme`. Die Desktop-App kompiliert und startet (siehe Antworten, Punkt 1).
- Datenmodell vollständig angelegt (`src/core/model/types.ts`), mit Standardwerten, Validierung beim Laden, Formatversion und Migrationsgerüst.
- Dateiformat `.schelme` (ZIP: `project.json` + `assets/`), Speichern, Speichern unter, Öffnen, Neu; Rückfrage bei ungespeicherten Änderungen (auch beim Schließen des Fensters).
- Autosave alle 30 s in eine Sicherungsdatei; Wiederherstellung beim App-Start bzw. beim Öffnen einer Datei, wenn die Sicherung neuer ist. Wird das Projekt per Undo wieder sauber, wird die eigene Sicherung entfernt (QA-M1-03).
- Undo/Redo projektweit über Immer-Patches, inklusive Transaktionen (für Ziehvorgänge ab M3).
- Tab-Leiste: Start-Page (fest, links), Festplatz-Pages anlegen (+), umbenennen (Doppelklick, F2), Kontextmenü (Umbenennen, Duplizieren, Löschen), Umsortieren per Ziehen, Wechsel per Klick und Shortcut (Strg+Tab, Strg+Bild↑/↓, Alt+0…9). Die aktive Page bleibt in einer übervollen Leiste sichtbar, das Mausrad scrollt die Leiste seitwärts (QA-M1-04).
- Layout: Tab-Leiste, Steuerungsleiste, Icon-Werkzeugleiste, Zeichenfläche, Seitenleiste; dunkles Theme als Standard, helles optional.
- Werkzeugleiste mit allen Werkzeugen der Spec. Auswahl, Hand und Zoom funktionieren; die übrigen sind ausgegraut, ihr Tooltip nennt den Meilenstein.
- Zeichenfläche: Zoom per Mausrad (um den Mauszeiger), Pinch, Strg/Cmd +/−, Strg/Cmd+0, Zoom-Werkzeug (Klick, Alt+Klick); Pan per Zwei-Finger-Wischen, Leertaste, Hand-Werkzeug, mittlere Maustaste; Statusleiste mit Koordinaten und Maßstab.
- Shortcut-System: zentrale Konfiguration (`src/ui/shortcuts/definitions.ts`), Cmd auf macOS, QWERTZ-sicher; Übersicht per `?`; Tooltips mit Name, Taste und Beschreibung.
- Seitenleiste einklappbar (Button, Shift+Tab); Tab blendet alle Panels aus.
- Tests: 28 Unit-Tests (Modell, Dateiformat, Viewport, Store/Undo, Shortcuts, Rad-Deutung). E2E (Playwright, Chromium + WebKit): der Smoke-Test aus dem Nachtrag plus 69 Testfälle aus der QA (`tests/e2e/m1-*.spec.ts`). Der im ersten Abschluss erwähnte „automatisierte Klicktest“ war ein einmaliges Skript außerhalb des Repositorys; er ist durch die eingecheckten E2E-Tests ersetzt.

### Nicht umgesetzt / verschoben
- Nichts aus M1. Alle 24 Einträge sind `[x]` und von der QA bestätigt (`qa/M1.md`).
- Nur manuell prüfbar und noch offen: native Dateidialoge, Autosave-Dateien neben dem Projekt, Schließen-Dialog der Desktop-App, echte Maus/echtes Trackpad (Checkliste in `qa/M1.md`).

### Abweichungen von SPEC.md bzw. vom Plan
- Die Zeichenfläche zeigt schon jetzt ein festes Orientierungsraster (1 m / 10 m), damit Zoom und Pan sichtbar sind. Einstellbare Weite und Ein/Aus folgen mit M2-09.
- Die Start-Page ist nicht ganz leer: Sie zeigt Projektname, Anzahl und Karten der Festplätze (Klick wechselt), eine Karte „Neuer Festplatz“ und einen Hinweis auf M6.
- Die Start-Page nutzt die ganze Breite, ohne Werkzeugleiste und Seitenleiste; die Spec beschreibt das Layout nur für Zeichen-Pages.
- Das Design (hell/dunkel) ist eine App-Einstellung pro Rechner und gehört nicht zum Projekt (im Plan stand `settings.theme`).
- Zusätzlicher Ordner `src/app/` für die Steuerung (Befehle, Datei-Aktionen, Autosave, Tastatur); `src/platform/` kapselt alle Betriebssystem-Zugriffe.
- Icons kommen per Vite-`?raw`-Import statt über `vite-plugin-svgr`; eine Abhängigkeit weniger, gleiches Ergebnis.
- Eine Page mit Objekten wird erst nach Rückfrage gelöscht (zusätzlich zu Undo).
- Werkzeug-Shortcuts (von Laurin bestätigt): Grundfläche F, Geschäft G, Infrastruktur I, Messen M, Kalibrieren K, Schriftfeld T, Fang Shift+F/R/N, Raster Cmd/Strg+# bzw. '.
- Der Tooltip zeigt die Taste als eigenes Kästchen statt im Format „Name (G) – Beschreibung“ aus dem Spec-Beispiel; der Inhalt ist gleich.
- Linter ist oxlint statt ESLint (siehe Nachtrag).

### Bekannte Bugs und Einschränkungen
- Maus/Trackpad werden heuristisch unterschieden (`src/ui/canvas/wheel.ts`). Pinch und Wischen sind auf echter Hardware bestätigt; das Mausrad einer echten Maus in der Desktop-App ist noch zu prüfen. In Playwright-WebKit wird ein synthetisches Mausrad als Trackpad gedeutet (der E2E-Test dazu läuft nur in Chromium).
- Die Wischrichtung folgt den Deltas des Systems; ändert man unter macOS die „Natürliche Scrollrichtung“, kehrt sie sich mit um (E-09).
- Im Browser-Dev-Modus fangen manche Browser Shortcuts wie Cmd/Strg+N ab (E-05).
- Ein Doppelklick auf eine `.schelme`-Datei öffnet sie noch nicht in der App (E-02).

### Offene Fragen (alle beantwortet, siehe unten)
1. Rust installieren? 2. Git-Repository? 3. Werkzeug-Shortcuts? 4. Trackpad-Verhalten?

### Nachtrag M1 (2026-10-10, vor M2)
- Der QA-Agent (`.claude/agents/qa-tester.md`) ist eingerichtet; neuer Backlog-Status `[!]`.
- npm-Scripts vollständig: `typecheck`, `lint` (neu), `test`, `test:e2e` (neu), `build`, `check` (neu, alles zusammen).
- Linter: **oxlint** statt ESLint. typescript-eslint unterstützt TypeScript 7 noch nicht (Peer-Abhängigkeit `<6.1`). oxlint ist ESLint-kompatibel und braucht kein TypeScript; die Typprüfung bleibt bei `tsc`. Konfiguration: `.oxlintrc.json`, Warnungen gelten als Fehler.
- Der Linter hat einen echten Fehler gefunden und er ist behoben: In `Canvas.tsx` wurde ein Ref während des Renderns geschrieben; das geschieht jetzt in einem Layout-Effekt.
- Playwright eingerichtet (`playwright.config.ts`, `tests/e2e/`), Projekte Chromium (≈ WebView2/Windows) und WebKit (≈ macOS-Webview). Erster Smoke-Test: App startet ohne Konsolenfehler, Tab-Leiste, Start-Tab, aktive Festplatz-Page und Werkzeugleiste sind sichtbar. Läuft in beiden Browsern.
- Browser-Lauffähigkeit: Das Frontend lief schon vorher im Browser, aber `src/app/window.ts` rief die Tauri-Fenster-API direkt auf (abgesichert durch eine Laufzeitabfrage). Jetzt gibt es eine richtige Schnittstelle `Platform` (`src/platform/types.ts`) mit zwei Implementierungen: `tauri.ts` (native Dialoge, Dateisystem, Fenster) und `browser.ts` (Upload, Download, localStorage, `beforeunload`). Außerhalb von `tauri.ts` importiert kein Code mehr `@tauri-apps/*`.
- CLAUDE.md enthält alle Befehle und die QA-Regeln.

### Antworten auf die offenen Fragen (2026-10-10)
1. Rust ist installiert. Die Desktop-App kompiliert (`tauri build --debug --no-bundle`) und startet ohne Fehler; M1-01 ist damit `[x]`. Native Dateidialoge, Autosave-Dateien neben dem Projekt und den Schließen-Dialog konnte ich nicht automatisch bedienen → manuell prüfen.
2. Git-Repository: https://github.com/LaurinLudwig/Schelmenplaner (öffentlich). Commits laufen unter der GitHub-noreply-Adresse, damit keine private E-Mail-Adresse öffentlich wird.
3. Werkzeug-Shortcuts F, G, I, M, K, T bestätigt.
4. Trackpad: Pinch zoomt, Zwei-Finger-Wischen verschiebt, das Mausrad zoomt weiterhin → M1-24, `spec.md` angepasst. Ob ein Rad-Ereignis von Maus oder Trackpad kommt, erkennt `src/ui/canvas/wheel.ts` heuristisch (Unit-Tests vorhanden). Für Safari/macOS-Webview wird Pinch zusätzlich über Gesten-Ereignisse verarbeitet. Mit echter Maus und echtem Trackpad in der Desktop-App manuell prüfen; eine Magic Mouse verhält sich wie ein Trackpad (Wischen verschiebt).

### QA-Nacharbeit M1 (2026-10-10)
Befunde aus `qa/M1.md` abgearbeitet; Details im Abschnitt „Behoben“ des Berichts.
- QA-M1-03 Autosave: `src/app/autosave.ts` entfernt die eigene Sicherung, sobald das Projekt wieder dem gespeicherten Stand entspricht (sofort per Store-Abo und zusätzlich im 30-s-Takt).
- QA-M1-04 Tab-Leiste: Die aktive Page wird in den sichtbaren Bereich gescrollt; das Mausrad scrollt die Leiste seitwärts.
- QA-M1-05: Override in `.oxlintrc.json` für `src/core/**`: verbietet React, Tauri, zustand, Importe aus `state/`, `ui/`, `app/`, `platform/` und DOM-Globals (`window`, `document`, `localStorage` …). Mit einer Probedatei gegengeprüft.
- QA-M1-06: `tip()` kennt `ariaLabel`. Die Karte heißt für Screenreader „Neuer Festplatz – Leere Festplatz-Page anlegen“ (sichtbarer Inhalt), der „+“-Button „Festplatz-Tab hinzufügen“.
- QA-M1-02: Pinch funktioniert laut Laurin; das Verschieben lief invertiert und ist umgedreht (`src/ui/canvas/wheel.ts`). Der E2E-Test „M1-24: Zwei-Finger-Wischen“ prüfte die alte Richtung und ist angepasst (Begründung siehe Bericht).
- QA-M1-01: Abschluss M1 oben korrigiert.
