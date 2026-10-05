/**
 * Resilience model for Clonee: the utility-loss sequence, single-failure
 * scenarios, the emergency shed order and the redundancy vocabulary.
 *
 * Nothing here claims Clonee's redundancy architecture. The public record gives
 * a compound, a bay count, a transformer count, ninety generators and a
 * licence; it does not give a one-line diagram, a lineup, an autonomy time or
 * an achieved availability rating. Where an outcome depends on a design choice
 * that is not public, the text says so and explains how to test the claim. That
 * is the whole discipline of this file: describe the mechanism, name the
 * assumption, show the arithmetic.
 *
 * `targetType` is always a geometry `type` string from `campus.ts`, so the
 * injected failure lights up real components in the model. `siblings` lists the
 * other component ids of that same type which are still working; where a type is
 * represented by a single component on the model, the list is empty and the
 * text says why, because that absence is itself the finding.
 */

import { ASSUMPTIONS, derived, fmt, INPUTS } from './calculations';

/**
 * Assumption values by key, read out of the table rather than restated here, so
 * a sentence in this file can never drift from the number behind it.
 */
function A(key: string): number {
  const found = ASSUMPTIONS.find((a) => a.key === key);
  if (!found) throw new Error(`faults.ts: unknown assumption ${key}`);
  return found.value;
}

/** The modelled rating of one generator set, in MW. */
const SET_MW = A('generatorRatedKw') / 1000;

/* ------------------------------------------------- utility-loss sequence */

export interface GridPhase {
  id: number;
  /** when this step happens, as the app displays it */
  t: string;
  name: string;
  detail: string;
  grid: 'normal' | 'lost' | 'restored';
  ups: boolean;
  gen: boolean;
  highlight: string[];
  /**
   * The line that matters. This sequence is played back as a script, and the
   * teaching point of each step is the value of the step.
   */
  teaching: string;
}

/**
 * Nine steps, from steady state back to steady state.
 *
 * The timings are TYPICAL order-of-magnitude values for this class of facility.
 * None of them are specification values for Clonee, and none should be quoted
 * as an acceptance criterion.
 */
export const GRID_FAILURE_SEQUENCE: GridPhase[] = [
  {
    id: 0,
    t: 'steady state',
    name: 'Normal utility supply',
    detail:
      'The grid carries the whole facility. Generators are on standby with starting batteries maintained, fuel topped up to the bunds, and cooling loops already circulating so that the first step does not begin with cold plant. Nothing looks different on site, which is the point of a standby plant that has been maintained properly.',
    grid: 'normal',
    ups: true,
    gen: false,
    highlight: ['hv.line', 'sub.bay', 'sub.xfmr', 'CLN1.mv', 'CLN1.upsA', 'CLN1.gen'],
    teaching:
      'Standby plant is only worth having if it can be tested while the building is live. That is why maintenance is one of the four conditions in the emissions licence under which ninety generators may run.',
  },
  {
    id: 1,
    t: 't = 0 s',
    name: 'Utility supply lost',
    detail:
      'The loop-in opens: a storm, a transmission fault, or an upstream protection operation somewhere on the 220 kV system. The campus is suddenly islanded with no source. Every protection relay in the compound has seen the event, and the first job is not to keep the lights on but to establish what is actually still energised.',
    grid: 'lost',
    ups: true,
    gen: false,
    highlight: ['hv.line', 'sub.bay', 'sub.control', 'sub.xfmr'],
    teaching:
      'The consented connection is a loop-in, not a spur, and the campus holds only one of them. Redundancy at this end is a property of the loop and the towers, and no amount of downstream N+1 substitutes for it.',
  },
  {
    id: 2,
    t: '0 – 10 s',
    name: 'UPS carries the load on battery',
    detail:
      'With no input at all, the inverters keep the IT supply inside tolerance and the batteries carry the load. Mechanical plant coasts down or is deliberately held. Room temperatures begin to drift, and this is the only part of the event that nobody can hurry: the time available is set by the batteries and not by the crew.',
    grid: 'lost',
    ups: true,
    gen: false,
    highlight: ['CLN1.upsA', 'CLN1.upsB', 'CLN1.batt', 'CLN1.h1.rack', 'CLN1.h1.server'],
    teaching:
      'The ride-through is the most important unpublished number in the whole design. It has to exceed generator start plus synchronisation plus transfer, with margin, and it is either proved on load banks or it is a guess.',
  },
  {
    id: 3,
    t: 't = 10 s',
    name: 'Generators start',
    detail:
      'The start signal goes out and the sets run up in a staged sequence, not all at once. Each engine has to accelerate, catch, build voltage and frequency, and stabilise before it can be connected to anything. The starters are on the batteries, which are already working at the load limit from the previous step.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['CLN1.gen', 'CLN2.gen', 'CLN3.gen', 'CLN5.gen', 'CLN6.gen', 'CLN1.batt'],
    teaching:
      'A failed start is a leading cause of data-centre outages, and ninety sets are ninety chances to fail. Cold-start reliability, starting battery condition and fuel quality are all testable, which is exactly why they are tested on a schedule rather than assumed.',
  },
  {
    id: 4,
    t: 't ≈ 15 s',
    name: 'Generators stabilise and synchronise',
    detail:
      'Running sets come up to speed and voltage and close onto the emergency bus. Synchronising checks voltage, frequency and phase before each breaker closes, and it happens in steps so that the bus is not shocked by a whole compound arriving at once.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['CLN1.gen', 'CLN1.gensw', 'CLN1.mv'],
    teaching: `Eighteen sets per building synchronising onto one bus is a control problem before it is an electrical one. At ${fmt(derived.generationPerBuildingMW, 0)} MW of standby per building, the synchronisation sequence alone can eat into the ride-through budget the UPS was bought to provide.`,
  },
  {
    id: 5,
    t: 't ≈ 30 s',
    name: 'Load transferred to generation',
    detail:
      'Transfer switches move the critical load across. The UPS returns to normal double-conversion operation and begins recharging, and mechanical plant starts to come back in a defined order. This is the first moment at which the site has a sustainable source, and the first moment at which the arithmetic on the nameplate matters.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['CLN1.mv', 'CLN1.gensw', 'CLN1.upsA', 'CLN1.upsB'],
    teaching: `Ninety sets at ${fmt(SET_MW, 1)} MW give ${fmt(derived.generatorRatedMW, 0)} MW of rated generation against ${fmt(derived.itCapacityMW, 0)} MW of IT, a ratio of ${fmt(derived.generationVsIt, 2)} — and less than the ${fmt(derived.facilityLoadMW, 0)} MW whole-facility draw. Auxiliary load has to be shed before IT load is.`,
  },
  {
    id: 6,
    t: 't = 30 s – 2 min',
    name: 'Mechanical plant restored',
    detail:
      'Heat rejection, pumps, fans and controls restart in sequence, cooling for live halls first. Room conditions are recovered and held. Battery charging is rate-limited so that the generators are not asked for a step they cannot take on a cold engine.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['CLN1.cool', 'CLN1.hx', 'CLN1.pump', 'CLN1.h1.crah'],
    teaching:
      'Restart order is not cosmetic. A hall tolerates a couple of minutes of warm air and a hall that is already throttling tolerates none at all, which is why cooling for live IT comes back first and is the last thing ever shed.',
  },
  {
    id: 7,
    t: 'hours',
    name: 'Utility supply restored',
    detail:
      'The transmission system owner confirms the fault cleared and a return-to-utility signal arrives. Generation stays as the source of record until the network has been stable long enough for the site to trust it. This is a deliberate, controlled operation rather than something that happens on its own.',
    grid: 'restored',
    ups: true,
    gen: true,
    highlight: ['sub.bay', 'sub.xfmr', 'sub.control', 'CLN1.gensw'],
    teaching:
      'Returning to a network that has just failed is a decision, not an event. Some operators will not go back at all until it has been stable for a defined period, and the emissions licence is why the engines remain the record of what was running in the meantime.',
  },
  {
    id: 8,
    t: 'hours later',
    name: 'Back on utility, generators to standby',
    detail:
      'Load transfers back to the grid. Generators cool down, run unloaded for a period to spin up the bearings, then stop and return to standby. Batteries finish recharging, and the site returns to the state it was in at t = 0 — which is the acceptance test for the whole exercise.',
    grid: 'normal',
    ups: true,
    gen: false,
    highlight: ['sub.xfmr', 'CLN1.mv', 'CLN1.gen', 'CLN1.batt'],
    teaching:
      'The event is then written up: how long the batteries carried the load, which sets ran, what was shed, and what the post-event inspection found. Licence conditions exist because a regulator needs to know when generating plant ran, not merely that it exists.',
  },
];

/* ------------------------------------------------------- failure scenarios */

export interface FaultScenario {
  id: string;
  label: string;
  /** a geometry `type` from campus.ts, so the failure lights up real components */
  targetType: string;
  targetLabel: string;
  /** other component ids of the same type that are still working */
  siblings: string[];
  consequence: 'absorbed' | 'degraded' | 'critical';
  headline: string;
  bullets: string[];
  caveat: string;
  highlight: string[];
}

/**
 * Single-failure scenarios.
 *
 * Written so the teaching survives even where the design choice behind it is not
 * public. Each entry says what the mechanism is, what the arithmetic gives, and
 * what would have to be checked before the conclusion could be relied on.
 */
export const FAULT_SCENARIOS: FaultScenario[] = [
  {
    id: 'grid',
    label: 'Utility grid failure',
    targetType: 'hv-line',
    targetLabel: '220 kV loop-in to the transmission system',
    siblings: [],
    consequence: 'absorbed',
    headline:
      'The campus islands, the UPS bridges the gap, generation takes the load, and the site runs on fuel until the network is deliberately returned to.',
    bullets: [
      'There is no second connection to fail over to, which is why the sibling list is empty: the model has one loop-in, and the transmission-end redundancy is a question about the loop and the towers rather than about a spare cable.',
      'This is the event that shapes the whole campus, and it is the one scenario that gets rehearsed on purpose with load banks rather than argued about in a meeting.',
      'After generation is accepted, the limit is fuel, bunding and road tanker logistics. It is not the engines.',
    ],
    caveat:
      'PUBLIC FACT: BP-VA0018 and EIR-AR2017 establish the loop-in, the two towers and the August 2017 energisation. NOT PUBLIC: protection settings, the islanding scheme, UPS autonomy, or fuel autonomy in hours or days.',
    highlight: ['hv.line', 'sub.bay', 'sub.xfmr', 'CLN1.upsA', 'CLN1.gen'],
  },
  {
    id: 'transformer',
    label: 'Step-down transformer',
    targetType: 'sub-transformer',
    targetLabel: 'Step-down transformer, one of three',
    siblings: [],
    consequence: 'degraded',
    headline:
      'Power does not fail. The campus runs short of capacity and has to shed IT load in whole-building blocks, because a building is the only clean block it has.',
    bullets: [
      `Three transformers at ${fmt(derived.transformerTotalMva / 3, 0)} MVA give ${fmt(derived.transformerTotalMva, 0)} MVA. Losing one leaves ${fmt(derived.nMinusOneMva, 0)} MVA against a whole-facility draw of about ${fmt(derived.facilityLoadMW, 0)} MW.`,
      `That is a shortfall of roughly ${fmt(derived.nMinusOneShortfallMW, 0)} MW against the ${INPUTS.itMwPerBuilding} MW of consented IT in a single building, so the campus has to find about one and a half buildings of load to remove. A building is the only block on this site that is both large enough and clean enough to remove cleanly, which is why the shed lands there rather than being spread as a fifth of every hall.`,
      'Generation is the real answer, because the ninety sets close onto the medium-voltage bus behind the transformers rather than in front of them. The arithmetic above shows how much has to move if they do not start.',
    ],
    caveat:
      'PUBLIC FACT: three step-down transformers (BP-VA0018), with no ratings published. DERIVED: the 90 MVA rating and every figure above follow from it. NOT PUBLIC: the ratings, tap positions, protection scheme or any automatic load-shed logic.',
    highlight: ['sub.xfmr', 'sub.bay', 'CLN1.mv', 'CLN2.mv', 'sub.control'],
  },
  {
    id: 'generator-one',
    label: 'One generator set fails',
    targetType: 'generator',
    targetLabel: 'Diesel generator set, one of eighteen in a building',
    siblings: ['CLN2.gen', 'CLN3.gen', 'CLN5.gen', 'CLN6.gen'],
    consequence: 'absorbed',
    headline:
      'Seventeen sets in the same building carry the load and the four other compounds are untouched. Nothing on the critical path changes.',
    bullets: [
      `One set is ${fmt(SET_MW, 1)} MW, which is about ${fmt((SET_MW / derived.generationPerBuildingMW) * 100, 1)}% of one building's standby capacity and roughly 1% of the campus fleet.`,
      'N+1 is only a claim if a set can be out for weeks, not minutes. That makes it a maintenance-procedure question as much as a design one: fuel, oil, water, load-bank hours and a test window that does not disturb production.',
      'A failed start is the more serious version of this failure, because it consumes the ride-through time the batteries were bought to provide.',
    ],
    caveat:
      'PUBLIC FACT: 90 sets across five buildings (EPA-P1192). DERIVED: eighteen per building. TYPICAL: the 2.5 MW rating, the arrangement and the maintenance model. NOT PUBLIC: block allocation, step-load acceptance criteria or fuel autonomy.',
    highlight: ['CLN1.gen', 'CLN1.fuel', 'CLN1.gensw', 'CLN1.mv'],
  },
  {
    id: 'generators-multiple',
    label: 'Multiple generators fail',
    targetType: 'generator-switchgear',
    targetLabel: 'Generator switchgear and emergency bus',
    siblings: ['CLN1.gensw', 'CLN3.gensw', 'CLN5.gensw', 'CLN6.gensw'],
    consequence: 'critical',
    headline:
      'With enough sets unavailable, the emergency bus cannot be closed onto a usable supply, and the shed order decides what keeps running.',
    bullets: [
      `Four sets in one building is ${fmt(4 * SET_MW, 0)} MW against ${fmt(derived.generationPerBuildingMW, 0)} MW of standby for that building, which is survivable. Ten is ${fmt(10 * SET_MW, 0)} MW and is not.`,
      'The generator switchgear is where a hardware fault turns into a decision: what can be closed, in what order, and which loads are dropped before a breaker is allowed to close.',
      'Loss of grid supply is a permitted reason to run the engines under the licence. Insufficient generation to carry the load is not a reason to keep running — it is a shed, and the licence is telling you the plant was designed for events, not for chronic shortfall.',
    ],
    caveat:
      'TYPICAL: the injection is represented at the generator switchgear because one component id stands for eighteen sets. NOT PUBLIC: block architecture, start sequence, step-load criteria, or the automatic shed logic at Clonee.',
    highlight: ['CLN1.gensw', 'CLN1.gen', 'CLN1.mv', 'CLN1.upsA', 'CLN1.upsB'],
  },
  {
    id: 'mv-switchboard',
    label: 'MV switchboard',
    targetType: 'mv-switchgear',
    targetLabel: 'Building MV switchboard',
    siblings: ['CLN2.mv', 'CLN3.mv', 'CLN5.mv', 'CLN6.mv'],
    consequence: 'degraded',
    headline:
      'The building loses its utility feed. Generation can carry it from the same bus, so the honest answer is to start the eighteen sets rather than to shut the bar down.',
    bullets: [
      'The building MV lineup is the boundary between campus distribution and everything downstream inside that bar: both unit substations, both UPS, the LV board, all four halls of busway and racks.',
      'Because the generator compounds close onto this same board, the practical answer is a start signal, not an outage. That is why generation is distributed per building on this campus rather than centralised.',
      'If the board is genuinely lost rather than de-energised, the building is isolated from campus cooling and the campus network, and a campus event becomes a single-building incident.',
    ],
    caveat:
      'PUBLIC FACT: underground 20 kV cables between the substation and the buildings (MCC-150605). TYPICAL: the incomer arrangement, bus splitting and per-hall feeders shown here. NOT PUBLIC: switchgear type, protection or interlocking at Clonee.',
    highlight: ['CLN1.mv', 'sub.mvb', 'CLN1.gensw', 'CLN1.sub'],
  },
  {
    id: 'ups',
    label: 'UPS path',
    targetType: 'ups',
    targetLabel: 'Uninterruptible power supply, path A or B',
    siblings: [
      'CLN1.upsB',
      'CLN2.upsA',
      'CLN2.upsB',
      'CLN3.upsA',
      'CLN3.upsB',
      'CLN5.upsA',
      'CLN5.upsB',
      'CLN6.upsA',
      'CLN6.upsB',
    ],
    consequence: 'degraded',
    headline:
      'The surviving path takes the whole building. That is a claim to be tested rather than a comfort to be taken, because nobody outside the design team knows whether each path is rated for it.',
    bullets: [
      'A and B is only 2N if each path is rated to carry the full building on its own. The model does not know that and neither does the public record, which is why this is degraded rather than absorbed.',
      'The batteries are modelled as one set per building, shared between the two paths. Shared batteries are the classic way a 2N claim quietly becomes an N claim with extra hardware.',
      'Audit question: walk both paths from the unit substation to the rack PDU and list everything they share — ventilation, controls, containment, a common cable route, a common fire zone.',
    ],
    caveat:
      'PUBLIC FACT: batteries are present and are a fire hazard (EPA-P1192). NOT PUBLIC: UPS topology, redundancy level, autonomy, battery chemistry or capacity. The A and B arrangement shown is TYPICAL.',
    highlight: ['CLN1.upsA', 'CLN1.upsB', 'CLN1.batt', 'CLN1.lv', 'CLN1.sub'],
  },
  {
    id: 'cooling-bank',
    label: 'Cooling bank',
    targetType: 'air-cooler',
    targetLabel: 'Heat rejection bank behind a building',
    siblings: ['CLN2.cool', 'CLN3.cool', 'CLN5.cool', 'CLN6.cool'],
    consequence: 'degraded',
    headline:
      'The array rejects less heat, the cooling supply temperature climbs, and the halls start living on the margin they were designed to keep.',
    bullets: [
      'Heat rejection is deliberately built as many small units precisely so that any one of them is a maintenance item rather than an outage. The unit count in the model is typical; nothing publishes a schedule.',
      'The limiting condition on a hot day is the air temperature itself, and outside-air economisers have already been carrying the load for most of the year. There is headroom to lose for a while, and then there is not.',
      'Evaporative assistance only helps in the driest hours, which is the same weather in which a campus most needs the margin. The two effects work against each other, which is the argument for a wet climate being a favourable place to be.',
    ],
    caveat:
      'PUBLIC FACT: indirect air cooling (SNWA-FB) and residual evaporative cooling-water discharge (EPA-P1192). TYPICAL: unit count, staging, redundancy and controls. NOT PUBLIC: capacity, airflow, winter operation or the achieved cooling redundancy.',
    highlight: ['CLN1.cool', 'CLN1.hx', 'CLN1.plume', 'site.wtp', 'CLN1.h1.crah'],
  },
  {
    id: 'pump',
    label: 'Cooling pump',
    targetType: 'pump',
    targetLabel: 'Cooling water pump',
    siblings: ['CLN2.pump', 'CLN3.pump', 'CLN5.pump', 'CLN6.pump'],
    consequence: 'absorbed',
    headline:
      'The surviving pumps recover the flow within seconds, at the cost of pump power and of the margin that a duty, assist and standby arrangement exists to hold.',
    bullets: [
      'Flow is recovered by speed control on the survivors. The cost is electrical, which matters on a campus where generation is the scarce resource during an event rather than the utility.',
      'If the pump that failed was the standby, the building now has no spare and the next failure is a throttling event rather than a maintenance event.',
      'The same failure during a utility-loss event is materially worse than the same failure on utility, because the survivors are already running from generation and there is no headroom left to spend on catching up.',
    ],
    caveat:
      'TYPICAL: the duty, assist and standby arrangement modelled here. NOT PUBLIC: pump count, drive arrangement, control logic, or the actual redundancy of the cooling plant at Clonee.',
    highlight: ['CLN1.pump', 'CLN1.hx', 'CLN1.cool', 'CLN1.h1.crah'],
  },
  {
    id: 'fibre',
    label: 'Campus fibre route',
    targetType: 'fibre-route',
    targetLabel: 'Terrestrial fibre route to the campus',
    siblings: [],
    consequence: 'degraded',
    headline:
      'The campus keeps computing and loses its outside world. Traffic moves to the diverse route; if both routes are lost the compute is still local and the business is not.',
    bullets: [
      'Two physically diverse terrestrial routes is the standard requirement and the standard failure mode. A shared duct, pole, bridge or manhole anywhere on the path destroys the diversity that a schematic claims.',
      'An isolated campus can still run training jobs. It cannot reach anything outside itself, which is a commercial event rather than a technical one, and the model has no way to price it.',
      'Diversity has to be verified on a route map rather than on a drawing, because a drawing does not know where the two routes share ground. That verification is a survey, not a design review.',
    ],
    caveat:
      'DERIVED: this is an overland campus and the route geometry here is simplified. PUBLIC FACT: two meet-me rooms per building (SNWA-FB). NOT PUBLIC: fibre pair counts, carrier list, route details or the diversity actually achieved.',
    highlight: ['site.fibre', 'site.fibrehub', 'site.core'],
  },
  {
    id: 'controls',
    label: 'Control system',
    targetType: 'sub-control',
    targetLabel: 'Protection and control system',
    siblings: [],
    consequence: 'critical',
    headline:
      'Without the control layer, protection works from last-known settings and the automatic sequences that start generation, sequence cooling and return the site to utility do not run.',
    bullets: [
      'Automatic start, synchronisation, transfer back to utility and cooling restart order are all control functions. In an emergency the fallback is a person with a written procedure, and that is slower than the event it is meant to catch.',
      'It is a protection problem as well as a controls problem: settings that were correct for a hall carrying conventional racks are not correct for one carrying AI racks at an order of magnitude more power on the same feeder.',
      'This is why a control system is a single point of failure even when everything it supervises is redundant. Redundancy upstream of a broken controller buys nothing.',
    ],
    caveat:
      'TYPICAL: the failure mode and the manual fallback. NOT PUBLIC: the control architecture, the control network, the systems integrated, or the written procedures. The modelled element is the substation control building; the wider building management system is not modelled.',
    highlight: ['sub.control', 'sub.bay', 'sub.xfmr', 'CLN1.gensw', 'CLN1.pump'],
  },
  {
    id: 'battery',
    label: 'UPS battery string',
    targetType: 'battery',
    targetLabel: 'UPS battery strings, one set per building',
    siblings: ['CLN2.batt', 'CLN3.batt', 'CLN5.batt', 'CLN6.batt'],
    consequence: 'degraded',
    headline:
      'The remaining capacity shortens the ride-through, and the ride-through is the number the whole emergency design is arranged around.',
    bullets: [
      'The UPS autonomy must exceed generator start plus synchronisation plus transfer, with margin. Every string out of service for testing or replacement shortens that margin, and no nameplate capacity figure compensates for it.',
      'In this model the batteries are shared between the A and B paths, which makes them a single point of failure for both and a shared dependency in the middle of the cleanest redundancy claim on the site.',
      'They are also a fire hazard in a building full of plastics, which the public record acknowledges and says nothing further about: no chemistry, no capacity, no detection arrangement, no suppression philosophy.',
    ],
    caveat:
      'PUBLIC FACT: batteries are present and are a fire hazard (EPA-P1192). NOT PUBLIC: size, chemistry, autonomy, string arrangement or fire protection. The shared-string arrangement shown is TYPICAL.',
    highlight: ['CLN1.batt', 'CLN1.upsA', 'CLN1.upsB', 'site.fire'],
  },
  {
    id: 'unit-substation',
    label: 'Unit substation transformer',
    targetType: 'unit-substation',
    targetLabel: 'Building unit substation, medium to low voltage',
    siblings: ['CLN2.sub', 'CLN3.sub', 'CLN5.sub', 'CLN6.sub'],
    consequence: 'degraded',
    headline:
      'Low voltage is lost to part of the bar downstream of the transformer, and the UPS carries the IT until generation arrives or the second unit is switched in.',
    bullets: [
      'Two unit substations serve four halls, so losing one removes low voltage from part of a building rather than all of it. That is the entire reason for having two, and it is worth checking that the two are fed from separate incomers on separate bus sections.',
      'The UPS and its batteries sit downstream of this transformer, which is exactly what makes the ride-through available at all. Everything above the unit substation can fail without an outage; everything below it cannot.',
      'Whether the incomer scheme and the two transformers are genuinely independent is precisely the kind of detail that is not published and precisely the kind of detail that decides the answer.',
    ],
    caveat:
      'TYPICAL: two unit substations per building serving four halls between them, as modelled here. NOT PUBLIC: transformer count, ratings, winding arrangement or the incomer scheme at Clonee.',
    highlight: ['CLN1.sub', 'CLN1.mv', 'CLN1.upsA', 'CLN1.upsB', 'CLN1.lv'],
  },
];

/* ------------------------------------------------------------- shed order */

export interface ShutdownPriority {
  rank: number;
  group: string;
  loads: string;
  rationale: string;
}

/**
 * Emergency load shedding, in the order it would actually run.
 *
 * The order is the teaching point. Rank 1 goes first because it has no
 * operational value to the IT load; the last two ranks are never shed, and
 * cooling ranks above IT because losing cooling takes the servers down by
 * itself within minutes.
 */
export const SHED_PRIORITY: ShutdownPriority[] = [
  {
    rank: 1,
    group: 'Shed first',
    loads: 'Amenity and non-critical: offices, lighting, lifts, workshops, non-critical water treatment and make-up pumping, attenuating and stormwater pumps',
    rationale:
      'None of it contributes to the IT load during an emergency, and the campus water buffer is exactly what makes the water plant sheddable for hours. This is where an operator gets its first few megawatts without touching anything that matters.',
  },
  {
    rank: 2,
    group: 'Shed second',
    loads: 'IT in halls being commissioned, drained, or running workloads that can be stopped and restarted: batch jobs, training runs, staging copies',
    rationale:
      'Capacity that is not currently earning. The cost is recompute time rather than an outage, which makes it the cheapest megawatt available after the amenities — provided someone has decided in advance which workloads are restartable.',
  },
  {
    rank: 3,
    group: 'Shed third',
    loads: `The IT load of one whole data-storage building: ${INPUTS.itMwPerBuilding} MW of consented IT, halls in reverse order of contract commitment`,
    rationale: `This is the granularity the campus actually has. Losing one of three step-down transformers leaves ${fmt(derived.nMinusOneMva, 0)} MVA against a ${fmt(derived.facilityLoadMW, 0)} MW draw, a shortfall of about ${fmt(derived.nMinusOneShortfallMW, 0)} MW, and the only large blocks available to remove are buildings. Shedding across all five buildings in fractions would be a finer tool and a much worse decision.`,
  },
  {
    rank: 4,
    group: 'Shed last',
    loads: 'Cooling auxiliaries and non-critical mechanical plant: standby air coolers, clean-water dosing, low-temperature glycol make-up, filters and a fan or two per hall',
    rationale:
      'Reduce the cooling loop rather than stop it. The loop and the building have thermal mass that the IT can spend for a few minutes, and that mass is worth more than the pump power it costs to keep moving.',
  },
  {
    rank: 5,
    group: 'Never shed',
    loads: 'Cooling serving live IT: pumps, heat exchanger skids and air coolers for any hall that still has load running in it',
    rationale:
      'A hall with no cooling either throttles or trips within minutes, and a server trip on a partly shed campus is how a controlled shed turns into an outage. Once this rank is reached the shed has already gone wrong, which is why ranks 1 to 4 exist.',
  },
  {
    rank: 6,
    group: 'Never shed',
    loads: 'The IT load itself, its UPS, the batteries, and the protection and controls that manage both',
    rationale:
      'Shedding these sheds the business rather than protecting it. If utility and generation are both unavailable, the batteries are what keep the shedding orderly; a ride-through that expires mid-shed is not a controlled event any more.',
  },
];

/* ------------------------------------------------------ redundancy terms */

export interface RedundancyConcept {
  term: string;
  definition: string;
  test: string;
  example: string;
}

/** Seven terms, each with the question that would test the claim. */
export const REDUNDANCY_CONCEPTS: RedundancyConcept[] = [
  {
    term: 'N',
    definition:
      'Enough capacity to carry the load with nothing spare. One failure is an outage, and any maintenance requires an outage.',
    test: 'Ask: can this component be removed for service tomorrow with the IT load still running? If not, it is N, whatever the drawing says.',
    example:
      'A single medium-voltage incomer feeding a whole building bar: simple, cheap, and it converts one cable fault into a shed of every hall behind it.',
  },
  {
    term: 'N+1',
    definition:
      'Capacity for the load plus one spare unit. N units carry the load and any one of them can be out, so faults and maintenance are the same event.',
    test: 'Ask: with the worst unit offline, can the survivors carry the design load through a step change? It is step capability that matters, not the sum of the nameplates.',
    example:
      `Eighteen generator sets per building against ${INPUTS.itMwPerBuilding} MW of IT load is N+1 in spirit, and the many-small-units heat rejection banks exist for the same reason.`,
  },
  {
    term: '2N',
    definition:
      'Two complete and independent systems, each able to carry one hundred per cent of the load on its own. Failure of one path is a maintenance event, not an event.',
    test: 'Ask: walk both paths end to end and list everything they share. Every shared item — a controller, a battery set, a ventilation system, a trench, a fire zone — is a hole in the claim.',
    example:
      'The two UPS paths per building shown in this model. The reason it is only claimed as degraded in the resilience panel is that the battery set is modelled as shared between them.',
  },
  {
    term: 'Concurrently maintainable',
    definition:
      'Planned work can be carried out on the facility without interrupting the IT load, so maintenance happens during a working day rather than in a shutdown window nobody can afford.',
    test: 'Ask: can you take any single item out for service on a live campus, with production traffic unaffected? This is a design property, not an operational aspiration.',
    example:
      'Taking one air cooler out of a bank behind CLN3, or one generator set out for oil change while the other seventeen carry the building, without a single customer-visible event.',
  },
  {
    term: 'Fault tolerance',
    definition:
      'The system keeps delivering its service through a specified set of failures, and keeps delivering it at a stated quality rather than merely staying up. A throttled hall is not the same service as a full one.',
    test: 'Ask: what does the workload actually do during the failure — keep running, degrade in throughput, or crash? Only the first of those is fault tolerance in any useful sense.',
    example:
      'Free cooling carrying the whole heat load on a mild day, with the evaporative stage available only in the hottest hours: the cooling design tolerates a lost unit until the weather takes the margin away.',
  },
  {
    term: 'Single point of failure',
    definition:
      'One component whose loss stops the service, however redundant everything around it is. It is usually something shared, something overlooked, or something nobody owns.',
    test: 'Ask: what is the blast radius of this component, and what exactly is shared with the path that is supposed to be independent? One rack, one row, one hall, one building, or the campus.',
    example:
      `The 20 kV cable route between the substation and the buildings is shared by every hall in a bar, and the ${fmt(derived.nMinusOneShortfallMW, 0)} MW shortfall from losing one transformer can only be found at the granularity of a building.`,
  },
  {
    term: 'Graceful degradation',
    definition:
      'The system gives up capacity in a defined order rather than failing all at once, so that a shortfall becomes a reduction in what is served instead of an outage of everything.',
    test: 'Ask: is the shed order written down, agreed, rehearsed, and does the workload tolerate being throttled or stopped at each rung? An unwritten order is not a degradation strategy.',
    example:
      'The six-rank shed order in this model: amenities first, then restartable workloads, then one building at a time, with cooling for live IT and the IT load itself never shed.',
  },
];

/**
 * The honest position on what this model is not.
 *
 * It is deliberately a paragraph rather than a disclaimer buried in a panel,
 * because the arithmetic elsewhere in the application is exact and exactness
 * invites confidence the underlying record does not support.
 */
export const POWER_STRESS_NOTE =
  'This is not a protection-coordination or load-flow tool. It holds no impedance data, no fault levels, no relay settings, no protection grading and no network model, so it cannot tell you whether any breaker in this campus would operate in the right order or any sequence in this file would be accepted by a commissioning engineer. The redundancy rating actually achieved at Clonee is not published: the consent documents, the substation planning report and the emissions licence give a compound, a bay count, a transformer count, ninety generators, floor areas and dates, and no availability target, no one-line diagram and no autonomy time. Every outcome described here is therefore a mechanism plus a stated assumption, not a statement about the real facility. Where a number appears, it comes from the published inputs in this application and can be traced to them; where an architecture appears, it is typical industry practice applied to a real topology so that the reasoning has something to attach to. Read this file as a way of asking better questions of a project, not as an answer about Clonee.';

