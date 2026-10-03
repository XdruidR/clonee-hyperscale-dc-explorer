/**
 * Evidence classification used everywhere in the application.
 *
 * PUBLIC FACT  - Explicitly supported by public documentation for the Southland
 *                reference project. Cited to a source id.
 * TYPICAL      - A normal hyperscale / AI data centre design assumption based on
 *                reputable industry material.
 * SIMPLIFIED   - Deliberately simplified or modelled for this educational tool.
 * SYNTHETIC    - Invented placeholder used to demonstrate a delivery concept
 *                (costs, dates, names). Never presented as a project fact.
 */
import type { Classification } from './types';
import { derived, fmt, waterIntensitySentence } from './calculations';

export type { Classification };

export const CLASSIFICATION_COLORS: Record<Classification, string> = {
  'PUBLIC FACT': '#41d98a',
  TYPICAL: '#63b3ff',
  SIMPLIFIED: '#f2b13c',
  SYNTHETIC: '#c98bf0',
};

export const CLASSIFICATION_MEANING: Record<Classification, string> = {
  'PUBLIC FACT':
    'Stated in publicly available documentation for the Southland reference project. Source cited.',
  TYPICAL:
    'A normal hyperscale / AI data centre design assumption drawn from industry material. Not a statement about any specific project.',
  SIMPLIFIED:
    'Deliberately simplified or modelled for teaching. Numbers on the 3D model may not reconcile to a real design.',
  SYNTHETIC:
    'Invented placeholder to demonstrate a delivery / project-controls concept. Not a real value.',
};

export interface Fact {
  id: string;
  label: string;
  value: string;
  classification: Classification;
  sources: string[];
  note: string;
}

export const FACTS: Fact[] = [
  {
    id: 'site-area',
    label: 'Campus site area',
    value: '~49 ha (700 m x 700 m rectangle)',
    classification: 'PUBLIC FACT',
    sources: ['ES-CIVILS', 'ES-AEE', 'ES-GWTAE'],
    note: 'Consent decision describes the property as ~48 ha; application documents use 49 ha. Modelled here as a 700 m x 700 m rectangle, which is what the groundwater model describes.',
  },
  {
    id: 'halls',
    label: 'Data halls',
    value: '6 data halls across 3 modules, ~9.5 ha total footprint',
    classification: 'PUBLIC FACT',
    sources: ['SDC-POI', 'ES-AEE', 'ES-CIVILS'],
    note: 'Each hall ~8,210 m2 in phase 1. Modules are rectangles with halls on the outer sides and plant inside the rectangle.',
  },
  {
    id: 'hall-height',
    label: 'Data hall height',
    value: '12 m stated in the AEE; 9.5 m proposed height in one site plan sheet',
    classification: 'PUBLIC FACT',
    sources: ['ES-AEE', 'ES-WETLAND'],
    note: 'The two figures are both in the public record and are not reconciled there. Modelled at 12 m with a note that it is a single-storey tall shed.',
  },
  {
    id: 'it-capacity',
    label: 'IT capacity',
    value: 'Up to 240 MW IT',
    classification: 'PUBLIC FACT',
    sources: ['SDC-POI', 'ES-AEE', 'ES-RC-DECISION'],
    note: 'Consent-grade figure. A 280 MW figure also circulates publicly (see the capacity-explainer panel) — do not treat the two as the same quantity.',
  },
  {
    id: 'gxp-area',
    label: 'GXP substation area',
    value: '~4 ha crushed-rock platform, north-east corner',
    classification: 'PUBLIC FACT',
    sources: ['SDC-POI', 'ES-AEE'],
    note: 'One plan sheet totals 64,685 m2 of substation area. Buildings under 10 m; gantries to 24 m; 2.5 m security fence.',
  },
  {
    id: 'grid-voltage',
    label: 'Connection voltage',
    value: 'Dedicated high-voltage grid exit point (220 kV described publicly)',
    classification: 'PUBLIC FACT',
    sources: ['ES-AEE'],
    note: 'Four high-voltage transmission circuits cross the north-east of the site, two existing towers to be replaced with 50 m towers and two more built. A 33 kV distribution line runs north through the site centre.',
  },
  {
    id: 'generators',
    label: 'Emergency generation',
    value: '84 sets at 3,200 kWe each, in 6 blocks of 14',
    classification: 'PUBLIC FACT',
    sources: ['ES-RC-DECISION', 'ES-S42A', 'ES-EMP'],
    note: 'Rated fleet total 268.8 MW. Blocks are adjacent to the halls. 10,000 L belly tanks each (840,000 L total), 817.7 L/h each, 15 m exhaust stacks.',
  },
  {
    id: 'generator-heat',
    label: 'Generator heat release',
    value: '~5.3 MW heat per set, 445.2 MW total',
    classification: 'PUBLIC FACT',
    sources: ['ES-RC-DECISION', 'ES-S42A'],
    note: 'Each set rejects more heat than it makes electricity. This is why a campus with no IT load still needs cooling.',
  },
  {
    id: 'cooling-type',
    label: 'Cooling approach',
    value: 'Adiabatic / evaporative cooling plant; water-glycol cold plates on accelerators carry 70-80% of heat',
    classification: 'PUBLIC FACT',
    sources: ['ES-AEE'],
    note: 'Public description: liquid plates absorb 70-80% of the heat to a heat exchanger; the remaining hot air is cooled by a secondary liquid heat exchanger; warmed liquid is cooled by outdoor air over a sprayed membrane, evaporation reducing it to 15-20 C, then recirculated. The specific chiller or piping arrangement is NOT public.',
  },
  {
    id: 'cooling-water-demand',
    label: 'Cooling water demand scenario',
    value: '~288,000 m3/yr, varying month to month',
    classification: 'PUBLIC FACT',
    sources: ['ES-CIVILS'],
    note: 'The servicing report states this is a reasonable operational scenario from a design concept, not a commitment.',
  },
  {
    id: 'water-storage',
    label: 'Cooling water storage',
    value: '~75,000 m3 in sealed reservoirs beneath the buildings, 1.5-2.0 m BGL (~1.5 months)',
    classification: 'PUBLIC FACT',
    sources: ['ES-CIVILS'],
    note: 'Tanks are sealed to avoid groundwater interaction; uplift is a building-consent issue.',
  },
  {
    id: 'rainwater',
    label: 'Rainwater capture',
    value: '~75,000 m3/yr (~13% of site rainfall) from ~30,000 m2 hall roof + ~65,000 m2 hardstand',
    classification: 'PUBLIC FACT',
    sources: ['ES-CIVILS'],
    note: 'Long-term average rainfall ~1,100 mm/yr from a 60-year record. Pre-development runoff ~167,000 m3/yr.',
  },
  {
    id: 'groundwater-take',
    label: 'Groundwater take',
    value: 'Up to 7 L/s = 604,800 L/day = 220,752,000 L/yr',
    classification: 'PUBLIC FACT',
    sources: ['ES-PERMIT', 'ES-CIVILS'],
    note: 'Anticipated operational take ~212,600 m3/yr. Bore field of four to five production bores. Used only when rainfall capture does not refill the reservoirs.',
  },
  {
    id: 'potable',
    label: 'Potable water',
    value: '150 m3 tank fed from 3,000 m2 of roof, physically separated from cooling water',
    classification: 'PUBLIC FACT',
    sources: ['ES-CIVILS'],
    note: 'Rainwater harvesting. A site this size has a very small domestic water demand.',
  },
  {
    id: 'wastewater',
    label: 'Wastewater',
    value: 'Up to 5,000 L/day treated domestic wastewater to land via soakage field (AS/NZS 1547)',
    classification: 'PUBLIC FACT',
    sources: ['ES-RC-DECISION', 'ES-S42A'],
    note: '5 mm/day, field >=1,000 m2, 3,360 m2 including reserve. This is a staffing-scale flow, not a process flow.',
  },
  {
    id: 'stormwater',
    label: 'Stormwater',
    value: 'Swales both sides of the halls to a southern basin, ~24 h retention, then soakage recharge to the wetland',
    classification: 'PUBLIC FACT',
    sources: ['ES-CIVILS', 'ES-RC-DECISION'],
    note: 'Expected to remove up to 80% of sediment and 60% of other pollutants. Long-term recharge discharge ~157,000 m3/yr. 1% AEP overtop follows existing flow paths south.',
  },
  {
    id: 'wetland',
    label: 'Wetland interface',
    value: '0.24 ha wetland removed, ~13 ha wetland to the south retained and enhanced, new wetland created',
    classification: 'PUBLIC FACT',
    sources: ['ES-WETLAND', 'ES-RC-DECISION'],
    note: 'Groundwater take alone could lower the southern wetland by up to 1.4 m over 20 years; soakage recharge is the mitigation, and a borefield pumping test is a consent condition.',
  },
  {
    id: 'earthworks',
    label: 'Earthworks and imported material',
    value: '320,000 m3 cut / 320,000 m3 fill, 170,000 m3 imported aggregate, net fill ~220,000 m3',
    classification: 'PUBLIC FACT',
    sources: ['ES-CIVILS'],
    note: 'Imported aggregate goes to road subbase/basecourse, building foundations and the GXP platform. Excavation to 5 m BGL with temporary dewatering.',
  },
  {
    id: 'fibre',
    label: 'International fibre',
    value: 'Subsea cable to Australia; landfall at Oreti Beach; landing station on site sized for up to three cables',
    classification: 'PUBLIC FACT',
    sources: ['SDC-POI', 'ES-AEE'],
    note: 'Two cable ends, a bulkhead and beach manhole, trench to an exchange, then two diverse terrestrial routes to the site. Ring topology across New Zealand plus Sydney and Melbourne.',
  },
  {
    id: 'staging',
    label: 'Delivery staging',
    value: 'Phase 1 halls 8,210 m2 each; small phase 2 addition to two of the three buildings; middle building has no phase 2 area',
    classification: 'PUBLIC FACT',
    sources: ['ES-EMP'],
    note: 'The public programme is modular: halls are built as customers commit, not all at once.',
  },
  {
    id: 'ops-staffing',
    label: 'Operating staffing',
    value: '~60 staff on site during standard business hours; 24/7 security; 24/7/365 operation',
    classification: 'PUBLIC FACT',
    sources: ['ES-EMP'],
    note: 'A 240 MW campus is not a staffing-heavy building. The plant is automated and monitored remotely.',
  },
  {
    id: 'towers',
    label: 'Line towers',
    value: 'Two existing towers replaced, two new 50 m heavy-duty towers built',
    classification: 'PUBLIC FACT',
    sources: ['ES-AEE'],
    note: 'Final substation configuration is stated to be determined by the transmission owner.',
  },
  {
    id: 'consents',
    label: 'Consent status',
    value: 'Nine regional consents granted 2026-03-11 for 35 years; district land use consent granted',
    classification: 'PUBLIC FACT',
    sources: ['ES-RC-DECISION', 'SDC-POI'],
    note: 'Covers air discharge from generators, groundwater take, construction dewatering, wastewater to land, wetland removal, earthworks near wetland, and coastal occupation plus cable installation.',
  },
  {
    id: 'no-cooling-design',
    label: 'What is NOT public',
    value: 'Chiller or tower selection, pipe routes, switchgear lineups, UPS architecture, redundancy target, generator/transformer ratings',
    classification: 'PUBLIC FACT',
    sources: ['ES-AEE', 'ES-CIVILS'],
    note: 'Public documents stop at "cooling plant", "switchgear", "generators" and "GXP". Every detailed arrangement you see in this model for those systems is TYPICAL, never project fact.',
  },
  {
    id: 'derived-wue',
    label: 'Derived: water per unit of compute',
    value: `${fmt(derived.waterM3PerMwhIt, 3)} m3/MWh (${fmt(derived.waterKgPerKwhIt, 3)} kg/kWh)`,
    classification: 'SIMPLIFIED',
    sources: ['ES-CIVILS'],
    note: `Arithmetic on public inputs: ${fmt(288000)} m3/yr of demand divided by 240 MW x 8,760 h. ${waterIntensitySentence()} Shown to make the balance legible, not to replace a water model.`,
  },
  {
    id: 'derived-gen-margin',
    label: 'Derived: generation margin',
    value: `${fmt(derived.generationRatedMW, 1)} MW rated (84 x 3.2 MW) against ${fmt(240)} MW IT - a ratio of ${fmt(derived.generationVsIt, 2)}x`,
    classification: 'SIMPLIFIED',
    sources: ['ES-RC-DECISION'],
    note: 'Roughly 1.1x on IT alone, and close to 1.0x once mechanical and electrical auxiliaries are added. This is exactly why priority-based load shedding exists in the emergency sequence, and why generation is modelled as an alternate source with its own bus rather than as spare capacity on the utility feed.',
  },
  {
    id: 'typical-uts',
    label: 'Typical redundancy target',
    value: 'TIA-942 rating 3 (concurrently maintainable) is publicly referenced as an aim; the achieved rating is not published',
    classification: 'PUBLIC FACT',
    sources: ['ES-AEE', 'IND-TIA942'],
    note: 'A public submission states the aim was to provide power infrastructure meeting a rating 3 level of the TIA-942 standard. No certification is public.',
  },
];

export const FACT_BY_ID: Record<string, Fact> = Object.fromEntries(FACTS.map((f) => [f.id, f]));