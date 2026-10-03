# Research and provenance

This file records what was researched, what the public record actually says, where the sources disagree, and
what was therefore modelled rather than known.

Source ids used here are the same ids used throughout the application (`src/data/sources.ts`) and in the
in-app **Sources & method** drawer.

---

## 1. Approach

A large hyperscale / AI data centre project near Makarewa and Invercargill, Southland, New Zealand was used as
the scale reference because unusually detailed public consenting, civil servicing, environmental and
construction-management documentation exists for it, and because it is a good example of a contemporary AI
campus: a dedicated grid exit point, a large diesel generation fleet, an evaporative cooling plant, a bore
field, wetland obligations, and an international subsea cable.

The research principle applied throughout:

> Public consent material is reliable about **scale, interfaces, quantities and obligations**. It is silent
> about **detailed design**. So every claim was classified PUBLIC FACT / TYPICAL / SIMPLIFIED / SYNTHETIC, and
> every place where the record runs out is stated explicitly rather than filled in.

Nothing in the application's UI, geometry, identifiers or data model carries a company, client, contractor or
consultant name. The names that must be identified to cite a document accurately appear only in
`src/data/sources.ts` and in this file.

---

## 2. Confirmed public figures

All from the reference project's public documents. These are the numbers the modelled campus is scaled from.

| Quantity | Value | Source ids |
| --- | --- | --- |
| Site area | ~49 ha (43 ha held + ~6 ha acquired); ~48 ha in the consent decision | `ES-CIVILS`, `ES-AEE`, `ES-RC-DECISION` |
| Site form | roughly 700 m × 700 m rectangle, north–south, 14-18 m ASL falling to ~9-10 m ASL at the southern terrace | `ES-GWTAE`, `ES-WETLAND` |
| Data halls | 6 halls in 3 modules, ~9.5 ha; ~8,210 m2 each in phase 1 | `SDC-POI`, `ES-AEE`, `ES-CIVILS` |
| Hall height | 12 m stated in the AEE; 9.5 m on one site-plan sheet (unreconciled) | `ES-AEE`, `ES-WETLAND` |
| IT capacity | up to 240 MW | `SDC-POI`, `ES-AEE`, `ES-RC-DECISION` |
| GXP | ~4 ha in the north-east, crushed-rock platform, 2.5 m fence, buildings <10 m, gantries to 24 m | `SDC-POI`, `ES-AEE` |
| Grid connection | dedicated HV grid exit point described as 220 kV; four Transpower HV circuits cross the north-east; a 33 kV distribution line runs north through the site | `ES-AEE` |
| Line towers | 2 existing towers replaced with 50 m heavy-duty towers, 2 more built | `ES-AEE` |
| Generators | 84 sets at 3,200 kWe, in 6 blocks of 14, adjacent to the halls | `ES-RC-DECISION`, `ES-S42A`, `ES-EMP` |
| Generator heat | ~5.3 MW per set, 445.2 MW total | `ES-RC-DECISION`, `ES-S42A` |
| Generator fuel | 10,000 L belly tank per set (840,000 L total), 817.7 L/h per set, tanker refuelling per tank | `ES-AEE`, `ES-S42A`, `ES-EMP` |
| Exhaust | 700 mm stacks at 15 m; urea/water (DEF) to a catalytic converter at each block | `ES-S42A`, `ES-EMP` |
| Containment | each block bunded, draining to a full-retention stormwater separator with automatic shutoff | `ES-EMP` |
| Cooling | adiabatic/evaporative; water-glycol cold plates on accelerators carrying 70-80% of the heat; remaining hot air handled by a secondary liquid heat exchanger; evaporation to 15-20 °C; recirculation; described as ~20× the efficiency of conventional cooling | `ES-AEE` |
| Cooling water demand | ~288,000 m3/yr, varying month to month, from a design concept scenario | `ES-CIVILS` |
| Cooling water storage | ~75,000 m3 in sealed reservoirs 1.5-2.0 m below ground level beneath the buildings, ~1.5 months | `ES-CIVILS` |
| Rainfall capture | ~75,000 m3/yr (~13% of site rainfall) from ~30,000 m2 hall roof and ~65,000 m2 hardstand/landscape | `ES-CIVILS` |
| Climate basis | ~1,100 mm/yr long-term average from a 60-year record; pre-development runoff ~167,000 m3/yr | `ES-CIVILS` |
| Groundwater take | up to 7 L/s = 604,800 L/day = 220,752,000 L/yr; anticipated operational ~212,600 m3/yr; bore field of four to five production bores | `ES-PERMIT`, `ES-CIVILS`, `ES-GWTAE` |
| Groundwater context | 41 known bores within 3 km, 8 within 1.5 km, nearest neighbour well ~650 m from site centre; zone allocation limit 44.5 Mm3/yr with ~5.9% allocated | `ES-S42A`, `ES-WETLAND` |
| Potable | 150 m3 tank from 3,000 m2 of support-building roof, separated from cooling water | `ES-CIVILS` |
| Wastewater | up to 5,000 L/day, 5 mm/day, soakage field ≥1,000 m2 (3,360 m2 with reserve), AS/NZS 1547 | `ES-RC-DECISION`, `ES-S42A` |
| Stormwater | swales both sides of the hall area to a southern basin, ~24 h retention, expected to remove up to 80% of sediment and 60% of other pollutants; ~157,000 m3/yr recharge to the wetland | `ES-CIVILS`, `ES-RC-DECISION` |
| Wetlands | 0.24 ha wetland removed (assessed as degraded, no indigenous species); ~13 ha wetland to the south retained and enhanced; new wetland created | `ES-WETLAND`, `ES-RC-DECISION` |
| Wetland hydrology | unmitigated take could lower the southern wetland by up to 1.4 m over 20 years; soakage recharge is the mitigation; borefield pumping test is a consent condition | `ES-WETLAND`, `ES-RC-DECISION` |
| Earthworks | 320,000 m3 cut / 320,000 m3 fill, 170,000 m3 imported aggregate, net fill ~220,000 m3; excavation to 5 m BGL | `ES-CIVILS` |
| Dewatering | up to 60 L/s, up to 5,184 m3/day, for up to two months | `ES-RC-DECISION`, `ES-S42A` |
| Perimeter | bund built from site-won material for noise and visual screening; asphalt/chipseal internal roads; no public access into the development | `ES-CIVILS` |
| Fibre | submarine cable Australia ↔ New Zealand, landfall at a southern beach ~9 km away, bulkhead and beach manhole, trench to an exchange, two diverse terrestrial routes to the site, ring topology across New Zealand plus Sydney and Melbourne; on-site landing station sized for up to three cables | `SDC-POI`, `ES-AEE` |
| Delivery staging | phase 1 = three halls of ~8,210 m2; phase 2 = a small addition (~2,000 m2) to two of the three buildings; the middle building has no phase 2 area | `ES-EMP` |
| Construction management | certified Stage 1 and Stage 2 construction management, traffic management, erosion and sediment control, contaminated soil, ground settlement, landscape and wetland monitoring plans; geotechnical report for pavement design | `SDC-POI` |
| Consents | nine regional consents granted 2026-03-11 for 35 years; district land use consent covering the data centre, GXP, two support towers, hazardous substances and construction noise | `ES-RC-DECISION`, `SDC-POI` |
| Operations | ~60 staff during standard business hours, 24/7 security, 24/7/365 operation | `ES-EMP` |
| Emissions | water vapour from the cooling system may be visible near the site in some conditions; generators may emit light-coloured smoke except during start-up | `ES-RC-DECISION`, `ES-S42A` |
| Redundancy aim | a public submission states the aim was to meet a rating 3 level of the TIA-942 standard for power infrastructure; no certification is public | `ES-AEE`, `IND-TIA942` |

---

## 3. Where sources disagree, and how the application handles it

**240 MW vs 280 MW.** 240 MW IT capacity appears in the consent decision, the AEE and the council summary.
280 MW circulates in developer material and media. The documents do not reconcile them. The application shows
both and explains that they may represent different quantities (IT load vs total facility demand vs a later
planning figure), and explicitly refuses to pick one silently.

**12 m vs 9.5 m hall height.** Both appear in the public record (AEE narrative vs a site-plan sheet note). Both are
shown; the model uses 12 m and says so.

**48 ha vs 49 ha.** The consent decision says ~48 ha; application documents use 49 ha (43 ha held plus ~6 ha).
The model uses 49 ha as the 700 m × 700 m rectangle described in the groundwater report.

**~4 ha vs 64,685 m2 substation area.** Both figures appear. The modelled footprint is smaller than either and
is flagged indicative.

**Two different rainfall-discharge figures.** The servicing report contains a long-term recharge discharge of
about 157,000 m3/yr and, in the paragraph describing a 1% AEP overtopping event, a much smaller figure whose
context is ambiguous in the source. Only the 157,000 m3/yr recharge figure is used in the application; the
overtopping event is described qualitatively.

---

## 4. Derived arithmetic (SIMPLIFIED, clearly labelled)

These are calculations on public inputs, shown to make quantities legible. They are not additional claims.

- **Generation fleet total** — 84 × 3.2 MW = 268.8 MW. Against up to 240 MW of IT that is ~1.1×, and close to
  1.0× once mechanical and electrical auxiliaries are included. Used to explain why an emergency sequence
  includes an explicit, tested load-shed order rather than assuming a redundancy margin.
- **Generator heat total** — 84 × 5.3 MW = 445.2 MW (matches the figure in the s42A report).
- **Water intensity** — 288,000 m3/yr ÷ (240 MW × 8,760 h) ≈ 0.137 kg of water per kWh of IT load, equivalently
  about 0.57 kg per kWh of heat rejected. Used to make the water balance legible: water is the heat rejection
  medium, so water per unit of compute is an outcome of the cooling architecture.
- **Supply gap** — 288,000 m3/yr demand less ~75,000 m3/yr capture ≈ 213,000 m3/yr, which is the same order as
  the consented 220,752 m3/yr take. This explains why the groundwater number and the demand number line up.
- **Roof capture** — the modelled hall roof area (~48,800 m2) exceeds the ~30,000 m2 documented as captured,
  which is consistent with only part of the roof being piped to the reservoirs.

---

## 5. What is NOT public, and is therefore shown as TYPICAL

- transformer count, ratings, connection scheme, protection philosophy
- the MV distribution voltage, switchgear lineups and campus redundancy architecture
- UPS topology, redundancy level, autonomy and battery sizing
- busway and PDU arrangement
- whether CDUs are used, where they sit, their capacity and redundancy; coolant temperatures and fluid
- heat exchanger type, piping routes, pump counts and staging
- adiabatic unit count, size, airflow and redundancy
- cooling water flow rates, temperatures, blowdown volumes
- blowdown volumes at all
- fire protection philosophy
- rack and server counts, IT mix, per-rack density
- the network fabric, optics, device counts
- fuel autonomy, step-load acceptance criteria, generator redundancy architecture
- any programme, cost or schedule for the reference project

Each of these is labelled TYPICAL in the inspector, and each component that depends on one carries a
`publicLimit` note saying what the public record does and does not state.

---

## 6. Construction-sequence refinements

The brief's 33-step sequence was refined to 36 phases using public construction-management practice for
Southland campuses and normal hyperscale sequencing:

1. Site establishment (mobilisation, surveys, environmental controls) is pulled forward as its own certifiable
   phase, which is how the council documents describe it.
2. Temporary dewatering is a single discrete phase matching the consented two-month window, so it appears and
   disappears on the construction slider.
3. Cooling water storage is grouped with **foundations and slabs**, not with the cooling package, because
   ~75,000 m3 of sealed reservoir is cast 1.5-2.0 m below ground level beneath the buildings. That is the single
   most useful non-obvious sequencing insight in the public record: the water system is structural work.
4. Energisation, functional testing, integrated systems testing, phased energisation, reliability
   demonstration and handover are separated, because that is where a hyperscale project actually spends time.
5. Modular delivery is modelled explicitly: modules lag each other, halls are built as capacity is leased, and
   the application explains that a hall is simultaneously a delivery module and a fault domain.

---

## 7. Sources

| id | Type | Publisher | Used for |
| --- | --- | --- | --- |
| `SDC-POI` | council | Southland District Council | Consented scope summary; document register of construction and management plans |
| `ES-RC-DECISION` | consent | Environment Southland | Site area, generator count/rating/heat, water take, wastewater, dewatering, consent term, vapour visibility |
| `ES-AEE` | application | Environment Southland | Module and hall arrangement, adiabatic cooling description, GXP description, grid context, fuel, fibre route |
| `ES-S42A` | application | Environment Southland | Groundwater allocation context, bore neighbours, fuel consumption, exhaust stacks, heat release totals |
| `ES-CIVILS` | application | Environment Southland | Cooling water demand, storage, capture, rainfall basis, recharge, potable, earthworks, bund, stormwater |
| `ES-EMP` | application | Environment Southland | Generator block arrangement, refuelling, containment, hazardous substances, staffing, delivery staging |
| `ES-GWTAE` | application | Environment Southland | Bore field, site geometry and levels, pumping test condition |
| `ES-WETLAND` | application | Environment Southland | Wetland delineation, drawdown, soakage recharge, impervious area, site levels |
| `ES-NOTIF` | application | Environment Southland | Corroboration of scale figures and emissions parameters |
| `ES-PERMIT` | consent | Environment Southland | Groundwater take limits, bore locations, expiry |
| `TP-NEWS` | grid | Transpower | Regional grid context (grid zone, grid exit points, 220 kV transmission, short-term upgrades) |
| `IND-TIA942` | industry | TIA | Rating scale vocabulary (1-4), concurrently maintainable, fault tolerant, cabinet and cabling expectations |
| `IND-CX` | industry | commissioning practice | Commissioning levels, load banks, scripted failure scenarios, hold points, acceptance responsibility |
| `IND-DLC` | industry | liquid cooling practice | Rack densities, CDU architectures and capacity bands, flow per kW, approach temperature, dew-point rule, water temperature classes |
| `IND-GEN` | industry | electrical design material | N / N+1 / 2N / 2(N+1) definitions, fault domain and maintenance claims, generator sizing and load sequence |
| `PRESS-CAP` | press | BusinessDesk | Evidence that a 280 MW figure circulates publicly. Cited only to record that; no cost or programme figure from it is used anywhere in the application |

Full URLs and per-source "used for" notes are in `src/data/sources.ts` and in the in-app **Sources & method**
drawer.