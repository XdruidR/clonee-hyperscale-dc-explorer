/**
 * Rack archetypes: the chain from campus IT megawatts to a single rack.
 *
 * The first archetype is Clonee as delivered. The other two are what the same
 * floor area could carry today. Keeping them in one model is the point: the
 * comparison is only honest when the delivered design and the proposed design
 * are run through identical arithmetic.
 *
 * Every figure for the delivered archetype is DERIVED from published Clonee
 * inputs — 36 MW per building, four halls per building, 4,170 m² per hall,
 * 2.24 kW/m². Nothing about the internal rack layout is published, so the rack
 * count is arithmetic.
 */

import { INPUTS, derived } from './calculations';

export interface RackArchetype {
  id: string;
  name: string;
  summary: string;
  classification: 'DERIVED' | 'TYPICAL';
  /** kW per rack, [min, max] */
  rackDensityKw: [number, number];
  /** fraction of rack heat carried by liquid rather than air */
  coolingMix: string;
  rackPowerArchitecture: string;
  distributionNotes: string[];
  fabricNotes: string[];
  limits: string[];
  /** the physical and commercial constraints that actually decide the design */
  limitingFactors: string[];
}

export const RACK_ARCHETYPES: RackArchetype[] = [
  {
    id: 'clonee-delivered',
    name: 'Clonee as delivered, 2017–2021',
    summary:
      'Air-cooled racks in an indirectly air-cooled hall. The whole heat path is air: rack air to in-hall cooling, to a heat exchanger, to air-cooled rejectors outside, with a small evaporative assist on the hottest hours.',
    classification: 'DERIVED',
    rackDensityKw: [10, 15],
    coolingMix: '100% air',
    rackPowerArchitecture:
      '400/415 V three-phase into the rack, or 230 V single-phase on the rows. No DC distribution, no on-rack conversion of consequence.',
    distributionNotes: [
      'Busway in the hall, tap-offs to rack PDUs, dual A and B feeds so one feed can be isolated without dropping the rack.',
      'Building-level distribution sized for a load of this density leaves plenty of headroom for anything denser.',
    ],
    fabricNotes: [
      '40 to 100 Gb/s to the rack is generous for this density and was the right design at the time.',
      'Storage traffic, not compute traffic, is what fills the fibre.',
    ],
    limits: [
      'Air cooling tops out around 20–30 kW per rack before the airflow itself becomes the constraint.',
      'Above that the hall needs liquid, and a hall with no liquid loop cannot simply be given one.',
    ],
    limitingFactors: [
      'The building itself: bar form, floor loading, and a plant corridor designed for air-side heat rejection.',
      'Electrical headroom, which this design has in abundance and which is the only reason a retrofit is physically possible at all.',
    ],
  },
  {
    id: 'modern-air',
    name: 'Modern air-cooled compute',
    summary:
      'What the same hall could carry with faster air cooling and higher-density servers, before liquid arrives. Rack power roughly triples and the airflow problem becomes the design problem.',
    classification: 'TYPICAL',
    rackDensityKw: [30, 60],
    coolingMix: '100% air',
    rackPowerArchitecture:
      'Three-phase at higher current. A 60 kW rack draws about 84 A on 415 V three-phase, so the per-rack feeder and tap-off become the constraint rather than the hall feeder.',
    distributionNotes: [
      'Per-rack current rises faster than per-rack power because the power factor of modern accelerators is lower.',
      'Existing rack PDUs and busway tap-offs sized for 12.5 kW are several times undersized for this.',
      'Busway may be reusable as infrastructure while tap-offs and PDUs are not.',
    ],
    fabricNotes: [
      'Compute is now east-west dominant, so the top-of-rack switch count and optical count rise sharply.',
      'A 60 kW rack typically carries 2 to 4 times the network ports of a conventional rack.',
    ],
    limits: [
      'Air is a poor conductor and a poor carrier. Above roughly 30 kW per rack the fan power and the acoustic problem stop being manageable.',
      'Rack depth and rear clearance stop accommodating the airflow that this density needs.',
    ],
    limitingFactors: [
      'Airflow. This is the whole design problem at this density.',
      'Rack PDU and tap-off current capacity.',
      'The acoustic and containment strategy of the hall.',
    ],
  },
  {
    id: 'ai-liquid',
    name: 'Rack-scale liquid-cooled AI',
    summary:
      'A rack-scale system where the compute tray is a single sealed unit taking 50 V DC from power shelves in the same rack, and roughly nine-tenths of the heat is captured by cold plates rather than by air. This is not an upgrade to Clonee; it is a different building.',
    classification: 'TYPICAL',
    rackDensityKw: [120, 192],
    coolingMix: 'About 90% liquid, 10% air',
    rackPowerArchitecture:
      'The rack is the unit of supply. Power shelves convert AC to 50 V DC inside the rack, an internal busbar carries it to the compute trays, and the whole rack arrives by a single high-current three-phase whip connection.',
    distributionNotes: [
      'Busway must be provisioned to the worst case, not the operating case: about 267 A per rack at the design point rather than the 184 A drawn in normal operation.',
      'That is several times the current of the delivered design per rack, so busway, tap-offs and PDUs are all replaced.',
      'Whole-rack replacement rather than component replacement changes the maintenance model completely.',
    ],
    fabricNotes: [
      'The rack-scale switch fabric is part of the rack, which removes a whole layer of the network design.',
      'Power and network both enter at the rack as one pre-assembled assembly.',
    ],
    limits: [
      'The 10% of heat still going to air means in-hall air cooling cannot be removed, only supplemented.',
      'Supply temperature matters enormously. Modern platforms warrant coolant inlet up to about 45 °C, which is what makes dry-cooler-only heat rejection viable in a temperate climate.',
      'A hall with an air-side primary loop cannot natively accept this. Realistic paths are liquid-to-air sidecar units, or a wholesale conversion to a chilled-water loop.',
    ],
    limitingFactors: [
      'Electricity. Not floor area. This is the finding that matters most.',
      'Structural floor loading: a loaded rack-scale system is roughly 2,100 kg/m² against a conventional design of about 1,500 kg/m².',
      'Busway and tap-off current capacity, several times undersized.',
      'Whether the hall has a water loop that can be re-piped to deliver 32–45 °C supply, or must be bypassed entirely.',
    ],
  },
];

export interface ArchetypeChain {
  archetype: RackArchetype;
  rackDensityKw: number;
  racksTotal: number;
  racksPerBuilding: number;
  racksPerHall: number;
  hallFloorPerRackM2: number;
  coolingToLiquidShare: number;
  coolingToAirShare: number;
  /** amps per rack on 415 V three-phase, at the archetype's nominal density */
  buswayCurrentPerRackA: number;
  /** amps per rack at the worst-case design point, which is what gets provisioned */
  buswayCurrentPerRackEdbpA: number;
  heatToRejectMw: number;
  heatToLiquidMw: number;
  heatToAirMw: number;
  /** coolant flow implied by ΔT = Q / (ṁ · c_p) */
  coolantFlowLPerMinPerRack: number;
  coolingWaterM3Yr: number;
  networkPortsPerRack: number;
  /** share of the existing IT floor area's rack positions that the supply can fund */
  rackPositionUtilisationPct: number;
  assumptions: { key: string; value: number; note: string }[];
}

/**
 * Run an archetype through the arithmetic, on the Clonee campus.
 *
 * `itMw` defaults to the consent-derived campus capacity. The interesting
 * result is `rackPositionUtilisationPct`: for every archetype it is far below
 * 100%, because the campus has far more floor than it has electricity.
 */
export function chainFor(archetypeId: string, itMw = derived.itCapacityMW): ArchetypeChain {
  const a = RACK_ARCHETYPES.find((x) => x.id === archetypeId) ?? RACK_ARCHETYPES[0];

  const hallFloorM2 = INPUTS.hallFloorM2;
  const hallsPerBuilding = INPUTS.hallsPerBuilding;
  const buildingCount = INPUTS.buildingCount;
  const hallCount = buildingCount * hallsPerBuilding;

  /* Nominal rack density for this archetype, biased to the upper half of the
     published band because that is where a real estate returns are aimed. */
  const density = a.rackDensityKw[0] + (a.rackDensityKw[1] - a.rackDensityKw[0]) * 0.6;
  /* Provision for the worst case rather than the operating case. */
  const edbp = a.rackDensityKw[1];

  const racksTotal = Math.round((itMw * 1000) / density);
  const racksPerHall = Math.ceil(racksTotal / hallCount);
  const racksPerBuilding = racksPerHall * hallsPerBuilding;

  const liquidShare = a.id === 'clonee-delivered' ? 0 : a.id === 'modern-air' ? 0 : INPUTS.aiLiquidShare;
  const airShare = 1 - liquidShare;

  const itHeatMw = itMw;
  const heatToLiquidMw = itHeatMw * liquidShare;
  const heatToAirMw = itHeatMw * airShare;

  /* Three-phase current. Irish campus distribution is 400/415 V. */
  const v = Math.sqrt(3) * INPUTS.buswayVolts;
  const buswayCurrentPerRackA = (density * 1000) / v;
  const buswayCurrentPerRackEdbpA = (edbp * 1000) / v;

  /* Coolant flow from first principles: ṁ = Q / (c_p · ΔT). */
  const cP = 4.18; // kJ/kg·K for water
  const dT = INPUTS.aiDeltaTK;
  const coolantFlowLPerMinPerRack =
    liquidShare > 0 ? ((density * liquidShare * dT) / (cP * dT)) * 60 : 0;

  /* Water: only the liquid share is evaporatively assisted. The air share is
     rejected to atmosphere with no water involved. */
  const coolingWaterM3Yr = (heatToLiquidMw * 1000 * derived.hoursPerYear * 3.6 * 0.1) / 2.44;

  const networkPortsPerRack = a.id === 'clonee-delivered' ? 2 : a.id === 'modern-air' ? 4 : 8;

  /* How much of the campus IT floor area could physically be racked, against
     how much of it the electrical supply can actually fund. */
  const rackPositionsInItArea = Math.round(INPUTS.itAreaM2 / INPUTS.rackSpaceM2);
  const fundedRacks = Math.round((itMw * 1000) / density);
  const rackPositionUtilisationPct = (fundedRacks / rackPositionsInItArea) * 100;

  return {
    archetype: a,
    rackDensityKw: density,
    racksTotal,
    racksPerBuilding,
    racksPerHall,
    hallFloorPerRackM2: hallFloorM2 / racksPerHall,
    coolingToLiquidShare: liquidShare,
    coolingToAirShare: airShare,
    buswayCurrentPerRackA,
    buswayCurrentPerRackEdbpA,
    heatToRejectMw: itHeatMw,
    heatToLiquidMw,
    heatToAirMw,
    coolantFlowLPerMinPerRack,
    coolingWaterM3Yr,
    networkPortsPerRack,
    rackPositionUtilisationPct,
    assumptions: [
      { key: 'Rack density', value: density, note: 'Upper-biased point in the published band for this archetype.' },
      { key: 'Hall floor area', value: hallFloorM2, note: 'Published: approximately 4,170 m² per hall.' },
      { key: 'Halls', value: hallCount, note: 'DERIVED: five buildings of four halls.' },
      { key: 'Distribution voltage', value: INPUTS.buswayVolts, note: 'Irish three-phase distribution voltage.' },
      { key: 'Liquid capture share', value: liquidShare, note: 'Published platform figure for rack-scale systems. Not a Clonee value.' },
      { key: 'Coolant design ΔT', value: dT, note: 'Common facility-water design delta for liquid cooling.' },
      { key: 'Evaporative assist', value: 0.1, note: 'Irish climate: outside-air free cooling carries most of the year.' },
    ],
  };
}

/* ------------------------------------------------------------------ network */

export interface NetworkLayer {
  id: string;
  name: string;
  path: string;
  purpose: string;
  limitingFactors: string[];
  classification: 'PUBLIC FACT' | 'DERIVED' | 'TYPICAL';
}

/**
 * The network in layers, from the county boundary to the rack.
 *
 * Clonee is an overland fibre campus, not a subsea landing. The project record
 * describes two meet-me rooms per building for data connectivity, which makes
 * external connectivity the first layer to think about and the one most often
 * assumed rather than designed.
 */
export const NETWORK_LAYERS: NetworkLayer[] = [
  {
    id: 'carrier',
    name: 'Carrier and terrestrial fibre',
    path: 'National backhaul to the Clonee site boundary',
    purpose: 'Bring traffic from the rest of the network into the campus.',
    limitingFactors: ['Carrier availability and diversity at the Clonee exchange', 'Physical route and duct capacity'],
    classification: 'TYPICAL',
  },
  {
    id: 'route',
    name: 'Two diverse site routes',
    path: 'Two physically separate routes from the boundary to the campus',
    purpose: 'So that one excavation, one duct or one bridge does not remove external connectivity.',
    limitingFactors: [
      'Diversity is easy to draw and easy to lose: shared ducting, a shared bridge or a shared landlord compound removes it entirely.',
      'Both routes need to be visible to both ends of the ring, or a break is invisible until someone traces it.',
    ],
    classification: 'TYPICAL',
  },
  {
    id: 'meetme',
    name: 'Meet-me rooms',
    path: 'Two meet-me rooms per building',
    purpose: 'Carrier handoff and interconnection, physically separated for security and for failure.',
    limitingFactors: [
      'A published project characteristic of this campus: two meet-me rooms per building.',
      'Access control and physical separation are as much a requirement as the cabling.',
    ],
    classification: 'PUBLIC FACT',
  },
  {
    id: 'core',
    name: 'Campus aggregation core',
    path: 'Campus core feeding each building',
    purpose: 'Terminate and redistribute external traffic into the building networks.',
    limitingFactors: ['Single building, so its loss is campus-wide loss of external connectivity while compute continues'],
    classification: 'DERIVED',
  },
  {
    id: 'hall-fabric',
    name: 'Building fabric',
    path: 'Building aggregation to hall',
    purpose: 'Present a stable topology to each hall regardless of what the fabric outside is doing.',
    limitingFactors: ['Optical budget', 'Card and port capacity'],
    classification: 'TYPICAL',
  },
  {
    id: 'rack',
    name: 'Top-of-rack',
    path: 'Top-of-rack switch to each server',
    purpose: 'The last hop into the compute.',
    limitingFactors: [
      'Port count and optical count dominate cost and failure.',
      'Rack density drives this hard: a modern rack-scale system carries its own switch fabric, which removes this layer entirely.',
    ],
    classification: 'TYPICAL',
  },
];