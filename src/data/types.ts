/**
 * Shared vocabulary for the Clonee model.
 *
 * Three ideas are fixed here and everything else depends on them:
 *
 *   1. The seven physical systems a data centre is made of.
 *   2. The four evidence classifications, which every claim in the application
 *      carries. This is the product's spine, so it lives in one place.
 *   3. The turnover package vocabulary, which is what actually gets built.
 */

export type SystemKey = 'power' | 'cooling' | 'water' | 'data' | 'site' | 'security' | 'fire';

export const SYSTEM_META: Record<SystemKey, { label: string; color: string; blurb: string }> = {
  power: { label: 'POWER', color: '#ffcf3f', blurb: 'Grid to rack' },
  cooling: { label: 'COOLING', color: '#ff6b5b', blurb: 'Heat to air' },
  water: { label: 'WATER', color: '#38bdf8', blurb: 'In, through, out' },
  data: { label: 'DATA', color: '#a78bfa', blurb: 'Fibre to server' },
  site: { label: 'SITE / DELIVERY', color: '#9aa6b2', blurb: 'Civil and logistics' },
  security: { label: 'SECURITY', color: '#34d399', blurb: 'Perimeter and access' },
  fire: { label: 'FIRE', color: '#f87171', blurb: 'Detection and suppression' },
};

/**
 * How much to trust a statement, and what kind of thing it is.
 *
 * PUBLIC FACT  Stated in publicly available documentation for the Clonee
 *              project. Carries source ids.
 * DERIVED     Arithmetic on public inputs, or deliberately simplified so the
 *              model can be rendered and read. The arithmetic is shown.
 * TYPICAL     Accepted hyperscale design practice from industry material. Not
 *              a statement about Clonee.
 * SYNTHETIC   Invented, to demonstrate a delivery or project-controls concept.
 *              Never a project fact.
 */
export type Classification = 'PUBLIC FACT' | 'DERIVED' | 'TYPICAL' | 'SYNTHETIC';

export const CLASSIFICATIONS: Classification[] = ['PUBLIC FACT', 'DERIVED', 'TYPICAL', 'SYNTHETIC'];

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Package =
  | 'CIVIL'
  | 'BUILDING'
  | 'HV'
  | 'MV/LV ELECTRICAL'
  | 'GENERATION'
  | 'MECHANICAL'
  | 'COOLING'
  | 'WATER'
  | 'FIRE'
  | 'ICT'
  | 'CONTROLS'
  | 'SECURITY'
  | 'COMMISSIONING'
  | 'IT FITOUT';

export const PACKAGE_COLOR: Record<Package, string> = {
  CIVIL: '#8fa3b8',
  BUILDING: '#b8c6d3',
  HV: '#ffcf3f',
  'MV/LV ELECTRICAL': '#f59e0b',
  GENERATION: '#ef6c3f',
  MECHANICAL: '#ff8fa3',
  COOLING: '#ff5b5b',
  WATER: '#38bdf8',
  FIRE: '#f87171',
  ICT: '#a78bfa',
  CONTROLS: '#22d3ee',
  SECURITY: '#34d399',
  COMMISSIONING: '#f2b13c',
  'IT FITOUT': '#c084fc',
};

export const PACKAGES: Package[] = [
  'CIVIL',
  'BUILDING',
  'HV',
  'MV/LV ELECTRICAL',
  'GENERATION',
  'MECHANICAL',
  'COOLING',
  'WATER',
  'FIRE',
  'ICT',
  'CONTROLS',
  'SECURITY',
  'COMMISSIONING',
  'IT FITOUT',
];

/**
 * A single statement with its own provenance.
 *
 * A component's headline classification is not enough. A component can be a
 * PUBLIC FACT while one individual bullet about it is TYPICAL. `technical`
 * accepts either a plain string, which inherits the component's
 * classification, or an explicit Claim when the statement needs its own label
 * and sources.
 */
export interface Claim {
  text: string;
  classification: Classification;
  sources?: string[];
  formula?: string;
}

export type TechnicalEntry = string | Claim;

export function toClaim(entry: TechnicalEntry, inherited: Classification): Claim {
  return typeof entry === 'string' ? { text: entry, classification: inherited } : entry;
}

export interface ComponentInfo {
  type: string;
  system: SystemKey;
  title: string;
  /** one-line "what is it" for the inspector headline */
  what: string;
  why: string;
  /** technical teaching bullets; strings inherit the component classification */
  technical: TechnicalEntry[];
  failureModes: string[];
  redundancy: string;
  upstream: string;
  downstream: string;
  voltage?: string;
  /** indicative electrical demand in kW for power-flow sizing */
  demand?: number;
  delivery: {
    wbs: string;
    package: Package;
    discipline: string;
    costBand: string;
    milestone: string;
    predecessors: string[];
    successors: string[];
  };
  cxStages: string[];
  provenance: Classification;
  facts?: string[];
  /** the boundary of the public record, shown in evidence mode */
  publicLimit?: string;
  /** interfaces that historically cause trouble on this kind of equipment */
  interfaceRisk?: string[];
  /** what a project controls team should track for this equipment */
  controlsTrack?: string[];
  /** the question to ask in a meeting about this equipment */
  meetingQuestion?: string;
}