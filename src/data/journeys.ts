import type { SystemKey } from './types';
import { waterIntensitySentence } from './calculations';

export interface JourneyStep {
  title: string;
  body: string;
  /** component ids to highlight; everything else dims */
  focus: string[];
  /** component ids to focus the camera on (average position) */
  look: string[];
  mode: SystemKey | 'overview' | 'construction' | 'commissioning' | 'resilience';
  camera?: { pos: [number, number, number]; target: [number, number, number] };
  /** UI hints applied for the step */
  view?: {
    roofOff?: boolean;
    cutaway?: boolean;
    explode?: number;
    isolateHall?: number | null;
    labels?: boolean;
    flows?: boolean;
    follow?: 'grid' | 'heat' | 'fibre' | null;
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

export const JOURNEYS: Journey[] = [
  {
    id: 'electrons',
    title: 'How does electricity reach a GPU?',
    blurb: 'Follow one unbroken path from the transmission corridor to a single accelerator.',
    classificationHint:
      'PUBLIC FACT that a dedicated HV connection and 84 sets of 3.2 MW exist. TYPICAL for every voltage step between the substation and the rack — the public record stops at "substation" and "switchgear".',
    steps: [
      {
        title: 'Start at the transmission corridor',
        body: 'Four high-voltage circuits cross the north-east of the site, plus a 33 kV distribution line through the middle. The campus does not generate its own power; it consumes a very large amount of it.',
        focus: ['hv.line'],
        look: ['hv.line'],
        mode: 'power',
        camera: { pos: [640, 300, -520], target: [300, 20, -260] },
        evidence: 'PUBLIC FACT: circuit presence and location are documented; ratings and protection settings are not.',
      },
      {
        title: 'The grid exit point',
        body: 'A dedicated GXP in the north-east: a crushed-rock platform, transformers, switchyard bays, gantries and a control building, inside a 2.5 m fence. This is where the campus stops being a customer of the network and becomes part of it.',
        focus: ['gxp.platform', 'gxp.xfmr', 'gxp.bay', 'gxp.ctrl'],
        look: ['gxp.xfmr'],
        mode: 'power',
        camera: { pos: [520, 190, -320], target: [300, 12, -140] },
        evidence: 'PUBLIC FACT: ~4 ha, buildings under 10 m, gantries to 24 m, 50 m towers. NOT PUBLIC: transformer ratings, count, or switching scheme.',
      },
      {
        title: 'High voltage becomes medium voltage',
        body: 'The transformers step transmission voltage down to the campus MV level. They do not create energy — they trade voltage for current, and about 1% of what passes through leaves as heat in the transformer itself.',
        focus: ['gxp.xfmr', 'gxp.bay'],
        look: ['gxp.xfmr'],
        mode: 'power',
        view: { flows: true },
        evidence: 'TYPICAL: the voltage step shown. The project publishes that transformers exist, not what they are rated at.',
      },
      {
        title: 'MV distribution to the modules',
        body: 'Campus MV switchgear splits the supply into per-module lineups and then per-hall feeders. Every feeder needs to be measurable and switchable, because this is where load gets shed when generation is short.',
        focus: ['M1.mv', 'M2.mv', 'M3.mv'],
        look: ['M1.mv'],
        mode: 'power',
        camera: { pos: [-40, 300, 330], target: [-49, 8, 60] },
        evidence: 'TYPICAL: dual incomer with split bus sections. The public record confirms the campus has its own electrical services, not the topology.',
      },
      {
        title: 'Unit substations, then UPS',
        body: 'Each hall has its own MV-to-LV transformers, so a failure affects one hall rather than the campus. The LV then feeds the UPS, which is the only thing between a grid disturbance and a crashed server.',
        focus: ['M1-W.sub', 'M1-W.upsA', 'M1-W.upsB', 'M1-W.batt'],
        look: ['M1-W.upsA'],
        mode: 'power',
        camera: { pos: [-180, 90, -30], target: [-306, 8, -20] },
        view: { roofOff: true, cutaway: true },
        evidence: 'NOT PUBLIC: UPS topology, redundancy and autonomy. The A/B pair shown is TYPICAL.',
      },
      {
        title: 'Busway, PDU, rack, server',
        body: 'Busway runs above the aisles. Rack PDUs convert three-phase into the single-phase circuits servers actually take — normally two, A and B, each able to carry the rack alone. Then it is just current into a power supply, and the power supply turns it into heat.',
        focus: ['M1-W.bus', 'M1-W.pdu', 'M1-W.rack', 'M1-W.gpu'],
        look: ['M1-W.rack'],
        mode: 'power',
        camera: { pos: [-280, 42, -70], target: [-306, 6, -8] },
        view: { roofOff: true, cutaway: true, follow: 'grid' },
        evidence: 'TYPICAL: the 400/415 V to 230 V step and the A/B feed convention. Rack-level power design is not public.',
      },
      {
        title: 'Where the electricity went',
        body: 'Everything that entered the rack leaves as heat, minus a few per cent of conversion losses in the power supplies. The next journey follows that heat.',
        focus: ['M1-W.gpu', 'M1-W.cold'],
        look: ['M1-W.gpu'],
        mode: 'cooling',
        camera: { pos: [-250, 50, -60], target: [-306, 5, -8] },
        view: { roofOff: true, cutaway: true, follow: 'heat' },
      },
    ],
  },
  {
    id: 'generators',
    title: 'Why does a data centre need 84 generators?',
    blurb: 'Work the arithmetic on a public number and see where the margin really goes.',
    classificationHint:
      'PUBLIC FACT: 84 sets, 3,200 kWe each, six blocks of 14, 3.2 MW of rated capacity each. The reasoning below is TYPICAL engineering interpretation.',
    steps: [
      {
        title: 'Six blocks of fourteen',
        body: 'Generators sit in blocks inside the module rectangles, adjacent to the halls, with the halls acting as noise screens. Refuelling is by tanker on the internal roads, tank by tank.',
        focus: ['M1-W.gen', 'M1-W.fuel', 'M1-E.gen'],
        look: ['M1-W.gen'],
        mode: 'power',
        camera: { pos: [-245, 150, 240], target: [-245, 6, 0] },
        evidence: 'PUBLIC FACT: 84 sets in six blocks of 14; 10,000 L belly tank each; individually refuelled; bundled with full-retention separators and automatic shutoff.',
      },
      {
        title: 'The arithmetic',
        body: '84 x 3,200 kW = 268.8 MW of rated generation. The consented IT capacity is up to 240 MW. So the fleet is only about 1.1x the IT load — and the mechanical plant, lighting and controls have to be fed from the same fleet.',
        focus: ['gxp.xfmr', 'M1.mv'],
        look: ['M1.mv'],
        mode: 'power',
        camera: { pos: [-245, 320, 420], target: [-245, 6, 30] },
        evidence: 'SIMPLIFIED arithmetic on PUBLIC FACT inputs. It is a legitimate check, and it is not a redundancy margin you can bank on.',
      },
      {
        title: 'Why not 2N on generation?',
        body: 'Because 2N on 240 MW would mean roughly 480 MW of generation. Industry experience is that a very large standby fleet brings its own failure modes: more machinery, more starting reliability risk, more controls to fail, more of the plant held out for maintenance at any moment.',
        focus: ['M1-W.gen'],
        look: ['M1-W.gen'],
        mode: 'resilience',
        evidence: 'TYPICAL: the trade-off is well documented in industry generator-plant studies, but no such study is public for this project.',
      },
      {
        title: 'So what carries the margin?',
        body: 'Several things at once: block architecture with a defined allocation, staged starts, tested step-load acceptance, an explicit priority-based shed sequence, and maintenance done in blocks with the fleet temporarily de-rated. This is a maintenance and operations problem as much as a design problem.',
        focus: ['M1-W.gen', 'M1.mv', 'M1-W.upsA'],
        look: ['M1-W.gen', 'M1.mv'],
        mode: 'power',
        evidence: 'NOT PUBLIC: the actual redundancy architecture, block allocation, step-load criteria or fuel autonomy.',
      },
      {
        title: 'And the heat',
        body: 'Each set releases about 5.3 MW of heat - 445 MW across the fleet, nearly twice the IT load. But that heat does not go through the data centre cooling plant. Each set rejects it through its own radiators, jacket-water coolers, aftercoolers and exhaust, straight to ambient air. The campus has two separate heat rejection problems and it is easy to conflate them.',
        focus: ['M1-W.gen', 'M1-W.genheat', 'site.ambient'],
        look: ['M1-W.genheat'],
        mode: 'cooling',
        camera: { pos: [-245, 95, -215], target: [-245, 6, -60] },
        evidence: 'PUBLIC FACT: 5.3 MW heat per set, 445.2 MW total. TYPICAL: how that heat is actually rejected, and that it is independent of the IT cooling loop.',
      },
    ],
  },
  {
    id: 'gridfail',
    title: 'What happens when grid power fails?',
    blurb: 'Run the emergency sequence, stage by stage, on the model.',
    classificationHint:
      'The sequence is TYPICAL industry practice. The timing bands are illustrative, not specification values, and no acceptance criterion is invented here.',
    steps: [
      {
        title: 'Normal utility supply',
        body: 'Grid carries everything. Generators on standby, batteries maintained, fuel topped up, coolant systems pre-circulating. Use the animated sequence in the panel to step through the event.',
        focus: ['hv.line', 'gxp.xfmr', 'M1.mv', 'M1-W.gen'],
        look: ['M1-W.gen'],
        mode: 'power',
        camera: { pos: [120, 380, 520], target: [-60, 8, 0] },
      },
      {
        title: 'The grid opens',
        body: 'Protection clears the fault and the campus is islanded with no source. Everything now depends on what is stored on site.',
        focus: ['hv.line', 'gxp.bay'],
        look: ['gxp.bay'],
        mode: 'power',
        camera: { pos: [520, 220, -260], target: [300, 12, -140] },
      },
      {
        title: 'The UPS buys time',
        body: 'The inverter keeps the IT supply inside tolerance with no input at all. This ride-through is the number the whole emergency design is built around: it must exceed generator start plus synchronisation plus transfer, with margin.',
        focus: ['M1-W.upsA', 'M1-W.batt'],
        look: ['M1-W.upsA'],
        mode: 'power',
        camera: { pos: [-210, 80, -10], target: [-290, 8, -20] },
        view: { roofOff: true },
        evidence: 'NOT PUBLIC: autonomy time. Do not accept a number that has not been tested on load banks.',
      },
      {
        title: 'Generators start, in sequence',
        body: 'Staged starts, not a thundering herd. Each engine accelerates, catches, builds voltage and frequency, then closes onto the emergency bus.',
        focus: ['M1-W.gen', 'M2-E.gen', 'M3-W.gen'],
        look: ['M1-W.gen'],
        mode: 'power',
        camera: { pos: [-245, 200, 320], target: [-245, 6, 0] },
      },
      {
        title: 'Transfer, then restart the plant',
        body: 'Critical load transfers to generation, UPS batteries start recharging, and mechanical plant restarts in an ordered sequence — cooling for live halls first.',
        focus: ['M1.mv', 'M1.cool', 'M1.hx'],
        look: ['M1.cool'],
        mode: 'cooling',
        camera: { pos: [-245, 170, -230], target: [-245, 8, -100] },
      },
      {
        title: 'Utility restored, deliberately',
        body: 'Returning to a network that has just failed is a decision, not an event. Some operators wait for a defined period of stability. Generators then cool, run unloaded, stop and return to standby.',
        focus: ['gxp.bay', 'gxp.xfmr'],
        look: ['gxp.xfmr'],
        mode: 'power',
        camera: { pos: [520, 200, -300], target: [300, 12, -140] },
      },
    ],
  },
  {
    id: 'heat',
    title: 'Where does the heat from AI computing go?',
    blurb: 'Start inside a silicon package and follow the energy all the way out of the building.',
    classificationHint:
      'PUBLIC FACT: water-glycol cold plates carry 70-80% of the heat, the remainder leaves as hot air, and the warmed liquid is cooled by outdoor air over a sprayed membrane down to 15-20 C. Everything in between the hall and the plant is TYPICAL.',
    steps: [
      {
        title: 'It starts in the silicon',
        body: 'An AI accelerator is roughly 1 kW of electrical power in a package a couple of centimetres across. Almost none of that energy becomes useful computation — nearly all of it is heat that has to be carried off the die.',
        focus: ['M1-W.gpu'],
        look: ['M1-W.gpu'],
        mode: 'cooling',
        camera: { pos: [-280, 26, -34], target: [-306, 4, -8] },
        view: { roofOff: true, cutaway: true, follow: 'heat' },
        evidence: 'TYPICAL: the 1 kW-class die figure is an industry reference point for current accelerators, not a project figure.',
      },
      {
        title: 'Cold plate',
        body: 'A copper plate with channels inside is clamped to the die. Coolant runs through it and the heat leaves the silicon by conduction into water rather than by convection into air. Public documents put this at 70-80% of the heat for this facility.',
        focus: ['M1-W.cold', 'M1-W.gpu'],
        look: ['M1-W.cold'],
        mode: 'cooling',
        camera: { pos: [-292, 18, -30], target: [-306, 3, -8] },
        view: { roofOff: true, cutaway: true, follow: 'heat' },
        evidence: 'PUBLIC FACT: 70-80% of heat via water-glycol plates on the accelerators.',
      },
      {
        title: 'Rack manifold, then the CDU',
        body: 'Warm coolant returns from the rack to a coolant distribution unit. The CDU is the membrane between clean technology coolant and building water: a heat exchanger, redundant pumps, filtration, leak detection and a control loop holding supply temperature above the room dew point.',
        focus: ['M1-W.cold', 'M1-W.cdu'],
        look: ['M1-W.cdu'],
        mode: 'cooling',
        camera: { pos: [-240, 40, -60], target: [-305, 4, -10] },
        view: { roofOff: true, cutaway: true, follow: 'heat' },
        evidence: 'TYPICAL: whether CDUs are used and how they are arranged is not public. The dew-point rule and the two-loop separation are industry practice.',
      },
      {
        title: 'The rest of the heat is air',
        body: 'Power supplies, memory, drives and switchgear still dump heat into air. In-row air handling takes that, because air cooling stops being viable as a primary path somewhere around 50 kW per rack.',
        focus: ['M1-W.crah', 'M1-W.switch'],
        look: ['M1-W.crah'],
        mode: 'cooling',
        view: { roofOff: true, cutaway: true, follow: 'heat' },
        evidence: 'PUBLIC FACT: the remaining heat is captured as hot air and handled by a secondary liquid heat exchanger. NOT PUBLIC: whether CRAH-type units are used.',
      },
      {
        title: 'Into the facility water loop',
        body: 'Both streams meet heat exchanger skids inside the module. Nothing mixes: the loops exchange heat across a plate.',
        focus: ['M1.hx', 'M1-W.cdu', 'M1-W.crah'],
        look: ['M1.hx'],
        mode: 'cooling',
        camera: { pos: [-245, 90, 210], target: [-245, 8, 92] },
        view: { follow: 'heat' },
      },
      {
        title: 'Out through the evaporative units',
        body: 'Public documents describe the final stage: outdoor air drawn over a membrane sprayed with water, evaporation pulling the liquid down to 15-20 C, then recirculation. The water leaves as vapour — which is why the consent decision records that water vapour may be visible near the site.',
        focus: ['M1.cool', 'site.wtp'],
        look: ['M1.cool'],
        mode: 'cooling',
        camera: { pos: [-245, 120, -240], target: [-245, 10, -118] },
        view: { follow: 'heat' },
        evidence: 'PUBLIC FACT: adiabatic cooling, membrane spray, 15-20 C, recirculation, water treatment for legionella, algae and scale. NOT PUBLIC: unit count, airflow, staging or redundancy.',
      },
    ],
  },
  {
    id: 'water',
    title: 'Why does a data centre need water?',
    blurb: 'Make the water balance legible instead of drawing blue pipes.',
    classificationHint:
      'PUBLIC FACT for every quantity shown: 288,000 m3/yr demand, 75,000 m3 storage, 75,000 m3/yr captured, 7 L/s take, 157,000 m3/yr recharge, 150 m3 potable, 5,000 L/day wastewater. Blowdown is not published and is labelled TYPICAL.',
    steps: [
      {
        title: 'Where water comes in',
        body: 'Rain onto about 95,000 m2 of roof and hardstand, captured at roughly 75,000 m3 a year — about 13% of the site rainfall. The rest of the balance is groundwater from a bore field, used only when the tanks are not refilled by rain.',
        focus: ['site.bore', 'M1-W.res', 'M1-E.res'],
        look: ['site.bore'],
        mode: 'water',
        camera: { pos: [-520, 220, 120], target: [-300, 0, 40] },
        evidence: 'PUBLIC FACT: capture areas and volumes; 7 L/s, 604,800 L/day, 220,752,000 L/yr consented take.',
      },
      {
        title: 'Storage under the buildings',
        body: 'About 75,000 m3 in sealed reservoirs 1.5-2.0 m below ground level beneath the halls — roughly 1.5 months of contingency, and a wet winter can be banked for a dry summer.',
        focus: ['M1-W.res', 'M2-E.res'],
        look: ['M1-W.res'],
        mode: 'water',
        camera: { pos: [-180, 120, -40], target: [-306, -3, 0] },
        view: { explode: 0.35 },
        evidence: 'PUBLIC FACT: volume, depth, sealed against groundwater, uplift is a building-consent issue.',
      },
      {
        title: 'Most of it becomes vapour',
        body: 'The plant is evaporative, so the demand is largely water turned into vapour carrying heat away. That makes water-per-unit-of-compute a direct measure of the cooling architecture.',
        focus: ['M1.cool'],
        look: ['M1.cool'],
        mode: 'water',
        camera: { pos: [-245, 100, -220], target: [-245, 12, -118] },
        evidence: `SIMPLIFIED arithmetic on published inputs: ${waterIntensitySentence()}`,
      },
      {
        title: 'Water treatment is a licence and a safety issue',
        body: 'Public documents are explicit that the water must be disinfected against legionella, algae and scale, and that chemicals are delivered on demand and injected in purpose-built plant rooms rather than stored in bulk. That is a safety control, not housekeeping.',
        focus: ['site.wtp', 'M1-W.res'],
        look: ['site.wtp'],
        mode: 'water',
        camera: { pos: [220, 120, 330], target: [120, 6, 232] },
      },
      {
        title: 'What leaves the site',
        body: 'The site does not simply discharge to the stream. Treated stormwater is recharged into the aquifer deliberately — around 157,000 m3 a year — because the groundwater regime supports a wetland to the south that the project has a consent obligation to protect.',
        focus: ['site.basin', 'site.wetland'],
        look: ['site.wetland'],
        mode: 'water',
        camera: { pos: [120, 200, 620], target: [20, 0, 400] },
        evidence: 'PUBLIC FACT: recharge volumes, wetland obligation, 1% AEP overtop flow path south.',
      },
      {
        title: 'And the small streams',
        body: 'Potable water is about 150 m3 of storage from 3,000 m2 of roof, and wastewater is up to 5,000 litres a day to a soakage field. Both are sized for a workforce of around 60 — three orders of magnitude smaller than the cooling stream, in the same campus.',
        focus: ['site.potable', 'site.ww'],
        look: ['site.potable'],
        mode: 'water',
        camera: { pos: [-120, 120, 400], target: [40, 4, 250] },
        evidence: 'PUBLIC FACT: 150 m3 tank; 5,000 L/day to land at 5 mm/day; 3,360 m2 soakage field including reserve.',
      },
    ],
  },
  {
    id: 'capacity',
    title: 'What does a 240 MW data centre actually mean?',
    blurb: 'Separate IT load from total demand from rating from plan value.',
    classificationHint:
      'PUBLIC FACT figures include 240 MW IT, 84 x 3,200 kWe generation and 445.2 MW of generator heat release. The module split in this model is SIMPLIFIED. Generator heat is rejected by the generator cooling systems, not by the IT cooling plant.',
    steps: [
      {
        title: '240 MW is the IT load',
        body: 'Consented capacity is the electrical load of servers, storage and network equipment. It is not the campus total. Cooling plant, fans, pumps, lighting and controls add to it, and the losses in every conversion stage sit on top.',
        focus: ['M1-W.gpu', 'M1-W.rack'],
        look: ['M1-W.gpu'],
        mode: 'power',
        camera: { pos: [-245, 330, 400], target: [-245, 6, 0] },
        evidence: 'PUBLIC FACT: 240 MW IT in the consent decision and application documents.',
      },
      {
        title: 'Another number is in circulation',
        body: 'A higher figure also circulates publicly. The documents do not reconcile the two, and this application deliberately does not pick one silently. Possible explanations include a total facility demand, a later planning figure, or a different definition of capacity.',
        focus: ['M1-W.gpu', 'M1.cool'],
        look: ['M1.cool'],
        mode: 'power',
        evidence: 'PUBLIC FACT that both numbers are public; the discrepancy is unresolved in the public record.',
      },
      {
        title: 'Six halls, three modules, six blocks',
        body: 'The physical count is public: six data halls across three modules, ~9.5 ha. Each hall is a self-contained electrical, cooling and network domain — a fault domain and a delivery module at the same time.',
        focus: ['M1-W.hall', 'M2-W.hall', 'M3-E.hall'],
        look: ['M2-W.hall'],
        mode: 'overview',
        camera: { pos: [520, 420, 700], target: [-49, 6, 0] },
        evidence: 'PUBLIC FACT: six halls, three modules, ~9.5 ha, ~8,210 m2 per hall in phase 1.',
      },
      {
        title: 'Where the heat rejection capacity comes from',
        body: 'Public fact: 5.3 MW of heat per generator, 445.2 MW across the fleet. The trap is assuming the IT cooling plant has to deal with it. It does not: the sets have their own radiators, jacket water, aftercoolers and exhaust. What the campus does need is for that engine heat to have somewhere to go - space, airflow and stack capacity - while the fleet runs.',
        focus: ['M1-W.gen', 'M1-W.genheat', 'site.ambient'],
        look: ['M1-W.genheat'],
        mode: 'cooling',
        camera: { pos: [-245, 170, 300], target: [-245, 8, 0] },
      },
    ],
  },
  {
    id: 'hall',
    title: 'How is a data hall constructed?',
    blurb: 'Walk one hall from ground to racks, and see what is cast into the slab.',
    classificationHint:
      'PUBLIC FACT for the footprint, height, phase split and roof-water capture. TYPICAL for the internal arrangement.',
    steps: [
      {
        title: 'It starts below the floor',
        body: 'Public fact: about 75,000 m3 of sealed cooling water storage sits in reservoirs 1.5-2.0 m below ground level beneath the buildings. The reservoir is cast and waterproofed before the hall above it exists, and the hall above it is designed around it.',
        focus: ['M1-W.res', 'M1-W.hall'],
        look: ['M1-W.res'],
        mode: 'construction',
        camera: { pos: [-160, 150, -80], target: [-306, -3, 0] },
        view: { explode: 0.6, roofOff: true },
        evidence: 'PUBLIC FACT: volume, depth, sealed, uplift is a building-consent issue.',
      },
      {
        title: 'Platform, slab, then frame',
        body: 'Bulk earthforms platforms and road corridors; imported aggregate builds subbase, foundations and the substation platform. Foundations and slabs follow, then the frame, then the envelope. Weather-tight is a real milestone because it unblocks every internal trade.',
        focus: ['M1-W.hall'],
        look: ['M1-W.hall'],
        mode: 'construction',
        camera: { pos: [-160, 130, -110], target: [-306, 6, 0] },
        view: { roofOff: true },
      },
      {
        title: 'Roof drainage is a water system',
        body: 'About 30,000 m2 of hall roof across the site is piped into the cooling water reservoirs. Roof, pipework and reservoir are one hydraulic system, and that single decision is why cooling water is cheap here.',
        focus: ['M1-W.hall', 'M1-W.res'],
        look: ['M1-W.res'],
        mode: 'construction',
        evidence: 'PUBLIC FACT: ~30,000 m2 of hall roof captured to the reservoirs.',
      },
      {
        title: 'Fitout order matters',
        body: 'Containment and cabling, then electrical containment, switchgear and UPS, then busway, then cooling distribution, then controls, then racks. A hall is commissioned and energised as a unit; it does not wait for the campus.',
        focus: ['M1-W.bus', 'M1-W.cdu', 'M1-W.rack', 'M1-W.upsA'],
        look: ['M1-W.rack'],
        mode: 'construction',
        camera: { pos: [-210, 80, -60], target: [-306, 5, 0] },
        view: { roofOff: true, cutaway: true },
      },
    ],
  },
  {
    id: 'commission',
    title: 'How do you commission a data centre?',
    blurb: 'See why the testing programme is longer than the equipment list suggests.',
    classificationHint:
      'TYPICAL commissioning practice, following the standard Level 1 to Level 5 structure. Durations in this application are SYNTHETIC and indicative; no real project programme is reproduced.',
    steps: [
      {
        title: 'Five levels, each a gate',
        body: 'Factory test, installation checks, pre-functional and energisation, functional performance, then integrated systems testing. Each level is signed off before the next begins, which is why a small defect at Level 1 stops everything behind it.',
        focus: ['gxp.xfmr', 'M1-W.upsA', 'M1.cool'],
        look: ['M1-W.upsA'],
        mode: 'commissioning',
        camera: { pos: [80, 380, 460], target: [-49, 8, 0] },
      },
      {
        title: 'You cannot test what you cannot load',
        body: 'There are no servers during commissioning, so the design load has to be manufactured: electrical load banks pull design kW and kVA, thermal load banks put heat into the white space. Testing at no load proves almost nothing.',
        focus: ['M1-W.rack', 'M1.cool'],
        look: ['M1-W.rack'],
        mode: 'commissioning',
        camera: { pos: [-230, 60, -40], target: [-306, 5, -8] },
        view: { roofOff: true, cutaway: true },
      },
      {
        title: 'Prove the seams, not just the parts',
        body: 'Every system can pass on its own and the facility can still fail. Integrated systems testing runs the whole plant at design load and then pulls the utility, fails a generator, a pump and a cooling unit, on purpose.',
        focus: ['M1-W.gen', 'M1.mv', 'M1-W.upsA', 'M1.cool', 'M1.pump'],
        look: ['M1.mv'],
        mode: 'commissioning',
        camera: { pos: [-245, 220, 320], target: [-245, 8, 0] },
      },
      {
        title: 'Evidence, not opinion',
        body: 'Every passed scenario is annotated with the load used to prove it, and every deficiency is tracked to closure. "IT did not crash" is not an acceptance result; a measured ride-through time against a written criterion is.',
        focus: ['M1-W.upsA', 'M1-W.batt'],
        look: ['M1-W.batt'],
        mode: 'commissioning',
        camera: { pos: [-250, 50, -10], target: [-306, 5, -20] },
        view: { roofOff: true },
      },
    ],
  },
  {
    id: 'fibre',
    title: 'How does fibre reach the servers?',
    blurb: 'From the sea bed to a top-of-rack switch, and what an AI workload actually does on arrival.',
    classificationHint:
      'PUBLIC FACT: a submarine cable from Australia, landfall at a southern beach, a landing station on site sized for up to three cables, two diverse terrestrial routes, and a ring topology. The fabric design is TYPICAL.',
    steps: [
      {
        title: 'It comes out of the ocean',
        body: 'A submarine cable from Australia makes landfall at a beach about 9 km from the campus. Public documents describe the bulkhead, beach manhole, ducting, and trenching to an exchange.',
        focus: ['site.fibre'],
        look: ['site.fibre'],
        mode: 'data',
        camera: { pos: [-560, 160, 420], target: [-292, 6, 232] },
        evidence: 'PUBLIC FACT: cable, landfall, bulkhead, manhole, trench to an exchange, two diverse routes onward.',
      },
      {
        title: 'Landing station',
        body: 'The onshore station on the campus site terminates the wet plant and hosts the dry plant — transponders and line systems — with its own power, cooling and security. It is sized to serve up to three cables, so losing one cable is survivable.',
        focus: ['site.landing'],
        look: ['site.landing'],
        mode: 'data',
        camera: { pos: [-430, 90, 300], target: [-292, 6, 232] },
        evidence: 'PUBLIC FACT: located on site, capable of serving up to three submarine cables.',
      },
      {
        title: 'Campus core, then the fabric',
        body: 'The core aggregates carriers and the campus fabric. Then a Clos-style hierarchy: spines in the core, leaves at the rack, every leaf seeing every spine. Redundancy is in the topology, and the cabling is built to match it.',
        focus: ['site.core', 'M1-W.switch'],
        look: ['site.core'],
        mode: 'data',
        camera: { pos: [-260, 90, 300], target: [-200, 4, 250] },
        evidence: 'TYPICAL fabric. NOT PUBLIC: device counts, port counts, or optical design.',
      },
      {
        title: 'Inside the row',
        body: 'Top-of-rack switches connect to servers over short optical links. A modern AI fabric is bandwidth-bound: the internal network can move more data per second than the accelerators can consume, which is why optics dominate both cost and failures.',
        focus: ['M1-W.switch', 'M1-W.rack', 'M1-W.gpu', 'M1-W.storage'],
        look: ['M1-W.rack'],
        mode: 'data',
        camera: { pos: [-280, 40, -50], target: [-306, 5, -8] },
        view: { roofOff: true, cutaway: true, follow: 'fibre' },
        evidence: 'TYPICAL. The distinction between compute, storage and networking as separate domains is industry practice.',
      },
    ],
  },
  {
    id: 'critical',
    title: 'What are the critical path systems?',
    blurb: 'The delivery view: what has to happen before a transformer can be energised.',
    classificationHint:
      'WBS codes, cost bands and durations are SYNTHETIC. Predecessor logic is TYPICAL project-controls practice for this kind of facility.',
    steps: [
      {
        title: 'Turn on the delivery layer',
        body: 'Every component now carries a WBS code, package, discipline, predecessor logic and an indicative cost band. All synthetic, all generic — no real project values are used.',
        focus: ['gxp.xfmr'],
        look: ['gxp.xfmr'],
        mode: 'overview',
        camera: { pos: [520, 200, -280], target: [300, 12, -140] },
      },
      {
        title: 'The long leads come first',
        body: 'Transformers, switchgear, UPS and major cooling units are ordered long before they are needed, because their manufacturing and shipping times exceed the site works they depend on. Procurement leads the programme; construction follows it.',
        focus: ['gxp.xfmr', 'M1-W.upsA', 'M1.cool'],
        look: ['M1.cool'],
        mode: 'construction',
        camera: { pos: [120, 300, -300], target: [0, 8, -60] },
      },
      {
        title: 'A transformer cannot be energised until a chain completes',
        body: 'Platform and drainage, then fence and access, then set down and jointing, then relay settings verified, then substation control energised, then the HV bays proved. Miss any link and the transformer sits as a very expensive box.',
        focus: ['gxp.platform', 'gxp.xfmr', 'gxp.bay', 'gxp.ctrl'],
        look: ['gxp.xfmr'],
        mode: 'construction',
        camera: { pos: [500, 160, -300], target: [300, 12, -140] },
      },
      {
        title: 'And the IT depends on all of it',
        body: 'A rack cannot be commissioned until the UPS feeding it has passed functional testing, which needs the substation energised, which needs the grid connection, which needs the tower work. One dependency chain from the sea bed and the transmission corridor to a server.',
        focus: ['M1-W.rack', 'M1-W.upsA', 'M1.mv', 'gxp.xfmr', 'hv.line'],
        look: ['M1-W.rack'],
        mode: 'construction',
        camera: { pos: [-250, 90, -30], target: [-300, 6, -10] },
        view: { roofOff: true, cutaway: true },
      },
    ],
  },
];