/**
 * Source register for the research appendix.
 *
 * RULES OBSERVED IN THIS FILE
 * - Project/company/consultant names appear here ONLY, because a provenance
 *   register has to identify documents accurately. They never appear in UI
 *   labels, in code identifiers, in geometry ids or in component names.
 * - Everything downstream of this file refers to the reference project only as
 *   "the Southland reference project".
 */

export type SourceKind = 'consent' | 'application' | 'council' | 'grid' | 'industry' | 'press';

export interface SourceRef {
  id: string;
  kind: SourceKind;
  publisher: string;
  title: string;
  date: string;
  url: string;
  usedFor: string;
}

export const SOURCES: SourceRef[] = [
  {
    id: 'SDC-POI',
    kind: 'council',
    publisher: 'Southland District Council',
    title: 'Proposals of public interest — hyperscale data centre, Makarewa (land use consent summary and document register)',
    date: '2026',
    url: 'https://www.southlanddc.govt.nz/home-and-property/resource-consents/proposals-of-public-interest/',
    usedFor:
      'Consented scope summary: six data halls across three modules ~9.5 ha, up to 240 MW IT capacity, GXP substation ~4 ha, cable landing station, 84 generators, water treatment, stormwater, internal roads, security, wetland removal/enhancement/creation, subsea cable via Oreti Beach. Register of Stage 1 / Stage 2 construction management, erosion and sediment control, traffic management, contaminated soil, ground settlement, landscape and wetland monitoring plans.',
  },
  {
    id: 'ES-RC-DECISION',
    kind: 'consent',
    publisher: 'Environment Southland',
    title: 'Decision of the Commissioner on non-notified resource consent application APP-20252550 (nine consents AUTH-20252550-01 to -09)',
    date: '2026-03-11',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Resource%20Consent%20Decision%20APP-20252550.pdf',
    usedFor:
      'Site area 48 ha; location ~2.9 km east of Makarewa / ~4.5 km NE of Invercargill; wetland ~13 ha to the south; Waikiwi Stream ~400 m south; 84 generators at 3,200 kWe each, ~5.3 MW heat release per generator; groundwater take 7 L/s; wastewater 5,000 L/day to land; dewatering 60 L/s for up to two months; excavation to 5 m BGL; 35-year consent term under s123B; air discharge consent for generator exhaust; electricity transmission lines across the north-east corner.',
  },
  {
    id: 'ES-AEE',
    kind: 'application',
    publisher: 'Environment Southland (applicant application document)',
    title: 'Assessment of Environmental Effects, redacted (amended)',
    date: '2025',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Application%20documents/Redacted%20-%20Amended%20AEE%20-%20Application%20Datagrid%20NZ%20Partnership%20Ltd.pdf',
    usedFor:
      'Six data halls within three modules over 9.5 ha; data hall height 12 m; rectangular module layout with data halls on the outer sides and generators / adiabatic coolers / mechanical plant inside the rectangle for noise mitigation; adiabatic cooling with water-glycol cold plates on GPUs absorbing 70-80% of heat, secondary liquid heat exchanger for the remaining hot air, evaporation cooling loop to 15-20 C; GXP in the north-east corner on a ~4 ha crushed-rock platform, 2.5 m fence, 50 m heavy-duty towers, substation buildings <10 m and gantries to 24 m; four Transpower HV lines traverse the north-east site area and a 33 kV distribution line runs north through the site; 84 generators with 10,000 L belly tanks (840,000 L total); fibre route from Australia to Oreti Beach, trench to an exchange, two diverse terrestrial routes to the site.',
  },
  {
    id: 'ES-S42A',
    kind: 'application',
    publisher: 'Environment Southland (recommending report)',
    title: 's42A recommending report APP-20252550, redacted',
    date: '2025-09',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Redacted%201.4.2%20-%20s42A%20Recommending%20Report%20APP-20252550.pdf',
    usedFor:
      'Groundwater allocation context (zone limit 44.5 Mm3/yr, 5.9% allocated, proposed take ~8.5% of limit); 41 known bores within 3 km, 8 within 1.5 km, nearest neighbour well 650 m from site centre; generator fuel consumption 817.7 L/h per set; 700 mm exhaust stacks at 15 m; heat release 5.3 MW per generator, 445.2 MW total.',
  },
  {
    id: 'ES-CIVILS',
    kind: 'application',
    publisher: 'Environment Southland (applicant civil engineering report)',
    title: 'Civil Servicing Report, Rev D — stormwater, wastewater, potable water, cooling water, earthworks, access',
    date: '2025-09-19',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Application%20documents/Bonisch%20Civils%20Servicing%20Report.%20Rev.D.pdf',
    usedFor:
      'Cooling water demand scenario ~288,000 m3/yr varying monthly; ~75,000 m3 of storage in sealed reservoirs beneath the buildings at 1.5-2.0 m BGL (~1.5 months); rainwater capture ~75,000 m3/yr (~13% of site rainfall) from ~30,000 m2 of data hall roof and ~65,000 m2 of hardstand/landscape; long-term average rainfall ~1,100 mm/yr from a 60-year record; pre-development runoff ~167,000 m3/yr; groundwater anticipated 212,600 m3/yr against a consent limit of 220,752 m3/yr (7 L/s); long-term discharge to wetland ~157,000 m3/yr; potable 150 m3 tank fed from 3,000 m2 of roof and physically separated from cooling water; earthworks 320,000 m3 cut / 320,000 m3 fill, 170,000 m3 imported aggregate, net fill ~220,000 m3; perimeter bund; swales both sides of the halls to a southern basin with ~24 h retention, expected to remove up to 80% of sediment and 60% of other pollutants; asphalt/chipseal internal roads with no public access.',
  },
  {
    id: 'ES-EMP',
    kind: 'application',
    publisher: 'Environment Southland (applicant draft management plan)',
    title: 'Environmental Management Plan (draft) — hazardous substances, site layout, generator blocks',
    date: '2025',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Application%20documents/Datagrid%20NZ%20Partnership%20Ltd%20-%20PDP%20Draft%20Environmental%20Management%20Plan.pdf',
    usedFor:
      'Six server buildings with a substation at the northern end, internal roading encircling the server buildings; 84 generators in six blocks of 14 adjacent to the server buildings; diesel delivered by tanker and each tank refuelled individually; bunded concrete bases draining to a full-retention stormwater treatment separator with automatic shutoff; urea/water (DEF) storage at each generator block for catalytic reduction; cooling water disinfected against legionella, algae and scale; propylene glycol injected into the data hall cooling loop; ~60 staff on site during standard business hours with 24/7 security; per-module building schedule showing phase 1 data halls of 8,210 m2 each with a smaller phase 2 addition (21,528 ft2) and no phase 2 area in the middle building.',
  },
  {
    id: 'ES-GWTAE',
    kind: 'application',
    publisher: 'Environment Southland (applicant hydrogeological report)',
    title: 'Technical Assessment of Effects for Groundwater Take, Rev 3',
    date: '2025-09',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Application%20documents/Datagrid%20NZ%20Partnership%20Ltd%20-%20PDP%20Groundwater%20Take_Rev3.pdf',
    usedFor:
      'Bore field of four to five production bores drawing from an unconfined aquifer in the Waihopai zone at up to 7 L/s total; ground level 14-18 m ASL dropping to ~9-10 m ASL at the southern wetland; site rectangle roughly 700 m by 700 m draining west; borefield pumping test required as a consent condition.',
  },
  {
    id: 'ES-WETLAND',
    kind: 'application',
    publisher: 'Environment Southland (applicant wetland assessment)',
    title: 'Wetland Delineation and Assessment of Effects',
    date: '2025',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Application%20documents/Datagrid%20NZ%20Partnership%20Ltd%20-%20PDP%20Wetland%20Delineation%20and%20Assessments.pdf',
    usedFor:
      'Northern upper wetland 0.24 ha removed (assessed low ecological value); Taylor Road wetland retained and enhanced (high value, indigenous, groundwater supported); unmitigated drawdown up to 1.4 m over 20 years, mitigated with soakage recharge; building footprint ~9.24 ha and impervious area ~10.02 ha (~20.5% of the property); site contours 14-18 m ASL falling to ~9 m ASL at a terrace to the south; erosion and sediment control plan requirement.',
  },
  {
    id: 'ES-NOTIF',
    kind: 'application',
    publisher: 'Environment Southland (notification report)',
    title: 'Notification consideration report, redacted',
    date: '2025',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Notification%20consideration%20report/Redacted%20-%20s95-95G%20Recommending%20Report%20APP-20252550.pdf',
    usedFor: 'Corroboration of consent scale figures and emissions parameters.',
  },
  {
    id: 'ES-PERMIT',
    kind: 'consent',
    publisher: 'Environment Southland',
    title: 'Water Permit — groundwater take for cooling water and potable supply (AUTH-20252550-03)',
    date: '2026-03-11',
    url: 'https://www.es.govt.nz/repository/libraries/id:26gi9ayo517q9stt81sd/hierarchy/environment/consents/documents/Datagrid%20resource%20consents/Resource%20consents/Water%20Permit%20Groundwater%20take%20AUTH-20252550-03.pdf',
    usedFor:
      'Take limits: 7 L/s, 604,800 L/day, 220,752,000 L/yr; four bore locations; expiry 11 March 2061.',
  },
  {
    id: 'TP-NEWS',
    kind: 'grid',
    publisher: 'Transpower',
    title: 'Murihiku Southland electricity network investment options (and South Island transmission network information)',
    date: '2024-2025',
    url: 'https://www.transpower.co.nz/news/transpower-and-powernet-seek-input-southlands-future-electricity-needs',
    usedFor:
      'Regional grid context: Southland grid zone, North Makarewa and Invercargill grid exit points, 220 kV transmission in the region, short-term thermal uprating of the Invercargill-North Makarewa circuit, 66 kV distribution projects. Generic, non-project-specific.',
  },
  {
    id: 'IND-TIA942',
    kind: 'industry',
    publisher: 'Telecommunications Industry Association',
    title: 'ANSI/TIA-942 data centre infrastructure standard — ratings 1 Basic, 2 Redundant, 3 Concurrently Maintainable, 4 Fault Tolerant',
    date: '2024',
    url: 'https://tiaonline.org/wp-content/uploads/2024/05/TIA-942-C-DC-infrastructure-stadard_TIA-white-paper.pdf',
    usedFor:
      'Rating scale vocabulary (redundancy, concurrently maintainable, fault tolerant), 800 mm minimum cabinet width, cabling and pathway expectations. TYPICAL material only.',
  },
  {
    id: 'IND-CX',
    kind: 'industry',
    publisher: 'Data centre commissioning practitioner material',
    title: 'Commissioning levels L1-L5 and integrated systems testing practice (ASHRAE Guideline 0 / Standard 202 framework; NETA; NFPA 110; ASHRAE TC 9.9)',
    date: '2024-2026',
    url: 'https://datacenterguidelines.com/guides/integrated-systems-testing',
    usedFor:
      'Commissioning level definitions, load bank practice, scripted failure scenarios, hold points, deficiency logs, acceptance responsibility. TYPICAL material only.',
  },
  {
    id: 'IND-DLC',
    kind: 'industry',
    publisher: 'AI data centre engineering material (vendor and OCP-derived guidance)',
    title: 'Direct-to-chip liquid cooling, CDU architectures and water temperature classes (ASHRAE TC 9.9 W-class, OCP cold plate guidance)',
    date: '2025-2026',
    url: 'https://aidatacenterguide.com/part-5-cooling-and-thermal-management/5-6-cdus-and-the-secondary-loop',
    usedFor:
      'Rack densities, CDU capacity bands, flow per kW, approach temperatures, dew point rule, in-rack vs in-row vs facility CDUs. TYPICAL material only.',
  },
  {
    id: 'IND-GEN',
    kind: 'industry',
    publisher: 'Data centre electrical design material',
    title: 'Electrical configuration taxonomy (N, N+1, 2N, 2(N+1)) and generator plant architecture',
    date: '2012-2026',
    url: 'https://exa.ai/library/publication/qt2hpfh15lp',
    usedFor: 'Redundancy definitions, fault domain and maintenance claims, generator sizing and load-sequence concepts. TYPICAL material only.',
  },
  {
    id: 'PRESS-CAP',
    kind: 'press',
    publisher: 'BusinessDesk',
    title: 'Southland hyperscale approvals and capacity reporting (280 MW; consented water take; capital figure)',
    date: '2026-03',
    url: 'https://businessdesk.co.nz/article/infrastructure/hyperscaler-datagrid-gets-approvals-for-280mw-southland-data-centre',
    usedFor:
      'Evidence that a different capacity figure (280 MW) circulates publicly alongside the consented 240 MW IT figure. Press only; capital figure recorded here solely to note it exists and is deliberately NOT used in this application.',
  },
];

export const SOURCE_BY_ID: Record<string, SourceRef> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);