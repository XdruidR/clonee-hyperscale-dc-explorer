/**
 * The Clonee construction sequence, anchored to real dates.
 *
 * Unlike a generic sequence, every phase here sits on the real record:
 *
 *   - Consent RA150605 granted 2015 (Meath County Council).
 *   - An Bord Pleanála VA0018 planning report for the 220 kV substation, 2015.
 *   - The 220 kV station energised in August 2017, connected in approximately
 *     15 months, and the first customer-built 220 kV station in Ireland.
 *   - CLN1 completed in the final quarter of 2017, with four data halls of
 *     approximately 16,400 m² fitted out, the roads, parking and the substation.
 *   - CLN2 handed over in May 2018 after a fit-out that began in Q4 2017.
 *   - CLN3 at RIBA stage 7 in 2019.
 *   - Consent RA180671 for two further buildings, with construction announced
 *     in March 2019 and LEED Gold earned by the earlier buildings that December.
 *   - The mature five-building campus described in the EPA licence.
 *
 * `months` is real elapsed time between anchors, used for the scrub bar and the
 * programme arithmetic. Where the public record does not date a phase, the
 * window is placed between the phases that are dated, and the phase `detail`
 * says so.
 *
 * The last two phases are not construction. They are the AI retrofit study and
 * a modelled retrofit, which is what the application is for.
 */

export interface Phase {
  index: number;
  id: string;
  name: string;
  /** real calendar anchor, or a range where the record gives a range */
  period: string;
  detail: string;
  /** real elapsed months from the phase anchor; 0 for instantaneous phases */
  months: number;
  /** true when the phase's placement is inferred between dated anchors */
  inferred?: boolean;
  /** the data-storage buildings this phase is working on, if any */
  buildings?: number[];
}

export const PHASES: Phase[] = [
  {
    index: 0,
    id: 'baseline',
    name: 'Greenfield site at Clonee',
    period: 'early 2015',
    detail:
      'Agricultural land in County Meath, flat and low-lying, roughly 95.5 ha, with the Clonee road network and the local drainage pattern crossing it. No data centre exists here yet. This is the baseline the project changes, and the reason a 220 kV substation of this size needed to be argued for at all.',
    months: 0,
  },
  {
    index: 1,
    id: 'consent-campus',
    name: 'Original campus consent granted',
    period: '2015',
    detail:
      'Meath County Council planning application RA150605 granted. The consent describes a phased data-centre development on approximately 95.5 ha: two initial data-centre buildings of approximately 25,400 m² each, about 50,800 m² combined, with four data halls per building and 36 MW of data capacity per building, plus administration and support areas, backup generators, cooling infrastructure, tanks and drainage, internal roads, security infrastructure, and underground 20 kV electricity cables between the substation and the data-centre buildings.',
    months: 5,
  },
  {
    index: 2,
    id: 'consent-substation',
    name: 'Substation consent and loop-in agreed',
    period: '2015',
    detail:
      'An Bord Pleanála application VA0018 covers the 220 kV substation that RA150605 depends on: an approximately 30,100 m² compound with outdoor 220 kV air-insulated switchgear, 12 × 220 kV bays, three step-down transformers, 27 lightning-protection masts, a control building, a diesel-generator building, a customer MV building, internal roads, perimeter fencing, two new 220 kV transmission towers, and a loop-in connection to the existing 220 kV transmission system.',
    months: 4,
  },
  {
    index: 3,
    id: 'mobilisation',
    name: 'Mobilisation, surveys and environmental controls',
    period: '2015–2016',
    detail:
      'Site establishment, temporary fencing, site accommodation, surveys and setting out. Erosion and sediment control established before any ground is disturbed, which on an Irish greenfield site with a receiving watercourse is a licence-critical activity rather than housekeeping.',
    months: 7,
    inferred: true,
  },
  {
    index: 4,
    id: 'earthworks',
    name: 'Bulk earthworks, platforms and roads',
    period: '2016',
    detail:
      'Formation of building platforms, generator and plant hardstands, internal road corridors and the substation platform. The consented campus is a large share of its site area in hardstanding, so the earthworks and the drainage design are designed together rather than sequentially.',
    months: 9,
    inferred: true,
  },
  {
    index: 5,
    id: 'sub-civil',
    name: 'Substation platform and transmission towers',
    period: '2016',
    detail:
      'The 220 kV compound platform formed and surfaced, security fencing and internal roads built, and the two new 220 kV transmission towers erected for the loop-in. Tower delivery is gated by the transmission system owner, which is why the substation runs on its own critical path alongside the buildings.',
    months: 10,
    inferred: true,
  },
  {
    index: 6,
    id: 'sub-install',
    name: '220 kV switchgear and substation buildings',
    period: '2016–2017',
    detail:
      'Outdoor 220 kV air-insulated switchgear: 12 bays, gantries, the 27 lightning-protection masts, cable terminations and protection. The control building, diesel-generator building and customer MV building are built and fitted out. Large power transformers go through factory acceptance testing before shipment, so this phase is bounded by procurement, not by construction.',
    months: 12,
    inferred: true,
  },
  {
    index: 7,
    id: 'transformers',
    name: 'Step-down transformers delivered and set',
    period: '2017',
    detail:
      'The three step-down transformers transported, set on their plinths, connected, filled, tested and energised from the 220 kV side. Public records do not publish the ratings, so the model sizes them from the consented campus load. This is the last point at which the whole campus depends on a single delivery.',
    months: 5,
    inferred: true,
  },
  {
    index: 8,
    id: 'grid-energised',
    name: '220 kV station energised',
    period: 'August 2017',
    detail:
      'EirGrid records the new 220 kV station at Clonee as completed in August 2017: constructed by the customer and connected by EirGrid to the transmission system, in approximately 15 months, and the first customer-built 220 kV station in Ireland. Everything downstream of this moment is powered. This is the hinge of the whole programme.',
    months: 2,
  },
  {
    index: 9,
    id: 'cln1-shell',
    name: 'CLN1 shell, plant and administration',
    period: '2016–2017',
    detail:
      'The first data-storage building: structural frame, envelope, four data halls of approximately 4,170 m² each, approximately 11,000 m² of internal plant, and the administration building with staff welfare. Single-storey and long-barred, which is the shape that lets four halls share one plant corridor.',
    months: 14,
    inferred: true,
    buildings: [1],
  },
  {
    index: 10,
    id: 'cln1-fitout',
    name: 'CLN1 fit-out and energisation',
    period: '2017',
    detail:
      'Power and cooling plant installed, electrical rooms fitted, halls fitted out with containment, busway, racks, cabling and air-cooled in-hall cooling. MV distribution arrives over the consented underground 20 kV cables from the substation.',
    months: 8,
    inferred: true,
    buildings: [1],
  },
  {
    index: 11,
    id: 'cln1-handover',
    name: 'CLN1 commissioned and IT-ready',
    period: 'Q4 2017',
    detail:
      'Four data halls of approximately 16,400 m² fitted out and commissioned, alongside administration facilities, delivery systems, all internal and external roads, car parking and the 220 kV substation. The contractor’s architect records this as the completion of phase 1 in the final quarter of 2017. The campus can now carry production traffic.',
    months: 3,
    buildings: [1],
  },
  {
    index: 12,
    id: 'cln2-fitout',
    name: 'CLN2 fit-out and handover',
    period: 'Q4 2017 – May 2018',
    detail:
      'The shell of the second building, left fallow at the end of phase 1, is fitted out and handed over in May 2018. The record notes the second-phase fit-out proceeded faster than anticipated while the third phase was already starting on site — the first evidence of the campus being delivered in overlapping phases rather than sequentially.',
    months: 8,
    buildings: [2],
  },
  {
    index: 13,
    id: 'consent-expansion',
    name: 'Expansion consent granted',
    period: '2018',
    detail:
      'Meath County Council planning application RA180671 granted for two additional data-centre buildings of approximately 57,400 m² combined, a further administration and office building, additional generators, roads, drainage, parking, security and ancillary infrastructure.',
    months: 4,
  },
  {
    index: 14,
    id: 'cln3-shell',
    name: 'CLN3 single-bar building',
    period: '2018–2019',
    detail:
      'A single-bar data hall building with associated distribution and administration space, approximately 28,320 m². The bar form continues the CLN1 and CLN2 logic: one long building, four halls, all plant in one corridor, one point of entry for power and cooling.',
    months: 13,
    inferred: true,
    buildings: [3],
  },
  {
    index: 15,
    id: 'cln3-fitout',
    name: 'CLN3 fit-out',
    period: '2019',
    detail:
      'Plant, electrical rooms and hall fit-out on the third building, adding a further four data halls to the campus. At RIBA stage 7 by 2019, on the contractor’s architect’s record.',
    months: 8,
    inferred: true,
    buildings: [3],
  },
  {
    index: 16,
    id: 'cln3-handover',
    name: 'CLN3 commissioned',
    period: '2019',
    detail:
      'CLN3 commissioned and handed to operations. The campus is now three buildings carrying twelve halls, which is the arrangement the 108 MVA published power supply was sized against.',
    months: 3,
    buildings: [3],
  },
  {
    index: 17,
    id: 'cln5-shell',
    name: 'CLN5 shell and plant',
    period: '2019–2020',
    detail:
      'The first expansion building, consented under RA180671. Construction of the two additional buildings was announced in March 2019 to begin later that month, taking the facility to nearly 150,000 m². By this point the build is happening beside an operating campus, which changes how it can be delivered.',
    months: 14,
    inferred: true,
    buildings: [5],
  },
  {
    index: 18,
    id: 'cln6-shell',
    name: 'CLN6 shell and plant',
    period: '2020',
    detail:
      'The second expansion building, alongside CLN5. Two buildings constructed concurrently against one live substation and one live campus, with the interfaces between new construction and operating plant as the defining project-controls problem of the phase.',
    months: 14,
    inferred: true,
    buildings: [6],
  },
  {
    index: 19,
    id: 'cln5-fitout',
    name: 'CLN5 fit-out',
    period: '2020–2021',
    detail:
      'CLN5 plant and hall fit-out, energisation from the campus MV network, and commissioning of four further halls. The earlier buildings had by then earned LEED Gold and Ireland’s Green Construction Award, and 97% of the first two buildings’ construction waste had been recycled rather than landfilled.',
    months: 10,
    inferred: true,
    buildings: [5],
  },
  {
    index: 20,
    id: 'cln6-fitout',
    name: 'CLN6 fit-out',
    period: '2021',
    detail:
      'CLN6 plant and hall fit-out, energisation and commissioning. On completion the campus is the five data-storage buildings the EPA industrial emissions licence names: CLN1, CLN2, CLN3, CLN5 and CLN6.',
    months: 10,
    inferred: true,
    buildings: [6],
  },
  {
    index: 21,
    id: 'mature',
    name: 'Mature five-building campus',
    period: '2021 onward',
    detail:
      'Five data-storage buildings, twenty halls, ninety diesel generators and one dedicated 220 kV substation, operating as a single campus. 90 MW of generation is modelled against 180 MW of consented IT load across the five buildings. This is the configuration the rest of the application describes.',
    months: 0,
  },
  {
    index: 22,
    id: 'ai-study',
    name: 'AI retrofit feasibility',
    period: '2024–2026',
    detail:
      'A delivered hall at 2.24 kW/m² was designed to a different problem. The question this phase asks is what changes if the same floor area carries modern GPU-dense compute: rack power an order of magnitude higher, direct-to-chip liquid cooling replacing air, coolant distribution units inside the hall, and a power and cooling plant sized around a load that did not exist when the concrete was poured.',
    months: 18,
  },
  {
    index: 23,
    id: 'ai-retrofit',
    name: 'CLN2 hall 3 converted to AI',
    period: 'modelled',
    detail:
      'One hall of CLN2 shown converted: racks replaced at far higher density, cold plates and manifolds at every rack, coolant distribution units in the hall, and the mechanical and electrical plant re-sized behind them. This is a teaching model, not a Clonee project.',
    months: 14,
    buildings: [2],
  },
  {
    index: 24,
    id: 'horizon',
    name: 'What the record does not say',
    period: 'open',
    detail:
      'The public record stops at substation compound, bay count, transformer count, building count, hall count, generator count, IT area, power density and consent dates. Switchgear lineups, per-building generator ratings, UPS architecture, cooling plant counts, control logic and achieved redundancy ratings are not published. Everything the model shows for those is labelled as derived or typical, and this mode exists to make that boundary visible rather than to hide it.',
    months: 0,
  },
];

export const PHASE_BY_ID: Record<string, Phase> = Object.fromEntries(PHASES.map((p) => [p.id, p]));

/** Cumulative elapsed months at the end of each phase, for the scrub bar. */
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

/** Phases that correspond to a dated consent or energisation event. */
export const DATED_ANCHORS: Phase[] = PHASES.filter((p) => !p.inferred && p.months > 0);

export function phaseOfStage(stageId: string): number | undefined {
  const map: Record<string, number> = {
    'grid-energised': 8,
    handover: 24,
  };
  return map[stageId];
}