# Hyperscale Data Centre Explorer — Review and Improvement Plan

Repository reviewed: `XdruidR/hyperscale-dc-explorer`

## Overall assessment

This is already a strong foundation. Do **not** rewrite it.

The provenance system, guided journeys, component inspector and “one model, many views” architecture are useful and worth preserving.

The next version should focus much less on adding surface-area features and much more on making the model:

- causal
- internally consistent
- technically rigorous
- closer to how engineers reason through power, cooling, commissioning and delivery

Right now the app teaches breadth very well, but in a few places it confidently teaches the wrong mental model. Fix those before adding more visual polish.

---

# 1. Fix these before adding more features

## 1.1 Water arithmetic and narrative consistency — CRITICAL

`water.ts` calculates approximately:

- `0.137 kg/kWh`
- equivalent to about `0.137 m³/MWh`

But the narrative elsewhere says:

- “roughly 1 m³/MWh”

Those are not the same.

There is also a statement that `0.137 kg/kWh` is “equivalently 0.57 kg/kWh of heat rejected”. That relationship is not clearly derivable from the displayed inputs.

### Improve

Create one canonical calculation object for water intensity and generate every displayed value from it.

For example:

```ts
const waterDemandM3Yr = 288_000
const itLoadMW = 240
const hoursPerYear = 8760

const waterLPerKWh =
  waterDemandM3Yr * 1000 /
  (itLoadMW * 1000 * hoursPerYear)
```

Then use that same calculated value everywhere.

Also:

- remove the `0.57 kg/kWh` statement unless its derivation is explicit
- add tests for rendered/narrative values, not only the raw arithmetic
- avoid manually duplicating calculated quantities in prose strings

---

## 1.2 Separate generator heat from the data-centre cooling loop — CRITICAL

Several parts of the learning material currently imply that the approximately 445 MW of generator heat must be rejected by the main data-centre cooling plant.

That is misleading.

Large standby generators normally have their own heat-rejection systems such as:

- set-mounted radiators
- jacket-water cooling
- aftercoolers
- exhaust heat rejection

They do not normally dump their full engine heat into the IT facility cooling-water loop.

### Improve

Model generator energy separately:

```text
Diesel chemical energy
        ↓
     Engine
   ↙    ↓     ↘
Electric  Radiator  Exhaust
power      heat      heat
  ↓          ↓         ↓
MV bus     ambient   ambient
```

Animate:

`generator → radiator/exhaust → atmosphere`

not:

`generator → data hall cooling system`

The app should explicitly teach that standby generation creates a **second major heat-rejection problem**, but usually through generator-local systems rather than the IT cooling loop.

Reference example:
https://www.cummins.com/en-apac/generators/products/qsk23

---

## 1.3 Make commissioning state asset-specific — CRITICAL

The UI talks as though commissioning status belongs to individual components.

But the current store appears to track:

```ts
cxDone: string[]
```

That means completing something such as `functional-test` effectively makes that stage complete globally.

The inspector then says things such as:

> this rack has completed X of Y tests

and `blockersFor()` talks about specific upstream equipment.

This gives the appearance of asset-level logic without actually having asset-level commissioning state.

### Improve

Change commissioning state to something closer to:

```ts
commissioning: {
  [componentId: string]: {
    [stageId: string]: {
      status: 'not-started' | 'ready' | 'in-progress' | 'complete' | 'failed'
      date?: string
      evidence?: string[]
    }
  }
}
```

Or, preferably, track commissioning against **systems / turnover packages** rather than every tiny component.

Example:

```text
M1 Electrical Train A
M1 Electrical Train B
M1 Cooling Loop A
M1 Cooling Loop B
M1 Data Hall White Space
M1 Network Fabric
M1 Controls
```

Then a rack can genuinely be blocked because:

```text
Rack R-101
  requires:
    LV Bus A commissioned
    LV Bus B commissioned
    CDU loop commissioned
    leak detection tested
    network fabric ready
    controls points proven
```

That turns commissioning from a staged checklist into real dependency logic.

---

## 1.4 Add the generators to the actual electrical flow graph — CRITICAL

The electrical flow graph currently models roughly:

```text
Grid
→ GXP
→ campus MV
→ hall transformer
→ UPS
→ LV
→ busway
→ rack
→ GPU
```

But the generator blocks do not meaningfully feed an emergency bus in the main graph.

This means the utility-loss animation is more narrative than electrical-state logic.

### Improve

Add a generic emergency-power path:

```text
Generator
→ generator switchgear
→ synchronising/paralleling
→ emergency MV bus
→ hall distribution
→ critical loads
```

Then represent utility and generator feeds as actual alternative sources.

For example:

```text
GRID SOURCE
    │
    ├── GXP → MV BUS ──────────┐
    │                          │
GENERATOR BLOCK → GEN BUS ─────┤
                               ↓
                         HALL DISTRIBUTION
                               ↓
                              UPS
                               ↓
                              RACK
```

Utility-loss mode should then actually:

1. remove grid source
2. show battery/UPS ride-through
3. start generator sets
4. synchronise generation
5. close generator source to emergency bus
6. restore selected mechanical loads
7. apply shedding if required

---

## 1.5 Unify construction status logic — HIGH

There appear to be two separate module-lag models.

In `store.ts`:

```ts
MODULE_SHIFT = {1: 0, 2: 4, 3: 8}
```

with proportional lag.

In `ModePanel.tsx`:

```ts
const shift = (module - 1) * 8
```

These are not the same model.

There also appears to be a status calculation using:

```ts
[0, 1, 2]
```

even though module numbering is 1–3.

### Improve

Create a single canonical function such as:

```ts
getModuleReadiness(moduleId, programmeDate)
```

Everything should derive from that.

Delete duplicate timeline logic from the UI.

---

## 1.6 Replace the sequential construction programme with a network programme — HIGH

The current construction model effectively adds durations sequentially.

Real hyperscale delivery has major parallel workstreams:

- grid/GXP
- earthworks
- buildings
- generator procurement
- cooling procurement
- MV/LV
- controls
- network
- commissioning
- IT fitout

These overlap heavily.

### Improve

Replace the 36 sequential phases with a proper synthetic activity network.

Aim for perhaps 150–300 activities.

Example structure:

```text
SITE
  Enabling works
  Bulk earthworks
  Drainage
  Roads
  Underground services

GXP
  Design
  Procurement
  Transformer manufacture
  FAT
  Civil platform
  Structure
  HV installation
  Protection
  Energisation

MODULE 1
  Hall structure
  Envelope
  MV/LV
  UPS
  Generators
  Cooling plant
  Controls
  Fire
  Network
  IT fitout
  Commissioning

MODULE 2
  ...

MODULE 3
  ...
```

Include:

- logic links
- activity durations
- procurement lead times
- FAT
- shipping
- installation
- energisation
- commissioning
- handover

Keep the 3D construction slider, but drive it from real activity dates.

This is probably the highest-value improvement for a project-controls user.

---

## 1.7 Improve AI networking model — HIGH

The current networking explanation is too simplified in places.

For example:

> a spine failure is not a capacity event

That is not generally safe to say.

A spine failure can reduce available network capacity unless the fabric was explicitly designed with sufficient spare capacity.

Also, the training-data explanation currently mixes dataset reads and checkpoint behaviour.

### Improve

Split networking into separate layers:

### External / WAN

```text
Subsea cable
→ landing station
→ external routing
→ campus edge
```

### Management network

```text
BMC
→ management switches
→ operations / automation
```

### Storage / front-end fabric

```text
storage
↔ compute
```

### Accelerator / east-west fabric

```text
GPU
↔ GPU
↔ GPU
```

Teach that modern AI facilities can be limited by:

- fabric bandwidth
- optics
- topology
- congestion
- oversubscription
- collective-communications patterns

Reference example:
https://www.cisco.com/c/en/us/td/docs/solutions/Enterprise/Data_Center/DC_Infra2_5/DCInfra_1.html

---

## 1.8 Improve rack-level power model — HIGH

The current model implies:

```text
400/415 V three-phase
→ rack PDU
→ 230 V single-phase
→ server
```

That is one possible arrangement, but modern AI rack-scale systems can carry three-phase power much deeper into the rack.

Some modern systems also convert AC to a DC bus inside the rack.

### Improve

Add rack archetypes.

For example:

#### Conventional cloud rack

```text
10–20 kW/rack
air cooled
dual-corded server PSUs
```

#### High-density hybrid rack

```text
30–70 kW/rack
air + liquid cooling
```

#### AI rack-scale system

```text
~100–150+ kW/rack
direct liquid cooling
high-power three-phase input
rack power shelves
DC busbars
very high east-west network bandwidth
```

Reference example:
https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html

Also useful:
high-density 415 V three-phase rack PDUs from vendors such as Schneider.

The app should teach that there is no single universal “rack power architecture”.

---

## 1.9 Make provenance granular at statement level — HIGH

The provenance system is excellent at component level.

But a component can be marked `PUBLIC FACT` while some technical bullets below it are generic engineering assumptions.

### Improve

Use structured claims instead of free-text arrays.

Example:

```ts
interface Claim {
  text: string
  classification:
    | 'PUBLIC FACT'
    | 'TYPICAL'
    | 'SIMPLIFIED'
    | 'SYNTHETIC'
  sources?: string[]
  formula?: string
}
```

Then component content becomes:

```ts
technical: [
  {
    text: '84 emergency generators are publicly documented',
    classification: 'PUBLIC FACT',
    sources: ['ES-RC-DECISION']
  },
  {
    text: 'Generator start sequencing is typically staggered',
    classification: 'TYPICAL',
    sources: ['IND-GEN']
  }
]
```

This would make evidence mode substantially more trustworthy.

---

## 1.10 Strengthen industry sources — MEDIUM

The council and consent sources are strong.

Some generic industry references are weaker third-party guide sites.

### Improve

Prefer primary or near-primary sources from:

- TIA
- Uptime Institute
- ASHRAE
- Open Compute Project
- NVIDIA
- Schneider Electric
- Vertiv
- Cummins
- Caterpillar
- major UPS / switchgear manufacturers
- major network vendors

For commissioning, Uptime Institute material on integrated testing is particularly useful:

https://journal.uptimeinstitute.com/tiercertificationpreparation/

---

# 2. Add synchronized schematic views

Keep the 3D model.

But 3D is best for:

> Where is it?

It is much worse for:

> How does it work?

Add synchronized engineering diagrams.

---

## 2.1 Electrical single-line diagram

Power mode should have a proper simplified SLD.

For example:

```text
220 kV GRID
   │
  GXP
   │
TRANSFORMERS
   │
 CAMPUS MV
   ├────────────┐
   │            │
MODULE 1      MODULE 2
   │
HALL MV
   │
MV/LV TRANSFORMER
   │
UPS A ─────┐
           ├── BUSWAY A ── RACK PSU A
UPS B ─────┘
              BUSWAY B ── RACK PSU B
```

Include generator paths.

Clicking an SLD asset should select the matching 3D object.

Clicking the 3D object should highlight it on the SLD.

---

## 2.2 Cooling process-flow diagram

Create a PFD-style cooling view.

Example:

```text
GPU DIE
  ↓ heat
COLD PLATE
  ↓
TECHNOLOGY COOLING LOOP
  ↓
CDU
  ↓
FACILITY WATER LOOP
  ↓
HEAT EXCHANGER / HEAT REJECTION
  ↓
OUTSIDE AIR
```

Show:

- supply temperature
- return temperature
- heat load
- flow
- public vs typical assumptions
- liquid vs air fraction

Do not invent exact design numbers unless clearly labelled synthetic.

---

## 2.3 Water Sankey / balance

Show water visually:

```text
RAINWATER ─────┐
               ├── STORAGE ── COOLING ── EVAPORATION
GROUNDWATER ───┘       │
                       └── BLOWDOWN

STORMWATER → TREATMENT → RECHARGE → WETLAND
```

Quantities should be proportional where possible.

---

## 2.4 Network topology

Provide a logical topology in addition to the physical campus.

Separate:

- WAN / external
- campus core
- storage
- management
- accelerator fabric

This is far more useful than showing only fibre geometry in 3D.

---

# 3. Make the app causal rather than descriptive

The Resilience mode is one of the best ideas in the app.

But failures should change the actual state of the model.

Create a lightweight capacity/state engine.

It does not need to be engineering-design software.

---

## Example

Fail one GXP transformer.

The system should calculate:

```text
Available utility import: 180 MW
Live IT demand: 160 MW
Mechanical load: 24 MW
Margin: -4 MW
```

Result:

```text
DEGRADED

Required:
- start generation
or
- shed 4 MW+
```

Fail another generator:

```text
Available generation:
268.8 MW
- 3.2 MW failed
- derating
- maintenance unavailable
= 252 MW available
```

Then compare to current load.

---

# 4. Separate three different graphs

Do not use one graph for everything.

Create three explicit graph types.

---

## 4.1 Physical flow graph

Answers:

> Where does energy / water / data / heat travel?

Examples:

```text
grid → transformer → UPS → rack
GPU → coolant → CDU → heat exchanger
```

---

## 4.2 Operational dependency graph

Answers:

> What stops working if this component disappears?

Example:

```text
Cooling Pump P-101 fails
→ Cooling Loop A degraded
→ Hall 1 thermal capacity reduced
→ Rack load limit reduced
```

---

## 4.3 Delivery / commissioning dependency graph

Answers:

> What must be complete before this can be installed, tested or handed over?

Example:

```text
Rack energisation
requires:
  busway tested
  UPS functional test complete
  controls integrated
  cooling available
  fire system enabled
```

These graphs overlap, but they are not the same thing.

---

# 5. Make project controls a major part of the product

This could become the app’s strongest differentiator.

---

## 5.1 Add real synthetic programme logic

For each important asset/system track:

```text
Design
Procurement
Manufacture
FAT
Shipping
Delivery
Installation
Testing
Energisation
Commissioning
Handover
```

Example transformer lifecycle:

```text
Design approved
→ specification frozen
→ purchase order
→ manufacture
→ FAT
→ shipment
→ foundations ready
→ delivery
→ assembly
→ oil processing / inspections
→ electrical testing
→ protection integration
→ energisation
→ functional test
→ IST
→ operations handover
```

---

## 5.2 Link every physical object to delivery information

Each object/system should have:

- WBS
- work package
- system
- turnover package
- commissioning package
- activity IDs
- milestones
- predecessor relationships
- procurement status
- construction status
- commissioning status
- readiness-for-service status

---

## 5.3 Add useful project-controls questions

The app should help answer:

> Why can’t this hall energise?

> Which long-lead item currently controls Ready for Service?

> Which packages cross the building / M&E / commissioning boundary?

> What must be complete before IST?

> Which systems are on the critical path?

> What is blocking Hall 2 handover?

---

# 6. Add different data-centre archetypes

Avoid letting one synthetic architecture become “what hyperscale data centres look like”.

Let the user switch one representative hall between architectures.

---

## Archetype A — conventional cloud

Example characteristics:

- lower rack density
- mostly air cooling
- conventional dual-cord rack power
- less extreme accelerator fabric

---

## Archetype B — hybrid high density

Example characteristics:

- moderate/high rack density
- direct liquid cooling for accelerators
- residual air cooling
- CDUs
- larger busway / distribution requirements

---

## Archetype C — rack-scale AI

Example characteristics:

- ~100–150+ kW/rack
- liquid cooling dominant
- high-power three-phase supply
- rack power shelves
- DC busbar internally
- extreme east-west network bandwidth

Then let changing the archetype recalculate:

```text
IT MW
→ rack density
→ rack count
→ electrical distribution
→ cooling capacity
→ water requirement
→ network requirements
```

---

# 7. Add a flagship learning journey: FOLLOW 1 MW

This would be extremely valuable.

Start with:

# 1 MW enters a data hall

Follow it through:

```text
Grid/MV
↓
Transformer losses
↓
UPS losses
↓
LV distribution
↓
Rack
↓
Compute
↓
Heat
↓
Cooling system
↓
Atmosphere
```

Show where the energy goes.

Then scale the same model:

```text
1 rack
→ 1 MW
→ 40 MW hall
→ 240 MW campus
```

This would make scale much easier to understand.

---

# 8. Add another flagship journey: FOLLOW ONE HALL

Follow one data hall through the project lifecycle.

Example:

```text
Business need
→ concept design
→ planning / consents
→ detailed design
→ enabling works
→ civil platform
→ foundations
→ structure
→ envelope
→ M&E installation
→ cooling
→ controls
→ network
→ energisation
→ commissioning
→ IT install
→ IST
→ ready for service
```

At each step show:

- physical change
- programme activities
- package owner
- prerequisite
- risk
- milestone
- commissioning state

---

# 9. Improve the inspector

The inspector is already one of the strongest parts.

Add four sections for important equipment.

---

## What should I understand?

Short technical explanation.

---

## What interface usually causes trouble?

Examples:

- HV owner / campus boundary
- controls interface
- mechanical/electrical coordination
- cooling loop cleanliness
- protection settings
- firmware compatibility
- fuel logistics

---

## What should project controls track?

Examples:

- design release
- submittal approval
- FAT
- delivery date
- installation
- test packs
- energisation
- commissioning
- punch-list closure

---

## What question should I ask in a meeting?

Example for a transformer:

> What is the current constraint to energisation: transformer readiness, protection, upstream utility interface, or downstream switchgear readiness?

For a CDU:

> What is the demonstrated N/N+1 capacity at the current design water temperatures?

For a hall:

> What systems remain outside the turnover boundary preventing Ready for Service?

---

# 10. Improve testing philosophy

The current self-test suite is strong at **referential integrity**.

Keep it.

Add semantic tests.

Examples:

```text
Every displayed calculated quantity comes from a canonical calculation.
```

```text
Every operational source has a valid path to its critical loads.
```

```text
When grid supply is lost and generators are unavailable, UPS energy decreases.
```

```text
A commissioned rack cannot exist unless required power and cooling systems are commissioned.
```

```text
A module cannot be Ready for Service before its required IST package is complete.
```

```text
No UI narrative may contain a manually duplicated derived number.
```

```text
Every PUBLIC FACT sentence has at least one public source.
```

---

# 11. What to preserve

Do not throw away the things that are already working.

Keep:

- PUBLIC FACT / TYPICAL / SIMPLIFIED / SYNTHETIC
- fictional Southland campus
- public evidence basis
- declarative component model
- guided journeys
- inspector
- evidence drawer
- instanced geometry
- static/offline architecture
- simple local deployment
- system isolation
- cutaway / roof-off view
- construction timeline concept

---

# 12. What not to prioritise yet

Do **not** spend the next iteration mainly on:

- photorealistic buildings
- better trees
- BIM imports
- shaders
- authentication
- multiplayer
- cloud deployment
- decorative UI
- more component types for their own sake

The learning model matters more.

A beautifully rendered wrong cooling loop is still wrong.

---

# 13. Recommended build order

## Phase 1 — correctness

Fix:

1. water arithmetic
2. generator heat logic
3. construction-state duplication
4. rack power descriptions
5. networking statements
6. provenance granularity

---

## Phase 2 — model architecture

Separate:

1. physical flow graph
2. operational dependency graph
3. delivery/commissioning dependency graph

Make commissioning asset/system-specific.

Add emergency generator electrical paths.

---

## Phase 3 — engineering schematics

Add synchronized:

1. electrical SLD
2. cooling PFD
3. water Sankey
4. network topology

---

## Phase 4 — project delivery model

Replace sequential phases with:

- synthetic CPM-style programme
- procurement activities
- FAT
- logistics
- installation
- commissioning
- turnover packages
- Ready for Service milestones

---

## Phase 5 — simulation

Add calculated:

- source availability
- MW capacity
- generator availability
- UPS ride-through
- cooling capacity
- load shedding
- fault consequences

---

## Phase 6 — learning depth

Add:

- conventional / hybrid / AI hall archetypes
- Follow 1 MW
- Follow One Hall
- richer inspector prompts
- design-review questions

---

# Final product direction

The app should evolve from:

> an impressive interactive 3D explanation of a hyperscale data centre

into:

> an interactive systems-and-delivery model that teaches how a hyperscale data centre physically works, how its systems depend on one another, how it is built and commissioned, and why particular interfaces become project risks.

The existing repo is already a good base for that.

Do not rebuild it. Deepen it.
