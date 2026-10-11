import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { canvasBox, openApp } from './helpers';

/**
 * M4-21 Lasttest (Abnahmekriterium, spec.md NFA): 500 Stände mit Freiflächen, Warnungen und allen
 * Fang-Optionen. Mindestens 50 Bilder/s beim Zoomen, beim Verschieben der Ansicht und beim Ziehen
 * eines Stands quer über mehrere Grundflächen (er betritt und verlässt in fast jedem Frame eine
 * Grundfläche, deren Freiflächen dann neu berechnet werden).
 *
 * Gemessen wie in m3-perf.spec.ts: in jedem Animation-Frame ein Eingabeereignis.
 */

const FRAMES = 150;
const MIN_FPS = 50;

/**
 * 10 Grundflächen 200 × 5 m (Abstand 6,6 m), je 50 Stände 3 × 3 m bündig an der Vorderseite mit 1 m
 * Lücke: rund 500 Freiflächen. Jeder zehnte Stand ist um 1,5 m verschoben (Überlappung), jeder
 * siebte ragt nach vorn heraus (außerhalb).
 */
async function seed(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__schelmeStore.getState();
    s.change('Lasttest', (p: any) => {
      const pg = p.pages[0];
      let n = 1;
      for (let row = 0; row < 10; row++) {
        const y = row * 6.6 - 30;
        pg.areas.push({ id: `a${row}`, name: `Reihe ${row + 1}`, cx: 0, cy: y, w: 200, d: 5, rot: 0 });
        for (let i = 0; i < 50; i++) {
          const shift = i % 10 === 9 ? -1.5 : 0;
          pg.stands.push({
            id: `s${n}`,
            nr: String(n),
            nrLocked: false,
            name: `Geschäft Nummer ${n}`,
            owner: 'Muster',
            ware: 'Ware',
            powerKw: 3,
            connection: 'CEE16',
            note: '',
            categoryId: null,
            color: i % 3 === 0 ? '#e57373' : null,
            suppressOutsideWarning: false,
            suppressOverlapWarning: false,
            cx: -98 + i * 4 + shift,
            cy: y + 1 + (i % 7 === 3 ? 1 : 0),
            w: 3,
            d: 3,
            rot: 0,
          });
          n++;
        }
      }
      p.settings.snap = { front: true, grid: true, neighbors: true };
    });
    const { w, h } = s.ui.viewport;
    s.setView(s.project.pages[0].id, { scale: 5.5, tx: w / 2, ty: h / 2 });
  });
  await expect(page.locator('.stand-label')).toHaveCount(500);
  expect(await page.locator('.free-space').count()).toBeGreaterThan(400);
  expect(await page.locator('.stand[data-warning="overlap"]').count()).toBeGreaterThan(0);
  expect(await page.locator('.stand[data-warning="outside"]').count()).toBeGreaterThan(0);
}

interface Result {
  fps: number;
  maxFrameMs: number;
}

function measure(page: Page, kind: 'zoom' | 'pan' | 'drag', at: { x: number; y: number }): Promise<Result> {
  return page.evaluate(
    ({ mode, pos, frames }) =>
      new Promise<Result>((resolve) => {
        const svg = document.querySelector('svg.canvas')!;
        const times: number[] = [];
        let i = 0;
        const step = (t: number) => {
          times.push(t);
          if (i >= frames) {
            const gaps = times.slice(1).map((v, k) => v - times[k]!);
            resolve({ fps: ((times.length - 1) / (times.at(-1)! - times[0]!)) * 1000, maxFrameMs: Math.max(...gaps) });
            return;
          }
          if (mode === 'zoom') {
            const dy = (Math.floor(i / 15) % 2 ? 1 : -1) * 4;
            svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: pos.x, clientY: pos.y, deltaY: dy, ctrlKey: true }));
          } else if (mode === 'pan') {
            const dx = (Math.floor(i / 30) % 2 ? 1 : -1) * 6;
            svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: pos.x, clientY: pos.y, deltaX: dx, deltaY: 1 }));
          } else {
            // senkrecht quer über die Reihen (6,6 m = 36 px bei 5,5 px/m) und etwas seitlich
            const off = (i % 60 < 30 ? i % 30 : 30 - (i % 30)) * 7;
            svg.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: pos.x + off / 3, clientY: pos.y - off, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 1 }));
          }
          i++;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { mode: kind, pos: at, frames: FRAMES },
  );
}

test.describe('M4-21: Lasttest 500 Stände mit Freiflächen, Warnungen und Fang', () => {
  test('Zoomen, Verschieben der Ansicht und Ziehen über Grundflächen mit mindestens 50 Bildern/s', async ({ page }, info) => {
    test.setTimeout(60_000);
    await openApp(page);
    await seed(page);
    const box = await canvasBox(page);
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const reset = () =>
      page.evaluate(() => {
        const s = (window as any).__schelmeStore.getState();
        s.setView(s.project.pages[0].id, { scale: 5.5, tx: s.ui.viewport.w / 2, ty: s.ui.viewport.h / 2 });
      });

    const zoom = await measure(page, 'zoom', center);
    await reset();
    const pan = await measure(page, 'pan', center);
    // Lesegröße: Freiflächen-Beschriftung (ab 6 px) und heller Rand (ab 12 px) sichtbar
    await page.evaluate(() => {
      const s = (window as any).__schelmeStore.getState();
      s.setView(s.project.pages[0].id, { scale: 20, tx: s.ui.viewport.w / 2, ty: s.ui.viewport.h / 2 });
    });
    await expect(page.locator('.layer-labels.halo')).toHaveCount(1);
    // nur die Beschriftungen im (gerundeten) sichtbaren Bereich sind im DOM
    expect(await page.locator('.free-label').count()).toBeGreaterThan(20);
    const panReadable = await measure(page, 'pan', center);
    await reset();
    await expect(page.locator('.free-label')).toHaveCount(0);

    // Stand s412 (Reihe 9) greifen und nach oben über die Reihen ziehen
    const target = await page.evaluate(() => {
      const s = (window as any).__schelmeStore.getState();
      const st = s.project.pages[0].stands.find((x: any) => x.id === 's412');
      const v = s.views[s.project.pages[0].id];
      return { x: v.tx + st.cx * v.scale, y: v.ty + st.cy * v.scale };
    });
    const grab = { x: box.x + target.x, y: box.y + target.y };
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 5, grab.y - 5, { steps: 3 });
    const dragRes = await measure(page, 'drag', grab);
    const moved = await page.evaluate(() => !!(window as any).__schelmeStore.getState().preview);
    await page.mouse.up();
    expect(moved).toBe(true);

    const result = { browser: info.project.name, zoom, pan, panReadable, drag: dragRes };
    mkdirSync('test-artifacts/logs', { recursive: true });
    writeFileSync(`test-artifacts/logs/m4-perf-${info.project.name}.json`, JSON.stringify(result, null, 2));
    console.warn(`Lasttest M4 ${info.project.name}: ${JSON.stringify(result)}`);
    expect(zoom.fps).toBeGreaterThanOrEqual(MIN_FPS);
    expect(pan.fps).toBeGreaterThanOrEqual(MIN_FPS);
    expect(panReadable.fps).toBeGreaterThanOrEqual(MIN_FPS);
    expect(dragRes.fps).toBeGreaterThanOrEqual(MIN_FPS);
  });
});
