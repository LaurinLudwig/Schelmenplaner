/**
 * Strom (M5, spec.md §6): Summe je Festplatz und Projekt, Stand gegen das Limit, Summen je
 * Anschlussart, Prüfung fürs Blockieren. Es zählen alle Stände der Page, auch außerhalb von Grundflächen.
 */
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

export function powerLevel(sumKw: number, limitKw: number | null): PowerLevel {
  if (limitKw === null) return 'none';
  if (sumKw > limitKw) return 'over';
  return sumKw >= limitKw * POWER_WARN_RATIO ? 'warn' : 'ok';
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
    if (b > a && b > p.powerLimitKw) out.push({ pageId: p.id, pageName: p.name, before: a, after: b, limitKw: p.powerLimitKw, blocked: p.blockOverLimit, crossed: a <= p.powerLimitKw });
  }
  return out;
}
