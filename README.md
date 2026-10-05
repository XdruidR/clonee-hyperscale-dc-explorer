# Clonee Hyperscale Data Centre Explorer

An interactive 3D learning environment for the Meta data centre campus at Clonee,
County Meath, Ireland.

The Clonee campus is a real, operating, publicly documented hyperscale project:
five data-storage buildings named CLN1, CLN2, CLN3, CLN5 and CLN6 (there is no
CLN4, and the application preserves that gap), twenty data halls, ninety diesel
generators, and a dedicated customer-built 220 kV substation that EirGrid records
as the first of its kind in Ireland.

This application reconstructs that campus as a teaching model. It is not a
digital twin and it is not a design. Every claim it makes carries its own
provenance, and the boundary of the public record is a visible part of the
product rather than a disclaimer buried in it.

---

## The one rule

Four classifications, applied to every statement in the model:

| Label | Meaning |
|---|---|
| **PUBLIC FACT** | Stated in publicly available documentation for the Clonee project, with a cited source. |
| **DERIVED** | Arithmetic on published inputs, or deliberately simplified so the model can be rendered. The arithmetic is shown. |
| **TYPICAL** | Accepted hyperscale design practice from industry material. Not a statement about Clonee. |
| **SYNTHETIC** | Invented, to demonstrate a delivery or project-controls concept. Never a project fact. |

The classification is available on labels, on component claims and in the fact
register. It is never obstructive — a reader is never made to read a disclaimer
before they can use the model.

---

## Modes

| Mode | What it does |
|---|---|
| **Campus** | The five-building campus, the capacity figures that disagree, and how to read the model. |
| **Power** | Electricity from the 220 kV loop-in to a rack, with a scripted utility-loss sequence. |
| **Cooling** | Heat from the IT equipment to ambient, through an indirectly air-cooled plant. |
| **Water** | Where cooling and site water enters, circulates and leaves, and why a wet country holds a discharge licence. |
| **Data** | External fibre to the servers, through the meet-me rooms and the campus core. |
| **Resilience** | Inject failures and watch the response, including the transformer N-1 case. |
| **Construction** | Build the campus through 25 phases anchored to real dates, from 2015 consent to the mature campus. |
| **Commissioning** | Turnover packages with real dependency blocking, from factory testing to handover. |
| **Project Controls** | WBS, budget, earned value, risks, changes and milestones on a data-date scrub. |
| **AI Evolution** | Convert a delivered hall to rack-scale liquid-cooled compute, and find out what actually stops you. |

Eight guided journeys run along the bottom of the screen, each moving the camera
and lighting only what matters at that step.

---

## What the model is good for

**The 15-month grid connection.** EirGrid records the Clonee 220 kV station as
completed in August 2017, built by the customer and connected in approximately 15
months — the first customer-built 220 kV station in Ireland. The planning
consent for it describes a compound of roughly 30,100 m² with 12 × 220 kV bays,
three step-down transformers, 27 lightning masts, two new transmission towers and
a loop-in connection. It is the best-documented part of the site and the hardest
part of any hyperscale programme.

**The capacity figures that disagree.** 36 MW per building from the consent, 180
MW summed across five buildings, 168 MW from the published IT area and power
density, 108 MVA from the design record, nearly 150,000 m² of floor area, and 219
MW in the operator's current material. The application carries all of them, states
what each one means and what it does not, and does not average them away.

**The water licence in one of Europe's wettest countries.** The project is
indirectly air cooled, which is by definition air-side — and the environmental
licence records residual evaporative cooling-water discharge. Both are true. The
resolution is the Irish climate: almost no cooling degree days, so outside-air
economisers carry most of the year and the evaporative stage assists only in the
hottest hours. The licence exists for those hours.

**Building beside a running data centre.** Phase 1 energised the grid in August
2017 and completed in the final quarter of the same year; CLN2 was handed over in
May 2018 while CLN3 was already on site; CLN5 and CLN6 were built beside two
operating buildings. Live-site interfaces are programme logic with outage windows
attached, not site notes.

**The retrofit nobody expects.** The AI Evolution mode's finding is that
converting a delivered hall to modern rack-scale compute is constrained by
electricity and not by floor area. The existing IT floor area could physically
hold roughly 30,000 rack positions, while the campus supply can fund about 1,300
at modern density. The order of constraints is electricity, then cooling
architecture, then structural floor loading, and only then space.

---

## What the model will not claim

- It does not assert a redundancy rating. TIA-942 terminology is used to explain
  the vocabulary; no rating is claimed for Clonee.
- It does not present generator ratings, transformer ratings, switchgear lineups,
  UPS autonomy, cooling plant counts or achieved performance as published.
- It does not claim the project-controls data is historical. It is generated from
  published cost and workforce anchors and labelled synthetic throughout.
- It does not reproduce any operator's detailed design. Where the public record
  stops at "cooling plant" or "switchgear", the model shows one credible
  implementation and says so.

Construction phase 24 is called "What the record does not say" and lists the
gaps. Every component carries a `publicLimit` sentence naming what is not public
for it.

---

## Documentation

- **[CLONEE_RESEARCH.md](CLONEE_RESEARCH.md)** — the source register, the main
  project facts, the phase history, the electrical architecture, cooling, civil
  systems, building data, environmental information, and an explicit list of
  unknowns and assumptions.
- **[MODEL_DECISIONS.md](MODEL_DECISIONS.md)** — why each major modelling
  decision was made, what was rejected, and what it costs.
- **[PRODUCT.md](PRODUCT.md)** — the product record: audience, purpose,
  positioning, capabilities and constraints.

## Sources

The primary sources are Meath County Council ePlanning (RA150605, RA180671), An
Bord Pleanála (VA0018), the EirGrid Annual Report 2017, EPA Industrial Emissions
Licence P1192-01, Meta's own data-centre announcements, the studioNWA project
record, the Irish Construction Excellence Awards, and John Paul Construction's
substation package record. Industry and standards sources are used only for
typical practice and are labelled as such. The full register with URLs is in the
application under **Sources & method**, and in
`src/data/sources.ts`.

---

## Running it

```bash
npm install
npm run dev        # development server
npm run build      # production build to dist/
npm run preview    # serve the production build
npm run typecheck  # TypeScript, no emit
npm run selftest   # data-model integrity checks
```

The build is static: no backend, no runtime configuration, nothing to host beyond
files. It is published by the GitHub Actions workflow in `.github/workflows/` when
Pages is enabled for the repository.

## Verification

The self test is the data model's contract. It checks that every geometry type has
a metadata entry, that every fact citation resolves against the source register,
that the flow graph reaches what it claims to reach, that commissioning packages
block correctly on their upstream dependencies, that the construction timeline is
single-sourced, that the derived arithmetic agrees with the published figures, and
that the campus geometry fits inside the consented site area.

```bash
npm run typecheck && npm run selftest && npm run build
```

## Stack

React 18, TypeScript, Vite, react-three-fiber, drei, three and zustand. The 3D
engine, scene architecture, mode system, guided-journey machinery, commissioning
package model and test suite were ported from
[`hyperscale-dc-explorer`](https://github.com/XdruidR/hyperscale-dc-explorer),
which modelled a fictional campus. The project model is new throughout: this is
not the same model with new labels, because the two campuses differ structurally.
The reasoning is in [MODEL_DECISIONS.md](MODEL_DECISIONS.md).

## Licence

The source code is provided as-is. The project it depicts is operated by Meta
Ireland; the facts it uses come from public planning, environmental, grid and
industry sources, cited individually.