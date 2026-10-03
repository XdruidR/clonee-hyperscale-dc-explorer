/**
 * Resilience model: the utility-loss sequence and single-failure scenarios.
 *
 * Nothing here claims the reference project's redundancy architecture. Where a
 * redundancy outcome depends on a design choice that is not public, the text
 * says so and explains how to test the claim.
 */

export interface GridPhase {
  id: number;
  t: string;
  name: string;
  detail: string;
  grid: 'normal' | 'lost' | 'restored';
  ups: boolean;
  gen: boolean;
  highlight: string[];
  teaching: string;
}

export const GRID_FAILURE_SEQUENCE: GridPhase[] = [
  {
    id: 0,
    t: 'steady state',
    name: 'Normal utility supply',
    detail:
      'The grid carries the whole facility. Generators are on standby with starting batteries maintained, fuel topped up, and coolant systems pre-circulating. Nothing looks different on site, which is the point of a well-designed standby plant.',
    grid: 'normal',
    ups: true,
    gen: false,
    highlight: ['gxp.xfmr', 'M1.mv', 'M1-W.upsA', 'M1-W.bus'],
    teaching: 'Standby plant has to be testable while the building is live. That is why periodic generator running appears in the air discharge consent.',
  },
  {
    id: 1,
    t: 't = 0 s',
    name: 'Utility supply lost',
    detail:
      'The grid connection opens — a storm, a transmission fault, or an upstream protection operation. Every downstream breaker sees the fault. Protection clears it in milliseconds to seconds and the campus is suddenly islanded with no source.',
    grid: 'lost',
    ups: true,
    gen: false,
    highlight: ['gxp.bay', 'gxp.xfmr', 'M1.mv'],
    teaching:
      'This is why the redundancy is designed at the transmission end. If two circuits share a corridor or a tower, a single event removes both and no amount of downstream N+1 helps.',
  },
  {
    id: 2,
    t: '0 - 10 s',
    name: 'UPS carries the load on battery',
    detail:
      'Inverters keep the IT supply within tolerance with no input at all. The battery drains at the load. Mechanical plant is held or allowed to coast down under its own sequence. Room temperatures begin to drift.',
    grid: 'lost',
    ups: true,
    gen: false,
    highlight: ['M1-W.upsA', 'M1-W.upsB', 'M1-W.batt', 'M1-W.gpu'],
    teaching:
      'The UPS ride-through is the single most important number in the whole design: it must exceed generator start plus synchronisation plus transfer, with margin. Everything upstream of that number is a business continuity question.',
  },
  {
    id: 3,
    t: 't = 10 s',
    name: 'Generators start',
    detail:
      'The start signal goes out. Sets are started in a staged sequence, not all together — each engine has to accelerate, catch, and build voltage and frequency before it can synchronise to the bus.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['M1-W.gen', 'M1-W.batt'],
    teaching:
      'A failed start is one of the leading causes of data centre outages. Cold-start reliability, starting battery condition and fuel quality are all testable, and all are tested.',
  },
  {
    id: 4,
    t: 't = 15 s',
    name: 'Generators stabilise and synchronise',
    detail:
      'Running sets come up to speed and voltage, then close onto the emergency bus. Paralleling checks voltage, frequency and phase before the breaker closes.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['M1-W.gen', 'M1.mv'],
    teaching:
      'Staged start is what keeps the mechanical plant from tripping the generator. When a fleet is large, the synchronisation time alone can approach the UPS autonomy budget — which is why generator count and control architecture are designed together.',
  },
  {
    id: 5,
    t: 't = 30 s',
    name: 'Load transferred to generation',
    detail:
      'Transfer switches move critical load across. The UPS returns to normal double-conversion operation and begins recharging. Mechanical plant restarts in a controlled order — cooling for the live halls first, then the rest.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['M1-W.gen', 'M1.mv', 'M1.cool', 'M1-W.cdu'],
    teaching:
      'Public arithmetic: 84 x 3.2 MW = 268.8 MW of rated generation against up to 240 MW of IT load alone. Mechanical and electrical auxiliaries consume the rest. This is exactly why an emergency sequence includes an explicit, tested priority-based shed order.',
  },
  {
    id: 6,
    t: 't = 30 s - 2 min',
    name: 'Mechanical plant restored on generator power',
    detail:
      'Heat rejection, pumps and controls restart in sequence. Room conditions are recovered and held. Battery charging is rate-limited so the generators are not pushed past their step capability.',
    grid: 'lost',
    ups: true,
    gen: true,
    highlight: ['M1.cool', 'M1.hx', 'M1.pump', 'M1-W.crahi'],
    teaching:
      'Cooling restart order is not cosmetic: a hall can tolerate a couple of minutes of warm air, a coolant loop much less, and nothing at all if it is already throttling.',
  },
  {
    id: 7,
    t: 'hours',
    name: 'Utility supply restored',
    detail:
      'The transmission owner confirms the fault is cleared. The site receives a return-to-utility signal. This is a deliberate, controlled operation, not a thing that happens automatically.',
    grid: 'restored',
    ups: true,
    gen: true,
    highlight: ['gxp.bay', 'gxp.xfmr'],
    teaching:
      'Riding through a transient on the grid is a deliberate reliability strategy. Some operators will not return to utility at all until the network has been stable for a defined period.',
  },
  {
    id: 8,
    t: 'hours +',
    name: 'Back on utility, generators back to standby',
    detail:
      'Load transfers back to the grid. Generators cool down, run unloaded for a period, then stop and go to standby. Batteries finish recharging. The site returns to the state it was in at t = 0.',
    grid: 'normal',
    ups: true,
    gen: false,
    highlight: ['gxp.xfmr', 'M1.mv'],
    teaching:
      'The cycle is then reported: how long the batteries carried the load, which sets ran, what was shed, and what the post-event inspection found.',
  },
];

export interface FaultScenario {
  id: string;
  label: string;
  targetType: string;
  targetLabel: string;
  /** how many sibling units are modelled for this component type */
  siblings: string;
  consequence: 'absorbed' | 'degraded' | 'critical';
  headline: string;
  bullets: string[];
  caveat: string;
  highlight: string[];
}

/**
 * Every entry is written so the *teaching* survives even though the project's
 * actual redundancy architecture is not public.
 */
export const FAULT_SCENARIOS: FaultScenario[] = [
  {
    id: 'gxp-transformer',
    label: 'GXP transformer',
    targetType: 'gxp-transformer',
    targetLabel: 'GXP power transformer',
    siblings: '3 modelled units (TYPICAL — public documents publish no schedule)',
    consequence: 'degraded',
    headline: 'Capacity falls to the remaining transformers while the campus runs on stored generation or reduced import.',
    bullets: [
      'Three transformers is an awkward number: losing one leaves about two thirds of the modelled import capacity.',
      'If the site is simultaneously on generation, the practical answer is a load cap or a partial shed, not a ride-through.',
      'The correct response depends on the protection and switching scheme, which the transmission owner determines and has not published.',
    ],
    caveat:
      'PUBLIC FACT: a substation with transformers exists. NOT PUBLIC: the count, ratings, or scheme. Any statement here about "two remaining transformers" describes the model, not the project.',
    highlight: ['gxp.xfmr', 'gxp.bay', 'M1.mv'],
  },
  {
    id: 'ups',
    label: 'UPS path (hall A)',
    targetType: 'ups',
    targetLabel: 'UPS module',
    siblings: '2 per hall (A and B) — modelled 2N',
    consequence: 'absorbed',
    headline: 'The redundant UPS carries the hall. The event is a maintenance item, not an outage.',
    bullets: [
      'This only holds if the two UPS paths are genuinely independent all the way back to their sources.',
      'Shared battery strings, shared cooling, shared controls or a shared cable route quietly turn 2N into N.',
      'Audit question: walk the two paths and list everything they share.',
    ],
    caveat: 'NOT PUBLIC: the UPS topology, redundancy level and autonomy at this site. The 2N arrangement shown is TYPICAL.',
    highlight: ['M1-W.upsA', 'M1-W.upsB', 'M1-W.batt'],
  },
  {
    id: 'generator',
    label: 'Generator fails to start',
    targetType: 'generator',
    targetLabel: 'Emergency generator',
    siblings: '84 sets across 6 blocks of 14 — PUBLIC FACT',
    consequence: 'degraded',
    headline: 'Remaining sets pick up the difference; if too many fail, the priority shed sequence takes over.',
    bullets: [
      '84 x 3.2 MW = 268.8 MW rated against up to 240 MW IT, before any auxiliary load.',
      'So the fleet can absorb some losses, but the margin is thin and is consumed by every failed start and every unit held out for maintenance.',
      'Shed order protects the IT load first, then critical cooling, then everything else, in that order.',
    ],
    caveat:
      'PUBLIC FACT: count, rating and block arrangement. NOT PUBLIC: redundancy architecture, load acceptance criteria, fuel autonomy.',
    highlight: ['M1-W.gen', 'M1-W.fuel', 'M1.mv'],
  },
  {
    id: 'pump',
    label: 'Cooling pump',
    targetType: 'pump',
    targetLabel: 'Cooling water pump',
    siblings: '6 modelled per module (TYPICAL duty/assist/standby)',
    consequence: 'absorbed',
    headline: 'Remaining pumps take the flow; the loop setpoint recovers within seconds.',
    bullets: [
      'Flow is recovered by speed control on the surviving pumps, at the cost of pump power — a trade the controls system manages.',
      'If the pump that failed was the standby, there is now no spare until it is repaired.',
      'A pump failure while the plant is restarting on generator power is a much worse event than the same failure on utility.',
    ],
    caveat: 'NOT PUBLIC: pump count or arrangement. Typical for this class of plant.',
    highlight: ['M1.pump', 'M1.hx', 'M1-W.cdu'],
  },
  {
    id: 'cooler',
    label: 'Adiabatic cooling unit',
    targetType: 'adiabatic-cooler',
    targetLabel: 'Heat rejection unit',
    siblings: '12 modelled per module (TYPICAL — public documents publish no unit schedule)',
    consequence: 'degraded',
    headline: 'The array continues at reduced capacity, and the cooling supply temperature rises.',
    bullets: [
      'Losing one of twelve modelled units is roughly 8% of capacity — the reason heat rejection is built as many small units.',
      'Wet-bulb temperature is the limiting condition: on a humid day there may be no headroom to absorb the loss without a chiller or a throttled workload.',
      'A failed unit also takes its water treatment and controls with it if they are unit-mounted.',
    ],
    caveat: 'PUBLIC FACT: evaporative plant with membrane spray to 15-20 C. NOT PUBLIC: unit count, size, staging, redundancy.',
    highlight: ['M1.cool', 'site.wtp', 'M1.hx'],
  },
  {
    id: 'fibre',
    label: 'Fibre route cut',
    targetType: 'fibre-route',
    targetLabel: 'Terrestrial fibre route',
    siblings: '2 diverse terrestrial routes — PUBLIC FACT',
    consequence: 'absorbed',
    headline: 'Traffic shifts to the diverse route. If both are lost, the campus keeps computing but loses its outside world.',
    bullets: [
      'Diversity is the whole design: two physically separate routes from the exchange to the site.',
      'A shared duct, pole, manhole or bridge anywhere on the path quietly destroys the diversity.',
      'An isolated campus still runs its training jobs; it just cannot reach the rest of the world, and that is a commercial event rather than a technical one.',
    ],
    caveat: 'PUBLIC FACT: two diverse terrestrial routes and a ring topology including Australia. NOT PUBLIC: fibre pair counts.',
    highlight: ['site.fibre', 'site.landing', 'site.core'],
  },
  {
    id: 'grid',
    label: 'Grid connection lost',
    targetType: 'hv-line',
    targetLabel: 'Grid connection',
    siblings: 'multiple circuits and a dedicated GXP — PUBLIC FACT that redundancy was designed in, NOT public how',
    consequence: 'absorbed',
    headline: 'The facility becomes an island: UPS bridges the gap, generation takes over, the site runs indefinitely on fuel.',
    bullets: [
      'This is the scenario that defines the entire campus design, and it is exercised in integrated systems testing on load banks.',
      'Everything downstream of the ride-through is about buying time until generation is accepted.',
      'After that, the limit is fuel: tanker logistics and site storage, not the engines.',
    ],
    caveat: 'PUBLIC FACT: 84 sets with 840,000 L of fuel on site and a tanker-based resupply model. NOT PUBLIC: fuel autonomy in hours or days.',
    highlight: ['hv.line', 'gxp.bay', 'gxp.xfmr', 'M1-W.gen'],
  },
];

export interface ShutdownPriority {
  rank: number;
  group: string;
  loads: string;
  rationale: string;
}

export const SHED_PRIORITY: ShutdownPriority[] = [
  { rank: 1, group: 'Never shed', loads: 'IT load, UPS, battery support', rationale: 'Shedding these sheds revenue and, more importantly, risks losing the run.' },
  { rank: 2, group: 'Never shed', loads: 'Critical cooling for live halls', rationale: 'Losing cooling throttles or trips the accelerators within minutes.' },
  { rank: 3, group: 'Shed last', loads: 'Cooling plant auxiliaries and non-critical pumps', rationale: 'Reducible by slowing the loop rather than stopping it.' },
  { rank: 4, group: 'Shed first', loads: 'Building services, lighting, offices, workshops, lifts', rationale: 'No operational value to the IT load during an emergency.' },
  { rank: 5, group: 'Shed second', loads: 'Water treatment, make-up, potable pumps', rationale: 'The storage buffer is what makes this acceptable.' },
  { rank: 6, group: 'Shed third', loads: 'Non-critical IT in halls being commissioned or drained', rationale: 'Capacity not currently earning its keep.' },
];

export interface RedundancyConcept {
  term: string;
  definition: string;
  test: string;
  example: string;
}

export const REDUNDANCY_CONCEPTS: RedundancyConcept[] = [
  {
    term: 'N',
    definition: 'Enough capacity for the load, with no spare. One failure means an outage.',
    test: 'Ask: can any single component be removed for maintenance with the IT load still running? If not, it is N, whatever the drawing says.',
    example: 'A single UPS feeding a hall. Simple, cheap, and it will stop one day.',
  },
  {
    term: 'N+1',
    definition: 'Capacity for the load plus one spare. N components are needed for N of the load; any one can be out.',
    test: 'Ask: with the worst unit offline, can the survivors still carry the design load through a step change? That step capability is what matters, not the nameplate total.',
    example: 'Four cooling units per module, three running. The classic way to build a plant that can be maintained without an outage.',
  },
  {
    term: '2N',
    definition: 'Two complete independent systems, each able to carry 100% of the load.',
    test: 'Ask: walk both paths and list everything they share. Every shared item — a cable route, a controller, a cooling header — is a hole in the claim.',
    example: 'Two UPS paths per hall, A and B, each with its own substation feed.',
  },
  {
    term: '2(N+1)',
    definition: '2N with an extra unit inside each path. Buy more capacity to keep the "no single failure" promise.',
    test: 'Ask: what happens when one unit in each path fails at the same time?',
    example: 'Two generator trains, each with one spare set.',
  },
  {
    term: 'Concurrent maintainability',
    definition: 'Planned work can happen on the facility without interrupting IT — the ability to fix things during a working day.',
    test: 'Ask: can you take any single item out for service on a live campus? This is a design property, not an operational hope.',
    example: 'The ability to service a CDU, a cooling unit or a transformer while training runs continue.',
  },
  {
    term: 'Fault domain',
    definition: 'The set of equipment whose simultaneous failure can take out a defined portion of the facility.',
    test: 'Ask: what is the blast radius of this component? One rack, one row, one hall, or the campus? For an in-row CDU without N+1, the answer is a row.',
    example: 'One hall with its own power, cooling and network is a deliberate fault domain, and it is also a delivery module.',
  },
  {
    term: 'Common mode failure',
    definition: 'One event that removes several nominally independent paths at once — the thing that quietly turns 2N into N.',
    test: 'Ask: what do these supposedly independent paths have in common? Shared cooling water, shared control network, shared ground, shared trench, shared fuel.',
    example: 'One buried duct carrying both fibre routes, or a shared chilled water header feeding both cooling trains.',
  },
];