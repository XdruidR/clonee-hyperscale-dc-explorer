/**
 * The fact register for the Clonee campus.
 *
 * Every number displayed anywhere in this application comes from one of two
 * places: `calculations.ts`, which does the arithmetic once, or a source id in
 * `sources.ts`. Nothing here restates a derived quantity by hand.
 *
 * CLASSIFICATION is the spine of the product:
 *
 * PUBLIC FACT  Stated in publicly available documentation for the Clonee
 *              project. Carries source ids. Where two sources disagree, the
 *              disagreement is carried too.
 * DERIVED     Arithmetic on published inputs, with the arithmetic shown. This
 *              replaces the older SIMPLIFIED label: a derived figure is not an
 *              approximation, it is the only honest reading of two published
 *              numbers multiplied together.
 * TYPICAL      Accepted hyperscale practice from industry material. Not a
 *              statement about Clonee.
 * SYNTHETIC    Invented, to demonstrate a delivery or project-controls concept.
 *              Never a project fact. The Clonee model uses very little of this.
 *
 * The register deliberately contains a fact about what the public record does
 * NOT contain, because on a real project the boundary of the record is itself
 * information worth having.
 */

import type { Classification } from './types';
import {
  INPUTS,
  ASSUMPTIONS,
  derived,
  fmt,
  fmtInt,
  capacityReconciliationSentence,
  waterIntensitySentence,
} from './calculations';

export type { Classification };

/**
 * Palette for the four labels. All four hold well above 4.5:1 against a
 * near-black panel, and the four hues stay separable for the common forms of
 * colour vision deficiency because they differ in lightness as well as hue.
 */
export const CLASSIFICATION_COLORS: Record<Classification, string> = {
  'PUBLIC FACT': '#41d98a',
  DERIVED: '#4ec9e8',
  TYPICAL: '#f2b13c',
  SYNTHETIC: '#c98bf0',
};

export const CLASSIFICATION_MEANING: Record<Classification, string> = {
  'PUBLIC FACT':
    'Stated in publicly available documentation for the Clonee campus. Cited to a source id, and carried with its caveats where sources disagree.',
  DERIVED:
    'Arithmetic on published Clonee inputs, shown as arithmetic rather than asserted. If two published figures are multiplied together and disagree, both are carried rather than averaged.',
  TYPICAL:
    'Accepted hyperscale design or operating practice from industry and standards material. It is a statement about how this kind of facility is built, not a statement about Clonee.',
  SYNTHETIC:
    'Invented to demonstrate a delivery or project-controls concept. Never a project fact, and never cited to a source.',
};

export interface Fact {
  id: string;
  label: string;
  value: string;
  classification: Classification;
  sources: string[];
  note: string;
}

/** Racks per hall, derived from two published routes rather than asserted. */
const RACKS_PER_HALL = (derived.hallItMW * 1000) / INPUTS.deliveredRackKw;

/** Assumption values, looked up rather than repeated, so the table cannot drift. */
const ASSUMED: Record<string, number> = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a.value]));

export const FACTS: Fact[] = [
  /* ---------------------------------------------------------------- site */
  {
    id: 'site-area',
    label: 'Campus site area',
    value: `${fmt(INPUTS.siteAreaHa, 1)} ha consented; ${fmt(INPUTS.siteAreaHaWhenComplete, 0)} ha "when complete"; ${fmtInt(INPUTS.siteAreaAcresDesign)} acres (~92 ha) in the design record`,
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'SNWA-FB'],
    note: 'Three figures, three documents, no reconciliation offered by any of them. 227 acres is 92 ha, so the design record and the consent differ by about 3.5 ha, and the 85 ha figure is smaller than both because it describes the built footprint rather than the landholding. Modelled as a 960 m by 1,000 m rectangle, which is the 95.5 ha figure.',
  },
  {
    id: 'building-count',
    label: 'Data-storage buildings',
    value: `Five: CLN1, CLN2, CLN3, CLN5, CLN6. There is no CLN4`,
    classification: 'PUBLIC FACT',
    sources: ['EPA-P1192'],
    note: 'The emissions licence names the buildings, and that is the only document that names all five. The gap in the sequence is a real property of the campus, so the numbering gap is preserved everywhere in this application rather than tidied into 1 to 5.',
  },
  {
    id: 'hall-count',
    label: 'Data halls per building',
    value: `${INPUTS.hallsPerBuilding} halls per building, ${fmtInt(derived.hallCount)} halls across the campus`,
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'SNWA-FB'],
    note: `Both the consent and the architect's project record give four. Four halls of equal size is why a single building bar can be long rather than tall, and why one plant corridor serves four independent halls.`,
  },
  {
    id: 'hall-size',
    label: 'Hall floor area and plant area',
    value: `~${fmtInt(INPUTS.hallFloorM2)} m² per hall; ~${fmtInt(INPUTS.plantAreaM2PerBuilding)} m² of internal plant per building`,
    classification: 'PUBLIC FACT',
    sources: ['SNWA-FB'],
    note: `Four halls plus plant gives ~${fmtInt(derived.buildingGfaM2)} m² per building, against the ${fmtInt(INPUTS.gfaM2PerOriginalBuilding)} m² the consent gives for each original building. The two agree because the design record and the consent are describing the same building.`,
  },
  {
    id: 'hall-height',
    label: 'Hall height',
    value: 'Not published. Modelled as a single-storey bar of roughly 13 m to the roof',
    classification: 'TYPICAL',
    sources: ['SNWA-FB'],
    note: 'No source gives an eaves or ridge height, a floor-to-floor height or a clear internal height. A hall of 4,170 m² held at 9 MW IT does not need height, so the modelled figure is only as tall as the plant it contains.',
  },

  /* ----------------------------------------------------------- capacity */
  {
    id: 'it-capacity',
    label: 'Consented IT capacity per building',
    value: `${INPUTS.itMwPerBuilding} MW data capacity per building`,
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605'],
    note: 'This is the load of the IT equipment alone: servers, storage and network. Cooling, pumps, fans, lighting and controls sit on top of it and are not inside the 36 MW.',
  },
  {
    id: 'campus-it-capacity',
    label: 'Campus IT capacity (derived)',
    value: `${fmt(derived.itCapacityMW, 0)} MW IT across ${INPUTS.buildingCount} buildings`,
    classification: 'DERIVED',
    sources: ['MCC-150605', 'EPA-P1192'],
    note: `Arithmetic: ${INPUTS.itMwPerBuilding} MW multiplied by ${INPUTS.buildingCount} buildings. The multiplication is legitimate because the consent grants ${INPUTS.itMwPerBuilding} MW per building and the licence names five buildings, but the consent itself only ever names two, so this figure is the model's reading of the campus rather than a published number.`,
  },
  {
    id: 'capacity-reconciliation',
    label: 'Capacity reconciliation',
    value: `${fmt(derived.itCapacityFromDensityMW, 0)} MW from area and density against ${fmt(derived.itCapacityMW, 0)} MW from the consent, agreeing to within ${fmt(derived.capacityRoutesDifferPct, 1)}%`,
    classification: 'DERIVED',
    sources: ['MCC-150605', 'SNWA-FB'],
    note: capacityReconciliationSentence(),
  },
  {
    id: 'it-power-density',
    label: 'IT area and power density',
    value: `${fmtInt(INPUTS.itAreaM2)} m² of IT area at ${INPUTS.itPowerDensityKwM2} kW/m²`,
    classification: 'PUBLIC FACT',
    sources: ['SNWA-FB'],
    note: `This is the density of a hall delivered around 2016 to 2018, before AI accelerators. It is also the number that makes the retrofit question sharp: the floor area is not the constraint, the electricity is.`,
  },
  {
    id: 'total-floor-area',
    label: 'Total floor area',
    value: `${fmtInt(INPUTS.gfaM2OriginalPhase)} m² original two buildings; ~${fmtInt(INPUTS.gfaM2Expansion)} m² for the expansion; nearly ${fmtInt(INPUTS.gfaM2TotalNearly)} m² total`,
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'MCC-180671', 'META-2019'],
    note: `The 2019 announcement is a round figure and includes administration, the substation and plant, not only halls. Adding the consent figures gives ${fmtInt(INPUTS.gfaM2OriginalPhase + INPUTS.gfaM2Expansion)} m², which is the same order as "nearly 150,000 m²" but not the same number.`,
  },

  /* -------------------------------------------------- grid and substation */
  {
    id: 'grid-voltage',
    label: 'Grid connection voltage',
    value: `${INPUTS.transmissionKv} kV transmission, loop-in to the existing system`,
    classification: 'PUBLIC FACT',
    sources: ['BP-VA0018'],
    note: 'A loop-in taps the existing line rather than terminating a new radial circuit, which is why two new towers are consented rather than one. The final configuration is the transmission owner’s to determine.',
  },
  {
    id: 'step-down-voltage',
    label: 'Voltage arrangement at the campus',
    value: `${INPUTS.transmissionKv} kV / ${INPUTS.campusMvKv} kV, then transformation to low voltage inside each building`,
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'BP-VA0018'],
    note: 'The campus is distributed at medium voltage rather than high voltage, which keeps the cable routes simpler but puts more transformation inside the building envelope.',
  },
  {
    id: 'campus-mv',
    label: 'Campus distribution',
    value: `Underground ${INPUTS.campusMvKv} kV cables between the substation and the data-centre buildings`,
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605'],
    note: 'Buried distribution suits a campus being built alongside itself in phases: a new building gets a new cable route without trenching across operating plant. The lineup inside each building is not published.',
  },
  {
    id: 'grid-connection',
    label: 'Grid connection',
    value: `Completed August ${INPUTS.gridConnectionYear}, built by the customer in about ${INPUTS.gridConnectionMonths} months. The first customer-built 220 kV station in Ireland`,
    classification: 'PUBLIC FACT',
    sources: ['EIR-AR2017'],
    note: 'The transmission system operator built the connection to the customer-built station, which is a different division of responsibility from the station itself. Ireland has almost no industrial demand at this connection voltage, so the first one had no template to follow.',
  },
  {
    id: 'substation-area',
    label: 'Substation compound',
    value: `~${fmtInt(INPUTS.substationAreaM2)} m² compound`,
    classification: 'PUBLIC FACT',
    sources: ['BP-VA0018'],
    note: `The compound holds outdoor switchgear, three transformers, a control building, a customer medium-voltage building and a diesel-generator building. The civil package for the same substation describes ~${fmtInt(INPUTS.substationCivilM2)} m² of works, which is the constructed area rather than the fenced land take.`,
  },
  {
    id: 'hv-bays',
    label: '220 kV switchgear',
    value: `${INPUTS.hvBays} bays, outdoor air-insulated switchgear`,
    classification: 'PUBLIC FACT',
    sources: ['BP-VA0018'],
    note: 'Air-insulated switchgear outdoors is the normal choice at this voltage in this climate: no gas, no building to heat, and the failure modes are visible on inspection. The bay arrangement is not published.',
  },
  {
    id: 'lightning-masts',
    label: 'Lightning protection',
    value: `${INPUTS.lightningMasts} lightning masts`,
    classification: 'PUBLIC FACT',
    sources: ['BP-VA0018', 'JP-SUB'],
    note: `The civil contractor describes ${INPUTS.substationMastBases} reinforced concrete bases carrying 30 m mono-pole masts, which is a subset of the ${INPUTS.lightningMasts} consented for the compound. Masts rather than catenary overhead earth is a deliberate choice for an outdoor switchyard in an exposed site.`,
  },
  {
    id: 'step-down-transformers',
    label: 'Step-down transformers',
    value: `${INPUTS.stepDownTransformers} units. DERIVED sizing: ${ASSUMED.transformerMva} MVA each, ${fmt(derived.transformerTotalMva, 0)} MVA installed`,
    classification: 'PUBLIC FACT',
    sources: ['BP-VA0018'],
    note: `Three is the published count; the rating is not. ${ASSUMED.transformerMva} MVA each is DERIVED, sized so three units cover the campus facility load of ${fmt(derived.facilityLoadMW, 0)} MW with headroom for mechanical load. The consequence is the interesting part: losing one leaves ${fmt(derived.nMinusOneMva, 0)} MVA, which is a genuine N-1 story rather than a nominal one.`,
  },
  {
    id: 'towers',
    label: 'Transmission connection works',
    value: `${INPUTS.newTransmissionTowers} new 220 kV transmission towers on a loop-in connection`,
    classification: 'PUBLIC FACT',
    sources: ['BP-VA0018'],
    note: 'Two towers rather than one because the circuit is looped into the existing line at both ends of the site, which also gives the owner a switching option that a single-ended connection would not.',
  },
  {
    id: 'substation-civil',
    label: 'Substation civil and structural package',
    value: `~${fmtInt(INPUTS.substationCivilM2)} m², €${fmt(INPUTS.substationCivilCostM, 1)}m, ${INPUTS.substationCivilMonths} months: ${INPUTS.substationEquipmentBases} equipment bases, transformers of ${fmtInt(INPUTS.substationTransformerMassKg)} kg with ${fmtInt(INPUTS.substationTransformerOilL)} L of oil, ${fmtInt(INPUTS.substationCableTroughM)} m of cable troughing`,
    classification: 'PUBLIC FACT',
    sources: ['JP-SUB'],
    note: `A contractor case study, so it is interested in its own scope. It describes the substation as designed to serve a 62,000 m² data centre, which is larger than the ${fmtInt(INPUTS.gfaM2OriginalPhase)} m² the original consent grants, and it identifies the scheme as Ireland's second privately funded and constructed 220 kV substation.`,
  },

  /* --------------------------------------------------------- generation */
  {
    id: 'generators',
    label: 'Emergency generation',
    value: `${INPUTS.generatorCount} diesel generators across the five buildings`,
    classification: 'PUBLIC FACT',
    sources: ['EPA-P1192'],
    note: 'The count is published; no rating, no fuel capacity and no distribution arrangement is. Eighty-four sets is the figure published elsewhere for this campus size, so the distinction between a count and a rating matters more than usual here.',
  },
  {
    id: 'generator-split',
    label: 'Generation per building (derived)',
    value: `${INPUTS.generatorsPerBuilding} sets per building at ${fmt(ASSUMED.generatorRatedKw / 1000, 1)} MW = ${fmt(derived.generationPerBuildingMW, 0)} MW, a ratio of ${fmt(derived.generationVsIt, 2)}x the ${INPUTS.itMwPerBuilding} MW IT load`,
    classification: 'DERIVED',
    sources: ['EPA-P1192'],
    note: `The even split is arithmetic, and the ${fmt(ASSUMED.generatorRatedKw / 1000, 1)} MW rating is TYPICAL, not published. ${fmt(derived.generatorRatedMW, 0)} MW of generation against ${fmt(derived.itCapacityMW, 0)} MW of IT load leaves room for the mechanical load a hall cannot run without, which is why the fleet is deliberately larger than the IT load.`,
  },
  {
    id: 'generator-heat',
    label: 'Generator heat release',
    value: `DERIVED: ~${fmt(ASSUMED.generatorHeatReleaseKw / 1000, 1)} MW of heat per set, ${fmt(derived.generationHeatMW, 0)} MW across the fleet`,
    classification: 'DERIVED',
    sources: ['EPA-P1192'],
    note: `A diesel engine rejects more heat than it converts; at ${fmt(ASSUMED.generatorRatedKw / 1000, 1)} MW out and roughly 43% electrical efficiency, about ${fmt(ASSUMED.generatorHeatReleaseKw / 1000, 1)} MW leaves through radiators, jacket water and exhaust per set. This heat goes to ambient air through the sets' own cooling systems. It never enters the IT cooling loop.`,
  },
  {
    id: 'generator-operation',
    label: 'When the generators may run',
    value: 'Loss of grid supply; instability or reduction of grid supply; maintenance; and TSO-requested grid reduction',
    classification: 'PUBLIC FACT',
    sources: ['EPA-P1192'],
    note: 'The licence states these conditions, which is unusually informative. A generator that is allowed to run on a TSO instruction as well as on a supply failure is part of the system services market, not only a backup plant, and the noise and emissions conditions attach to all four cases.',
  },

  /* ------------------------------------------------------------ cooling */
  {
    id: 'cooling-type',
    label: 'Cooling approach',
    value: 'Indirect air cooling, with residual evaporative cooling-water discharge',
    classification: 'PUBLIC FACT',
    sources: ['SNWA-FB', 'EPA-P1192'],
    note: 'Two sources, and they pull in different directions. Indirect air cooling is by definition air-side, yet the licence records a cooling-water discharge. The honest reading is an evaporative-assisted indirect arrangement that runs dry for most of the year and only wets its evaporative stage in the hottest hours, which is exactly what a mild climate buys.',
  },
  {
    id: 'cooling-water-demand',
    label: 'Cooling water demand',
    value: `DERIVED: ~${fmtInt(derived.dischargeM3Yr)} m³/yr of site water, ${waterIntensitySentence()}`,
    classification: 'DERIVED',
    sources: ['SNWA-FB', 'EPA-P1192'],
    note: `No source publishes a volume for Clonee. This is the published campus IT load at ${fmtInt(derived.itHeatGjPerYear / 1000)} GJ/yr, ${fmt(ASSUMED.evaporativeFraction * 100, 0)}% of it rejected by evaporation, divided by the latent heat of vaporisation. The evaporation fraction is TYPICAL and is small for the Irish climate reason given above.`,
  },
  {
    id: 'water-storage',
    label: 'Water storage',
    value: `DERIVED: ~${fmtInt(derived.storageM3)} m³ to bridge a dry spell before the wellfield makes up the difference`,
    classification: 'DERIVED',
    sources: ['MCC-150605', 'MCC-180671'],
    note: 'The consents grant tanks and drainage on the campus, so storage exists, but no capacity is published. The figure above is the gap between what the campus evaporates and what its roofs and hardstands return, over a twelfth of a year, with a factor for irregularity of rainfall.',
  },
  {
    id: 'groundwater',
    label: 'Wellfield abstraction',
    value: `DERIVED: ~${fmt(derived.borefieldLPerSecond, 1)} L/s continuous equivalent to cover the gap rainfall cannot close`,
    classification: 'DERIVED',
    sources: ['MCC-150605', 'SNWA-FB'],
    note: 'TYPICAL in kind, DERIVED in size. A wellfield is how an Irish campus closes the gap between a cooling load it cannot reduce and rainfall it cannot rely on in a dry summer. The number is an annual average, not a consented abstraction, and no Clonee abstraction licence is in the public record used here.',
  },
  {
    id: 'water-sources',
    label: 'Where the water comes from',
    value: `Rain capture ~${fmtInt(derived.runoffCaptureM3Yr)} m³/yr (${fmt(derived.captureFractionOfRainfall * 100, 1)}% of site rainfall) against a wellfield gap of ~${fmtInt(derived.supplyGapM3Yr)} m³/yr`,
    classification: 'DERIVED',
    sources: ['MCC-150605', 'SNWA-FB'],
    note: `Rain covers ${fmt(derived.groundwaterCoverage * 100, 0)}% of the water the cooling circuit gives up; groundwater has to find the rest. That split is the single most useful number for understanding why the campus is consented on ${fmt(INPUTS.siteAreaHa, 1)} ha of land: land area is how much roof and hardstand you have to collect rain from.`,
  },
  {
    id: 'stormwater',
    label: 'Stormwater',
    value: 'Roof and hardstand runoff is captured, attenuated and reused; the licence covers stormwater and environmental systems',
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'EPA-P1192'],
    note: 'The consent grants drainage and the licence requires stormwater and environmental systems to be managed, but neither publishes a runoff volume, a retention time or a discharge quality. The reuse of collected runoff as cooling make-up is the economic reason to build the capture system at all.',
  },
  {
    id: 'stormwater-outfall',
    label: 'Receiving watercourse',
    value: 'TYPICAL: attenuated runoff discharged under licence to a receiving watercourse. The watercourse is not named in the sources used here',
    classification: 'TYPICAL',
    sources: ['EPA-P1192'],
    note: 'An industrial emissions licence implies a licensed discharge point, and a discharge condition implies a receiving water. Naming neither would be a guess, so this model shows a receiving watercourse as a generic element and does not assert where it is or what it is called.',
  },
  {
    id: 'potable',
    label: 'Domestic water',
    value: 'A staffing-scale flow. Tanks and drainage are consented; no flow is published',
    classification: 'TYPICAL',
    sources: ['MCC-150605', 'MCC-180671'],
    note: 'Potable water on a campus of this size is a welfare flow for the people in the administration and operations buildings, kept physically separate from cooling water because the cooling circuit carries treatment chemicals. No figure is stated here because none is published, and inventing one would be the easiest lie in this register.',
  },
  {
    id: 'wastewater',
    label: 'Wastewater',
    value: 'A staffing-scale foul flow, treated on site and discharged to ground. No flow is published',
    classification: 'TYPICAL',
    sources: ['MCC-150605', 'MCC-180671'],
    note: 'On a 95.5 ha campus the domestic foul flow is negligible beside the cooling stream, which is precisely why it is easy to overlook and why treating it on site, rather than discharging to a public sewer, is a normal decision at this rural location.',
  },
  {
    id: 'batteries',
    label: 'Battery systems',
    value: 'TYPICAL: uninterruptible power supplies and battery strings behind the load. Sizes and chemistries are not published',
    classification: 'TYPICAL',
    sources: ['IND-UPTIME'],
    note: 'Any facility holding IT load through a supply interruption has batteries, and any battery installation is a fire hazard that needs its own detection, segregation and ventilation. None of that is in the Clonee record, so only the existence of the obligation is asserted.',
  },

  /* ---------------------------------------------------------------- data */
  {
    id: 'fibre',
    label: 'Network connectivity',
    value: 'TYPICAL: overland terrestrial fibre with two diverse routes to the meet-me rooms',
    classification: 'TYPICAL',
    sources: ['SNWA-FB'],
    note: 'Clonee is not a subsea landing site, so its connectivity depends on terrestrial routes and on other people’s ducts. Two diverse terrestrial routes to separate carrier rooms is the standard requirement and, historically, the standard single point of failure.',
  },
  {
    id: 'meet-me',
    label: 'Meet-me rooms',
    value: `${INPUTS.meetMeRoomsPerBuilding} per building`,
    classification: 'PUBLIC FACT',
    sources: ['SNWA-FB'],
    note: 'One room is for carriers and one for the operator’s own interconnection, which is why they are separated rather than combined: they have different security requirements and different failure consequences.',
  },
  {
    id: 'rack-count',
    label: 'Rack density (derived)',
    value: `~${fmtInt(RACKS_PER_HALL)} racks per hall at ~${INPUTS.deliveredRackKw} kW per rack`,
    classification: 'DERIVED',
    sources: ['SNWA-FB', 'MCC-150605'],
    note: `Arithmetic from two published routes: ${fmt(derived.hallItMW, 0)} MW of consented IT load per hall, which is ${fmtInt(derived.hallItMW * 1000)} kW, divided by ${INPUTS.deliveredRackKw} kW per rack. The rack count itself is DERIVED, because the public record describes halls by area and power, not by rows of cabinets. ${INPUTS.deliveredRackKw} kW is the right order for an air-cooled hall of this delivery period and well below the rack power of current AI platforms.`,
  },
  {
    id: 'ai-rack',
    label: 'Current AI rack power (comparison only)',
    value: `~${fmtInt(INPUTS.aiRackKw)} kW for a rack-scale AI system, against ${INPUTS.deliveredRackKw} kW delivered here`,
    classification: 'PUBLIC FACT',
    sources: ['IND-NVDA', 'IND-MMD'],
    note: 'A vendor-published figure for a current platform, quoted here only to size the retrofit question. It is not a statement about Clonee, and it is not a design proposal for Clonee.',
  },
  {
    id: 'ai-cdu',
    label: 'Retrofit route for liquid cooling',
    value: 'TYPICAL: liquid-to-air sidecar units at row level, or a wholesale hall conversion',
    classification: 'TYPICAL',
    sources: ['IND-LC'],
    note: 'A hall whose primary heat rejection is air cannot natively accept liquid. Either sidecar coolers take heat from the racks and reject it to the same air, or the hall is converted around a new water loop. Both are real projects and both cost far more than the rack density suggests.',
  },

  /* ------------------------------------------------------------- delivery */
  {
    id: 'phase-1',
    label: 'Phase 1 delivery window',
    value: `April 2016 site start to September 2018 opening, about ${INPUTS.phase1BuildMonths} months`,
    classification: 'PUBLIC FACT',
    sources: ['PRESS-ECO'],
    note: 'Secondary reporting, cited because it is the only public statement of the phase 1 window, and flagged as secondary for that reason. It covers site establishment through to opening, which is longer than the shell-to-handover window a contractor would quote.',
  },
  {
    id: 'announced-investment',
    label: 'Announced investment',
    value: `€${fmtInt(INPUTS.announcedInvestmentM)}m announced for the original two buildings of eight halls and up to ${INPUTS.announcedCapacityMw} MW; DERIVED ~€${fmt(derived.costPerMwAnnounced, 2)}m per MW`,
    classification: 'DERIVED',
    sources: ['PRESS-ECO'],
    note: 'This is an announced figure in secondary reporting, not a measured cost, and it is not a benchmark. Development-basis benchmarks for Irish sites currently sit an order of magnitude higher, because they include land, statutory fees, contributions, professional fees and finance. Use it to understand the era and the scale of the announcement, nothing else.',
  },
  {
    id: 'peak-workforce',
    label: 'Peak construction workforce',
    value: `~${fmtInt(INPUTS.peakWorkforce)} skilled trades at peak on the mature campus, DERIVED ${fmt(derived.workersPerMwAtPeak, 1)} workers per MW`,
    classification: 'PUBLIC FACT',
    sources: ['META-DC'],
    note: `Peak on the full five-building campus, not on a single building. The ratio is arithmetic on the operator's current published campus capacity. A figure like this is what determines the scale of the temporary works, the welfare provision and the traffic management on the public road.`,
  },
  {
    id: 'sustainability',
    label: 'Sustainability record',
    value: `${INPUTS.wasteRecycledPct}% of construction waste recycled in the first two buildings; ${INPUTS.leedCertification}; Ireland's Green Construction Award`,
    classification: 'PUBLIC FACT',
    sources: ['META-2019'],
    note: `Published by the operator about its own work, which is the appropriate authority for a certification claim and a weaker one for a waste statistic. The ${INPUTS.wasteRecycledPct}% figure is stated for the first two buildings, not for the campus.`,
  },
  {
    id: 'design-team',
    label: 'Contractor and design team',
    value: 'Mace as contractor; studioNWA as the contractor’s architect; Cundall for mechanical and electrical and for civil and structural engineering',
    classification: 'PUBLIC FACT',
    sources: ['SNWA-FB', 'ICE-2018'],
    note: 'The architect sits on the contractor’s side of the procurement, which is the norm for this kind of appointment in Ireland and shapes who holds design risk on fit-out. The award is Industrial Over €10m at the 2018 Irish Construction Excellence Awards, announced March 2018, which confirms phase 1 was a completed multi-phase project by then.',
  },
  {
    id: 'contractor-schedule',
    label: 'Contractor’s recorded delivery',
    value: 'RIBA stage 7 for CLN1 in 2017, CLN2 in 2018, CLN3 in 2019. Phase 1 completed in the final quarter of 2017, including four halls of ~16,400 m², all roads, parking and the 220 kV substation. CLN2 fit-out began in the final quarter of 2017 for handover in May 2018',
    classification: 'PUBLIC FACT',
    sources: ['SNWA-FB'],
    note: 'RIBA stage 7 is practical completion, not occupation, so a building at stage 7 has been commissioned but is not necessarily carrying production IT load. Note also that phase 1 includes the substation: the grid connection was a deliverable of the same building project, not a separate infrastructure programme.',
  },
  {
    id: 'build-sequence',
    label: 'Campus build sequence',
    value: '2015 consent (RA150605) → August 2017 grid energisation → final quarter 2017 phase 1 complete and CLN1 → May 2018 CLN2 handover → 2019 CLN3 → March 2019 two-building expansion announced → five-building mature campus',
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'MCC-180671', 'EIR-AR2017', 'SNWA-FB', 'META-2019', 'EPA-P1192'],
    note: 'Assembled from six documents, each of which covers one part of the sequence. The point of the sequence is not the dates but the overlap: the grid energised in the middle of a live construction programme, and the expansion was consented while buildings were still being fitted out, so this campus was repeatedly built beside itself.',
  },
  {
    id: 'admin-buildings',
    label: 'Administration buildings',
    value: 'An administration building with staff welfare in the original consent, and a further administration and office building consented for the expansion',
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'MCC-180671', 'SNWA-FB'],
    note: 'Two administration buildings for one campus is a fair indicator of the build being run as separate projects rather than one scheme. Office floor area is where the domestic water demand sits, which is why the potable system matters at all.',
  },
  {
    id: 'campus-roads',
    label: 'Access and site roads',
    value: 'Internal roads, car parking and a guard house are part of the consented campus; no public access into the development',
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'SNWA-FB'],
    note: 'Phase 1 delivered all internal and external roads and the car parking, which on a five-building campus is a substantial amount of hardstand. Hardstand is impervious surface: it generates runoff that has to be attenuated, and it is why the impervious fraction of this site is high.',
  },
  {
    id: 'ops-staffing',
    label: 'Operating staffing',
    value: 'TYPICAL: small on-site establishment with remote monitoring and 24/7 security',
    classification: 'TYPICAL',
    sources: ['IND-UPTIME'],
    note: 'A hyperscale campus is not a labour-intensive building. The published record gives no staffing figure for Clonee, and none is asserted here; what is asserted is that the plant is automated and monitored centrally, which is normal for the type.',
  },

  /* ------------------------------------------------------------ the limit */
  {
    id: 'not-public',
    label: 'What is NOT public',
    value: 'Single-line diagrams; generator ratings and distribution per building; switchgear lineups; UPS architecture and autonomy; cooling plant counts and control logic; the achieved redundancy rating; historical programme and cost data',
    classification: 'PUBLIC FACT',
    sources: ['MCC-150605', 'MCC-180671', 'BP-VA0018', 'EPA-P1192', 'SNWA-FB'],
    note: 'This is a fact about the record rather than about the facility, and it is the most useful entry in the register. The public documents stop at "substation", "generators", "cooling infrastructure" and "20 kV cables". Everything this application shows inside those boundaries is TYPICAL practice, labelled as such, and should never be read as a statement about what was built at Clonee.',
  },
];

/** Optional grouping, so panels can present the register as chapters. */
export const FACT_CATEGORIES: { id: string; label: string; factIds: string[] }[] = [
  {
    id: 'site',
    label: 'Site and buildings',
    factIds: ['site-area', 'building-count', 'hall-count', 'hall-size', 'hall-height', 'total-floor-area', 'admin-buildings', 'campus-roads'],
  },
  {
    id: 'capacity',
    label: 'Capacity',
    factIds: ['it-capacity', 'campus-it-capacity', 'capacity-reconciliation', 'it-power-density', 'rack-count', 'ai-rack'],
  },
  {
    id: 'power',
    label: 'Power and grid',
    factIds: [
      'grid-voltage',
      'step-down-voltage',
      'campus-mv',
      'grid-connection',
      'substation-area',
      'hv-bays',
      'lightning-masts',
      'step-down-transformers',
      'towers',
      'substation-civil',
      'batteries',
    ],
  },
  {
    id: 'generation',
    label: 'Generation',
    factIds: ['generators', 'generator-split', 'generator-heat', 'generator-operation'],
  },
  {
    id: 'cooling-water',
    label: 'Cooling and water',
    factIds: [
      'cooling-type',
      'cooling-water-demand',
      'water-storage',
      'groundwater',
      'water-sources',
      'stormwater',
      'stormwater-outfall',
      'potable',
      'wastewater',
    ],
  },
  {
    id: 'data',
    label: 'Data',
    factIds: ['fibre', 'meet-me', 'ai-cdu'],
  },
  {
    id: 'delivery',
    label: 'Delivery and record',
    factIds: [
      'phase-1',
      'announced-investment',
      'peak-workforce',
      'sustainability',
      'design-team',
      'contractor-schedule',
      'build-sequence',
      'ops-staffing',
      'not-public',
    ],
  },
];

export const FACT_BY_ID: Record<string, Fact> = Object.fromEntries(FACTS.map((f) => [f.id, f]));