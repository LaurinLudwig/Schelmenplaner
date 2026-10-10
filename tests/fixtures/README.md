# Testdateien (synthetisch, bekannte Maße)

Erzeugt mit `node scripts/make-fixtures.mjs`. Nicht von Hand ändern, sondern das Skript anpassen.

| Datei | Inhalt | Bekannte Maße |
|---|---|---|
| `raster-10m.svg` | Raster 1000 × 800 Einheiten, `width`/`height` gesetzt | Linie alle 100 Einheiten. Rote Kreuze bei (100,100) und (600,100): 500 Einheiten Abstand. Blaues Kreuz bei (100,700): 600 Einheiten unter dem ersten. Kalibriert mit 100 Einheiten = 10 m ⇒ 0,1 m/Einheit, rote Kreuze 50 m, blaues Kreuz 60 m. |
| `raster-10m-viewbox.svg` | wie oben, nur `viewBox` (ohne `width`/`height`) | wie oben |
| `raster-10m.png` | dasselbe Raster als PNG, exakt 1000 × 800 px | wie oben, in Pixeln |
| `raster-10m.jpg` | dasselbe Raster als JPEG (Qualität 90), 1000 × 800 px | wie oben, in Pixeln |
| `plan-1zu1000.pdf` | 1 Seite A4 quer (842 × 595 pt), Raster ab 20 mm Rand | Kästchen = 10 mm Papier. Bei Planmaßstab 1:1000 ⇒ 10 m je Kästchen. |
| `plan-2seiten.pdf` | Seite 1: Deckblatt A4 hoch; Seite 2: A3 quer (1191 × 842 pt) | Seite 2: Kästchen = 20 mm Papier. Bei 1:500 ⇒ 10 m je Kästchen. |
