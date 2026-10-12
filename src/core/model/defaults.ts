import { newId } from '../id';
import {
  LAYER_IDS,
  type FestplatzPage,
  type InfraTypeDef,
  type LayerId,
  type LayerState,
  type Project,
  type ProjectSettings,
} from './types';

export const DEFAULT_SETTINGS: ProjectSettings = {
  minFreeWidth: 0.5,
  labelFontSize: 0.6,
  labelTemplate: '{nr}\n{name}\n{breite}×{tiefe} m',
  numbering: { scope: 'perPage', start: 1, digits: 1 },
  warnOutside: true,
  warnOverlap: true,
  warnDuplicateNr: true,
  snap: { front: true, grid: false, neighbors: true },
};

export const DEFAULT_INFRA_TYPES: InfraTypeDef[] = [
  { type: 'barrierMobile', label: 'Mobile Sperre', color: '#e0a526', icon: 'fence', occupiesArea: true },
  { type: 'barrierFixed', label: 'Feste Sperre', color: '#c0392b', icon: 'fence', occupiesArea: true },
  { type: 'medical', label: 'Sanitätsdienst', color: '#e74c3c', icon: 'medical_services', occupiesArea: true },
  { type: 'ambulance', label: 'RTW-Platz', color: '#d35454', icon: 'ambulance', occupiesArea: true },
  { type: 'toilet', label: 'Toilette', color: '#3a86c8', icon: 'wc', occupiesArea: true },
  { type: 'waste', label: 'Müllcontainer', color: '#6d7a80', icon: 'delete', occupiesArea: true },
  { type: 'narrowPassage', label: 'Enge Durchfahrt', color: '#9b59b6', icon: 'signpost', occupiesArea: false },
  { type: 'marker', label: 'Marker', color: '#16a085', icon: 'location_on', occupiesArea: false },
];

export function defaultLayers(): Record<LayerId, LayerState> {
  return Object.fromEntries(LAYER_IDS.map((id) => [id, { visible: true, locked: false }])) as Record<
    LayerId,
    LayerState
  >;
}

export function createPage(name: string): FestplatzPage {
  return {
    id: newId(),
    name,
    prefix: '',
    numberingMode: 'frontLtr',
    powerLimitKw: null,
    blockOverLimit: false,
    northAngle: 0,
    grid: { size: 1, visible: true },
    layers: defaultLayers(),
    background: null,
    areas: [],
    stands: [],
    infra: [],
    titleBlockPos: { x: 0, y: 0 },
    titleBlockText: '',
    view: null,
  };
}

export function createProject(name = 'Neues Projekt'): Project {
  return {
    id: newId(),
    name,
    settings: structuredClone(DEFAULT_SETTINGS),
    pages: [createPage('Festplatz 1')],
    categories: [],
    infraTypes: structuredClone(DEFAULT_INFRA_TYPES),
    exportProfiles: [],
    titleBlock: { dateText: '', version: '' },
    unplaced: [],
  };
}
