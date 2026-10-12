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
- **Freifläche**: wird immer automatisch berechnet, nie manuell gezeichnet und nie gespeichert.
- **Toleranz** für geometrische Vergleiche: 0,01 m (= Speichergenauigkeit). Überlappung erst bei
  mehr als 0,01 m Eindringtiefe; ein Abstand bis 0,01 m gilt als bündig (Entscheidung 2026-10-11).
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
- Fang beim Ziehen (Entscheidung 2026-10-11). Fangabstand 8 Bildschirm-Pixel (zoomunabhängig).
  Drei Umschalter in der Werkzeugleiste (Vorderkante Shift+F, Raster Shift+R, Nachbarstände Shift+N);
  sie sind Ansichtseinstellungen (kein Undo-Schritt, keine Änderungsmarkierung, werden mitgespeichert).
  Standard: Vorderkante und Nachbarstände an, Raster aus.
  - Vorderkante (nur Stände): Liegt die Vorderseite des Stands bei gleicher Drehung wie die Grundfläche
    höchstens 8 px von deren Vorderseite entfernt, legt sie sich an die Vorderseite der Grundfläche und
    der Stand übernimmt deren Drehung. Danach gleitet er entlang der Vorderseite; gelöst wird er erst
    bei mehr als 16 px Abstand, dann bekommt er seine ursprüngliche Drehung zurück. Eingerastet fängt er
    entlang der Vorderseite an deren Enden und (mit Nachbar-Fang) an den Kanten benachbarter Stände.
  - Nachbarstände: Ein Stand rastet bündig an einer Kante eines parallel stehenden Nachbarn ein
    (Anliegen) oder fluchtet mit dessen Kanten.
  - Raster (Stände und Grundflächen, nur bei eingeblendetem Raster): Rand oder Mitte des Hüllrechtecks
    der Auswahl rastet je Achse an der nächsten Rasterlinie ein.
  - Priorität: Vorderkante vor Nachbarstand vor Raster; bei gleicher Priorität der nähere Kandidat.
  - Mehrfachauswahl: Der Fang gilt für das gegriffene Objekt und verschiebt die Gruppe nur parallel.
  - Beim Einrasten erscheinen Hilfslinien (wie die intelligenten Hilfslinien in Illustrator).
  - Cmd (macOS) bzw. Strg (Windows) beim Ziehen gedrückt halten schaltet jeden Fang vorübergehend aus.
- Geschäfte dürfen AUCH außerhalb von Grundflächen stehen. Dann Warnung, aber keine Blockade.
  Warnungen (Entscheidung 2026-10-11):
  - Außerhalb (orange): Ein Teil des Stands liegt mehr als 0,01 m außerhalb der Vereinigung aller
    Grundflächen, auch wenn er nur hinten herausragt. Ein Stand über zwei aneinanderliegenden
    Grundflächen ist nicht außerhalb.
  - Überlappung (rot, Vorrang vor orange): zwei Stände dringen mehr als 0,01 m ineinander ein.
  - Doppelte Nummer (orange, Entscheidung 2026-10-12): zwei Stände im selben Nummernkreis (§5) haben dieselbe
    Platznummer („12“ = „012“, Groß-/Kleinschreibung und Leerzeichen am Rand egal). Das Präfix gehört zur Nummer:
    „A-12“ = „A-012“, aber „A-12“ ≠ „B-12“. Leere Nummern sind nie doppelt.
    Die Seitenleiste nennt die anderen Stände mit dieser Nummer (auch auf anderen Pages).
  - Jede Art ist projektweit abschaltbar und pro Stand ignorierbar („außerhalb ignorieren“,
    „Überlappung ignorieren“, „doppelte Nummer ignorieren“, wirkt nur auf den eigenen Stand); alles rückgängig
    machbar.
  - Der Page-Tab zeigt die Zahl der Stände mit aktiver Warnung (rot, sobald eine Überlappung dabei ist),
    damit Probleme auf anderen Pages sichtbar sind.
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
- Ein Stand belegt eine Grundfläche nur, wenn er mehr als 0,01 m in sie hineinragt; eine bloße
  Berührung von außen belegt nichts. Gedrehte Stände belegen ihre volle Projektion. Ragt ein Stand
  seitlich heraus, zählt nur der Teil innerhalb. Intervalle mit einer Lücke bis 0,01 m werden
  zusammengefasst; Intervallenden näher als 0,01 m an 0 bzw. an der Breite werden dorthin gezogen.
- Überlappende Grundflächen: Die frühere Grundfläche (Reihenfolge der Grundflächen auf der Page)
  gewinnt. Eine spätere rechnet nur mit ihrem Teil außerhalb der früheren: Stände werden darauf
  zugeschnitten, ihre Freiflächen verlieren den Teil in der früheren Fläche (kann L-förmig werden;
  Beschriftung dann mit den Hüllmaßen Breite entlang der Vorderseite × größte Tiefe). Frühere
  Grundflächen ändern sich durch spätere nie (Entscheidung 2026-10-11).
- Freiflächen unter einer Mindestbreite (Standard 0,5 m, einstellbar 0,05–100 m im Seitenleisten-
  Bereich „Freiflächen & Warnungen“, bis M6) werden nicht angezeigt.
- Beschriftung der Freiflächen wie bei Ständen: „Frei 20 × 10 m“, immer horizontal, mittig, feste
  Schriftgröße; sie erscheint ab 6 px Schrifthöhe auf dem Bildschirm (darunter unlesbar). Darstellung
  hellgrün getönt und schraffiert.
- Neuberechnung live beim Verschieben (auch während des Ziehens), Drehen, Ändern der Maße, Löschen;
  dabei werden nur die betroffenen Grundflächen neu berechnet.
- Jede Freifläche hat einen stabilen Schlüssel aus Grundfläche und den beiden begrenzenden Ständen
  (bzw. Anfang/Ende der Achse). Er bleibt gleich, solange dieselben Stände die Lücke begrenzen, und
  dient den Sprung-Links der Start-Page (§7).

### 5. Standnummern
Entscheidungen 2026-10-12 (M5-Planung).
- Modi pro Festplatz: links → rechts über den Festplatz, Uhrzeigersinn um einen Mittelpunkt, manuell.
- **Links → rechts** (geändert 2026-10-12, Laurin): Alle Stände der Page werden von links nach rechts durchlaufen,
  unabhängig von den Grundflächen. Maßgeblich ist die Mitte des Stands auf dem Plan (x-Achse der Zeichenfläche,
  unabhängig von der Nordrichtung). Stände außerhalb von
  Grundflächen zählen genauso mit. Die Reihenfolge der Grundflächen spielt für die Nummerierung keine Rolle mehr;
  sie entscheidet nur noch, welche Grundfläche bei Überlappung gewinnt (§4), und ist im Seitenleisten-Bereich
  „Grundflächen“ mit ↑/↓ änderbar (Undo-Schritt).
  Reihenfolge ohne Toleranz (Entscheidung 2026-10-12, QA-M5-01; eine Toleranz „bis 0,01 m gleich“ ist nicht
  transitiv und machte das Ergebnis von der Anlegereihenfolge abhängig):
  - Verglichen wird die Standmitte, gerundet auf 0,01 m (die gespeicherte Genauigkeit).
  - Kleineres x zuerst.
  - Bei exakt gleichem x: kleineres y zuerst (weiter oben auf der Zeichenfläche).
  - Bei exakt gleicher Position: nach ID (der Fall ist ohnehin eine Überlappung mit Warnung).
  Das Ergebnis hängt nur vom Plan ab, nicht von der Reihenfolge, in der die Stände angelegt wurden.
- **Uhrzeigersinn:** um einen pro Festplatz gesetzten Mittelpunkt (Klick auf die Zeichenfläche nach „Mittelpunkt
  setzen“ oder Felder X/Y; beim ersten Umschalten die Mitte aller Grundflächen und Stände). Startrichtung in Grad
  im Uhrzeigersinn relativ zum Norden des Plans (Nordrichtung der Page), Standard 0° = Norden. Sortiert wird nach
  dem Winkel der Standmitte ab der Startrichtung, ebenfalls ohne Toleranz (QA-M5-01): Standmitte auf 0,01 m
  gerundet, Winkel auf 0,1° gerundet (359,95° und mehr zählt als 0°); bei gleichem gerundetem Winkel der Stand mit
  dem kleineren, auf 0,01 m gerundeten Abstand zum Mittelpunkt zuerst, danach nach ID. Es zählen alle Stände der
  Page. Mittelpunkt und Startrichtung sind auf der Zeichenfläche als Fadenkreuz
  mit Strahl sichtbar, solange der Modus aktiv ist (nicht im PDF).
- **Manuell:** Die Automatik lässt die Page aus.
- **Format:** Präfix der Page + Zahl, aufgefüllt auf die Stellenzahl (z. B. Präfix „A-“, 2 Stellen → „A-01“).
  Präfix pro Festplatz; Startnummer und Stellenzahl (1–4, Standard 1 = ohne führende Nullen) projektweit.
- **Nummernkreis:** „pro Festplatz“ (jede Page beginnt bei der Startnummer) oder „global durchgehend“ (Pages in
  der Reihenfolge der Tabs; Pages im Modus „manuell“ werden übersprungen, ihre Nummern gelten als belegt).
- **Fixierte Nummern:** Schloss neben der Platznummer (auch bei Mehrfachauswahl). Die Automatik überspringt
  fixierte Stände und vergibt keine Nummer, die einer fixierten im selben Nummernkreis gleicht (Vergleich wie bei
  der Warnung „doppelte Nummer“, §3). Eine fixierte Nummer bleibt von Hand änderbar; fixiert und leer = der Stand
  bleibt ohne Nummer.
- **Neue Stände** und Kopien bekommen keine Nummer, bis neu nummeriert wird. Der Bereich „Nummerierung“ zeigt die
  Zahl der Stände ohne Nummer.
- **Neu nummerieren** nur per Button bzw. Kurzbefehl, damit vergebene Nummern nicht unbemerkt springen. Bei „pro
  Festplatz“ betrifft es die aktive Page, bei „global“ alle Pages außer den manuellen. Der Dialog bietet zwei
  Optionen (Entscheidung 2026-10-12), beide mit Vorschau alt → neu und der Zahl der fixierten und unveränderten
  Stände, beide ein Undo-Schritt:
  - „Alle neu nummerieren“: alle nicht fixierten Stände der betroffenen Pages in der Reihenfolge des Modus.
  - „Nur Stände ohne Nummer“: Bestehende Nummern bleiben unverändert. Stände ohne Nummer bekommen fortlaufende
    Nummern ab der höchsten vergebenen Nummer im Nummernkreis (Zahl = letzte Ziffernfolge einer Nummer, z. B.
    „A-012“ → 12; mindestens die Startnummer), in der Reihenfolge des gewählten Modus. Nummern, die im Nummernkreis
    schon vorkommen, werden übersprungen.
  - Vorausgewählt ist „Nur Stände ohne Nummer“, sobald im Nummernkreis schon irgendein Stand eine Nummer hat, sonst
    „Alle neu nummerieren“.
  Doppelte Nummern, die danach bleiben (z. B. zwischen fixierten Ständen), nennt die Vorschau.

### 6. Strom
Entscheidungen 2026-10-12 (M5-Planung).
- Optionales Stromlimit pro Festplatz in kW. Es zählen alle Stände der Page, auch außerhalb von Grundflächen.
- Laufende Summe als Balken (grün / gelb ab 90 % / rot über Limit) mit „84 / 100 kW (84 %)“. Verglichen wird auf
  0,001 kW gerundet (11,7 von 13 kW sind genau 90 %, also gelb). Die Prozentzahl wird abgerundet, damit sie zur
  Farbe passt (89,9 % zeigt „89 %“); über dem Limit erscheint sie mit einer Nachkommastelle, wenn die ganze Zahl
  100 wäre (100,1 %), bei weniger als 0,1 % darüber „über 100 %“. Anzeige auf der Festplatz-Page
  im Seitenleisten-Bereich „Strom“ (immer sichtbar, auch bei Auswahl), auf der Start-Page in M6. Ohne Limit nur
  die Summe. Dazu Anzahl und kW je Anschlussart (230 V, CEE 16 A, CEE 32 A, ohne Angabe).
- Überschreitung: eigenes Blitz-Symbol am Page-Tab (getrennt vom Warnzähler der Stände). Ohne Blockieren erscheint
  ein Hinweis nur, wenn eine Änderung die Summe von „im Limit“ auf „über dem Limit“ bringt (Entscheidung 2026-10-12).
  Solange das Limit überschritten bleibt, reichen roter Balken und Blitz-Symbol.
- Blockieren (pro Festplatz einschaltbar): Eine Änderung, die die Summe der Page erhöht und danach über dem Limit
  liegt, wird mit deutscher Meldung abgewiesen (Strom-Feld, Einfügen, Duplizieren, Alt+Ziehen). Senkungen sind
  immer erlaubt. Nicht blockiert werden Rückgängig/Wiederholen, Öffnen, ein Limit unter der aktuellen Summe und das
  Duplizieren einer Page. Bestehende Überschreitungen bleiben sichtbar und werden nicht korrigiert.

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
- Das Dateiformat ist versioniert (`schemaVersion` in `project.json`). Jede Formatänderung erhöht die
  Version und bringt eine Migration mit, die ältere Dateien beim Öffnen umwandelt und fehlende Felder mit
  Standardwerten ergänzt. Dateien einer neueren Version, als die App kennt, werden mit einer
  verständlichen Meldung abgewiesen (Entscheidung 2026-10-11; Version 2 seit M4, Version 3 seit M5).
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
- Alle Shortcuts zentral in einer Konfiguration definiert; eine Übersicht ist per `?` abrufbar. Sie
  nennt auch die Tasten beim Ziehen (Shift, Alt, Cmd/Strg).
- AltGr (Entscheidung 2026-10-12, QA-M5-03): Unter Windows ist AltGr = Strg+Alt. Deshalb keine Kurzbefehle mit
  Strg+Alt (macOS Cmd+Alt) auf Tasten, die auf deutschen Tastaturen per AltGr ein Zeichen erzeugen (u. a. Q @, E €,
  M µ, 2 ², 3 ³, 7 {, 8 [, 9 ], 0 }, ß \, + ~, < |). Kurzbefehle greifen nicht, solange ein Textfeld den Fokus hat.

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
  - Beim Verschieben beschränkt Shift die Richtung auf waagerecht/senkrecht/45°; ein an der Vorderseite
    eingerasteter Stand bleibt mit Shift an ihr. Alt+Ziehen dupliziert die Auswahl (entscheidend ist Alt
    beim Loslassen; Kopien mit leerer Platznummer, ein Undo-Schritt). Cmd/Strg beim Ziehen schaltet den
    Fang aus (Illustrator-Konventionen; Entscheidungen 2026-10-10 und 2026-10-11).
  - Während eines Ziehens werden Kurzbefehle nicht ausgeführt (außer Esc zum Abbrechen).
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
- Flüssig mit mind. 500 Ständen über alle Festplätze. Abnahmekriterium (präzisiert 2026-10-11, QA-M4-03):
  500 Stände auf einer Page, viele Freiflächen und ein Hintergrundplan mit 8000 × 6000 px; Median aus
  5 Messläufen mindestens 50 Bilder/s beim Zoomen, beim Verschieben der Ansicht und beim Ziehen eines
  Stands (quer über mehrere Grundflächen, mit Freiflächen, Warnungen und Fang), in Chromium und WebKit;
  kein einzelnes Bild über 100 ms. Geprüft mit `npm run test:perf`. Zum Messen in der Desktop-App gibt es
  eine einblendbare Bildraten-Anzeige (Cmd/Strg+Alt+F, standardmäßig aus, nicht im PDF-Export).
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