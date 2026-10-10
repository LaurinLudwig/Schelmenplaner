import type { ReactNode } from 'react';
import type { FestplatzPage, Vec, View } from '../../../core/model/types';
import type { SnapResult } from '../../../core/snap';

/** Was ein Werkzeug von der Zeichenfläche bekommt. */
export interface ToolContext {
  page: FestplatzPage;
  view: View;
  /** Weltpunkt → Bildschirmpunkt (relativ zur Zeichenfläche). */
  toScreen: (p: Vec) => Vec;
  /** Fang am nächsten Objekt-Eckpunkt bzw. an der nächsten Kante (siehe core/snap.ts). */
  snap: (p: Vec) => SnapResult | null;
}

export interface ToolPointer {
  world: Vec;
  screen: Vec;
  shiftKey: boolean;
  altKey: boolean;
}

/** Schnittstelle der Werkzeug-Hooks (useMeasureTool, useCalibrateTool, …). */
export interface ToolHandlers {
  /** true = Ereignis verarbeitet (Zeichenfläche macht dann nichts weiter). */
  onPointerDown(p: ToolPointer): boolean;
  onPointerMove(p: ToolPointer): void;
  onPointerUp(p: ToolPointer): void;
  /** true = Taste verarbeitet. */
  onKeyDown(e: KeyboardEvent): boolean;
  /** Zeichnungen in Bildschirmkoordinaten (SVG). */
  overlay: ReactNode;
  /** HTML über der Zeichenfläche (Eingabefelder, Hinweise). */
  panel: ReactNode;
}
