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
- E-25 (Hinweis, M5) „Festplatz duplizieren“ übernimmt die Platznummern der Stände; die Kopie hat dann doppelte Nummern. Beim Kopieren/Duplizieren einzelner Stände wird die Nummer geleert.
- E-26 (Idee, aus M4-Planung) Klick mit dem Geschäfts-Werkzeug in eine Grundfläche setzt den Stand gleich an deren Vorderseite.
- E-27 (Idee, aus M4-Planung) Fang für Grundflächen untereinander (Kanten bündig, Flucht).
- E-28 (Idee, aus M4-Planung) Drehgriff eines Stands rastet an der Drehung der Grundfläche ein, in der er steht.
- E-31 (Hinweis, aus QA-M4-03) Die Lasttests laufen gegen den Entwicklungsserver (React im Entwicklungsmodus, deutlich langsamer als der Produktions-Build). Die Werte sind damit vorsichtig; in der Desktop-App mit der Bildraten-Anzeige (Cmd/Strg+Alt+F) gegenmessen.
- E-32 (Hinweis, aus QA-M4-03) Im macOS-Stromsparmodus drosselt WebKit `requestAnimationFrame` auf 30 Bilder/s. Lasttests (und Messungen in der Mac-App) nur mit ausgeschaltetem Stromsparmodus durchführen.
- E-30 (Lücke, aus M4) Grundflächen-Beschriftung und Freiflächen-Beschriftung können sich bei sehr schmalen Freiflächen mit Standbeschriftungen überdecken (Text wird nicht gekürzt, §3/§4).
- E-08 (Hinweis) Browser-Autosave nutzt localStorage (ca. 5 MB). Mit eingebetteten Hintergründen (M2) reicht das nicht; betrifft nur den Browser-Dev-Modus.
- [QA] QA-M1-11 (gering, Dokumentation/Prozess) Die Entwicklung hat QA-Artefakte geändert: Abschnitt „Behoben“ an `qa/M1.md` angehängt und die Erwartung des QA-Tests „M1-24: Zwei-Finger-Wischen“ umgedreht (`tests/e2e/m1-canvas.spec.ts:104-107`, begründet). Dazu Widersprüche: QA-M1-02 steht hier als „erledigt“, in `qa/M1.md` als „teilweise“; die Einträge QA-M1-03/-04 nennen noch `test.fail`, obwohl die Markierungen entfernt sind.
- [x] [QA] QA-M4-05 (gering, Doku; Abschluss M4) Abschluss M4 widersprüchlich/veraltet: „Formatversion bleibt 1“ (Umgesetzt) vs. `CURRENT_SCHEMA_VERSION = 2` (Antworten); „165 Unit-Tests“, tatsächlich 170; „Zwei M3-E2E-Tests … schlagen fehl“ (Bekannte Bugs), beide sind angepasst und grün. Siehe `qa/M4.md`. **Erledigt 2026-10-11:** Abschluss M4 überarbeitet (Stand nach der QA-Nacharbeit).

---

## Querschnitt (gilt für alle Meilensteine)
- [ ] Q-01 Läuft auf Windows und macOS (NFA)
- [ ] Q-02 Komplett offline, kein Server, kein Account (NFA)
- [~] Q-03 Personenbezogene Händlerdaten bleiben lokal; nichts wird von fremden Servern nachgeladen, auch keine Schriften oder Icons (NFA, DSGVO, Gestaltung) – bisher eingehalten: Schriften über @fontsource, Icons über npm, CSP erlaubt nur `self`
- [~] Q-04 Flüssig mit mindestens 500 Ständen über alle Festplätze (NFA) – M3: Lasttest 500 Stände auf einer Page ≥ 55 Bilder/s in Chromium und WebKit (M3-23); M4: mit Freiflächen, Warnungen und Fang ≥ 51 Bilder/s (M4-21)
- [~] Q-05 TypeScript strict (NFA) – aktiv seit M1 (`strict`, `noUncheckedIndexedAccess`)
- [~] Q-06 Geometrie-, Freiflächen- und Nummerierungslogik als reine, UI-unabhängige Module mit Unit-Tests (Vorgehen 4, NFA) – M3: Rechteck-Geometrie, Treffer, Gruppen-Transformation, Beschriftung in `src/core/` mit Tests; M4: Freiflächen, Warnungen, Fang mit Fall-Tabelle und Eigenschaftstests
- [x] Q-07 Builds für Windows und macOS über GitHub Actions (Tech-Stack) – Workflow `.github/workflows/build.yml` seit 2026-10-12 (Zwischenschritt vor M5): check + E2E Chromium, dann `.dmg` (Universal) und `.msi`/`.exe` als Artefakte, ohne Signatur; Fundort siehe CLAUDE.md. Erster grüner Lauf 2026-10-12. Dafür QA-Test `m4-qa.spec.ts:982` korrigiert (erwartete nur „⇧F“/„Shift+F“, auf Windows/Linux zeigt die App „Umschalt+F“)
- [~] Q-08 Oberfläche komplett auf Deutsch (UI/Allgemein) – bisher eingehalten
- [ ] Q-09 Jedes Werkzeug, jede Page und jeder wichtige Button hat einen Shortcut; neue Funktionen tragen sich in die zentrale Shortcut-Konfiguration ein (Tastaturkürzel)

## M1 bis M3 – abgeschlossen und abgenommen
Aufgabenlisten, erledigte QA-Befunde und Abschlüsse: `docs/archiv/M1.md`, `docs/archiv/M2.md`, `docs/archiv/M3.md`.

## M4 – Freiflächen, Fang, Warnungen
Entscheidungen aus der Planung (2026-10-11) stehen in `spec.md` (Begriffe, §3, §4, Allgemein, Tastaturkürzel, NFA).
- [x] M4-01 Freiflächen-Kernlogik aus dem Prototyp mit Unit-Tests: Achse entlang der Vorderseite [0, Breite], belegtes Intervall = Projektion der Schnittmenge, Freiflächen = [0, Breite] minus Vereinigung, volle Tiefe, nie hinter einem Stand; Fall-Tabelle A1–A13 und Eigenschaftstests (fast-check) (§4) (QA ✓ M4)
- [x] M4-02 Freiflächen werden nie manuell gezeichnet und nie gespeichert, nur berechnet und angezeigt (hellgrün schraffiert, Ebene „Freiflächen“) (Begriffe, §4) (QA ✓ M4)
- [x] M4-03 Mindestbreite für Freiflächen (Standard 0,5 m, 0,05–100 m) im Seitenleisten-Bereich „Freiflächen & Warnungen“ (§4) (QA ✓ M4)
- [x] M4-04 Live-Neuberechnung beim Verschieben (auch während des Ziehens), Drehen, Ändern der Maße, Löschen; nur betroffene Grundflächen werden neu berechnet (§4) (QA ✓ M4)
- [x] M4-05 Freiflächen-Beschriftung „Frei B × T m“ horizontal mit fester Schriftgröße, wie bei Ständen (§4) (QA ✓ M4)
- [x] M4-06 Fang an der Vorderseite: Vorderseite des Stands legt sich an die der Grundfläche, übernimmt deren Drehung, gleitet entlang (Hysterese 8/16 px), fängt an Achsenenden und Nachbarn (§3) (QA ✓ M4)
- [x] M4-07 Fang-Umschalter in der Werkzeugleiste, einzeln schaltbar: Vorderkante, Raster, Nachbarstände; Ansichtseinstellungen ohne Undo-Schritt (§3, Layout) (QA ✓ M4)
- [x] M4-08 Cmd/Strg beim Ziehen schaltet den Fang vorübergehend aus (ersetzt die Alt-Umkehr; Entscheidung 2026-10-11) (§3, Allgemein) (QA ✓ M4)
- [x] M4-09 Warnung „außerhalb“ (orange), wenn ein Teil des Stands außerhalb der Vereinigung aller Grundflächen liegt (auch hinten herausragend); keine Blockade; global und pro Stand abschaltbar, mit Undo (§3) (QA ✓ M4)
- [x] M4-10 Warnung bei Überlappung zweier Stände (rot); global und pro Stand abschaltbar, mit Undo (§3) (QA ✓ M4)
- [x] M4-11 Shift beim Verschieben beschränkt die Richtung auf waagerecht/senkrecht/45°; eingerastet bleibt der Stand an der Vorderseite (aus E-20, Illustrator-Konvention) (QA ✓ M4)
- [x] M4-12 Alt+Ziehen dupliziert die Auswahl (Alt beim Loslassen entscheidet, ein Undo-Schritt) (aus E-20; Konflikt mit der Alt-Umkehr durch M4-08 aufgelöst) (QA ✓ M4)
- [x] M4-13 Toleranz 0,01 m für Überlappung, Bündigkeit, Belegung und „außerhalb“ (Begriffe, §4) (QA M4: Nacharbeit, QA-M4-01, QA-M4-02 in `qa/M4.md`) **Erledigt 2026-10-11:** bis einschließlich 0,01 m bündig, Rechentoleranz 1e-6 m, zentrale Vergleichsfunktionen (`src/core/geometry/tolerance.ts`), „außerhalb“ gegen die um 0,01 m aufgeweiteten Grundflächen.
- [x] M4-14 Überlappende Grundflächen: die frühere gewinnt, spätere rechnen nur mit ihrem Rest (§4) (QA ✓ M4)
- [x] M4-15 Fang an Nachbarständen (Anliegen, Flucht; nur parallele Nachbarn) (§3) (QA ✓ M4)
- [x] M4-16 Fang am Raster (Rand/Mitte des Hüllrechtecks, nur bei eingeblendetem Raster) (§3) (QA ✓ M4)
- [x] M4-17 Fang-Priorität (Vorderkante > Nachbar > Raster), Mehrfachauswahl nur parallel verschoben, Hilfslinien beim Einrasten (§3) (QA ✓ M4)
- [x] M4-18 Warnzähler am Page-Tab (§3) (QA ✓ M4)
- [x] M4-19 Stabiler Schlüssel je Freifläche und Auflösefunktion als Grundlage für die Sprung-Links in M6-02 (§4, §7) (QA ✓ M4)
- [x] M4-20 Während eines Ziehens keine Kurzbefehle (außer Esc); Übersicht (?) nennt die Tasten beim Ziehen (Allgemein, Tastaturkürzel) (QA ✓ M4)
- [x] M4-22 Versioniertes Dateiformat: Formatversion 2, Migration 1 → 2 (neue Felder mit Standardwerten), neuere Versionen mit deutscher Meldung abgewiesen; echte M3-Datei (Version 1) als Testdatei; Regel in CLAUDE.md (§10, Entscheidung 2026-10-11) (QA ✓ M4)
- [x] M4-21 Lasttest 500 Stände mit Freiflächen, Warnungen und Fang: ≥ 50 Bilder/s beim Zoomen, Verschieben der Ansicht und Ziehen quer über mehrere Grundflächen, Chromium und WebKit (NFA, Teil von Q-04) (QA M4: Nacharbeit, QA-M4-03 in `qa/M4.md`) **Erledigt 2026-10-11:** Kriterium präzisiert (Plan 8000 × 6000 px, Median aus 5 Läufen, kein Bild über 100 ms); Ursache der langen Einzelbilder (Autosave) behoben; zwischengespeicherte Ebenen beim Zoomen/Verschieben.
- [x] M4-23 Einblendbare Bildraten-Anzeige (Bilder/s, längstes Bild der letzten 2 s), Cmd/Strg+Alt+F, standardmäßig aus, nicht im PDF-Export (NFA, Messen in der Desktop-App; Auftrag Laurin 2026-10-11)

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

## Abschluss M4 (2026-10-11)

Abgleich mit `spec.md` vor diesem Abschluss: Die Entscheidungen der M4-Planung (Toleranz 0,01 m, Fälle A1–A13,
„frühere Grundfläche gewinnt“, Warnung auch bei hinten herausragenden Ständen, Abschalten je Art, Fang mit
Priorität und Hysterese, Cmd/Strg statt Alt-Umkehr, Alt+Ziehen dupliziert, keine Kurzbefehle während des
Ziehens, Warnzähler am Tab, stabiler Freiflächen-Schlüssel) stehen in `spec.md` (Begriffe, §3, §4, Allgemein,
Tastaturkürzel, NFA) und sind auf M4-01 bis M4-21 abgebildet. Eine Präzisierung aus der Umsetzung ist
nachgetragen (Freiflächen-Beschriftung ab 6 px, siehe Abweichungen).

### Umgesetzt
- **Kern (`src/core/`, ohne DOM/React):**
  - `geometry/polygon.ts`: Fläche, `clipConvex` (aus dem Prototyp), `subtractConvex`/`subtractAll` (konvex minus konvex), `penetration` (SAT), `thickness`, Zwischenspeicher der Rechteck-Ecken je Objekt, Schraffurlinien.
  - `geometry/interval.ts`: Vereinigung mit Toleranz und den IDs der begrenzenden Stände, Lücken.
  - `freeSpace.ts`: TOL = 0,01 m, Belegung (Eindringtiefe > TOL, Zuschnitt auf die Fläche, Enden an den Achsenenden), Freiflächen über die volle Tiefe, Regel für überlappende Grundflächen (L-förmige Reste mit Hüllmaßen), Schlüssel `areaId|links|rechts[#k]`, `resolveFreeSpace` für M6, Zwischenspeicher je Grundfläche.
  - `warnings.ts`: außerhalb (echter Abstand: Stand gegen die um TOL aufgeweiteten Grundflächen, QA-M4-02), Überlappung (Sweep + SAT) mit Schnittfläche, Zähler je Page.
  - `geometry/tolerance.ts` (QA-Nacharbeit): fachliche Toleranz TOL = 0,01 m (bis einschließlich bündig) und Rechentoleranz EPS = 1e-6 m; alle geometrischen Entscheidungen laufen über diese Vergleichsfunktionen.
  - `moveSnap.ts`: Fang beim Ziehen (Vorderkante mit Hysterese 8/16 px, Achsenenden und Nachbarn entlang der Vorderseite, Nachbarstände anliegen/fluchten, Raster, Priorität, Mehrfachauswahl nur parallel, Hilfslinien). `transform.ts`: `constrainDelta` (Shift).
- **Modell:** `Stand.suppressOverlapWarning`, `settings.warnOverlap` (Standard an). Formatversion 2 mit Migration 1 → 2 (M4-22, siehe Antworten).
- **Zeichenfläche:** Ebene „Freiflächen“ hellgrün getönt und schraffiert (Linien in Metern, Abstand ≈ 8 px in Zweierpotenzen), Beschriftung „Frei B × T m“ in der Ebene Beschriftung. Warnkonturen orange/rot, Warndreieck an der Stand-Ecke, rote Schnittfläche bei Überlappung. Alles live aus der Vorschau, also auch während des Ziehens; nur geänderte Grundflächen werden neu berechnet.
- **Auswahlwerkzeug:** Fang beim Ziehen mit Hilfslinien (Vorderseite mit Namen, Anliegen, Flucht, Achsenende). Shift beschränkt (eingerastet: bleibt an der Vorderseite), Alt dupliziert (Alt beim Loslassen zählt, Zeiger „Kopieren“), Cmd/Strg schaltet den Fang aus. Modifikatoren wirken sofort, auch ohne Mausbewegung. Während einer Geste werden Kurzbefehle verschluckt (außer Esc).
- **Oberfläche:**
  - Fang-Umschalter in der Werkzeugleiste aktiv (Shift+F/R/N, Ansichtseinstellung).
  - Seitenleisten-Bereich „Freiflächen & Warnungen“ (Mindestbreite, zwei Warnschalter, mit Undo).
  - Warnungen am Stand mit Häkchen „Überlappung ignorieren“ / „„außerhalb“ ignorieren“ (mit Undo, auch bei Mehrfachauswahl).
  - Ebene „Freiflächen“ im Ebenen-Panel (ohne Schloss).
  - Warnzähler am Page-Tab (rot bei Überlappung, Tooltip mit Aufschlüsselung).
  - Übersicht (?) mit Gruppe „Beim Ziehen“.
- **Tests:**
  - `src/core/m4.test.ts`: 56 Tests, darunter die Fall-Tabelle A1–A13 mit Toleranzgrenzen, Schlüssel, Auflösung, Cache-Zähler, Warnungen, Fang, Schraffur.
  - `src/core/m4.property.test.ts`: 6 Eigenschaften mit fast-check (je 300 zufällige Szenen): Breitensumme, keine Überschneidung, Reihenfolge, Drehung/Verschiebung, überlappende Flächen, Mindestbreite.
  - `src/core/m4.tolerance.test.ts` (QA-Nacharbeit): 0,009 / 0,010 / 0,011 m für Belegung, Überlappung und „außerhalb“, jeweils gerade, in gedrehter Szene und mit schräger Ecke; Eigenschaftstest (1000 Szenen): gemeinsame Drehung und Verschiebung ändert keine Entscheidung.
  - `src/core/model/migrations.test.ts`: Migration 1 → 2 mit echter M3-Datei.
  - Zusammen 201 Unit-Tests (Stand nach der QA-Nacharbeit).
  - `tests/e2e/m4-freespace.spec.ts`: 15 Tests × 2 Browser.
  - Lasttest `tests/e2e/m4-perf.spec.ts`.
  - Testprojekt `tests/fixtures/last-500-staende.schelme` neu erzeugt (neues Feld).
  - Neue devDependency: fast-check (nur Tests).

### Lasttest M4-21 (Abnahmekriterium, Stand nach der QA-Nacharbeit)
Kriterium (spec.md NFA): 500 Stände, viele Freiflächen, Plan 8000 × 6000 px; Median aus 5 Läufen ≥ 50 Bilder/s;
kein Bild über 100 ms. Gemessen am 2026-10-11 mit `npm run test:perf` (Dev-Server, ohne Stromsparmodus, auf Akku):
ein Komplettlauf und drei WebKit-Läufe hintereinander, alle grün.

| Median Bilder/s (längstes Bild) | Chromium | WebKit (3 Läufe) |
|---|---|---|
| Zoomen | 60 (17 ms) | 58,0–58,7 (≤ 57 ms) |
| Ansicht verschieben | 60 (17 ms) | 57,5–58,3 (≤ 51 ms) |
| Ansicht verschieben in Lesegröße (20 px/m) | 60 (17 ms) | 55,2–56,3 (≤ 67 ms) |
| Stand quer über die Grundflächen ziehen | 60 (17 ms) | 58,7–59,5 (≤ 39 ms) |

QA-Lasttest M4 (unverändert): WebKit 55,6–58,6, Chromium 59,6–60. QA-Lasttest M3: WebKit ≥ 53,8 in allen drei
Läufen. Vor der Nacharbeit lag WebKit mit Plan bei 45,6–50,9 (Lesegröße), mit Einzelbildern bis 265 ms.

Ursachen und Maßnahmen (Details in `qa/M4.md`, Abschnitt „Behoben“):
- **Einzelbilder 250–650 ms:** Autosave zippte das Projekt samt Plan synchron im Hauptthread (im Browser zusätzlich
  Base64). Jetzt asynchron in Workern und nie während einer Geste.
- **Zoomen/Verschieben:** Plan und Objekte liegen in zwischengespeicherten Ebenen, die per CSS-Transform bewegt werden.
  Neu gezeichnet wird nur bei Zoomänderung nach 150 ms Ruhe, an Rand- und Zoomgrenzen und bei Sprüngen.
- **Ziehen:** Unbewegte und bewegte Objekte sind getrennt gerendert; höchstens eine Berechnung pro Bild.
- Aus M4 (vorher): Schraffur als Linien statt Muster, Freiflächen ohne gestrichelte Kontur, Freiflächen-Beschriftung
  ab 6 px und nur im sichtbaren Bereich.

### Nicht umgesetzt / verschoben
- Nichts aus M4.

### Abweichungen von SPEC.md bzw. vom Plan
- **Freiflächen-Beschriftung erst ab 6 px Schrifthöhe** (Standbeschriftung ab 3 px) und ohne hellen Rand. Grund ist die Bildrate in WebKit. Die Spec ist angepasst.
- **Freiflächen ohne eigene Kontur:** Tönung und Schraffur grenzen sie ab. Im Prototyp war die Kontur gestrichelt; sie kostete in WebKit 8 Bilder/s.
- **Schraffur in Metern** statt als Muster in Bildschirmgröße. Der Abstand springt beim Zoomen in Zweierpotenzen und bleibt so etwa 8 px.
- **Häkchen sind keine Textfelder mehr:** Nach einem Klick auf ein Häkchen wirken Cmd/Strg+Z usw. global (`src/app/keyboard.ts`). Das ist nötig für „ignorieren … mit Undo“ und betrifft auch die Häkchen aus M2/M3.
- **Etikett der Vorderkanten-Hilfslinie** am linken Ende der Vorderseite: Die Mitte trägt schon die Grundflächen-Beschriftung.
- **Zeichenfläche in Ebenen (QA-Nacharbeit):** Plan, Klickfläche mit Raster, Objekte und Werkzeuge sind getrennte
  SVG-Ebenen; Mausereignisse behandelt der Container. Der Hintergrund wird geometrisch getroffen. Während fortlaufenden
  Zoomens ist das Bild bis zu 150 ms leicht unscharf, dann wieder scharf.
- **Bildraten-Anzeige** (M4-23, Cmd/Strg+Alt+F) auf Wunsch von Laurin ergänzt.

### Bekannte Bugs und Einschränkungen
- Schmale Freiflächen: Beschriftungen können sich überdecken (E-30).
- Nach einem großen Zoomsprung (Knopf, Kurzbefehl) dauert das erste Bild in neuer Größe in WebKit bis ca. 150–200 ms (Plan-Kacheln, alle Beschriftungen neu). Fortlaufendes Zoomen und Verschieben sind davon nicht betroffen.
- Der Warnzähler am Tab ändert sich nach dem Loslassen, nicht während des Ziehens (wie geplant).

### Manuell testen (Desktop-App)
- [ ] Bildraten-Anzeige (Cmd+Alt+F) einblenden, `last-500-staende.schelme` mit großem Plan: Zoomen, Verschieben, Ziehen flüssig? Ohne Stromsparmodus messen.
- [ ] Stand an eine gedrehte Grundfläche ziehen: rastet ein, dreht sich mit, gleitet entlang, löst sich beim Wegziehen.
- [ ] Alt+Ziehen dupliziert; Alt vor dem Loslassen lösen verschiebt nur. Cmd halten: kein Fang.
- [ ] Unter Windows: Alt während des Ziehens aktiviert keine Menüleiste.
- [ ] Testprojekt `last-500-staende.schelme`: Freiflächen sichtbar, Ziehen über die Grundflächen bleibt flüssig.

### Antworten (2026-10-11)
- Beide Tests angepasst wie vorgeschlagen, dazu `tests/e2e/m1-file.spec.ts:42` (Formatversion 2). Vermerkt in `qa/M3.md` und `qa/M1.md`.
- **Versioniertes Dateiformat (M4-22):**
  - `CURRENT_SCHEMA_VERSION = 2`.
  - `MIGRATIONS[1]` ergänzt `suppressOverlapWarning: false` und `warnOverlap: true`, ohne vorhandene Werte zu überschreiben.
  - Fehlt eine Migration, kommt eine deutsche Meldung.
  - Neuere Dateien werden wie bisher mit „neueren Version“ abgewiesen.
  - Echte Datei aus M3: `tests/fixtures/format-v1-m3.schelme` (das Testprojekt aus Commit f548eb5, Version 1, 500 Stände, 5 Kategorien), geprüft in `src/core/model/migrations.test.ts`.
  - Das Lasttest-Projekt `last-500-staende.schelme` ist jetzt Version 2.
  - Regel in CLAUDE.md.
  - Der Schlüssel in der Datei heißt weiterhin `schemaVersion`: Ein Umbenennen wäre selbst eine Formatänderung.
- Committen und pushen: ja.

### Offene Fragen (beantwortet, siehe oben)
1. **Zwei überholte Tests ändern?** Beide prüfen M3-Verhalten, das sich durch M4 bewusst geändert hat:
   - `tests/e2e/m3-objects.spec.ts:414` (mein Entwicklertest M3-14) erwartet die Ebenenliste `Grundflächen, Geschäfte, Beschriftung`. Seit M4 erscheint dazwischen „Freiflächen“, sobald es Grundflächen gibt. Vorschlag: Erwartung um „Freiflächen“ ergänzen.
   - `tests/e2e/m3-qa.spec.ts:45` (QA-Test M3-01/M3-18, Speichern und Öffnen) legt Stände ohne das neue Feld `suppressOverlapWarning` an. Nach dem Laden ergänzt der Ladecode es mit `false`, deshalb ist das Projekt nicht mehr gleich. Vorschlag: `suppressOverlapWarning: false` in `BASE` ergänzen.
2. Soll ich M4 committen?

