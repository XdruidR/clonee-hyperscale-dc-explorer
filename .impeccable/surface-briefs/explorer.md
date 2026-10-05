# Surface: Clonee explorer (single-page 3D application)

## Scope and mode

The whole application is one surface: a full-viewport WebGL campus with floating mode panels. Visitor mode is **Operate** — the visitor completes a task inside a professional tool (trace power, break a component, scrub a programme) — with a strong **Read** component in the evidence and sources layers. It is not a marketing page and never becomes a landing page.

Desktop-first at 1440px+, with a real mobile layout at 390px. Target viewport when embedded: whatever construe.co gives it.

## Audience, job, task, proof, constraints

- **Audience:** engineers, designers, project-controls staff, facilities and operations people, construction and commissioning practitioners, infrastructure students. Curious, mid-task, wide viewport, time to explore.
- **Job:** understand a hyperscale data centre as a whole system, and understand a specific real project.
- **Task:** trace a system end to end, inspect a component and its provenance, scrub construction and commissioning, inject a failure and see what survives.
- **Proof:** the campus itself, the animated flows, the component evidence, the delivery and commissioning models. Real Clonee facts where they exist. This is a working instrument, not a claim.
- **Constraints:** static build, no backend, WebGL performance budget, must stay readable when panels overlay a busy 3D scene, must not let evidence chrome bury the learning.

## Direction

**Inherited world, refined for Clonee.** The incumbent is a coherent dark technical identity — near-black ground, one cyan accent, semantic system colours, dense technical typography, floating instrument panels. That world is good and it is kept. This work is a refinement, not a rebrand.

The refinement direction, in one line: **make the 3D scene the document and the chrome an instrument overlay**, so the panels read as a survey instrument laid over a site rather than as an app chrome bolted onto a render.

What that means concretely:
- A real token system (spacing, radius, type scale, elevation, motion) replaces ad-hoc pixel values, so density is consistent and the panel system can be trusted at every breakpoint.
- Panels gain a deliberate material: a dark, slightly translucent instrument surface with a hairline edge and a real soft shadow, so they sit *over* the render and read as depth rather than as flat rectangles.
- Hierarchy inside the panels is fixed: the mode title, the lede, then sections. Currently the panels are a wall of equally-weighted small text, which is why they feel like a specification dump rather than an instrument.
- Density gets a rhythm: dense technical blocks (tables, WBS, evidence) are visually distinct from prose blocks, so scanning works.

## Memorable moment

Following one kWh of electricity from the 220 kV transmission loop-in, through the AIS bays and a step-down transformer, out along the underground 20 kV campus cable network, into a building, through UPS and busway, into a rack — with the animated flow carrying it and the substation compound being the one part of the site that is both the most publicly documented and the most under-explained by generic models.

## Unresolved decisions

- Whether the AI Evolution view is a separate mode tab or a transformation toggle layered over an existing hall.
- Whether Project Controls earns its own mode or lives as a layer inside Construction and Commissioning. The brief lists it as its own mode; the panel budget on desktop may argue for merging.