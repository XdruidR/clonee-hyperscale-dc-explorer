import { INPUTS, derived, fmt } from './calculations';
import type { Classification } from './types';

/**
 * Rack archetypes.
 *
 * There is no single universal rack power architecture, and pretending there is
 * one teaches the wrong mental model. A current AI hall commonly carries
 * three-phase power much deeper into the rack than the conventional
 * single-phase-per-outlet picture suggests, and some rack-scale systems convert
 * to an internal DC bus.
 *
 * Switching archetype recalculates the whole chain:
 *   IT MW -> rack density -> rack count -> distribution -> cooling -> water -> network
 *
 * All archetype parameters are TYPICAL. The 240 MW IT input is PUBLIC FACT; how
 * it is divided into racks is not published.
 */

export interface RackArchetype {
  id: string;
  name: string;
  summary: string;
  classification: Classification;
  /** typical rack density */
  rackDensityKw: [number, number];
  coolingMix: string;
  rackPowerArchitecture: string;
  distributionNotes: string[];
  fabricNotes: string[];
  limits: string[];
  /** what usually limits this design */
  limitingFactors: string[];
}

export const RACK_ARCHETYPES: RackArchetype[] = [
  {
    id: 'conventional',
    name: 'A — Conventional cloud rack',
    summary: 'Lower rack density, mostly air cooled, dual-corded single-phase server power supplies.',
    classification: 'TYPICAL',
    rackDensityKw: [10, 20],
    coolingMix: 'Air cooled. In-row or room air handling does essentially all of the work.',
    rackPowerArchitecture:
      'Three-phase hall supply to a rack PDU, split into single-phase branch circuits. Each server has two power supplies fed from different circuits or different PDUs.',
    distributionNotes: [
      'Busway or overhead tray feeding rack PDUs, which is the conventional arrangement',
      'Split-phase circuits in the 110-240 V range per server, not three-phase per server',
      'Cord-and-conductor management dominates the floor design',
    ],
    fabricNotes: [
      'Two or four 10/25/40G links per host to leaf switches',
      'Storage on a separate front-end fabric rather than the east-west fabric',
      'Redundancy is straightforward: dual-homed hosts, dual-homed leaves',
    ],
    limits: ['Cooling capacity and floor area', 'Power density per rack in older halls', 'Cable count and airflow management'],
    limitingFactors: ['Airflow and containment', 'Rack count per hall for a given IT load', 'Structured cabling effort'],
  },
  {
    id: 'hybrid',
    name: 'B — High-density hybrid rack',
    summary: 'Moderate to high rack density with direct liquid cooling for accelerators and residual air cooling.',
    classification: 'TYPICAL',
    rackDensityKw: [30, 70],
    coolingMix:
      'Direct-to-chip liquid cooling for accelerators, with in-row air handling still removing the heat from power supplies, memory and network gear.',
    rackPowerArchitecture:
      'Increasingly three-phase into a rack power shelf, with DC distribution inside the rack rather than AC all the way to each server.',
    distributionNotes: [
      'Busway sections sized for much higher current per rack',
      'Rack power shelves converting and distributing internally',
      'More tap-off units and a higher fault-current study',
    ],
    fabricNotes: [
      'Higher-radix switch ports per host, often 100G or more to the fabric',
      'Front-end and east-west fabrics are more distinctly separated',
      'Optics count and cleanliness become an operational issue',
    ],
    limits: ['CDU capacity and floor space for CDUs', 'Cooling water temperature and approach', 'Switch power in the rack top'],
    limitingFactors: ['CDU capacity and redundancy', 'Fabric bandwidth and optics supply', 'Leak risk and detection zoning'],
  },
  {
    id: 'ai-rack-scale',
    name: 'C — Rack-scale AI system',
    summary: 'Rack-scale systems of roughly 100-150 kW or more, liquid-dominant, high-power three-phase in.',
    classification: 'TYPICAL',
    rackDensityKw: [100, 150],
    coolingMix:
      'Liquid cooling dominant. Air remains for the power shelves and switches, but the accelerators are almost entirely on cold plates.',
    rackPowerArchitecture:
      'High-power three-phase feed to a rack power shelf, which converts to an internal DC busbar. There is no per-server AC distribution and usually no per-server dual PSU: redundancy moves up to the shelf and the feed.',
    distributionNotes: [
      'Very high current per rack, so busway, tap-off and protection are sized around it',
      'Redundancy is at shelf and feed level rather than per server',
      'Upstream capacity and fault levels are a real design constraint',
    ],
    fabricNotes: [
      'Extreme east-west bandwidth: a rack-scale system is a single network domain',
      'Collective communication patterns dominate traffic, not storage reads',
      'Congestion, oversubscription and collective-communication behaviour become design inputs',
    ],
    limits: ['Coolant delivery and return capacity per rack', 'Supply temperature above the dew point', 'East-west fabric and optics supply'],
    limitingFactors: ['Fabric bandwidth and collective-communication behaviour', 'Optics supply and fibre quality', 'Cooling water temperature at the design wet-bulb'],
  },
];

export interface ArchetypeChain {
  archetype: RackArchetype;
  rackDensityKw: number;
  racksTotal: number;
  racksPerHall: number;
  hallFloorPerRackM2: number;
  coolingToLiquidShare: number;
  pduPowerPerRackKw: number;
  buswayCurrentPerRackA: number;
  /** MW of heat that must be rejected, which is simply the IT load */
  heatToRejectMw: number;
  /** MW of compressor load implied by the residual air cooling (liquid cooling has none) */
  compressorLoadMw: number;
  /** m3/yr of cooling water, using the campus water intensity from the canonical calculation */
  coolingWaterM3Yr: number;
  /** estimate of east-west ports implied, illustrative only */
  networkPortsPerRack: number;
  assumptions: string[];
}

const WATER_INTENSITY_M3_PER_MWH = derived.waterM3PerMwhIt;

/**
 * The recalculation chain, driven entirely off the canonical inputs. The
 * per-unit factors are TYPICAL and are listed in `assumptions` so the panel can
 * show them rather than hide them.
 */
export function chainFor(archetype: RackArchetype, itMw = 240): ArchetypeChain {
  const density = (archetype.rackDensityKw[0] + archetype.rackDensityKw[1]) / 2;
  const racksTotal = Math.round((itMw * 1000) / density);
  const racksPerHall = Math.round(racksTotal / 6);
  const liquidShare =
    archetype.id === 'conventional' ? 0 : archetype.id === 'hybrid' ? 0.6 : 0.9;
  const airMw = itMw * (1 - liquidShare);
  /* Heat rejected is just the IT load. What differs between archetypes is how
     much of it is carried by liquid (no compressor penalty) versus air (needs
     compression). Air-side here means a wet-bulb-limited or compression-assisted
     arrangement, so ~20% compressor load is a reasonable TYPICAL allowance. */
  const compressorLoadMw = airMw * 0.2;
  const buswayA = (density * 1000) / (Math.sqrt(3) * 415) / 0.95;
  return {
    archetype,
    rackDensityKw: density,
    racksTotal,
    racksPerHall,
    hallFloorPerRackM2: (8_210 * 6) / racksTotal,
    coolingToLiquidShare: liquidShare,
    pduPowerPerRackKw: density * 0.98,
    buswayCurrentPerRackA: buswayA,
    heatToRejectMw: itMw,
    compressorLoadMw,
    coolingWaterM3Yr: itMw * INPUTS.hoursPerYear * WATER_INTENSITY_M3_PER_MWH,
    networkPortsPerRack: archetype.id === 'conventional' ? 2 : archetype.id === 'hybrid' ? 4 : 8,
    assumptions: [
      'rack density is the midpoint of the archetype range',
      `three-phase at 415 V for the busway current estimate, and ${fmt(0.95, 2)} power factor`,
      'heat rejected equals the IT load; the archetype difference is the compressor penalty on the residual air fraction, taken as 20% of the air-cooled share',
      'cooling water uses the campus water intensity derived from the published demand and IT load',
      'port counts are illustrative of the class, not a design',
    ],
  };
}

/**
 * The layered view of the network, which is more useful than showing only
 * fibre geometry. Each layer answers a different question and has a different
 * limiting factor.
 */
export interface NetworkLayer {
  id: string;
  name: string;
  path: string;
  purpose: string;
  limitingFactors: string[];
  classification: Classification;
}

export const NETWORK_LAYERS: NetworkLayer[] = [
  {
    id: 'wan',
    name: 'External / WAN',
    path: 'Subsea cable → landing station → external routing → campus edge',
    purpose: 'Carries traffic to and from the internet and to other facilities.',
    limitingFactors: [
      'Physical fibre availability and route diversity',
      'Landing station power and cooling, which are usually their own single point of failure',
      'Carrier capacity and peering arrangements',
    ],
    classification: 'PUBLIC FACT',
  },
  {
    id: 'core',
    name: 'Campus core',
    path: 'Campus core → hall aggregation',
    purpose: 'Aggregation and routing. Where access, peering and inter-hall traffic meet.',
    limitingFactors: ['Device capacity and uplink oversubscription', 'Control-plane stability', 'Power and cooling of the core room'],
    classification: 'TYPICAL',
  },
  {
    id: 'mgmt',
    name: 'Management / out-of-band',
    path: 'BMC → management switches → operations and automation',
    purpose:
      'Delivers remote console, power control, firmware and telemetry. Deliberately separate from the workload networks, because that is the point of it.',
    limitingFactors: [
      'Segregation from the workload fabric',
      'Credential and access management for who can reach a BMC',
      'Keeping it working when the workload fabric is broken, which is when it is needed',
    ],
    classification: 'TYPICAL',
  },
  {
    id: 'storage',
    name: 'Storage / front-end fabric',
    path: 'storage ↔ compute',
    purpose: 'Moves datasets and checkpoints to and from the compute nodes.',
    limitingFactors: [
      'Rebuild storms after a storage failure, which can saturate the fabric',
      'Sequential read patterns at very high concurrency',
      'Whether storage sits in a separate power and cooling domain',
    ],
    classification: 'TYPICAL',
  },
  {
    id: 'east-west',
    name: 'Accelerator / east-west fabric',
    path: 'GPU ↔ GPU ↔ GPU',
    purpose:
      'Carries the traffic that actually consumes the fabric: the collectives a training job performs thousands of times a second.',
    limitingFactors: [
      'Collective-communication patterns, which behave very differently from storage traffic',
      'Oversubscription ratio and where congestion appears',
      'Optics supply, optics quality and fibre cleanliness',
      'Topology, especially the radix and the number of hops a message takes',
    ],
    classification: 'TYPICAL',
  },
];