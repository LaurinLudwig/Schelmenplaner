# Projekt: Marktplan-Editor für den Schelmenmarkt Gelnhausen

## Kontext
Ich plane den Schelmenmarkt Gelnhausen (8 Festplätze). Bisher zeichne ich maßstabsgetreue
Pläne in Adobe Illustrator: farbige Rechtecke für Stände, Freiflächen, Sperren usw., darüber
Textfelder mit Eigentümer, Geschäftsname, Ware, Maße, Strom, Platznummer (händisch gezählt).
Ziel ist eine eigene Desktop-Anwendung, die das ersetzt und automatisiert. Ein Prototyp der
Freiflächen-Logik wurde bereits erfolgreich getestet (prototype/freiflaechen.html).

## Vorgehen (wichtig)
1. Lies diese Spezifikation und den Prototyp vollständig. Stelle mir Rückfragen zu Unklarheiten,
   BEVOR du Code schreibst.
2. Schlag Architektur, Datenmodell und Tech-Stack vor (Vorschlag unten, Abweichungen begründen).
3. Arbeite in den Meilensteinen am Ende, immer nur einen pro Durchgang. Nach jedem Meilenstein
   ist die App lauffähig und ich teste.
4. Die Geometrie-Logik (Freiflächen, Kollision, Nummerierung) ist reine, UI-unabhängige
   Logik mit Unit-Tests. Übernimm dafür die getestete Logik aus dem Prototyp.

## Begriffe / Datenmodell
- **Projekt** (z. B. „Schelmenmarkt 2027“) enthält mehrere **Pages**.
- **Start-Page**: immer die erste Page, nicht löschbar. Enthält Statistik und Listen (siehe 7).
- **Festplatz-Page**: eine Page pro Festplatz mit eigener Zeichenfläche. Pages lassen sich
  anlegen, umbenennen, umsortieren (Drag & Drop in der Tab-Leiste), duplizieren und löschen.
- **Hintergrundplan**: pro Festplatz-Page importiert, per Kalibrierung auf Meter skaliert.
- **Grundfläche**: Rechteck, frei rotierbar, mit einer markierten **Vorderseite**.
  Breite = Länge der Vorderseite, Tiefe = senkrecht dazu. [ANPASSEN: nur Rechtecke, keine Polygone]
- **Geschäft (Stand)**: Rechteck B × T in Metern, Position, Rotation, Attribute (siehe unten).
- Position ist der Mittelpunkt; gedreht wird um den Mittelpunkt (Grad im Uhrzeigersinn, 0–360).
  Positionen und Maße werden auf 0,01 m gerundet, Drehungen auf 0,1° (beim Übernehmen, nicht während
  des Ziehens). Intern ist die Vorderseite immer die lokale Unterkante; so ist die Breite immer die
  Länge der Vorderseite (Entscheidung 2026-10-10).
- **Kategorie**: Name und Farbe, projektweit. Ein Geschäft hat höchstens eine Kategorie.
- **Freifläche**: wird immer automatisch berechnet, nie manuell gezeichnet.
- **Infrastruktur-Objekte**: mobile Sperre, feste Sperre, Sanitätsdienst, RTW-Platz, Toilette,
  Müllcontainer, enge Durchfahrt (mit Maß der lichten Breite), freier Marker mit Text.
  Jeder Typ hat eine eigene Farbe/Symbol und erscheint in der Legende. Pro Typ ist einstellbar,
  ob er die Fläche belegt (dann entsteht an dieser Stelle keine Freifläche, wie bei einem Geschäft).
- **Schriftfeld**: Planbeschriftung pro Festplatz-Page.

## Funktionen

### 1. Hintergrund & Maßstab
- Hintergrundplan pro Festplatz-Page importieren: PDF (Seitenauswahl bei mehrseitigen PDFs),
  SVG, JPEG, PNG. Der Plan wird in die Projektdatei eingebettet; bei mehrseitigen PDFs nur die
  gewählte Seite.
- Deckkraft einstellbar, Hintergrund sperrbar, austauschbar ohne Verlust der gezeichneten Objekte.
- Kalibrierung: zwei Punkte auf dem Hintergrund klicken, realen Abstand in m eingeben, der
  Hintergrund wird entsprechend skaliert. Kalibrierung jederzeit wiederholbar. Nach der
  2-Punkt-Kalibrierung wird der Hintergrund automatisch gesperrt; gesperrt sind Position, Drehung
  und Maßstab geschützt (Kalibrieren bleibt möglich). Bei PDFs alternativ: Planmaßstab 1:n direkt
  eingeben (sperrt nicht automatisch).
- Rückfrage bei unplausiblem Maßstab: PDF außerhalb 1:50 bis 1:10.000, Bild/SVG mit Planbreite
  außerhalb 10 m bis 5 km, oder Änderung gegenüber der bisherigen Kalibrierung um mehr als Faktor 2.
- Hintergrund zusätzlich verschieb- und drehbar. Nordrichtung pro Festplatz-Page einstellbar
  (Nordpfeil folgt ihr).
- Raster mit einstellbarer Weite. „Raster ein/aus“ ist eine Ansichtseinstellung (kein Undo-Schritt,
  markiert das Projekt nicht als ungespeichert).

### 2. Grundflächen
- Rechteck mit dem Grundflächen-Werkzeug aufziehen, drehen, Vorderseite per Klick auf eine Kante
  festlegen (deutlich markiert). Klick ohne Ziehen legt eine Grundfläche 20 × 8 m an; ebenso ein
  Aufziehen mit weniger als 0,5 m in einer Richtung.
- Vorderseite wechseln: Die Fläche bleibt optisch exakt an derselben Stelle, nur die Markierung der
  Vorderseite wandert. Breite und Tiefe beziehen sich danach auf die neue Vorderseite (können tauschen),
  die angezeigte Drehung kann um 90°/180° springen. Zusätzlich Kantenwähler in der Seitenleiste.
- Größe zusätzlich per Ziehen an 8 Griffen (Ecken, Kantenmitten) änderbar; die gegenüberliegende
  Kante bzw. Ecke bleibt fest. Es gelten dieselben Grenzen wie in den Zahlenfeldern (0,5–2000 m).
  Drehen per Drehgriff (Shift = 15°-Schritte) und numerisch.
- Verschieben: Ein Klick wählt die Grundfläche aus; nur eine bereits ausgewählte Grundfläche wird per
  Ziehen verschoben. Ziehen auf einer nicht ausgewählten Grundfläche zieht ein Auswahlrechteck auf.
- Beschriftung automatisch mit Name und Maßen, z. B. „Grundfläche Nord · 50 × 10 m“: horizontal, feste
  Schriftgröße wie die Standbeschriftung, außerhalb der Fläche vor der Mitte der Vorderseite (kollidiert
  so nicht mit Ständen und Freiflächen).

### 3. Geschäfte
- Mit dem Geschäfts-Werkzeug anlegen (Klick: Standardmaß, anfangs 3 × 3 m, danach das zuletzt
  angelegte plausible Maß, also beide Seiten mindestens 0,5 m; Ziehen: Rechteck aufziehen, unter 0,5 m in
  einer Richtung zählt es als Klick), frei verschieben und drehen (Drehgriff und numerisch,
  Einrasten in 15°-Schritten mit gedrückter Shift-Taste). Die Größe eines Stands ändert sich nur über
  Zahlenfelder, nicht per Griff.
- Fang an der Vorderseite: Beim Ziehen in eine Grundfläche rastet der Stand an der Vorderseite ein
  und übernimmt deren Ausrichtung. Ein-/ausschaltbar über die Werkzeugleiste (siehe UI),
  temporär umkehrbar mit gedrückter Alt-Taste.
- Geschäfte dürfen AUCH außerhalb von Grundflächen stehen. Dann Warnung (global und pro Stand
  deaktivierbar), aber keine Blockade.
- Warnung bei Überlappung zweier Stände.
- Attribute (Seitenleiste rechts): Platznummer, Geschäftsname, Eigentümer, Typ/Ware,
  Breite, Tiefe, Stromverbrauch in kW [ANPASSEN], Anschlussart (230 V / CEE 16 A / CEE 32 A),
  Notiz, Farbe/Kategorie.
- Farbe: aus der Kategorie; optional eine eigene Farbe pro Stand, die die Kategoriefarbe überschreibt.
  Ohne beides neutrales Grau.
- Kategorien werden in der Seitenleiste im Bereich „Kategorien“ angelegt, umbenannt, umgefärbt und
  gelöscht (bis M6; danach zusätzlich in den Projekteinstellungen). Beim Löschen einer verwendeten
  Kategorie fragt die App nach; die Stände verlieren die Kategorie (Farbe fällt auf die eigene Farbe
  bzw. Grau zurück), alles rückgängig machbar.
- Beschriftung mittig auf dem Stand aus konfigurierbarer Vorlage, z. B.
  `{nr}` / `{name}` / `{breite}×{tiefe} m`. Platzhalter: `{nr}`, `{name}`, `{eigentuemer}`, `{ware}`,
  `{breite}`, `{tiefe}`, `{strom}`, `{anschluss}`, `{kategorie}`. Zeilen, die nach dem Einsetzen leer
  sind oder deren Platzhalter alle leer sind (z. B. „{strom} kW“ ohne Stromangabe), entfallen. Vorlage und Schriftgröße sind projektweit; bis M6 in einem eigenen Bereich
  „Beschriftung“ der Seitenleiste (nicht bei den Eigenschaften eines Stands).
- Die Beschriftung ist IMMER horizontal, unabhängig von der Drehung des Stands, und wird über
  dem Stand gezeichnet (oberste Ebene).
- Feste Schriftgröße in Planeinheiten (skaliert mit dem Zoom und erscheint im PDF in passender
  Größe), einstellbar in den Projekteinstellungen. Der Text darf über den Stand hinausragen,
  es wird nichts gekürzt oder verkleinert.

### 4. Freiflächen-Logik (Kern)
- Jede Grundfläche hat eine Achse entlang ihrer Vorderseite, Bereich [0, Breite].
- Jedes Geschäft, das die Grundfläche überlappt, belegt auf dieser Achse das Intervall seiner
  Projektion (Schnittmenge mit der Grundfläche).
- Freiflächen = [0, Breite] minus Vereinigung aller belegten Intervalle. Jede Freifläche hat die
  volle Tiefe der Grundfläche. Hinter einem Stand entsteht NIE eine Freifläche, auch wenn der
  Stand weniger tief ist.
- Beispiel: Grundfläche 50 × 10 m, Stand 8 m breit bei x = 20 m → Freiflächen 20 × 10 m (links)
  und 22 × 10 m (rechts).
- Freiflächen unter einer Mindestbreite (Standard 0,5 m, einstellbar) werden nicht angezeigt.
- Beschriftung der Freiflächen wie bei Ständen: immer horizontal, feste Schriftgröße.
- Neuberechnung live beim Verschieben, Drehen, Ändern der Maße, Löschen.

### 5. Standnummern
- Modi: links → rechts entlang der Vorderseite (Grundflächen in festgelegter Reihenfolge),
  Uhrzeigersinn um einen pro Festplatz manuell gesetzten Mittelpunkt mit Startrichtung, manuell.
- Einstellbar: Startnummer, Präfix pro Festplatz (z. B. „A-“), global durchgehend oder pro Festplatz.
  [ANPASSEN]
- Manuell gesetzte Nummern können fixiert werden. Die Automatik überspringt den Stand und seine
  Nummer, sodass keine Nummer doppelt vergeben wird.
- Neu nummerieren nur per Button (mit Vorschau), damit vergebene Nummern nicht unbemerkt springen.

### 6. Strom
- Optionales Stromlimit pro Festplatz in kW.
- Laufende Summe als Balken (grün / gelb ab 90 % / rot über Limit), sichtbar auf der jeweiligen
  Festplatz-Page und auf der Start-Page. Warnung beim Überschreiten, Blockieren optional.

### 7. Start-Page (Statistik & Listen)
- Kennzahlen global und pro Festplatz: Anzahl Geschäfte, Summe Frontmeter (Breiten),
  belegte Fläche, Stromsumme vs. Limit.
- Liste aller Freiflächen: Festplatz, Grundfläche, Maße. Klick wechselt auf die Festplatz-Page,
  zoomt hin und hebt die Fläche kurz hervor.
- Tabelle aller Geschäfte über alle Festplätze: sortier- und filterbar, direkt editierbar
  (Änderungen wirken sofort im Plan), Klick springt zum Stand.
- Projekteinstellungen (Projektname, Nummerierungsschema, Mindestbreite Freiflächen,
  Schriftgröße der Standbeschriftung).
- Export der Tabellen als CSV/XLSX.

### 8. Schriftfeld
- Auf jeder Festplatz-Page: Projektname, Festplatz, Datum/Version, optionales Freitextfeld.
- Frei verschiebbar, einheitliches Layout auf allen Pages.

### 9. PDF-Export
- Gesamtplan (alle Festplatz-Pages, optional mit Start-Page-Listen als Anhang) oder einzelne Pages.
- Papierformat A4–A0, Hoch/Quer, Maßstab wählbar (z. B. 1:200, 1:500) oder „an Seite anpassen“.
- Mit Maßstabsbalken, Nordpfeil, Legende. Vektor-PDF mit durchsuchbarem Text.
- Ebenen beim Export ein-/ausblendbar und als Export-Profile speicherbar, z. B.
  „Sanität/Ordnungsamt“ (ohne Eigentümer und Strom) oder „intern“ (alles).

### 10. Daten
- Projekt als eine Datei speichern (JSON-basiert, eigenes Dateiformat), Autosave, Undo/Redo.
  Format: ZIP-Container `.schelme` mit `project.json` und den eingebetteten Hintergrunddateien.
  Autosave schreibt in eine Sicherungsdatei, die beim Öffnen zur Wiederherstellung angeboten wird.
  Undo/Redo gilt projektweit.
- Projekt als Vorlage fürs nächste Jahr duplizieren.
- Import einer Händlerliste aus CSV/XLSX (Spalten zuordnen). Importierte Händler landen in einer
  Liste „noch nicht platziert“ und können per Drag & Drop platziert werden. [Phase 2]

## Bedienung / UI

### Gestaltung
- Orientiert sich an Adobe Illustrator: dunkles, neutrales Grau als Standard (helles Theme
  optional), kompakte Panels, kleine Schrift, viel Platz für die Zeichenfläche.
  Kein Adobe-Branding und keine Adobe-Icons.
- Icons: Google Material Symbols (https://fonts.google.com/icons), lokal eingebunden
  (z. B. per npm-Paket als SVG), NICHT von Googles Servern geladen: die App muss offline laufen,
  und das Nachladen von Google-Servern überträgt die IP-Adresse (DSGVO).

### Layout
- **Oben: Tab-Leiste mit den Pages.** Start-Page ganz links, danach die Festplatz-Pages.
  Durchschalten per Klick oder Shortcut. „+“-Tab legt eine neue Festplatz-Page an,
  Doppelklick benennt um, Rechtsklick öffnet ein Kontextmenü (Duplizieren, Löschen).
- **Darunter: Steuerungsleiste** (wie in Illustrator), kontextabhängig: zeigt X, Y, Breite,
  Tiefe, Drehung des ausgewählten Objekts zum direkten Bearbeiten.
- **Links: vertikale Werkzeugleiste nur aus Icons, ohne Text.** Beim Hovern erscheint ein
  Tooltip mit Name, kurzer Funktionsbeschreibung und Shortcut, z. B.
  „Geschäft erstellen (G) – Neuen Stand auf der Zeichenfläche aufziehen“.
  Aktive Werkzeuge und eingeschaltete Umschalter (z. B. Fang) sind farblich hervorgehoben.
  Enthält mindestens:
  Auswahl, Hand (Verschieben der Ansicht), Zoom, Grundfläche erstellen, Geschäft erstellen,
  Infrastruktur-Objekte (als aufklappbare Werkzeuggruppe), Messwerkzeug, Kalibrierung,
  Schriftfeld, sowie Umschalter für Fang (Vorderkante, Raster, Nachbarstände; einzeln
  schaltbar), Raster ein/aus.
- **Mitte: Zeichenfläche** mit Zoom (Mausrad, Strg/Cmd + / −, „an Fenster anpassen“) und Pan
  (Leertaste + Ziehen, Hand-Werkzeug). Trackpad: Pinch zoomt, Zwei-Finger-Wischen verschiebt, in
  der Richtung des Systems; im Menü umkehrbar („Wischrichtung umkehren“, pro Rechner).
- **Rechts: Seitenleiste** mit Eigenschaften des ausgewählten Objekts und Ebenen-Panel.
  Einklappbar per Button und per Shortcut (Tab blendet wie in Illustrator alle Panels aus).

### Messwerkzeug
- Zwei Punkte klicken, Abstand in m wird angezeigt. Fängt an Ecken und Kanten von Objekten.
- Die Messung bleibt bis zum nächsten Werkzeugwechsel sichtbar.

### Tastaturkürzel
- Jedes Werkzeug, jede Page und jeder wichtige Button hat einen Shortcut.
- Beim Hovern erscheint ein Tooltip mit Name und Shortcut (bei Werkzeugen zusätzlich die
  Funktionsbeschreibung, siehe Werkzeugleiste).
- Wo sinnvoll Illustrator-Konventionen übernehmen (V Auswahl, H Hand, Z Zoom, Leertaste
  temporär Hand, Strg/Cmd+Z Rückgängig, Strg/Cmd+Shift+Z Wiederholen, Strg/Cmd+0 an Fenster
  anpassen). Auf macOS Cmd statt Strg.
- Alle Shortcuts zentral in einer Konfiguration definiert; eine Übersicht ist per `?` abrufbar.

### Allgemein
- Ebenen (Hintergrund, Grundflächen, Freiflächen, Geschäfte, Infrastruktur, Beschriftung)
  ein-/ausblendbar und sperrbar. Ein-/Ausblenden und Sperren sind Ansichtseinstellungen (kein
  Undo-Schritt). Gesperrte Ebenen sind sichtbar, aber nicht auswählbar; ausgeblendete fangen nicht.
  Die Sperre der Ebene „Hintergrund“ ist dieselbe wie die Hintergrund-Sperre aus §1 und bleibt wie
  dort rückgängig machbar (sie gehört mit zur Kalibrierung).
- Mehrfachauswahl (Shift+Klick, Auswahlrechteck), Kopieren/Einfügen, Duplizieren,
  Verschieben per Pfeiltasten (0,1 m, mit Shift 1 m), Entf zum Löschen.
  - Auswahlrechteck wählt nur Objekte, die vollständig darin liegen; Shift ergänzt.
  - Steuerungsleiste und Seitenleiste bei Mehrfachauswahl: X und Y zeigen die Mitte der Auswahl; eine
    Eingabe verschiebt die Auswahl als Ganzes (wie in Illustrator). Breite, Tiefe, Drehung und Attribute:
    unterschiedliche Werte erscheinen als leeres Feld, eine Eingabe gilt für jedes ausgewählte Objekt;
    die Drehung erfolgt dabei jeweils um den eigenen Mittelpunkt. Der Drehgriff dreht eine
    Mehrfachauswahl um die gemeinsame Mitte (Entscheidung 2026-10-11, QA-M3-07).
  - Griffe (Drehgriff, Größengriffe, Kanten) haben eine Toleranz von 3 px: Bewegungen darunter zählen
    als Klick, ohne Änderung und ohne Undo-Schritt.
  - Kopieren/Einfügen über eine interne Zwischenablage, auch zwischen Pages. Einfügen auf derselben Page
    setzt die Kopie um 1 m nach rechts unten versetzt, jedes weitere Einfügen 1 m weiter; auf einer
    anderen Page landet sie an derselben Position (liegt diese außerhalb des sichtbaren Bereichs, mittig
    in der Ansicht). Kopien erhalten eine leere, nicht fixierte Platznummer. Duplizieren (Cmd/Strg+D)
    setzt die Kopie um 1 m nach rechts unten versetzt.
  - Beim Verschieben beschränkt Shift die Richtung auf waagerecht/senkrecht/45°; Alt+Ziehen dupliziert
    die Auswahl (Illustrator-Konventionen, ab M4; Entscheidung 2026-10-10).
  - Ein Ziehen, Drehen oder Aufziehen ist genau ein Undo-Schritt; ebenso eine Feldänderung in der
    Seiten- oder Steuerungsleiste. Jeder einzelne Pfeiltasten-Druck ist ein eigener Undo-Schritt; nur
    eine gedrückt gehaltene Taste (Tastenwiederholung) ergibt zusammen einen Schritt (QA-M3-05).
  - Esc bricht eine laufende Interaktion (Ziehen, Aufziehen, Messen, Kalibrieren) immer zuerst ab, erst
    danach greifen globale Kurzbefehle wie „Auswahl aufheben“ (QA-M3-01).
- Oberfläche auf Deutsch, auch alle Fehlermeldungen.
- Zahleneingaben: Komma als Dezimaltrennzeichen, Punkt wird ebenfalls als Dezimaltrennzeichen
  akzeptiert. Eingabefelder zeigen keine Tausendertrennzeichen (nur reine Anzeigen).

## Nicht-funktionale Anforderungen
- Läuft auf Windows und macOS, komplett offline, kein Server, kein Account.
- Personenbezogene Händlerdaten bleiben lokal (DSGVO).
- Flüssig mit mind. 500 Ständen über alle Festplätze. Abnahmekriterium (ab M3): mit 500 Ständen
  auf einer Page mindestens 50 Bilder/s beim Zoomen, beim Verschieben der Ansicht und beim Ziehen
  eines Stands, in Chromium und WebKit.
- TypeScript strict, Unit-Tests für die Geometrie- und Nummerierungslogik.

## Tech-Stack (Vorschlag)
Tauri 2 + React + TypeScript + Vite, Zeichenfläche mit react-konva (oder SVG, begründen),
State mit Zustand inkl. Undo/Redo, PDF-Import via pdf.js, PDF-Export als Vektor (z. B. jsPDF +
svg2pdf.js), Icons aus Material Symbols lokal gebündelt. Builds für Windows und macOS über
GitHub Actions.

Entschieden (2026-10-10): Zeichenfläche als SVG (Prototyp ist SVG; derselbe SVG-Baum dient dem
Vektor-PDF-Export), Undo/Redo über Immer-Patches, ZIP über fflate, PDF-Hintergründe im Export
als Vektor über pdf-lib.

## Meilensteine
1. Grundgerüst: Projekt, Pages-Tab-Leiste, Start-Page (leer), UI-Layout mit Icon-Werkzeugleiste,
   einklappbarer Seitenleiste und Theme, Zeichenfläche mit Zoom/Pan, Speichern/Laden,
   Shortcut-System mit Tooltips.
2. Hintergrundplan-Import (PDF, SVG, JPEG, PNG) + Kalibrierung + Raster + Messwerkzeug.
3. Grundflächen + Geschäfte + Seitenleiste + Steuerungsleiste + Beschriftung
   (horizontal, feste Schriftgröße).
4. Freiflächen-Logik inkl. Tests (aus dem Prototyp übernommen), Fang-Optionen,
   Warnungen (außerhalb, Überlappung).
5. Nummerierung, Stromlimit.
6. Start-Page: Statistik, Listen mit Sprung-Links, Tabellenbearbeitung.
7. Infrastruktur-Objekte, Schriftfeld, Legende.
8. PDF-Export inkl. Export-Profile.
9. Phase 2: Händler-Import, Jahresvorlage, CSV/XLSX-Export.