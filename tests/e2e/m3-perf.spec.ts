import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { canvasBox, openApp } from './helpers';

/**
 * M3-23 Lasttest (Abnahmekriterium): 500 Stände mit Beschriftung auf einer Page, mindestens
 * 50 Bilder/s beim Zoomen, beim Verschieben der Ansicht und beim Ziehen eines Stands.
 *
 * Gemessen wird im Browser: In jedem Animation-Frame wird ein Eingabeereignis ausgelöst (Rad bzw.
 * Zeigerbewegung), die Zeitstempel der Frames ergeben die Bildrate. Jedes Bild hat also Arbeit.
 */

const FRAMES = 150;
const MIN_FPS = 50;

/** 10 Grundflächen mit je 50 Ständen (3 × 3 m, Name und Nummer), zusammen 200 × 66 m. */
async function seed500(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__schelmeStore.getState();
    s.change('Lasttest', (p: any) => {
      const pg = p.pages[0];
      let n = 1;
      for (let row = 0; row < 10; row++) {
        const y = row * 6.6 - 30;
        pg.areas.push({ id: `a${row}`, name: `Reihe ${row + 1}`, cx: 0, cy: y, w: 200, d: 3.5, rot: 0 });
        for (let i = 0; i < 50; i++) {
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
            cx: -98 + i * 4,
            cy: y,
            w: 3,
            d: 3,
            rot: (i * 7) % 360,
          });
          n++;
        }
      }
    });
    const { w, h } = s.ui.viewport;
    // 5,5 px/m: alle Stände im Bild, Beschriftung (0,6 m ≈ 3,3 px) ist sichtbar
    s.setView(p0(s), { scale: 5.5, tx: w / 2, ty: h / 2 });
    function p0(st: any) {
      return st.project.pages[0].id;
    }
  });
  await expect(page.locator('.stand-label')).toHaveCount(500);
  await expect(page.locator('.layer-labels.tiny')).toHaveCount(0);
}

interface Result {
  fps: number;
  maxFrameMs: number;
}

/** Löst in FRAMES aufeinanderfolgenden Frames je ein Ereignis aus (`kind`) und misst die Bildrate. */
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
            // Pinch (Strg+Rad): abwechselnd hinein und heraus
            const dy = (Math.floor(i / 15) % 2 ? 1 : -1) * 4;
            svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: pos.x, clientY: pos.y, deltaY: dy, ctrlKey: true }));
          } else if (mode === 'pan') {
            // Zwei-Finger-Wischen
            const dx = (Math.floor(i / 30) % 2 ? 1 : -1) * 6;
            svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: pos.x, clientY: pos.y, deltaX: dx, deltaY: 1 }));
          } else {
            const off = (i % 60 < 30 ? i % 30 : 30 - (i % 30)) * 4;
            svg.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: pos.x + off, clientY: pos.y + off / 2, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 1 }));
          }
          i++;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { mode: kind, pos: at, frames: FRAMES },
  );
}

test.describe('M3-23: Lasttest 500 Stände', () => {
  test('Zoomen, Verschieben der Ansicht und Ziehen eines Stands mit mindestens 50 Bildern/s', async ({ page }, info) => {
    test.setTimeout(60_000);
    await openApp(page);
    await seed500(page);
    const box = await canvasBox(page);
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    const zoom = await measure(page, 'zoom', center);
    await page.evaluate(() => {
      const s = (window as any).__schelmeStore.getState();
      s.setView(s.project.pages[0].id, { scale: 5.5, tx: s.ui.viewport.w / 2, ty: s.ui.viewport.h / 2 });
    });
    const pan = await measure(page, 'pan', center);
    // Lesegröße (Schrift ≥ 12 px, mit hellem Rand um die Beschriftung): ein Ausschnitt mit ca. 130 Ständen
    await page.evaluate(() => {
      const s = (window as any).__schelmeStore.getState();
      s.setView(s.project.pages[0].id, { scale: 20, tx: s.ui.viewport.w / 2, ty: s.ui.viewport.h / 2 });
    });
    await expect(page.locator('.layer-labels.halo')).toHaveCount(1);
    const panReadable = await measure(page, 'pan', center);
    await page.evaluate(() => {
      const s = (window as any).__schelmeStore.getState();
      s.setView(s.project.pages[0].id, { scale: 5.5, tx: s.ui.viewport.w / 2, ty: s.ui.viewport.h / 2 });
    });

    // Stand s225 (Reihe 5, Mitte) mit der echten Maus greifen, dann pro Frame bewegen
    const target = await page.evaluate(() => {
      const s = (window as any).__schelmeStore.getState();
      const st = s.project.pages[0].stands.find((x: any) => x.id === 's225');
      const v = s.views[s.project.pages[0].id];
      return { x: v.tx + st.cx * v.scale, y: v.ty + st.cy * v.scale };
    });
    const grab = { x: box.x + target.x, y: box.y + target.y };
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 5, grab.y + 5, { steps: 3 });
    const dragRes = await measure(page, 'drag', grab);
    const moved = await page.evaluate(() => !!(window as any).__schelmeStore.getState().preview);
    await page.mouse.up();
    expect(moved).toBe(true);
    const past = await page.evaluate(() => (window as any).__schelmeStore.getState().history.past.length);
    expect(past).toBe(2); // Lasttest-Daten + genau ein Schritt für das Ziehen

    const result = { browser: info.project.name, zoom, pan, panReadable, drag: dragRes };
    mkdirSync('test-artifacts/logs', { recursive: true });
    writeFileSync(`test-artifacts/logs/m3-perf-${info.project.name}.json`, JSON.stringify(result, null, 2));
    console.warn(`Lasttest ${info.project.name}: ${JSON.stringify(result)}`);
    expect(zoom.fps).toBeGreaterThanOrEqual(MIN_FPS);
    expect(pan.fps).toBeGreaterThanOrEqual(MIN_FPS);
    expect(panReadable.fps).toBeGreaterThanOrEqual(MIN_FPS);
    expect(dragRes.fps).toBeGreaterThanOrEqual(MIN_FPS);
  });
});
