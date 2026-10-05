/**
 * Commissioning model.
 * The stage list follows the industry L0–L6 structure: design and planning,
 * factory testing, delivery and installation, pre-functional and start-up,
 * functional performance, integrated systems testing, and closeout. There is no
 * universal mandatory mapping between the level numbers and a single set of
 * activities, so the names are written out rather than relying on the numbers
 * alone.
 *
 * Clonee publishes no commissioning information. Everything here is accepted
 * industry practice, and the Commissioning mode says so plainly. What makes it
 * worth having is that the stages are wired to the system model: a stage can
 * only advance if the turnover packages it depends on are signed off, which is
 * the whole point of modelling commissioning as packages rather than as a
 * progress bar.
 */

import { PHASES } from './phases';

export interface CxStage {
  id: string;
  /** the L level this stage belongs to, for readers who know the convention */
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';
  name: string;
  detail: string;
  /** the evidence this stage produces, which is what actually closes it out */
  evidence: string;
  /** indicative duration in days */
  days: number;
  /** stage ids that must be complete first */
  needs: string[];
}

export const CX_STAGES: CxStage[] = [
  {
    id: 'design-review',
    level: 'L0',
    name: 'Design verification',
    detail:
      'The commissioning plan, the design intent document and every test procedure are written and reviewed before the equipment is built, not after. On a project this size the sequence of operation for the emergency power system has to be agreed with the operator before it is built into switchgear.',
    evidence: 'Approved commissioning plan, design intent document, agreed sequence of operation.',
    days: 30,
    needs: [],
  },
  {
    id: 'factory-test',
    level: 'L1',
    name: 'Factory acceptance testing',
    detail:
      'Witnessed testing at the manufacturer before shipment. This matters most for the equipment with the longest lead times: the 220 kV switchgear, the step-down transformers, the MV switchgear and every generator. A defect caught in the factory is fixed on the manufacturer’s time and at the manufacturer’s cost; the same defect found on site is a delay to the whole campus.',
    evidence: 'Factory test reports, witnessed test certificates, packing and shipping records.',
    days: 14,
    needs: ['design-review'],
  },
  {
    id: 'install-check',
    level: 'L2',
    name: 'Equipment receipt and installation checks',
    detail:
      'Verification on site that the equipment survived transport and was installed correctly: torque records, alignment, oil and coolant filling, earth continuity, and incoming inspection. This is the last cheap checkpoint before the work becomes hard to undo.',
    evidence: 'Delivery and unpacking records, installation inspection sheets, torque and test records.',
    days: 21,
    needs: ['factory-test'],
  },
  {
    id: 'electrical-test',
    level: 'L2',
    name: 'Electrical testing',
    detail:
      'Insulation resistance, phase sequence, phase balance, earth continuity and switchgear interlocks proved on the installed system. Electrical commissioning is usually the longest of the package test phases, and it involves many power-off and power-on cycles.',
    evidence: 'Test results per circuit, protection settings, interlock proving records.',
    days: 21,
    needs: ['install-check'],
  },
  {
    id: 'pressure-test',
    level: 'L2',
    name: 'Pressure testing and flushing',
    detail:
      'Cooling water circuits pressure tested, flushed and cleaned to the specified cleanliness before any valve or heat exchanger is connected. Cooling water quality at handover depends entirely on this having been done properly, and a hall cannot be cleaned once it is full of racks.',
    evidence: 'Pressure test certificates, flushing and cleaning records, water quality analysis.',
    days: 18,
    needs: ['install-check'],
  },
  {
    id: 'controls-test',
    level: 'L3',
    name: 'Controls validation and point-to-point',
    detail:
      'Every sensor, actuator, setpoint, alarm and interlock proved end to end against the written sequence of operation. Nothing is commissioned without controls, and nothing can be operated safely until the controls are trusted. This is where a plant that looks finished on the day still cannot be started.',
    evidence: 'Point-to-point schedules, sequence of operation test records, alarm and interlock verification.',
    days: 24,
    needs: ['electrical-test', 'pressure-test'],
  },
  {
    id: 'energise',
    level: 'L3',
    name: 'Energisation',
    detail:
      'The system is made live for the first time, in a defined order from the substation outwards. On this campus that order runs from the 220 kV loop-in through the switchyard, the step-down transformers, the underground 20 kV cables and each building in turn. Energisation is a sequence with dependencies, and the wrong order damages equipment.',
    evidence: 'Energisation permit, switching schedule, protection settings confirmed in service.',
    days: 10,
    needs: ['controls-test'],
  },
  {
    id: 'functional-test',
    level: 'L4',
    name: 'Functional performance testing',
    detail:
      'Each system tested against its sequence of operation rather than against a checklist of parts: does the emergency power system actually transfer, does the cooling plant actually hold temperature under load, do the interlocks actually prevent the combination they claim to prevent. This is the stage where a system that passed every individual test still turns out not to work as a system.',
    evidence: 'Functional test records against the approved sequence of operation.',
    days: 30,
    needs: ['energise'],
  },
  {
    id: 'load-test',
    level: 'L4',
    name: 'Load bank testing',
    detail:
      'Generation and UPS plant proved at load. On a hyperscale programme the integrated generator load bank alone runs for weeks per switchgear lineup and cannot be compressed without breaking protocol, because every set has to be present, synchronised and tested before the installation can be declared ready.',
    evidence: 'Load bank test records, generator synchronising and step-load results, fuel consumption data.',
    days: 25,
    needs: ['functional-test'],
  },
  {
    id: 'thermal-test',
    level: 'L4',
    name: 'Thermal validation',
    detail:
      'The hall proved thermally before IT is admitted: air movement, containment effectiveness, temperature gradients across the floor, and the behaviour of the plant at part load and at full load. A hall can be electrically complete and thermally unable to accept IT load, which is the most common reason a data hall handover slips.',
    evidence: 'Thermal mapping, temperature gradient survey, containment and airflow test records.',
    days: 21,
    needs: ['functional-test'],
  },
  {
    id: 'failure-test',
    level: 'L4',
    name: 'Failure scenario testing',
    detail:
      'The scenarios in the Resilience mode, proved on the real installation: utility loss and transfer to generation, loss of a step-down transformer, loss of an MV board, loss of a UPS path, loss of a cooling bank, loss of a pump. Each is scripted, timestamped, recorded and reviewed.',
    evidence: 'Scripted failure test records with timestamped logs, video and witness signatures.',
    days: 18,
    needs: ['functional-test', 'load-test'],
  },
  {
    id: 'it-readiness',
    level: 'L4',
    name: 'IT readiness',
    detail:
      'The hall proved as a place where IT equipment can safely be installed and operated: power quality and phase balance verified at the rack, thermal stability over a defined soak, monitoring and telemetry live, and the operational procedures written and rehearsed.',
    evidence: 'Power quality records at the rack, soak report, monitoring and telemetry verification.',
    days: 14,
    needs: ['thermal-test'],
  },
  {
    id: 'ist',
    level: 'L5',
    name: 'Integrated systems testing',
    detail:
      'The whole installation working together, on load, at the design point, with the full complement of generators and the utility present. Multi-day scripted test days covering utility loss, generation start and transfer, cooling failover, network failover and load acceptance. It is the longest and most weather-dependent window in any data centre programme, and it is the stage most often compressed.',
    evidence: 'Integrated test day schedule, timestamped results, defect and close-out register.',
    days: 30,
    needs: ['failure-test', 'it-readiness'],
  },
  {
    id: 'reliability',
    level: 'L6',
    name: 'Reliability demonstration and tuning',
    detail:
      'An extended run proving availability, reducing nuisance alarms, tuning control loops against real load, and completing staff training. Some testing is seasonal or deferred by design, which is why commissioning activity can continue after occupancy rather than ending at handover.',
    evidence: 'Availability report, alarm and tuning records, training completion records.',
    days: 45,
    needs: ['ist'],
  },
  {
    id: 'handover',
    level: 'L6',
    name: 'Turnover and operational handover',
    detail:
      'As-built information, spare parts, maintenance regime, operating procedures, and the transfer to operations. For the campus as a whole this is the moment a building stops being a construction site and becomes part of a facility that is expected to run continuously.',
    evidence: 'As-built drawings, O&M manuals, spares schedule, training and handover certificates.',
    days: 21,
    needs: ['reliability'],
  },
];

export const CX_BY_ID: Record<string, CxStage> = Object.fromEntries(CX_STAGES.map((s) => [s.id, s]));

export const CX_ORDER = CX_STAGES.map((s) => s.id);

export function cxOrderIndex(stageId: string) {
  return CX_ORDER.indexOf(stageId);
}

export const CX_TOTAL_DAYS = CX_STAGES.reduce((a, s) => a + s.days, 0);

/** Total indicative days for a package, from its own stage list. */
export function cxDaysFor(stages: string[]) {
  return stages.reduce((a, id) => a + (CX_BY_ID[id]?.days ?? 0), 0);
}

/**
 * Which construction phase each stage lands in, per building.
 *
 * DELIVERY_LAG is the offset from a building's shell phase to the phase where
 * its commissioning completes. It is SYNTHETIC: no public record dates Clonee's
 * commissioning activities, and the brief is explicit that exact durations do
 * not need to be historical.
 */
export const DELIVERY_LAG = 2;

export function phaseOfStage(stageId: string, shellPhase: number): number {
  void stageId;
  return Math.min(PHASES.length - 1, shellPhase + DELIVERY_LAG);
}

/**
 * The scripted commissioning scenarios, which double as the Resilience mode's
 * proof obligations. Each one is a thing that must be demonstrated before an
 * installation can be trusted.
 */
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
    prompt: 'Open the utility supply at the point of common connection.',
    whatYouAreTesting:
      'The whole emergency power chain, from detection of loss to the halls being carried by generation.',
    expected: [
      'Utility lost at the point of common connection.',
      'UPS carries the load on battery immediately, with no break in supply.',
      'Generators start and reach rated voltage.',
      'Generators synchronise and close onto the campus MV bus.',
      'Load is transferred to generation.',
      'Mechanical plant restarts in a controlled sequence.',
    ],
    watch: [
      'How long the UPS actually bridges the gap, measured rather than assumed.',
      'Whether the mechanical restart is sequenced, or whether everything tries to start at once.',
      'Whether any alarm is raised that the operators would have to work through during the event.',
    ],
  },
  {
    id: 'transformer',
    prompt: 'Take one of the three step-down transformers out of service at the campus peak load.',
    whatYouAreTesting:
      'Whether the substation has enough capacity left to carry the campus without losing a building.',
    expected: [
      'Two transformers remain carrying the whole campus.',
      'Campus load is redistributed onto the remaining units.',
      'Load is shed in priority order rather than tripping.',
      'No hall loses power unexpectedly.',
    ],
    watch: [
      'The modelled shortfall. Three transformers give 270 MVA; losing one leaves 180 MVA against a facility draw of roughly 225 MW, so the campus cannot carry everything.',
      'Which load is shed and whether the shed order is the one operators agreed.',
      'Whether the protection discriminates correctly, so a fault on the healthy side is not taken as a reason to trip the whole substation.',
    ],
  },
  {
    id: 'generation',
    prompt: 'Fail one generator while the campus is running on generation.',
    whatYouAreTesting:
      'Whether a single set can fail without the installation losing the load it is carrying.',
    expected: [
      'The failed set trips and is isolated.',
      'The remaining sets pick up the load.',
      'The campus keeps running.',
      'The failure is annunciated and recorded.',
    ],
    watch: [
      'That this is the whole reason for N+1 rather than N. At 18 sets per building against 36 MW of IT, losing one set is a non-event; losing two is not.',
      'Whether fuel pressure and starting battery health are still adequate after the transfer.',
    ],
  },
  {
    id: 'pump',
    prompt: 'Fail a cooling water pump in a hall plant group.',
    whatYouAreTesting:
      'Whether the cooling loop keeps flow, and how fast temperature recovers, when one pump goes.',
    expected: [
      'The pump trips on overload or low flow.',
      'The standby pump starts.',
      'Flow is restored without a loss of supply to the heat exchangers.',
      'Hall temperature returns to setpoint.',
    ],
    watch: [
      'Time to recover. A cooling system has a thermal mass that buys minutes, and how many minutes depends on the outside air temperature at the time.',
      'Whether the standby pump is genuinely independent, or shares a feed, a starter or a power supply with the duty pump.',
    ],
  },
  {
    id: 'cooling',
    prompt: 'Fail one full bank of heat rejection units in a building.',
    whatYouAreTesting:
      'Whether the remaining plant can hold hall temperature through the loss of a whole bank.',
    expected: [
      'The failed bank is isolated.',
      'Fan and pump staging responds.',
      'Hall temperature is held, or load is reduced.',
      'The condition is annunciated before it becomes a trip.',
    ],
    watch: [
      'The outside air temperature at the time of the test. Heat rejection on this campus is air-side, so the same test passes in March and fails in August.',
      'Whether the test was scheduled on a day the facility could afford to fail. Seasonal testing is the classic reason commissioning runs into occupancy.',
    ],
  },
  {
    id: 'fibre',
    prompt: 'Sever one of the two external fibre routes.',
    whatYouAreTesting:
      'Whether external connectivity survives the loss of a single physical route.',
    expected: [
      'The loss is detected on the affected route.',
      'Traffic moves to the diverse route.',
      'No loss of service to the halls.',
      'The fault is located and reported.',
    ],
    watch: [
      'How quickly, and from where. A ring only protects against a cut if both ends can see the break.',
      'Whether the two routes are genuinely diverse or merely separate on a drawing. Shared ducting, a shared bridge or a shared landlord compound removes the diversity entirely.',
    ],
  },
];

/**
 * How this campus was actually phased, and why that is more interesting than a
 * generic sequence. These are teaching notes, not generic practice statements.
 */
export const MODULAR_DELIVERY_NOTES: string[] = [
  'Clonee was delivered as overlapping phases, not sequential ones. The second building was left as a completed shell at the end of phase 1 and fitted out afterwards, while the third phase was already starting on site.',
  'The 220 kV station was finished and energised in August 2017, ahead of most of the buildings. That sequencing is deliberate: the grid connection is the longest and least controllable part of the programme, so it runs first and everything else is planned around it.',
  'EirGrid records the connection as taking approximately 15 months. On this kind of project that is fast, and it was achieved by having the customer build the station themselves rather than waiting for the transmission system owner to build it.',
  'The expansion buildings were consented in 2018 and announced for construction in March 2019, so they were being built while CLN1 and CLN2 were already carrying production traffic.',
  'Building beside an operating campus turns live-site interfaces into programme logic. Outage windows, protection of live plant, and access across operating roads are scheduled constraints with dates attached, not site notes.',
];