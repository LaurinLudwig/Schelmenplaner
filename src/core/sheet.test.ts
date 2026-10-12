import { describe, expect, it } from 'vitest';
import { createInfra } from './infra';
import { legendEntries, legendLayout, fitText, LEGEND_COLUMN } from './legend';
import { createPage, DEFAULT_INFRA_TYPES, defaultLayers } from './model/defaults';
import type { FestplatzPage } from './model/types';
import { createArea, createStand } from './objects';
import { anchorToPaper, anchorToWorld, fitScale, mmToM, nudgeAnchor, paperSize, paperToAnchor, sheetFrame, titleBlockLayout, titleBlockMeta, worldToAnchor } from './sheet';

/** M7: Blatt, Papier-Elemente, Schriftfeld, Legende (spec.md §8). */

const page = (patch: Partial<FestplatzPage> = {}): FestplatzPage => ({ ...createPage('Obermarkt'), ...patch });

describe('Blatt', () => {
  it('Papiermaße hoch und quer', () => {
    expect(paperSize({ format: 'A4', orientation: 'portrait' })).toEqual({ w: 210, h: 297 });
    expect(paperSize({ format: 'A1', orientation: 'landscape' })).toEqual({ w: 841, h: 594 });
  });

  it('fester Maßstab: Papiermaß × n um die Mitte (A1 quer bei 1:500 = 420,5 × 297 m)', () => {
    const f = sheetFrame(page({ sheet: { format: 'A1', orientation: 'landscape', scale: 500, cx: 100, cy: 50 } }), null);
    expect(f.scale).toBe(500);
    expect(f.bounds.maxX - f.bounds.minX).toBeCloseTo(420.5);
    expect(f.bounds.maxY - f.bounds.minY).toBeCloseTo(297);
    expect((f.bounds.minX + f.bounds.maxX) / 2).toBeCloseTo(100);
    expect(f.fit).toBe(false);
  });

  it('an Seite anpassen: Inhalt mit 10 mm Rand, n auf volle 10 aufgerundet', () => {
    // A3 quer: 420 × 297 mm, nutzbar 400 × 277 mm; Inhalt 175 × 50 m → n = 437,5 → 440
    const p = page({ areas: [createArea({ cx: 87.5, cy: 25, w: 175, d: 50, rot: 0 })] });
    const f = sheetFrame(p, null);
    expect(f.scale).toBe(440);
    expect(f.fit).toBe(true);
    expect((f.bounds.minX + f.bounds.maxX) / 2).toBeCloseTo(87.5);
    expect(fitScale({ minX: 0, minY: 0, maxX: 400, maxY: 1 }, { w: 420, h: 297 })).toBe(1000); // genau 1:1000
    // ohne Inhalt: Hintergrund, sonst 100 × 100 m um den Ursprung
    expect(sheetFrame(page(), { minX: 0, minY: 0, maxX: 800, maxY: 100 }, ).scale).toBe(2000);
    expect(sheetFrame(page(), null).bounds.minX).toBeLessThan(-50);
  });
});

describe('Ecken-Anker', () => {
  const paper = { w: 420, h: 297 };
  const size = { w: 180, h: 30 };

  it('Ecke + Abstand → Lage auf dem Papier', () => {
    expect(anchorToPaper({ corner: 'br', dx: 10, dy: 10 }, size, paper)).toEqual({ x: 230, y: 257 });
    expect(anchorToPaper({ corner: 'tl', dx: 5, dy: 7 }, size, paper)).toEqual({ x: 5, y: 7 });
  });

  it('Loslassen: nächste Ecke wird Anker, 1 mm gerundet, auf dem Blatt begrenzt', () => {
    expect(paperToAnchor({ x: 230.4, y: 256.6 }, size, paper)).toEqual({ corner: 'br', dx: 10, dy: 10 });
    expect(paperToAnchor({ x: 20, y: 15 }, size, paper)).toEqual({ corner: 'tl', dx: 20, dy: 15 });
    expect(paperToAnchor({ x: 500, y: -40 }, size, paper)).toEqual({ corner: 'tr', dx: 0, dy: 0 });
  });

  it('Bei anderem Maßstab bleibt das Element an seiner Ecke und gleich groß auf dem Papier', () => {
    const base = page({ sheet: { format: 'A3', orientation: 'landscape', scale: 200, cx: 0, cy: 0 } });
    const a = { corner: 'br' as const, dx: 10, dy: 10 };
    for (const scale of [200, 500]) {
      const f = sheetFrame({ ...base, sheet: { ...base.sheet, scale } }, null);
      const tl = anchorToWorld(f, a, size);
      // rechte untere Ecke des Elements 10 mm vom Blattrand
      expect(f.bounds.maxX - (tl.x + mmToM(size.w, scale))).toBeCloseTo(mmToM(10, scale));
      expect(f.bounds.maxY - (tl.y + mmToM(size.h, scale))).toBeCloseTo(mmToM(10, scale));
      expect(worldToAnchor(f, tl, size)).toEqual(a);
    }
  });

  it('Pfeiltasten: 1 mm bzw. 10 mm auf dem Papier, an jeder Ecke in Bildschirmrichtung', () => {
    expect(nudgeAnchor({ corner: 'br', dx: 10, dy: 10 }, 1, 0, size, paper)).toEqual({ corner: 'br', dx: 9, dy: 10 });
    expect(nudgeAnchor({ corner: 'tl', dx: 10, dy: 10 }, 0, 10, size, paper)).toEqual({ corner: 'tl', dx: 10, dy: 20 });
    expect(nudgeAnchor({ corner: 'br', dx: 0, dy: 0 }, 5, 5, size, paper)).toEqual({ corner: 'br', dx: 0, dy: 0 });
  });
});

describe('Schriftfeld', () => {
  const fields = { projectName: 'Schelmenmarkt 2027', pageName: 'Obermarkt', scale: 500, sheet: { format: 'A1' as const, orientation: 'landscape' as const }, dateText: '12.10.2026', version: '3', freeText: '' };

  it('dritte Zeile: Maßstab, Format, Datum, Version; leere Angaben entfallen', () => {
    expect(titleBlockMeta(fields)).toBe('Maßstab 1:500 · A1 quer · 12.10.2026 · Version 3');
    expect(titleBlockMeta({ ...fields, dateText: ' ', version: '', scale: 1000 })).toBe('Maßstab 1:1.000 · A1 quer');
  });

  it('festes Layout 180 mm breit; Freitext bis 4 Zeilen, Höhe wächst mit', () => {
    const a = titleBlockLayout(fields);
    expect(a.w).toBe(180);
    expect(a.texts.map((t) => [t.text, t.size])).toEqual([
      ['Schelmenmarkt 2027', 5],
      ['Obermarkt', 3.5],
      ['Maßstab 1:500 · A1 quer · 12.10.2026 · Version 3', 2.5],
    ]);
    const b = titleBlockLayout({ ...fields, freeText: 'Zeile 1\nZeile 2\n' });
    expect(b.texts).toHaveLength(5);
    expect(b.h).toBeGreaterThan(a.h);
    expect(b.truncated).toBe(false);
    const c = titleBlockLayout({ ...fields, freeText: '1\n2\n3\n4\n5\n6' });
    expect(c.texts).toHaveLength(7);
    expect(c.truncated).toBe(true);
    // Höhe hängt nicht vom Maßstab ab (Papiereinheiten)
    expect(titleBlockLayout({ ...fields, scale: 200 }).h).toBe(a.h);
  });
});

describe('Legende', () => {
  const T = DEFAULT_INFRA_TYPES;
  const toilet = T.find((t) => t.id === 'toilet')!;
  const ambulance = T.find((t) => t.id === 'ambulance')!;
  const cats = [
    { id: 'c1', name: 'Imbiss', color: '#e57373' },
    { id: 'c2', name: 'Getränke', color: '#4fc3f7' },
    { id: 'c3', name: 'Kunsthandwerk', color: '#9ccc65' },
  ];
  const p = page({
    areas: [createArea({ cx: 0, cy: 0, w: 50, d: 10, rot: 0 })],
    stands: [
      createStand({ cx: 0, cy: 0, w: 3, d: 3, rot: 0 }, { categoryId: 'c2' }),
      createStand({ cx: 5, cy: 0, w: 3, d: 3, rot: 0 }, { categoryId: 'c1' }),
      createStand({ cx: 9, cy: 0, w: 3, d: 3, rot: 0 }),
      createStand({ cx: 13, cy: 0, w: 3, d: 3, rot: 0 }, { categoryId: 'c3', color: '#ffffff' }),
    ],
    infra: [createInfra(toilet, { cx: 30, cy: 0, w: 6, d: 2.5, rot: 0 }), createInfra(ambulance, { cx: 40, cy: 0, w: 8, d: 3.5, rot: 0 }), createInfra(toilet, { cx: 50, cy: 0, w: 6, d: 2.5, rot: 0 })],
  });

  it('nur was vorkommt, in fester Reihenfolge; Stände mit eigener Farbe zählen nicht', () => {
    const e = legendEntries(p, { categories: cats, infraTypes: T }, defaultLayers(), true);
    expect(e.map((x) => x.label)).toEqual(['Grundfläche', 'Freifläche', 'Imbiss', 'Getränke', 'Geschäft ohne Kategorie', 'RTW-Platz', 'Toilette']);
    expect(legendEntries(p, { categories: cats, infraTypes: T }, defaultLayers(), false).map((x) => x.key)).not.toContain('free');
  });

  it('ausgeblendete Ebenen fehlen', () => {
    const layers = defaultLayers();
    layers.infra.visible = false;
    layers.stands.visible = false;
    expect(legendEntries(p, { categories: cats, infraTypes: T }, layers, true).map((x) => x.kind)).toEqual(['area', 'free']);
    expect(legendEntries(page(), { categories: cats, infraTypes: T }, defaultLayers(), true)).toEqual([]);
  });

  it('Spaltenumbruch bei zu wenig Blatthöhe, lange Namen gekürzt', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ key: `k${i}`, kind: 'category' as const, label: `Kategorie ${i}`, color: '#000000' }));
    const tall = legendLayout(many, 841);
    expect(tall.w).toBe(LEGEND_COLUMN);
    const low = legendLayout(many, 210);
    expect(low.w).toBeGreaterThan(LEGEND_COLUMN);
    expect(low.h).toBeLessThanOrEqual(210 - 20);
    expect(new Set(low.rows.map((r) => r.x)).size).toBe(low.w / LEGEND_COLUMN);
    expect(fitText('Ein sehr langer Kategoriename, der nicht passt', 2.5, 45)).toMatch(/…$/);
    expect(fitText('Imbiss', 2.5, 45)).toBe('Imbiss');
  });
});
