/**
 * Kennzahlen der Start-Page (M6, spec.md §7): je Festplatz und gesamt Anzahl Geschäfte, Frontmeter (Summe der
 * Breiten; das ist die „belegte Fläche“), freie Frontmeter (Summe der Breiten der angezeigten Freiflächen, M6-11),
 * Strom (§6) und Warnzahl. Warnungen und doppelte Nummern kommen aus den
 * vorhandenen Zwischenspeichern, unveränderte Pages kosten nichts.
 */
import type { AreaFreeSpaces } from './freeSpace';
import { cachedDuplicates, type NrRef } from './numbering';
import { CONNECTION_KEYS, pagePower, type ConnectionKey, type PowerSummary } from './power';
import { cachedPageWarnings, countWarnings, type WarningCount, type WarnSettings } from './warnings';
import type { FestplatzPage, Id, Project, Stand } from './model/types';

/** Summe auf 0,01 m gerundet (Speichergenauigkeit), ohne Gleitkomma-Reste. */
export const sumWidths = (stands: readonly Pick<Stand, 'w'>[]) => Math.round(stands.reduce((n, s) => n + s.w * 100, 0)) / 100;

/** Freie Frontmeter: Breiten der angezeigten Freiflächen (ab Mindestbreite; angeschnittene mit Hüllbreite). */
export const freeFrontMeters = (free: readonly AreaFreeSpaces[]) => sumWidths(free.flatMap((a) => a.free.map((f) => ({ w: f.width }))));

/** Freiflächen einer Page (der Aufrufer reicht seinen Zwischenspeicher durch). */
export type FreeOf = (page: FestplatzPage) => readonly AreaFreeSpaces[];

export interface PageStats {
  pageId: Id;
  name: string;
  stands: number;
  frontM: number;
  freeFrontM: number;
  power: PowerSummary;
  warnings: WarningCount;
}

export interface ProjectStats {
  pages: PageStats[];
  total: {
    stands: number;
    frontM: number;
    freeFrontM: number;
    sumKw: number;
    byConnection: Record<ConnectionKey, { count: number; kw: number }>;
    warnings: WarningCount;
  };
}

export function pageStats(page: FestplatzPage, settings: WarnSettings, duplicates: ReadonlyMap<Id, readonly NrRef[]>, freeOf: FreeOf): PageStats {
  return {
    pageId: page.id,
    name: page.name,
    stands: page.stands.length,
    frontM: sumWidths(page.stands),
    freeFrontM: freeFrontMeters(freeOf(page)),
    power: pagePower(page),
    warnings: countWarnings(cachedPageWarnings(page.areas, page.stands), page.stands, settings, duplicates),
  };
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function projectStats(project: Pick<Project, 'pages' | 'settings'>, freeOf: FreeOf): ProjectStats {
  const dups = cachedDuplicates(project.pages, project.settings.numbering.scope);
  const pages = project.pages.map((p) => pageStats(p, project.settings, dups, freeOf));
  const byConnection = Object.fromEntries(CONNECTION_KEYS.map((k) => [k, { count: 0, kw: 0 }])) as ProjectStats['total']['byConnection'];
  const warnings: WarningCount = { stands: 0, outside: 0, overlap: 0, duplicate: 0 };
  let frontCm = 0;
  let freeCm = 0;
  let kw = 0;
  for (const p of pages) {
    frontCm += Math.round(p.frontM * 100);
    freeCm += Math.round(p.freeFrontM * 100);
    kw += p.power.sumKw;
    for (const k of CONNECTION_KEYS) {
      byConnection[k].count += p.power.byConnection[k].count;
      byConnection[k].kw += p.power.byConnection[k].kw;
    }
    for (const k of ['stands', 'outside', 'overlap', 'duplicate'] as const) warnings[k] += p.warnings[k];
  }
  for (const k of CONNECTION_KEYS) byConnection[k].kw = round3(byConnection[k].kw);
  return {
    pages,
    total: { stands: pages.reduce((n, p) => n + p.stands, 0), frontM: frontCm / 100, freeFrontM: freeCm / 100, sumKw: round3(kw), byConnection, warnings },
  };
}
