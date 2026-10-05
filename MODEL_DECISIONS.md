# Model Decisions

Why the Clonee explorer is built the way it is. Each decision below states what
was decided, what was rejected, and what it costs.

---

## 1. Port the engine, replace the model wholesale

**Decided:** fork `hyperscale-dc-explorer` and port its engine, scene
architecture, mode system, guided-journey machinery, commissioning-package
model and test suite. Replace the entire project model.

**Rejected:** changing labels on the Southland model. The brief is explicit that
the new model must be a real project rather than a relabelled one, and the two
campuses differ structurally — six halls across three modules versus twenty halls
across five buildings, three transformers versus none in the old model, an air
side versus a different air side, and a real phased delivery history versus a
generic one. Relabelling would have produced a model whose geometry quietly
contradicted its own evidence.

**Costs:** some engine code had to change because the model's grain changed. The
store's three-module arithmetic and a hardcoded module-lag table are gone, since
five buildings with genuinely different schedules cannot be expressed as one
module with an offset. `MODULE_SHIFT` was replaced by real per-building delivery
windows in `campus.ts`.

---

## 2. Buildings, not modules, as the organising unit

**Decided:** the five data-storage buildings are the primary spatial and
operational unit. Halls are secondary within a building.

**Rejected:** keeping a "module" abstraction with buildings inside it. Clonee has
no module. The buildings are the buildings, each consented separately or in
pairs, each with its own delivery window.

**Consequences:** isolation is by building (1–5), not by hall, because a building
is what the campus is delivered and operated in. The building readiness table
derives from each building's own `fitout` and `handover` phases rather than from
a gate constant, so it cannot break when the phase list changes.

---

## 3. Preserve the CLN4 gap rather than renumber

**Decided:** buildings are CLN1, CLN2, CLN3, CLN5, CLN6 everywhere. Campus
reading index 1–5 maps to those names; the name is never derived from the index.

**Rejected:** renumbering to B1–B5 for tidiness.

**Why it matters:** the gap is a published characteristic of the real project and
one of the things a reader will notice. A model that tidied it away would be less
true than the thing it claims to teach, and the numbering is exactly the kind of
detail that teaches how consent records accumulate. Any code that parses an
index into a name would produce "CLN" for both CLN1 and CLN5, so `Labels.tsx`
and `Inspector.tsx` both take the name from the model.

---

## 4. Two independent capacity routes, both shown

**Decided:** the campus IT load is **180 MW** from 5 × 36 MW consented
(`MCC-150605`), and the fact register also carries the **168 MW** from 75,000 m²
× 2.24 kW/m² (`SNWA-FB`), plus 108 MVA and the operator's 219 MW.

**Rejected:** picking one figure, or averaging them.

**Why it matters:** real projects have contradictory public numbers, and the
disagreement is itself the lesson. A model that resolved it by picking one would
teach a false confidence. `capacityReconciliationSentence()` states the agreement
to within 7% without pretending the sources are the same measurement. The
`CAPACITY_CLAIMS` table in `water.ts` gives each figure a *means* and a *does not
mean*, which is the distinction that actually matters — 108 MVA describes the IT
feed, not the facility draw.

---

## 5. Indirect air cooling with a small evaporative assist

**Decided:** the cooling plant is air-side indirect cooling with an evaporative
assist carrying **10% of annual heat**.

**Rejected:** modelling it as either purely dry air cooling or as a conventional
evaporative tower.

**Why it matters:** `SNWA-FB` says indirect air cooling, which is by definition
air-side. `EPA-P1192` refers to residual evaporative cooling-water discharge,
which means the plant runs wet sometimes. Both are true, and the honest reading is
a mostly-air plant with an assist in the hottest hours — which is what Irish
climate allows, since the region has almost no cooling degree days and
outside-air economisers carry most of the year.

This produces a genuinely surprising and well-documented teaching point: **a data
centre in one of Europe's wettest countries still holds a water discharge
licence**, because the licence exists for the hours when the air will not do it.
Getting this wrong in either direction — inventing a big water load, or denying
the discharge — would have lost the best story in the water panel.

---

## 6. No coolant loop in a delivered hall

**Decided:** the halls as delivered contain air-cooled in-hall units and nothing
else. There are no cold plates and no coolant distribution units in the model
unless the AI retrofit is switched on, and even then they appear only for CLN2
hall 3.

**Rejected:** including liquid cooling in the base hall model, which is what the
predecessor did and what most generic data-centre models do.

**Why it matters:** a 2017–2021 indirectly air-cooled hall genuinely has no
liquid loop. Drawing one would teach a falsehood. More importantly, the absence
is the substance of the AI Evolution panel: the retrofit is not a matter of adding
cold plates, because there is no loop to add them to. An air-primary hall cannot
natively accept liquid cooling; its realistic paths are liquid-to-air sidecar
units or a wholesale conversion to a chilled-water loop (`IND-LC`).

---

## 7. The retrofit is power-constrained, not space-constrained

**Decided:** the AI Evolution mode's headline is that the existing IT floor area
could physically hold roughly 30,000 rack positions, while the campus supply can
fund about 1,300 at modern AI density — under 5% of them.

**Rejected:** framing the retrofit as a floor-space or cooling-capacity question.

**Why it matters:** it is the opposite of the intuitive reading and it is
arithmetic on published figures. The order of constraints is: electricity
(substation, transformers, MV/LV switchgear, busway, PDU tap-offs), then the
cooling architecture, then structural floor loading (about 2,100 kg/m² for a
loaded rack-scale system against a conventional design of about 1,500 kg/m²), and
only then anything spatial. Busway is provisioned to the worst case rather than
the operating case, which is why the relevant number is ~267 A per rack at the
design point and not the ~184 A drawn in normal operation.

---

## 8. Generation sized from the consent, not invented

**Decided:** 90 generators is a published count. Distribution is 18 per building
by even division, at 2.5 MW each — 45 MW per building against 36 MW of IT.

**Rejected:** inventing per-building generator counts to match some imagined
layout.

**Why it matters:** the even split is arithmetic, and the rating is corroborated
from two directions. 180 MW of IT at N+1 across 90 sets is about 2.4 MVA per set,
which is a standard package size; 2.5 MW gives 1.25× IT per building, which is
normal hyperscale practice and leaves room for the mechanical load that a hall
cannot operate without. The assumption is stated with that reasoning attached, so
a reader can argue with it.

---

## 9. The N-1 transformer case is the resilience story

**Decided:** losing one of the three step-down transformers is the most
instructive failure on the campus, and it is modelled at 3 × 90 MVA.

**Rejected:** making total grid loss the centrepiece of Resilience mode.

**Why it matters:** total grid loss is the scenario everyone already imagines, and
it is the easy one — generation picks it up and the campus runs. Losing one
transformer is the interesting case: 270 MVA becomes 180 MVA against a facility
draw of about 234 MW, so the campus does not lose power but cannot carry
everything, and roughly one building's IT load must be shed. It teaches that
redundancy claims have to be tested against a load case, not against a diagram.
It is also derived from a published count and a derived rating, so the arithmetic
is visible.

---

## 10. Construction phases anchored to real dates

**Decided:** 25 phases, each with a real calendar anchor. Ten are dated published
events; the rest are marked `inferred: true` and placed between the dated ones,
and the marker is carried in the data.

**Rejected:** a synthetic relative-duration timeline with a scrub bar and no
dates.

**Why it matters:** the previous model used indicative synthetic months with no
calendar, which made "how long does a data centre take" unanswerable. Real
anchors mean the August 2017 grid energisation sits between consent and
commissioning exactly where it belongs, the 29-month phase 1 is visible, and the
overlapping delivery of CLN1, CLN2 and CLN3 reads as what it was — overlapping
rather than sequential.

Inferred phases are marked rather than hidden, because the honest position is that
the record dates the milestones and not the work between them.

---

## 11. One component build window each, no lag table

**Decided:** every component carries its own `[startPhase, endPhase]` window, and
`buildStateOf` reads it directly.

**Rejected:** the predecessor's `MODULE_SHIFT` table, which applied a proportional
lag to every component's phases based on which module it belonged to.

**Why it matters:** the lag table was the single largest source of drift risk in
the old model — a hidden second timeline that had to be kept in step with the
component data by hand, and which the old test suite had to grep the source tree
to police. Clonee's buildings have genuinely different schedules, so the
information belongs on the components where it can be read. The retrofit
components sit outside the programme entirely and only appear at their own
phase, which is why the construction scrub can actually show a hall changing.

---

## 12. Project controls generated, anchored, and labelled

**Decided:** the project-controls dataset is generated from code, anchored on
published cost and workforce figures, and labelled synthetic throughout.

**Rejected:** a hand-tabulated dataset, which would drift from the physical model
the moment a building or phase changed.

**Why it matters:** the brief says the controls data need not be historical but
must be coherent with the physical model. Generating it from the same phase list
guarantees that coherence: budget lines have per-code progress windows shaped like
a real data-centre programme, so the substation runs long and early, the buildings
and MEP overlap heavily, and commissioning trails what it depends on.

The anchors are real and citable: €1.4bn on 219 MW gives the cost per MW the plan
is built from (`META-DC`); the €300m-for-72 MW announcement is carried alongside
as the era-matched lower figure (`PRESS-ECO`); the elemental split comes from the
published UK cost model with electrical at 31% (`IND-SAV`); and the 1,500 peak
workforce is the operator's own figure for this site.

---

## 13. Commissioning as turnover packages with real blocking

**Decided:** commissioning status belongs to turnover boundaries, and a package
cannot advance past a stage its upstream packages have not reached.

**Rejected:** a global progress bar or a per-stage checklist.

**Why it matters:** it is the only model that can show *why* a rack is not ready.
The blocking messages are generated from the real dependency graph — the
substation gates every electrical package, a building's MV lineup gates its UPS,
LV, busway and PDUs, and a hall's IT package is gated by its power, cooling and
network packages. On this campus the cooling package usually gates the handover,
not the power package, which is the most common real-world data-centre surprise and
is worth teaching.

---

## 14. Every number derived once, in one file

**Decided:** every displayed figure comes from `derived`, `INPUTS` or `ASSUMPTIONS`
in `src/data/calculations.ts`. Inputs carry source ids; assumptions carry a
classification and a written reason.

**Rejected:** restating a derived quantity in prose or in a panel.

**Why it matters:** the provenance system is the product's spine, and it only
works if a figure cannot be stated one way in the water panel and a different way
in a journey. This is inherited from the predecessor and was the right call; it
is kept and extended to the new data.

---

## 15. What the model refuses to assert

**Decided:** the application will not claim a redundancy rating, will not assert
generator ratings or emission limits as fact, and will not present the derived
transformer and rack figures as published.

**The boundary is explicit.** Phase 24 of the construction sequence is called
"What the record does not say" and lists the gaps. Every component carries a
`publicLimit` sentence naming what is not public for it. `supply.ts` states in
`POWER_STRESS_NOTE` that it is not a protection-coordination or load-flow tool.

**Why it matters:** the brief says not to sanitise the application so aggressively
that it stops teaching anything, but it also says nothing invented may be
presented as verified history. The way to hold both is to be specific about the
boundary rather than vague about the content — which is also more useful, because
a learner who knows *which* questions the public record cannot answer is better
placed than one who is merely told to be careful.