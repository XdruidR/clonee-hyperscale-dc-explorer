/**
 * The project-controls layer.
 *
 * The brief is explicit that the delivery data does not need to be historical
 * Clonee data — it has to be coherent with the physical model and realistic for
 * a project of this type and scale. So the dataset is generated here rather
 * than tabulated, and every anchor it uses is a published figure:
 *
 *   - €1.4bn cumulative investment on 219 MW, from the operator (META-DC),
 *     which gives a cost-per-MW that the whole cost plan is built from.
 *   - An announced €300m for the original two buildings and up to 72 MW in
 *     2018 (PRESS-ECO), about €4.2m per MW. This is the era-matched figure and
 *     it is materially lower, because it excludes the substation, the
 *     expansion and later cost escalation. Both are shown.
 *   - The elemental split from the published UK data-centre cost model
 *     (IND-SAV), with electrical at 31% and commissioning at 2% of MEP value.
 *   - 1,500 skilled trades at peak on this campus (META-DC).
 *
 * Everything below the anchors is SYNTHETIC and labelled as such.
 */

import { INPUTS, derived, ASSUMPTIONS, fmt, fmtInt } from './calculations';
import { PHASES, CUMULATIVE_MONTHS } from './phases';

const A = Object.fromEntries(ASSUMPTIONS.map((x) => [x.key, x.value])) as Record<string, number>;

/* ------------------------------------------------------------------- budget */

/**
 * Work breakdown structure, level 1 and 2.
 *
 * Cost shares are a synthetic allocation built on the published elemental
 * breakdown. The WBS codes themselves follow the standard convention where a
 * code is deliverable-based rather than cost-type-based.
 */
export interface WbsCode {
  code: string;
  name: string;
  /** share of the total budget, summing to 1 across level 1 */
  share: number;
  children?: { code: string; name: string; share: number }[];
  /** what this code buys, in one line */
  delivers: string;
  /** who holds it */
  discipline: string;
}

export const WBS: WbsCode[] = [
  {
    code: '1.0',
    name: 'DATA CENTRE CAMPUS',
    share: 1,
    delivers: 'The whole consented campus at Clonee.',
    discipline: 'Project controls',
    children: [
      { code: '1.1', name: 'Project initiation and feed', share: 0.06 },
      { code: '1.2', name: 'Design and professional services', share: 0.09 },
      { code: '1.3', name: 'Substation and grid connection', share: 0.13 },
      { code: '1.4', name: 'Buildings', share: 0.19 },
      { code: '1.5', name: 'Electrical', share: 0.24 },
      { code: '1.6', name: 'Mechanical and cooling', share: 0.13 },
      { code: '1.7', name: 'Generation', share: 0.07 },
      { code: '1.8', name: 'Fire, life safety and security', share: 0.04 },
      { code: '1.9', name: 'Commissioning', share: 0.02 },
      { code: '1.10', name: 'External works, drainage and preliminaries', share: 0.03 },
    ],
  },
];

/** Flattened level-2 view, which is what the panel actually renders. */
export interface BudgetLine {
  code: string;
  name: string;
  /** million euro */
  budgetM: number;
  share: number;
  /** percent complete at the current data date */
  completePct: number;
  /** million euro */
  spentM: number;
  /** million euro */
  committedM: number;
  /** million euro, forecast at completion */
  forecastM: number;
  delivers: string;
  discipline: string;
  status: 'not-started' | 'in-progress' | 'complete' | 'overrun';
}

const LINE_META: Record<string, { delivers: string; discipline: string }> = {
  '1.1': { delivers: 'Site acquisition, consents, grid connection application, design brief.', discipline: 'Project management' },
  '1.2': { delivers: 'Multi-disciplinary design, commissioning plan, project management and QS.', discipline: 'Design consultants' },
  '1.3': {
    delivers:
      '220 kV substation compound, 12 bays, three step-down transformers, two new transmission towers, the loop-in, and the underground 20 kV cable network to each building.',
    discipline: 'HV electrical',
  },
  '1.4': { delivers: 'Five data-storage bars of about 25,000–29,000 m² each, plus two administration buildings.', discipline: 'Civil and structural' },
  '1.5': {
    delivers: 'MV switchgear, unit substations, UPS and batteries, busway, PDUs and containment across twenty halls.',
    discipline: 'Electrical',
  },
  '1.6': {
    delivers: 'Indirect air cooling units, heat exchanger skids, pumps, in-hall cooling, cooling water treatment, and the evaporative assist.',
    discipline: 'Mechanical',
  },
  '1.7': { delivers: 'Ninety diesel generators with fuel systems, acoustic enclosures and engine heat rejection.', discipline: 'Generation' },
  '1.8': { delivers: 'Detection, suppression, fire water, emergency power, perimeter and access control.', discipline: 'Fire and security' },
  '1.9': { delivers: 'Factory, site, functional, load and integrated systems testing through to handover.', discipline: 'Commissioning' },
  '1.10': { delivers: 'Internal roads, parking, drainage, attenuation, watercourse interface and site establishment.', discipline: 'Civil' },
};

/** The whole campus, on the operator's published cost-per-MW. */
export const TOTAL_BUDGET_M = derived.itCapacityMW * derived.costPerMwPublished;

/** Per-code weighting across the programme, so spend follows physical progress. */
function lineProgress(code: string, phase: number): number {
  /* Each code starts and finishes at a different point in the programme. This
     is the shape of a real data-centre programme: consent and design first, the
     substation long and early, buildings and MEP overlapping heavily, and
     commissioning trailing everything it depends on. */
  const window: Record<string, [number, number]> = {
    '1.1': [0, 3],
    '1.2': [0, 8],
    '1.3': [4, 9],
    '1.4': [7, 21],
    '1.5': [10, 21],
    '1.6': [10, 21],
    '1.7': [9, 20],
    '1.8': [11, 21],
    '1.9': [15, 22],
    '1.10': [3, 20],
  };
  const [s, e] = window[code] ?? [0, PHASES.length - 1];
  if (phase <= s) return 0;
  if (phase >= e) return 1;
  /* S-curve: slow start, fast middle, slow finish. */
  const t = (phase - s) / Math.max(1, e - s);
  return Math.max(0, Math.min(1, 3 * t * t - 2 * t * t * t));
}

export function budgetAt(phase: number): BudgetLine[] {
  const lines = WBS[0].children ?? [];
  return lines.map((child) => {
    const budgetM = TOTAL_BUDGET_M * child.share;
    const completePct = lineProgress(child.code, phase) * 100;
    const meta = LINE_META[child.code] ?? { delivers: '', discipline: '' };
    /* Spent runs ahead of earned value because commitments are placed early;
       this is the shape of a programme where the long-lead packages are ordered
       a year before they are installed. */
    const spentPct = Math.min(102, completePct + (completePct > 2 && completePct < 99 ? 9.5 : completePct > 99 ? 1.6 : 0));
    const forecastFactor = completePct > 60 ? 1.045 : completePct > 20 ? 1.02 : 1.0;
    return {
      code: child.code,
      name: child.name,
      budgetM,
      share: child.share,
      completePct,
      spentM: (budgetM * spentPct) / 100,
      committedM: budgetM * Math.min(1, (completePct + 22) / 100),
      forecastM: budgetM * forecastFactor,
      delivers: meta.delivers,
      discipline: meta.discipline,
      status:
        completePct <= 0
          ? ('not-started' as const)
          : completePct >= 99.5
            ? spentPct > 101
              ? ('overrun' as const)
              : ('complete' as const)
            : ('in-progress' as const),
    };
  });
}

/* ------------------------------------------------------------ earned value */

export interface EarnedValuePoint {
  phase: number;
  period: string;
  /** cumulative months from programme start */
  month: number;
  /** planned value, million euro */
  pvM: number;
  /** earned value, million euro */
  evM: number;
  /** actual cost, million euro */
  acM: number;
  /** committed but not yet spent, million euro */
  committedM: number;
  /** cost variance, million euro */
  cvM: number;
  /** schedule variance, million euro */
  svM: number;
  /** cost performance index */
  cpi: number;
  /** schedule performance index */
  spi: number;
  /** forecast at completion, million euro */
  eacM: number;
  /** headcount on site */
  headcount: number;
}

/** How many workers are on site at this phase, against the published peak. */
export function headcountAt(phase: number): number {
  const last = PHASES.length - 1;
  /* Ramp up through earthworks, peak across the overlapping fit-outs, and taper
     through commissioning. The peak is the operator's published 1,500. */
  const peak = 16.5;
  const d = Math.abs(phase - peak) / 16.5;
  const shape = Math.max(0, 1 - d * d * 0.86);
  return Math.round(INPUTS.peakWorkforce * shape * (phase >= 2 && phase <= last - 2 ? 1 : 0.35));
}

export const EARNED_VALUE: EarnedValuePoint[] = (() => {
  const out: EarnedValuePoint[] = [];
  for (let p = 0; p < PHASES.length; p++) {
    const lines = budgetAt(p);
    /* Planned value is what the budget says should be spent by now. */
    const pv = lines.reduce((a, l) => a + l.budgetM * lineProgress(l.code, p), 0);
    const ac = lines.reduce((a, l) => a + l.spentM, 0);
    const committed = lines.reduce((a, l) => a + l.committedM, 0);
    /* The programme runs behind early and recovers. That is the realistic shape:
       long-lead procurement is placed before the design is frozen, and the
       recovery comes when the shells come out of the ground. */
    const behindFactor = p >= 2 && p <= 12 ? 0.86 : p >= 13 && p <= 18 ? 0.94 : 1;
    const evPlanned = pv * behindFactor;
    const cv = evPlanned - ac;
    const sv = evPlanned - pv;
    const cpi = ac > 0 ? evPlanned / ac : 1;
    const spi = pv > 0 ? evPlanned / pv : 1;
    const eac = ac + (TOTAL_BUDGET_M - evPlanned) / Math.max(0.35, cpi);
    void cv;
    void sv;
    out.push({
      phase: p,
      period: PHASES[p].period,
      month: CUMULATIVE_MONTHS[p],
      pvM: pv,
      evM: evPlanned,
      acM: ac,
      committedM: committed,
      cvM: cv,
      svM: sv,
      cpi,
      spi,
      eacM: eac,
      headcount: headcountAt(p),
    });
  }
  return out;
})();

/* --------------------------------------------------------------- registers */

export interface RiskEntry {
  id: string;
  title: string;
  category: 'technical' | 'programme' | 'commercial' | 'environmental' | 'interface';
  /** likelihood 1..5 */
  likelihood: number;
  /** impact in million euro */
  impactM: number;
  /** the phase the risk is most live in */
  phase: number;
  /** what it is actually about, in one sentence */
  detail: string;
  /** the mitigation, and what it costs to hold */
  response: string;
  owner: string;
  status: 'open' | 'mitigating' | 'closed' | 'realised';
}

export const RISKS: RiskEntry[] = [
  {
    id: 'R-01',
    title: '220 kV grid connection slips',
    category: 'programme',
    likelihood: 3,
    impactM: 38,
    phase: 6,
    detail:
      'The whole campus depends on one connection point, and the connection is the part of the programme the site team does not control. The published record shows it took about 15 months, which was fast for the era; it was not guaranteed to be fast.',
    response:
      'Start the loop-in and the transformer procurement before the buildings, so the long-lead items are on site before they are needed. This is the single largest programme risk on the campus.',
    owner: 'Project director',
    status: 'closed',
  },
  {
    id: 'R-02',
    title: 'Transformer delivery out of sequence',
    category: 'technical',
    likelihood: 4,
    impactM: 22,
    phase: 7,
    detail:
      'Three large power transformers with a lead time measured in quarters to years. If the second one is late, the third transformer cannot be proved and the N-1 case is untested until it arrives.',
    response: 'Order all three at once rather than in sequence, and accept the carrying cost of the third early.',
    owner: 'Procurement lead',
    status: 'realised',
  },
  {
    id: 'R-03',
    title: 'Generator package arrives after its electrical room',
    category: 'interface',
    likelihood: 4,
    impactM: 12,
    phase: 13,
    detail:
      'Ninety sets across five buildings, all with long lead times and all needing bunds, containment and cable routes that are civil works on the critical path. The generator compound is built long before the sets land.',
    response: 'Sequence the compounds against confirmed engine build slots rather than against the building completion date.',
    owner: 'Mechanical lead',
    status: 'mitigating',
  },
  {
    id: 'R-04',
    title: 'MV switchgear delay blocks every downstream system',
    category: 'interface',
    likelihood: 3,
    impactM: 26,
    phase: 12,
    detail:
      'One MV lineup per building gates the UPS, the batteries, the LV, the busway and the PDUs. A single late lineup does not delay a package, it delays a building.',
    response: 'Hold the commissioning plan against a scenario where one building’s MV is late, and protect the other four buildings’ commissioning windows.',
    owner: 'Electrical lead',
    status: 'mitigating',
  },
  {
    id: 'R-05',
    title: 'Cooling plant commissioned too late for hall fit-out',
    category: 'technical',
    likelihood: 4,
    impactM: 18,
    phase: 14,
    detail:
      'Heat rejection is air-side, so the plant is seasonal. Commissioning it in a cold month proves very little, and the hall then cannot be thermally validated when the IT is due to arrive.',
    response: 'Plan the thermal validation window around the expected outside air temperature, not around the fit-out programme.',
    owner: 'Commissioning manager',
    status: 'open',
  },
  {
    id: 'R-06',
    title: 'Expansion built against a live campus',
    category: 'interface',
    likelihood: 5,
    impactM: 31,
    phase: 17,
    detail:
      'CLN5 and CLN6 were built while CLN1 and CLN2 carried production traffic. Every cable route, tie-in and road crossing is a constraint with a date on it.',
    response: 'Treat live-site interfaces as programme logic with outage windows, not as site notes. Agree protected corridors in writing before mobilisation.',
    owner: 'Construction manager',
    status: 'realised',
  },
  {
    id: 'R-07',
    title: 'Water discharge consent conditions tighter than modelled',
    category: 'environmental',
    likelihood: 2,
    impactM: 9,
    phase: 11,
    detail:
      'The industrial emissions licence permits residual evaporative cooling-water discharge. If discharge limits tighten, the plant has less make-up available and the wellfield or attenuation has to take more.',
    response: 'Design the make-up system with headroom above the modelled demand rather than matching it.',
    owner: 'Environmental manager',
    status: 'open',
  },
  {
    id: 'R-08',
    title: 'Louvre and security specification conflict',
    category: 'technical',
    likelihood: 3,
    impactM: 7,
    phase: 12,
    detail:
      'Air-cooled plant needs large louvred openings, and a data centre perimeter wants a sealed, alarmed envelope. Every opening is a compromise between air, security and fire.',
    response: 'Resolve louvre specification at design freeze, not at installation. Late changes here hit the commissioning sequence directly.',
    owner: 'Design manager',
    status: 'closed',
  },
  {
    id: 'R-09',
    title: 'Commissioning compressed to protect the handover date',
    category: 'programme',
    likelihood: 4,
    impactM: 15,
    phase: 19,
    detail:
      'Integrated systems testing on load banks cannot be compressed without breaking protocol. The pressure to hit a handover date lands on the one phase that has no slack.',
    response: 'Protect the integrated test window explicitly in the programme, and treat it as a constraint rather than a float.',
    owner: 'Commissioning manager',
    status: 'open',
  },
  {
    id: 'R-10',
    title: 'AI retrofit power supply is the binding constraint',
    category: 'technical',
    likelihood: 5,
    impactM: 44,
    phase: 23,
    detail:
      'A delivered hall has plenty of floor area and no spare electricity. Converting a hall to modern rack-scale compute is limited by the substation, the busway and the PDUs, not by the slab.',
    response: 'Treat any AI conversion as a power project wearing a cooling project’s clothing. Start with the electrical survey.',
    owner: 'Design manager',
    status: 'open',
  },
];

export interface ChangeEvent {
  id: string;
  title: string;
  phase: number;
  /** million euro, positive is a cost increase */
  valueM: number;
  /** days added to the programme */
  days: number;
  origin: 'design development' | 'site condition' | 'authority' | 'operator change' | 'procurement';
  description: string;
  approved: boolean;
}

export const CHANGES: ChangeEvent[] = [
  {
    id: 'C-01',
    title: 'Substation compound extent increased',
    phase: 5,
    valueM: 6.4,
    days: 45,
    origin: 'design development',
    description:
      'The compound grew to accommodate twelve 220 kV bays, 27 lightning masts, three transformers and two cable seal-end bases. More equipment bases, more troughing, more drainage.',
    approved: true,
  },
  {
    id: 'C-02',
    title: 'Additional administration and office building',
    phase: 13,
    valueM: 11.8,
    days: 0,
    origin: 'operator change',
    description: 'Consented under the expansion application alongside the two additional data-storage buildings.',
    approved: true,
  },
  {
    id: 'C-03',
    title: 'Second and third transformer brought forward',
    phase: 7,
    valueM: 9.1,
    days: 0,
    origin: 'procurement',
    description:
      'Ordering all three transformers together rather than in sequence, accepting the carrying cost of the third early to protect the programme.',
    approved: true,
  },
  {
    id: 'C-04',
    title: 'Live-site protection of operating plant',
    phase: 17,
    valueM: 4.2,
    days: 60,
    origin: 'site condition',
    description:
      'Construction beside an operating campus required protected cable routes, restricted access windows and additional monitoring across the live side of the site.',
    approved: true,
  },
  {
    id: 'C-05',
    title: 'Cooling plant louvre and security redesign',
    phase: 12,
    valueM: 2.6,
    days: 30,
    origin: 'design development',
    description: 'Louvred plant openings re-specified to resolve a conflict between airflow, security and fire compartmentation.',
    approved: true,
  },
  {
    id: 'C-06',
    title: 'Substation transformer oil containment upgrade',
    phase: 7,
    valueM: 1.9,
    days: 0,
    origin: 'authority',
    description: 'Transformer bunds upgraded to suit the oil capacity of the units actually supplied.',
    approved: true,
  },
];

export interface Milestone {
  name: string;
  phase: number;
  /** true when the phase sits on a dated published event */
  published: boolean;
  /** what the milestone meant for the programme */
  consequence: string;
}

export const MILESTONES: Milestone[] = [
  {
    name: 'Original campus consent granted',
    phase: 1,
    published: true,
    consequence: 'The whole project became buildable, and the 36 MW per building figure was fixed at this point.',
  },
  {
    name: 'Substation consent and loop-in agreed',
    phase: 2,
    published: true,
    consequence: 'The grid connection became a consented, fundable work package rather than a negotiation.',
  },
  {
    name: '220 kV station energised',
    phase: 8,
    published: true,
    consequence:
      'The hinge of the programme. After this date every building can be energised from the utility; before it, nothing can.',
  },
  {
    name: 'CLN1 commissioned and IT-ready',
    phase: 11,
    published: true,
    consequence: 'The campus can carry production traffic for the first time, and phase 1 is complete.',
  },
  {
    name: 'CLN2 handed over',
    phase: 12,
    published: true,
    consequence: 'Two buildings live. The record notes this fit-out went faster than anticipated while phase 3 was already on site.',
  },
  {
    name: 'Expansion consent granted',
    phase: 13,
    published: true,
    consequence: 'Two more buildings and a second administration building became consented, taking the campus to nearly 150,000 m².',
  },
  {
    name: 'CLN3 commissioned',
    phase: 16,
    published: true,
    consequence: 'Three buildings and twelve halls, matching the 108 MVA supply figure in the project record.',
  },
  {
    name: 'Expansion construction announced',
    phase: 17,
    published: true,
    consequence: 'Construction of CLN5 and CLN6 began beside an operating campus.',
  },
  {
    name: 'Mature five-building campus',
    phase: 21,
    published: true,
    consequence:
      'The configuration the industrial emissions licence names: CLN1, CLN2, CLN3, CLN5 and CLN6, with 90 diesel generators.',
  },
];

/* -------------------------------------------------------------- scenarios */

export interface Scenario {
  id: string;
  title: string;
  /** the phase the delay lands in */
  phase: number;
  /** days added to the handover of the affected building */
  delayDays: number;
  prompt: string;
  /** which physical systems move */
  moves: string[];
  /** what the controls numbers do */
  controls: string[];
  /** the thing most people get wrong about this scenario */
  misconception: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'grid-delay',
    title: '220 kV energisation delay',
    phase: 8,
    delayDays: 120,
    prompt: 'Hold the grid energisation for four months past its planned date.',
    moves: ['sub.xfmr', 'sub.bay', 'CLN1.mv', 'CLN1.h1.bus', 'CLN1.h1.pdu', 'CLN1.h1.rack'],
    controls: [
      'MV energisation cannot start, so no building can be energised from the utility.',
      'Hall testing, thermal validation and IT readiness all move, because none of them can be completed on battery or on generation as a permanent state.',
      'The generators cover the IT load, so the campus is not dark — but a campus running permanently on standby generation is a commissioning failure, not a delay.',
    ],
    misconception:
      'That generation covers it. Generation exists for outages and for defined licence conditions, not for a multi-month programme gap, and running it continuously is not a substitute for energisation.',
  },
  {
    id: 'generator-delay',
    title: 'Generator package delay',
    phase: 13,
    delayDays: 75,
    prompt: 'The second engine allocation arrives a quarter late for CLN3.',
    moves: ['CLN3.gen', 'CLN3.genheat', 'CLN3.fuel', 'CLN3.gensw', 'CLN3.mv'],
    controls: [
      'Construction completion, electrical completion, commissioning completion and operational readiness separate visibly — this is the scenario where the difference between them matters most.',
      'The N+1 case cannot be proved until every set is present, so the load bank and failure tests wait.',
      'Only one building is affected. The other four are unaffected, which is the point of a campus delivered in tranches.',
    ],
    misconception:
      'That a generator is a simple delivery. A packaged genset lead time is dominated by engine block allocation, not by the packager, and acoustic or cold-weather enclosures add to it again.',
  },
  {
    id: 'mv-switchgear',
    title: 'MV switchgear delay',
    phase: 12,
    delayDays: 55,
    prompt: 'One building’s 20 kV lineup arrives six weeks late.',
    moves: ['CLN2.mv', 'CLN2.sub', 'CLN2.upsA', 'CLN2.lv', 'CLN2.h1.bus', 'CLN2.h1.pdu'],
    controls: [
      'One package blocks many downstream systems: the UPS, batteries, LV, busway and PDUs all sit behind it.',
      'The turnover model shows this directly — the hall power train cannot advance past energisation.',
      'Commissioning teams are the scarce resource, so the delay is absorbed by resequencing other buildings rather than by idling the crew.',
    ],
    misconception:
      'That switchgear is a box on a delivery. It gates the entire electrical chain behind it in that building, and the protection settings have to be agreed before it can be commissioned at all.',
  },
  {
    id: 'cooling-commissioning',
    title: 'Cooling commissioning issue',
    phase: 14,
    delayDays: 40,
    prompt: 'Let a hall be electrically complete but thermally unable to accept IT load.',
    moves: ['CLN3.h2.crah', 'CLN3.hx', 'CLN3.cool', 'CLN3.pump', 'CLN3.h2.rack', 'CLN3.h2.server'],
    controls: [
      'The hall passes every electrical test and still cannot be handed over, because the IT fitout package is gated by thermal validation.',
      'Racks may be installed and energised, but they are not commissioned, and energised-and-not-commissioned equipment is a fire and load risk rather than an asset.',
      'On an air-cooled campus this is weather-dependent, so the same defect can pass in March and fail in August.',
    ],
    misconception:
      'That Ready for Service follows from Ready for Energisation. It does not. Cooling is usually the package that gates a hall handover, not power.',
  },
  {
    id: 'live-site',
    title: 'Expansion beside an operating campus',
    phase: 17,
    delayDays: 65,
    prompt: 'Build CLN5 while CLN1 and CLN2 are carrying production traffic.',
    moves: ['CLN5.shell', 'CLN5.zone', 'CLN5.gen', 'CLN5.cool', 'site.road', 'site.admin2'],
    controls: [
      'Interface risk stops being a site note and becomes programme logic: outage windows, protected corridors and access restrictions are scheduled constraints.',
      'Every tie-in into the live substation or the live MV network needs a window agreed in advance with operations.',
      'The campus keeps operating throughout, so the risk is not to the asset but to the date.',
    ],
    misconception:
      'That a campus is either under construction or operating. This project was both, for years, and the second state is the harder one to plan.',
  },
  {
    id: 'ai-retrofit',
    title: 'AI retrofit density change',
    phase: 23,
    delayDays: 210,
    prompt: 'Convert one delivered hall to rack-scale liquid-cooled compute.',
    moves: ['CLN2.h3.cold', 'CLN2.h3.cdu', 'CLN2.h3.rack', 'CLN2.h3.bus', 'CLN2.h3.pdu', 'CLN2.hx'],
    controls: [
      'Power demand per rack rises by roughly a factor of ten, and the existing busway and PDU tap-offs are several times undersized for it.',
      'Floor loading has to be checked at rack positions, because a loaded rack-scale system is roughly 2,100 kg/m² against a conventional design of about 1,500 kg/m².',
      'The hall is indirectly air cooled, so it has no coolant loop to connect to. The retrofit needs a new one, or liquid-to-air sidecar units that trade efficiency for speed.',
      'Programme and cost are dominated by the electrical survey and by coolant loop work, not by the racks.',
    ],
    misconception:
      'That the constraint is floor space. The existing IT area could physically hold far more rack positions than the campus has electricity to feed. This is a power project.',
  },
];

/* ---------------------------------------------------------------- helpers */

/** The scenario in force at a given phase, or null. */
export function scenarioAt(phase: number): Scenario | null {
  return SCENARIOS.find((s) => s.phase === phase) ?? null;
}

/** Live risks at a phase, worst exposure first. */
export function risksAt(phase: number): RiskEntry[] {
  return RISKS.filter((r) => Math.abs(r.phase - phase) <= 2 && r.status !== 'closed').sort(
    (a, b) => b.likelihood * b.impactM - a.likelihood * a.impactM,
  );
}

/** One sentence summarising where the programme stands at this data date. */
export function programmeStatus(month: number): string {
  const ev = EARNED_VALUE[month];
  const late = ev.svM < -8;
  return (
    `Data date ${ev.period}, ${ev.month} months in. ${fmtInt(ev.headcount)} people on site. ` +
    `Earned ${fmt(ev.evM, 0)}M against a planned ${fmt(ev.pvM, 0)}M and a spent ${fmt(ev.acM, 0)}M. ` +
    `CPI ${ev.cpi.toFixed(2)}, SPI ${ev.spi.toFixed(2)}, forecast at completion ${fmt(ev.eacM, 0)}M against a ${fmt(TOTAL_BUDGET_M, 0)}M budget.` +
    (late ? ' The programme is behind and recovering.' : ' The programme is tracking.')
  );
}

/** Reference figures for the panel header. */
export const CONTROLS_HEADLINE = {
  totalBudgetM: TOTAL_BUDGET_M,
  costPerMw: derived.costPerMwPublished,
  costPerMwAnnounced: derived.costPerMwAnnounced,
  peakWorkforce: INPUTS.peakWorkforce,
  workersPerMw: derived.workersPerMwAtPeak,
  announcedInvestmentM: INPUTS.announcedInvestmentM,
  publishedInvestmentBn: INPUTS.publishedInvestmentBn,
  pue: A.pue,
} as const;