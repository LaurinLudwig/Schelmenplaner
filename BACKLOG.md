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
Erledigte Einträge stehen in `docs/archiv/eingang-erledigt.md` bzw. im Archiv des Meilensteins.

- E-02 (Lücke) Doppelklick auf eine `.schelme`-Datei im Finder/Explorer: Die Dateizuordnung ist in `tauri.conf.json` eingetragen, aber die App öffnet die übergebene Datei noch nicht. Braucht etwas Rust-Code (Startargumente / macOS-Open-Event).
- E-03 (Idee) Natives Menü (macOS-Menüleiste, Windows-Fenstermenü) statt des In-App-Menüs links oben.
- E-04 (Idee) Liste „Zuletzt geöffnet“ im Menü.
- E-05 (Hinweis) Im Browser-Dev-Modus fängt der Browser einige Shortcuts selbst ab (z. B. Cmd/Strg+N, Cmd/Strg+Shift+N). Betrifft nur `npm run dev`, nicht die Desktop-App.
- E-06 (Hinweis) Die Tab-Taste blendet wie in Illustrator die Panels aus und steht damit nicht mehr zum Springen zwischen Bedienelementen zur Verfügung (Barrierefreiheit). In Textfeldern funktioniert Tab normal. Seit M6 gilt das nur noch auf Festplatz-Pages; auf der Start-Page springt Tab zwischen Bedienelementen.
- E-07 (Hinweis) Die Tauri-Dateirechte erlauben Lesen und Schreiben im gesamten Dateisystem (`**`), damit Projekte überall liegen dürfen, auch auf USB-Sticks. Enger fassen, falls gewünscht.
- E-10 (Idee) Plandatei per Drag & Drop auf die Zeichenfläche ziehen, um sie zu importieren.
- E-11 (Hinweis) Autosave schreibt alle 30 s die ganze Datei inklusive Pläne. Bei sehr großen Projekten (> 100 MB) optimieren, z. B. Pläne nur einmal sichern und danach nur `project.json`.
- E-12 (Idee) Gespeicherte Kalibrierpunkte anzeigen bzw. beim erneuten Kalibrieren als Startpunkte anbieten (werden bereits gespeichert).
- E-14 (Idee) Hintergrund per Griff drehen oder per zwei Punkten waagerecht ausrichten (bisher nur Zahlenfeld).
- E-15 (Idee) Mess- und Kalibrierpunkte fangen an Linien des Plans (Vektor-PDF/SVG). Bisher Fang nur an Objekten (ab M3).
- E-16 (Hinweis) Kennwortgeschützte PDFs werden mit einer Meldung abgelehnt (Seitenextraktion nicht möglich).
- E-17 (Idee, Laurin) Lupe bzw. Vergrößerung beim Setzen der Kalibrierpunkte, um die Klickgenauigkeit zu verbessern.
- E-18 (Hinweis) Der QA-Test „abgeschnittenes PNG“ (`m2-qa.spec.ts`) wird in WebKit übersprungen mit der Begründung „WebKit importiert das Teilbild“. Seit QA-M2-02 weist auch WebKit abgeschnittene Bilder ab; der Skip kann entfallen (nicht geändert, da kein `test.fail`).
- E-19 (Lücke, → Feinschliff-Runde, Entscheidung Laurin 2026-10-10) Undo stellt die Auswahl nicht wieder her: Nach „Löschen“ und Rückgängig ist das Objekt wieder da, aber nicht ausgewählt (Illustrator wählt es wieder aus).
- E-21 (Idee) Taste zum Drehen um 90° (der Prototyp hatte R).
- E-22 (Hinweis) Die Grundflächen-Beschriftung wird über eine geschätzte Textbreite (0,56 em pro Zeichen) vor die Vorderseite gesetzt, nicht gemessen. Bei stark gedrehten Flächen mit langem Namen kann der Abstand zur Fläche etwas größer oder kleiner ausfallen.
- E-23 (Hinweis, M8) Der helle Rand um die Beschriftung erscheint erst ab 12 px Schrifthöhe (Leistung WebKit, siehe Abschluss M3). Für den PDF-Export (weißes Papier) separat entscheiden.
- E-24 (Idee) Kopieren/Einfügen zwischen zwei geöffneten Projekten (System-Zwischenablage). Bisher nur innerhalb des Projekts.
- E-26 (Idee, aus M4-Planung) Klick mit dem Geschäfts-Werkzeug in eine Grundfläche setzt den Stand gleich an deren Vorderseite.
- E-27 (Idee, aus M4-Planung) Fang für Grundflächen untereinander (Kanten bündig, Flucht).
- E-28 (Idee, aus M4-Planung) Drehgriff eines Stands rastet an der Drehung der Grundfläche ein, in der er steht.
- E-31 (Hinweis, aus QA-M4-03) Die Lasttests laufen gegen den Entwicklungsserver (React im Entwicklungsmodus, deutlich langsamer als der Produktions-Build). Die Werte sind damit vorsichtig; in der Desktop-App mit der Bildraten-Anzeige (Cmd/Strg+Alt+F) gegenmessen.
- E-32 (Hinweis, aus QA-M4-03) Im macOS-Stromsparmodus drosselt WebKit `requestAnimationFrame` auf 30 Bilder/s. Lasttests (und Messungen in der Mac-App) nur mit ausgeschaltetem Stromsparmodus durchführen.
- E-30 (Lücke, aus M4) Grundflächen-Beschriftung und Freiflächen-Beschriftung können sich bei sehr schmalen Freiflächen mit Standbeschriftungen überdecken (Text wird nicht gekürzt, §3/§4).
- E-33 (Hinweis, aus M5) Wird Einfügen wegen des Stromlimits abgewiesen, zählt der Versatz für das nächste Einfügen trotzdem weiter (nächste Kopie 1 m weiter versetzt).
- E-34 (Idee, aus M5) Mittelpunkt der Nummerierung im Uhrzeigersinn direkt auf der Zeichenfläche ziehen; bisher Klickmodus „Mittelpunkt setzen“ oder Felder X/Y. Das Werkzeug hat keinen eigenen Kurzbefehl und kein Icon in der Werkzeugleiste.
- E-35 (Idee, aus M5, → M6) „Neu nummerieren“ auf der Start-Page für alle Festplätze, auch bei „pro Festplatz“. Bisher nur auf einer Festplatz-Page (bei „global“ betrifft es dort schon alle Pages).
- E-36 (Idee, aus M5) Vorschau „Neu nummerieren“: Zeile anklicken hebt den Stand auf der Zeichenfläche hervor, bzw. alt → neu direkt auf dem Plan zeigen.
- E-37 (Hinweis, aus QA M5; Wunsch Laurin) Windows-Installer auf Deutsch. Er heißt derzeit `Schelmeplaner_0.1.0_x64_en-US.msi`, die Installer-Sprache ist Englisch. Bei Bedarf auf Deutsch umstellen (`tauri.conf.json`, WiX-Sprache).
- E-38 (Idee, Laurin) Den QA-Test „Datei einer neueren Version wird abgewiesen“ (`tests/e2e/m4-qa.spec.ts`) aus `CURRENT_SCHEMA_VERSION + 1` bilden, damit er nicht bei jeder Formatänderung angepasst werden muss (Hinweis aus `qa/M5.md`).
- E-40 (Idee, aus M6) Spaltenbreiten der Geschäftstabelle per Ziehen am Spaltenkopf ändern (pro Rechner speichern). Bisher feste Breiten.
- E-41 (Idee, aus M6) Mehrere Zeilen der Geschäftstabelle auswählen und gemeinsam ändern (z. B. Kategorie für 20 Stände), wie die Mehrfachauswahl in der Seitenleiste.
- E-42 (Idee, aus M6) Warn-Chip „doppelte Nr“ in der Tabelle anklickbar: springt zum anderen Stand bzw. filtert auf die Nummer.
- E-43 (Lücke, aus M6) Die Übersicht der Kurzbefehle (?) nennt die Tasten innerhalb der Geschäftstabelle (Pfeile, Enter/F2, Leertaste, Entf, Cmd/Strg+Enter) nicht; sie stehen nur in der Fußzeile der Tabelle und in spec.md §7.
- E-08 (Hinweis) Browser-Autosave nutzt localStorage (ca. 5 MB). Mit eingebetteten Hintergründen (M2) reicht das nicht; betrifft nur den Browser-Dev-Modus.
- [QA] QA-M1-11 (gering, Dokumentation/Prozess) Die Entwicklung hat QA-Artefakte geändert: Abschnitt „Behoben“ an `qa/M1.md` angehängt und die Erwartung des QA-Tests „M1-24: Zwei-Finger-Wischen“ umgedreht (`tests/e2e/m1-canvas.spec.ts:104-107`, begründet). Dazu Widersprüche: QA-M1-02 steht hier als „erledigt“, in `qa/M1.md` als „teilweise“; die Einträge QA-M1-03/-04 nennen noch `test.fail`, obwohl die Markierungen entfernt sind.
- [QA] QA-M5-05 (gering, Prozess, wiederholt QA-M1-11) Die Entwicklung hat in den Commits `68ab8cb`/`da424cd` bei M5-01, M5-02, M5-08, M5-14, QA-M5-03 und QA-M5-04 selbst den Vermerk „(QA ✓ M5 Nachtest 2026-10-12)“ in `BACKLOG.md` eingetragen, bevor die QA den Nachtest durchgeführt hat. Der Nachtest (`qa/M5.md`, Abschnitt „Nachtest“) hat die Vermerke inhaltlich bestätigt, trotzdem sollte nur die QA „(QA ✓ …)“ setzen. Siehe `qa/M5.md`.
- [QA] QA-M6-01 (gering, Dokumentation) „Abschluss M6“ nennt 260 Unit-Tests; `npx vitest run` meldet tatsächlich 262 bestandene Tests (20 Testdateien). Keine Funktionsauswirkung. Siehe `qa/M6.md`.
- [QA] QA-M6-02 (gering, Dokumentation) „Abschluss M6“ nennt für M6-10 „Tabelle öffnen 42–60 ms“; ein eigener Lauf misst in Chromium 62 ms (WebKit 45 ms, innerhalb der Spanne). Kein Abnahmekriterium aus spec.md betroffen (das NFA verlangt ≥ 50 Bilder/s Median beim Scrollen und kein Bild über 100 ms; beide werden deutlich eingehalten), vermutlich normale Lauf-zu-Lauf-Streuung einer Einzelmessung. Siehe `qa/M6.md`.

---

## Querschnitt (gilt für alle Meilensteine)
- [ ] Q-01 Läuft auf Windows und macOS (NFA)
- [ ] Q-02 Komplett offline, kein Server, kein Account (NFA)
- [~] Q-03 Personenbezogene Händlerdaten bleiben lokal; nichts wird von fremden Servern nachgeladen, auch keine Schriften oder Icons (NFA, DSGVO, Gestaltung) – bisher eingehalten: Schriften über @fontsource, Icons über npm, CSP erlaubt nur `self`
- [~] Q-04 Flüssig mit mindestens 500 Ständen über alle Festplätze (NFA) – M3: Lasttest 500 Stände auf einer Page ≥ 55 Bilder/s in Chromium und WebKit (M3-23); M4: mit Freiflächen, Warnungen und Fang ≥ 51 Bilder/s (M4-21); M5: Lasttests unverändert grün (WebKit-Median ≥ 56); M6: Geschäftstabelle mit 500 Ständen scrollt mit ≥ 58 Bildern/s (M6-10)
- [~] Q-05 TypeScript strict (NFA) – aktiv seit M1 (`strict`, `noUncheckedIndexedAccess`)
- [~] Q-06 Geometrie-, Freiflächen- und Nummerierungslogik als reine, UI-unabhängige Module mit Unit-Tests (Vorgehen 4, NFA) – M3: Rechteck-Geometrie, Treffer, Gruppen-Transformation, Beschriftung in `src/core/` mit Tests; M4: Freiflächen, Warnungen, Fang mit Fall-Tabelle und Eigenschaftstests; M5: Nummerierung (`numbering.ts`) und Strom (`power.ts`) mit Tests
- [x] Q-07 Builds für Windows und macOS über GitHub Actions (Tech-Stack) – Workflow `.github/workflows/build.yml` seit 2026-10-12 (Zwischenschritt vor M5): check + E2E Chromium, dann `.dmg` (Universal) und `.msi`/`.exe` als Artefakte, ohne Signatur; Fundort siehe CLAUDE.md. Erster grüner Lauf 2026-10-12. Dafür QA-Test `m4-qa.spec.ts:982` korrigiert (erwartete nur „⇧F“/„Shift+F“, auf Windows/Linux zeigt die App „Umschalt+F“)
- [~] Q-08 Oberfläche komplett auf Deutsch (UI/Allgemein) – bisher eingehalten
- [ ] Q-09 Jedes Werkzeug, jede Page und jeder wichtige Button hat einen Shortcut; neue Funktionen tragen sich in die zentrale Shortcut-Konfiguration ein (Tastaturkürzel) – M5: „Neu nummerieren …“ Cmd/Strg+Alt+N; „Mittelpunkt setzen“ ohne Kurzbefehl (E-34); M6: Unter-Tabs der Start-Page Cmd/Strg+1/2/3, Suche Cmd/Strg+F, CSV Cmd/Strg+Shift+E

## M1 bis M5 – abgeschlossen und abgenommen
Aufgabenlisten, erledigte QA-Befunde und Abschlüsse: `docs/archiv/M1.md`, `docs/archiv/M2.md`, `docs/archiv/M3.md`,
`docs/archiv/M4.md`, `docs/archiv/M5.md`.

## M6 – Start-Page: Statistik, Listen, Tabelle, Einstellungen
Entscheidungen aus der Planung (2026-10-12) stehen in `spec.md` §7 (dazu §3, §4, §5, §6, Tastaturkürzel).
Keine Formatänderung (Formatversion bleibt 3).
- [x] M6-01 Kennzahlen-Leiste „Gesamt“ und je Festplatz: Anzahl Geschäfte, Frontmeter (= belegte Fläche), Strom mit Balken gegen das Limit, Anzahl/kW je Anschlussart, Warnzahl; Klick öffnet die Page bzw. die gefilterte Tabelle (§6, §7). Rechnung in `src/core/stats.ts` (QA ✓ M6)
- [x] M6-02 Freiflächenliste (Festplatz, Grundfläche, B × T, m², „angeschnitten“), Filter Festplatz und „passt für B × T“ (Toleranz 0,01 m, angeschnittene mit kleinster durchgehender Tiefe), sortierbar; Sprung über `FreeSpaceRef`/`resolveFreeSpace`, Rückfall auf die Grundfläche mit Hinweis (§4, §7). Rechnung in `src/core/freeSpaceList.ts` (QA ✓ M6)
- [x] M6-03 Geschäftstabelle über alle Festplätze: Spalten ein-/ausblendbar (pro Rechner), Sortierung (natürliche Nummern, zweite Stufe, eingefroren nach Zelländerung), Freitextsuche, Filter Festplatz/Kategorie/Anschlussart/„mit Warnung“/„ohne Nummer“, Summenzeile (§7). Rechnung in `src/core/standTable.ts` (QA ✓ M6)
- [x] M6-04 Tabelle direkt editierbar mit den Regeln der Seitenleiste (Grenzen, Zahlenformat, Fixierung, Stromlimit-Blockieren), jede Zelländerung ein Undo-Schritt (§7) (QA ✓ M6)
- [x] M6-05 Projekteinstellungen (Unter-Tab „Einstellungen“): Projektname, Nummernkreis, Beschriftung, Mindestbreite und Warnungsschalter, Kategorien (§7) (QA ✓ M6)
- [x] M6-06 CSV-Export von Geschäftstabelle und Freiflächenliste (UTF-8 mit BOM, Semikolon, Komma-Zahlen, Formelschutz) über `platform.saveFile` (§7) (QA ✓ M6)
- [x] M6-07 Projektweite Bereiche ziehen aus der Seitenleiste auf die Start-Page um (Beschriftung, Freiflächen & Warnungen, Kategorien, Nummernkreis); Seitenleiste zeigt den Nummernkreis mit Link (§3, §4, §5) (QA ✓ M6, inkl. Prüfung der 19 angepassten Bestandstests)
- [x] M6-08 Tastaturbedienung der Tabelle (Pfeile, Pos1/Ende, Bild↑/↓, Enter/F2, Tippen, Esc, Tab, Leertaste, Entf, Cmd/Strg+Enter) ohne Kurzbefehle der Zeichenfläche; Tab springt auf der Start-Page zwischen Bedienelementen; Unter-Tabs Cmd/Strg+1/2/3, Suche Cmd/Strg+F (§7, Tastaturkürzel) (QA ✓ M6)
- [x] M6-09 Sprung zu Stand bzw. Freifläche: Page wechseln, zoomen (mindestens 30 m), Stand auswählen, etwa 1,5 s hervorheben (§7) (QA ✓ M6)
- [x] M6-10 Leistung: Tabelle mit 500+ Zeilen flüssig (Virtualisierung), Lasttest mit `last-500-staende.schelme` (NFA, §7) (QA ✓ M6, siehe `qa/M6.md` QA-M6-02 zur „öffnen“-Zeit)
- [x] M6-11 Kennzahlen zeigen zusätzlich die freien Frontmeter (Summe der Breiten der angezeigten Freiflächen), gesamt und je Festplatz (§7; Entscheidung Laurin 2026-10-12) (QA ✓ M6, inkl. angeschnittener Freiflächen)
- [x] M6-12 E-39 beheben: „M1-16: Mittlere Maustaste“ in WebKit unter Last robust (10 Wiederholungen grün, auch im vollen Lauf) (Auftrag Laurin 2026-10-12) (QA ✓ M6, App-Code unverändert bestätigt)

## Abschluss M6 (2026-10-12)

Abgleich mit `spec.md` vor diesem Abschluss: Die Entscheidungen der M6-Planung (Aufbau mit Kennzahlen-Leiste und
Unter-Tabs, belegte Fläche = Frontmeter, alles Projektweite auf die Start-Page, CSV jetzt und XLSX in Phase 2, Sprung
mit Hervorhebung, Passt-Filter mit Toleranz und Anschnitt-Regel, Tab auf der Start-Page) stehen in `spec.md` §7 (dazu
§3, §4, §5, §6, Tastaturkürzel, Meilensteinliste) und sind auf M6-01 bis M6-10 abgebildet. E-35 bleibt im Eingang.

### Umgesetzt
- **Kern (`src/core/`, ohne DOM/React, mit Tests in `m6.test.ts`, 16 Tests, davon 1 Eigenschaftstest):**
  - `stats.ts`: `projectStats`/`pageStats`, also Anzahl, Frontmeter (ohne Gleitkomma-Reste), Strom über
    `pagePower`, Anschlussarten und Warnzählung über die vorhandenen Zwischenspeicher.
  - `standTable.ts`:
    - Zeilen über alle Pages.
    - Suche ohne Groß-/Kleinschreibung und Akzente, jedes Wort einzeln.
    - Filter, natürliche Sortierung der Nummern (`compareNr`); leere Werte stehen immer am Ende.
    - Gleichstand nach Festplatz, Nummer, ID; dazu `toggleSort` und die Summen.
  - `freeSpaceList.ts`: Zeilen mit `FreeSpaceRef`, `usableDepth` (kleinste durchgehende Tiefe bei angeschnittenen
    Freiflächen), `fitsStand` mit 0,01 m Toleranz, Filter, Sortierung, Summe.
  - `csv.ts`: BOM, Semikolon, CRLF, Komma-Zahlen, Anführungszeichen, Formelschutz, sichere Dateinamen.
  - `viewport.ts`: `focusBounds` (Sprungziel mindestens 30 m).
- **State/App:**
  - `src/state/startPage.ts`: Sitzungszustand (Unter-Tab, Filter, Sortierung, eingefrorene Reihenfolge, aktive
    Zelle, Scrollposition). Die Spaltenauswahl gilt pro Rechner (localStorage); beim Öffnen eines anderen Projekts
    wird alles zurückgesetzt.
  - `setProjectName` (Undo-Schritt).
  - `src/app/jump.ts`: Sprung zu Stand, Freifläche und Grundfläche über `ui.focus`. Die Zeichenfläche zoomt erst,
    wenn sie ihre Größe kennt.
  - `startPageData.ts`: gemeinsame Zeilen für Tabelle und Export.
  - `exportCsv.ts` mit `platform.saveFile` (Tauri: Speichern-Dialog, Browser: Download).
  - Neue Befehle `start.*`; `ui.panels`/`ui.sidebar` nur noch auf Festplatz-Pages.
- **Oberfläche (`src/ui/startpage/`):**
  - `StartPage` mit Kennzahlen-Leiste (`StatsBar`, Strombalken über das herausgelöste `PowerMeter`) und den
    Unter-Tabs Geschäfte, Freiflächen, Einstellungen.
  - `StandTable`:
    - Eigene Virtualisierung mit fester Zeilenhöhe und Grid-Tastatur.
    - Zell-Editoren mit den Funktionen der Seitenleiste (`updateStands`, `setRectField`, `setNrLocked`).
    - Filter-Popover, Spaltenauswahl, Summenzeile, „Sortierung veraltet“.
  - `FreeSpaceList` mit Passt-Filter.
  - `ProjectSettings` mit Projekt, Nummerierung (Nummernkreis), Beschriftung, Freiflächen & Warnungen und
    Kategorien (jetzt mit Zahl der Geschäfte).
  - Die Seitenleiste zeigt keine projektweiten Bereiche mehr. Die Nummerierung nennt den Nummernkreis mit Link zu
    den Projekteinstellungen; das Stand-Panel verlinkt dorthin, solange es keine Kategorien gibt.
  - Hervorhebung nach dem Sprung: pulsierende Akzentkontur, etwa 1,6 s.
- **Tests:**
  - E2E: `m6-startpage.spec.ts` (8 Tests, Chromium und WebKit).
  - Lasttest `m6-table.perf.spec.ts`: Tabelle öffnen 42–60 ms, Scrollen durch 500 Zeilen Median 58,8 (WebKit)
    bzw. 59,9 Bilder/s (Chromium), längstes Bild 33 ms, Zelländerung bis zur Anzeige 11–15 ms.
  - Alle Lasttests grün (WebKit-Median ≥ 56).
  - Komplette Suite: 601 bestanden, 7 übersprungen, beide Browser.
  - `npm run check` grün (260 Unit-Tests).
  - Log: `test-artifacts/logs/m6-perf-all.log`.
- **Keine Formatänderung:** Formatversion bleibt 3.

### Nicht umgesetzt / verschoben
- XLSX-Export → M9-04 (Entscheidung Laurin).
- Spaltenbreiten per Ziehen (E-40), Mehrfachauswahl in der Tabelle (E-41), anklickbarer Hinweis auf doppelte
  Nummern (E-42) sowie die Tabellen-Tasten in der Übersicht (E-43) stehen im Eingang.

### Abweichungen von SPEC.md bzw. vom Plan
- **Bestehende E2E-Tests angepasst (Laurin bitte bestätigen):** Durch den Umzug der projektweiten Bereiche
  (Entscheidung „Alles umziehen“, spec.md §3/§4/§5) fanden 19 Tests ihre Felder nicht mehr in der Seitenleiste.
  - Angepasst sind nur die Stellen, die die Felder benutzen: vorher Start-Page → Einstellungen öffnen, danach zurück
    auf die Page. Die Erwartungen selbst sind unverändert.
  - Betroffene Dateien: `m3-objects.spec.ts` (3 Tests), `m3-qa.spec.ts` (6), `m4-freespace.spec.ts` (2),
    `m4-qa.spec.ts` (3), `m5-numbering.spec.ts` (2), `m5-qa.spec.ts` (3).
  - Dazu zwei neue Helfer `openSettings`/`backToPage` in `helpers.ts`.
  - Der M1-Test zur Karte „Neuer Festplatz“ ist unverändert; die Karte behält dafür die Klasse `card link`.
- Der Bereich Nummernkreis in den Projekteinstellungen heißt für Screenreader „Nummerierung“, wie der Bereich der
  Seitenleiste. Das Beispiel dort nutzt das Präfix des ersten Festplatzes.
- Spaltenbreiten sind fest; der Plan nannte „Spaltenauswahl und Spaltenbreiten pro Rechner“. Pro Rechner
  gespeichert wird nur die Spaltenauswahl (E-40).
- „Passt für B × T“ rechnet bei angeschnittenen Freiflächen mit der kleinsten durchgehenden Tiefe über die ganze
  Breite. Das ist bewusst vorsichtig: Ein schmalerer Stand könnte im tieferen Teil trotzdem passen.
- Notiz ist als Spalte vorhanden, aber standardmäßig ausgeblendet.

### Bekannte Bugs
- Keine bekannten in M6.

### Nachtrag (2026-10-12, Antworten von Laurin)
- **M6-11 Freie Frontmeter:**
  - `freeFrontMeters` und `freeFrontM` in `projectStats`/`pageStats` (`src/core/stats.ts`). Die Freiflächen
    reicht der Aufrufer über `freeOf` mit seinem Zwischenspeicher durch.
  - Gezählt werden die angezeigten Freiflächen ab der Mindestbreite, angeschnittene mit Hüllbreite (spec.md §7).
  - Anzeige „frei“ in jeder Karte.
  - Tests: 2 Unit-Tests (`m6.test.ts`, Mindestbreite, Gleitkomma-Reste, leere Page) und eine Prüfung in
    `m6-startpage.spec.ts`.
- **M6-12 (E-39) „M1-16: Mittlere Maustaste“ in WebKit:**
  - Ursache nicht nachgewiesen: In rund 210 Läufen ließ sich der Fehler nicht wieder auslösen. Darunter waren
    volle Läufe beider Browser, CPU-Last mit 6–10 Dauerprozessen und ein kalter Vite-Cache. Ein erzwungenes
    Neuladen durch Vites Abhängigkeitsoptimierung kam im Server-Log nicht vor.
  - Lücke im Test: Er drückte die Taste, ohne sicher zu sein, dass die Zeichenfläche den Zeiger schon bekommt
    (`openApp` wartet nur auf die Tab-Leiste, `canvasBox` misst nur). Landet der Druck dann am `<html>`, verschiebt
    sich nichts (gemessen 0 statt 30 px).
  - Behoben im Test (Auftrag Laurin):
    - Neuer Helfer `pointerOnCanvas` in `helpers.ts`: Er bewegt die Maus, bis die Statusleiste Koordinaten zeigt.
      Die kommen nur über `pointermove` auf der Zeichenfläche.
    - Erst danach wird der Ursprung gelesen und die Taste gedrückt.
    - Das Ergebnis wird per `expect.poll` abgewartet.
  - App-Code unverändert: Ein Ereignis am `<html>` erreicht die Zeichenfläche nie, dort gibt es nichts abzufangen.
  - Ergebnis: 10 × in WebKit grün, 10 × unter CPU-Last grün; volle Suite grün (601 bestanden, 7 übersprungen).
- Die 19 angepassten Tests aus M6-07 hat Laurin vorbehaltlich der QA-Prüfung akzeptiert.

### Offene Fragen (beantwortet von Laurin, 2026-10-12)
- Suche, Filter und Sortierung werden nicht im Projekt gespeichert, sie gelten pro Sitzung (spec.md §7).
- Die Kennzahlen zeigen zusätzlich die freien Frontmeter → M6-11.
- E-39 wird in M6 behoben → M6-12.
- Die 19 angepassten Tests sind vorbehaltlich der QA-Prüfung akzeptiert.

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
- [ ] M9-04 Export der Tabellen als XLSX (§7; CSV seit M6-06)

---

## Zuordnungsprüfung (Stand 2026-10-12)
Jede Anforderung aus `spec.md` ist genau einem Eintrag zugeordnet. Abschnitte ohne Anforderungen
(Kontext, Vorgehen 1–3, Meilensteinliste) sind Arbeitsanweisungen und erscheinen nicht als Features.
Zuordnungen, die in der Meilensteinliste der Spec nicht ausdrücklich stehen:
- Autosave (M1-19) und Undo/Redo (M1-20) → M1, weil Store und Dateiformat sie von Anfang an tragen müssen.
- Ebenen-Panel (M3-14), Mehrfachauswahl/Kopieren/Pfeiltasten (M3-15 bis M3-17) → M3, sobald es Objekte gibt.
- Messwerkzeug-Fang an Objekten (M3-18) → M3, weil es in M2 noch keine Objekte gibt.
- Größe von Grundflächen per Griff (M3-20), Undo pro Geste (M3-21), Rundung (M3-22), Lasttest (M3-23): Entscheidungen der M3-Planung (2026-10-10). Lasttest als M3-Abnahmekriterium, Q-04 bleibt für alle Meilensteine offen.
- Legende auf der Zeichenfläche (M7-04) → M7, im PDF → M8-04.
- Strom auf der Start-Page → M6-01, auf der Festplatz-Page → M5-08.
- CSV-Export der Tabellen (§7) → M6-06, XLSX → M9-04 (Entscheidung 2026-10-12).
- Umzug der projektweiten Seitenleisten-Bereiche (§3, §4, §5) → M6-07.
