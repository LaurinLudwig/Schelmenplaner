/**
 * Datenmodell des Projekts (wird als `project.json` gespeichert).
 *
 * Konventionen (aus dem Prototyp übernommen):
 * - Einheit Meter, x nach rechts, y nach unten.
 * - Drehung in Grad, positiv = im Uhrzeigersinn auf dem Bildschirm.
 * - Rechteck { cx, cy, w, d, rot }: Mittelpunkt, Breite (lokale x-Achse), Tiefe (lokale y-Achse).
 * - Kanten: 0 = oben, 1 = rechts, 2 = unten, 3 = links (ungedreht). Grundfläche und Geschäft haben
 *   ihre Vorderseite immer an Kante 2; `w` ist damit stets die Länge der Vorderseite. Wird eine
 *   andere Kante zur Vorderseite, wird das Rechteck umorientiert (siehe geometry/rect.ts `setFront`).
 * - Gespeicherte Positionen und Maße sind auf 0,01 m gerundet, Drehungen auf 0,1° (`roundRect`).
 *
 * Abgeleitete Daten (Freiflächen, Warnungen, Summen) werden nie gespeichert.
 */

export type Id = string;

export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  cx: number;
  cy: number;
  w: number;
  d: number;
  rot: number;
}

export const LAYER_IDS = ['background', 'areas', 'free', 'stands', 'infra', 'labels'] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export interface LayerState {
  visible: boolean;
  locked: boolean;
}

export interface Category {
  id: Id;
  name: string;
  color: string;
}

export const INFRA_TYPES = [
  'barrierMobile',
  'barrierFixed',
  'medical',
  'ambulance',
  'toilet',
  'waste',
  'narrowPassage',
  'marker',
] as const;
export type InfraType = (typeof INFRA_TYPES)[number];

export interface InfraTypeDef {
  type: InfraType;
  label: string;
  color: string;
  icon: string;
  /** Belegt die Achse einer Grundfläche wie ein Geschäft (dort keine Freifläche). */
  occupiesArea: boolean;
}

/** Index einer Rechteckkante (lokal, ungedreht): 0 oben, 1 rechts, 2 unten, 3 links. */
export type EdgeIndex = 0 | 1 | 2 | 3;

/** Grundfläche. Vorderseite = Kante 2. */
export interface Area extends Rect {
  id: Id;
  name: string;
}

export type Connection = '230V' | 'CEE16' | 'CEE32';

export interface Stand extends Rect {
  id: Id;
  nr: string;
  nrLocked: boolean;
  name: string;
  owner: string;
  ware: string;
  powerKw: number;
  connection: Connection | null;
  note: string;
  categoryId: Id | null;
  /** Eigene Farbe; überschreibt die Kategoriefarbe. null = Farbe der Kategorie bzw. Grau. */
  color: string | null;
  suppressOutsideWarning: boolean;
}

export interface InfraObject extends Rect {
  id: Id;
  type: InfraType;
  /** Text des freien Markers. Bei der engen Durchfahrt ist `w` die lichte Breite. */
  text?: string;
}

export type BackgroundKind = 'pdf' | 'svg' | 'image';

export interface Background {
  /** Schlüssel der eingebetteten Datei in `assets/` (Inhalts-Hash + Endung). */
  assetId: string;
  kind: BackgroundKind;
  /** Ursprünglicher Dateiname, nur zur Anzeige. */
  fileName: string;
  /** Bei PDFs: gewählte Seite (1-basiert) und Seitenzahl der Originaldatei. Eingebettet ist nur diese Seite. */
  pdfPage?: number;
  pdfPageCount?: number;
  /** Größe in Quell-Einheiten: Pixel (PNG/JPEG), Nutzereinheiten (SVG), Punkte (PDF). */
  pxSize: { w: number; h: number };
  /** Siehe core/background.ts. */
  transform: { x: number; y: number; metersPerPx: number; rot: number };
  /** Zuletzt verwendete Kalibrierpunkte in Quell-Einheiten und der eingegebene Abstand. */
  calibration?: { p1: Vec; p2: Vec; meters: number };
  /** Bei PDFs: direkt eingegebener Planmaßstab 1:n (Alternative zur 2-Punkt-Kalibrierung). */
  paperScale?: number;
  opacity: number;
  locked: boolean;
}

export interface View {
  /** Pixel pro Meter. */
  scale: number;
  tx: number;
  ty: number;
}

export type NumberingMode = 'frontLtr' | 'clockwise' | 'manual';

export interface FestplatzPage {
  id: Id;
  name: string;
  prefix: string;
  numberingMode: NumberingMode;
  clockwise?: { center: Vec; startAngle: number };
  powerLimitKw: number | null;
  blockOverLimit: boolean;
  northAngle: number;
  grid: { size: number; visible: boolean };
  layers: Record<LayerId, LayerState>;
  background: Background | null;
  /** Array-Reihenfolge = Reihenfolge der Grundflächen für die Nummerierung. */
  areas: Area[];
  stands: Stand[];
  infra: InfraObject[];
  titleBlockPos: Vec;
  titleBlockText: string;
  /** Zuletzt verwendete Ansicht; wird beim Speichern geschrieben, gehört nicht zur Undo-Historie. */
  view: View | null;
}

export interface ProjectSettings {
  minFreeWidth: number;
  /** Schriftgröße der Standbeschriftung in Metern (Planeinheiten). */
  labelFontSize: number;
  labelTemplate: string;
  numbering: { scope: 'global' | 'perPage'; start: number };
  warnOutside: boolean;
  snap: { front: boolean; grid: boolean; neighbors: boolean };
}

export interface ExportProfile {
  id: Id;
  name: string;
  layers: LayerId[];
  hiddenFields: (keyof Stand)[];
}

export interface Vendor {
  id: Id;
  name: string;
  owner: string;
  ware: string;
  w: number;
  d: number;
  powerKw: number;
  connection: Connection | null;
  note: string;
}

export interface Project {
  id: Id;
  name: string;
  settings: ProjectSettings;
  /** Festplatz-Pages in Tab-Reihenfolge. Die Start-Page ist implizit und immer die erste. */
  pages: FestplatzPage[];
  categories: Category[];
  infraTypes: InfraTypeDef[];
  exportProfiles: ExportProfile[];
  titleBlock: { dateText: string; version: string };
  unplaced: Vendor[];
}

export interface ProjectFile {
  format: 'schelmeplaner';
  schemaVersion: number;
  project: Project;
}
