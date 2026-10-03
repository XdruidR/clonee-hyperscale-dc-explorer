/**
 * Water balance for the modelled campus.
 *
 * Rows are the public figures from the civil servicing report and consents.
 * Derived rows are arithmetic on those figures, clearly marked SIMPLIFIED.
 * Anything not published is marked TYPICAL and worded as an assumption.
 */

import { derived, fmt, waterIntensitySentence } from './calculations';

export interface WaterRow {
  id: string;
  label: string;
  value: number;
  unit: string;
  kind: 'in' | 'out' | 'store' | 'demand' | 'derived';
  classification: 'PUBLIC FACT' | 'TYPICAL' | 'SIMPLIFIED';
  note: string;
  sources: string[];
}

export const WATER_BALANCE: WaterRow[] = [
  {
    id: 'rain- roofs',
    label: 'Rainfall captured from hall roofs',
    value: 30_000,
    unit: 'm2 roof area',
    kind: 'in',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: about 30,000 m2 of hall roof is piped into the cooling water reservoirs.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'rain-hardstand',
    label: 'Rainfall captured from hardstand and landscape',
    value: 65_000,
    unit: 'm2 contributing area',
    kind: 'in',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: about 65,000 m2 is captured via a weir arrangement with pretreatment before it reaches the cooling loop.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'rain-vol',
    label: 'Annual capture achieved',
    value: 75_000,
    unit: 'm3/yr',
    kind: 'in',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: about 13% of the site\'s rainfall volume, modelled over 60 years of record. The balance of rainfall runs off, soaks away or evaporates.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'bore-take',
    label: 'Groundwater take (consented maximum)',
    value: 220_752,
    unit: 'm3/yr',
    kind: 'in',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: 7 L/s, 604,800 L/day, 220,752,000 L/yr. Anticipated operational take is about 212,600 m3/yr. Used only when rainfall capture does not refill the reservoirs.',
    sources: ['ES-PERMIT', 'ES-CIVILS'],
  },
  {
    id: 'demand',
    label: 'Cooling water demand scenario',
    value: 288_000,
    unit: 'm3/yr',
    kind: 'demand',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: a scenario volume that varies month to month with climate, taken from a design concept rather than a commitment.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'storage',
    label: 'Sealed storage beneath the buildings',
    value: 75_000,
    unit: 'm3',
    kind: 'store',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: about 1.5 months of contingency at 1.5-2.0 m below ground level, sealed against groundwater interaction.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'recharge',
    label: 'Soakage recharge to the wetland to the south',
    value: 157_000,
    unit: 'm3/yr',
    kind: 'out',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: the recharge system is deliberately designed to maintain the groundwater regime that supports the wetland. This is a licence obligation, not a drainage convenience.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'predev',
    label: 'Pre-development runoff (for comparison)',
    value: 167_000,
    unit: 'm3/yr',
    kind: 'derived',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: about 167,000 m3/yr left the site as overland flow before development. Post-development, a much larger share is captured and used on site.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'potable',
    label: 'Potable (domestic) demand',
    value: 150,
    unit: 'm3 storage',
    kind: 'store',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: a 150 m3 tank fed from 3,000 m2 of support-building roof, physically separated from cooling water. A few days of demand for about 60 staff.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'wastewater',
    label: 'Wastewater to land',
    value: 1.8,
    unit: 'm3/day (max 5)',
    kind: 'out',
    classification: 'PUBLIC FACT',
    note: 'PUBLIC FACT: up to 5,000 L/day, disposed at 5 mm/day through a soakage field of at least 1,000 m2 (3,360 m2 with reserve).',
    sources: ['ES-RC-DECISION'],
  },
  {
    id: 'blowdown',
    label: 'Blowdown to control chemistry',
    value: 0,
    unit: 'm3/yr (not published)',
    kind: 'out',
    classification: 'TYPICAL',
    note: 'NOT PUBLIC: blowdown volumes are not in the public documents. Any closed evaporative loop must blow down to control dissolved solids, so this is a real stream that is simply not quantified in public.',
    sources: ['ES-CIVILS'],
  },
  {
    id: 'derived-wue',
    label: 'Derived: water per unit of compute',
    value: derived.waterM3PerMwhIt,
    unit: 'm3 per MWh of IT load',
    kind: 'derived',
    classification: 'SIMPLIFIED',
    note: `SIMPLIFIED arithmetic on published inputs: ${fmt(288000)} m3/yr of demand divided by 240 MW x 8,760 h. ${waterIntensitySentence()} This is the headline number worth remembering: water is the heat rejection medium, so water per unit of compute is a design outcome, not an accident.`,
    sources: ['ES-CIVILS'],
  },
  {
    id: 'derived-gap',
    label: 'Derived: shortfall covered by groundwater',
    value: Math.round(derived.supplyGapM3Yr),
    unit: 'm3/yr',
    kind: 'derived',
    classification: 'SIMPLIFIED',
    note: 'SIMPLIFIED arithmetic: 288,000 m3/yr demand less about 75,000 m3/yr of rainfall capture. The consented take exists to cover a gap of roughly this size, which is why the groundwater number and the demand number are the same order of magnitude.',
    sources: ['ES-CIVILS', 'ES-PERMIT'],
  },
];

/** Sanity narrative shown in the water panel. */
export const WATER_NARRATIVE: string[] = [
  'Where water enters: rain onto 95,000 m2 of roof and hardstand (about 75,000 m3/yr captured), plus groundwater from a bore field of four to five bores at up to 7 L/s as the backstop.',
  'Where it goes: mostly into the air. The cooling plant is evaporative, so roughly the entire annual demand leaves as vapour. That is why the consent decision records that water vapour may be visible near the site in some conditions.',
  'What stays behind: the closed loop concentrates chemicals and solids, so blowdown is required even though the public documents do not quantify it.',
  'What the site gives back: about 157,000 m3/yr of treated stormwater recharged into the aquifer, deliberately, to hold up the groundwater that supports the wetland to the south.',
  `The scale insight: cooling water use is ${fmt(derived.waterM3PerMwhIt, 3)} m3 per MWh of IT load. Compare that with potable water at about 2 m3 per day for the whole workforce - a factor of roughly ${fmt(Math.round((derived.waterM3PerMwhIt * 40) / 2))} apart, in the same campus.`,
];

/** Capacity explanation: why different published capacity numbers are not the same thing. */
export interface CapacityClaim {
  figure: string;
  label: string;
  means: string;
  doesNotMean: string;
  classification: 'PUBLIC FACT' | 'TYPICAL' | 'SIMPLIFIED';
}

export const CAPACITY_CLAIMS: CapacityClaim[] = [
  {
    figure: '240 MW',
    label: 'Consented IT capacity',
    means: 'The electrical load of the IT equipment itself: servers, storage, network. This is the figure in the consent decision and application documents.',
    doesNotMean: 'It is not the campus total electrical demand. Cooling plant, pumps, fans, generators, controls and lighting sit on top of it.',
    classification: 'PUBLIC FACT',
  },
  {
    figure: '280 MW',
    label: 'Publicly circulated higher figure',
    means: 'A larger number reported publicly (developer material and media) alongside the consented 240 MW.',
    doesNotMean: 'The documents do not reconcile the two. It may be total facility demand, a later or higher planning figure, or a different definition of capacity. Treat any use of it as an assumption.',
    classification: 'PUBLIC FACT',
  },
  {
    figure: '268.8 MW',
    label: 'Generator fleet rating',
    means: 'PUBLIC FACT arithmetic: 84 sets x 3.2 MW. This is generated capacity, available only when the fleet is running.',
    doesNotMean: 'It is not a capacity figure for the facility at all, and it is not a redundancy margin you can rely on: diesel generators are derated for altitude and temperature, and 84 sets cannot all take block load at once.',
    classification: 'SIMPLIFIED',
  },
  {
    figure: '~80 MW per module',
    label: 'Model module split',
    means: 'SIMPLIFIED: an equal split of the 240 MW IT figure across three modules, used so the model can size electrical and cooling plant per module.',
    doesNotMean: 'The public record does not publish a per-module capacity. The real split could be uneven.',
    classification: 'SIMPLIFIED',
  },
  {
    figure: '445.2 MW',
    label: 'Generator heat release',
    means: 'PUBLIC FACT: 5.3 MW of heat per set. This is the reason a campus that is not selling a single megawatt still needs a large cooling plant.',
    doesNotMean: 'It is not IT load and it is not cooling load: it is heat produced by the backup plant itself, and it needs its own heat rejection.',
    classification: 'PUBLIC FACT',
  },
];