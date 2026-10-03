/**
 * Generic construction sequence for a hyperscale / AI data centre campus.
 *
 * The 30+ step brief is refined here into 36 phases with three deliberate
 * changes:
 *  1. Site establishment works (access, erosion control, earthworks) are pulled
 *     forward because public construction-management documentation for Southland
 *     campuses stages site establishment and earthworks ahead of buildings.
 *  2. Cooling water storage under the hall slabs sits with the foundations, not
 *     with the cooling package, because it is cast into the structure.
 *  3. Energisation, commissioning and phased handover are separated, because
 *     that is where a hyperscale project actually loses its time.
 *
 * Duration column is SYNTHETIC and indicative only. No real programme, date or
 * cost from any project is used.
 */

export interface Phase {
  index: number;
  id: string;
  name: string;
  detail: string;
  /** indicative relative duration, synthetic */
  months: number;
}

export const PHASES: Phase[] = [
  {
    index: 0,
    id: 'existing',
    name: 'Existing paddock',
    detail:
      'Flat grazed rural land, 14-18 m ASL, falling to about 9 m ASL at a terrace to the south. Four HV circuits and a 33 kV distribution line cross the north-east. Rural-residential neighbours on the western and northern edges. This is the baseline the project changes.',
    months: 0,
  },
  {
    index: 1,
    id: 'mobilisation',
    name: 'Mobilisation, surveys, environmental controls',
    detail:
      'Site establishment: temporary fencing, site offices, surveys and setting out, environmental management plan in force, erosion and sediment controls established before any ground is disturbed.',
    months: 2,
  },
  {
    index: 2,
    id: 'access',
    name: 'Site access and haul roads',
    detail:
      'Temporary construction access and haul routes, dust control, wheel wash, traffic management plan live. Public documentation notes that earthworks and road construction in Southland are seasonal.',
    months: 3,
  },
  {
    index: 3,
    id: 'esc',
    name: 'Erosion and sediment control',
    detail:
      'Sediment ponds, perimeter controls, stockpile management. On a site with a high-value wetland to the south this is a licence-critical activity, not a site tidy-up.',
    months: 2,
  },
  {
    index: 4,
    id: 'interfaces',
    name: 'Vegetation, wetland and environmental interface works',
    detail:
      'Removal of one small low-value wetland (public fact: 0.24 ha, assessed as degraded with no indigenous species), protection works for the wetland to the south, replacement wetland creation, ecological and lizard management.',
    months: 4,
  },
  {
    index: 5,
    id: 'earthworks',
    name: 'Bulk earthworks',
    detail:
      'Public fact: 320,000 m3 cut and 320,000 m3 fill, ~170,000 m3 of imported aggregate for roads, foundations and the substation platform, net fill ~220,000 m3. Platforms, road corridors and the perimeter bund are formed. Hundreds of truck movements per day.',
    months: 6,
  },
  {
    index: 6,
    id: 'ground',
    name: 'Ground improvement and dewatering',
    detail:
      'Public fact: excavation reaches 5 m below ground level and temporary dewatering is taken at up to 60 L/s for up to two months. Deep compaction, piling or base stabilisation where required, and a permanent drainage blanket under the slabs.',
    months: 4,
  },
  {
    index: 7,
    id: 'underground',
    name: 'Drainage and underground services',
    detail:
      'Stormwater sumps and piped network, cooling water mains, power and fibre duct banks, buried services and conduits. Long-lead civil work that everything above depends on.',
    months: 4,
  },
  {
    index: 8,
    id: 'platforms',
    name: 'Building platforms and hardstands',
    detail: 'Finished platforms, generator and plant hardstands, crane pads, laydown areas.', months: 2,
  },
  {
    index: 9,
    id: 'roads',
    name: 'Permanent roads and utilities',
    detail:
      'Asphalt surfacing, kerbs, drainage, lighting, permanent fencing and gates. Public fact: internal roads encircle the buildings with no public access into the development.',
    months: 3,
  },
  {
    index: 10,
    id: 'foundations',
    name: 'Foundations, slabs and cooling water storage',
    detail:
      'The public servicing report places about 75,000 m3 of sealed cooling water storage in reservoirs 1.5-2.0 m below ground level beneath the buildings. That means the reservoirs are structural and civil work, cast before the hall exists.',
    months: 6,
  },
  {
    index: 11,
    id: 'frame',
    name: 'Structural frame',
    detail: 'Steel or precast frame to the halls, plant enclosures, generator block structures.', months: 5 },
  { index: 12, id: 'envelope', name: 'Envelope and weather-tight', detail: 'Cladding, roofing, doors, roof drainage complete. Weather-tight milestone for each hall.', months: 4 },
  {
    index: 13,
    id: 'gxp',
    name: 'GXP / substation civil works',
    detail:
      'Substation platform on crushed rock, security fencing, access, towers: two existing towers replaced with 50 m structures and two more built. Delivery is gated by transmission owner availability, which is why it starts on its own track.',
    months: 8,
  },
  {
    index: 14,
    id: 'hv',
    name: 'Transformers and HV / MV installation',
    detail:
      'GXP transformers set down, HV bays, gantries, cable termination, protection relays, substation control building energised. Long-lead equipment with factory acceptance testing before shipment.',
    months: 8,
  },
  { index: 15, id: 'mv', name: 'MV distribution', detail: 'Campus MV cable routes, MV switchgear installed and tested, feeder commissioning to each unit substation.', months: 5 },
  {
    index: 16,
    id: 'gencivils',
    name: 'Generator compounds',
    detail: 'Bunds, containment bases, spill separators with automatic shutoff, exhaust routes and stacks (public fact: 15 m stacks).',
    months: 4,
  },
  {
    index: 17,
    id: 'gens',
    name: 'Generators installed',
    detail: '84 sets positioned, aligned and connected; public fact: six blocks of 14, adjacent to the halls.',
    months: 6,
  },
  { index: 18, id: 'fuel', name: 'Fuel infrastructure', detail: 'Belly and day tanks, refuelling points, urea (DEF) storage and dosing lines, fuel quality management.', months: 3 },
  {
    index: 19,
    id: 'coolplant',
    name: 'Major cooling plant',
    detail: 'Adiabatic heat rejection units installed, headers and manifolds connected. Public fact: the plant is the module interior; it is installed in blocks, not in one lift.',
    months: 6,
  },
  { index: 20, id: 'pipes', name: 'Mechanical pipework', detail: 'Cooling water mains, heat exchanger skids, pumps, chemical injection lines, flushing and cleaning.', months: 6 },
  { index: 21, id: 'containment', name: 'Electrical containment', detail: 'Cable tray, ladder rack, busway supports, equipment foundations and housekeeping in the halls.', months: 4 },
  { index: 22, id: 'switchgear', name: 'Switchgear, UPS and batteries', detail: 'MV lineups, unit substations, LV boards, UPS cabinets and battery strings installed and connected.', months: 6 },
  { index: 23, id: 'fitout', name: 'Data hall fitout', detail: 'Hot-aisle containment, blanking panels, floor tiles, lighting, security, structured cabling.', months: 4 },
  { index: 24, id: 'busway', name: 'Busway and rack power', detail: 'Busway installed, torqued and tested; PDUs mounted; rack rows energised.', months: 3 },
  { index: 25, id: 'coolDistrib', name: 'Cooling distribution', detail: 'CDUs, in-row cooling and rack manifolds connected, leak detection zoned and proved.', months: 4 },
  { index: 26, id: 'controls', name: 'Controls, BMS, EPMS and monitoring', detail: 'Building management, electrical power monitoring, environmental monitoring, DCIM and the NOC view. Nothing is commissioned without controls.', months: 4 },
  { index: 27, id: 'telecom', name: 'Fibre and telecom infrastructure', detail: 'Landing station fitout, terrestrial routes complete, campus core building, cabling to halls.', months: 5 },
  { index: 28, id: 'fire', name: 'Fire systems', detail: 'Detection, suppression, fire water, emergency power, interfaces to building services.', months: 3 },
  { index: 29, id: 'it', name: 'Racks and IT equipment', detail: 'Racks in position, servers, switches and storage installed. Delivery happens hall by hall as capacity is leased.', months: 6 },
  { index: 30, id: 'testing', name: 'Testing and pre-functional checks', detail: 'Installation verification, electrical and mechanical testing, pressure testing, flushing, controls point-to-point.', months: 3 },
  { index: 31, id: 'commissioning', name: 'Commissioning', detail: 'Energisation, equipment start-up, functional performance testing of each system against its sequence of operation.', months: 3 },
  { index: 32, id: 'ist', name: 'Integrated systems testing', detail: 'The whole facility at design load on load banks, then scripted failure scenarios: utility loss, generator start and transfer, single component failures. The longest and most weather-dependent window in the project.', months: 3 },
  { index: 33, id: 'energised', name: 'Phased energisation', detail: 'Public fact: the project is delivered in phases, and phase 2 is a small addition to two of the three buildings while the middle building has no phase 2 area.', months: 4 },
  { index: 34, id: 'reliability', name: 'Reliability demonstration', detail: 'Extended run proving availability, alarm nuisance reduction, operational tuning and staff training.', months: 3 },
  { index: 35, id: 'handover', name: 'Operational handover', detail: 'As-built information, training completion, spares and maintenance regime, transition to operations. Public fact: around 60 staff during business hours, 24/7 security, 24/7/365 operation.', months: 2 },
];

export const PHASE_BY_ID: Record<string, Phase> = Object.fromEntries(PHASES.map((p) => [p.id, p]));

/** Cumulative synthetic month at the end of each phase, used for the scrub bar. */
export const CUMULATIVE_MONTHS: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const p of PHASES) {
    acc += p.months;
    out.push(acc);
  }
  return out;
})();

export const TOTAL_MONTHS = CUMULATIVE_MONTHS[CUMULATIVE_MONTHS.length - 1];