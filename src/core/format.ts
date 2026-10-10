/** Zahl im deutschen Format, höchstens `digits` Nachkommastellen, ohne „-0“. */
export function fmt(n: number, digits = 2): string {
  const f = 10 ** digits;
  const r = Math.round(n * f) / f;
  return (Math.abs(r) < 0.5 / f ? 0 : r).toLocaleString('de-DE', { maximumFractionDigits: digits });
}

/** Liest „1,5“, „1.5“ und „ 2 “; liefert NaN bei ungültiger Eingabe. */
export function parseNum(s: string): number {
  const t = s.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return Number(t);
}
