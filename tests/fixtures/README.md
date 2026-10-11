# Testdateien (synthetisch, bekannte Maße)

Erzeugt mit `node scripts/make-fixtures.mjs` (Pläne) bzw. `node scripts/make-load-project.mjs` (Testprojekt). Nicht von Hand ändern, sondern das Skript anpassen.

| Datei | Inhalt | Bekannte Maße |
|---|---|---|
| `raster-10m.svg` | Raster 1000 × 800 Einheiten, `width`/`height` gesetzt | Linie alle 100 Einheiten. Rote Kreuze bei (100,100) und (600,100): 500 Einheiten Abstand. Blaues Kreuz bei (100,700): 600 Einheiten unter dem ersten. Kalibriert mit 100 Einheiten = 10 m ⇒ 0,1 m/Einheit, rote Kreuze 50 m, blaues Kreuz 60 m. |
| `raster-10m-viewbox.svg` | wie oben, nur `viewBox` (ohne `width`/`height`) | wie oben |
| `raster-10m.png` | dasselbe Raster als PNG, exakt 1000 × 800 px | wie oben, in Pixeln |
| `raster-10m.jpg` | dasselbe Raster als JPEG (Qualität 90), 1000 × 800 px | wie oben, in Pixeln |
| `plan-1zu1000.pdf` | 1 Seite A4 quer (842 × 595 pt), Raster ab 20 mm Rand | Kästchen = 10 mm Papier. Bei Planmaßstab 1:1000 ⇒ 10 m je Kästchen. |
| `plan-2seiten.pdf` | Seite 1: Deckblatt A4 hoch; Seite 2: A3 quer (1191 × 842 pt) | Seite 2: Kästchen = 20 mm Papier. Bei 1:500 ⇒ 10 m je Kästchen. |
| `last-500-staende.schelme` | Testprojekt „Lasttest 500 Stände“: 4 Festplätze (Obermarkt, Untermarkt 15°, Am Ziegelturm 340°, Schifftor) mit je 6 Grundflächen à 170 m, 5 Kategorien, ohne Hintergrund | 500 Stände (3 × 3 bis 10 × 5 m), bündig an der Vorderseite, ohne Überlappung; Lücken 0,5 m bzw. 4 m. Geprüft von `src/core/fixtures.test.ts`. |

## Bildrate in der Desktop-App prüfen (M3-23)
1. `npm run tauri dev`, dann `last-500-staende.schelme` öffnen (Cmd/Strg+O).
2. Einen Festplatz wählen, Cmd/Strg+0, dann so weit hineinzoomen, dass die Beschriftung lesbar ist
   (ab ca. 1 m = 5 px; darunter wird sie ausgeblendet, ab 1 m = 20 px bekommt sie einen hellen Rand).
3. Zoomen (Pinch/Mausrad), Ansicht verschieben (Wischen/Leertaste) und einen Stand ziehen: Das sollte
   flüssig bleiben (Ziel ≥ 50 Bilder/s).
4. Härtester Fall, alle 500 Stände auf einer Page: auf jedem Festplatz Cmd/Strg+A, Cmd/Strg+C und auf
   dem Obermarkt Cmd/Strg+V. Beim Einfügen auf einer anderen Page landen die Stände an derselben
   Position wie auf ihrer Ursprungs-Page, liegen also über denen des Obermarkts (auf derselben Page
   würde 1 m versetzt eingefügt). Denselben Fall messen die Lasttests (`npm run test:perf`) im Browser.
