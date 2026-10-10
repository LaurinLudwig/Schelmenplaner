import { describe, expect, it } from 'vitest';
import { decodeProjectFile, encodeProjectFile } from './fileFormat';

import { boundsOfRects, rectCorners } from './geometry/rect';
import { createProject } from './model/defaults';
import { fitBounds, screenToWorld, worldToScreen, zoomAt } from './viewport';

describe('Dateiformat', () => {
  it('Roundtrip: Projekt und Assets kommen identisch zurück', () => {
    const project = createProject('Test');
    const assets = { 'bg1.pdf': new Uint8Array([1, 2, 3, 250]) };
    const back = decodeProjectFile(encodeProjectFile({ project, assets }));
    expect(back.project).toEqual(project);
    expect(Array.from(back.assets['bg1.pdf']!)).toEqual([1, 2, 3, 250]);
  });

  it('meldet beschädigte Dateien verständlich', () => {
    expect(() => decodeProjectFile(new Uint8Array([1, 2, 3]))).toThrow(/beschädigt/);
  });
});

describe('Viewport', () => {
  it('zoomAt hält den Punkt unter dem Mauszeiger fest', () => {
    const v = { scale: 10, tx: 100, ty: 50 };
    const at = { x: 300, y: 200 };
    const before = screenToWorld(v, at);
    const z = zoomAt(v, 2.5, at);
    expect(z.scale).toBe(25);
    const after = worldToScreen(z, before);
    expect(after.x).toBeCloseTo(at.x);
    expect(after.y).toBeCloseTo(at.y);
  });

  it('fitBounds zentriert und skaliert den Inhalt', () => {
    const v = fitBounds({ minX: 0, minY: 0, maxX: 50, maxY: 10 }, 600, 400, 50);
    expect(v.scale).toBe(10);
    expect(worldToScreen(v, { x: 25, y: 5 })).toEqual({ x: 300, y: 200 });
  });
});

describe('Rechteck', () => {
  it('rectCorners eines um 90° gedrehten Rechtecks', () => {
    const c = rectCorners({ cx: 0, cy: 0, w: 4, d: 2, rot: 90 });
    expect(c[0]!.x).toBeCloseTo(1);
    expect(c[0]!.y).toBeCloseTo(-2);
    expect(boundsOfRects([{ cx: 0, cy: 0, w: 4, d: 2, rot: 90 }])!.maxY).toBeCloseTo(2);
  });
});

