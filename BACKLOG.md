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
- E-23 (Hinweis, umgesetzt in M8-05: im PDF immer weißer Rand; Archiv nach Abnahme) Der helle Rand um die Beschriftung erscheint erst ab 12 px Schrifthöhe (Leistung WebKit, siehe Abschluss M3). Für den PDF-Export (weißes Papier) separat entscheiden.
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
- E-48 (Idee, aus M7; erledigt mit M8-12, Archiv nach Abnahme) „An Fenster anpassen“ (Cmd/Strg+0) passt an die Objekte an; das Blatt kann darüber hinausragen. Ein zweiter Befehl „Blatt in Fenster einpassen“ wie in Illustrator wäre möglich.
- E-49 (Hinweis, aus M7, umgesetzt in M8-04; Archiv nach Abnahme) Bei „an Seite anpassen“ füllt der Inhalt das Blatt bis auf 10 mm Rand; Schriftfeld und Legende können dann Teile des Plans überdecken. Der Planer verschiebt sie oder wählt einen festen Maßstab. Möglich wäre, beim Anpassen Platz für die Papier-Elemente freizuhalten.
- E-50 (Idee, aus M7) Beim Ziehen von Blatt, Schriftfeld und Legende zeigt die Zeichenfläche nur einen Umriss; das Element springt beim Loslassen an die neue Stelle (Objekte bewegen sich dagegen live).
- E-51 (Idee, aus M7) Infrastrukturliste der Start-Page mit Zellnavigation per Pfeiltasten wie die Geschäftstabelle (bisher Eingabefelder je Zeile, spec.md §7 angepasst).
- E-52 (Hinweis, umgesetzt in M8-05: Schrift eingebettet, Farbfelder über die Papier-Stiltabelle; Archiv nach Abnahme) Schriftfeld und Legende nutzen die Oberflächenschrift; im PDF muss sie eingebettet werden. Die Legenden-Farbfelder haben eigene Papierfarben (`.sw-area`, `.sw-free`).
- E-53 (Idee, aus M8-Planung) SVG-Hintergründe im PDF als Vektor statt gerastert (z. B. Umwandlung über svg2pdf.js in eine PDF-Seite, die dann wie ein PDF-Hintergrund eingebettet wird).
- E-54 (Hinweis, aus M8) Der QA-Test „Kennzahlen nach Page-Duplizieren“ (`tests/e2e/m6-qa.spec.ts:149`) legt Stände ohne Tiefe `d` an; das Blatt wird dadurch NaN und React meldet „Received NaN for the `x` attribute“ in der Konsole (schon seit M7, siehe `qa/logs/m7-e2e.log`). Der Test prüft keine Konsolenfehler und bleibt grün; Testdaten bei Gelegenheit vervollständigen.
- E-55 (Lücke, aus M8) Papier-Elemente weichen einander nicht aus: Liegen zwei an derselben Ecke (z. B. Legende oben rechts und Nordpfeil oben rechts), überdecken sie sich. Der Planer verschiebt eines davon.
- E-56 (Hinweis, aus M8; QA ✓ M8: 90/180/270 geprüft, siehe `qa/M8.md`, `tests/e2e/m8-pdf-rotation.spec.ts`) PDF-Hintergründe mit Seitendrehung (/Rotate 90/180/270) werden im Export über die Abbildung `formToSource` gedreht; getestet war bisher nur eine Seite ohne Drehung (`tests/fixtures/plan-1zu1000.pdf`). Nachtest: alle drei Winkel stimmen mit der Zeichenfläche überein (Screenshot-Vergleich + automatisierter Test).
- E-57 (Idee, aus M8) Der Anhang kürzt Spalten auf höchstens 32 % der Breite („…“), lange Notizen werden abgeschnitten. Möglich wären Zeilenumbrüche in Zellen.
- E-58 (Idee, aus M8) Export-Profile zwischen Rechnern übertragen (Datei exportieren/importieren); bisher liegen sie nur auf dem jeweiligen Rechner (Entscheidung „pro Rechner“).
- E-08 (Hinweis) Browser-Autosave nutzt localStorage (ca. 5 MB). Mit eingebetteten Hintergründen (M2) reicht das nicht; betrifft nur den Browser-Dev-Modus.
- [QA] QA-M1-11 (gering, Dokumentation/Prozess) Die Entwicklung hat QA-Artefakte geändert: Abschnitt „Behoben“ an `qa/M1.md` angehängt und die Erwartung des QA-Tests „M1-24: Zwei-Finger-Wischen“ umgedreht (`tests/e2e/m1-canvas.spec.ts:104-107`, begründet). Dazu Widersprüche: QA-M1-02 steht hier als „erledigt“, in `qa/M1.md` als „teilweise“; die Einträge QA-M1-03/-04 nennen noch `test.fail`, obwohl die Markierungen entfernt sind.
- [QA] QA-M5-05 (gering, Prozess, wiederholt QA-M1-11) Die Entwicklung hat in den Commits `68ab8cb`/`da424cd` bei M5-01, M5-02, M5-08, M5-14, QA-M5-03 und QA-M5-04 selbst den Vermerk „(QA ✓ M5 Nachtest 2026-10-12)“ in `BACKLOG.md` eingetragen, bevor die QA den Nachtest durchgeführt hat. Der Nachtest (`qa/M5.md`, Abschnitt „Nachtest“) hat die Vermerke inhaltlich bestätigt, trotzdem sollte nur die QA „(QA ✓ …)“ setzen. Siehe `qa/M5.md`.
- [x] [QA] QA-M8-02 (erledigt mit M8-14: WebKit-Projekt in `playwright.config.ts` auf 2 Worker begrenzt, lokal insgesamt 4; Archiv nach Abnahme) (gering, Prozess/Testinfrastruktur, kein Produktfehler) `npm run test:e2e` (Chromium + WebKit, 5 Worker parallel, 688 Tests inkl. der neuen, mit großen Rasterbildern arbeitenden M8-Tests) ließ gegen Ende des WebKit-Laufs den Dev-Server abstürzen („Could not connect to the server“), was 18 WebKit-Tests kaskadierend scheitern ließ (u. a. unbeteiligte M2/M4/M7-Tests). Isolierter Nachlauf derselben Testdateien in WebKit mit 2 Workern: alle grün (siehe `qa/M8.md`, Abschnitt „Automatisierte Suite“). Vermutlich Ressourcenerschöpfung durch mehrere parallele große Canvas-/Worker-Operationen auf dieser Maschine; die CI (`build.yml`) läuft `test:e2e` nur mit Chromium und ist davon nicht betroffen. Ggf. Worker-Zahl für lokale volle Läufe senken oder besonders speicherintensive Tests (`m8-export*.spec.ts`) mit reduzierter Parallelität kennzeichnen.

---

## Querschnitt (gilt für alle Meilensteine)
- [ ] Q-01 Läuft auf Windows und macOS (NFA)
- [ ] Q-02 Komplett offline, kein Server, kein Account (NFA)
- [~] Q-03 Personenbezogene Händlerdaten bleiben lokal; nichts wird von fremden Servern nachgeladen, auch keine Schriften oder Icons (NFA, DSGVO, Gestaltung) – bisher eingehalten: Schriften über @fontsource, Icons über npm, CSP erlaubt nur `self`; M8: PDF-Schrift lokal gebündelt (`src/assets/fonts/`), Export-Profile schwärzen vor dem Export (Datenschutztest)
- [~] Q-04 Flüssig mit mindestens 500 Ständen über alle Festplätze (NFA) – M8: PDF-Export 8 × A1 mit großen Hintergründen siehe Abschluss M8; M3: Lasttest 500 Stände auf einer Page ≥ 55 Bilder/s in Chromium und WebKit (M3-23); M4: mit Freiflächen, Warnungen und Fang ≥ 51 Bilder/s (M4-21); M5: Lasttests unverändert grün (WebKit-Median ≥ 56); M6: Geschäftstabelle mit 500 Ständen scrollt mit ≥ 58 Bildern/s (M6-10); M7: mit 100 Infrastruktur-Objekten und Blatt WebKit-Median ≥ 54,5 Bilder/s (M7-13)
- [~] Q-05 TypeScript strict (NFA) – aktiv seit M1 (`strict`, `noUncheckedIndexedAccess`)
- [~] Q-06 Geometrie-, Freiflächen- und Nummerierungslogik als reine, UI-unabhängige Module mit Unit-Tests (Vorgehen 4, NFA) – M8: Szene, Profile, Einpassen, PDF-Schreiber in `src/core/` mit Tests; M3: Rechteck-Geometrie, Treffer, Gruppen-Transformation, Beschriftung in `src/core/` mit Tests; M4: Freiflächen, Warnungen, Fang mit Fall-Tabelle und Eigenschaftstests; M5: Nummerierung (`numbering.ts`) und Strom (`power.ts`) mit Tests; M7: Infrastruktur, Blatt, Legende, Infrastrukturliste mit Tests
- [x] Q-07 Builds für Windows und macOS über GitHub Actions (Tech-Stack) – Workflow `.github/workflows/build.yml` seit 2026-10-12 (Zwischenschritt vor M5): check + E2E Chromium, dann `.dmg` (Universal) und `.msi`/`.exe` als Artefakte, ohne Signatur; Fundort siehe CLAUDE.md. Erster grüner Lauf 2026-10-12. Dafür QA-Test `m4-qa.spec.ts:982` korrigiert (erwartete nur „⇧F“/„Shift+F“, auf Windows/Linux zeigt die App „Umschalt+F“)
- [~] Q-08 Oberfläche komplett auf Deutsch (UI/Allgemein) – bisher eingehalten
- [ ] Q-09 Jedes Werkzeug, jede Page und jeder wichtige Button hat einen Shortcut; neue Funktionen tragen sich in die zentrale Shortcut-Konfiguration ein (Tastaturkürzel) – M5: „Neu nummerieren …“ Cmd/Strg+Alt+N; „Mittelpunkt setzen“ ohne Kurzbefehl (E-34); M6: Unter-Tabs der Start-Page Cmd/Strg+1/2/3, Suche Cmd/Strg+F, CSV Cmd/Strg+Shift+E; M7: I, Shift+I, T, Shift+L, Start-Page Cmd/Strg+1–4; M8: Als PDF exportieren Cmd/Strg+P

## M1 bis M7 – abgeschlossen und abgenommen
Aufgabenlisten, erledigte QA-Befunde und Abschlüsse: `docs/archiv/M1.md`, `docs/archiv/M2.md`, `docs/archiv/M3.md`,
`docs/archiv/M4.md`, `docs/archiv/M5.md`, `docs/archiv/M6.md`, `docs/archiv/M7.md`.

## M8 – PDF-Export
Entscheidungen der M8-Planung 2026-10-12 (Laurin: Profile pro Rechner, SVG-Hintergrund gerastert, Standard 200 dpi,
„Rettungswege“ = Infrastruktur + Durchfahrt zu eng). Plan: gemeinsame Szene für Zeichenfläche und PDF (§9).
Testdatei der Vorgängerversion: `tests/fixtures/format-v4-m7.schelme` (mit der App im Stand `d5e9b13` gespeichert).
- [x] M8-01 Dateiformat Version 5: Anker für Maßstabsbalken und Nordpfeil, ungenutztes Feld `exportProfiles` entfällt; Migration 4 → 5 mit echter v4-Datei (§10, §8) (QA ✓ M8)
- [x] M8-02 Gemeinsame Szene in `src/core/scene/` (Grundformen mit Stilschlüssel, Bausteine je Objekt, `pageScene`, Papier-Stiltabelle); Zeichenfläche rendert über die Bausteine; Lasttests unverändert grün (§9, NFA) (QA ✓ M8)
- [x] M8-03 Maßstabsbalken und Nordpfeil als Papier-Elemente mit Ecken-Anker wie Schriftfeld/Legende (§8) (QA ✓ M8)
- [x] M8-04 „An Seite anpassen“ hält Platz für die Papier-Elemente frei (E-49); Schriftfeld-Zeile „Maßstab 1:n bei Druck in Originalgröße (Format)“ (§8) (QA ✓ M8)
- [x] M8-05 PDF-Schreiber: Seitengröße exakt in mm, Maßstab, eingebettete Schrift mit durchsuchbarem Text, Symbole als Vektor, weißer Schriftrand (E-23, E-52), Metadaten, Lesezeichen (§9) (QA ✓ M8)
- [x] M8-06 Hintergründe im PDF: PDF als Vektor; Raster beschnitten und auf Ziel-Auflösung verkleinert (150/200/300 dpi/Original, Standard 200), in Kacheln; SVG gerastert (§9) (QA ✓ M8; Drehung /Rotate 90/180/270 nachgetestet, siehe E-56)
- [x] M8-07 Export-Profile pro Rechner: Ebenen, Warnungen, erlaubte Felder, Anhang; drei mitgelieferte Profile; „Profile verwalten“; Speicherung über `src/platform/`; Schwärzung vor dem Export (§9) (QA ✓ M8; Löschen eines eigenen Profils mit Rückfrage ergänzend getestet)
- [x] M8-08 Umfang Gesamtplan/Auswahl, gemischte Formate; Anhang mit Stand-, Freiflächen- und Infrastrukturliste (§9) (QA ✓ M8)
- [x] M8-09 Export-Dialog mit Profil, Umfang, Blatt je Page und echter PDF-Vorschau; Export im Web Worker mit Fortschritt und Abbrechen; Speichern per Dialog/Download; Dateiname-Vorschlag; Cmd/Strg+P (§9, Tastaturkürzel) (QA ✓ M8; Snapshot-Verhalten während laufenden Exports ergänzend getestet)
- [x] M8-10 Tests: PDFs mit pdf.js geprüft (Seitenzahl/-größen, Maßstab, Text je Profil, Datenschutz mit Kanarienwerten in Textlayer, Metadaten, Lesezeichen und Rohdaten); Lasttest Export als Abnahmekriterium (§9) (QA ✓ M8)


**Nacharbeit vor der Abnahme** (Laurin, 2026-10-14):
- [x] M8-11 Papier-Elemente stören die Arbeit nicht: Klick wählt aus, nur ein ausgewähltes wird gezogen, Ziehen auf
  einem nicht ausgewählten zieht ein Auswahlrechteck auf (wie Grundflächen); Anpassung in `m3-qa.spec.ts:904`
  zurücknehmen (§8)
- [x] M8-12 Cmd/Strg+0 passt das ganze Blatt samt Papier-Elementen ins Fenster (E-48); Anpassung in
  `m7-sheet.spec.ts:166` zurücknehmen (Layout)
- [x] M8-13 Dateigröße: JPEG-Qualität in Chromium und WebKit angleichen; Qualitätsstufe „E-Mail“ (100 dpi, JPEG 60,
  unter 20 MB für 8 × A1); geschätzte Dateigröße im Export-Dialog (§9)
- [x] M8-14 QA-M8-02: Worker für WebKit in der Playwright-Konfiguration begrenzen (WebKit 2, lokal insgesamt 4), voller lokaler Lauf zuverlässig grün

### Abschluss M8 (2026-10-12)
**Umgesetzt** (spec.md §8, §9, §10, Tastaturkürzel):
- Gemeinsame Szene `src/core/scene/`: Bausteine je Objekt (Grundfläche, Freifläche, Stand, Warnung, Infrastruktur,
  Beschriftung, Schriftfeld, Legende, Maßstabsbalken, Nordpfeil) liefern Grundformen mit Stilschlüssel. Die
  Zeichenfläche (`ObjectsLayer`, `InfraLayer`, `PaperLayer`) zeichnet sie über `<PrimView>` mit den bisherigen
  CSS-Klassen, das PDF über `PAPER_STYLE`. Ein Test prüft, dass jeder Stilschlüssel in beiden vorkommt.
- PDF-Schreiber `src/core/pdf/writePdf.ts` (pdf-lib, rein, im Web Worker): Seitengröße exakt in mm, eine affine
  Abbildung Meter → pt je Seite, IBM Plex Sans (3 Schnitte, WOFF aus `@ibm/plex-sans`, OFL, `src/assets/fonts/`) als
  Teilmenge mit durchsuchbarem Text, Symbole als Vektorpfade, weißer Schriftrand, weißes Papier, Metadaten (Titel,
  Ersteller), Lesezeichen, Sprache de-DE. Anhang (Stand-, Freiflächen-, Infrastrukturliste) A4 quer mit Seitenzahlen.
- Hintergründe: PDF als Form-XObject (Vektor, je Datei einmal), Raster beschnitten und auf 150/200/300 dpi bzw.
  Original verkleinert (nie hochgerechnet), Kacheln ab 16 MP, SVG gerastert. Standard 200 dpi.
- Export-Profile pro Rechner (`src/state/exportSettings.ts`, `platform.readAppSetting`/`writeAppSetting`): drei
  mitgelieferte, eigene anlegen/bearbeiten/löschen, Zurücksetzen; Schwärzung `redactProject` vor dem Export.
- Maßstabsbalken und Nordpfeil als Papier-Elemente (Ziehen, Eckfang, Pfeiltasten, Entf, Bereich „Blatt“).
- „An Seite anpassen“ hält Platz für die sichtbaren Papier-Elemente frei (`fitIntoFreeArea`, E-49); Schriftfeld-Zeile
  „Maßstab 1:n bei Druck in Originalgröße (Format)“.
- Export-Dialog (Cmd/Strg+P, Menü „Als PDF exportieren …“) mit Profil, Umfang, Blatt je Page, Anhang, Auflösung und
  echter PDF-Vorschau; Fortschritt unten links mit Abbrechen; Speichern per Dateidialog bzw. Download; Dateiname
  „Projekt – (Festplatz –) Profil – Datum.pdf“.
- Formatversion 5 mit Migration 4 → 5, getestet mit der echten Datei `tests/fixtures/format-v4-m7.schelme`.
- Tests: `src/core/pdf/writePdf.test.ts` (pdf.js: Seitengrößen, Maßstab über Pfadkoordinaten 1:500/1:200 ± 0,01 mm,
  gemischte Formate, Text mit Umlauten, Vektor-Hintergrund mit Abbildungsfaktor, Datenschutz mit Kanarienwerten in
  Textlayer, Metadaten, XMP, Lesezeichen, Anmerkungen und entpackten Rohdaten je Profil, Anhang),
  `src/core/scene/scene.test.ts`, `src/app/pdfBackground.test.ts`, Migration; E2E `m8-export.spec.ts` (7 Tests,
  Chromium und WebKit), Lasttest `m8-export.perf.spec.ts`.

**Messwerte** (Lasttest Export, 8 × A1 quer mit 8000 × 6000-JPEG, 500 Stände, „Intern“ mit Anhang, 300 dpi):
Chromium Median 4,2 s (4,3/4,2/4,0), längstes Bild 117 ms, 63 MB; WebKit Median 6,1 s (6,1/6,1/5,7), längstes Bild
96 ms, 101 MB (WebKits JPEG-Encoder komprimiert schwächer). Kriterium (≤ 60 s, ≤ 200 ms, ≤ 200 MB) erfüllt.
Canvas-Lasttests nach dem Szenen-Umbau: alle 14 Lasttests grün (`npm run test:perf`, 10,2 min); M7-Lasttest Chromium
≥ 59,2 Bilder/s, WebKit-Median ≥ 56,0 Bilder/s, längstes Bild 78 ms.

**Abweichungen von der Planung** (in spec.md nachgezogen):
- Schrift als WOFF statt TTF (fontkit liest WOFF; die @fontsource-Dateien sind nach Unicode-Bereichen geteilt, daher
  die vollständigen Dateien aus `@ibm/plex-sans`).
- Maßstabsbalken: die längste Länge 1/2/5 × 10^k mit höchstens 80 mm (32–80 mm statt 40–80 mm, sonst gibt es Maßstäbe
  ohne passenden Wert); feste Größe 92 × 14 mm. Nordpfeil 20 × 20 mm wie der Nordpfeil der Zeichenfläche, „N“ aufrecht.
- Das PDF-Raster folgt nur dem Profil, nicht „Raster ein/aus“ der Zeichenfläche; Linien unter 2 mm Abstand entfallen.
- Fortschritt als schwebende Anzeige unten links statt in der Statuszeile (die Start-Page hat keine Statuszeile).
- Die Liste „noch nicht platziert“ kommt nie in den Export (Schwärzung leert sie).

**Geänderte Tests in `tests/e2e/`** (nachweislich überholt durch die M8-Anforderungen, jeweils mit Kommentar):
- `m1-file.spec.ts:43`, `m4-qa.spec.ts:899`, `m5-qa.spec.ts:626`, `m7-sheet.spec.ts:261`: erwartete Formatversion
  4 → 5; `m4-qa.spec.ts:914` „neuere Version“ 5 → 6 (vgl. E-38).
- `m3-qa.spec.ts:904`: Das Auswahlrechteck begann genau dort, wo seit M8 standardmäßig der Maßstabsbalken liegt (er
  fängt den Klick); der Test blendet vorher die Ebene „Blatt“ aus.
- `m7-sheet.spec.ts:45`: neue Schriftfeld-Zeile „… bei Druck in Originalgröße (A3 quer)“.
- `m7-sheet.spec.ts:166`: Mit freigehaltenen Papier-Elementen ist das angepasste Blatt größer als der Inhalt und ragt
  nach Cmd/Strg+0 aus dem Fenster; der Test zoomt eine Stufe heraus.

**Nicht getestet:** die Desktop-App (Dateidialog beim Speichern, Einstellungsdateien im App-Datenordner, Worker in
WKWebView/WebView2). Bitte einmal mit `npm run tauri dev` exportieren.

**Bekannte Bugs / Grenzen:** E-54 bis E-58.

**Offene Fragen:** keine.

#### Abschluss M8, Nacharbeit (2026-10-14)
- **M8-11** Papier-Elemente: Ein Klick wählt aus, nur ein ausgewähltes Element wird gezogen, Ziehen auf einem nicht
  ausgewählten zieht ein Auswahlrechteck auf (wie Grundflächen). Das gilt auch für Rahmen und Marke des Blatts; ein
  angepasstes Blatt zieht immer ein Auswahlrechteck auf. Ursache des Fehlers in `m3-qa.spec.ts:904` war neben dem
  Maßstabsbalken auch die Marke des angepassten Blatts, die den Zug verschluckte. Die Anpassung dort ist
  zurückgenommen; der Test besteht in seiner Originalform.
- **M8-12** Cmd/Strg+0 nimmt das ganze Blatt samt Marke und Papier-Elementen dazu, solange die Ebene „Blatt“ sichtbar
  ist (E-48). Die Anpassung in `m7-sheet.spec.ts:166` ist zurückgenommen; Originalform besteht.
- **M8-13** Ursache der 101 MB in WebKit: Beide Browser kodieren JPEG mit 4:2:0, aber WebKit deutet den
  Qualitätswert anders (bei 0,85 Quantisierungstabelle 1 statt 5, entspricht libjpeg ≈ 97). Der Export kalibriert
  jetzt einmal je Browser den Wert, dessen Tabelle der libjpeg-Tabelle für Qualität 85 bzw. 60 entspricht (WebKit:
  0,577 bzw. 0,374); danach sind die Dateien in beiden Browsern gleich groß. Neue Stufe „E-Mail“ (100 dpi, alles als
  JPEG 60) und geschätzte Dateigröße im Dialog (Pixelzahl × Bytes je Pixel der Quelle, umgerechnet über deren
  Qualität aus der Quantisierungstabelle).
- **M8-14** WebKit in `playwright.config.ts` mit höchstens 2 Workern (QA-M8-02).
- Messwerte Lasttest Export (8 × A1, 500 Stände, „Intern“ mit Anhang): 300 dpi Chromium Median 4,2 s, 63,1 MB
  (geschätzt 61,2 MB); WebKit Median 6,1 s, 62,0 MB (geschätzt 65,2 MB, vorher 101 MB). „E-Mail“: Chromium 9,6 MB
  (geschätzt 7,8 MB), WebKit 10,8 MB (geschätzt 8,2 MB). Längstes Bild der Oberfläche höchstens 100 ms.
- E2E: `npm run test:e2e` (beide Browser) dreimal hintereinander auf diesem Mac grün (je 685 bestanden, 7 übersprungen).
  Mit nur der WebKit-Grenze (2 Worker) liefen noch Chromium (5) und WebKit (2) gleichzeitig; dabei fiel je Lauf ein
  anderer WebKit-Gesten-Test aus (`m4-freespace.spec.ts:124`, `m4-qa.spec.ts:974`; isoliert 20/20 grün). Deshalb
  lokal zusätzlich höchstens 4 Worker insgesamt (`workers` in `playwright.config.ts`, CI unverändert).
- `npm run test:perf`: 12 von 14 grün im ersten Lauf. Zwei Ausfälle fielen in eine Phase mit Lastdurchschnitt 54
  (Autodesk Fusion, Spotify, Chrome u. a. im Hintergrund, Akkubetrieb): M4-21 Chromium „Ziehen“ mit einem Bild von
  100,1 ms und ein WebKit-Exportlauf mit 190 s und einem Bild von 2,4 s. Bei Last unter 8 wiederholt: beide grün
  (M4-21 Chromium ≥ 58,1 Bilder/s, längstes Bild 100 ms = genau an der Grenze; WebKit-Export Median 5,5 s, längstes
  Bild 97 ms). Hinweis für die QA: Lasttests nur ohne rechenintensive Programme im Hintergrund (CLAUDE.md).
- **Geänderte Tests in `tests/e2e/`** (durch die neue Auswahlregel nachweislich überholt, jeweils mit Kommentar): Sie
  zogen ein nicht ausgewähltes Papier-Element direkt; jetzt klicken sie es vorher an:
  - `m7-sheet.spec.ts:74` („Schriftfeld ziehen …“) und `m7-sheet.spec.ts:99` (QA-M7-01, Hilfsfunktion `dragBy`);
  - `m8-export.spec.ts` (Maßstabsbalken ziehen).
  - Typfehler in den QA-Tests `m8-pdf-rotation.spec.ts` und `m8-export-profile-delete.spec.ts` korrigiert (ohne
    Änderung des Prüfverhaltens), sonst scheitert `npm run check`.
- Neue Tests: `m8-export.spec.ts` (Auswahlrechteck auf einem Papier-Element, Cmd/Strg+0 mit ganzem Blatt),
  `pdfBackground.test.ts` (libjpeg-Tabellen, DQT, „E-Mail“, Schätzung), Lasttest um „E-Mail“ und Schätzung erweitert.

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
- Legende auf der Zeichenfläche (M7-12) → M7, im PDF → M8-05.
- Blatt (Format, Ausrichtung, Maßstab) → M7-10, weil Schriftfeld und Legende als Papier-Elemente daran hängen
  (Entscheidung 2026-10-12); der Export-Dialog dazu → M8-09.
- Formatversion 4 (M7-01), Infrastruktur-Logik (M7-02) und Lasttest (M7-13): Entscheidungen der M7-Planung (2026-10-12).
- Formatversion 5 (M8-01), gemeinsame Szene (M8-02), freigehaltene Papier-Elemente (M8-04) und Lasttest Export (M8-10):
  Entscheidungen der M8-Planung (2026-10-12). Blatt im Export-Dialog → M8-09 (Blatt selbst seit M7-10).
- Strom auf der Start-Page → M6-01, auf der Festplatz-Page → M5-08.
- CSV-Export der Tabellen (§7) → M6-06, XLSX → M9-04 (Entscheidung 2026-10-12).
- Umzug der projektweiten Seitenleisten-Bereiche (§3, §4, §5) → M6-07.
