/**
 * Water balance for the Clonee campus, and the contradictory capacity figures
 * that surround it.
 *
 * Two rules apply to every number in this file:
 *
 *   1. It comes from `calculations.ts`, which does all arithmetic once, from
 *      published inputs and named assumptions. Nothing here re-derives or
 *      restates a quantity.
 *   2. Its label says how much it is worth. PUBLIC FACT is in the record.
 *      DERIVED is arithmetic on record. TYPICAL is practice, not Clonee.
 *
 * The Clonee record is thin on water. The emissions licence records that a
 * residual evaporative cooling-water discharge exists; it publishes no volume.
 * The architect's project record says the IT cooling is indirect air. So the
 * balance below is almost entirely DERIVED, and that is not a defect. It is
 * what an honest water model looks like when the sources give you a heat load,
 * a climate and a discharge obligation and nothing else.
 */

import { INPUTS, ASSUMPTIONS, derived, fmt, fmtInt, waterIntensitySentence } from './calculations';

const A: Record<string, number> = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a.value]));

export interface WaterRow {
  id: string;
  label: string;
  value: number;
  unit: string;
  kind: 'in' | 'out' | 'store' | 'demand' | 'derived';
  classification: 'PUBLIC FACT' | 'DERIVED' | 'TYPICAL';
  note: string;
  sources: string[];
}

export const WATER_BALANCE: WaterRow[] = [
  /* ------------------------------------------------------------- sources */
  {
    id: 'rainfall-on-site',
    label: 'Rain falling on the site',
    value: Number(derived.rainfallVolumeM3Yr.toFixed(0)),
    unit: 'm³/yr over 95.5 ha',
    kind: 'in',
    classification: 'DERIVED',
    note: `DERIVED: ${fmtInt(INPUTS.siteAreaHa * 10_000)} m² of consented land times a long-term average rainfall of ${fmtInt(A.longTermRainfallMmYr)} mm/yr for County Meath. The site area is published; the rainfall figure is a TYPICAL planning assumption, because rainfall is not a project quantity. This volume is not available to the campus — most of it falls on grass, soaks in or runs off before it reaches a pipe.`,
    sources: ['MCC-150605', 'IND-ACUE'],
  },
  {
    id: 'impervious-area',
    label: 'Roof and hardstand that can be collected from',
    value: Number(derived.imperviousAreaM2.toFixed(0)),
    unit: 'm²',
    kind: 'in',
    classification: 'DERIVED',
    note: `DERIVED: ${fmt(A.imperviousFraction * 100, 0)}% of the site is treated as roof, plant compound, road and parking. That fraction is arithmetic on published floor areas over the published land area. It matters because it is the denominator for every water number on this campus: a hyperscale site is mostly building and paving, and it is that impervious area, not the landholding, that produces collectable water.`,
    sources: ['MCC-150605', 'MCC-180671', 'SNWA-FB'],
  },
  {
    id: 'runoff-capture',
    label: 'Runoff captured from roofs and hardstands',
    value: Number(derived.runoffCaptureM3Yr.toFixed(0)),
    unit: 'm³/yr',
    kind: 'in',
    classification: 'DERIVED',
    note: `DERIVED: impervious area times rainfall times a runoff coefficient of ${fmt(A.runoffCoefficient, 2)} before attenuation, which is TYPICAL for roof and paved surfaces. In practice the majority of this is the cooling circuit's make-up supply, which is why a data centre on a wet island can still treat its own roofs as a water source rather than as a drainage problem.`,
    sources: ['MCC-150605', 'SNWA-FB'],
  },
  {
    id: 'capture-share',
    label: 'Share of site rainfall actually collectable',
    value: Number((derived.captureFractionOfRainfall * 100).toFixed(1)),
    unit: '%',
    kind: 'derived',
    classification: 'DERIVED',
    note: `DERIVED: ${fmtInt(derived.runoffCaptureM3Yr)} m³/yr of capture against ${fmtInt(derived.rainfallVolumeM3Yr)} m³/yr falling on the site. Ireland is one of the wettest countries in Europe, and the number above is the practical translation of that fact into a water supply: high rainfall, of which a campus can only reach the small fraction that lands on a roof or a road.`,
    sources: ['MCC-150605'],
  },
  {
    id: 'wellfield-abstraction',
    label: 'Wellfield abstraction, the gap rainfall cannot close',
    value: Number(derived.supplyGapM3Yr.toFixed(0)),
    unit: 'm³/yr',
    kind: 'in',
    classification: 'DERIVED',
    note: `DERIVED: what the cooling circuit gives up, less what the roofs and hardstands return. The wellfield exists to cover the dry summer, when the capture figure above is a long-term average and not a promise. No Clonee groundwater abstraction figure appears in the sources used here, so this is modelled size, not a consented volume.`,
    sources: ['MCC-150605', 'SNWA-FB'],
  },
  {
    id: 'wellfield-rate',
    label: 'Wellfield, continuous equivalent',
    value: Number(derived.borefieldLPerSecond.toFixed(2)),
    unit: 'L/s',
    kind: 'in',
    classification: 'DERIVED',
    note: `DERIVED: the gap spread evenly across a year. A real borefield is sized to meet the demand through a dry spell rather than an average year, so the instantaneous design rate would be several times this figure. This number is included because it makes the scale obvious: a handful of production bores, not a river.`,
    sources: ['MCC-150605'],
  },

  /* ------------------------------------------------------------- demand */
  {
    id: 'cooling-makeup-demand',
    label: 'Cooling make-up demand',
    value: Number(derived.dischargeM3Yr.toFixed(0)),
    unit: 'm³/yr',
    kind: 'demand',
    classification: 'DERIVED',
    note: `DERIVED from the published IT load: ${fmt(derived.itCapacityMW, 0)} MW of consented IT capacity running ${fmtInt(derived.hoursPerYear)} hours, all of which leaves as heat, with ${fmt(A.evaporativeFraction * 100, 0)}% of that heat carried away by evaporation rather than by sensible air flow. Essentially all electrical power into IT equipment leaves as heat, so this demand is a direct consequence of the power figure and of the climate, not an independent estimate.`,
    sources: ['SNWA-FB', 'EPA-P1192'],
  },
  {
    id: 'heat-to-air',
    label: 'Heat carried away by air instead of water',
    value: Number((derived.itHeatGjPerYear * (1 - A.evaporativeFraction)).toFixed(0)),
    unit: 'GJ/yr',
    kind: 'derived',
    classification: 'DERIVED',
    note: `DERIVED: the remaining ${fmt((1 - A.evaporativeFraction) * 100, 0)}% of the campus heat load leaves by sensible cooling, which is what "indirect air cooling" means. Ireland has almost no cooling degree days, so the economisers can run on outside air for most of the year and the water cost of the plant is confined to the hottest hours.`,
    sources: ['SNWA-FB'],
  },
  {
    id: 'potable',
    label: 'Potable water for the campus',
    value: 0,
    unit: 'm³/yr — no published figure',
    kind: 'in',
    classification: 'TYPICAL',
    note: 'NOT PUBLIC, and deliberately left at zero rather than invented. The consents grant tanks and drainage on the campus, and the architect\'s record confirms an administration building with staff welfare, so a domestic supply exists. No flow, no tank size and no workforce figure is published for Clonee, so this model states the stream rather than quantifying it. Physically it must be separated from the cooling circuit, which carries treatment chemicals.',
    sources: ['MCC-150605', 'MCC-180671'],
  },
  {
    id: 'foul',
    label: 'Foul water to on-site treatment',
    value: 0,
    unit: 'm³/yr — no published figure',
    kind: 'out',
    classification: 'TYPICAL',
    note: 'NOT PUBLIC, and left at zero for the same reason. Domestic foul flow on a campus of this size is a staffing-scale flow, orders of magnitude below the cooling stream, and treating it on site rather than discharging to a public sewer is a normal decision at a rural location like this one.',
    sources: ['MCC-150605', 'MCC-180671'],
  },

  /* --------------------------------------------------------------- store */
  {
    id: 'storage',
    label: 'Cooling water storage',
    value: Number(derived.storageM3.toFixed(0)),
    unit: 'm³',
    kind: 'store',
    classification: 'DERIVED',
    note: `DERIVED: the wellfield gap over a twelfth of a year, with a factor for irregularity of rainfall. Storage of this size is what lets a campus ride out a dry summer on captured water while the borefield makes up the difference, and it is the reason the load-shed sequence sheds water treatment and make-up pumps late rather than first.`,
    sources: ['MCC-150605'],
  },

  /* ----------------------------------------------------------------- out */
  {
    id: 'evaporation',
    label: 'Evaporation to atmosphere',
    value: Number(derived.evaporationM3Yr.toFixed(0)),
    unit: 'm³/yr',
    kind: 'out',
    classification: 'DERIVED',
    note: `DERIVED: the share of campus heat rejected by evaporation, divided by the latent heat of vaporisation of water at ${fmt(A.evaporationEnthalpy, 2)} MJ/kg, which is physics rather than an assumption. This is the largest single outflow on the campus and it leaves as vapour, not as liquid, which is why it does not appear on any discharge figure.`,
    sources: ['SNWA-FB', 'EPA-P1192'],
  },
  {
    id: 'blowdown',
    label: 'Blowdown to control chemistry',
    value: Number(derived.blowdownM3Yr.toFixed(0)),
    unit: 'm³/yr',
    kind: 'out',
    classification: 'DERIVED',
    note: `DERIVED: evaporation concentrates everything dissolved in the circuit, so a recirculating loop has to discharge blowdown to keep its chemistry in hand. Modelled at ${fmt(A.blowdownFactor, 2)} times the evaporated volume. EPA-P1192 records a residual evaporative cooling-water discharge without publishing a volume, so this figure is sized to make the mechanism legible, not to represent a licensed quantity.`,
    sources: ['EPA-P1192'],
  },
  {
    id: 'total-discharge',
    label: 'Total cooling water discharge',
    value: Number(derived.dischargeM3Yr.toFixed(0)),
    unit: 'm³/yr',
    kind: 'out',
    classification: 'DERIVED',
    note: `DERIVED: evaporation plus blowdown, and also the total make-up the site has to find from somewhere. ${waterIntensitySentence()} Water is the heat-rejection medium, so water per unit of compute is a design outcome rather than an accident.`,
    sources: ['EPA-P1192', 'SNWA-FB'],
  },
  {
    id: 'stormwater-outfall',
    label: 'Stormwater outfall to the receiving watercourse',
    value: Number((derived.rainfallVolumeM3Yr - derived.runoffCaptureM3Yr).toFixed(0)),
    unit: 'm³/yr of site rainfall not collected',
    kind: 'out',
    classification: 'DERIVED',
    note: 'DERIVED as the balance of site rainfall that is not captured for reuse. The licence requires stormwater and environmental systems to be managed and a cooling-water discharge is permitted, so a licensed discharge point exists, but no receiving watercourse is named and no runoff volume is published in the sources used here. Treat the watercourse on this model as an unnamed element of normal practice.',
    sources: ['EPA-P1192', 'MCC-150605'],
  },

  /* ------------------------------------------------------------- derived */
  {
    id: 'wue',
    label: 'Water use effectiveness',
    value: Number(derived.wueM3PerMwh.toFixed(4)),
    unit: 'm³ per MWh of IT load',
    kind: 'derived',
    classification: 'DERIVED',
    note: `DERIVED: total discharge divided by annual IT energy. ${waterIntensitySentence()} This is the single number worth remembering from the water panel. An air-cooled campus in a cool maritime climate should be an order of magnitude better than a chilled-water campus in a hot one, and this figure is what that advantage looks like once you have put a number on it.`,
    sources: ['SNWA-FB', 'EPA-P1192'],
  },
  {
    id: 'groundwater-dependency',
    label: 'Share of the circuit supplied by rain',
    value: Number((derived.groundwaterCoverage * 100).toFixed(1)),
    unit: '%',
    kind: 'derived',
    classification: 'DERIVED',
    note: `DERIVED: captured runoff against total discharge. The remainder, ${fmt(100 - derived.groundwaterCoverage * 100, 0)}%, comes from the wellfield. Read as a design question it asks whether the campus is genuinely rainwater-led or merely rainwater-assisted, and the answer here is assisted.`,
    sources: ['MCC-150605'],
  },
];

/**
 * Teaching prose for the water panel. Short paragraphs, each making one point
 * that a reader could get wrong.
 */
export const WATER_NARRATIVE: string[] = [
  `Where the water comes from, first: rain. The consented site is ${fmtInt(INPUTS.siteAreaHa * 10_000)} m² and long-term rainfall for County Meath is around ${fmtInt(A.longTermRainfallMmYr)} mm a year, so roughly ${fmtInt(derived.rainfallVolumeM3Yr)} m³ falls on it annually. That number is a trap. Most of a data centre site is building, plant compound, road and parking, so what matters is not how much rain falls but how much of it lands somewhere a pipe can reach: about ${fmtInt(derived.imperviousAreaM2)} m² of roof and hardstand, of which ${fmtInt(derived.runoffCaptureM3Yr)} m³ a year can realistically be collected.`,
  `The cooling demand follows from the power. ${fmt(derived.itCapacityMW, 0)} MW of consented IT load at ${fmtInt(derived.hoursPerYear)} hours a year is ${fmtInt(derived.itHeatGjPerYear)} GJ of heat, because essentially every joule entering a server leaves it as heat. Ireland has almost no cooling degree days, so for most of the year the outside-air economisers carry that load on their own and the evaporative stage barely runs. The modelled figure of ${fmtInt(derived.evaporationM3Yr)} m³/yr of evaporation corresponds to ${fmt(A.evaporativeFraction * 100, 0)}% of the heat load, and that small fraction is the direct consequence of a cool maritime climate rather than a design choice.`,
  `This is why a data centre in one of Europe's wettest countries still holds a water licence with a discharge condition. The plant is air-cooled, so it uses very little water, but it is an evaporative-assisted air-cooled plant, so it uses some, and any residual discharge is regulated water. EPA-P1192 records exactly that: a residual evaporative cooling-water discharge. It publishes no volume, which is why the discharge figure on this panel is DERIVED rather than quoted. The tension between "indirect air cooling" in the architect's record and a licensed water discharge in the emissions licence is real, and the resolution is a plant that runs dry for most of the year and wet only when the weather demands it.`,
  `Where the demand goes is mostly into the air. Evaporation is ${fmtInt(derived.evaporationM3Yr)} m³/yr and blowdown to control chemistry is ${fmtInt(derived.blowdownM3Yr)} m³/yr on top of it, because a recirculating loop concentrates everything dissolved in it. Together that is ${fmtInt(derived.dischargeM3Yr)} m³/yr of make-up the site has to find, and it is also the water a wellfield has to cover when the roofs do not deliver a long-term average.`,
  `The two sources that matter are therefore both on site. Captured runoff supplies ${fmt(derived.groundwaterCoverage * 100, 0)}% of what the circuit gives up; a wellfield sized for a dry summer finds the remaining ${fmt(100 - derived.groundwaterCoverage * 100, 0)}%, about ${fmtInt(derived.supplyGapM3Yr)} m³/yr or ${fmt(derived.borefieldLPerSecond, 1)} L/s spread across the year. Storage of roughly ${fmtInt(derived.storageM3)} m³ sits between the two, which is what lets the campus ride out a dry spell and is why water treatment and make-up are shed late rather than first in an emergency.`,
  `The domestic side of the water balance is a different order of magnitude entirely, and this is the part of the panel that is empty on purpose. Potable supply and foul treatment both exist — tanks and drainage are consented, and there is an administration building with staff welfare — but no flow, tank size or workforce figure is published for Clonee. Those rows are marked TYPICAL and left at zero rather than given an invented number.`,
  `The number to carry away is the intensity: ${fmt(derived.wueM3PerMwh, 3)} m³ of site water per MWh of IT load. Because the water is the heat-rejection medium, that figure is simultaneously the water used per kWh of heat rejected. It is a design outcome rather than an accident, and it is the reason climate, not drought, is the variable that decides how water-secure a data centre is.`,
];

/**
 * Why the published capacity numbers are not the same quantity.
 *
 * This panel exists because real projects publish contradictory figures. The
 * product refuses to average them away, and each claim below says what the
 * figure means and what it does not.
 */
export interface CapacityClaim {
  figure: string;
  source: string;
  means: string;
  doesNotMean: string;
  classification: 'PUBLIC FACT' | 'DERIVED' | 'TYPICAL';
}

export const CAPACITY_CLAIMS: CapacityClaim[] = [
  {
    figure: `${INPUTS.itMwPerBuilding} MW per building`,
    source: 'MCC-150605',
    means: 'The consented electrical load of the IT equipment in one building: servers, storage and network. The consent grants this figure per building and the emissions licence names five buildings.',
    doesNotMean: 'It is not the campus total, and it is not total facility demand. Cooling plant, pumps, fans, controls and lighting sit on top of it, and none of that is inside the 36 MW.',
    classification: 'PUBLIC FACT',
  },
  {
    figure: `${fmt(derived.itCapacityMW, 0)} MW IT`,
    source: 'MCC-150605 and EPA-P1192, multiplied together',
    means: `DERIVED: the consented per-building figure applied to the five buildings the licence names. It is the campus IT load this model uses, and it is what the model sizes cooling and generation against.`,
    doesNotMean: 'It is not a published number. The consent itself only ever names two buildings, so this is the model reading the two documents together rather than a figure either document states.',
    classification: 'DERIVED',
  },
  {
    figure: `${INPUTS.powerSupplyMva} MVA power supply`,
    source: 'SNWA-FB',
    means: 'The published power supply for the three original buildings. MVA is an apparent-power unit, so it describes the rating of the supply rather than the real power drawn, and it is a supply figure for part of the campus.',
    doesNotMean: `It does not mean ${INPUTS.powerSupplyMva} MW, and it does not describe the five-building campus. Against three times ${INPUTS.itMwPerBuilding} MW it is very close to unity, which tells you it describes the IT feed rather than the whole facility draw.`,
    classification: 'PUBLIC FACT',
  },
  {
    figure: `${fmt(derived.itCapacityFromDensityMW, 0)} MW from area and density`,
    source: 'SNWA-FB',
    means: `DERIVED: the published IT area of ${fmtInt(INPUTS.itAreaM2)} m² multiplied by the published ${INPUTS.itPowerDensityKwM2} kW/m². It is an independent second route to the same quantity, and it agrees with the ${fmt(derived.itCapacityMW, 0)} MW route to within ${fmt(derived.capacityRoutesDifferPct, 1)}%.`,
    doesNotMean: `It does not mean ${fmt(derived.itCapacityMW, 0)} MW, and it is not a competing estimate to be reconciled away. Two published routes that nearly agree is the strongest evidence available here; the ${fmt(derived.capacityRoutesDifferPct, 1)}% residual is what remains after rounding and scope differences between documents.`,
    classification: 'DERIVED',
  },
  {
    figure: `Nearly ${fmtInt(INPUTS.gfaM2TotalNearly)} m²`,
    source: 'META-2019',
    means: 'Total facility floor area after the two-building expansion, as published by the operator. It is the campus footprint including halls, internal plant, administration and the substation.',
    doesNotMean: 'It is not a power figure and it does not imply a density. Dividing it by a rack count or a kW/m² gives a number that means nothing, because the area is a mixture of white space, plant and offices.',
    classification: 'PUBLIC FACT',
  },
  {
    figure: `${fmt(INPUTS.publishedCampusMw, 0)} MW campus capacity`,
    source: 'META-DC',
    means: 'The operator\'s current published capacity for the campus, alongside a cumulative investment figure. It is the most recent public statement of the whole site rather than a per-building consent condition.',
    doesNotMean: `It does not supersede the consent, and it is not reconciled to it by any document. It exceeds the ${fmt(derived.itCapacityMW, 0)} MW derived from the consent, and neither figure explains the difference — later phases, a different definition of capacity, or a round figure. Treat the gap as an open question rather than as an error in either number.`,
    classification: 'PUBLIC FACT',
  },
];