import { Html } from '@react-three/drei';
import type { CampusComponent } from '../data/campus';
import { COMPONENT_INFO } from '../data/componentInfo';
import { CLASSIFICATION_COLORS } from '../data/facts';
import { useStore } from '../state/store';

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
            {cls === 'PUBLIC FACT' ? 'FACT' : cls === 'TYPICAL' ? 'TYP' : cls === 'SIMPLIFIED' ? 'SIMP' : 'SYN'}
          </span>
        )}
      </div>
    </Html>
  );
}

function shortLabel(c: CampusComponent): string {
  const t = c.type;
  switch (t) {
    case 'data-hall':
      return `Data hall ${c.hall}`;
    case 'generator':
      return `Generators (${c.offsets?.length ?? 1})`;
    case 'adiabatic-cooler':
      return 'Adiabatic heat rejection';
    case 'reservoir':
      return 'Cooling water storage';
    case 'gxp-transformer':
      return 'GXP transformers';
    case 'gxp-bay':
      return 'HV bays and gantries';
    case 'gxp-platform':
      return 'Grid exit point';
    case 'hv-line':
      return 'HV transmission';
    case 'mv-switchgear':
      return `${c.id.slice(0, 2)} MV switchgear`;
    case 'ups':
      return 'UPS';
    case 'rack':
      return 'Racks';
    case 'bore':
      return 'Bore field';
    case 'water-treatment':
      return 'Water treatment';
    case 'stormwater-basin':
      return 'Stormwater basin';
    case 'wetland':
      return 'Wetland and recharge';
    case 'landing-station':
      return 'Cable landing station';
    case 'fibre-route':
      return 'Fibre route';
    case 'fire':
      return 'Fire water and pumps';
    case 'road':
      return 'Internal roads';
    case 'admin':
      return c.id === 'site.admin' ? 'Operations building' : 'Logistics and workshop';
    case 'gatehouse':
      return 'Gatehouse';
    case 'module-plant':
      return `Module ${c.module} plant zone`;
    default:
      return c.label;
  }
}