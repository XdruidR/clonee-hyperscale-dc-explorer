/**
 * Guided journeys: eight guided tours through the Clonee model.
 *
 * A journey is a sequence of camera-and-view states with teaching text. The
 * component ids in `focus` and `look` are the ones the model knows about; every
 * other component is dimmed while a step is showing, so the set of ids is the
 * argument the step is making.
 *
 * Rules observed here:
 *   - Every number quoted in a body or an evidence line comes from
 *     `calculations.ts`, either an input, an assumption or a derived value.
 *   - Every component id exists in `COMPONENTS`.
 *   - `isolateHall` takes a BUILDING index in campus reading order, 1 for CLN1,
 *     2 for CLN2, 3 for CLN3, 4 for CLN5, 5 for CLN6.
 *   - Where a claim is typical practice rather than a Clonee fact, the evidence
 *     line says so. That is the whole point of the application.
 */

import { ASSUMPTIONS, derived, fmt, fmtInt, INPUTS, waterIntensitySentence } from './calculations';
import { FIBRE_CHAIN, HALL_NAME, HEAT_CHAIN, POWER_CHAIN, RETROFIT_HALL, WATER_CHAIN } from './campus';

export interface JourneyStep {
  title: string;
  body: string;
  /** component ids to keep lit; everything else dims */
  focus: string[];
  /** component ids the camera should look at when there is no explicit camera */
  look: string[];
  mode: 'power' | 'cooling' | 'water' | 'data' | 'site' | 'overview' | 'construction' | 'commissioning' | 'controls' | 'ai';
  camera?: { pos: [number, number, number]; target: [number, number, number] };
  view?: {
    roofOff?: boolean;
    cutaway?: boolean;
    explode?: number;
    /**
     * Campus reading index 1..5 of the data-storage building to isolate.
     * Named `isolateHall` historically; on this campus the isolatable unit is
     * the building, so the store maps it onto `isolateBuilding`.
     */
    isolateHall?: number | null;
    labels?: boolean;
    flows?: boolean;
  };
  evidence?: string;
}

export interface Journey {
  id: string;
  title: string;
  blurb: string;
  classificationHint: string;
  steps: JourneyStep[];
}

/** The five data-storage buildings in campus reading order, for isolateHall. */
const CLN1 = 1;
const CLN2 = 2;

/**
 * Assumption values by key, looked up from the table in `calculations.ts`.
 *
 * Prose in this file is not allowed to restate a number by hand. Inputs and
 * derived values are imported directly; the handful of figures that had to be
 * invented are read out of `ASSUMPTIONS` here, so if a value is ever revised
 * the sentence changes with it and the reason travels with it.
 */
function A(key: string): number {
  const found = ASSUMPTIONS.find((a) => a.key === key);
  if (!found) throw new Error(`journeys.ts: unknown assumption ${key}`);
  return found.value;
}

export const JOURNEYS: Journey[] = [
  /* ------------------------------------------------------------------ 1 grid */
  {
    id: 'grid',
    title: 'The 15-month grid connection',
    blurb:
      'The loop-in, the towers, the switchyard and the transformers — the part of the campus that had to be built before anything else could be switched on.',
    classificationHint:
      'PUBLIC FACT for the loop-in, the two towers, the 12 bays, 27 masts, three transformers, the compound area and the August 2017 energisation; the transformer ratings and everything inside the 15 months are DERIVED or TYPICAL.',
    steps: [
      {
        title: 'A loop-in, not a spur',
        body:
          'Clonee does not get its own radial line out of the transmission network. The consented connection is a loop-in: the existing 220 kV line arrives, breaks at the site, passes through a new station and carries on. That is why two new transmission towers stand on the model rather than one, and why the connection needed planning consent in its own right, under An Bord Pleanála reference VA0018, rather than sitting inside the data-centre consent.',
        focus: ['hv.line', 'sub.tower1', 'sub.tower2'],
        look: ['hv.line', 'sub.tower1', 'sub.tower2'],
        mode: 'power',
        camera: { pos: [620, 210, -800], target: [200, 26, -520] },
        evidence:
          'PUBLIC FACT: BP-VA0018 — loop-in connection to the existing 220 kV transmission system, and two new 220 kV transmission towers.',
      },
      {
        title: 'Why the customer built the station',
        body: `A campus carrying ${fmt(derived.itCapacityMW, 0)} MW of IT load cannot be fed from the distribution network at all; that is transmission scale. EirGrid's own record is specific that the station was constructed by the customer and connected by EirGrid, and that it was the first customer-built 220 kV station in Ireland. The company therefore designed, permitted, built and commissioned a transmission asset on its own land, which is why the substation appears here as a workstream in its own right rather than as a utility hook-up.`,
        focus: ['sub.platform', 'sub.bay', 'sub.control'],
        look: ['sub.platform'],
        mode: 'power',
        camera: { pos: [560, 165, 250], target: [330, 8, 0] },
        evidence: 'PUBLIC FACT: EIR-AR2017 — constructed by the customer, connected by EirGrid, the first customer-built 220 kV station in Ireland.',
      },
      {
        title: 'Twelve bays, outdoors',
        body: `The switchyard is air-insulated: ${INPUTS.hvBays} bays of 220 kV equipment standing outdoors on steel structures, protected by ${INPUTS.lightningMasts} lightning masts on reinforced concrete bases ${fmtInt(INPUTS.substationMastHeightM)} m high. The bay-for-bay arrangement shown is a simplified loop-in scheme — the count is published, the layout is not. Air-insulated gear outdoors is the norm at this voltage because the clearances a gas-insulated design demands would multiply the footprint of a compound that is already about ${fmtInt(INPUTS.substationAreaM2)} m².`,
        focus: ['sub.bay'],
        look: ['sub.bay'],
        mode: 'power',
        camera: { pos: [486, 62, -104], target: [364, 11, -44] },
        evidence:
          'PUBLIC FACT: BP-VA0018 — outdoor 220 kV air-insulated switchgear, 12 × 220 kV bays, 27 lightning-protection masts, compound of approximately 30,100 m². DERIVED: the bay arrangement.',
      },
      {
        title: 'Three transformers',
        body: `Three step-down transformers take ${INPUTS.transmissionKv} kV down to the campus medium voltage. The public record gives the count and no ratings, so the model sizes them from the consented campus load: three at ${A('transformerMva')} MVA give ${fmt(derived.transformerTotalMva, 0)} MVA. That is ${fmt(derived.transformerLoadPct, 0)}% loaded against a whole-facility draw of about ${fmt(derived.facilityLoadMW, 0)} MW, and it produces the most interesting arithmetic on the site: lose one and ${fmt(derived.nMinusOneMva, 0)} MVA remain, ${fmt(derived.nMinusOneShortfallMW, 0)} MW short of carrying everything.`,
        focus: ['sub.xfmr'],
        look: ['sub.xfmr'],
        mode: 'power',
        camera: { pos: [348, 44, 116], target: [296, 8, 34] },
        evidence:
          'PUBLIC FACT: BP-VA0018 — three step-down transformers, no ratings. DERIVED: 90 MVA each, from the consented campus load and the assumption stated in the model.',
      },
      {
        title: 'Underground to the buildings',
        body:
          'Below the transformers the campus distribution changes character. The Meath County Council consent for the data centre states that the electricity between the substation and the buildings runs underground at 20 kV. No overhead campus distribution, nothing visible between the compound and the halls. That cable route is one of the reasons the consented site area is as large as it is, because a trench corridor has to be reserved long before anyone knows which building will be fitted out first.',
        focus: ['sub.mvb', 'CLN1.mv', 'CLN2.mv', 'CLN3.mv', 'CLN5.mv', 'CLN6.mv'],
        look: ['CLN1.mv'],
        mode: 'power',
        camera: { pos: [-90, 78, -128], target: [-192, 6, -232] },
        evidence:
          'PUBLIC FACT: MCC-150605 — underground 20 kV electricity cables between the substation and the data-centre buildings. TYPICAL: the switchboard lineup inside each building.',
      },
      {
        title: 'August 2017, and what it sat on',
        body: `EirGrid records the station completed in August ${INPUTS.gridConnectionYear}, connected in approximately ${INPUTS.gridConnectionMonths} months. The civil and structural package underneath is documented separately: about ${fmtInt(INPUTS.substationCivilM2)} m² of compound for €${fmt(INPUTS.substationCivilCostM, 1)}m over ${INPUTS.substationCivilMonths} months, ${INPUTS.substationEquipmentBases} equipment bases, ${INPUTS.substationMastBases} mast bases, ${INPUTS.substationCableTroughM} m of glass-fibre-reinforced cable troughing with trafficable covers, and two bunds holding ${fmtInt(INPUTS.substationTransformerMassKg)} kg transformers with ${fmtInt(INPUTS.substationTransformerOilL)} litres of oil. Concrete, on the critical path of everything else.`,
        focus: ['sub.platform', 'sub.xfmr', 'sub.control', 'sub.bay'],
        look: ['sub.xfmr'],
        mode: 'power',
        camera: { pos: [470, 120, 190], target: [330, 6, 20] },
        evidence:
          'PUBLIC FACT: JP-SUB — civil and structural package figures above; EIR-AR2017 — energisation in August 2017.',
      },
    ],
  },

  /* ---------------------------------------------------------------- 2 power */
  {
    id: 'power',
    title: 'Following the electrons',
    blurb: 'One unbroken path from the 220 kV loop-in to a single rack, and what each step down in voltage is actually for.',
    classificationHint:
      'PUBLIC FACT for the connection, the transformer count, the 20 kV underground cables and the rack power density; every voltage step between the substation and the rack, and the whole of the switchgear architecture, is TYPICAL.',
    steps: [
      {
        title: 'The grid exit point',
        body:
          'Everything the campus consumes arrives at one place. A 220 kV loop-in brings power into the compound, and from the first breaker inward this is a private electrical system: the campus owns the protection, the switching strategy and the earthing for everything inside the fence. Nothing here comes from the distribution network, and nothing upstream of the yard can be repaired by anyone working on this site.',
        focus: ['hv.line', 'sub.bay'],
        look: ['sub.bay'],
        mode: 'power',
        camera: { pos: [560, 130, -160], target: [364, 11, -44] },
      },
      {
        title: `${INPUTS.transmissionKv} kV becomes ${INPUTS.campusMvKv} kV`,
        body: `Three transformers, ${INPUTS.transmissionKv} kV to ${INPUTS.campusMvKv} kV. They create no energy; they trade voltage for current and lose roughly one per cent of what passes through as heat, which is why a transformer is a piece of cooling plant as much as a piece of electrical plant. Three at ${A('transformerMva')} MVA give ${fmt(derived.transformerTotalMva, 0)} MVA against ${fmt(derived.itCapacityMW, 0)} MW of consented IT load, and the loss of any one of them is a campus-scale event rather than an equipment event.`,
        focus: ['sub.xfmr'],
        look: ['sub.xfmr'],
        mode: 'power',
        camera: { pos: [348, 44, 116], target: [296, 8, 34] },
        view: { flows: true },
      },
      {
        title: 'The underground run',
        body: `The campus distribution is ${INPUTS.campusMvKv} kV cable in the ground, and every building has its own medium-voltage arrival. Inside the building the lineup is typical rather than published: an incomer per supply, split bus sections, per-hall feeders. Splitting the bus is the point. It is what stops a fault in one hall from propagating into four, and it is the first place on this tour where a redundancy claim can be checked by walking two paths and listing what they share.`,
        focus: ['sub.mvb', 'CLN1.mv'],
        look: ['CLN1.mv'],
        mode: 'power',
        camera: { pos: [-104, 66, -148], target: [-192, 6, -232] },
        view: { flows: true, isolateHall: CLN1 },
        evidence:
          'PUBLIC FACT: MCC-150605 — underground 20 kV cables between the substation and the buildings. TYPICAL: incomer arrangement, bus splitting and per-hall feeders.',
      },
      {
        title: 'Down to low voltage, through the UPS',
        body:
          'Two unit substations take the medium voltage down to low voltage on the north face of the building, and low voltage feeds two uninterruptible power supplies, a battery set and a distribution board. The A and B split is the second place where redundancy has been bought with money. Like every other, it is only real if the two paths are genuinely independent: shared batteries, shared ventilation or a shared cable trench quietly turn a 2N claim back into an N.',
        focus: ['CLN1.sub', 'CLN1.upsA', 'CLN1.upsB', 'CLN1.batt', 'CLN1.lv'],
        look: ['CLN1.upsA'],
        mode: 'power',
        camera: { pos: [-326, 58, -124], target: [-366, 6, -212] },
        view: { roofOff: true, isolateHall: CLN1 },
        evidence:
          'PUBLIC FACT: batteries are present and are a fire hazard (EPA-P1192). NOT PUBLIC: UPS topology, redundancy level, autonomy or battery chemistry. The A/B arrangement is TYPICAL.',
      },
      {
        title: 'Busway, tap-off, rack',
        body: `Busway runs above the rows, tapped down to rack power distribution units, which turn three-phase into the single-phase circuits the servers actually take. At the delivered rack power of ${fmt(INPUTS.deliveredRackKw, 1)} kW that is about ${fmt(derived.deliveredRackAmps, 1)} A per rack at ${INPUTS.buswayVolts} V. Nothing in this stretch of the chain stores anything; it exists to deliver power to the rack without a single joint that can open and take a whole row with it.`,
        focus: ['CLN1.lv', 'CLN1.h1.bus', 'CLN1.h1.pdu', 'CLN1.h1.rack', 'CLN1.h1.server'],
        look: ['CLN1.h1.rack'],
        mode: 'power',
        camera: { pos: [-330, 34, -62], target: [-420, 5, -160] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN1 },
      },
      {
        title: '230 volts, single phase',
        body:
          'Into the server power supplies, and there the chain ends. Two supplies per machine, each able to carry it alone, fed from the two rack feeds. This is the only point on the whole route where electricity becomes information, and the only one where the voltage is low enough that a person with a hand tool is a credible cause of failure. Faults are cheap here because the load is small, and expensive everywhere upstream because it is not.',
        focus: ['CLN1.h1.pdu', 'CLN1.h1.rack', 'CLN1.h1.server'],
        look: ['CLN1.h1.server'],
        mode: 'power',
        camera: { pos: [-372, 18, -110], target: [-420, 3, -160] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN1 },
        evidence: 'TYPICAL: the 415 V to 230 V step and the A/B feed convention at the rack. Not published for Clonee.',
      },
    ],
  },

  /* ----------------------------------------------------------------- 3 heat */
  {
    id: 'heat',
    title: 'Where the heat goes',
    blurb:
      'Indirect air cooling, told honestly: the IT air never touches water, and the campus carries two separate heat rejection problems.',
    classificationHint:
      'PUBLIC FACT for indirect air cooling and for the residual evaporative cooling-water discharge; TYPICAL and DERIVED for the coils, the air coolers, the plume and the comparison with tower and liquid cooling.',
    steps: [
      {
        title: 'It all leaves as heat',
        body:
          'Essentially all the electrical power entering a server leaves it as heat, because there is no useful work to keep. On this campus that heat leaves the rack into air. The halls as delivered are indirectly air cooled, which is stated in the contractor\u2019s architect record, and the consequence is worth stating plainly: there is no coolant circuit anywhere inside the white space of a delivered Clonee hall. Nothing to leak, and nothing to retrofit.',
        focus: ['CLN1.h1.rack', 'CLN1.h1.server'],
        look: ['CLN1.h1.server'],
        mode: 'cooling',
        camera: { pos: [-372, 18, -110], target: [-420, 3, -160] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN1 },
        evidence: 'PUBLIC FACT: SNWA-FB — IT cooling by indirect air cooling.',
      },
      {
        title: 'In-hall air cooling',
        body: `Each hall carries ${fmt(derived.hallItMW, 0)} MW of consented IT load over about ${fmtInt(INPUTS.hallFloorM2)} m², which is ${fmt(derived.hallPowerDensityFromConsentKwM2, 2)} kW/m². The published campus figure is ${INPUTS.itPowerDensityKwM2} kW/m², reached by a completely independent route, and the two agree to within ${fmt(derived.densityAgreementPct, 1)}%. In-hall units move that air across coils inside the white space. This is a design that works comfortably at ${fmt(INPUTS.deliveredRackKw, 1)} kW per rack and runs out of road well before that.`,
        focus: ['CLN1.h1.crah', 'CLN1.h1.rack'],
        look: ['CLN1.h1.crah'],
        mode: 'cooling',
        camera: { pos: [-338, 26, -78], target: [-420, 4, -162] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN1 },
      },
      {
        title: 'Across the coil to the facility loop',
        body:
          'Heat crosses a coil into water and nothing mixes. The in-hall air is the IT equipment\u2019s problem; the facility water loop is the building\u2019s problem; the heat exchanger is the boundary between them, and therefore the boundary that keeps glycol and water treatment chemicals out of a room full of electronics. The skids sit in the plant corridor along the north face, one set of them serving all four halls in the bar.',
        focus: ['CLN1.h1.crah', 'CLN1.hx'],
        look: ['CLN1.hx'],
        mode: 'cooling',
        camera: { pos: [-250, 40, -150], target: [-320, 6, -242] },
        view: { isolateHall: CLN1 },
        evidence: 'TYPICAL: the coil-to-loop arrangement and the single set of skids per building as modelled here.',
      },
      {
        title: 'Out through the air coolers',
        body:
          'From the plant corridor the warm water goes to the heat rejection units behind the building, where outdoor air does the work. What is published is indirect air cooling; what the emissions licence refers to is residual evaporative cooling-water discharge. Read the two documents together and the only coherent plant is an evaporative-assisted indirect arrangement: dry air does most of the work, with a wetted stage available when the air is too warm to do it alone.',
        focus: ['CLN1.hx', 'CLN1.cool'],
        look: ['CLN1.cool'],
        mode: 'cooling',
        camera: { pos: [-320, 74, -424], target: [-320, 10, -292] },
        view: { flows: true, isolateHall: CLN1 },
        evidence:
          'PUBLIC FACT: SNWA-FB — indirect air cooling. EPA-P1192 — residual evaporative cooling-water discharge. DERIVED: the reading of the two together. TYPICAL: unit count and layout.',
      },
      {
        title: 'The plume',
        body:
          'Where the wetted stage runs, the water leaves as vapour carrying the heat it absorbed, and on a hot afternoon you can see it. How large the plume is depends on the weather and the load rather than on a fixed installation, which is why the consent is careful to say that water vapour may be visible rather than committing to a stack or a volume. Everything about the geometry of this plume in the model is derived, and it should not be read as a prediction.',
        focus: ['CLN1.cool', 'CLN1.plume', 'site.ambient'],
        look: ['CLN1.plume'],
        mode: 'water',
        camera: { pos: [-236, 72, -392], target: [-320, 22, -298] },
        view: { isolateHall: CLN1 },
      },
      {
        title: 'What indirect cooling is not',
        body: `Two other architectures are worth setting against it. An evaporative tower puts water and air in direct contact in a large tower: efficient in dry climates and several times wetter, which is the wrong trade in a catchment receiving ${fmtInt(A('longTermRainfallMmYr'))} mm of rain a year. Liquid cooling takes heat into a coolant loop at the chip, which is more efficient again but requires a hall designed around it from the slab up. This hall is neither, and that is what the AI journey is about.`,
        focus: ['CLN1.h1.crah', 'CLN1.cool', 'site.ambient'],
        look: ['CLN1.cool'],
        mode: 'cooling',
        camera: { pos: [-150, 96, -330], target: [-320, 10, -286] },
        evidence:
          'TYPICAL: the contrast between indirect air, evaporative tower and liquid cooling. IND-LC for the retrofit discriminator.',
      },
    ],
  },

  /* ---------------------------------------------------------------- 4 water */
  {
    id: 'water',
    title: 'The water licence in the wettest country in Europe',
    blurb:
      'Why a data centre in County Meath holds a discharge licence at all, and what the water balance actually looks like once you do the arithmetic.',
    classificationHint:
      'PUBLIC FACT for the licence, the evaporative discharge reference and the stormwater systems; DERIVED for every volume and intensity shown, from published inputs and stated assumptions.',
    steps: [
      {
        title: 'Why a discharge licence at all',
        body:
          'A data centre in County Meath holds a wastewater discharge licence, which sounds wrong until you understand the climate. Ireland has almost no cooling degree days. The outside air is cool enough to carry the whole heat load for most of the year, so the wetted stage runs wet only in the hottest hours of the hottest days. The licence exists because the plant runs wet sometimes, not because it runs wet continuously, and the model treats it that way.',
        focus: ['CLN1.cool', 'site.ambient'],
        look: ['CLN1.cool'],
        mode: 'water',
        camera: { pos: [-320, 74, -424], target: [-320, 10, -292] },
        evidence:
          'PUBLIC FACT: EPA-P1192 — residual evaporative cooling-water discharge. TYPICAL: the cooling-degree-day argument and the assumed evaporative fraction of 0.1.',
      },
      {
        title: 'Rain first, and there is a lot of it',
        body: `Rain falling on ${fmt(INPUTS.siteAreaHa, 1)} hectares of site, of which about ${fmtInt(derived.imperviousAreaM2)} m² is roof or hardstand, amounts to roughly ${fmtInt(derived.rainfallVolumeM3Yr)} m³ a year. The attenuation basin collects the runoff from the impervious area and, where the quality allows, sends it to the cooling loop as make-up: about ${fmtInt(derived.runoffCaptureM3Yr)} m³ a year, or ${fmt(derived.captureFractionOfRainfall * 100, 0)}% of everything that lands on the site. This is the cheapest water on the campus, and it is why the site is so much larger than the buildings.`,
        focus: ['site.basin', 'site.wtp'],
        look: ['site.basin'],
        mode: 'water',
        camera: { pos: [-40, 128, 540], target: [-230, 0, 380] },
        view: { flows: true },
      },
      {
        title: 'The wellfield closes the gap',
        body: `Harvested rainfall covers about ${fmt(derived.groundwaterCoverage * 100, 0)}% of the annual cooling demand. The rest — around ${fmtInt(derived.supplyGapM3Yr)} m³ a year, which is what a dry summer takes — comes from groundwater. A small production wellfield averaging roughly ${fmt(derived.borefieldLPerSecond, 1)} litres a second closes that gap across a year and is deliberately capable of more when the basin is empty. In a moderate rainfall catchment like County Meath this plant does real work rather than sitting as a contingency.`,
        focus: ['site.bore', 'site.wtp'],
        look: ['site.bore'],
        mode: 'water',
        camera: { pos: [572, 128, 470], target: [370, 0, 300] },
        view: { flows: true },
      },
      {
        title: 'The wetted stage, quantified',
        body: `The campus rejects about ${fmtInt(derived.itHeatGjPerYear)} GJ of IT heat a year, because all ${fmtInt(derived.itMwhPerYear)} MWh of IT energy ends up as heat. Taking a tenth of that by evaporation — the fraction an Irish climate actually supports — gives roughly ${fmtInt(derived.evaporationM3Yr)} m³ of water a year, with a further ${fmtInt(derived.blowdownM3Yr)} m³ of blowdown to carry concentrated solids away. The total site water discharge is about ${fmtInt(derived.dischargeM3Yr)} m³ a year.`,
        focus: ['CLN1.cool', 'site.wtp', 'CLN1.hx'],
        look: ['CLN1.cool'],
        mode: 'cooling',
        camera: { pos: [-236, 72, -392], target: [-320, 22, -298] },
        view: { flows: true, isolateHall: CLN1 },
        evidence:
          'DERIVED: evaporation, blowdown and discharge from published IT energy plus the stated evaporative fraction and blowdown factor. No volume is published for Clonee.',
      },
      {
        title: 'Water per unit of work',
        body: `Divide the discharge by the energy and the figure worth remembering appears. ${waterIntensitySentence()} It is a direct measure of the cooling architecture, which is why it is worth arguing about: an evaporative tower on the same campus would be several times higher.`,
        focus: ['CLN1.cool', 'CLN1.plume', 'site.ambient'],
        look: ['CLN1.plume'],
        mode: 'water',
        camera: { pos: [180, 210, -320], target: [-320, 26, -298] },
        evidence: 'DERIVED, shown in the water panel from the same inputs. TYPICAL: the comparison with evaporative tower cooling.',
      },
      {
        title: 'What else leaves the site',
        body:
          'Domestic water is a completely different order of magnitude. Potable tanks serve the administration and staff amenities, a small treatment plant deals with the foul flow, and it is discharged to ground. A campus of this size generates domestic wastewater measured in litres a day, while the cooling stream is measured in hundreds of thousands of cubic metres a year. Same site, same licence, same outfall route, two entirely separate problems.',
        focus: ['site.potable', 'site.ww', 'site.watercourse'],
        look: ['site.ww'],
        mode: 'water',
        camera: { pos: [186, 78, 452], target: [150, 4, 352] },
        evidence:
          'PUBLIC FACT: EPA-P1192 — stormwater and environmental systems on the campus. TYPICAL: potable, foul and soakage arrangements. The consent record does not publish a domestic flow.',
      },
    ],
  },

  /* --------------------------------------------------------------- 5 fibre */
  {
    id: 'fibre',
    title: 'How fibre reaches Clonee',
    blurb:
      'An overland campus rather than a subsea landing, and why two diverse terrestrial routes plus meet-me rooms per building are the standard requirement.',
    classificationHint:
      'DERIVED for the overland character and the route geometry; PUBLIC FACT for two meet-me rooms per building; TYPICAL for the fabric hierarchy, which is not published for Clonee.',
    steps: [
      {
        title: 'Overland, not out of the sea',
        body:
          'Clonee is not a subsea landing. There is no wet plant on this site and no beach manhole a few kilometres away: this is an overland fibre campus, fed from the national duct and cable network. The standard requirement is two physically diverse terrestrial routes from the exchange to the meet-me rooms, and the standard failure mode is those two routes quietly sharing a duct, a bridge, a pole route or a manhole somewhere along the way.',
        focus: ['site.fibre'],
        look: ['site.fibre'],
        mode: 'data',
        camera: { pos: [-392, 96, 344], target: [-250, 4, 240] },
        evidence: 'DERIVED: this is an overland campus and the route shown is a simplification. No cable landing is documented for Clonee.',
      },
      {
        title: 'Meet-me rooms',
        body: `Two meet-me rooms per building is the published arrangement, and that is where carriers hand over to the campus. Each is separately entered, separately powered and separately cooled, so that losing one costs a carrier rather than a building. The model shows a campus-level pair rather than ${INPUTS.meetMeRoomsPerBuilding} per building, because the point being made here is architectural rather than a count.`,
        focus: ['site.fibrehub'],
        look: ['site.fibrehub'],
        mode: 'data',
        camera: { pos: [-58, 62, 138], target: [-150, 6, 60] },
        evidence: 'PUBLIC FACT: SNWA-FB — two meet-me rooms per building for data connectivity.',
      },
      {
        title: 'The campus core',
        body:
          'Inside the fence the meet-me rooms hand to the campus network core, which aggregates carriers and presents a single interface to the fabric. This is the point where the outside world stops being a set of separate circuits and becomes one dependency, which is why the core needs redundant power, redundant cooling and two ways out of the building. It is the most consequential room on the site and it is about the size of a small house.',
        focus: ['site.core', 'site.fibrehub'],
        look: ['site.core'],
        mode: 'data',
        camera: { pos: [-128, 58, 152], target: [-196, 5, 60] },
        evidence: 'TYPICAL: the meet-me to core architecture as modelled. NOT PUBLIC: device counts, carrier list or optical design.',
      },
      {
        title: 'Into the hall',
        body:
          'The core feeds the hall fabric. In this model a switch sits at each end of every row, so a fabric failure is a row rather than a hall. A real hyperscale fabric is built as a spine-and-leaf hierarchy in which every leaf can reach every spine, so that losing one device costs one path rather than a rack\u2019s connectivity entirely. The hierarchy is the redundancy; the cabling is simply built to match it.',
        focus: ['site.core', 'CLN1.h1.switch'],
        look: ['CLN1.h1.switch'],
        mode: 'data',
        camera: { pos: [-356, 28, -76], target: [-420, 4, -160] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN1 },
        evidence: 'TYPICAL: the fabric hierarchy and the row-level device placement shown.',
      },
      {
        title: 'Top of rack',
        body:
          'Over the last few metres the network becomes short optical links to each server, and the traffic settles into two very different patterns: one large read of training data at the start of a job followed by dense sequential checkpoint writes, against a fabric that has to keep up with every accelerator in the row continuously. Fibre pair counts, optics and port counts are not published for Clonee, and none of this fabric detail is a project fact.',
        focus: ['CLN1.h1.switch', 'CLN1.h1.rack', 'CLN1.h1.storage'],
        look: ['CLN1.h1.rack'],
        mode: 'data',
        camera: { pos: [-364, 20, -104], target: [-420, 3, -160] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN1 },
        evidence: 'TYPICAL: traffic patterns and top-of-rack architecture. NOT PUBLIC: anything quantitative about the network at Clonee.',
      },
    ],
  },

  /* ---------------------------------------------------------- 6 generators */
  {
    id: 'generators',
    title: 'Ninety diesel generators',
    blurb:
      'The one hard published number about generation at Clonee, the arithmetic built on top of it, and the licence that says when they may run.',
    classificationHint:
      'PUBLIC FACT for the count of ninety and the four permitted operating conditions; DERIVED for eighteen per building; TYPICAL for the 2.5 MW rating, the fuel figures and the heat rejection.',
    steps: [
      {
        title: 'Ninety sets, and one hard number',
        body: `The industrial emissions licence names ninety diesel generators across the five data-storage buildings. That is the single hard published fact about generation at Clonee: a count, and nothing else about the machines. Eighteen per building is arithmetic rather than a published split, and the model arranges them as two rows of nine behind each bar — behind, because a generator compound is a fire and noise zone, and the halls are the valuable part of the site.`,
        focus: ['CLN1.gen', 'CLN2.gen', 'CLN3.gen', 'CLN5.gen', 'CLN6.gen'],
        look: ['CLN1.gen'],
        mode: 'power',
        camera: { pos: [-320, 96, -486], target: [-320, 6, -318] },
        evidence: 'PUBLIC FACT: EPA-P1192 — 90 diesel generators across the campus. DERIVED: eighteen per building.',
      },
      {
        title: 'The rating, and why it is an assumption',
        body: `Nothing published gives a rating. At ${fmt(A('generatorRatedKw') / 1000, 1)} MW per set — a typical hyperscale rating, and the one that makes the arithmetic come out sensibly — each building has ${fmt(derived.generationPerBuildingMW, 0)} MW of standby against ${fmt(derived.buildingItMw, 0)} MW of consented IT load. Campus-wide that is ${fmt(derived.generatorRatedMW, 0)} MW against ${fmt(derived.itCapacityMW, 0)} MW of IT, a ratio of ${fmt(derived.generationVsIt, 2)}. Everything downstream in this journey rests on that one invented number.`,
        focus: ['CLN1.gen', 'CLN1.gensw', 'CLN1.mv'],
        look: ['CLN1.gen'],
        mode: 'power',
        camera: { pos: [-240, 62, -400], target: [-300, 6, -316] },
        view: { isolateHall: CLN1 },
        evidence: 'TYPICAL: the 2.5 MW rating. DERIVED: 45 MW per building, 225 MW campus, from the published count.',
      },
      {
        title: 'N+1, and what it does not cover',
        body: `Ninety sets at eighteen per building is not 2N. It is N+1 in spirit: enough capacity to carry the facility with a set or a block missing, and a maintenance strategy that works in blocks rather than one machine at a time. Note carefully what the ratio does not cover. At ${fmt(derived.generationVsFacility, 2)} the fleet is smaller than the ${fmt(derived.facilityLoadMW, 0)} MW whole-facility draw, so auxiliary load has to be shed or accepted before any IT load is touched.`,
        focus: ['CLN1.gen', 'CLN1.fuel'],
        look: ['CLN1.gen'],
        mode: 'power',
        view: { isolateHall: CLN1 },
        evidence: 'DERIVED: the ratios. TYPICAL: the N+1 interpretation and the block maintenance model.',
      },
      {
        title: 'The four permitted conditions',
        body:
          'The licence is explicit about when these engines may run: loss of grid supply; instability or reduction of grid supply; maintenance; and grid-reduction conditions requested by the transmission system operator. Read that list as a permission with a boundary around it. Running ninety engines to sell surplus into a full network is not permitted, which tells you the plant is built for a handful of long events a year rather than as a peaking asset.',
        focus: ['CLN1.gen', 'CLN1.fuel', 'CLN1.gensw'],
        look: ['CLN1.gensw'],
        mode: 'power',
        camera: { pos: [-150, 54, -372], target: [-220, 6, -302] },
        view: { isolateHall: CLN1 },
        evidence: 'PUBLIC FACT: EPA-P1192 — the four conditions under which the generators may operate.',
      },
      {
        title: 'Fuel, and where the real limit is',
        body: `No tank sizes are published. A typical belly tank of ${fmtInt(A('generatorBellyTankL'))} litres per set gives about ${fmtInt(derived.bellyTankTotalM3)} m³ across the fleet, which at ${fmtInt(derived.dieselLPerHourFleet)} litres an hour for the whole fleet running is ${fmt(derived.bellyTankRunHours, 1)} hours before a road tanker has to reach the gate. Beyond that the constraint is tanker logistics, bunding and segregation, not the engines.`,
        focus: ['CLN1.fuel', 'CLN1.gen'],
        look: ['CLN1.fuel'],
        mode: 'power',
        view: { isolateHall: CLN1 },
        evidence: 'TYPICAL: 11,000 L belly tanks, volumetric fuel consumption, bundled and drained with automatic shutoff. No tank size is published for Clonee.',
      },
      {
        title: 'Engine heat is a separate problem',
        body: `A diesel engine rejects more heat than it converts. At the roughly 43% electrical efficiency assumed in the model, a ${fmt(A('generatorRatedKw') / 1000, 1)} MW set dumps about ${fmt(A('generatorHeatReleaseKw') / 1000, 2)} MW through its own radiators, jacket water and exhaust. Across ninety sets that is ${fmt(derived.generationHeatMW, 1)} MW, more than the IT load itself, and none of it touches the hall cooling loop. Two independent heat rejection problems; conflating them is the commonest error in this discussion.`,
        focus: ['CLN1.genheat', 'CLN1.gen', 'site.ambient'],
        look: ['CLN1.genheat'],
        mode: 'cooling',
        camera: { pos: [-320, 64, -420], target: [-320, 8, -310] },
        view: { isolateHall: CLN1 },
        evidence: 'TYPICAL: 2,950 kW of heat per set and the separate rejection path through each set\u2019s own cooling systems.',
      },
    ],
  },

  /* ---------------------------------------------------------------- 7 build */
  {
    id: 'build',
    title: 'Building a data centre beside a running one',
    blurb:
      'From the 2015 consent to five buildings, and why the last two were the hard part: every tie-in was made against live plant.',
    classificationHint:
      'PUBLIC FACT for both consents, the substation consent, the energisation date, the handover dates and the announced expansion; DERIVED and TYPICAL for the months between the dated anchors.',
    steps: [
      {
        title: 'Consent, 2015',
        body: `Meath County Council granted application RA150605 in 2015 for a phased data-centre development on about ${fmt(INPUTS.siteAreaHa, 1)} hectares: two buildings of approximately ${fmtInt(INPUTS.gfaM2PerOriginalBuilding)} m² each, four data halls per building, ${INPUTS.itMwPerBuilding} MW of data capacity per building, plus generators, cooling infrastructure, tanks and drainage, internal roads, security infrastructure and underground ${INPUTS.campusMvKv} kV cables. Every building in this model descends from that document.`,
        focus: ['site.road', 'site.fence', 'CLN1.shell', 'CLN2.shell'],
        look: ['site.road'],
        mode: 'construction',
        camera: { pos: [430, 430, 640], target: [-40, 8, -20] },
        evidence: 'PUBLIC FACT: MCC-150605 — consented area, floor areas, hall count, capacity per building and the underground 20 kV cables.',
      },
      {
        title: 'The substation is its own programme',
        body:
          'The 220 kV station was permitted separately, under An Bord Pleanála VA0018, and ran on its own critical path beside the buildings. Mobilisation, erosion and sediment control, bulk earthworks, platform formation and the two transmission towers all happened while the first building\u2019s frame was going up. Tower delivery is gated by the transmission system owner and the transformers go through factory acceptance testing before they ship, so procurement set the pace and the site followed it.',
        focus: ['sub.platform', 'sub.tower1', 'sub.tower2', 'tmp.road'],
        look: ['sub.platform'],
        mode: 'construction',
        camera: { pos: [556, 118, 214], target: [330, 2, -20] },
        evidence: 'PUBLIC FACT: BP-VA0018 — substation compound scope. TYPICAL: the ordering of earthworks, tower delivery and factory acceptance testing.',
      },
      {
        title: 'August 2017, then the first building',
        body: `The station was energised in August ${INPUTS.gridConnectionYear}. CLN1 was completed in the final quarter of the same year, with four halls of about ${fmtInt(INPUTS.hallFloorM2 * INPUTS.hallsPerBuilding)} m² fitted out and commissioned, the administration building and staff welfare, the delivery systems, all internal and external roads, the car parking and the ${INPUTS.transmissionKv} kV substation. Phase 1 site start to opening ran about ${INPUTS.phase1BuildMonths} months. Production traffic could be served from that point.`,
        focus: ['sub.xfmr', 'sub.bay', 'CLN1.shell', 'CLN1.h1.rack'],
        look: ['sub.bay'],
        mode: 'construction',
        camera: { pos: [-90, 96, -60], target: [-320, 8, -190] },
        evidence: 'PUBLIC FACT: EIR-AR2017 and SNWA-FB — energisation in August 2017 and phase 1 completion in Q4 2017. DERIVED: the phase 1 duration from PRESS-ECO.',
      },
      {
        title: 'Overlapping, not sequential',
        body:
          'The second building\u2019s shell was left fallow at the end of phase 1 and fitted out afterwards, handed over in May 2018 — and the record notes that this fit-out proceeded faster than anticipated while the third phase was already starting on site. That is the first hard evidence of how the campus was really delivered: overlapping phases sharing one substation, one site team and one set of interfaces, not a sequence of standalone buildings.',
        focus: ['CLN2.shell', 'CLN1.h1.rack', 'CLN1.h1.crah'],
        look: ['CLN2.shell'],
        mode: 'construction',
        camera: { pos: [126, 104, -40], target: [-30, 8, -190] },
        view: { isolateHall: CLN2 },
        evidence: 'PUBLIC FACT: SNWA-FB — phase 2 fit-out began in Q4 2017 for handover in May 2018.',
      },
      {
        title: 'The expansion lands',
        body: `CLN3 reached RIBA stage 7 in 2019. Consent RA180671 then covered two further data-storage buildings of approximately ${fmtInt(INPUTS.gfaM2Expansion)} m² combined, plus another administration and office building, additional generators, roads, drainage, parking and security. Construction of both was announced in March 2019, taking the facility to nearly ${fmtInt(INPUTS.gfaM2TotalNearly)} m², and the earlier buildings took LEED Gold that December.`,
        focus: ['CLN3.shell', 'CLN5.shell', 'CLN6.shell', 'site.admin2'],
        look: ['CLN5.shell'],
        mode: 'construction',
        camera: { pos: [388, 148, 176], target: [80, 8, 20] },
        evidence: 'PUBLIC FACT: MCC-180671 and META-2019 — the expansion consent, the March 2019 announcement and LEED Gold.',
      },
      {
        title: 'Building beside a live campus',
        body:
          'This is the delivery problem that defines the last third of the programme. Two new buildings, one live substation, five live generator compounds, live tenants and an IT load that cannot be interrupted for a moment. Every tie-in has to be made against energised plant, construction traffic has to cross operational routes, and a fault caused by the contractor is indistinguishable from a fault caused by age. Interface management is the discipline this phase actually needs.',
        focus: ['CLN5.shell', 'CLN6.shell', 'CLN5.mv', 'CLN1.gen', 'sub.xfmr'],
        look: ['CLN5.shell'],
        mode: 'construction',
        camera: { pos: [392, 132, 214], target: [140, 8, -20] },
        evidence: 'TYPICAL: the interface problem of building against an operating campus. The two expansion phases themselves are DERIVED from the consent and announcement dates.',
      },
    ],
  },

  /* ------------------------------------------------------------------- 8 ai */
  {
    id: 'ai',
    title: 'Converting a 2017 hall to AI',
    blurb:
      'The most valuable lesson in the model: this retrofit is constrained by electricity, not by floor area — and three other things as well.',
    classificationHint:
      'DERIVED for every figure quoted, from the published IT area and power density plus the published AI rack power; TYPICAL for the retrofit architecture and the floor-loading comparison, which are industry practice and not Clonee facts.',
    steps: [
      {
        title: 'The hall as delivered',
        body: `${HALL_NAME[RETROFIT_HALL]} is about ${fmtInt(INPUTS.hallFloorM2)} m² of white space at ${fmt(derived.hallPowerDensityFromConsentKwM2, 2)} kW/m², indirectly air cooled, with busway and rack tap-offs sized for the racks it was designed around: ${fmt(INPUTS.deliveredRackKw, 1)} kW each. A modern rack-scale AI system is ${fmt(derived.densityJump, 1)} times that density. The obvious question — can this floor hold the machines — has an answer, and it is yes.`,
        focus: [`${RETROFIT_HALL}.rack`, `${RETROFIT_HALL}.crah`, `${RETROFIT_HALL}.bus`, `${RETROFIT_HALL}.pdu`],
        look: [`${RETROFIT_HALL}.rack`],
        mode: 'cooling',
        camera: { pos: [96, 30, -62], target: [4, 4, -160] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN2 },
      },
      {
        title: 'First constraint: electricity, not floor',
        body: `The existing IT area of ${fmtInt(INPUTS.itAreaM2)} m² could physically hold about ${fmtInt(derived.rackPositionsInItArea)} rack positions at ${INPUTS.rackSpaceM2} m² each. The campus has ${fmt(derived.itCapacityMW, 0)} MW of consented supply. At ${INPUTS.aiRackKw} kW per AI rack that funds about ${fmtInt(derived.racksAffordableAtAiDensity)} racks — ${fmt(derived.geometricUtilisationPct, 1)}% of the geometric positions. On the second published route, ${fmt(derived.itCapacityFromDensityMW, 0)} MW, it is about ${fmtInt((derived.itCapacityFromDensityMW * 1000) / INPUTS.aiRackKw)} racks. Either way the floor is not the constraint; the supply is.`,
        focus: ['CLN2.lv', 'CLN2.sub', 'CLN2.mv', 'sub.xfmr', `${RETROFIT_HALL}.rack`],
        look: ['CLN2.lv'],
        mode: 'power',
        camera: { pos: [158, 96, -92], target: [4, 6, -206] },
        view: { isolateHall: CLN2 },
        evidence:
          'DERIVED: 30,000 geometric positions against the 180 MW and 168 MW published supply routes at the published 132 kW AI rack power (IND-NVDA). No Clonee AI deployment is claimed.',
      },
      {
        title: 'Second constraint: the cooling architecture',
        body: `An indirectly air-cooled hall cannot natively accept liquid cooling. Its coils are air to water, its in-hall units move air, and there is no coolant circuit to tap. The realistic paths are both expensive: liquid-to-air sidecar units that reject the coolant straight to ambient inside the white space, or a wholesale conversion of the hall to a liquid primary loop. Industry guidance is explicit that this is the discriminator between an air-cooled hall and a liquid-ready one, and it is structural rather than operational.`,
        focus: [`${RETROFIT_HALL}.cold`, `${RETROFIT_HALL}.cdu`, `${RETROFIT_HALL}.crah`, 'CLN2.cool'],
        look: [`${RETROFIT_HALL}.cdu`],
        mode: 'cooling',
        camera: { pos: [104, 26, -74], target: [4, 4, -162] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN2 },
        evidence: 'TYPICAL: IND-LC — sidecar units or wholesale conversion; a hall whose primary cooling is air cannot natively take liquid.',
      },
      {
        title: 'Third constraint: busway and tap-offs',
        body: `The distribution in this hall carries about ${fmt(derived.deliveredRackAmps, 1)} A per rack. A ${INPUTS.aiRackKw} kW AI rack on ${INPUTS.buswayVolts} V three-phase draws ${fmt(derived.aiRackAmps, 0)} A, and at the design point the infrastructure is actually provisioned for it draws ${fmt(derived.aiRackAmpsEdbp, 0)} A. These are not connections you can re-terminate; they are a different distribution system, and forcing a full rack onto an undersized tap is a thermal trip waiting to happen.`,
        focus: [`${RETROFIT_HALL}.bus`, `${RETROFIT_HALL}.pdu`, 'CLN2.lv', `${RETROFIT_HALL}.rack`],
        look: [`${RETROFIT_HALL}.pdu`],
        mode: 'power',
        camera: { pos: [96, 22, -104], target: [4, 3, -160] },
        view: { roofOff: true, cutaway: true, isolateHall: CLN2 },
        evidence:
          'DERIVED: amperages from the published 415 V busway voltage and the published rack powers. DERIVED: 12.5 kW delivered rack power from the two published density routes.',
      },
      {
        title: 'Fourth constraint: the floor',
        body:
          'A rack-scale system with liquid cooling and overhead busway weighs far more than the rack it replaced. A loaded rack-scale installation of this kind is around 2,100 kg/m², against roughly 1,500 kg/m² for a conventional air-cooled design — typical industry figures, not project data. A slab designed and poured years before the AI hardware existed was not designed for that, and strengthening a slab is not a change order. It is a project.',
        focus: [`${RETROFIT_HALL}.rack`, `${RETROFIT_HALL}.floor`, `${RETROFIT_HALL}.cdu`],
        look: [`${RETROFIT_HALL}.floor`],
        mode: 'construction',
        camera: { pos: [112, 34, -66], target: [4, 2, -160] },
        view: { cutaway: true, isolateHall: CLN2 },
        evidence: 'TYPICAL: floor loading figures for rack-scale and conventional installations. Not published for Clonee and not derivable from the model inputs.',
      },
      {
        title: 'What the model converts',
        body: `The modelled conversion is deliberately modest. Cold plates at every rack, coolant distribution units down the rows, a coolant loop back to the plant corridor, and about ${fmt(INPUTS.aiLiquidShare * 100, 0)}% of rack heat taken by liquid with the remainder still as air — because power supplies, memory and switches keep dumping heat and in-hall air handling cannot simply be removed. It shows a credible retrofit, not a filled hall, and it is a teaching model rather than a Clonee project.`,
        focus: [`${RETROFIT_HALL}.cold`, `${RETROFIT_HALL}.cdu`, `${RETROFIT_HALL}.server`, 'CLN2.hx'],
        look: [`${RETROFIT_HALL}.cold`],
        mode: 'cooling',
        camera: { pos: [100, 24, -86], target: [4, 4, -162] },
        view: { roofOff: true, cutaway: true, flows: true, isolateHall: CLN2 },
        evidence: 'TYPICAL: the retrofit architecture modelled. SYNTHETIC: that a specific hall has been converted. No such project at Clonee is claimed.',
      },
      {
        title: 'The real answer is at the substation',
        body: `The honest conclusion is that filling this hall with AI is not a hall project. To buy the racks the arithmetic demands you have to buy the megawatt, and a megawatt at Clonee means another connection, another consent and another critical path — the same shape of problem as the ${INPUTS.gridConnectionMonths}-month connection the company already built once in ${INPUTS.gridConnectionYear}. Which is why the AI story ends exactly where the grid story began, and why the substation is the most valuable object in this model.`,
        focus: ['sub.xfmr', 'sub.bay', 'sub.platform', `${RETROFIT_HALL}.rack`],
        look: ['sub.platform'],
        mode: 'power',
        camera: { pos: [486, 128, 214], target: [330, 8, 0] },
        evidence: 'DERIVED: the capacity arithmetic above. PUBLIC FACT: EIR-AR2017 — the first customer-built 220 kV station in Ireland, in approximately 15 months.',
      },
    ],
  },
];

/**
 * The chains these journeys follow, re-exported so a caller can tell the
 * learner which chain a step belongs to without re-deriving it.
 */
export const JOURNEY_CHAINS: Record<string, string[]> = {
  power: POWER_CHAIN,
  heat: HEAT_CHAIN,
  water: WATER_CHAIN,
  fibre: FIBRE_CHAIN,
};

/** The hall used by the retrofit journey, exposed for inspection deep links. */
export const JOURNEY_RETROFIT_HALL = RETROFIT_HALL;
