import { derived, INPUTS } from './calculations';

/**
 * A small, explicit supply-state engine.
 *
 * The utility-loss animation used to be narrative: the text described the
 * sequence but the model did not change. This derives the electrical state from
 * the injected failures, so the numbers the text talks about are the numbers the
 * model holds.
 *
 * It is deliberately not a design tool. No protection coordination, no fault
 * levels, no load-flow. It answers three questions only:
 *   - which sources are energised
 *   - what is carrying the IT load, and from what
 *   - how much UPS energy is left, and what gets shed when it runs out
 */

export type SourceId = 'grid' | 'generation';

export interface SupplyInputs {
  /** utility supply lost at the grid exit point */
  gridLost: boolean;
  /** one or more generators have failed to start or tripped */
  generatorFault: boolean;
  /** a GXP transformer has failed, reducing utility import capacity */
  transformerFailed: boolean;
  /** the generating plant is synchronised and closed onto the emergency bus */
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

/**
 * TYPICAL assumptions, stated so they can be argued with. None of these are
 * published for the reference project.
 */
export const SUPPLY_ASSUMPTIONS = {
  /** utility import capacity with all modelled transformers in service */
  utilityImportMw: derived.generationRatedMW,
  /** utility import with one of three modelled transformers out */
  utilityImportOneOutMw: Math.round(derived.generationRatedMW * 0.62),
  /** mechanical and electrical auxiliary load on top of IT, MW */
  auxiliaryMw: 28,
  /** capacity lost per generator fault, MW (one set) */
  generationLostPerFaultMw: INPUTS.generatorRatedKw / 1000,
  /** how many sets the "generator failed" injection represents */
  generationSetsFailed: 4,
  /** UPS battery energy, kWh */
  batteryKwh: 42_000,
  /** seconds from utility loss to generation synchronised */
  secondsToGeneration: 30,
  /** seconds from utility loss to mechanical plant restarted */
  secondsToMechanicalRestart: 95,
} as const;

/** Priority-ordered shed actions, SYNTHETIC. The order is the teaching point. */
export const SHED_ACTIONS: ShedAction[] = [
  { action: 'Building services, lighting, offices, lifts, workshops', detail: 'Shed first: no operational value to the IT load.', mw: 4 },
  { action: 'Water treatment and make-up pumping', detail: 'Shed second: the storage buffer is what makes this acceptable.', mw: 2 },
  { action: 'Standby cooling and non-critical mechanical plant', detail: 'Shed third: reduce the cooling loop rather than stop it.', mw: 6 },
  { action: 'IT load in halls not currently earning', detail: 'Only once the above are exhausted.', mw: 0 },
  { action: 'IT load and critical cooling', detail: 'Never shed: this is the whole point of the emergency power system.', mw: 0 },
];

export function supplyState(i: SupplyInputs): SupplyState {
  const A = SUPPLY_ASSUMPTIONS;
  const notes: string[] = [];

  const generationFault = i.generatorFault;
  const transformerFault = i.transformerFailed;

  const utilityCapacity = transformerFault ? A.utilityImportOneOutMw : A.utilityImportMw;
  const generationCapacity = Math.max(
    0,
    derived.generationRatedMW - (generationFault ? A.generationLostPerFaultMw * A.generationSetsFailed : 0),
  );

  const gridEnergised = !i.gridLost;
  const generatorsSynchronised = i.generationAvailable && generationCapacity > 0;
  const generationEnergised = generatorsSynchronised;

  const loadMw = INPUTS.itCapacityMW;
  const totalLoad = loadMw + A.auxiliaryMw;

  const carrying: SupplyState['carrying'] = gridEnergised
    ? 'utility'
    : generatorsSynchronised
      ? 'generation'
      : 'battery';

  /* the UPS only discharges while it is carrying the load on its own */
  const onBattery = carrying === 'battery';
  const batteryKwh = onBattery
    ? Math.max(0, A.batteryKwh - (loadMw * i.secondsOnBattery) / 3600)
    : A.batteryKwh;
  const autonomyMinutes = onBattery ? (batteryKwh * 60) / loadMw : Infinity;

  const capacityNowMw =
    carrying === 'utility' ? utilityCapacity : carrying === 'generation' ? generationCapacity : 0;
  const marginMw = capacityNowMw - totalLoad;

  if (onBattery) {
    notes.push(
      `On battery: ${Math.round(batteryKwh).toLocaleString('en-NZ')} kWh remaining, about ${Math.round(
        autonomyMinutes,
      )} minutes of IT autonomy at the present load.`,
    );
  }
  if (carrying === 'generation') {
    notes.push(
      `Generation carrying ${totalLoad.toFixed(0)} MW of load against ${generationCapacity.toFixed(
        0,
      )} MW of available capacity.`,
    );
  }
  if (marginMw < 0) {
    notes.push(
      `Capacity shortfall of ${Math.abs(marginMw).toFixed(0)} MW. Bring generation on, or shed load in priority order.`,
    );
  }
  if (autonomyMinutes < 0.5 && onBattery) {
    notes.push('Autonomy exhausted: load will be shed in priority order.');
  }

  return {
    sources: { grid: gridEnergised ? 'energised' : 'lost', generation: generationEnergised ? 'energised' : 'lost' },
    carrying,
    generatorsSynchronised,
    loadMw,
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
export function supplyFromSequenceStep(
  gridPhase: number,
  faults: string[],
): SupplyInputs {
  /* sequence steps 1-4 are before generation is synchronised */
  const generationAvailable = gridPhase >= 5;
  /* step 7 is 'utility restored' but still on generation; step 8 is back on it */
  const gridLost = gridPhase >= 1 && gridPhase <= 7;
  const secondsOnBattery =
    gridLost && !generationAvailable ? Math.min(120, Math.max(0, (gridPhase - 1) * 30)) : 0;
  return {
    gridLost,
    generatorFault: faults.includes('generator'),
    transformerFailed: faults.includes('gxp-transformer'),
    generationAvailable,
    secondsOnBattery,
  };
}