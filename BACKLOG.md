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
- E-06 (Hinweis) Die Tab-Taste blendet wie in Illustrator die Panels aus und steht damit nicht mehr zum Springen zwischen Bedienelementen zur Verfügung (Barrierefreiheit). In Textfeldern funktioniert Tab normal.
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
- E-08 (Hinweis) Browser-Autosave nutzt localStorage (ca. 5 MB). Mit eingebetteten Hintergründen (M2) reicht das nicht; betrifft nur den Browser-Dev-Modus.
- [x] [QA] QA-M5-03 (gering) Kurzbefehle mit Strg/Cmd+Alt (Neu nummerieren, Festplatz duplizieren, Festplatz löschen, Theme, Bildrate) greifen, während ein Textfeld den Fokus hat (`src/app/keyboard.ts:56`). Unter Windows ist AltGr = Strg+Alt: AltGr+D im Präfixfeld dupliziert den Festplatz. Kein Zeichenkonflikt mit deutschem Layout. Siehe `qa/M5.md`. **Erledigt 2026-10-12:** In Textfeldern greifen nur Speichern, Speichern unter, Öffnen und Neu (Cmd/Strg ohne Alt; das Feld übernimmt vorher seinen Wert), alle anderen nicht (Korrektur Laurin); AltGr-Regel in spec.md (Tastaturkürzel) und CLAUDE.md, geprüft von `src/ui/shortcuts/definitions.test.ts` (Entscheidung Laurin). (QA ✓ M5 Nachtest 2026-10-12)
- [x] [QA] QA-M5-04 (gering) `npm run test:perf` verwendet einen schon laufenden Dev-Server wieder (`reuseExistingServer`, aus `playwright.config.ts`); wird dieser beendet, scheitern die folgenden Lasttests mit „Could not connect to the server“ (Ursache der WebKit-Fehler im M5-Lauf). Vorschlag: `reuseExistingServer: false` in `playwright.perf.config.ts`. Siehe `qa/M5.md`. **Erledigt 2026-10-12:** wie vorgeschlagen; ein belegter Port bricht den Lasttest sofort ab. (QA ✓ M5 Nachtest 2026-10-12)
- [QA] QA-M1-11 (gering, Dokumentation/Prozess) Die Entwicklung hat QA-Artefakte geändert: Abschnitt „Behoben“ an `qa/M1.md` angehängt und die Erwartung des QA-Tests „M1-24: Zwei-Finger-Wischen“ umgedreht (`tests/e2e/m1-canvas.spec.ts:104-107`, begründet). Dazu Widersprüche: QA-M1-02 steht hier als „erledigt“, in `qa/M1.md` als „teilweise“; die Einträge QA-M1-03/-04 nennen noch `test.fail`, obwohl die Markierungen entfernt sind.

---

## Querschnitt (gilt für alle Meilensteine)
- [ ] Q-01 Läuft auf Windows und macOS (NFA)
- [ ] Q-02 Komplett offline, kein Server, kein Account (NFA)
- [~] Q-03 Personenbezogene Händlerdaten bleiben lokal; nichts wird von fremden Servern nachgeladen, auch keine Schriften oder Icons (NFA, DSGVO, Gestaltung) – bisher eingehalten: Schriften über @fontsource, Icons über npm, CSP erlaubt nur `self`
- [~] Q-04 Flüssig mit mindestens 500 Ständen über alle Festplätze (NFA) – M3: Lasttest 500 Stände auf einer Page ≥ 55 Bilder/s in Chromium und WebKit (M3-23); M4: mit Freiflächen, Warnungen und Fang ≥ 51 Bilder/s (M4-21); M5: Lasttests unverändert grün (WebKit-Median ≥ 56)
- [~] Q-05 TypeScript strict (NFA) – aktiv seit M1 (`strict`, `noUncheckedIndexedAccess`)
- [~] Q-06 Geometrie-, Freiflächen- und Nummerierungslogik als reine, UI-unabhängige Module mit Unit-Tests (Vorgehen 4, NFA) – M3: Rechteck-Geometrie, Treffer, Gruppen-Transformation, Beschriftung in `src/core/` mit Tests; M4: Freiflächen, Warnungen, Fang mit Fall-Tabelle und Eigenschaftstests; M5: Nummerierung (`numbering.ts`) und Strom (`power.ts`) mit Tests
- [x] Q-07 Builds für Windows und macOS über GitHub Actions (Tech-Stack) – Workflow `.github/workflows/build.yml` seit 2026-10-12 (Zwischenschritt vor M5): check + E2E Chromium, dann `.dmg` (Universal) und `.msi`/`.exe` als Artefakte, ohne Signatur; Fundort siehe CLAUDE.md. Erster grüner Lauf 2026-10-12. Dafür QA-Test `m4-qa.spec.ts:982` korrigiert (erwartete nur „⇧F“/„Shift+F“, auf Windows/Linux zeigt die App „Umschalt+F“)
- [~] Q-08 Oberfläche komplett auf Deutsch (UI/Allgemein) – bisher eingehalten
- [ ] Q-09 Jedes Werkzeug, jede Page und jeder wichtige Button hat einen Shortcut; neue Funktionen tragen sich in die zentrale Shortcut-Konfiguration ein (Tastaturkürzel) – M5: „Neu nummerieren …“ Cmd/Strg+Alt+N; „Mittelpunkt setzen“ ohne Kurzbefehl (E-34)

## M1 bis M4 – abgeschlossen und abgenommen
Aufgabenlisten, erledigte QA-Befunde und Abschlüsse: `docs/archiv/M1.md`, `docs/archiv/M2.md`, `docs/archiv/M3.md`,
`docs/archiv/M4.md`.

## M5 – Nummerierung, Strom
Entscheidungen aus der Planung (2026-10-12) stehen in `spec.md` (§3, §5, §6, §10).
- [x] M5-01 Nummerierung links → rechts über den ganzen Festplatz nach der x-Lage der Standmitte, unabhängig von den Grundflächen, bei gleicher Lage der obere zuerst (geändert 2026-10-12 auf Wunsch von Laurin; vorher je Grundfläche entlang der Vorderseite). Reihenfolge der Grundflächen per ↑/↓ im eigenen Bereich „Grundflächen“, nur noch für überlappende Grundflächen (§4, §5) (QA M5: Nacharbeit, QA-M5-01 in `qa/M5.md`) **Erledigt 2026-10-12:** Vergleich ohne Toleranz auf 0,01 m gerundet (x, dann y, dann ID), Eigenschaftstest mit zufälligen Permutationen inkl. 1-cm-Treppe. (QA ✓ M5 Nachtest 2026-10-12)
- [x] M5-02 Nummerierung im Uhrzeigersinn um einen pro Festplatz gesetzten Mittelpunkt (Klick oder X/Y), Startrichtung relativ zu Norden, Fadenkreuz mit Strahl auf der Zeichenfläche (§5) (QA M5: Nacharbeit, QA-M5-01 in `qa/M5.md`) **Erledigt 2026-10-12:** Winkel auf 0,1° und Abstand auf 0,01 m gerundet ohne Toleranz, Eigenschaftstest mit Permutationen. (QA ✓ M5 Nachtest 2026-10-12)
- [x] M5-03 Manueller Nummerierungsmodus: Automatik lässt die Page aus, bei „global“ gelten ihre Nummern als belegt (§5) (QA ✓ M5)
- [x] M5-04 Format: Präfix pro Festplatz, Startnummer und Stellenzahl projektweit (z. B. „A-01“); Nummernkreis global durchgehend (Tab-Reihenfolge) oder pro Festplatz (§5) (QA ✓ M5)
- [x] M5-05 Fixierte Nummern (Schloss, auch bei Mehrfachauswahl): Automatik überspringt Stand und Nummer im selben Nummernkreis (§5) (QA ✓ M5)
- [x] M5-06 Neu nummerieren nur per Button/Kurzbefehl (Cmd/Strg+Alt+N) mit Vorschau alt → neu, Übernehmen ist ein Undo-Schritt; neue Stände bleiben ohne Nummer, Anzeige „n Stände ohne Nummer“ (§5) (QA ✓ M5)
- [x] M5-07 Optionales Stromlimit pro Festplatz in kW; es zählen alle Stände der Page (§6) (QA ✓ M5)
- [x] M5-08 Strombalken im Seitenleisten-Bereich „Strom“ (immer sichtbar; grün, gelb ab 90 %, rot über Limit) (§6) (QA M5: Nacharbeit, QA-M5-02 in `qa/M5.md`) **Erledigt 2026-10-12:** Stufen auf 0,001 kW gerundet verglichen, Prozent abgerundet bzw. mit Nachkommastelle über dem Limit (`powerPercentLabel`). (QA ✓ M5 Nachtest 2026-10-12)
- [x] M5-09 Überschreitung: Blitz-Symbol am Page-Tab, Hinweis beim Überschreiten; Blockieren optional (Strom-Feld, Einfügen, Duplizieren, Alt+Ziehen; Senkungen erlaubt) (§6) (QA ✓ M5)
- [x] M5-10 Warnung „doppelte Nummer“ je Nummernkreis (auch nach „Festplatz duplizieren“, aus E-25), projektweit abschaltbar, pro Stand ignorierbar, im Warnzähler am Tab (§3, §5) (QA ✓ M5)
- [x] M5-11 Anzahl und kW je Anschlussart im Bereich „Strom“ (§6) (QA ✓ M5)
- [x] M5-12 Strom-Berechnung UI-unabhängig in `src/core/` inklusive Projektsumme, Grundlage für M6-01 (§6, §7) (QA ✓ M5)
- [x] M5-14 Neu nummerieren mit zwei Optionen: „Alle neu nummerieren“ und „Nur Stände ohne Nummer“ (fortlaufend ab der höchsten vergebenen Nummer im Nummernkreis); Vorauswahl „nur ohne Nummer“, sobald Nummern existieren; beide mit Vorschau, je ein Undo-Schritt (§5, Entscheidung Laurin 2026-10-12 aus der QA M5) (QA ✓ M5 Nachtest 2026-10-12)
- [x] M5-13 Formatversion 3: Stellenzahl, Warnung „doppelte Nummer“ (Einstellung und Häkchen am Stand), geprüfter Mittelpunkt; Migration 2 → 3 mit echter M4-Datei (§10) (QA ✓ M5)

## M6 – Start-Page: Statistik, Listen, Tabelle, Einstellungen
- [ ] M6-01 Kennzahlen global und pro Festplatz: Anzahl Geschäfte, Summe Frontmeter, belegte Fläche, Stromsumme vs. Limit inkl. Strombalken (§6, §7)
- [ ] M6-02 Liste aller Freiflächen (Festplatz, Grundfläche, Maße); Klick wechselt die Page, zoomt hin und hebt die Fläche kurz hervor (§7). Verweis über `FreeSpaceRef` und `resolveFreeSpace` aus M4-19 (`src/core/freeSpace.ts`)
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
- Größe von Grundflächen per Griff (M3-20), Undo pro Geste (M3-21), Rundung (M3-22), Lasttest (M3-23): Entscheidungen der M3-Planung (2026-10-10). Lasttest als M3-Abnahmekriterium, Q-04 bleibt für alle Meilensteine offen.
- Legende auf der Zeichenfläche (M7-04) → M7, im PDF → M8-04.
- Strom auf der Start-Page → M6-01, auf der Festplatz-Page → M5-08.
- CSV/XLSX-Export der Tabellen (§7) → M9-04, wie in der Meilensteinliste.

---

## Abschluss M5 (2026-10-12)

Abgleich mit `spec.md` vor diesem Abschluss: Die Entscheidungen der M5-Planung (2026-10-12) stehen in `spec.md` §3
(Warnung „doppelte Nummer“), §5 (Nummerierung), §6 (Strom) und §10 (Formatversion 3). Sie sind auf M5-01 bis M5-13
abgebildet. E-25 ist in M5-10 aufgegangen.

### Umgesetzt
- **Kern (`src/core/`, ohne DOM/React):**
  - `numbering.ts`:
    - Format (`formatNr`) und Vergleich (`nrKey`, „12“ = „012“).
    - Reihenfolgen links → rechts (über den ganzen Festplatz nach der x-Lage der Standmitte, `orderLeftToRight`) und
      im Uhrzeigersinn (Startrichtung relativ zu Norden).
    - `planRenumber`: pro Festplatz/global, fixierte und manuelle Nummern belegt, verbleibende Duplikate.
    - `findDuplicates`/`cachedDuplicates` je Nummernkreis.
  - `power.ts`:
    - `pagePower`: Summe, Stufe ok/warn/over, je Anschlussart.
    - `projectPower` für M6.
    - `checkPowerChange`: blockiert bzw. „erstes Überschreiten“; nur Erhöhungen über das Limit.
  - `warnings.ts`: dritte Warnart „doppelte Nummer“ in `activeWarnings`/`countWarnings`.
- **Modell:** Formatversion 3 mit Migration 2 → 3. Neu sind `numbering.digits`, `warnDuplicateNr` und
  `suppressDuplicateWarning`. Geprüft werden jetzt `clockwise` und `powerLimitKw`. Echte M4-Datei:
  `tests/fixtures/format-v2-m4.schelme`.
- **State:**
  - `src/state/numbering.ts`: Modus, Präfix, Mittelpunkt, Startrichtung, Reihenfolge der Grundflächen,
    Nummernkreis/Start/Stellen, Fixieren, `applyRenumber` als ein Undo-Schritt.
  - `changeWithPowerCheck` in `src/state/objects.ts` für das Strom-Feld, Einfügen, Duplizieren und Alt+Ziehen.
  - `setPowerLimit`/`setBlockOverLimit` in `pageSettings.ts`.
- **Oberfläche:**
  - Bereich „Nummerierung“ in den Page-Einstellungen: Modus, Präfix, im Uhrzeigersinn Mitte X/Y, Start und
    „Mittelpunkt auf dem Plan setzen“; Nummernkreis, Startnummer, Stellen, Beispiel; Status „n ohne
    Nummer, n fixiert“; Button „Neu nummerieren …“.
  - Bereich „Grundflächen“ (ab zwei Grundflächen): Reihenfolge per ↑/↓, bestimmt, welche bei Überlappung gewinnt.
  - Vorschau-Dialog (`RenumberDialog.tsx`) mit alt → neu, fixiert, unverändert und dem Hinweis auf verbleibende
    Duplikate.
  - Bereich „Strom“, immer sichtbar: Balken, Limit (leer = kein Limit), „Überschreitung blockieren“, Tabelle je
    Anschlussart.
  - Blitz-Symbol am Page-Tab. Der Warnzähler zählt doppelte Nummern mit; das Tooltip nennt sie.
  - Platznummer mit Schloss, auch bei Mehrfachauswahl.
  - Warn-Chip „Nummer 12 auch bei: … (Festplatz 2)“ mit „doppelte Nummer ignorieren“.
  - Schalter „Warnung bei doppelten Platznummern“ im Bereich „Freiflächen & Warnungen“.
  - Fadenkreuz mit Startstrahl auf der Zeichenfläche im Modus „Uhrzeigersinn“.
  - Zahlenfeld: Ein abgewiesener Wert springt zurück; optional leer erlaubt.
- **Tests:**
  - Unit-Tests: `numbering.test.ts` (29, davon 2 Eigenschaftstests mit je 500 zufälligen Permutationen),
    `power.test.ts` (9), Migration 2 → 3 (2), Kurzbefehl-Regeln (`definitions.test.ts`, 2); zusammen 244 (Stand nach
    der QA-Nacharbeit).
  - E2E: `m5-numbering.spec.ts` (8) und `m5-power.spec.ts` (3), je Chromium und WebKit.
  - Komplette Suite grün in beiden Browsern, nach Anpassung von 4 überholten Tests (siehe Abweichungen).
- **Lasttests** (`npm run test:perf`, 8/8 grün, ohne Stromsparmodus): M4-21 WebKit-Median Zoomen 57,8,
  Verschieben 56,6, Lesegröße 56,3, Ziehen 58,4, längstes Bild 74 ms; Chromium 60. Log:
  `test-artifacts/logs/m5-perf.log`.

### Nicht umgesetzt / verschoben
- Strom auf der Start-Page: nur die Berechnung (`projectPower`), die Anzeige kommt mit M6-01 (wie geplant).

### Abweichungen von SPEC.md bzw. vom Plan
- **Links → rechts geändert (Laurin, 2026-10-12):** Statt Grundfläche für Grundfläche entlang der Vorderseite läuft die
  Nummerierung jetzt über den ganzen Festplatz von links nach rechts (x der Standmitte, bei gleicher Lage der obere
  zuerst). `spec.md` §5 ist angepasst. Der gespeicherte Modusname `frontLtr` bleibt; Formatversion 3 war noch nicht
  veröffentlicht, deshalb keine weitere Migration. Die ↑/↓-Liste der Grundflächen steht jetzt im eigenen Bereich
  „Grundflächen“.
- **Vier QA-/Entwicklertests angepasst**, weil die Formatversion nach der Regel in CLAUDE.md auf 3 steigt. Vermerkt
  in `qa/M1.md`, `qa/M3.md` und `qa/M4.md`:
  - `m1-file.spec.ts:43` und `m4-qa.spec.ts:888`: erwarten Version 3.
  - `m4-qa.spec.ts:903`: Die „neuere“ Datei hat jetzt Version 4.
  - `m3-qa.spec.ts:47`: `BASE` hat das neue Feld.
- **Doppelte Nummer** wird auf der Zeichenfläche wie „außerhalb“ markiert (orange Kontur und Warndreieck). Die
  Seitenleiste nennt die Art.
- **Hinweis beim Überschreiten** (inzwischen in spec.md §6 festgelegt, Entscheidung Laurin) ohne Blockieren nur beim ersten Überschreiten (vorher ≤ Limit), damit weitere
  Änderungen über dem Limit nicht jedes Mal einen Hinweis zeigen. Das Blitz-Symbol bleibt sichtbar.
- **Blockieren:** Ein abgewiesener Wert erscheint als Dialog „Stromlimit überschritten“ (nicht nur als kurzer
  Hinweis). Das Feld zeigt danach wieder den alten Wert.

### Bekannte Bugs und Einschränkungen
- Einfügen trotz Abweisung zählt den Versatz weiter (E-33).
- Der Mittelpunkt lässt sich nicht ziehen (E-34).

### Manuell testen (Desktop-App)
- [ ] Festplatz mit mehreren Grundflächen übereinander: neu nummerieren, die Nummern laufen quer über alle Flächen von
  links nach rechts; Vorschau prüfen, übernehmen, einmal Cmd+Z.
- [ ] Uhrzeigersinn: Mittelpunkt setzen, Nordrichtung ändern (Startstrahl dreht mit), neu nummerieren.
- [ ] Nummer eintragen, fixieren, neu nummerieren: Nummer bleibt und wird nicht doppelt vergeben.
- [ ] „global durchgehend“, Festplatz duplizieren: Warnzähler an beiden Tabs, Hinweis am Stand.
- [ ] Limit setzen, „Überschreitung blockieren“: Strom erhöhen bzw. Stände einfügen wird abgewiesen, senken geht.
- [ ] Alte Projektdatei (M4) öffnen: lädt ohne Meldung, nach Speichern Version 3.

### Offene Fragen (beantwortet, siehe unten)
1. Soll ich M5 committen und pushen? Der Push startet den Build-Workflow.
2. M4 steht noch nicht im Archiv. Gilt M4 als abgenommen, sodass ich es nach `docs/archiv/M4.md` verschieben soll?

### Antworten (2026-10-12)
- „Strikt von links nach rechts“, inklusive des Springens zwischen versetzten Reihen, ist so gewollt.
- Committen und pushen: ja.
- M4 ist abgenommen und liegt jetzt in `docs/archiv/M4.md`.
- Vor dem QA-Lauf geprüft:
  - `npm run check` grün (232 Unit-Tests).
  - `npm run test:e2e` in beiden Browsern: 529 grün, 7 übersprungen (die bekannten browserspezifischen Skips).
  - `npm run test:perf` 8/8 grün. Zwei WebKit-Tests hatten im Komplettlauf keine Verbindung zum Dev-Server und
    waren einzeln wiederholt grün. M4-21 WebKit-Median: Zoomen 58,4, Verschieben 58,1, Lesegröße 55,2, Ziehen 58,7,
    längstes Bild 73 ms.
- **Fixtures geprüft:** Version 3 hat nur `last-500-staende.schelme`. Ihre M5-Felder passten. Abweichend war nur
  `infraTypes`: in der Datei leer, beim Laden mit den 8 Standardtypen ergänzt. Das Skript schreibt sie jetzt mit,
  die Datei ist neu erzeugt, und `src/core/fixtures.test.ts` prüft zusätzlich, dass Laden das ganze Projekt
  unverändert lässt. Der Lasttest, der die Datei nutzt (`m3-qa-perf.spec.ts`), ist danach in beiden Browsern grün.
  `format-v1-m3.schelme` und `format-v2-m4.schelme` sind absichtlich ältere Versionen (Migrationstests).

### QA-Nacharbeit M5 (2026-10-12)
Befunde aus `qa/M5.md` und die Entscheidungen von Laurin; Details im Abschnitt „Behoben“ des QA-Berichts.
- **QA-M5-01 (Reihenfolge nicht transitiv):** keine Toleranz mehr. Links → rechts vergleicht die auf 0,01 m
  gerundete Standmitte (x, dann y, dann ID). Im Uhrzeigersinn werden Winkel auf 0,1° und Abstand auf 0,01 m
  gerundet. Eigenschaftstests mit zufälligen Permutationen (inkl. 1-cm-Treppe und 0,06°-Strahl). spec.md §5.
- **QA-M5-02 (90 % und Prozent):** Stufen auf 0,001 kW gerundet; die Prozentzahl wird abgerundet, über dem Limit mit
  Nachkommastelle bzw. „über 100 %“. Die Prüfung beim Blockieren vergleicht ebenso. spec.md §6.
- **QA-M5-03 (Kurzbefehle im Textfeld):** In Textfeldern greifen nur Speichern, Speichern unter, Öffnen und Neu
  (Cmd/Strg ohne Alt); vorher übernimmt das Feld seinen Wert (Korrektur Laurin). Alle anderen sind gesperrt. AltGr-Regel in spec.md und CLAUDE.md; ein Unit-Test prüft alle Kurzbefehle. Bestehende Kurzbefehle
  geprüft: Strg/Cmd+Alt nur mit N, D, T, F und Rücktaste, keine davon erzeugt per AltGr ein Zeichen.
- **QA-M5-04 (Lasttest mit fremdem Server):** `reuseExistingServer: false` in `playwright.perf.config.ts`.
- **Neu (M5-14):** „Alle neu nummerieren“ / „Nur Stände ohne Nummer“ im Dialog, spec.md §5.
- **Hinweis ohne Blockieren** nur beim Wechsel von „im Limit“ auf „über dem Limit“: in spec.md §6 eingetragen
  (war schon so umgesetzt).
- **Abgleich mit der Freigabe zum M5-Plan:** Duplikat-Vergleich mit Präfix („A-12“ = „A-012“, „A-12“ ≠ „B-12“)
  war umgesetzt und von der QA geprüft; jetzt zusätzlich in spec.md §3 ausdrücklich und als Unit-Test. Die getrennte
  Reihenfolge der Grundflächen ist durch „quer über den Festplatz“ erledigt (Bereich „Grundflächen“). Sonst fehlt
  nichts.
- **Geänderte QA-Tests** (`tests/e2e/m5-qa.spec.ts`, durch Laurins Entscheidungen erzwungen, vermerkt in
  `qa/M5.md`): Helfer `renumber` und zwei Tests wählen „Alle neu nummerieren“; zwei Tests erwarten die neue
  Gleichstand-Regel; die vier `test.fail` sind entfernt.
- **Prüfläufe:**
  - `npm run check` grün (244 Unit-Tests).
  - `npm run test:e2e` in beiden Browsern: 583 grün, 7 übersprungen (bekannte browserspezifische Skips).
  - `npm run test:perf`: 7/8 im Komplettlauf; M3-23 Chromium fiel mit Einzelbildern bis 733 ms durch, während die
    Systemlast extrem hoch war (Mittel über 15 Minuten 87). Bei normaler Last einzeln wiederholt: 60 Bilder/s,
    längstes Bild 17 ms. M4-21 WebKit-Median: Zoomen 58,0, Verschieben 58,0, Lesegröße 56,4, Ziehen 58,5, längstes
    Bild 61 ms.
  - In derselben Hochlastphase scheiterte in einem ersten E2E-Lauf „M1-16: Mittlere Maustaste“ in WebKit, auch auf
    dem committeten Stand. Bei normaler Last grün (3/3, danach die ganze Suite).
