import { expect, test, type Page } from '@playwright/test';
import { collectErrors, MOD, openApp } from './helpers';

/**
 * M7: Blatt, Schriftfeld, Legende (spec.md §8), Start-Page (§7) und Dateiformat Version 4 (§10).
 */

type P = { x: number; y: number };
const store = (page: Page, fn: string) => page.evaluate(`(() => { const s = window.__schelmeStore.getState(); return ${fn}; })()`);
const activePg = (page: Page) => store(page, 's.project.pages.find((p) => p.id === s.ui.activePage)') as Promise<any>;

/** Mitte eines SVG-Elements auf dem Bildschirm. */
async function centerOf(page: Page, testId: string): Promise<P> {
  const b = (await page.getByTestId(testId).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

const BASE = { nr: '', nrLocked: false, name: '', owner: '', ware: '', powerKw: 0, connection: null, note: '', categoryId: null, color: null, suppressOutsideWarning: false, suppressOverlapWarning: false, suppressDuplicateWarning: false, suppressInfraWarning: false };
const IBASE = { label: '', note: '', powerKw: 0, connection: null, suppressWidthWarning: false, rot: 0 };
async function seed(page: Page, objs: { areas?: any[]; stands?: any[]; infra?: any[]; categories?: any[] }) {
  await page.evaluate(
    ({ o, base, ibase }) => {
      const s = (window as any).__schelmeStore.getState();
      s.change('Testdaten', (p: any) => {
        const pg = p.pages.find((x: any) => x.id === s.ui.activePage);
        p.categories.push(...(o.categories ?? []));
        for (const a of o.areas ?? []) pg.areas.push({ name: '', rot: 0, ...a });
        for (const st of o.stands ?? []) pg.stands.push({ ...base, rot: 0, ...st });
        for (const i of o.infra ?? []) pg.infra.push({ ...ibase, ...i });
      });
    },
    { o: objs, base: BASE, ibase: IBASE },
  );
}
const fitView = (page: Page) => page.keyboard.press(`${MOD}+0`);

test.describe('M7: Blatt und Papier-Elemente', () => {
  test('Standard: A3 quer, an Seite anpassen; Rahmen, Schriftfeld und Legende sind sichtbar', async ({ page }) => {
    const errors = collectErrors(page);
    await openApp(page);
    await seed(page, { areas: [{ id: 'G', cx: 87.5, cy: 25, w: 175, d: 50 }] });
    await expect(page.getByTestId('sheet-frame')).toBeVisible();
    await expect(page.getByTestId('sheet-label')).toHaveText('A3 quer · 1:440 (angepasst)');
    await expect(page.getByTestId('title-block')).toContainText('Festplatz 1');
    await expect(page.getByTestId('title-block')).toContainText('Maßstab 1:440 · A3 quer');
    await expect(page.getByTestId('legend')).toContainText('Grundfläche');
    await expect(page.getByTestId('legend')).toContainText('Freifläche');
    expect(errors).toEqual([]);
  });

  test('Fester Maßstab 1:200 und 1:500: Schriftfeld bleibt an seiner Ecke und auf dem Papier gleich groß', async ({ page }) => {
    await openApp(page);
    await seed(page, { stands: [{ id: 's', cx: 0, cy: 0, w: 3, d: 3 }] });
    const field = page.locator('#sheet-scale-input');
    await field.fill('200');
    await field.press('Enter');
    const pg = await activePg(page);
    expect(pg.sheet).toMatchObject({ scale: 200, format: 'A3', orientation: 'landscape' });
    await expect(page.getByTestId('sheet-label')).toHaveText('A3 quer · 1:200');
    const w200 = await page.getByTestId('title-block').evaluate((e) => (e as SVGGraphicsElement).getBBox().width);
    await field.fill('500');
    await field.press('Enter');
    await expect(page.getByTestId('sheet-label')).toHaveText('A3 quer · 1:500');
    expect((await activePg(page)).titleBlock).toEqual({ visible: true, corner: 'br', dx: 10, dy: 10 });
    // innen in mm gezeichnet: gleiche Breite im eigenen Koordinatensystem
    const w500 = await page.getByTestId('title-block').evaluate((e) => (e as SVGGraphicsElement).getBBox().width);
    expect(w500).toBeCloseTo(w200, 3);
    await expect(page.getByTestId('title-block')).toContainText('Maßstab 1:500');
    await page.keyboard.press(`${MOD}+z`);
    expect((await activePg(page)).sheet.scale).toBe(200);
  });

  test('Schriftfeld ziehen: nächste Ecke wird Anker; Pfeiltasten 1 mm; Entf blendet aus, Undo zeigt es wieder', async ({ page }) => {
    await openApp(page);
    // Inhalt so groß, dass das angepasste Blatt nach Cmd/Strg+0 ganz im Fenster liegt
    await seed(page, { areas: [{ id: 'G', cx: 0, cy: 0, w: 100, d: 60 }] });
    await fitView(page);
    const tb = await centerOf(page, 'title-block');
    const frame = (await page.getByTestId('sheet-frame').boundingBox())!;
    await page.mouse.move(tb.x, tb.y);
    await page.mouse.down();
    await page.mouse.move(frame.x + 40, frame.y + 30, { steps: 12 });
    await page.mouse.up();
    let a = (await activePg(page)).titleBlock;
    expect(a.corner).toBe('tl');
    expect(await store(page, 's.ui.selection')).toEqual({ kind: 'paper', element: 'titleBlock' });
    await page.keyboard.press('ArrowRight');
    expect((await activePg(page)).titleBlock.dx).toBe(a.dx + 1);
    await page.keyboard.press('Shift+ArrowDown');
    a = (await activePg(page)).titleBlock;
    await page.keyboard.press('Delete');
    expect((await activePg(page)).titleBlock.visible).toBe(false);
    await expect(page.getByTestId('title-block')).toHaveCount(0);
    await page.keyboard.press(`${MOD}+z`);
    await expect(page.getByTestId('title-block')).toBeVisible();
  });

  test('Werkzeug T setzt das Schriftfeld an die Klickstelle; Shift+L blendet die Legende aus', async ({ page }) => {
    await openApp(page);
    // Inhalt so groß, dass das angepasste Blatt nach Cmd/Strg+0 ganz im Fenster liegt
    await seed(page, { areas: [{ id: 'G', cx: 0, cy: 0, w: 100, d: 60 }] });
    await fitView(page);
    const frame = (await page.getByTestId('sheet-frame').boundingBox())!;
    await page.keyboard.press('t');
    await page.mouse.click(frame.x + 15, frame.y + 15);
    expect((await activePg(page)).titleBlock.corner).toBe('tl');
    await expect(page.getByLabel('Freitext dieser Page')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('v');
    await expect(page.getByTestId('legend')).toBeVisible();
    await page.keyboard.press('Shift+L');
    await expect(page.getByTestId('legend')).toHaveCount(0);
    expect((await activePg(page)).legend.visible).toBe(false);
  });

  test('Legende zeigt nur, was sichtbar vorkommt: Kategorien, ohne Kategorie, Infrastruktur-Typen', async ({ page }) => {
    await openApp(page);
    await seed(page, {
      categories: [{ id: 'c1', name: 'Imbiss', color: '#e57373' }, { id: 'c2', name: 'Kunst', color: '#9ccc65' }],
      stands: [{ id: 's1', cx: 0, cy: 0, w: 3, d: 3, categoryId: 'c1' }, { id: 's2', cx: 5, cy: 0, w: 3, d: 3 }],
      infra: [{ id: 'w', typeId: 'toilet', cx: 20, cy: 0, w: 6, d: 2.5 }],
    });
    const legend = page.getByTestId('legend');
    await expect(legend.locator('[data-entry]')).toHaveCount(3);
    await expect(legend).toContainText('Imbiss');
    await expect(legend).not.toContainText('Kunst');
    await expect(legend).toContainText('Geschäft ohne Kategorie');
    await expect(legend).toContainText('Toilette');
    await page.getByRole('button', { name: 'Infrastruktur ausblenden' }).click();
    await expect(legend.locator('[data-entry]')).toHaveCount(2);
  });
});

test.describe('M7: Start-Page', () => {
  test('Kennzahlen je Typ, Warnungen getrennt; Unter-Tab Infrastruktur (Cmd/Strg+3) mit Bearbeiten und Sprung', async ({ page }) => {
    await openApp(page);
    await seed(page, {
      infra: [
        { id: 'w1', typeId: 'toilet', cx: 20, cy: 0, w: 6, d: 2.5, powerKw: 2 },
        { id: 'w2', typeId: 'toilet', cx: 40, cy: 0, w: 6, d: 2.5 },
        { id: 'p', typeId: 'narrowPassage', cx: 0, cy: 20, w: 3, d: 0 },
      ],
    });
    await page.keyboard.press('Alt+0');
    const card = page.getByTestId('stat-page').first();
    await expect(card.getByTestId('stat-infra')).toContainText('davon Infrastruktur 2 kW');
    await expect(card.locator('[data-type="toilet"]')).toHaveText('2');
    await expect(card.locator('[data-type="narrowPassage"]')).toHaveText('1');
    await card.getByTestId('stat-warn-infra').click();
    await expect(page.getByRole('tab', { name: /Infrastruktur/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('infra-row')).toHaveCount(1);
    await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
    await expect(page.getByTestId('infra-row')).toHaveCount(3);
    await page.keyboard.press(`${MOD}+4`);
    await expect(page.getByTestId('project-settings')).toBeVisible();
    await page.keyboard.press(`${MOD}+3`);
    const label = page.getByTestId('infra-row').first().getByLabel('Bezeichnung');
    await label.fill('Süd');
    await label.press('Enter');
    expect((await store(page, 's.project.pages[0].infra.find((o) => o.id === "w1")')) as any).toMatchObject({ label: 'Süd' });
    await page.getByTestId('infra-row').first().getByRole('button', { name: 'Zum Objekt springen' }).click();
    expect(await store(page, 's.ui.selection')).toEqual({ kind: 'objects', ids: ['w1'] });
  });

  test('Eigener Infrastruktur-Typ in den Projekteinstellungen erscheint in der Werkzeuggruppe', async ({ page }) => {
    await openApp(page);
    await page.keyboard.press('Alt+0');
    await page.keyboard.press(`${MOD}+4`);
    await page.getByRole('button', { name: 'Eigenen Typ anlegen' }).click();
    const row = page.getByTestId('infra-type-row').last();
    const name = row.getByLabel('Name');
    await name.fill('Bühne');
    await name.press('Enter');
    await row.getByLabel('Symbol').selectOption('stadium');
    await page.keyboard.press('Alt+1');
    await page.getByTestId('infra-flyout-toggle').click();
    await expect(page.getByRole('menuitemradio', { name: 'Bühne' })).toBeVisible();
  });
});

test.describe('M7: Dateiformat Version 4', () => {
  test('echte Datei Version 3 öffnen: Blatt und Standards ergänzt, Speichern schreibt Version 4', async ({ page }) => {
    await openApp(page);
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press(`${MOD}+o`);
    await (await chooser).setFiles('tests/fixtures/format-v3-m6.schelme');
    await expect.poll(() => store(page, 's.project.pages.reduce((n, p) => n + p.stands.length, 0)')).toBe(500);
    const p = (await store(page, 's.project')) as any;
    expect(p.infraTypes).toHaveLength(8);
    expect(p.pages[0].sheet).toEqual({ format: 'A3', orientation: 'landscape', scale: null, cx: 0, cy: 0 });
    expect(p.pages[0].powerLimitKw).toBe(100);
    expect(await store(page, 's.history.past.length')).toBe(0);
    const download = page.waitForEvent('download');
    await page.keyboard.press(`${MOD}+s`);
    const path = await (await download).path();
    const { readFileSync } = await import('node:fs');
    const { unzipSync, strFromU8 } = await import('fflate');
    const json = JSON.parse(strFromU8(unzipSync(new Uint8Array(readFileSync(path)))['project.json']!));
    expect(json.schemaVersion).toBe(4);
    expect(json.project.pages[0]).not.toHaveProperty('titleBlockPos');
    expect(json.project.pages[0].legend).toEqual({ visible: true, corner: 'bl', dx: 10, dy: 10 });
  });
});
