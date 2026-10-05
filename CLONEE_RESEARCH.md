# Clonee Research Register

Prepared for the Clonee Hyperscale Data Centre Explorer. Everything in this
file is either a published fact with a source, or an explicitly labelled
assumption. Nothing here is asserted in the application that is not in this file.

Reference project: Meta (formerly Facebook) data centre campus, Clonee, County
Meath, Ireland.

---

## 1. Source register

| Id | Publisher | Document | Kind | What it establishes |
|---|---|---|---|---|
| `MCC-150605` | Meath County Council | Planning application RA150605, original campus consent | Consent | Site area, two original buildings, floor areas, four halls per building, 36 MW per building, underground 20 kV cables, generators, cooling, tanks, drainage, roads, security |
| `MCC-180671` | Meath County Council | Planning application RA180671, expansion consent | Consent | Two additional buildings, additional floor area, further admin building, additional generators, roads, drainage, parking, security |
| `BP-VA0018` | An Bord Pleanála | Planning report VA0018, 220 kV substation | Council | Substation compound area, 12 × 220 kV bays, three step-down transformers, 27 lightning masts, control and MV buildings, two new transmission towers, loop-in connection |
| `EIR-AR2017` | EirGrid | Annual Report 2017 | Grid | 220 kV station completed August 2017, customer-built, first customer-built 220 kV station in Ireland, approximately 15 months |
| `EPA-P1192` | EPA Ireland | Industrial Emissions Licence P1192-01 | Environment | Five data-storage buildings CLN1/CLN2/CLN3/CLN5/CLN6, 90 diesel generators, generator operating conditions, residual evaporative cooling-water discharge, stormwater |
| `META-2019` | Meta | Expansion announcement, 6 March 2019 | Operator | Two new buildings, nearly 150,000 m² total, LEED Gold, Ireland's Green Construction Award, 97% construction waste recycled |
| `META-DC` | Meta | Data centres location and facility pages | Operator | Current facility information, 219 MW campus figure, €1.4bn cumulative investment, 1,500 skilled trades at peak construction |
| `SNWA-FB` | studioNWA | Facebook — Clonee project page | Industry | Contractor Mace; studioNWA architect; Cundall M&E and civil/structural; three bars on 227 acres; four halls of ~4,170 m² per building; ~11,000 m² plant per building; two meet-me rooms per building; 108 MVA supply; indirect air cooling; 75,000 m² IT; 2.24 kW/m²; 97,000 m² total; RIBA 7 CLN1 2017, CLN2 2018, CLN3 2019; phase 1 complete Q4 2017; CLN2 handover May 2018 |
| `ICE-2018` | Irish Construction Excellence Awards | 2018 winners | Industry | Clonee Data Centre, County Meath won Industrial Over €10m, contractor Mace, gala 23 March 2018 |
| `JP-SUB` | John Paul Construction | 220 kV substation, Clonee — design-and-build civil and structural | Industry | ~17,000 m² compound, €6.2m, 11 months, 105 equipment bases, 16 RC bases for 30 m mono-pole lightning masts, two transformer bunds holding 18,500 kg transformers with 8,500 L oil, 380 m cable troughing, two transmission-owner buildings |
| `IND-MMD` | Mitchell McDermott | Data Centre InfoCard 2025–2026 | Industry | Irish cost benchmarks on a development basis: €11–14m per MW for 10–20 MW white space, €14.5–19m for a 110 kV substation; design norms 5–10 kW/rack, 2–3 m²/rack, 70% white space |
| `IND-SAV` | Savills / Turner & Townsend | European data centre cost benchmark 2023–24 | Industry | Europe $9.1m/MW, Dublin $8.8m/MW; land $0.28–0.86m/MW; shell $0.90–1.83m/MW; redundancy premium 25–40% |
| `PRESS-ECO` | Department of Enterprise / Irish Times | Clonee phase 1 and investment coverage | Press | Phase 1 site start April 2016, opening September 2018 (~29 months); €300m announced for two buildings and up to 72 MW |
| `STD-TIA942` | TIA | ANSI/TIA-942 | Standards | Availability rating definitions and concurrently maintainable terminology |
| `STD-CX` | ASHRAE / Construct and Commission | Data centre commissioning guideline | Standards | The L0–L6 commissioning level structure |
| `IND-LC` | STT / Vertiv / Schneider | Liquid cooling retrofit guidance | Industry | The discriminator between air-primary and water-primary halls; the 90/10 air-to-liquid split at rack level |
| `IND-NVDA` | NVIDIA | GB200 / GB300 NVL72 documentation | Industry | Rack-scale AI system power, dimensions and power delivery, for the AI comparison only |
| `IND-ACUE` | ASHRAE / CIBSE | Thermal guidelines | Standards | Recommended envelopes, supply temperature ranges, WUE definition |
| `IND-UPTIME` | Uptime Institute | Global Data Centre Survey | Industry | Typical design practice for generator sizing, cooling and redundancy |

---

## 2. Main project facts

### Site
- Consented site area: approximately **95.5 ha** (`MCC-150605`). The design record describes the three original bars on **227 acres**, about 92 ha (`SNWA-FB`), and states the campus will cover **85 ha** when complete including roads and landscaping (`SNWA-FB`). All three figures are carried; the model uses 95.5 ha.
- Flat greenfield agricultural land, County Meath. Modelled as a 1,020 m × 940 m rectangle.

### Buildings
- The industrial emissions licence names **five data-storage buildings: CLN1, CLN2, CLN3, CLN5, CLN6** (`EPA-P1192`). **There is no CLN4**, and the application preserves that gap everywhere.
- Four data halls per building (`MCC-150605`, `SNWA-FB`), each of approximately **4,170 m²** (`SNWA-FB`).
- Internal plant area of approximately **11,000 m² per building** (`SNWA-FB`).
- Two meet-me rooms for data connectivity per building (`SNWA-FB`).
- Floor areas: CLN1 and CLN2 approximately **25,400 m²** each (`MCC-150605`); CLN3 **28,320 m²** as a single-bar building with distribution and administration space (`SNWA-FB`); CLN5 and CLN6 derived from the **57,400 m²** expansion total (`MCC-180671`).
- Total floor area **nearly 150,000 m²** after expansion (`META-2019`).

### Capacity
- **36 MW data capacity per building** (`MCC-150605`). Across five buildings that is **180 MW IT**, which is the model's campus figure.
- Published IT area **75,000 m²** at **2.24 kW/m²** (`SNWA-FB`), which multiplies to **168 MW**. The two independent public routes agree to within about 7%.
- Per hall: 9 MW over 4,170 m² is **2.16 kW/m²**, against the published 2.24 kW/m² — a 4% agreement between the consent and the design record.
- **108 MVA supply** for the three original buildings (`SNWA-FB`), which is 3 × 36 MW at approximately unity power factor, i.e. the IT feed rather than the whole facility draw.
- Operator's current published campus figure: **219 MW**, €1.4bn cumulative investment (`META-DC`).

### Grid connection
- **220 kV** connection, outdoor air-insulated switchgear, **12 bays**, **3 step-down transformers**, **27 lightning-protection masts**, compound of approximately **30,100 m²** (`BP-VA0018`).
- **Loop-in** connection to the existing 220 kV transmission system, with **two new transmission towers** (`BP-VA0018`).
- Campus distribution **underground at 20 kV** between the substation and the buildings (`MCC-150605`).
- The station was **completed in August 2017**, **constructed by the customer**, connected by EirGrid to the transmission system, the **first customer-built 220 kV station in Ireland**, in **approximately 15 months** (`EIR-AR2017`).
- The substation civil and structural package alone was approximately **17,000 m², €6.2m, 11 months**, with 105 equipment bases, 16 bases for 30 m mono-pole lightning masts, two transformer bunds holding **18,500 kg** transformers with **8,500 L** of oil, and **380 m** of cable troughing (`JP-SUB`).

### Generation
- **90 diesel generators** across the five-building campus (`EPA-P1192`).
- The licence permits operation on loss of grid supply, on instability or reduction of grid supply, during maintenance, and when the transmission system operator requests a grid reduction (`EPA-P1192`).
- **Not published:** ratings, make, per-building distribution, tank sizes, stack heights, test regime.
- **Modelled:** 18 per building by even division, at **2.5 MW** each, giving **45 MW per building** against 36 MW of IT — a 1.25× ratio, which is normal hyperscale practice and leaves room for the mechanical load a hall cannot run without. 225 MW campus total. This sizing is corroborated by derivation: 180 MW IT at N+1 divided among 90 sets lands at about 2.4 MVA per set, a standard package size.

### Cooling
- **Indirect air cooling** (`SNWA-FB`).
- The licence refers to **residual evaporative cooling-water discharge** (`EPA-P1192`), which implies an evaporative-assisted indirect arrangement rather than a purely dry one.
- **Not published:** unit counts, unit ratings, water temperatures, control logic, flow rates.
- **Modelled:** 24 rejector units per building in two banks, heat exchanger skids, six pumps per building, and an evaporative assist carrying **10% of annual heat**. The fraction is small because Ireland has almost no cooling degree days: outside-air economisers carry the load for most of the year and the evaporative stage assists only in the hottest hours. This reading reconciles an air-side cooling description with a water discharge licence.

### Water
- **Not published:** volumes, water quality limits, flow rates.
- **Derived** from the heat rejected and the climate: evaporation, blowdown, total discharge, water use effectiveness, wellfield capacity, attenuation capture. All in `src/data/calculations.ts`.

### Data and network
- Overland fibre, not a subsea landing. Two meet-me rooms per building (`SNWA-FB`).
- **Modelled:** two diverse terrestrial routes, a campus aggregation core, per-hall fabric.

### Construction and delivery
- Contractor **Mace**; contractor's architect **studioNWA**; mechanical/electrical and civil/structural engineer **Cundall** (`SNWA-FB`, `ICE-2018`).
- **RIBA stage 7: CLN1 2017, CLN2 2018, CLN3 2019** (`SNWA-FB`).
- Phase 1 completed in the **final quarter of 2017**: four halls of approximately **16,400 m²** fitted out, administration facilities, delivery systems, all internal and external roads, car parking, and the 220 kV substation (`SNWA-FB`).
- CLN2 fit-out began in **Q4 2017** and handed over in **May 2018** (`SNWA-FB`).
- Phase 1 site start **April 2016**, opening **September 2018** — approximately **29 months** (`PRESS-ECO`).
- Expansion construction announced **March 2019**, two new buildings (`META-2019`).
- Won **Industrial Over €10m** at the Irish Construction Excellence Awards, gala 23 March 2018 (`ICE-2018`), which places phase 1 as complete by that date.
- **Peak workforce 1,500 skilled trades** on the mature campus (`META-DC`) — about 6.8 workers per MW.

### Sustainability
- **LEED Gold** certification for the earlier buildings, December, and **Ireland's Green Construction Award** (`META-2019`).
- **97% of construction waste recycled** in the first two buildings (`META-2019`).
- Power distributed to the substation described as from **100% renewable sources** (`SNWA-FB`).

---

## 3. Phase history

| Phase | Date | Event |
|---|---|---|
| 0 | early 2015 | Greenfield site |
| 1 | 2015 | RA150605 granted: 95.5 ha, two buildings, 36 MW each |
| 2 | 2015 | VA0018 substation consented: 220 kV, 12 bays, 3 transformers |
| 3 | 2015–16 | Mobilisation, surveys, erosion control |
| 4 | 2016 | Bulk earthworks, platforms, roads |
| 5 | 2016 | Substation platform, two new transmission towers |
| 6 | 2016–17 | 220 kV AIS, 27 masts, substation buildings |
| 7 | 2017 | Three step-down transformers delivered and set |
| **8** | **August 2017** | **220 kV station energised. The hinge of the programme.** |
| 9 | 2016–17 | CLN1 shell, plant, administration |
| 10 | 2017 | CLN1 fit-out |
| 11 | Q4 2017 | CLN1 commissioned, four halls ~16,400 m² |
| 12 | Q4 2017–May 2018 | CLN2 fit-out and handover |
| 13 | 2018 | RA180671 granted: two more buildings, further admin building |
| 14 | 2018–19 | CLN3 single-bar building |
| 15 | 2019 | CLN3 fit-out |
| 16 | 2019 | CLN3 commissioned — three buildings, twelve halls |
| 17 | 2019–20 | CLN5 shell and plant; expansion announced March 2019 |
| 18 | 2020 | CLN6 shell and plant, alongside an operating campus |
| 19 | 2020–21 | CLN5 fit-out |
| 20 | 2021 | CLN6 fit-out |
| 21 | 2021 onward | Mature five-building campus: 90 generators, one 220 kV substation |
| 22–23 | modelled | AI retrofit feasibility and a modelled conversion of CLN2 hall 3 |
| 24 | open | The boundary of the public record |

---

## 4. Electrical architecture

Published: the 220 kV loop-in, 12 AIS bays, 27 masts, three step-down
transformers, a customer MV building, and underground 20 kV distribution to the
buildings.

Modelled from typical practice: transformer ratings at 3 × 90 MVA (giving 270
MVA against a facility draw of about 234 MW, with a genuine N-1 shortfall of
roughly 54 MW when one is lost); MV lineup arrangement; unit substations; UPS A/B
per building; busway; dual-feed rack PDUs; and the emergency bus that generation
closes onto.

The N-1 case is the most instructive thing on the site that is not published:
losing a transformer does not black out the campus, but it does mean the campus
cannot carry everything, and load must be shed in priority order.

## 5. Cooling

Published: indirect air cooling, an IT power density of 2.24 kW/m² over
75,000 m², and a licence that contemplates residual evaporative cooling-water
discharge.

Modelled: heat exchanger skids in each building's plant corridor, 24 rejector
units in two banks, six pumps per building, in-hall air cooling units serving the
halls, and a shared cooling water treatment plant. No coolant loop exists inside a
hall as delivered — that absence is the point of the AI Evolution mode.

## 6. Civil systems

Published: internal roads, parking, guard house, a second administration building
under the expansion consent, and drainage.

Modelled: the road network as a perimeter ring, a central spine, service roads
behind each building row, cross roads between buildings and a gate approach;
generator compounds behind each bar; an attenuation basin; a wellfield; a
treatment plant; a receiving watercourse interface.

## 7. Building data

| Building | Consent | Floor area | Basis | IT | Shell | Fit-out | Handover |
|---|---|---|---|---|---|---|---|
| CLN1 | RA150605 | 25,400 m² | Published | 36 MW | 2016–17 | 2017 | Q4 2017 |
| CLN2 | RA150605 | 25,400 m² | Published | 36 MW | shell in phase 1 | Q4 2017–2018 | May 2018 |
| CLN3 | RA180671 | 28,320 m² | Published | 36 MW | 2018–19 | 2019 | 2019 |
| CLN5 | RA180671 | 28,700 m² | Derived | 36 MW | 2019–20 | 2020–21 | 2021 |
| CLN6 | RA180671 | 28,700 m² | Derived | 36 MW | 2020 | 2021 | 2021 |

Each building: four halls of ~4,170 m², ~11,000 m² of plant, 18 generators,
720 racks per hall modelled at about 12.5 kW each.

## 8. Environmental information

Industrial Emissions Licence P1192-01 governs the campus. It covers the five
buildings, 90 generators and their operating conditions, evaporative
cooling-water discharge, and stormwater. Generator emission limits, stack heights
and test regimes sit in the licence and its inspector reports and are not
reproduced here; the model does not assert them.

## 9. Unknowns

These are the gaps. The application labels everything it fills in.

1. **Single-line diagrams.** No campus one-line diagram is public.
2. **Generator ratings and distribution.** 90 sets are published. Nothing else is.
3. **Transformer ratings.** Three are published. No ratings, no impedance.
4. **Switchgear lineups.** MV, LV and UPS architecture are not published.
5. **UPS autonomy.** Existence only.
6. **Cooling plant counts, ratings, temperatures, control logic.**
7. **Achieved redundancy rating.** TIA-942 terminology is used; no rating is claimed.
8. **Internal layout.** Racks, containment, aisle widths, floor loading.
9. **Historical programme and cost data.** No project-controls history is public.
10. **Expansion building dimensions.** RA180671 gives the combined area only.
11. **Water volumes and quality limits.**
12. **Why there is no CLN4.** Not explained in any source found.

## 10. Assumptions

Every assumption, with its reason, lives in `ASSUMPTIONS` in
`src/data/calculations.ts`. Each carries a classification and a written
justification so the interface can show why a number had to be invented. The
load-bearing ones are: 2.5 MW per generator, 90 MVA per transformer, a 10%
evaporative assist fraction, 720 racks per hall, and Irish design norms for
rainfall and runoff.