/**
 * Strom (M5, spec.md §6): Summe je Festplatz und Projekt, Stand gegen das Limit, Summen je
 * Anschlussart, Prüfung fürs Blockieren. Es zählen alle Stände der Page, auch außerhalb von Grundflächen.
 */
import { fmt } from './format';
import type { Connection, FestplatzPage, Id, Project, Stand } from './model/types';

/** Ab diesem Anteil am Limit ist der Balken gelb. */
export const POWER_WARN_RATIO = 0.9;

/** Grenzen des Limit-Felds in kW. */
export const POWER_LIMIT = { min: 0.1, max: 100_000 };

export type PowerLevel = 'none' | 'ok' | 'warn' | 'over';
export type ConnectionKey = Connection | 'none';
export const CONNECTION_KEYS: readonly ConnectionKey[] = ['230V', 'CEE16', 'CEE32', 'none'];

export interface PowerSummary {
  sumKw: number;
  limitKw: number | null;
  /** Summe / Limit, ohne Limit null. */
  ratio: number | null;
  level: PowerLevel;
  /** Anzahl Stände und kW je Anschlussart (`none` = ohne Angabe). */
  byConnection: Record<ConnectionKey, { count: number; kw: number }>;
}

/** Auf 0,001 kW gerundet, damit sich Gleitkomma-Reste beim Summieren nicht zeigen. */
const roundKw = (kw: number) => Math.round(kw * 1000) / 1000;

export const sumPower = (stands: readonly Pick<Stand, 'powerKw'>[]) => roundKw(stands.reduce((n, s) => n + s.powerKw, 0));

/** kW in ganzen Watt (auf 0,001 kW gerundet): Vergleiche ohne Gleitkomma-Reste (QA-M5-02). */
const watts = (kw: number) => Math.round(kw * 1000);

/** Stufe auf 0,001 kW gerundet verglichen: 11,7 von 13 kW sind genau 90 % (gelb). */
export function powerLevel(sumKw: number, limitKw: number | null): PowerLevel {
  if (limitKw === null) return 'none';
  const s = watts(sumKw);
  const l = watts(limitKw);
  if (s > l) return 'over';
  return s * 10 >= l * (POWER_WARN_RATIO * 10) ? 'warn' : 'ok';
}

/**
 * Prozentangabe passend zur Farbstufe (spec.md §6): abgerundet (89,9 % → „89 %“); über dem Limit mit einer
 * Nachkommastelle, wenn die ganze Zahl 100 wäre (100,1 % → „100,1 %“), knapp darüber „über 100 %“. Ohne Limit leer.
 */
export function powerPercentLabel(sumKw: number, limitKw: number | null): string {
  if (limitKw === null || watts(limitKw) <= 0) return '';
  const tenths = Math.floor((watts(sumKw) * 1000) / watts(limitKw));
  const whole = Math.floor(tenths / 10);
  if (powerLevel(sumKw, limitKw) !== 'over' || whole > 100) return `${whole} %`;
  return tenths > 1000 ? `${fmt(tenths / 10, 1)} %` : 'über 100 %';
}

export function pagePower(page: Pick<FestplatzPage, 'stands' | 'powerLimitKw'>): PowerSummary {
  const byConnection = Object.fromEntries(CONNECTION_KEYS.map((k) => [k, { count: 0, kw: 0 }])) as PowerSummary['byConnection'];
  for (const s of page.stands) {
    const c = byConnection[s.connection ?? 'none'];
    c.count++;
    c.kw += s.powerKw;
  }
  for (const k of CONNECTION_KEYS) byConnection[k].kw = roundKw(byConnection[k].kw);
  const sumKw = sumPower(page.stands);
  const limitKw = page.powerLimitKw;
  return { sumKw, limitKw, ratio: limitKw === null ? null : sumKw / limitKw, level: powerLevel(sumKw, limitKw), byConnection };
}

/** Pages mit Summe und Limit sowie die Gesamtsumme (Grundlage der Start-Page, M6). */
export function projectPower(project: Pick<Project, 'pages'>): { pages: (PowerSummary & { pageId: Id })[]; sumKw: number } {
  const pages = project.pages.map((p) => ({ pageId: p.id, ...pagePower(p) }));
  return { pages, sumKw: roundKw(pages.reduce((n, p) => n + p.sumKw, 0)) };
}

/** Ergebnis der Prüfung einer Änderung für eine Page. */
export interface PowerCheck {
  pageId: Id;
  pageName: string;
  before: number;
  after: number;
  limitKw: number;
  /** Abgewiesen, weil Blockieren eingeschaltet ist. */
  blocked: boolean;
  /** Vorher lag die Summe höchstens beim Limit (Hinweis beim Überschreiten). */
  crossed: boolean;
}

/**
 * Prüft eine Änderung: Für jede Page, deren Summe steigt und danach über dem Limit liegt, ein Eintrag
 * (`blocked`, wenn sie Überschreitungen blockiert). Senkungen und gleichbleibende Summen sind nie betroffen.
 */
export function checkPowerChange(before: readonly FestplatzPage[], after: readonly FestplatzPage[]): PowerCheck[] {
  const old = new Map(before.map((p) => [p.id, p]));
  const out: PowerCheck[] = [];
  for (const p of after) {
    const prev = old.get(p.id);
    if (!prev || p.powerLimitKw === null || prev.stands === p.stands) continue;
    const a = sumPower(prev.stands);
    const b = sumPower(p.stands);
    const limit = watts(p.powerLimitKw);
    if (watts(b) > watts(a) && watts(b) > limit) out.push({ pageId: p.id, pageName: p.name, before: a, after: b, limitKw: p.powerLimitKw, blocked: p.blockOverLimit, crossed: watts(a) <= limit });
  }
  return out;
}
