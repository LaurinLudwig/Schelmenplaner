# Archiv: erledigte Eingang-Einträge

Aus `BACKLOG.md` verschoben am 2026-10-11. Die Einträge verweisen auf den Meilenstein bzw. Befund, in dem sie erledigt wurden.

- ~~E-01 Trackpad-Verhalten~~ → entschieden und umgesetzt als M1-24.
- ~~E-13 Zwei Sperren~~ → erledigt mit M3-14 (eine Sperre `background.locked`). Ursprünglich: Zwei Sperren für den Hintergrund: `background.locked` (M2) und die Ebenen-Sperre `layers.background.locked` (M3-14). In M3 zu einer zusammenführen.
- ~~E-09 Einstellung „Wischrichtung umkehren“~~ → umgesetzt mit QA-M1-07 (Menü).
- ~~E-20 Shift/Alt beim Ziehen~~ → M4-11/M4-12 (Entscheidung Laurin 2026-10-10).
- ~~E-29 WebKit-Bildrate mit wenig Puffer~~ → behoben mit QA-M4-03 (zwischengespeicherte Ebenen, WebKit jetzt 55–60 Bilder/s im Abnahmetest). Bei weiteren Ebenen (Infrastruktur, Schriftfeld) erneut messen.
- ~~E-25 „Festplatz duplizieren“ übernimmt die Platznummern~~ → M5-10 (Warnung „doppelte Nummer“ je Nummernkreis).
- ~~E-39 WebKit-Test „M1-16: Mittlere Maustaste“ wackelt unter Last~~ → M6-12 (2026-10-12): Der Test wartet, bis die Zeichenfläche den Zeiger bekommt (`pointerOnCanvas`), und pollt das Ergebnis. Ursache nicht reproduzierbar, siehe Nachtrag im Abschluss M6 (`docs/archiv/M6.md`).
