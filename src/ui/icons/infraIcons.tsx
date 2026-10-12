/**
 * Symbole der Infrastruktur-Typen (M7, spec.md §11): lokal gebündelte Material Symbols (Outlined, 400).
 * Die Pfaddaten werden auch auf der Zeichenfläche gezeichnet (Weltkoordinaten, ab M8 Vektor im PDF).
 */
import arrow_range from '@material-symbols/svg-400/outlined/arrow_range.svg?raw';
import ambulance from '@material-symbols/svg-400/outlined/ambulance.svg?raw';
import block from '@material-symbols/svg-400/outlined/block.svg?raw';
import bolt from '@material-symbols/svg-400/outlined/bolt.svg?raw';
import campaign from '@material-symbols/svg-400/outlined/campaign.svg?raw';
import celebration from '@material-symbols/svg-400/outlined/celebration.svg?raw';
import chair from '@material-symbols/svg-400/outlined/chair.svg?raw';
import del from '@material-symbols/svg-400/outlined/delete.svg?raw';
import door_sliding from '@material-symbols/svg-400/outlined/door_sliding.svg?raw';
import electrical_services from '@material-symbols/svg-400/outlined/electrical_services.svg?raw';
import emergency from '@material-symbols/svg-400/outlined/emergency.svg?raw';
import family_restroom from '@material-symbols/svg-400/outlined/family_restroom.svg?raw';
import fence from '@material-symbols/svg-400/outlined/fence.svg?raw';
import fire_truck from '@material-symbols/svg-400/outlined/fire_truck.svg?raw';
import flag from '@material-symbols/svg-400/outlined/flag.svg?raw';
import gate from '@material-symbols/svg-400/outlined/gate.svg?raw';
import health_and_safety from '@material-symbols/svg-400/outlined/health_and_safety.svg?raw';
import info from '@material-symbols/svg-400/outlined/info.svg?raw';
import local_fire_department from '@material-symbols/svg-400/outlined/local_fire_department.svg?raw';
import local_hospital from '@material-symbols/svg-400/outlined/local_hospital.svg?raw';
import location_on from '@material-symbols/svg-400/outlined/location_on.svg?raw';
import medical_services from '@material-symbols/svg-400/outlined/medical_services.svg?raw';
import mic from '@material-symbols/svg-400/outlined/mic.svg?raw';
import recycling from '@material-symbols/svg-400/outlined/recycling.svg?raw';
import road from '@material-symbols/svg-400/outlined/road.svg?raw';
import signpost from '@material-symbols/svg-400/outlined/signpost.svg?raw';
import stadium from '@material-symbols/svg-400/outlined/stadium.svg?raw';
import storefront from '@material-symbols/svg-400/outlined/storefront.svg?raw';
import theater_comedy from '@material-symbols/svg-400/outlined/theater_comedy.svg?raw';
import traffic from '@material-symbols/svg-400/outlined/traffic.svg?raw';
import warning from '@material-symbols/svg-400/outlined/warning.svg?raw';
import water_drop from '@material-symbols/svg-400/outlined/water_drop.svg?raw';
import wc from '@material-symbols/svg-400/outlined/wc.svg?raw';
import { isInfraIcon, type InfraIcon } from '../../core/infra';

const RAW: Record<InfraIcon, string> = {
  fence,
  block,
  medical_services,
  ambulance,
  wc,
  delete: del,
  arrow_range,
  location_on,
  local_hospital,
  health_and_safety,
  emergency,
  fire_truck,
  local_fire_department,
  warning,
  traffic,
  road,
  gate,
  door_sliding,
  signpost,
  stadium,
  mic,
  theater_comedy,
  celebration,
  storefront,
  info,
  campaign,
  family_restroom,
  chair,
  water_drop,
  bolt,
  electrical_services,
  recycling,
  flag,
};

/** Deutsche Namen für die Symbol-Auswahl. */
export const INFRA_ICON_LABEL: Record<InfraIcon, string> = {
  fence: 'Zaun',
  block: 'Sperre',
  medical_services: 'Sanitätskoffer',
  ambulance: 'Rettungswagen',
  wc: 'WC',
  delete: 'Mülleimer',
  arrow_range: 'Breite',
  location_on: 'Ort',
  local_hospital: 'Kreuz',
  health_and_safety: 'Schutz',
  emergency: 'Notfall',
  fire_truck: 'Feuerwehr',
  local_fire_department: 'Feuer',
  warning: 'Achtung',
  traffic: 'Ampel',
  road: 'Straße',
  gate: 'Tor',
  door_sliding: 'Eingang',
  signpost: 'Wegweiser',
  stadium: 'Bühne',
  mic: 'Mikrofon',
  theater_comedy: 'Theater',
  celebration: 'Fest',
  storefront: 'Stand',
  info: 'Info',
  campaign: 'Durchsage',
  family_restroom: 'Familie',
  chair: 'Sitzplatz',
  water_drop: 'Wasser',
  bolt: 'Strom',
  electrical_services: 'Stromanschluss',
  recycling: 'Recycling',
  flag: 'Fahne',
};

/** Pfaddaten je Symbol im Koordinatensystem 0 −960 960 960. */
export const INFRA_ICON_PATH = Object.fromEntries(
  Object.entries(RAW).map(([k, svg]) => [k, [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]).join(' ')]),
) as Record<InfraIcon, string>;

export const iconPath = (name: string) => INFRA_ICON_PATH[isInfraIcon(name) ? name : 'info'];

/** Symbol eines Infrastruktur-Typs für Knöpfe und Listen (Farbe über `currentColor` oder `color`). */
export function InfraIconView({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 -960 960 960" fill={color ?? 'currentColor'} aria-hidden="true">
      <path d={iconPath(name)} />
    </svg>
  );
}

/**
 * Symbol in Weltkoordinaten: zentriert auf `c`, `size` Meter hoch. Material Symbols sind 960 Einheiten
 * groß, Ursprung oben links bei (0, −960).
 */
export function WorldIcon({ name, c, size, className }: { name: string; c: { x: number; y: number }; size: number; className?: string }) {
  const k = size / 960;
  return <path className={className} d={iconPath(name)} transform={`translate(${c.x - size / 2} ${c.y + size / 2}) scale(${k})`} />;
}
