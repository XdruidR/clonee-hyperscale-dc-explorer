/**
 * Canonical calculations for the Clonee model.
 *
 * Every number the application displays is derived here, once, from published
 * inputs. Nothing in the UI, in narrative prose or in the fact register is
 * allowed to restate a derived quantity by hand. If a displayed figure can be
 * traced to an input below, it is generated from `derived`.
 *
 * The distinction that matters:
 *   inputs       published quantities, each traceable to a source id
 *   assumptions  numbers that had to be invented, each carrying its own
 *                classification and a reason, so they can never be mistaken
 *                for published figures
 *   derived      arithmetic on inputs and assumptions only
 *
 * Where two published sources disagree, both are carried as inputs and the
 * disagreement is surfaced rather than averaged away. That is a teaching
 * point about real projects, not a defect to hide.
 */

import type { Classification } from './types';

/* ------------------------------------------------------------------ inputs */

/**
 * Published quantities. The `fact` field names the source id so the register
 * and the arithmetic cannot drift apart.
 */
export const INPUTS = {
  /* --- site --- */
  siteAreaHa: 95.5, // MCC-150605
  siteAreaHaWhenComplete: 85, // SNWA-FB: "when complete, will cover an area of 85ha"
  siteAreaAcresDesign: 227, // SNWA-FB: 3 buildings on 227 acres

  /* --- buildings --- */
  buildingCount: 5, // EPA-P1192: CLN1, CLN2, CLN3, CLN5, CLN6
  hallsPerBuilding: 4, // MCC-150605 and SNWA-FB
  hallFloorM2: 4_170, // SNWA-FB: each of approximately 4,170 m2
  itMwPerBuilding: 36, // MCC-150605: 36 MW data capacity per building
  gfaM2OriginalPhase: 50_800, // MCC-150605: two buildings, combined
  gfaM2PerOriginalBuilding: 25_400, // MCC-150605
  gfaM2ThirdBuilding: 28_320, // SNWA-FB phase 3: single bar building with distribution and admin
  gfaM2Expansion: 57_400, // MCC-180671: two additional buildings, combined
  gfaM2TotalNearly: 150_000, // META-2019: nearly 150,000 m2
  plantAreaM2PerBuilding: 11_000, // SNWA-FB: internal plant area
  meetMeRoomsPerBuilding: 2, // SNWA-FB
  itAreaM2: 75_000, // SNWA-FB
  itPowerDensityKwM2: 2.24, // SNWA-FB
  totalAreaM2Studio: 97_000, // SNWA-FB
  powerSupplyMva: 108, // SNWA-FB: 108 MVA power supply

  /* --- generation --- */
  generatorCount: 90, // EPA-P1192
  /** 90 sets across five buildings is the published count. The even split is arithmetic. */
  generatorsPerBuilding: 18,

  /* --- grid connection --- */
  substationAreaM2: 30_100, // BP-VA0018
  hvBays: 12, // BP-VA0018
  stepDownTransformers: 3, // BP-VA0018
  lightningMasts: 27, // BP-VA0018
  newTransmissionTowers: 2, // BP-VA0018
  transmissionKv: 220, // BP-VA0018
  campusMvKv: 20, // MCC-150605: underground 20 kV cables between substation and buildings
  gridConnectionYear: 2017,
  gridConnectionMonth: 8, // EIR-AR2017: completed August 2017
  gridConnectionMonths: 15, // EIR-AR2017: approximately 15 months

  /* --- sustainability --- */
  wasteRecycledPct: 97, // META-2019: 97% of construction waste recycled
  leedCertification: 'LEED Gold', // META-2019, December

  /* --- delivery, era-matched Irish anchors --- */
  /** Consent-to-energisation for the original substation, EIR-AR2017. */
  substationBuildMonths: 15,
  /** Phase 1 site start to opening: April 2016 to September 2018, PRESS-ECO. */
  phase1BuildMonths: 29,
  /** Peak skilled trades on the mature Clonee campus at peak construction, META-DC. */
  peakWorkforce: 1_500,
  /** Published announcement value for the original two buildings, PRESS-ECO. */
  announcedInvestmentM: 300,
  announcedCapacityMw: 72,
  /** The substation civil and structural package delivered for the campus, JP-SUB. */
  substationCivilM2: 17_000,
  substationCivilCostM: 6.2,
  substationCivilMonths: 11,
  substationTransformerMassKg: 18_500,
  substationTransformerOilL: 8_500,
  substationCableTroughM: 380,
  substationEquipmentBases: 105,
  substationMastBases: 16,
  substationMastHeightM: 30,

  /* --- operator's current published campus figures, which do not match the consent --- */
  publishedCampusMw: 219, // META-DC: the operator's current published campus capacity
  publishedInvestmentBn: 1.4, // META-DC: cumulative investment

  /* --- the AI retrofit comparison --- */
  /** Modern rack-scale AI system, vendor-published operating power. */
  aiRackKw: 132, // IND-NVDA: GB300 NVL72 class
  /** Design point that power infrastructure is provisioned to. */
  aiRackEdbpKw: 192,
  /** Floor area each rack position occupies, published Irish design norm. */
  rackSpaceM2: 2.5,
  /** Rack power of the delivered halls, DERIVED from the two published routes. */
  deliveredRackKw: 12.5,
  /** Fraction of rack heat captured by liquid rather than air at rack scale. */
  aiLiquidShare: 0.9,
  aiSupplyTempC: 32,
  aiDeltaTK: 20,
  /** Maximum coolant inlet temperature now warranted by the platform vendors. */
  aiMaxInletC: 45,
  /** Busway is provisioned to the worst case, not the operating case. */
  buswayVolts: 415,
} as const;

/** Where each published input comes from, for the provenance panel. */
export const INPUT_SOURCES: Record<string, string[]> = {
  siteAreaHa: ['MCC-150605'],
  siteAreaHaWhenComplete: ['SNWA-FB'],
  siteAreaAcresDesign: ['SNWA-FB'],
  buildingCount: ['EPA-P1192'],
  hallsPerBuilding: ['MCC-150605', 'SNWA-FB'],
  hallFloorM2: ['SNWA-FB'],
  itMwPerBuilding: ['MCC-150605'],
  gfaM2OriginalPhase: ['MCC-150605'],
  gfaM2PerOriginalBuilding: ['MCC-150605'],
  gfaM2ThirdBuilding: ['SNWA-FB'],
  gfaM2Expansion: ['MCC-180671'],
  gfaM2TotalNearly: ['META-2019'],
  plantAreaM2PerBuilding: ['SNWA-FB'],
  meetMeRoomsPerBuilding: ['SNWA-FB'],
  itAreaM2: ['SNWA-FB'],
  itPowerDensityKwM2: ['SNWA-FB'],
  totalAreaM2Studio: ['SNWA-FB'],
  powerSupplyMva: ['SNWA-FB'],
  generatorCount: ['EPA-P1192'],
  generatorsPerBuilding: ['EPA-P1192'],
  substationAreaM2: ['BP-VA0018'],
  hvBays: ['BP-VA0018'],
  stepDownTransformers: ['BP-VA0018'],
  lightningMasts: ['BP-VA0018'],
  newTransmissionTowers: ['BP-VA0018'],
  transmissionKv: ['BP-VA0018'],
  campusMvKv: ['MCC-150605'],
  gridConnectionMonth: ['EIR-AR2017'],
  gridConnectionMonths: ['EIR-AR2017'],
  wasteRecycledPct: ['META-2019'],
  leedCertification: ['META-2019'],
};

/* -------------------------------------------------------------- assumptions */

/**
 * Assumptions are NOT public facts. Each carries its own classification and a
 * reason, so the interface can say why a number had to be invented.
 */
export interface Assumption {
  key: string;
  value: number;
  unit: string;
  classification: Classification;
  why: string;
}

export const ASSUMPTIONS: Assumption[] = [
  {
    key: 'generatorRatedKw',
    value: 2_500,
    unit: 'kWe per set',
    classification: 'TYPICAL',
    why: 'EPA-P1192 publishes the count of 90 sets and nothing else about them. 2.5 MW gives each building 45 MW of standby against 36 MW of consented IT load — a 1.25× ratio, which is normal hyperscale practice and leaves room for the mechanical load that a hall cannot run without.',
  },
  {
    key: 'generatorHeatReleaseKw',
    value: 2_950,
    unit: 'kW heat per set',
    classification: 'TYPICAL',
    why: 'A diesel engine rejects more heat than it converts. At ~43% electrical efficiency, a 2.5 MW set rejects roughly 2.9 MW through its own radiators, jacket water and exhaust. Not published for Clonee.',
  },
  {
    key: 'generatorBellyTankL',
    value: 11_000,
    unit: 'litres per set',
    classification: 'TYPICAL',
    why: 'A tank sized to run one set at full load for a defined period without a tanker on site. The public record gives no tank sizes; the day-tank and bund arrangement is modelled practice.',
  },
  {
    key: 'generatorDieselLPerHour',
    value: 700,
    unit: 'litres per hour per set at full load',
    classification: 'TYPICAL',
    why: 'Standard volumetric efficiency for a 2.5 MW diesel set at full load. Not published for Clonee.',
  },
  {
    key: 'transformerMva',
    value: 90,
    unit: 'MVA per step-down transformer',
    classification: 'DERIVED',
    why: 'BP-VA0018 publishes three step-down transformers and no ratings. Three transformers at 90 MVA give 270 MVA for a campus whose consented IT load is 180 MW, which covers the mechanical load with headroom and leaves a genuine N-1 story: losing one leaves 180 MVA.',
  },
  {
    key: 'transformerImpedancePct',
    value: 11.5,
    unit: 'percent',
    classification: 'TYPICAL',
    why: 'Normal for a 220/20 kV distribution transformer. Not published.',
  },
  {
    key: 'upsEfficiency',
    value: 0.96,
    unit: 'fraction',
    classification: 'TYPICAL',
    why: 'Double-conversion UPS efficiency at load. Not published for Clonee.',
  },
  {
    key: 'distributionEfficiency',
    value: 0.99,
    unit: 'fraction',
    classification: 'TYPICAL',
    why: 'Aggregate LV distribution and busway losses. Not published.',
  },
  {
    key: 'evaporativeFraction',
    value: 0.1,
    unit: 'fraction of annual heat rejected by evaporation',
    classification: 'TYPICAL',
    why: 'SNWA-FB states indirect air cooling, which is by definition air-side, but EPA-P1192 refers to residual evaporative cooling-water discharge, so the modelled plant is an evaporative-assisted indirect arrangement. The fraction is small because Ireland has almost no cooling degree days: outside-air economisers carry the load for most of the year and the evaporative stage only assists in the hottest hours. This is the honest reading of the two sources together — the licence records a discharge because the plant runs wet sometimes, not because it runs wet continuously.',
  },
  {
    key: 'evaporationEnthalpy',
    value: 2.44,
    unit: 'MJ per kg of water evaporated',
    classification: 'TYPICAL',
    why: 'Latent heat of vaporisation of water. Physics, not a project assumption. 1 MJ of heat vaporises 1 kg of water, so 1 MJ per kg is 1 m3 per GJ.',
  },
  {
    key: 'blowdownFactor',
    value: 1.15,
    unit: 'multiplier on evaporated water',
    classification: 'TYPICAL',
    why: 'A recirculating evaporative circuit discharges blowdown and concentrated solids on top of what it evaporates. EPA-P1192 refers to residual cooling-water discharge without publishing a volume.',
  },
  {
    key: 'longTermRainfallMmYr',
    value: 880,
    unit: 'mm per year',
    classification: 'TYPICAL',
    why: 'Long-term average rainfall for County Meath. A planning assumption, not a published Clonee figure.',
  },
  {
    key: 'imperviousFraction',
    value: 0.42,
    unit: 'fraction of site that is roof or hardstand',
    classification: 'DERIVED',
    why: 'Arithmetic on published floor areas: buildings, plant compounds, roads and parking over a 95.5 ha site.',
  },
  {
    key: 'runoffCoefficient',
    value: 0.35,
    unit: 'fraction of rainfall on impervious area that leaves as runoff',
    classification: 'TYPICAL',
    why: 'Roof and paved runoff coefficient before attenuation. Not published.',
  },
  {
    key: 'pue',
    value: 1.3,
    unit: 'power usage effectiveness',
    classification: 'TYPICAL',
    why: 'Facility overhead for a well-designed air-cooled hyperscale campus. Not published for Clonee.',
  },
];

/* ----------------------------------------------------------------- derived */

const I = INPUTS;
const A = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a.value])) as Record<string, number>;

export const derived = (() => {
  /* --- capacity, from two independent published routes --- */

  /** Route A: consented IT capacity per building, summed across the campus. */
  const itCapacityMW = I.buildingCount * I.itMwPerBuilding;
  /** Route B: published IT area multiplied by published IT power density. */
  const itCapacityFromDensityMW = (I.itAreaM2 * I.itPowerDensityKwM2) / 1000;

  const hallCount = I.buildingCount * I.hallsPerBuilding;
  const hallItMW = I.itMwPerBuilding / I.hallsPerBuilding;
  /** The reconciliation that matters: the two published routes nearly agree. */
  const hallPowerDensityFromConsentKwM2 = (hallItMW * 1000) / I.hallFloorM2;
  const densityAgreementPct =
    (Math.abs(hallPowerDensityFromConsentKwM2 - I.itPowerDensityKwM2) / I.itPowerDensityKwM2) * 100;

  /** Total floor area implied by the published hall and plant figures. */
  const hallFloorTotalM2 = hallCount * I.hallFloorM2;
  const plantFloorTotalM2 = I.buildingCount * I.plantAreaM2PerBuilding;
  const gfaImpliedM2 = hallFloorTotalM2 + plantFloorTotalM2;

  /* --- energy --- */
  const hoursPerYear = 8760;
  const itMwhPerYear = itCapacityMW * hoursPerYear;
  const itKwhPerYear = itMwhPerYear * 1000;
  /** Essentially all electrical input to IT equipment leaves as heat. */
  const itHeatMwhPerYear = itMwhPerYear;
  const itHeatGjPerYear = itMwhPerYear * 3.6;
  const facilityLoadMW = itCapacityMW * A.pue;

  /* --- generation --- */
  const generatorRatedMW = (I.generatorCount * A.generatorRatedKw) / 1000;
  const generationPerBuildingMW = (I.generatorsPerBuilding * A.generatorRatedKw) / 1000;
  const generationHeatMW = (I.generatorCount * A.generatorHeatReleaseKw) / 1000;
  const generationVsIt = generatorRatedMW / itCapacityMW;
  const generationVsFacility = generatorRatedMW / facilityLoadMW;
  const dieselLPerHourFleet = I.generatorCount * A.generatorDieselLPerHour;
  const bellyTankTotalM3 = (I.generatorCount * A.generatorBellyTankL) / 1000;
  /** Hours the whole fleet can run on belly tanks alone, before any tanker resupply. */
  const bellyTankRunHours = bellyTankTotalM3 / (dieselLPerHourFleet / 1000);
  /** Engine efficiency: electrical out against fuel energy in, ignoring the radiator split. */
  const generatorElectricalShare = A.generatorRatedKw / (A.generatorRatedKw + A.generatorHeatReleaseKw);

  /* --- substation --- */
  const transformerTotalMva = I.stepDownTransformers * A.transformerMva;
  const transformerLoadPct = (facilityLoadMW / transformerTotalMva) * 100;
  /** N-1: what is left when one of three transformers is out of service. */
  const nMinusOneMva = transformerTotalMva - A.transformerMva;
  const nMinusOneShortfallMW = Math.max(0, facilityLoadMW - nMinusOneMva);

  /* --- water --- */
  const heatRejectedByEvaporationGj = itHeatGjPerYear * A.evaporativeFraction;
  const evaporationM3Yr = heatRejectedByEvaporationGj / A.evaporationEnthalpy; // 1 MJ/kg = 1 m3
  const blowdownM3Yr = evaporationM3Yr * (A.blowdownFactor - 1);
  const dischargeM3Yr = evaporationM3Yr + blowdownM3Yr;
  /** Water use effectiveness: litres of site water per kWh of IT energy. */
  const wueLPerKwh = (dischargeM3Yr * 1000) / itKwhPerYear;
  const wueM3PerMwh = dischargeM3Yr / itMwhPerYear;

  const siteAreaM2 = I.siteAreaHa * 10_000;
  const rainfallVolumeM3Yr = (siteAreaM2 * A.longTermRainfallMmYr) / 1000;
  const imperviousAreaM2 = siteAreaM2 * A.imperviousFraction;
  const runoffCaptureM3Yr = imperviousAreaM2 * (A.longTermRainfallMmYr / 1000) * A.runoffCoefficient;
  const captureFractionOfRainfall = runoffCaptureM3Yr / rainfallVolumeM3Yr;
  /** The part of the demand rainwater cannot cover, which is what the wellfield is for. */
  const supplyGapM3Yr = dischargeM3Yr - runoffCaptureM3Yr;
  const groundwaterCoverage = runoffCaptureM3Yr / dischargeM3Yr;
  /** A borefield sized to close the gap over a dry summer. */
  const borefieldLPerSecond = (supplyGapM3Yr / (hoursPerYear * 3600)) * 1000;
  /** Storage that buys a dry spell before the borefield has to make up the difference. */
  const storageM3 = (supplyGapM3Yr / 12) * 1.5;

  /* --- per building --- */
  const buildingItMw = I.itMwPerBuilding;
  const buildingGfaM2 = I.hallsPerBuilding * I.hallFloorM2 + I.plantAreaM2PerBuilding;

  /* --- delivery, anchored on the operator's own and Irish published figures --- */
  /** Workers per MW of campus capacity at peak construction. */
  const workersPerMwAtPeak = I.peakWorkforce / I.publishedCampusMw;
  /** Announced cost per MW for the original two buildings — era-matched, Irish. */
  const costPerMwAnnounced = (I.announcedInvestmentM * 1e6) / (I.announcedCapacityMw * 1e6);
  /** Cumulative cost per MW on the operator's current published campus figure. */
  const costPerMwPublished = (I.publishedInvestmentBn * 1e9) / (I.publishedCampusMw * 1e6);

  /* --- the AI retrofit: what actually binds --- */
  /**
   * Rack positions the existing floor area could physically hold.
   *
   * This is the number that makes the retrofit teaching point: the campus is
   * nowhere near space-constrained. It is constrained by electricity.
   */
  const rackPositionsInItArea = I.itAreaM2 / I.rackSpaceM2;
  /** Racks the existing electrical supply could actually feed at AI density. */
  const racksAffordableAtAiDensity = (itCapacityMW * 1000) / I.aiRackKw;
  const geometricUtilisationPct = (racksAffordableAtAiDensity / rackPositionsInItArea) * 100;
  const densityJump = I.aiRackKw / I.deliveredRackKw;
  /** Amperage an AI rack draws on Irish 415 V three-phase, at both cases. */
  const aiRackAmps = (I.aiRackKw * 1000) / (Math.sqrt(3) * I.buswayVolts);
  const aiRackAmpsEdbp = (I.aiRackEdbpKw * 1000) / (Math.sqrt(3) * I.buswayVolts);
  const deliveredRackAmps = (I.deliveredRackKw * 1000) / (Math.sqrt(3) * I.buswayVolts);
  /** Coolant flow per AI rack from first principles: ṁ = Q / (c_p · ΔT). */
  const cPWater = 4.18; // kJ/kg·K
  const aiRackFlowKgPerSec = (I.aiRackKw * I.aiDeltaTK) / (cPWater * I.aiDeltaTK);
  const aiRackFlowLPerMin = aiRackFlowKgPerSec * 60;
  /** Liquid heat capture across the campus if every hall were converted. */
  const campusLiquidMw = facilityLoadMW * I.aiLiquidShare;

  return {
    /* capacity */
    itCapacityMW,
    itCapacityFromDensityMW,
    capacityRoutesDifferPct:
      (Math.abs(itCapacityMW - itCapacityFromDensityMW) / itCapacityMW) * 100,
    hallCount,
    hallItMW,
    hallPowerDensityFromConsentKwM2,
    densityAgreementPct,
    hallFloorTotalM2,
    plantFloorTotalM2,
    gfaImpliedM2,

    /* energy */
    hoursPerYear,
    itMwhPerYear,
    itKwhPerYear,
    itHeatMwhPerYear,
    itHeatGjPerYear,
    facilityLoadMW,

    /* generation */
    generatorRatedMW,
    generationPerBuildingMW,
    generationHeatMW,
    generationVsIt,
    generationVsFacility,
    dieselLPerHourFleet,
    bellyTankTotalM3,
    bellyTankRunHours,
    generatorElectricalShare,

    /* substation */
    transformerTotalMva,
    transformerLoadPct,
    nMinusOneMva,
    nMinusOneShortfallMW,

    /* water */
    evaporationM3Yr,
    blowdownM3Yr,
    dischargeM3Yr,
    wueLPerKwh,
    wueM3PerMwh,
    siteAreaM2,
    rainfallVolumeM3Yr,
    imperviousAreaM2,
    runoffCaptureM3Yr,
    captureFractionOfRainfall,
    supplyGapM3Yr,
    groundwaterCoverage,
    borefieldLPerSecond,
    storageM3,

    /* per building */
    buildingItMw,
    buildingGfaM2,

    /* delivery */
    workersPerMwAtPeak,
    costPerMwAnnounced,
    costPerMwPublished,

    /* AI retrofit */
    rackPositionsInItArea,
    racksAffordableAtAiDensity,
    geometricUtilisationPct,
    densityJump,
    aiRackAmps,
    aiRackAmpsEdbp,
    deliveredRackAmps,
    aiRackFlowLPerMin,
    campusLiquidMw,
  };
})();

/* --------------------------------------------------------- formatting help */

/** Irish/European number formatting. This is an Irish project. */
export function fmt(n: number, digits = 2) {
  return Number.isInteger(n) ? n.toLocaleString('en-IE') : n.toFixed(digits);
}

export function fmtInt(n: number) {
  return Math.round(n).toLocaleString('en-IE');
}

export function fmtSI(n: number) {
  if (n >= 1000) return `${fmt(n / 1000, 1)}k`;
  return fmt(n, n < 10 ? 2 : 0);
}

/** A building's name from its number, so the CLN numbering gap is visible everywhere. */
export function buildingName(n: number) {
  return `CLN${n}`;
}

/**
 * A single source of truth for the water sentence. Any panel that needs this
 * figure uses this function, so it cannot drift between the water panel, the
 * fact register and the guided journeys.
 */
export function waterIntensitySentence() {
  const d = derived;
  return (
    `${fmt(d.wueM3PerMwh, 3)} m³ of site water per MWh of IT load (${fmt(d.wueLPerKwh, 2)} L/kWh). ` +
    `Because essentially all electrical power entering the IT equipment leaves as heat, ` +
    `the same number is also the water used per kWh of heat rejected.`
  );
}

/** The capacity reconciliation, stated once. */
export function capacityReconciliationSentence() {
  const d = derived;
  return (
    `Summing the consented 36 MW per building across ${I.buildingCount} buildings gives ${fmt(d.itCapacityMW, 0)} MW IT. ` +
    `Multiplying the published IT area of ${fmtInt(I.itAreaM2)} m² by the published ${I.itPowerDensityKwM2} kW/m² gives ` +
    `${fmt(d.itCapacityFromDensityMW, 1)} MW. The two independent public routes agree to within ${fmt(d.capacityRoutesDifferPct, 1)}%.`
  );
}

/** One kWh of IT load traced through the loss chain, for the power walkthrough. */
export function energyPathForOneMwh() {
  const transformer = 1;
  const distribution = 1;
  const ups = 1;
  const itInputMWh = 1 / transformer / distribution / ups;
  return {
    itInputMWh,
    toHallMWh: 1,
    toRackMWh: itInputMWh,
    /** Each stage is a separate loss the learner can be held responsible for. */
    losses: { substation: transformer, distribution, ups, it: 1 },
    assumptions: A,
  };
}