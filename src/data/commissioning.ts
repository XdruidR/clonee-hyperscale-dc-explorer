import { PHASES } from './phases';

export interface CxStage {
  id: string;
  level: string;
  name: string;
  detail: string;
  evidence: string;
  days: number;
  /** stage ids that must be complete before this stage can start */
  needs: string[];
}

export const CX_STAGES: CxStage[] = [
  {
    id: 'design-review',
    level: 'Pre-construction',
    name: 'Design verification',
    detail:
      'Commissioning reviews the owner\'s requirements, basis of design and specifications before construction starts, then reviews shop drawings and equipment submittals. The expensive time to say "this will not work" is now.',
    evidence: 'Submittal review records, design review minutes, approved commissioning plan',
    days: 20,
    needs: [],
  },
  {
    id: 'factory-test',
    level: 'L1',
    name: 'Factory testing (FAT / witness)',
    detail:
      'Critical equipment is tested at the manufacturer before it ships: switchgear, UPS, generators, cooling units. Witnessed tests are the only way to avoid discovering a defect on site.',
    evidence: 'Factory witness test reports signed before shipment',
    days: 25,
    needs: ['design-review'],
  },
  {
    id: 'install-check',
    level: 'L2',
    name: 'Installation checks',
    detail:
      'Receiving inspection, mechanical completion, bolting, alignment, pipework installation, earthworks, containment. Everything is verified as installed to the drawing, de-energised.',
    evidence: 'Inspection and test plan records, receiving logs, dimensional checks',
    days: 30,
    needs: ['factory-test'],
  },
  {
    id: 'electrical-test',
    level: 'L2',
    name: 'Electrical testing',
    detail:
      'Insulation resistance, polarity, phase rotation, earth continuity, thermographic survey, protective relay settings verified, cable testing. Torque checks on every bolted connection in a busway-heavy design.',
    evidence: 'Test certificates, relay setting schedules, IR reports',
    days: 15,
    needs: ['install-check'],
  },
  {
    id: 'pressure-test',
    level: 'L3',
    name: 'Pressure testing and flushing',
    detail:
      'Every water loop is pressure tested, flushed, cleaned and chemically treated before it goes near equipment. A cooling loop with construction debris in it is a very expensive lesson.',
    evidence: 'Pressure test records, flushing logs, cleanliness samples',
    days: 15,
    needs: ['install-check'],
  },
  {
    id: 'controls-test',
    level: 'L3',
    name: 'Controls and points-to-point',
    detail:
      'Sensors calibrated and proven, points-to-point verified from field device to graphic, sequences of operation reviewed and approved. Controls are what make a data centre a data centre.',
    evidence: 'Point-to-point logs, calibration records, approved sequence of operation',
    days: 20,
    needs: ['electrical-test', 'pressure-test'],
  },
  {
    id: 'energise',
    level: 'L3',
    name: 'Energisation',
    detail:
      'Systems are energised in a controlled sequence, normally from the substation outward: substation, MV, transformers, LV, then UPS. Every step is a hold point with witnesses.',
    evidence: 'Energisation permits, hold-point sign-offs, witnessed first energisation',
    days: 12,
    needs: ['controls-test'],
  },
  {
    id: 'functional-test',
    level: 'L4',
    name: 'Functional performance testing',
    detail:
      'Each system is tested against its own sequence of operation: UPS normal to battery to bypass and back, generator start, load accept and unload, cooling staging, alarms and resets. Measured, not observed.',
    evidence: 'Signed FPT scripts with measured results and a deficiency log',
    days: 25,
    needs: ['energise'],
  },
  {
    id: 'load-test',
    level: 'L4',
    name: 'Load bank testing',
    detail:
      'There are no servers yet, so the design load has to be manufactured. Electrical load banks pull design kW and kVA; thermal load banks put heat into the white space so the cooling plant has something real to reject.',
    evidence: 'Continuous load bank logs with steady-state and step-response data',
    days: 20,
    needs: ['functional-test'],
  },
  {
    id: 'failure-test',
    level: 'L5',
    name: 'Failure / failure-mode testing',
    detail:
      'Individual failures are injected on purpose to prove the redundancy is real: fail a generator, a UPS module, a pump, a cooling unit, a feeder, and confirm the critical load stays up.',
    evidence: 'Scenario scripts with preconditions, expected results and abort criteria',
    days: 15,
    needs: ['functional-test', 'load-test'],
  },
  {
    id: 'thermal-test',
    level: 'L4/L5',
    name: 'Thermal and cooling performance',
    detail:
      'Room conditions proved with thermal load: inlet temperatures, containment behaviour, leak detection zones, coolant supply above dew point, and control response when load changes quickly.',
    evidence: 'Thermal test reports, thermal imaging, humidity and dew point records',
    days: 15,
    needs: ['functional-test', 'load-test'],
  },
  {
    id: 'it-readiness',
    level: 'L5',
    name: 'Network and IT readiness',
    detail:
      'Structured cabling certification, optics and transceivers, fabric validation, firmware baselines, and the tenant\'s own acceptance tests. The building has to be handed over as a working machine.',
    evidence: 'Certification reports, fabric test results, IT readiness sign-off',
    days: 15,
    needs: ['functional-test'],
  },
  {
    id: 'ist',
    level: 'L5',
    name: 'Integrated systems testing',
    detail:
      'The whole facility at design load, then scripted facility-level failures: pull the utility, watch the UPS carry, the generators start and take load, the mechanical plant restarts in the right order, the critical bus never drops. This is the acceptance test.',
    evidence: 'Scripted IST records with time-synchronised instrumentation, witness sign-off',
    days: 21,
    needs: ['failure-test', 'thermal-test', 'it-readiness'],
  },
  {
    id: 'reliability',
    level: 'Post-L5',
    name: 'Reliability demonstration',
    detail:
      'Extended run under load proving availability, alarm nuisance tuning, operating procedures rehearsed by the operators who will actually use them.',
    evidence: 'Availability report, alarm rationalisation record, operator competency sign-off',
    days: 20,
    needs: ['ist'],
  },
  {
    id: 'handover',
    level: 'Close',
    name: 'Operational handover',
    detail:
      'As-built information, training completion, spares, maintenance regime, outstanding defects closed or accepted. Turnover is a documented package, not a ceremony.',
    evidence: 'Turnover index resolving every item to retrievable evidence, owner acceptance',
    days: 10,
    needs: ['reliability'],
  },
];

export const CX_BY_ID: Record<string, CxStage> = Object.fromEntries(CX_STAGES.map((s) => [s.id, s]));

export const CX_ORDER = CX_STAGES.map((s) => s.id);

export function cxOrderIndex(id: string) {
  return CX_ORDER.indexOf(id);
}

/** Synthetic indicative commissioning duration for one hall of a three-module campus. */
export const CX_TOTAL_DAYS = CX_STAGES.reduce((a, s) => a + s.days, 0);

/** Construction-phase mapping to commissioning, for the timeline legend. */
export const CX_PHASE_ALIGNMENT: Record<string, number> = {
  'design-review': 0,
  'factory-test': 14,
  'install-check': 21,
  'electrical-test': 30,
  'pressure-test': 20,
  'controls-test': 26,
  energise: 31,
  'functional-test': 31,
  'load-test': 32,
  'failure-test': 32,
  'thermal-test': 32,
  'it-readiness': 32,
  ist: 32,
  reliability: 34,
  handover: 35,
};

/** Scenario prompts for the simulated commissioning exercises. */
export interface CxScenario {
  id: string;
  prompt: string;
  whatYouAreTesting: string;
  expected: string[];
  watch: string[];
}

export const CX_SCENARIOS: CxScenario[] = [
  {
    id: 'utility',
    prompt: 'Pull the utility power. Does the facility survive?',
    whatYouAreTesting: 'The full emergency power chain, end to end, on the real building.',
    expected: [
      'UPS takes the IT load on battery without the critical bus leaving tolerance',
      'Generators start and synchronise, then take load with UPS support',
      'Mechanical plant restarts in a staggered sequence, not all at once',
      'No IT interruption; alarms are generated and cleared in the expected order',
    ],
    watch: ['The measured UPS autonomy actually remaining as the transfer happened', 'Generator step-load acceptance', 'Whether cooling restarted before the hall needed it'],
  },
  {
    id: 'gen',
    prompt: 'Fail one generator during the outage.',
    whatYouAreTesting: 'Generation redundancy, or the load-shedding sequence if the fleet is at its margin.',
    expected: [
      'Remaining units accept the load, or the priority-based shed sequence runs',
      'The building recognises reduced generation capacity and applies limits',
      'UPS battery recharge is limited so the generators are not overloaded',
    ],
    watch: [
      'Public arithmetic: 84 x 3.2 MW = 268.8 MW rated against up to 240 MW IT. Losing units consumes the margin quickly.',
      'Whether mechanical restart is re-staged after a generation event',
    ],
  },
  {
    id: 'pump',
    prompt: 'Fail one cooling pump.',
    whatYouAreTesting: 'Cooling loop redundancy and flow control.',
    expected: ['Remaining pumps take the flow with the setpoint recovered', 'No supply temperature excursion at the racks', 'Standby pump available for maintenance'],
    watch: ['Pump power when every pump restarts at once on generator power', 'Whether the loss is detected before the loop is starved'],
  },
  {
    id: 'path',
    prompt: 'Lose one electrical path.',
    whatYouAreTesting: 'Whether the redundancy claim on the one-line is physically real.',
    expected: ['The independent path carries the critical load without interruption', 'No unintended cross-connection between paths', 'Transfer devices operate as designed'],
    watch: ['Shared equipment between the two "independent" paths — a very common audit finding'],
  },
  {
    id: 'cool',
    prompt: 'Fail one cooling unit.',
    whatYouAreTesting: 'Heat rejection capacity and its effect on the wet-bulb-limited plant.',
    expected: ['Array continues at reduced capacity', 'Coolant supply temperature rises; control responds', 'Room temperature stays inside the band for the failure duration'],
    watch: ['Whether the system has enough wet-bulb headroom to survive without the failed unit'],
  },
  {
    id: 'fibre',
    prompt: 'Cut one fibre route.',
    whatYouAreTesting: 'Path diversity in the network.',
    expected: ['Traffic shifts to the diverse route', 'Cluster operations continue', 'Alarm and capacity reporting updated'],
    watch: ['Whether both routes genuinely share a duct, a pole or a manhole anywhere on the path'],
  },
];

/** Phased delivery explanation shown in construction mode. */
export const MODULAR_DELIVERY_NOTES: string[] = [
  'Public fact: the consented programme is not six halls at once. Phase 1 is three halls of about 8,210 m2 each; phase 2 is a small addition to two of the three buildings, and the middle building has no phase 2 area.',
  'Public fact: the site is described as being developed as a park where individual data centres are established in a staged manner as operators take space.',
  'Why this matters technically: every hall is an independent fault domain with its own power, cooling and IT. Phasing is therefore a resilience strategy, not just a commercial one.',
  'Why it matters commercially: capacity is leased, not speculative. The infrastructure has to be sized and stubbed for the full campus while only the live modules are commissioned and operated.',
  'Typical practice: long-lead plant (transformers, switchgear, UPS, cooling) is ordered against the full campus scope early, then installed module by module, so procurement leads the construction programme.',
];

export function phaseOfStage(stageId: string) {
  return PHASES[CX_PHASE_ALIGNMENT[stageId] ?? 0];
}