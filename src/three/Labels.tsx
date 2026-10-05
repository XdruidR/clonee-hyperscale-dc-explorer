import { Html } from '@react-three/drei';
import { BUILDING_BY_NAME, HALL_NAME, type CampusComponent } from '../data/campus';
import { COMPONENT_INFO } from '../data/componentInfo';
import { CLASSIFICATION_COLORS } from '../data/facts';
import { useStore } from '../state/store';

/** Short form of a classification, for the width a 3D label can afford. */
const SHORT_CLS: Record<string, string> = {
  'PUBLIC FACT': 'FACT',
  DERIVED: 'DER',
  TYPICAL: 'TYP',
  SYNTHETIC: 'SYN',
};

/** Small 3D label. Uses a short title rather than the full component name so the
 *  campus stays readable; the inspector carries the full name. */
export function Label({ c, dim, y }: { c: CampusComponent; dim: number; y: number }) {
  const labels = useStore((s) => s.labels);
  const evidenceMode = useStore((s) => s.evidenceMode);
  const info = COMPONENT_INFO[c.type];
  if (!labels || dim < 0.5) return null;
  const text = shortLabel(c);
  const cls = info?.provenance ?? 'TYPICAL';
  return (
    <Html position={[0, y, 0]} center distanceFactor={520} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="w3d-label" style={{ opacity: 0.55 + dim * 0.45 }}>
        <span className="w3d-label-text">{text}</span>
        {evidenceMode && (
          <span className="w3d-label-cls" style={{ background: CLASSIFICATION_COLORS[cls] }}>
            {SHORT_CLS[cls] ?? 'TYP'}
          </span>
        )}
      </div>
    </Html>
  );
}

/**
 * Short 3D label per component.
 *
 * The building name is taken from the model rather than sliced out of the id,
 * because the published names are not a simple sequence — there is no CLN4 on
 * this campus, and a slice would produce "CLN" for CLN1 and "CLN" for CLN5.
 */
function shortLabel(c: CampusComponent): string {
  const t = c.type;
  const b = c.building ? BUILDING_BY_NAME[Object.keys(BUILDING_BY_NAME).find((k) => BUILDING_BY_NAME[k].n === c.building) ?? 'CLN1'] : undefined;

  switch (t) {
    case 'data-hall':
      return b?.name ?? 'Data hall';
    case 'hall-floor':
      return HALL_NAME[c.id.replace('.floor', '')] ?? 'White space';
    case 'generator':
      return `${b?.name ?? ''} generators (${c.offsets?.length ?? 1})`.trim();
    case 'gen-heat-rejection':
      return `${b?.name ?? ''} engine cooling`.trim();
    case 'fuel-tank':
      return `${b?.name ?? ''} fuel tanks`.trim();
    case 'air-cooler':
      return `${b?.name ?? ''} air cooling`.trim();
    case 'heat-exchanger':
      return `${b?.name ?? ''} heat exchangers`.trim();
    case 'pump':
      return `${b?.name ?? ''} pumps`.trim();
    case 'heat-plume':
      return 'Heat and vapour rejection';
    case 'sub-transformer':
      return 'Step-down transformers';
    case 'sub-bay':
      return '220 kV switchyard';
    case 'sub-platform':
      return '220 kV substation';
    case 'sub-control':
      return 'Substation control';
    case 'sub-mv-building':
      return 'Customer MV building';
    case 'hv-line':
      return '220 kV transmission';
    case 'mv-switchgear':
      return `${b?.name ?? ''} MV switchgear`.trim();
    case 'generator-switchgear':
      return `${b?.name ?? ''} gensw`.trim();
    case 'unit-substation':
      return `${b?.name ?? ''} substations`.trim();
    case 'ups':
      return `${b?.name ?? ''} UPS`.trim();
    case 'battery':
      return `${b?.name ?? ''} batteries`.trim();
    case 'lv-switchboard':
      return `${b?.name ?? ''} LV distribution`.trim();
    case 'rack':
      return HALL_NAME[c.id.replace('.rack', '')]?.replace(' hall ', ' racks ') ?? 'Racks';
    case 'server':
      return HALL_NAME[c.id.replace('.server', '')]?.replace(' hall ', ' IT load ') ?? 'IT load';
    case 'network-switch':
      return HALL_NAME[c.id.replace('.switch', '')]?.replace(' hall ', ' fabric ') ?? 'Fabric';
    case 'storage':
      return HALL_NAME[c.id.replace('.storage', '')]?.replace(' hall ', ' storage ') ?? 'Storage';
    case 'busway':
      return HALL_NAME[c.id.replace('.bus', '')]?.replace(' hall ', ' busway ') ?? 'Busway';
    case 'crah':
      return HALL_NAME[c.id.replace('.crah', '')]?.replace(' hall ', ' air cooling ') ?? 'Air cooling';
    case 'cdu':
      return HALL_NAME[c.id.replace('.cdu', '')]?.replace(' hall ', ' CDUs ') ?? 'CDUs';
    case 'cold-plate':
      return HALL_NAME[c.id.replace('.cold', '')]?.replace(' hall ', ' cold plates ') ?? 'Cold plates';
    case 'bore':
      return 'Production wellfield';
    case 'water-treatment':
      return 'Water treatment';
    case 'stormwater-basin':
      return 'Attenuation basin';
    case 'watercourse':
      return 'Receiving watercourse';
    case 'fibre-hub':
      return 'Meet-me rooms';
    case 'fibre-route':
      return 'Fibre route';
    case 'fire':
      return 'Fire water and pumps';
    case 'road':
      return 'Internal roads';
    case 'admin':
      return c.id === 'site.admin' ? 'Administration building' : 'Expansion administration';
    case 'gatehouse':
      return 'Gatehouse';
    case 'building-plant':
      return `${b?.name ?? ''} plant corridor`.trim();
    case 'network-core':
      return 'Campus core';
    default:
      return c.label;
  }
}