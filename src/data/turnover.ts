import { MODULES, HALL_INDEX } from './campus';
import type { SystemKey } from './types';
import { CX_ORDER } from './commissioning';

/**
 * Turnover packages.
 *
 * Commissioning status belongs to systems and turnover boundaries, not to the
 * global programme. A gate on "functional-test" across the whole site tells you
 * nothing about whether Rack M1-W-118 can be accepted; what matters is whether
 * the turnover packages that contain its power, cooling, network and controls
 * boundaries are signed off.
 *
 * Each package has:
 *   scope     - component ids inside the turnover boundary
 *   requires  - other packages that must be at least as far along first
 *   stages    - the commissioning stages that apply to it, in programme order
 *
 * Cross-package `requires` edges are what produce real dependency messages:
 * "rack cannot be commissioned because the cooling turnover package has not
 * completed leak detection".
 */

export interface TurnoverPackage {
  id: string;
  title: string;
  system: SystemKey;
  module?: number;
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
const GXP_STAGES = [
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

  /* ---- grid exit point: its own boundary, gates everything electrical ---- */
  out.push({
    id: 'GXP',
    title: 'Grid exit point / substation',
    system: 'power',
    scope: ['gxp.platform', 'gxp.xfmr', 'gxp.bay', 'gxp.ctrl', 'gxp.tower1', 'gxp.tower2', 'gxp.tower3', 'gxp.tower4'],
    requires: [],
    stages: GXP_STAGES,
    boundary: 'Transmission owner interface, HV protection, and the campus MV boundary.',
    note: 'The upstream boundary for the whole campus. Nothing downstream can be energised from the utility until this is signed off, and its schedule is controlled by the transmission owner rather than the site programme.',
  });

  for (const mod of MODULES) {
    const m = mod.id;
    out.push({
      id: `${m}.PWR`,
      title: `Module ${mod.n} — MV switchgear and generation interface`,
      system: 'power',
      module: mod.n,
      scope: [`${m}.mv`, `${m}.gensw`],
      requires: ['GXP'],
      stages: POWER_STAGES,
      boundary: 'MV distribution and the emergency bus, including the interface to the generation plant.',
      note: 'This is where the grid and the generators meet. Its functional test proves the bus can be supplied from either source, which is the precondition for every utility-loss scenario.',
    });
    out.push({
      id: `${m}.GEN`,
      title: `Module ${mod.n} — generation block and fuel systems`,
      system: 'power',
      module: mod.n,
      scope: [
        ...mod.halls.flatMap((h) => [`${h}.gen`, `${h}.fuel`, `${h}.genheat`]),
      ],
      requires: [`${m}.PWR`],
      stages: GEN_STAGES,
      boundary: 'Generator enclosures, fuel containment, engine heat rejection, and output switchgear up to the emergency bus.',
      note: 'Includes engine heat rejection. It is a separate system from the hall cooling turnover packages, and it must work while everything else is also running.',
    });
    out.push({
      id: `${m}.COOL`,
      title: `Module ${mod.n} — heat rejection and water plant`,
      system: 'cooling',
      module: mod.n,
      scope: [`${m}.cool`, `${m}.hx`, `${m}.pump`, `${m}.plume`, 'site.wtp'],
      requires: [],
      stages: COOLING_STAGES,
      boundary: 'Heat rejection units, heat exchanger skids, pumping and the cooling water treatment plant.',
      note: 'Upstream of every hall cooling package. Its capacity is what limits how much IT load the module can hold, so it is on the critical path for Ready for Service.',
    });

    for (const hallId of mod.halls) {
      const h = hallId;
      const hn = HALL_INDEX[hallId];
      out.push({
        id: `${h}.PWR`,
        title: `Hall ${hn} — power train (substation, UPS, batteries, busway, PDUs)`,
        system: 'power',
        module: mod.n,
        hall: hn,
        scope: [`${h}.sub`, `${h}.upsA`, `${h}.upsB`, `${h}.batt`, `${h}.lv`, `${h}.bus`, `${h}.pdu`],
        requires: [`${m}.PWR`, `${m}.GEN`],
        stages: POWER_STAGES,
        boundary: 'From the hall MV feeder to the rack PDUs, excluding the IT equipment itself.',
        note: 'The package that actually decides whether a rack can be energised. Its functional test includes UPS transfer to battery and bypass, and the failure test proves the redundant path really is independent.',
      });
      out.push({
        id: `${h}.COOL`,
        title: `Hall ${hn} — cooling distribution (CDUs, in-row cooling, leak detection)`,
        system: 'cooling',
        module: mod.n,
        hall: hn,
        scope: [`${h}.cdu`, `${h}.crah`, `${h}.cold`, `${h}.res`],
        requires: [`${m}.COOL`],
        stages: COOLING_STAGES,
        boundary: 'From the module heat rejection to the cold plates and in-row units, including leak detection zoning.',
        note: 'A hall cannot accept IT load until coolant is available at temperature and leaks can be detected. This is usually the package that actually gates a hall handover, not the power package.',
      });
      out.push({
        id: `${h}.NET`,
        title: `Hall ${hn} — network fabric`,
        system: 'data',
        module: mod.n,
        hall: hn,
        scope: [`${h}.switch`],
        requires: ['SITE.NET'],
        stages: NET_STAGES,
        boundary: 'Structured cabling, top-of-rack and aggregation switches, optics and their telemetry.',
        note: 'Optics dominate both cost and failure here. Readiness is about verified optics and a tested topology, not about the switches being energised.',
      });
      out.push({
        id: `${h}.IT`,
        title: `Hall ${hn} — IT fitout (racks, accelerators, storage)`,
        system: 'data',
        module: mod.n,
        hall: hn,
        scope: [`${h}.rack`, `${h}.gpu`, `${h}.storage`],
        requires: [`${h}.PWR`, `${h}.COOL`, `${h}.NET`],
        stages: IT_STAGES,
        boundary: 'IT equipment, including thermal validation and IT readiness testing.',
        note: 'Gated by all three preceding hall packages. This is the package whose completion defines Ready for Service for the hall.',
      });
    }
  }

  out.push({
    id: 'SITE.NET',
    title: 'Campus network — landing station and core',
    system: 'data',
    scope: ['site.fibre', 'site.landing', 'site.core'],
    requires: [],
    stages: NET_STAGES,
    boundary: 'Subsea cable landing, carrier handoffs and the campus aggregation layer.',
    note: 'Own security and power regime. Loss of this building removes external connectivity while leaving the campus able to keep computing.',
  });
  out.push({
    id: 'SITE.WATER',
    title: 'Site water — storage, bores, treatment and discharge',
    system: 'water',
    scope: ['site.bore', 'site.potable', 'site.ww', 'site.basin', 'site.wetland'],
    requires: [],
    stages: CIVIL_STAGES,
    boundary: 'Cooling water storage and make-up, potable supply, wastewater discharge and the stormwater recharge system.',
    note: 'Includes a consent obligation, not just equipment: the wetland recharge system has to be demonstrated, not just built.',
  });
  out.push({
    id: 'SITE.FIRE',
    title: 'Fire protection and emergency systems',
    system: 'fire',
    scope: ['site.fire'],
    requires: [],
    stages: ['install-check', 'pressure-test', 'controls-test', 'functional-test', 'ist'],
    boundary: 'Detection, suppression, fire water and emergency power, including interfaces to building services.',
    note: 'Interfaces with every other package, so it is rarely the long pole but frequently the last thing to close out.',
  });

  return out;
})();

export const PACKAGE_BY_ID: Record<string, TurnoverPackage> = Object.fromEntries(
  TURNOVER_PACKAGES.map((p) => [p.id, p]),
);

export function packagesContaining(componentId: string): TurnoverPackage[] {
  return TURNOVER_PACKAGES.filter((p) => p.scope.includes(componentId));
}

/** Stage order as a comparable index within the programme. */
export function stageIndex(id: string) {
  return CX_ORDER.indexOf(id);
}