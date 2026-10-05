import { BUILDINGS } from './campus';
import type { SystemKey } from './types';
import { CX_ORDER } from './commissioning';

/**
 * Turnover packages.
 *
 * Commissioning status belongs to systems and turnover boundaries, not to the
 * global programme. A gate on "functional-test" across the whole site tells you
 * nothing about whether a rack in CLN1 hall 2 can be accepted; what matters is
 * whether the turnover packages containing its power, cooling, network and
 * controls boundaries are signed off.
 *
 * Each package has:
 *   scope     component ids inside the turnover boundary
 *   requires  other packages that must be at least as far along first
 *   stages    the commissioning stages that apply to it, in programme order
 *
 * The cross-package `requires` edges are what produce real dependency messages:
 * a rack cannot be commissioned because the cooling distribution package for its
 * hall has not completed thermal validation.
 */

export interface TurnoverPackage {
  id: string;
  title: string;
  system: SystemKey;
  /** campus reading index 1..5, mapping to CLN1, CLN2, CLN3, CLN5, CLN6 */
  building?: number;
  /** hall index within the building, 1..4 */
  hall?: number;
  scope: string[];
  requires: string[];
  stages: string[];
  boundary: string;
  note: string;
}

const POWER_STAGES = [
  'design-review',
  'factory-test',
  'install-check',
  'electrical-test',
  'controls-test',
  'energise',
  'functional-test',
  'failure-test',
  'ist',
];

const COOLING_STAGES = [
  'design-review',
  'factory-test',
  'install-check',
  'pressure-test',
  'controls-test',
  'functional-test',
  'thermal-test',
  'failure-test',
  'ist',
];

const GEN_STAGES = [
  'design-review',
  'factory-test',
  'install-check',
  'electrical-test',
  'pressure-test',
  'controls-test',
  'energise',
  'functional-test',
  'load-test',
  'failure-test',
  'ist',
];

const IT_STAGES = ['install-check', 'functional-test', 'thermal-test', 'it-readiness', 'ist'];

const NET_STAGES = [
  'design-review',
  'factory-test',
  'install-check',
  'electrical-test',
  'controls-test',
  'functional-test',
  'it-readiness',
  'ist',
];

const CIVIL_STAGES = ['install-check', 'pressure-test', 'functional-test'];

const SUB_STAGES = [
  'design-review',
  'factory-test',
  'install-check',
  'electrical-test',
  'pressure-test',
  'controls-test',
  'energise',
  'functional-test',
  'failure-test',
  'ist',
];

export const TURNOVER_PACKAGES: TurnoverPackage[] = (() => {
  const out: TurnoverPackage[] = [];

  /* ---- the substation: its own boundary, and it gates every other package ---- */
  out.push({
    id: 'SUB',
    title: '220 kV substation and grid connection',
    system: 'power',
    scope: [
      'hv.line',
      'sub.tower1',
      'sub.tower2',
      'sub.platform',
      'sub.bay',
      'sub.xfmr',
      'sub.control',
      'sub.mvb',
    ],
    requires: [],
    stages: SUB_STAGES,
    boundary:
      'Transmission owner interface, 220 kV protection and switchyard, the step-down transformers, and the 20 kV campus boundary.',
    note: 'The upstream boundary for the whole campus, and the only package whose schedule is controlled from outside the site. EirGrid records this station as completed in August 2017, built by the customer and connected in approximately 15 months. Nothing downstream can be energised from the utility until this is signed off.',
  });

  for (const b of BUILDINGS) {
    const B = b.name;
    const n = b.n;

    out.push({
      id: `${B}.PWR`,
      title: `${B} — MV switchgear and generation interface`,
      system: 'power',
      building: n,
      scope: [`${B}.mv`, `${B}.gensw`],
      requires: ['SUB'],
      stages: POWER_STAGES,
      boundary: '20 kV MV distribution inside the building, and the emergency bus where grid and generation meet.',
      note: 'Where the grid and the generators meet. Its functional test proves the bus can be supplied from either source, which is the precondition for every utility-loss scenario. Consent RA150605 describes the underground 20 kV cables that bring supply to this point.',
    });

    out.push({
      id: `${B}.GEN`,
      title: `${B} — generation block and fuel systems`,
      system: 'power',
      building: n,
      scope: [`${B}.gen`, `${B}.genheat`, `${B}.fuel`],
      requires: [`${B}.PWR`],
      stages: GEN_STAGES,
      boundary:
        'Generator enclosures, fuel containment, engine heat rejection, and output switchgear up to the emergency bus.',
      note: 'Includes engine heat rejection, which is a separate system from hall cooling and must work while everything else is also running. The EPA licence permits these sets to run on loss of grid supply, on instability or reduction of grid supply, during maintenance, and when the transmission system operator requests a grid reduction.',
    });

    out.push({
      id: `${B}.COOL`,
      title: `${B} — heat rejection and cooling water plant`,
      system: 'cooling',
      building: n,
      scope: [`${B}.cool`, `${B}.hx`, `${B}.pump`, `${B}.plume`, 'site.wtp'],
      requires: [],
      stages: COOLING_STAGES,
      boundary:
        'Indirect air cooling units, heat exchanger skids, pumping, and the shared cooling water treatment plant.',
      note: 'Upstream of every hall cooling package in the building, and its capacity is what limits how much IT load the building can hold. The treatment plant is shared across the campus, so it is deliberately not a per-building package.',
    });

    /**
     * The shared electrical rooms are one building-level package, not one per
     * hall, because they are physically one set of rooms shared by all four
     * halls. Putting them in a hall package would make each hall appear to own
     * the same UPS, which is both wrong and the reason a component can end up in
     * four turnover packages at once.
     */
    out.push({
      id: `${B}.ELEC`,
      title: `${B} — electrical rooms (substations, UPS, batteries, LV)`,
      system: 'power',
      building: n,
      scope: [`${B}.sub`, `${B}.upsA`, `${B}.upsB`, `${B}.batt`, `${B}.lv`],
      requires: [`${B}.PWR`, `${B}.GEN`],
      stages: POWER_STAGES,
      boundary:
        'From the building MV feeder through the unit substations, UPS and batteries to the LV distribution that serves all four halls.',
      note: 'One set of electrical rooms serves four halls, so this is a building package rather than a hall package. Its functional test includes UPS transfer to battery and to bypass, and its failure test proves the redundant path really is independent. This is where most of the electrical risk on a building actually sits.',
    });

    for (let hi = 0; hi < b.halls.length; hi++) {
      const h = b.halls[hi];
      const hn = hi + 1;

      out.push({
        id: `${h}.PWR`,
        title: `${B} hall ${hn} — power distribution (busway, PDUs)`,
        system: 'power',
        building: n,
        hall: hn,
        scope: [`${h}.bus`, `${h}.pdu`],
        requires: [`${B}.ELEC`],
        stages: POWER_STAGES,
        boundary: 'From the building LV distribution into the hall busway and out to the rack PDUs.',
        note: 'The package that decides whether a rack in this hall can be energised. It sits downstream of the building electrical rooms, so a single shared UPS problem blocks all four halls at once — which is the argument for building-level granularity being visible rather than hidden.',
      });

      out.push({
        id: `${h}.COOL`,
        title: `${B} hall ${hn} — cooling distribution (in-hall air cooling, containment)`,
        system: 'cooling',
        building: n,
        hall: hn,
        scope: [`${h}.crah`, `${h}.floor`],
        requires: [`${B}.COOL`],
        stages: COOLING_STAGES,
        boundary: 'From the building heat exchanger skids to the in-hall air cooling units and containment.',
        note: 'A hall cannot accept IT load until air is available at temperature and the containment is doing its job. This is usually the package that actually gates a hall handover, not the power package: a hall can be electrically complete and thermally unable to accept IT load.',
      });

      out.push({
        id: `${h}.NET`,
        title: `${B} hall ${hn} — network fabric`,
        system: 'data',
        building: n,
        hall: hn,
        scope: [`${h}.switch`],
        requires: ['SITE.NET'],
        stages: NET_STAGES,
        boundary: 'Structured cabling, top-of-rack and aggregation switches, optics, and their telemetry.',
        note: 'Optics dominate both cost and failure here. Readiness is about verified optics and a tested topology, not about the switches being energised.',
      });

      out.push({
        id: `${h}.IT`,
        title: `${B} hall ${hn} — IT fitout (racks, servers, storage)`,
        system: 'data',
        building: n,
        hall: hn,
        scope: [`${h}.rack`, `${h}.server`, `${h}.storage`],
        requires: [`${h}.PWR`, `${h}.COOL`, `${h}.NET`],
        stages: IT_STAGES,
        boundary: 'IT equipment, including thermal validation and IT readiness testing.',
        note: 'Gated by all three preceding hall packages. Completion of this package is what Ready for Service means for a hall. The stored fans and servers are the operator’s scope, not the facility’s.',
      });
    }
  }

  out.push({
    id: 'SITE.NET',
    title: 'Campus network — meet-me rooms and core',
    system: 'data',
    scope: ['site.fibre', 'site.fibrehub', 'site.core'],
    requires: [],
    stages: NET_STAGES,
    boundary: 'Terrestrial fibre routes, carrier handoffs at the meet-me rooms, and the campus aggregation layer.',
    note: 'Consent and the project record describe two meet-me rooms per building, so external connectivity is a business-continuity question before it is a technical one. Losing the core removes external connectivity while leaving the campus able to keep computing.',
  });

  out.push({
    id: 'SITE.WATER',
    title: 'Site water — wellfield, treatment, storage and discharge',
    system: 'water',
    scope: ['site.bore', 'site.potable', 'site.ww', 'site.basin', 'site.watercourse', 'site.wtp'],
    requires: [],
    stages: CIVIL_STAGES,
    boundary: 'Cooling water make-up, potable supply, foul discharge and the stormwater attenuation and outfall system.',
    note: 'This package carries a consent obligation, not just equipment. The industrial emissions licence permits residual evaporative cooling-water discharge, so the discharge route has to be demonstrated and maintained, not merely built.',
  });

  out.push({
    id: 'SITE.FIRE',
    title: 'Fire protection and emergency systems',
    system: 'fire',
    scope: ['site.fire', 'site.admin'],
    requires: [],
    stages: ['install-check', 'pressure-test', 'controls-test', 'functional-test', 'ist'],
    boundary: 'Detection, suppression, fire water and emergency power, including interfaces to building services.',
    note: 'Interfaces with every other package, so it is rarely the long pole but frequently the last thing to close out.',
  });

  out.push({
    id: 'SITE.CIVIL',
    title: 'Site civil, roads, drainage and perimeter',
    system: 'site',
    scope: ['site.road', 'site.fence', 'site.gate', 'site.basin', 'site.watercourse'],
    requires: [],
    stages: CIVIL_STAGES,
    boundary: 'Internal roads, parking, perimeter fencing and screening, and the site drainage network.',
    note: 'Phase 1 delivered all internal and external roads and the car parking. Delivered early because every later package needs heavy access across the site, and re-entrackering finished hardstanding is expensive.',
  });

  return out;
})();

export const PACKAGE_BY_ID: Record<string, TurnoverPackage> = Object.fromEntries(
  TURNOVER_PACKAGES.map((p) => [p.id, p]),
);

/** Every package that contains a given component. */
export function packagesContaining(componentId: string): TurnoverPackage[] {
  return TURNOVER_PACKAGES.filter((p) => p.scope.includes(componentId));
}

/** Stage order as a comparable index within the programme. */
export function stageIndex(id: string) {
  return CX_ORDER.indexOf(id);
}

/** Total packages, for the commissioning panel summary. */
export function packageCount() {
  return TURNOVER_PACKAGES.length;
}