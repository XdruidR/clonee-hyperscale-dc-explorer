/**
 * Source register for Clonee.
 *
 * RULES OBSERVED IN THIS FILE
 * - Every id in here is referenced by facts, claims and components. If an id is
 *   not in this file, the citation does not render.
 * - Company and consultant names appear here only, because a provenance
 *   register has to identify documents accurately. Operator names are allowed in
 *   UI prose where the operator is the subject of the fact (this is a real,
 *   named, operating facility), but never in geometry ids.
 * - `kind` is about the evidentiary weight of the document, not its format.
 */

export type SourceKind =
  | 'consent'
  | 'application'
  | 'council'
  | 'environment'
  | 'grid'
  | 'operator'
  | 'industry'
  | 'standards'
  | 'press';

export interface SourceRef {
  id: string;
  kind: SourceKind;
  publisher: string;
  title: string;
  date: string;
  url: string;
  usedFor: string;
}

export const SOURCE_KIND_MEANING: Record<SourceKind, string> = {
  consent: 'A planning decision granting permission. The strongest statement of what is consented.',
  application: 'A planning application document submitted for approval.',
  council: 'Published by a local authority in a decision, report or register.',
  environment: 'An environmental regulator licence or inspector report.',
  grid: 'Transmission system operator documentation.',
  operator: 'Published by the facility operator.',
  industry: 'Consultant, contractor or trade publication material.',
  standards: 'A published standard or reference used for typical practice only.',
  press: 'Secondary reporting.',
};

export const SOURCES: SourceRef[] = [
  {
    id: 'MCC-150605',
    kind: 'consent',
    publisher: 'Meath County Council',
    title: 'Planning application RA150605 — Clonee data centre campus (original consent, and Phase 1 as granted)',
    date: '2015',
    url: 'https://www.eplanning.ie/MeathCC/AppFileRefDetails/RA150605/0',
    usedFor:
      'Greenfield site of approximately 95.5 ha. Two initial data-centre buildings of approximately 25,400 m² each, approximately 50,800 m² combined GFA. Four data halls per building. 36 MW data capacity per building. Backup generators, cooling infrastructure, tanks and drainage, internal roads, security infrastructure. Underground 20 kV electricity cables between the substation and the data-centre buildings. Phased development of the campus.',
  },
  {
    id: 'MCC-180671',
    kind: 'consent',
    publisher: 'Meath County Council',
    title: 'Planning application RA180671 — Clonee data centre expansion',
    date: '2018',
    url: 'https://www.eplanning.ie/MeathCC/AppFileRefDetails/RA180671/0',
    usedFor:
      'Two additional data-centre buildings, approximately 57,400 m² combined additional GFA. A further administration and office building. Additional generators, roads, drainage, parking, security and ancillary infrastructure.',
  },
  {
    id: 'BP-VA0018',
    kind: 'council',
    publisher: 'An Bord Pleanála',
    title: 'Planning report VA0018 — Clonee 220 kV substation (search the reference in the document)',
    date: '2015',
    url: 'https://www.pleanala.ie/publicaccess/EIAR-NIS/308130/Application%20Documents/Planning/Planning%20Report.pdf?r=337481',
    usedFor:
      'Substation compound of approximately 30,100 m². Outdoor 220 kV air-insulated switchgear. 12 × 220 kV bays. Three step-down transformers. 27 lightning-protection masts. Control building, diesel-generator building and customer MV building. Internal roads and perimeter fencing. Two new 220 kV transmission towers. Loop-in connection to the existing 220 kV transmission system.',
  },
  {
    id: 'EIR-AR2017',
    kind: 'grid',
    publisher: 'EirGrid',
    title: 'Annual Report 2017',
    date: '2017',
    url: 'https://cms.eirgrid.ie/sites/default/files/publications/EirGrid_Annual_Report_2017_EirGrid-Website.pdf',
    usedFor:
      'Completion of the new 220 kV station at Clonee in August 2017. Constructed by the customer and connected by EirGrid to the transmission system. The first customer-built 220 kV station in Ireland. Connected in approximately 15 months.',
  },
  {
    id: 'EPA-P1192',
    kind: 'environment',
    publisher: 'Environmental Protection Agency (Ireland)',
    title: 'Industrial Emissions Licence P1192-01 — Clonee data centre campus',
    date: 'licence in force',
    url: 'https://epawebapp.epa.ie/licences/lic_eDMS/090151b28088a8af.pdf',
    usedFor:
      'Five data-storage buildings on the operating campus: CLN1, CLN2, CLN3, CLN5, CLN6. 90 diesel generators across the campus. Conditions under which the generators may operate: loss of grid supply, instability or reduction of grid supply, maintenance, and TSO-requested grid-reduction conditions. Residual evaporative cooling-water discharge. Stormwater and environmental systems. Associated application forms and inspector reports should be read alongside the licence.',
  },
  {
    id: 'META-2019',
    kind: 'operator',
    publisher: 'Meta',
    title: 'We will be expanding our Clonee Data Centre',
    date: '2019-03-06',
    url: 'https://datacenters.atmeta.com/2019/03/we-will-be-expanding-our-clonee-data-centre/',
    usedFor:
      'Expansion by two new buildings bringing the facility to nearly 150,000 m². Hundreds of millions of euros of incremental investment. Existing buildings earned LEED Gold certification and Ireland’s Green Construction Award. 97% of construction waste recycled in the first two buildings. 100% renewable energy.',
  },
  {
    id: 'META-DC',
    kind: 'operator',
    publisher: 'Meta',
    title: 'Data centres — location and facility information',
    date: 'current',
    url: 'https://datacenters.atmeta.com/',
    usedFor: 'Operator context, current facility information, sustainability and investment context.',
  },
  {
    id: 'SNWA-FB',
    kind: 'industry',
    publisher: 'studioNWA',
    title: 'Facebook — Clonee: development of a new data centre building in Ireland (project page)',
    date: '2015–2019',
    url: 'https://www.studionwa.com/project/facebook/',
    usedFor:
      'Contractor’s architect project record. Three data hall buildings on approximately 227 acres (about 92 ha). Four data halls per building of approximately 4,170 m² each. Two meet-me rooms per building. Internal plant area of approximately 11,000 m². Administration building. 108 MVA power supply from a 100% renewable source. IT cooling by indirect air cooling. IT area approximately 75,000 m². IT power density 2.24 kW/m². Total area 97,000 m². Contractor Mace; mechanical and electrical and civil/structural engineer Cundall. RIBA stage 7 — CLN1 2017, CLN2 2018, CLN3 2019. Phase 1 completed in the final quarter of 2017 including fit-out of four data halls of approximately 16,400 m², all internal and external roads, car parking and the 220 kV substation. Phase 2 fit-out began in the final quarter of 2017 for handover in May 2018. When complete the campus covers about 85 ha.',
  },
  {
    id: 'ICE-2018',
    kind: 'industry',
    publisher: 'Irish Construction Excellence Awards',
    title: '2018 winners — Industrial Over €10m: Clonee Data Centre, County Meath (contractor Mace)',
    date: '2018-03-23',
    url: 'https://iceawards.ie/winners-2018/',
    usedFor:
      'Confirmation that the Clonee campus was delivered as a multi-phase industrial project and won the Industrial Over €10m award at the 2018 ceremony, which establishes the campus as a completed phase 1 by March 2018.',
  },
  {
    id: 'META-INNOV',
    kind: 'operator',
    publisher: 'Meta',
    title: 'Innovation — data centre technology',
    date: 'current',
    url: 'https://datacenters.atmeta.com/innovation/',
    usedFor: 'Comparison context for how the same kind of campus changes for newer AI infrastructure.',
  },
  {
    id: 'IND-NVDA',
    kind: 'industry',
    publisher: 'NVIDIA',
    title: 'GB200 NVL72 / GB300 NVL72 rack-scale system documentation',
    date: '2024–2026',
    url: 'https://www.nvidia.com/en-us/data-center/gb200-nvl72/',
    usedFor:
      'Rack-scale AI system power, rack dimensions and power delivery, used only for the AI Evolution comparison. Never a statement about Clonee as built.',
  },
  {
    id: 'STD-TIA942',
    kind: 'standards',
    publisher: 'Telecommunications Industry Association',
    title: 'ANSI/TIA-942 — Telecommunications Infrastructure Standard for Data Centers',
    date: '2017 onward',
    url: 'https://www.tiaonline.org/resources/standards/tia-942/',
    usedFor:
      'Rated availability definitions and concurrently maintainable terminology used to explain redundancy claims. The rating achieved at Clonee is not published.',
  },
  {
    id: 'IND-UPTIME',
    kind: 'industry',
    publisher: 'Uptime Institute',
    title: 'Global Data Centre Survey — design and outage findings',
    date: 'annual',
    url: 'https://uptimeinstitute.com/resources/research-and-reports',
    usedFor:
      'Typical design practice for generator sizing, cooling approach, redundancy and design-versus-operational-outage causes. Used for TYPICAL values only.',
  },
  {
    id: 'IND-ACUE',
    kind: 'industry',
    publisher: 'ASHRAE / CIBSE',
    title: 'Thermal guidelines for data processing environments and CIBSE Guide A',
    date: 'current',
    url: 'https://www.ashrae.org/technical-resources/bookstore/datacom-series',
    usedFor:
      'Class A1–A4 recommended envelopes, supply air and chilled water temperature ranges, and water usage effectiveness definitions. Used for TYPICAL values only.',
  },
  {
    id: 'JP-SUB',
    kind: 'industry',
    publisher: 'John Paul Construction',
    title: '220 kV substation, Clonee, Co. Meath — design-and-build civil and structural package',
    date: 'c. 2016',
    url: 'https://www.johnpaul.ie/case-studies/220kv-substation-phase-4',
    usedFor:
      'A directly citable Irish anchor for the substation compound: approximately 17,000 m², €6.2m, 11 months, design-and-build civil and structural. 105 equipment bases, transformer bunds and cable troughs. 16 reinforced concrete bases supporting 30 m mono-pole lightning masts. Two cable seal-end bases for the underground transmission connection. Two transformer bunds supporting 18,500 kg transformers with 8,500 L oil capacity. 380 m of glass-fibre-reinforced plastic cable troughing with trafficable covers. Two transmission-owner buildings, control and diesel generator. Designed to serve a 62,000 m² data centre. Ireland’s second privately funded and constructed 220 kV substation.',
  },
  {
    id: 'IND-MMD',
    kind: 'industry',
    publisher: 'Mitchell McDermott',
    title: 'Data Centre InfoCard — Irish construction cost benchmarks',
    date: '2025–2026',
    url: 'https://mitchellmcdermott.com/wp-content/uploads/2026/01/Data-Centres-Infocard-2026.pdf',
    usedFor:
      'Irish cost benchmarks on a development basis, including site acquisition, statutory fees, development contributions, service-connection contributions, professional fees and finance: €11m–€14m per MW for a 10–20 MW white-space data centre, and €14.5m–€19m for a 110 kV substation. Design norms: 5–10 kW per rack, 2–3 m² per rack, 70% white space. Used for TYPICAL and DERIVED values only.',
  },
  {
    id: 'IND-SAV',
    kind: 'industry',
    publisher: 'Savills / Turner & Townsend',
    title: 'European data centre market spotlight — cost benchmarks',
    date: '2023–2024',
    url: 'https://pdf.euro.savills.co.uk/european/european-commercial-markets/spotlight-european-data-centres---may-2024.pdf',
    usedFor:
      'Construction-basis cost per MW: Europe average $9.1m/MW, Dublin $8.8m/MW. Land $0.28m–$0.86m per MW and building shell $0.90m–$1.83m per MW. Redundancy premium: a higher rated facility costs 25–40% more than a lower one. Used for TYPICAL and DERIVED values only.',
  },
  {
    id: 'STD-CX',
    kind: 'standards',
    publisher: 'ASHRAE / Construct and Commission',
    title: 'Data centre commissioning guideline — the L0 to L6 levels',
    date: 'current',
    url: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
    usedFor:
      'The commissioning level structure used by the Commissioning mode: L0 design and planning, L1 factory testing, L2 delivery and installation, L3 pre-functional and start-up, L4 functional performance, L5 integrated systems testing, L6 closeout and turnover. Note that there is no universal mandatory mapping between the level numbers and a single set of activities. Used for TYPICAL practice only.',
  },
  {
    id: 'IND-LC',
    kind: 'industry',
    publisher: 'STT Telemediagdc / Vertiv / Schneider Electric',
    title: 'Published guidance on retrofitting liquid cooling into air-cooled halls',
    date: '2024–2026',
    url: 'https://www.sttelemediagdc.com/resources/cooling-the-future-how-ai-is-driving-new-era-in-data-centre-architecture',
    usedFor:
      'The discriminator the AI Evolution mode depends on: a hall whose primary cooling is direct or indirect air cannot natively accept liquid, and its realistic retrofit paths are liquid-to-air sidecar units or a wholesale conversion. A hall with a chilled-water primary loop can transition to any mix of liquid and air. Also the 90/10 air-to-liquid split at rack level, which is why in-hall air cooling cannot be removed. Used for TYPICAL values only.',
  },
  {
    id: 'PRESS-ECO',
    kind: 'press',
    publisher: 'Irish Times / Department of Enterprise',
    title: 'Irish press and government coverage of the Clonee campus build-out',
    date: '2015–2026',
    url: 'https://enterprise.gov.ie/en/news-and-events/department-news/2016/april/06042016.html',
    usedFor:
      'Phase 1 site start in April 2016 and opening in September 2018, about 29 months. An announced €300m for the original two buildings of eight halls and up to 72 MW, about €4.2m per MW. Secondary reporting, used for DERIVED values and clearly separated from the consent record.',
  },
];

export const SOURCE_BY_ID: Record<string, SourceRef> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));