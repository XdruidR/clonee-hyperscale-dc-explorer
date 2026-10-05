import { derived, INPUTS, ASSUMPTIONS, fmt } from './calculations';

/**
 * A small, explicit supply-state engine.
 *
 * The utility-loss animation used to be narrative: the text described the
 * sequence but the model did not change. This derives the electrical state from
 * the injected failures, so the numbers the text talks about are the numbers the
 * model holds.
 *
 * It is deliberately not a design tool. No protection coordination, no fault
 * levels, no load flow. It answers three questions only:
 *   - which sources are energised
 *   - what is carrying the IT load, and from what
 *   - what has to be shed, and in what order, when capacity is short
 *
 * The most interesting case on this campus is not total grid loss. It is losing
 * one of the three step-down transformers: at the modelled 90 MVA ratings that
 * leaves 180 MVA against a facility draw of about 234 MW, so the campus does
 * not lose power, but it cannot carry everything either.
 */

export type SourceId = 'grid' | 'generation';

export interface SupplyInputs {
  /** utility supply lost at the grid connection point */
  gridLost: boolean;
  /** one or more generators have failed to start or tripped */
  generatorFault: boolean;
  /** one of the three step-down transformers is out of service */
  transformerFailed: boolean;
  /** the generating plant is synchronised and closed onto the MV bus */
  generationAvailable: boolean;
  /** measured from the moment utility was lost */
  secondsOnBattery: number;
}

export interface ShedAction {
  action: string;
  detail: string;
  mw: number;
}

export interface SupplyState {
  sources: Record<SourceId, 'energised' | 'lost'>;
  carrying: 'utility' | 'battery' | 'generation';
  generatorsSynchronised: boolean;
  loadMw: number;
  totalLoadMw: number;
  utilityCapacityMw: number;
  generationCapacityMw: number;
  capacityNowMw: number;
  batteryKwh: number;
  autonomyMinutes: number;
  /** priority-ordered actions, in the order they would run */
  shed: ShedAction[];
  marginMw: number;
  notes: string[];
}

const A = Object.fromEntries(ASSUMPTIONS.map((x) => [x.key, x.value])) as Record<string, number>;

/**
 * TYPICAL assumptions, stated so they can be argued with. None of these are
 * published for Clonee.
 */
export const SUPPLY_ASSUMPTIONS = {
  /** utility import capacity with all three modelled transformers in service */
  utilityImportMw: derived.transformerTotalMva,
  /** utility import with one of the three modelled transformers out */
  utilityImportOneOutMw: derived.nMinusOneMva,
  /**
   * Electrical and mechanical load that must survive a utility loss, on top of
   * IT: cooling pumps and fans, heat rejection, control, fire and security.
   */
  criticalAuxiliaryMw: 22,
  /** Everything else that can be shed: amenities, lighting, offices, non-critical plant. */
  nonCriticalAuxiliaryMw: 12,
  /** capacity lost per generator fault, MW (one set) */
  generationLostPerFaultMw: A.generatorRatedKw / 1000,
  /** how many sets the "generator failed" injection represents */
  generationSetsFailed: 2,
  /** UPS battery energy per building, kWh */
  batteryKwh: 3_600,
  /** seconds from utility loss to generation synchronised */
  secondsToGeneration: 30,
  /** seconds from utility loss to mechanical plant restarted */
  secondsToMechanicalRestart: 95,
  /** seconds of UPS autonomy the model claims, before the generators are trusted */
  secondsOfBatteryRidingThrough: 45,
} as const;

/** Priority-ordered shed actions. The order is the teaching point. */
export const SHED_ACTIONS: ShedAction[] = [
  {
    action: 'Building services, lighting, offices, lifts, workshops',
    detail: 'Shed first. No operational value to the IT load, and it is the fastest load to recover when utility returns.',
    mw: 12,
  },
  {
    action: 'Non-critical mechanical plant and water make-up pumping',
    detail:
      'Shed second. The stored cooling water and the economiser capability are what make this acceptable — you reduce the loop rather than stop it.',
    mw: 22,
  },
  {
    action: 'One building of IT load',
    detail:
      'Only once the above are exhausted, and only because a building is the largest indivisible block on this campus. Shedding a hall rather than a building would be finer-grained, but no building can be isolated from the shared MV and cooling plant.',
    mw: INPUTS.itMwPerBuilding,
  },
  {
    action: 'Critical cooling and the remaining buildings’ IT load',
    detail: 'Never shed. This is the whole point of the emergency power system.',
    mw: 0,
  },
];

export function supplyState(i: SupplyInputs): SupplyState {
  const notes: string[] = [];

  const utilityCapacity = i.transformerFailed
    ? SUPPLY_ASSUMPTIONS.utilityImportOneOutMw
    : SUPPLY_ASSUMPTIONS.utilityImportMw;

  const generationCapacity = Math.max(
    0,
    derived.generatorRatedMW -
      (i.generatorFault ? SUPPLY_ASSUMPTIONS.generationLostPerFaultMw * SUPPLY_ASSUMPTIONS.generationSetsFailed : 0),
  );

  const gridEnergised = !i.gridLost;
  const generatorsSynchronised = i.generationAvailable && generationCapacity > 0;

  const itLoad = derived.itCapacityMW;
  /* What has to stay running on generation: IT plus the critical auxiliary load. */
  const totalLoad = itLoad + SUPPLY_ASSUMPTIONS.criticalAuxiliaryMw;
  /* What the utility has to carry on a normal day: all of it. */
  const utilityDayLoad = derived.facilityLoadMW;

  const carrying: SupplyState['carrying'] = gridEnergised
    ? 'utility'
    : generatorsSynchronised
      ? 'generation'
      : 'battery';

  /* The UPS only discharges while it is carrying the load on its own. */
  const onBattery = carrying === 'battery';
  const batteryKwh = onBattery
    ? Math.max(0, SUPPLY_ASSUMPTIONS.batteryKwh - (itLoad * i.secondsOnBattery) / 3600)
    : SUPPLY_ASSUMPTIONS.batteryKwh;
  const autonomyMinutes = onBattery ? (batteryKwh * 60) / itLoad : Infinity;

  const capacityNowMw =
    carrying === 'utility' ? utilityCapacity : carrying === 'generation' ? generationCapacity : 0;
  const demandNowMw = carrying === 'utility' ? utilityDayLoad : totalLoad;
  const marginMw = capacityNowMw - demandNowMw;

  if (onBattery) {
    notes.push(
      `On battery: ${fmt(batteryKwh, 0)} kWh remaining per building, about ${fmt(autonomyMinutes, 1)} minutes of IT autonomy at the present load.`,
    );
  }
  if (carrying === 'generation') {
    notes.push(
      `Generation carrying ${totalLoad.toFixed(0)} MW against ${generationCapacity.toFixed(0)} MW of available capacity, a margin of ${marginMw.toFixed(0)} MW.`,
    );
  }
  if (i.transformerFailed && !i.gridLost) {
    notes.push(
      `One step-down transformer is out. ${fmt(SUPPLY_ASSUMPTIONS.utilityImportOneOutMw, 0)} MVA remains against a facility draw of ${fmt(derived.facilityLoadMW, 0)} MW, so the campus is ${fmt(Math.abs(marginMw), 0)} MW short of carrying everything.`,
    );
  }
  if (i.generatorFault) {
    notes.push(
      `${SUPPLY_ASSUMPTIONS.generationSetsFailed} sets failed to start, removing ${fmt(
        SUPPLY_ASSUMPTIONS.generationLostPerFaultMw * SUPPLY_ASSUMPTIONS.generationSetsFailed,
        1,
      )} MW of standby capacity.`,
    );
  }
  if (marginMw < 0) {
    notes.push(
      `Capacity shortfall of ${fmt(Math.abs(marginMw), 0)} MW. Bring generation on, or shed load in priority order.`,
    );
  }
  if (autonomyMinutes < 0.75 && onBattery) {
    notes.push('Autonomy nearly exhausted: load will be shed in priority order unless generation arrives.');
  }

  return {
    sources: { grid: gridEnergised ? 'energised' : 'lost', generation: generatorsSynchronised ? 'energised' : 'lost' },
    carrying,
    generatorsSynchronised,
    loadMw: itLoad,
    totalLoadMw: totalLoad,
    utilityCapacityMw: utilityCapacity,
    generationCapacityMw: generationCapacity,
    capacityNowMw,
    batteryKwh,
    autonomyMinutes,
    shed: SHED_ACTIONS,
    marginMw,
    notes,
  };
}

/**
 * Derive the engine inputs from the grid-failure animation step and the active
 * fault injections, so the animation and the model cannot disagree.
 */
export function supplyFromSequenceStep(gridPhase: number, faults: string[]): SupplyInputs {
  /* Sequence steps 1-4 are before generation is synchronised. */
  const generationAvailable = gridPhase >= 5;
  /* Step 7 is 'utility restored' but still on generation; step 8 is back on it. */
  const gridLost = gridPhase >= 1 && gridPhase <= 7;
  const secondsOnBattery =
    gridLost && !generationAvailable ? Math.min(120, Math.max(0, (gridPhase - 1) * 30)) : 0;
  return {
    gridLost,
    generatorFault: faults.includes('generator'),
    transformerFailed: faults.includes('sub-transformer'),
    generationAvailable,
    secondsOnBattery,
  };
}