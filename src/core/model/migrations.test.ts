import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { decodeProjectFile, encodeProjectFile } from '../fileFormat';
import { CURRENT_SCHEMA_VERSION, migrate, MIGRATIONS } from './migrations';
import { parseProjectFile, ProjectFileError } from './schema';

/**
 * Versionierung des Dateiformats. Regel (CLAUDE.md): Jede Änderung am Dateiformat erhöht die Version
 * und bringt eine Migration mit Test mit.
 */

describe('Formatversionen', () => {
  it('es gibt für jeden Versionssprung bis zur aktuellen Version eine Migration', () => {
    for (let v = 1; v < CURRENT_SCHEMA_VERSION; v++) expect(MIGRATIONS[v], `Migration ${v} → ${v + 1}`).toBeTypeOf('function');
  });

  it('neuere Versionen werden mit deutscher Meldung abgewiesen, nicht still geladen', () => {
    expect(() => parseProjectFile({ format: 'schelmeplaner', schemaVersion: CURRENT_SCHEMA_VERSION + 1, project: { id: 'x', pages: [] } })).toThrow(ProjectFileError);
    expect(() => parseProjectFile({ format: 'schelmeplaner', schemaVersion: CURRENT_SCHEMA_VERSION + 1, project: { id: 'x', pages: [] } })).toThrow(
      /neueren Version von Schelmeplaner/,
    );
  });

  it('Speichern schreibt die aktuelle Version', () => {
    const { project } = decodeProjectFile(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'format-v1-m3.schelme')));
    const json = JSON.parse(strFromU8(unzipSync(encodeProjectFile({ project, assets: {} }))['project.json']!));
    expect(json.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('Migration 1 → 2 (M4: Warnungen)', () => {
  it('ergänzt suppressOverlapWarning und warnOverlap, ändert die Eingabe nicht und überschreibt keine vorhandenen Werte', () => {
    const v1 = {
      id: 'p',
      settings: { warnOutside: false },
      pages: [{ id: 'a', stands: [{ id: 's1', suppressOutsideWarning: true }, { id: 's2', suppressOverlapWarning: true }] }],
    };
    const before = structuredClone(v1);
    const v2 = MIGRATIONS[1]!(v1) as any;
    expect(v1).toEqual(before);
    expect(v2.settings).toEqual({ warnOutside: false, warnOverlap: true });
    expect(v2.pages[0].stands).toEqual([
      { id: 's1', suppressOutsideWarning: true, suppressOverlapWarning: false },
      { id: 's2', suppressOverlapWarning: true },
    ]);
    // kaputte Strukturen bleiben für die Prüfung in schema.ts unverändert
    expect((MIGRATIONS[1]!({ id: 'x', pages: 'kaputt' }) as any).pages).toBe('kaputt');
    expect(migrate(null, 1)).toBeNull();
  });

  it('echte Datei aus M3 (Version 1, tests/fixtures/format-v1-m3.schelme) wird vollständig migriert', () => {
    const bytes = new Uint8Array(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'format-v1-m3.schelme')));
    const raw = JSON.parse(strFromU8(unzipSync(bytes)['project.json']!));
    expect(raw.schemaVersion).toBe(1);
    expect(raw.project.pages[0].stands[0]).not.toHaveProperty('suppressOverlapWarning');
    expect(raw.project.settings).not.toHaveProperty('warnOverlap');

    const { project } = decodeProjectFile(bytes);
    expect(project.settings.warnOverlap).toBe(true);
    expect(project.settings.warnOutside).toBe(raw.project.settings.warnOutside);
    expect(project.categories).toEqual(raw.project.categories);
    expect(project.pages).toHaveLength(4);
    expect(project.pages.reduce((n, p) => n + p.stands.length, 0)).toBe(500);
    project.pages.forEach((p, i) => {
      expect(p.name).toBe(raw.project.pages[i].name);
      expect(p.areas).toEqual(raw.project.pages[i].areas);
      // alle bisherigen Felder unverändert, die neuen Felder (M4, M5) ergänzt
      expect(p.stands).toEqual(raw.project.pages[i].stands.map((s: object) => ({ ...s, suppressOverlapWarning: false, suppressDuplicateWarning: false, suppressInfraWarning: false })));
    });
  });
});

describe('Migration 2 → 3 (M5: Nummerierung)', () => {
  it('ergänzt Stellenzahl, warnDuplicateNr und suppressDuplicateWarning, ohne vorhandene Werte zu überschreiben', () => {
    const v2 = {
      id: 'p',
      settings: { numbering: { scope: 'global', start: 100 }, warnOverlap: false },
      pages: [{ id: 'a', stands: [{ id: 's1', nr: '7' }, { id: 's2', suppressDuplicateWarning: true }] }],
    };
    const before = structuredClone(v2);
    const v3 = MIGRATIONS[2]!(v2) as any;
    expect(v2).toEqual(before);
    expect(v3.settings).toEqual({ numbering: { scope: 'global', start: 100, digits: 1 }, warnOverlap: false, warnDuplicateNr: true });
    expect(v3.pages[0].stands).toEqual([
      { id: 's1', nr: '7', suppressDuplicateWarning: false },
      { id: 's2', suppressDuplicateWarning: true },
    ]);
    expect((MIGRATIONS[2]!({ id: 'x', settings: 'kaputt', pages: 'kaputt' }) as any).settings).toBe('kaputt');
  });

  it('echte Datei aus M4 (Version 2, tests/fixtures/format-v2-m4.schelme) wird vollständig migriert', () => {
    const bytes = new Uint8Array(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'format-v2-m4.schelme')));
    const raw = JSON.parse(strFromU8(unzipSync(bytes)['project.json']!));
    expect(raw.schemaVersion).toBe(2);
    expect(raw.project.settings.numbering).not.toHaveProperty('digits');
    expect(raw.project.settings).not.toHaveProperty('warnDuplicateNr');
    expect(raw.project.pages[0].stands[0]).not.toHaveProperty('suppressDuplicateWarning');

    const { project } = decodeProjectFile(bytes);
    expect(project.settings.numbering).toEqual({ ...raw.project.settings.numbering, digits: 1 });
    expect(project.settings.warnDuplicateNr).toBe(true);
    expect(project.settings.warnOverlap).toBe(raw.project.settings.warnOverlap ?? true);
    expect(project.categories).toEqual(raw.project.categories);
    expect(project.pages.reduce((n, p) => n + p.stands.length, 0)).toBe(500);
    project.pages.forEach((p, i) => {
      const rp = raw.project.pages[i];
      expect(p.name).toBe(rp.name);
      expect(p.prefix).toBe(rp.prefix);
      expect(p.numberingMode).toBe(rp.numberingMode);
      expect(p.powerLimitKw).toBe(rp.powerLimitKw);
      expect(p.areas).toEqual(rp.areas);
      expect(p.stands).toEqual(rp.stands.map((s: object) => ({ ...s, suppressDuplicateWarning: false, suppressInfraWarning: false })));
    });
  });
});

describe('Migration 3 → 4 (M7: Infrastruktur, Blatt, Schriftfeld, Legende)', () => {
  it('ergänzt Warnungen und Felder, benennt Infrastruktur-Felder um, entfernt alte Typen und titleBlockPos', () => {
    const v3 = {
      id: 'p',
      settings: { warnOverlap: false, minPassageWidth: 4 },
      infraTypes: [{ type: 'toilet', label: 'Toilette', color: '#3a86c8', icon: 'wc', occupiesArea: true }],
      pages: [
        {
          id: 'a',
          titleBlockPos: { x: 3, y: 4 },
          stands: [{ id: 's1' }, { id: 's2', suppressInfraWarning: true }],
          infra: [{ id: 'i1', type: 'marker', text: 'Treffpunkt', cx: 1, cy: 2, w: 0, d: 0, rot: 0 }],
        },
      ],
    };
    const before = structuredClone(v3);
    const v4 = MIGRATIONS[3]!(v3) as any;
    expect(v3).toEqual(before);
    expect(v4).not.toHaveProperty('infraTypes');
    expect(v4.settings).toEqual({ warnOverlap: false, warnInfra: true, warnPassageWidth: true, minPassageWidth: 4 });
    expect(v4.pages[0]).not.toHaveProperty('titleBlockPos');
    expect(v4.pages[0].stands).toEqual([
      { id: 's1', suppressInfraWarning: false },
      { id: 's2', suppressInfraWarning: true },
    ]);
    expect(v4.pages[0].infra).toEqual([{ id: 'i1', typeId: 'marker', label: 'Treffpunkt', cx: 1, cy: 2, w: 0, d: 0, rot: 0 }]);
    expect((MIGRATIONS[3]!({ id: 'x', settings: 'kaputt', pages: 'kaputt' }) as any).pages).toBe('kaputt');

    // Laden ergänzt Standards: feste Typen, Blatt, Anker; das migrierte Objekt bleibt erhalten
    const project = parseProjectFile({ format: 'schelmeplaner', schemaVersion: 3, project: v3 });
    expect(project.infraTypes.map((t) => t.id)).toEqual(['barrierMobile', 'barrierFixed', 'medical', 'ambulance', 'toilet', 'waste', 'narrowPassage', 'marker']);
    expect(project.pages[0]!.infra).toEqual([
      { id: 'i1', typeId: 'marker', label: 'Treffpunkt', note: '', powerKw: 0, connection: null, suppressWidthWarning: false, cx: 1, cy: 2, w: 0, d: 0, rot: 0 },
    ]);
    expect(project.pages[0]!.sheet).toEqual({ format: 'A3', orientation: 'landscape', scale: null, cx: 0, cy: 0 });
    expect(project.pages[0]!.titleBlock).toEqual({ visible: true, corner: 'br', dx: 10, dy: 10 });
    expect(project.pages[0]!.legend).toEqual({ visible: true, corner: 'bl', dx: 10, dy: 10 });
    expect(project.pages[0]!.layers.sheet).toEqual({ visible: true, locked: false });
  });

  it('echte Datei aus M6 (Version 3, tests/fixtures/format-v3-m6.schelme) wird vollständig migriert', () => {
    const bytes = new Uint8Array(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'format-v3-m6.schelme')));
    const raw = JSON.parse(strFromU8(unzipSync(bytes)['project.json']!));
    expect(raw.schemaVersion).toBe(3);
    expect(raw.project.settings).not.toHaveProperty('warnInfra');
    expect(raw.project.pages[0]).toHaveProperty('titleBlockPos');
    expect(raw.project.infraTypes[0]).toHaveProperty('type');

    const { project } = decodeProjectFile(bytes);
    const { warnInfra, warnPassageWidth, minPassageWidth, ...settings } = project.settings;
    expect(settings).toEqual(raw.project.settings);
    expect([warnInfra, warnPassageWidth, minPassageWidth]).toEqual([true, true, 3.5]);
    expect(project.categories).toEqual(raw.project.categories);
    expect(project.titleBlock).toEqual(raw.project.titleBlock);
    expect(project.infraTypes.every((t) => t.builtin)).toBe(true);
    expect(project.pages.reduce((n, p) => n + p.stands.length, 0)).toBe(500);
    project.pages.forEach((p, i) => {
      const rp = raw.project.pages[i];
      const { infra, sheet, titleBlock, legend, layers, stands, ...rest } = p;
      const { titleBlockPos: _pos, layers: rawLayers, stands: rawStands, infra: rawInfra, ...rawRest } = rp;
      expect(rest).toEqual(rawRest);
      expect(layers).toEqual({ ...rawLayers, sheet: { visible: true, locked: false } });
      expect(stands).toEqual(rawStands.map((s: object) => ({ ...s, suppressInfraWarning: false })));
      expect(infra).toEqual(rawInfra);
      expect(sheet.scale).toBeNull();
      expect([titleBlock.corner, legend.corner]).toEqual(['br', 'bl']);
    });
    // Werte, die in der Datei gezielt gesetzt waren
    expect(project.pages[0]!.powerLimitKw).toBe(100);
    expect(project.pages[0]!.stands[0]!.nr).toBe('A-07');
    expect(project.pages[1]!.clockwise).toEqual({ center: { x: 50, y: 40 }, startAngle: 90 });
  });
});
