/**
 * Canonical calculations.
 *
 * Every number the application displays is derived here, once, from published
 * inputs. Nothing in the UI, in narrative prose or in the fact register is
 * allowed to restate a derived quantity by hand: if a displayed figure can be
 * traced to an input below, it is generated from `derived`.
 *
 * The distinction that matters:
 *   inputs  - published quantities, each traceable to a source id
 *   derived - arithmetic on those inputs only. No assumptions are introduced.
 *
 * Where an assumption IS required (UPS efficiency, PUE, load factors) it is
 * declared in `assumptions` with its own classification, so it can never be
 * mistaken for a published figure.
 */

import type { Classification } from './types';

/* ------------------------------------------------------------------ inputs */

export const INPUTS = {
  /** consented IT capacity */
  itCapacityMW: 240,
  hoursPerYear: 8760,
  /** data halls across three modules */
  hallCount: 6,
  moduleCount: 3,
  /** phase 1 hall footprint, from the public building schedule */
  hallFootprintM2: 8210,
  /** generator fleet */
  generatorCount: 84,
  generatorBlocks: 6,
  generatorPerBlock: 14,
  generatorRatedKw: 3200,
  /** heat release per set, published */
  generatorHeatReleaseMW: 5.3,
  /** fuel */
  generatorDieselLPerHour: 817.7,
  generatorBellyTankL: 10_000,
  /** cooling water scenario, from the servicing report */
  coolingDemandM3Yr: 288_000,
  coolingStorageM3: 75_000,
  rainwaterCaptureM3Yr: 75_000,
  groundwaterTakeM3Yr: 220_752,
  groundwaterAnticipatedM3Yr: 212_600,
  roofCaptureM2: 30_000,
  hardstandCaptureM2: 65_000,
  wetlandRechargeM3Yr: 157_000,
  preDevelopmentRunoffM3Yr: 167_000,
  longTermRainfallMmYr: 1100,
  potableStorageM3: 150,
  potableRoofM2: 3000,
  wastewaterLPerDay: 5000,
  /** site */
  siteAreaHa: 49,
} as const;

/** Assumptions are NOT public facts. Each is labelled so the UI can say so. */
export const ASSUMPTIONS: { key: string; value: number; unit: string; classification: Classification; why: string }[] = [
  {
    key: 'upsEfficiency',
    value: 0.96,
    unit: 'fraction',
    classification: 'TYPICAL',
    why: 'Double-conversion UPS efficiency. Not published for this project.',
  },
  {
    key: 'distributionEfficiency',
    value: 0.99,
    unit: 'fraction',
    classification: 'TYPICAL',
    why: 'Aggregate LV distribution and busway losses. Not published.',
  },
  {
    key: 'transformerEfficiency',
    value: 0.995,
    unit: 'fraction',
    classification: 'TYPICAL',
    why: 'Large power transformer loading at normal load. Not published.',
  },
  {
    key: 'generatorDerate',
    value: 1.0,
    unit: 'fraction',
    classification: 'TYPICAL',
    why: 'No derating applied. Published ratings are standby ratings; real derating is site-specific.',
  },
];

/* ----------------------------------------------------------------- derived */

const I = INPUTS;

export const derived = (() => {
  const itKwhPerYear = I.itCapacityMW * 1000 * I.hoursPerYear;
  /* MWh, not kWh: 1 MWh = 1000 kWh, so MW x hours is already MWh. Getting this
     wrong scales every per-MWh figure by 1000, so it is derived from the kWh
     figure rather than recomputed. */
  const itMwhPerYear = itKwhPerYear / 1000;
  const heatKwhPerYear = itKwhPerYear; // essentially all IT electrical input leaves as heat

  const waterKgPerKwhIt = (I.coolingDemandM3Yr * 1000) / itKwhPerYear;
  const waterM3PerMwhIt = I.coolingDemandM3Yr / itMwhPerYear;
  const waterKgPerKwhHeat = (I.coolingDemandM3Yr * 1000) / heatKwhPerYear;

  const generationRatedMW = (I.generatorCount * I.generatorRatedKw) / 1000;
  const generationHeatMW = I.generatorCount * I.generatorHeatReleaseMW;
  const generationVsIt = generationRatedMW / I.itCapacityMW;
  const dieselLPerHourFleet = I.generatorCount * I.generatorDieselLPerHour;
  const dieselM3PerHourFleet = dieselLPerHourFleet / 1000;
  const bellyTankTotalM3 = (I.generatorCount * I.generatorBellyTankL) / 1000;
  /** hours of full-fleet running available from belly tanks alone, no tanker resupply */
  const bellyTankRunHours = (I.generatorCount * I.generatorBellyTankL) / dieselLPerHourFleet;
  /** engine efficiency: electrical out vs fuel energy in (lower bound, ignores radiator loss split) */
  const generatorElectricalShare = I.generatorRatedKw / 1000 / ((I.generatorHeatReleaseMW + I.generatorRatedKw / 1000) * 1.0);

  const moduleItMW = I.itCapacityMW / I.moduleCount;
  const hallItMW = I.itCapacityMW / I.hallCount;
  const moduleHalls = I.hallCount / I.moduleCount;

  const siteAreaM2 = I.siteAreaHa * 10_000;
  const hallFloorAreaM2 = I.hallCount * I.hallFootprintM2;
  const imperviousFraction = hallFloorAreaM2 / siteAreaM2;
  const storageMonths = I.coolingStorageM3 / (I.coolingDemandM3Yr / 12);
  const rainfallVolumeM3Yr = (siteAreaM2 * I.longTermRainfallMmYr) / 1000;
  const captureFractionOfRainfall = I.rainwaterCaptureM3Yr / rainfallVolumeM3Yr;
  const supplyGapM3Yr = I.coolingDemandM3Yr - I.rainwaterCaptureM3Yr;
  const groundwaterCoverage = I.groundwaterTakeM3Yr / I.coolingDemandM3Yr;
  const potablePerPersonLPerDay = (I.wastewaterLPerDay / I.potableStorageM3 / 1000) * 1000; // litres per person per day, storage/3
  const runoffRetainedFraction = (I.rainwaterCaptureM3Yr + I.wetlandRechargeM3Yr) / I.preDevelopmentRunoffM3Yr;

  return {
    itKwhPerYear,
    itMwhPerYear,
    heatKwhPerYear,
    waterKgPerKwhIt,
    waterM3PerMwhIt,
    waterKgPerKwhHeat,
    generationRatedMW,
    generationHeatMW,
    generationVsIt,
    dieselLPerHourFleet,
    dieselM3PerHourFleet,
    bellyTankTotalM3,
    bellyTankRunHours,
    generatorElectricalShare,
    moduleItMW,
    hallItMW,
    moduleHalls,
    siteAreaM2,
    hallFloorAreaM2,
    imperviousFraction,
    storageMonths,
    rainfallVolumeM3Yr,
    captureFractionOfRainfall,
    supplyGapM3Yr,
    groundwaterCoverage,
    potablePerPersonLPerDay,
    runoffRetainedFraction,
  };
})();

/* --------------------------------------------------------- formatting help */

export function fmt(n: number, digits = 2) {
  return Number.isInteger(n) ? n.toLocaleString('en-NZ') : n.toFixed(digits);
}

export function fmtSI(n: number) {
  if (n >= 1000) return `${fmt(n / 1000, 1)}k`;
  return fmt(n, n < 10 ? 2 : 0);
}

/**
 * A single source of truth for the water-intensity sentence. Any panel that
 * needs this number uses this function, so the figure cannot drift between the
 * water panel, the fact register and the guided journeys.
 */
export function waterIntensitySentence() {
  const d = derived;
  return (
    `${fmt(d.waterM3PerMwhIt, 3)} m3/MWh of IT load (${fmt(d.waterKgPerKwhIt, 3)} kg/kWh). ` +
    `Because essentially all electrical power entering the IT equipment leaves as heat, ` +
    `the same number is also the water used per kWh of heat rejected.`
  );
}

/** Energy path for one kWh of IT load, used by the energy walkthrough. */
export function energyPathForOneMwh() {
  const a = Object.fromEntries(ASSUMPTIONS.map((x) => [x.key, x.value]));
  const transformer = a.transformerEfficiency;
  const distribution = a.distributionEfficiency;
  const ups = a.upsEfficiency;
  const itInputMWh = 1 / transformer / distribution / ups;
  return {
    itInputMWh,
    toTransformerMWh: 1 / transformer,
    toGxpMWh: 1,
    toHallMWh: 1 / transformer,
    toUpsMWh: 1 / transformer / distribution,
    toRackMWh: itInputMWh,
    losses: {
      transmissionToHall: 1 / transformer,
      distribution: 1 / distribution,
      ups: 1 / ups,
      it: 1,
    },
    assumptions: a,
  };
}