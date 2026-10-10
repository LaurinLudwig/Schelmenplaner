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
- **Freifläche**: wird immer automatisch berechnet, nie manuell gezeichnet.
- **Infrastruktur-Objekte**: mobile Sperre, feste Sperre, Sanitätsdienst, RTW-Platz, Toilette,
  Müllcontainer, enge Durchfahrt (mit Maß der lichten Breite), freier Marker mit Text.
  Jeder Typ hat eine eigene Farbe/Symbol und erscheint in der Legende. Pro Typ ist einstellbar,
  ob er die Fläche belegt (dann entsteht an dieser Stelle keine Freifläche, wie bei einem Geschäft).
- **Schriftfeld**: Planbeschriftung pro Festplatz-Page.

## Funktionen

### 1. Hintergrund & Maßstab
- Hintergrundplan pro Festplatz-Page importieren: PDF (Seitenauswahl bei mehrseitigen PDFs),
  SVG, JPEG, PNG.
- Deckkraft einstellbar, Hintergrund sperrbar, austauschbar ohne Verlust der gezeichneten Objekte.
- Kalibrierung: zwei Punkte auf dem Hintergrund klicken, realen Abstand in m eingeben, der
  Hintergrund wird entsprechend skaliert. Kalibrierung jederzeit wiederholbar.
- Hintergrund zusätzlich verschieb- und drehbar. Nordrichtung pro Festplatz-Page einstellbar
  (Nordpfeil folgt ihr).
- Raster mit einstellbarer Weite.

### 2. Grundflächen
- Rechteck mit dem Grundflächen-Werkzeug aufziehen, drehen, Vorderseite per Klick auf eine Kante
  festlegen (deutlich markiert).
- Beschriftung automatisch mit Maßen, z. B. „50 × 10 m“.

### 3. Geschäfte
- Mit dem Geschäfts-Werkzeug anlegen, frei verschieben und drehen (Drehung auch numerisch,
  Einrasten in 15°-Schritten mit gedrückter Shift-Taste).
- Fang an der Vorderseite: Beim Ziehen in eine Grundfläche rastet der Stand an der Vorderseite ein
  und übernimmt deren Ausrichtung. Ein-/ausschaltbar über die Werkzeugleiste (siehe UI),
  temporär umkehrbar mit gedrückter Alt-Taste.
- Geschäfte dürfen AUCH außerhalb von Grundflächen stehen. Dann Warnung (global und pro Stand
  deaktivierbar), aber keine Blockade.
- Warnung bei Überlappung zweier Stände.
- Attribute (Seitenleiste rechts): Platznummer, Geschäftsname, Eigentümer, Typ/Ware,
  Breite, Tiefe, Stromverbrauch in kW [ANPASSEN], Anschlussart (230 V / CEE 16 A / CEE 32 A),
  Notiz, Farbe/Kategorie.
- Beschriftung mittig auf dem Stand aus konfigurierbarer Vorlage, z. B.
  `{nr}` / `{name}` / `{breite}×{tiefe} m`.
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
  (Leertaste + Ziehen, Hand-Werkzeug). Trackpad: Pinch zoomt, Zwei-Finger-Wischen verschiebt.
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
  ein-/ausblendbar und sperrbar.
- Mehrfachauswahl (Shift+Klick, Auswahlrechteck), Kopieren/Einfügen, Duplizieren,
  Verschieben per Pfeiltasten (0,1 m, mit Shift 1 m), Entf zum Löschen.
- Oberfläche auf Deutsch.

## Nicht-funktionale Anforderungen
- Läuft auf Windows und macOS, komplett offline, kein Server, kein Account.
- Personenbezogene Händlerdaten bleiben lokal (DSGVO).
- Flüssig mit mind. 500 Ständen über alle Festplätze.
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