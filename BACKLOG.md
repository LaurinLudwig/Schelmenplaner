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
- E-44 (Idee, aus M7-Planung) Mindestbreite pro Durchfahrt überschreiben (z. B. Feuerwehrzufahrt 5 m statt der projektweiten 3,5 m).
- E-45 (Idee, aus M7-Planung) Einzelne Einträge der Legende ausblenden oder umbenennen.
- E-46 (Idee, aus M7-Planung) Mehrere Blätter pro Festplatz-Page (z. B. Übersicht 1:1000 und Ausschnitt 1:200).
- E-47 (Hinweis, aus M7) Die Beschriftung eines Infrastruktur-Objekts kann sich mit der Grundflächen-Beschriftung überdecken (z. B. Toilettenwagen direkt an der Vorderseite); wie E-30 wird nichts gekürzt oder verschoben.
- E-48 (Idee, aus M7) „An Fenster anpassen“ (Cmd/Strg+0) passt an die Objekte an; das Blatt kann darüber hinausragen. Ein zweiter Befehl „Blatt in Fenster einpassen“ wie in Illustrator wäre möglich.
- E-49 (Hinweis, aus M7) Bei „an Seite anpassen“ füllt der Inhalt das Blatt bis auf 10 mm Rand; Schriftfeld und Legende können dann Teile des Plans überdecken. Der Planer verschiebt sie oder wählt einen festen Maßstab. Möglich wäre, beim Anpassen Platz für die Papier-Elemente freizuhalten.
- E-50 (Idee, aus M7) Beim Ziehen von Blatt, Schriftfeld und Legende zeigt die Zeichenfläche nur einen Umriss; das Element springt beim Loslassen an die neue Stelle (Objekte bewegen sich dagegen live).
- E-51 (Idee, aus M7) Infrastrukturliste der Start-Page mit Zellnavigation per Pfeiltasten wie die Geschäftstabelle (bisher Eingabefelder je Zeile, spec.md §7 angepasst).
- E-52 (Hinweis, für M8) Schriftfeld und Legende nutzen die Oberflächenschrift; im PDF muss sie eingebettet werden. Die Legenden-Farbfelder haben eigene Papierfarben (`.sw-area`, `.sw-free`).
- E-08 (Hinweis) Browser-Autosave nutzt localStorage (ca. 5 MB). Mit eingebetteten Hintergründen (M2) reicht das nicht; betrifft nur den Browser-Dev-Modus.
- [QA] QA-M1-11 (gering, Dokumentation/Prozess) Die Entwicklung hat QA-Artefakte geändert: Abschnitt „Behoben“ an `qa/M1.md` angehängt und die Erwartung des QA-Tests „M1-24: Zwei-Finger-Wischen“ umgedreht (`tests/e2e/m1-canvas.spec.ts:104-107`, begründet). Dazu Widersprüche: QA-M1-02 steht hier als „erledigt“, in `qa/M1.md` als „teilweise“; die Einträge QA-M1-03/-04 nennen noch `test.fail`, obwohl die Markierungen entfernt sind.
- [QA] QA-M5-05 (gering, Prozess, wiederholt QA-M1-11) Die Entwicklung hat in den Commits `68ab8cb`/`da424cd` bei M5-01, M5-02, M5-08, M5-14, QA-M5-03 und QA-M5-04 selbst den Vermerk „(QA ✓ M5 Nachtest 2026-10-12)“ in `BACKLOG.md` eingetragen, bevor die QA den Nachtest durchgeführt hat. Der Nachtest (`qa/M5.md`, Abschnitt „Nachtest“) hat die Vermerke inhaltlich bestätigt, trotzdem sollte nur die QA „(QA ✓ …)“ setzen. Siehe `qa/M5.md`.

---

## Querschnitt (gilt für alle Meilensteine)
- [ ] Q-01 Läuft auf Windows und macOS (NFA)
- [ ] Q-02 Komplett offline, kein Server, kein Account (NFA)
- [~] Q-03 Personenbezogene Händlerdaten bleiben lokal; nichts wird von fremden Servern nachgeladen, auch keine Schriften oder Icons (NFA, DSGVO, Gestaltung) – bisher eingehalten: Schriften über @fontsource, Icons über npm, CSP erlaubt nur `self`
- [~] Q-04 Flüssig mit mindestens 500 Ständen über alle Festplätze (NFA) – M3: Lasttest 500 Stände auf einer Page ≥ 55 Bilder/s in Chromium und WebKit (M3-23); M4: mit Freiflächen, Warnungen und Fang ≥ 51 Bilder/s (M4-21); M5: Lasttests unverändert grün (WebKit-Median ≥ 56); M6: Geschäftstabelle mit 500 Ständen scrollt mit ≥ 58 Bildern/s (M6-10); M7: mit 100 Infrastruktur-Objekten und Blatt WebKit-Median ≥ 54,5 Bilder/s (M7-13)
- [~] Q-05 TypeScript strict (NFA) – aktiv seit M1 (`strict`, `noUncheckedIndexedAccess`)
- [~] Q-06 Geometrie-, Freiflächen- und Nummerierungslogik als reine, UI-unabhängige Module mit Unit-Tests (Vorgehen 4, NFA) – M3: Rechteck-Geometrie, Treffer, Gruppen-Transformation, Beschriftung in `src/core/` mit Tests; M4: Freiflächen, Warnungen, Fang mit Fall-Tabelle und Eigenschaftstests; M5: Nummerierung (`numbering.ts`) und Strom (`power.ts`) mit Tests; M7: Infrastruktur, Blatt, Legende, Infrastrukturliste mit Tests
- [x] Q-07 Builds für Windows und macOS über GitHub Actions (Tech-Stack) – Workflow `.github/workflows/build.yml` seit 2026-10-12 (Zwischenschritt vor M5): check + E2E Chromium, dann `.dmg` (Universal) und `.msi`/`.exe` als Artefakte, ohne Signatur; Fundort siehe CLAUDE.md. Erster grüner Lauf 2026-10-12. Dafür QA-Test `m4-qa.spec.ts:982` korrigiert (erwartete nur „⇧F“/„Shift+F“, auf Windows/Linux zeigt die App „Umschalt+F“)
- [~] Q-08 Oberfläche komplett auf Deutsch (UI/Allgemein) – bisher eingehalten
- [ ] Q-09 Jedes Werkzeug, jede Page und jeder wichtige Button hat einen Shortcut; neue Funktionen tragen sich in die zentrale Shortcut-Konfiguration ein (Tastaturkürzel) – M5: „Neu nummerieren …“ Cmd/Strg+Alt+N; „Mittelpunkt setzen“ ohne Kurzbefehl (E-34); M6: Unter-Tabs der Start-Page Cmd/Strg+1/2/3, Suche Cmd/Strg+F, CSV Cmd/Strg+Shift+E; M7: I, Shift+I, T, Shift+L, Start-Page Cmd/Strg+1–4

## M1 bis M6 – abgeschlossen und abgenommen
Aufgabenlisten, erledigte QA-Befunde und Abschlüsse: `docs/archiv/M1.md`, `docs/archiv/M2.md`, `docs/archiv/M3.md`,
`docs/archiv/M4.md`, `docs/archiv/M5.md`, `docs/archiv/M6.md`.

## M7 – Infrastruktur, Blatt, Schriftfeld, Legende
Entscheidungen der M7-Planung 2026-10-12 (Laurin: Blattrahmen pro Page, Strom für Infrastruktur, eigene Typen,
Unter-Tab „Infrastruktur“). Testdatei der Vorgängerversion: `tests/fixtures/format-v3-m6.schelme` (Stand `cdde70d`).
- [x] M7-01 Dateiformat Version 4: Typen mit Geometrie/Standardmaß/„freihalten“, Infrastruktur-Attribute, Blatt, Anker von Schriftfeld und Legende, Ebene „Blatt“; Migration 3 → 4 mit echter v3-Datei (§10, §8, §11)
- [x] M7-02 Infrastruktur-Logik in `src/core/` mit Tests: Geometrien Rechteck/Linie/Punkt, Standardmaß je Typ, Treffer, Eindringtest Stand × Objekt, lichte Breite (§11)
- [x] M7-03 Infrastruktur-Objekte anlegen und bearbeiten: Werkzeug, Darstellung je Geometrie, Endpunkt-Griffe mit Fang, Seitenleiste und Steuerungsleiste, Auswahl, Kopieren/Einfügen/Duplizieren, Undo (§11, Allgemein)
- [x] M7-04 Aufklappbare Werkzeuggruppe mit zuletzt genutztem Typ; Kurzbefehle I und Shift+I (Layout, Tastaturkürzel)
- [x] M7-05 Belegende Infrastruktur-Objekte in der Freiflächen-Berechnung (§4, Begriffe)
- [x] M7-06 Strom der Infrastruktur: Summe, Limit, Blockieren, „davon Infrastruktur“ (§6, §11)
- [x] M7-07 Warnungen „Infrastruktur“ (Stand in Freihaltefläche) und „Durchfahrt zu eng“ mit Mindestbreite; Schalter, Ignorieren, Page-Tab (§3, §11)
- [x] M7-08 Infrastruktur-Typen in den Projekteinstellungen: feste Typen anpassen, eigene anlegen/ändern/löschen, Symbol-Auswahl (§11, §7)
- [x] M7-09 Start-Page: Anzahl je Typ und Warnungen getrennt in den Kennzahlen; Unter-Tab „Infrastruktur“ mit Sprung, Bearbeitung, CSV; Cmd/Strg+3/4 (§7)
- [x] M7-10 Blatt pro Page: Format, Ausrichtung, Maßstab fest/angepasst, Rahmen auf der Zeichenfläche, Bereich „Blatt“, Ebene „Blatt“ (§8)
- [x] M7-11 Schriftfeld als Papier-Element: Layout, Felder (projektweit Datum/Version, pro Page Freitext), Ecken-Anker, Ziehen, Pfeiltasten, Werkzeug T (§8)
- [x] M7-12 Legende als Papier-Element: Einträge automatisch aus sichtbarem Inhalt, Spaltenumbruch, Ziehen, ein-/ausblenden (Shift+L) (§8)
- [x] M7-13 Lasttests unverändert grün, zusätzlich mit Infrastruktur-Objekten (Q-04, NFA) – `m7-perf.spec.ts` (500 Stände, 100 Infrastruktur-Objekte, Blatt mit Schriftfeld und Legende): Chromium 60 Bilder/s, WebKit-Median ≥ 54,5, längstes Bild 82 ms; alle 12 Lasttests grün

### Abschluss M7 (2026-10-12)
**Umgesetzt** (spec.md §3, §4, §6, §7, §8, §10, §11):
- Dateiformat Version 4 mit Migration 3 → 4, getestet mit der echten Datei `tests/fixtures/format-v3-m6.schelme` (vorher mit der App im Stand `cdde70d` gespeichert). Das Lastprojekt `last-500-staende.schelme` ist per Skript auf Version 4 neu erzeugt.
- Infrastruktur: 8 feste Typen mit Geometrie Rechteck/Linie/Punkt, eigene Typen in den Projekteinstellungen (Name, Geometrie solange unbenutzt, Symbol aus 33 Material Symbols, Farbe, Standardmaß, „belegt Fläche“, „freihalten“). Anlegen per Klick oder Aufziehen, Linien mit Endpunkt-Griffen und Fang, Marker mit Text, Seiten- und Steuerungsleiste mit Maßfeldern je Geometrie, Kopieren/Einfügen/Duplizieren/Alt+Ziehen, Undo.
- Werkzeuggruppe mit zuletzt genutztem Typ (Dreieck, Rechtsklick, langes Drücken), Kurzbefehle I, Shift+I, T, Shift+L, Start-Page Cmd/Strg+3 (Infrastruktur) und Cmd/Strg+4 (Einstellungen).
- Belegung der Freiflächen, Strom im Limit (inkl. Blockieren, „davon Infrastruktur“), Warnungen „Infrastruktur“ (Stand in Freihaltefläche) und „Durchfahrt zu eng“ (Mindestbreite projektweit, Standard 3,5 m), Zählung am Page-Tab und in den Kennzahlen.
- Start-Page: Anzahl je Typ und Infrastruktur-Strom in den Kennzahlen, Warnungen getrennt („n Warnungen“ für Stände, „m Infrastruktur“), Unter-Tab „Infrastruktur“ mit Filter, Sortierung, Bearbeiten, Sprung und CSV; die Geschäftstabelle zeigt die Warnung „Infrastruktur“.
- Blatt pro Page (Format, Ausrichtung, Maßstab fest oder angepasst), Rahmen auf der Zeichenfläche, Ebene „Blatt“; Schriftfeld und Legende als Papier-Elemente in mm mit Ecken-Anker, Ziehen, Pfeiltasten (1/10 mm), Entf blendet aus.
- Kern in `src/core/` mit Tests: `infra.ts` (`m7.test.ts`), `sheet.ts`, `legend.ts`, `paper.ts` (`sheet.test.ts`), `infraTable.ts` (`infraTable.test.ts`), Migration (`migrations.test.ts`). E2E: `m7-infra.spec.ts`, `m7-sheet.spec.ts`; Lasttest `m7-perf.spec.ts`.

**Abweichungen von der Planung** (in spec.md nachgezogen):
- Linie ohne Stärke (Durchfahrt) warnt, wenn sie mehr als 0,01 m in den Stand hineinreicht; eine Linie auf der Standkante warnt nicht (§11). Beim Belegen zählt sie als 5 cm breiter Streifen (§4).
- Infrastrukturliste: Bearbeiten in Eingabefeldern der Zeile statt der Zellnavigation der Geschäftstabelle (§7, E-51).
- Die Ebene „Blatt“ erscheint im Ebenen-Panel erst, wenn es Objekte gibt (wie die übrigen Ebenen).

**Geänderte Tests in `tests/e2e/`** (nachweislich überholt durch Formatversion 4 bzw. die neue Ebene, jeweils mit Kommentar):
- `m1-file.spec.ts:43`, `m4-qa.spec.ts:899`, `m5-qa.spec.ts:624`: erwartete Formatversion 3 → 4; `m4-qa.spec.ts` „neuere Version“ 4 → 5 (vgl. E-38).
- `m3-qa.spec.ts`, `m5-qa.spec.ts`: `BASE` der Testdaten um `suppressInfraWarning: false` ergänzt (Rundreise-Vergleich nach dem Laden, wie in M5 bei `suppressDuplicateWarning`).
- `m3-objects.spec.ts` (M3-14) und `m4-freespace.spec.ts`: Ebenenliste um „Blatt“ ergänzt.

**Bekannte Bugs / Grenzen:** E-47 bis E-50.

**Entscheidungen nach dem Abschluss (Laurin, 2026-10-12):**
- Toilette und Müllcontainer haben „freihalten“ standardmäßig an (spec.md §11); unter den festen Typen hat nur der Marker es aus.
- Geometrie und Symbol fester Typen bleiben fest, wie umgesetzt.
- Geprüft: Die echte Datei der Vorgängerversion `tests/fixtures/format-v3-m6.schelme` liegt vor und wird in `migrations.test.ts` (Migration 3 → 4) und `m7-sheet.spec.ts` (Öffnen, Speichern als Version 4) getestet.

## M8 – PDF-Export
- [ ] M8-01 Export Gesamtplan (alle Festplatz-Pages, optional Start-Page-Listen als Anhang) oder einzelne Pages (§9)
- [ ] M8-02 Papierformat A4–A0, Hoch/Quer: Export-Dialog zeigt und ändert das Blatt der Page (§9; Blatt selbst seit M7-10)
- [ ] M8-03 Maßstab wählbar (z. B. 1:200, 1:500) oder „an Seite anpassen“: aus dem Blatt der Page (§9; seit M7-10)
- [ ] M8-04 Maßstabsbalken und Nordpfeil als Papier-Elemente mit Ecken-Anker wie Schriftfeld/Legende; Blatt mit Schriftfeld und Legende im PDF (§9, §8)
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
- Legende auf der Zeichenfläche (M7-12) → M7, im PDF → M8-04.
- Blatt (Format, Ausrichtung, Maßstab) → M7-10, weil Schriftfeld und Legende als Papier-Elemente daran hängen
  (Entscheidung 2026-10-12); der Export-Dialog dazu → M8-02/-03.
- Formatversion 4 (M7-01), Infrastruktur-Logik (M7-02) und Lasttest (M7-13): Entscheidungen der M7-Planung (2026-10-12).
- Strom auf der Start-Page → M6-01, auf der Festplatz-Page → M5-08.
- CSV-Export der Tabellen (§7) → M6-06, XLSX → M9-04 (Entscheidung 2026-10-12).
- Umzug der projektweiten Seitenleisten-Bereiche (§3, §4, §5) → M6-07.
