# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Inherited from the forked engine: React 18 + TypeScript + Vite + @react-three/fiber + drei + three + zustand. Static output (Vite build to `dist/`), deployed to GitHub Pages / any static host, with the long-term goal of embedding on construe.co.

The engine and scene architecture are ported from `hyperscale-dc-explorer` rather than rebuilt. The project model is replaced wholesale: that repo modelled a fictional Southland campus, and the brief is explicit that the new model must be a real project, not a relabelled one.

## Users

**Primary — technical learners and industry professionals who need to understand a hyperscale data centre as a whole system.** Engineers, designers, project-controls staff, facilities and operations people, construction and commissioning practitioners, and students of infrastructure. They arrive curious, with a question they cannot answer from a single-discipline view, and they want to trace an actual system end to end rather than read a generic description.

**Secondary — people evaluating the project itself.** Reviewers, planners, students or teachers who want to know what is genuinely known about Clonee versus what a model had to assume. They are the reason the evidence layer exists.

The visitor is usually on a desktop, at a wide viewport, with time to explore. Mobile is a real supported layout (not a degraded one) because field and site visitors use it.

## Product Purpose

An interactive 3D reconstruction of the Meta Clonee hyperscale data centre campus in County Meath, Ireland, that teaches how large data-centre projects are designed, built, commissioned and controlled.

It is not an engineering digital twin. It is a credible, visually useful, educational model built from public planning, grid, environmental and industry evidence, with typical hyperscale practice filling the gaps where the public record stops.

Success means a visitor can follow power from the 220 kV transmission system to a rack, understand why the campus is arranged as it is, watch it get built and commissioned, break it on purpose and see what survives, and — at any point — ask "is that real?" and get a straight answer.

## Positioning

Every claim in the application carries its own provenance, and the provenance is visible in the interface: `PUBLIC FACT` with a cited source, `DERIVED` as arithmetic on published inputs, `TYPICAL` from accepted industry practice, `SYNTHETIC` for invented delivery data.

A neighbouring product could copy the 3D campus. It could not copy the combination of a real, named, publicly documented project reconstructed at this fidelity *and* a claim-level evidence trail that admits exactly where the public record stops. The product teaches the real project without sanitising it into a generic one.

The opposite failure — burying the learner under disclaimers — is explicitly rejected by the brief. Evidence is available and honest, never obstructive.

## Operating Context

The application is used as a study and briefing tool: at a desk on a wide screen, exploring and tracing; on a phone or tablet, standing up and pointing at something. Sessions are exploratory rather than task-driven — a visitor moves between nine system and process modes, follows guided journeys, injects failures, and scrubs through construction and commissioning.

The nine modes are Campus, Power, Cooling, Water, Data, Resilience, Construction, Commissioning and Project Controls, plus an AI Evolution retrofit view.

## Capabilities and Constraints

- Nine modes over one shared 3D campus model, with system isolation, isolate-a-building, explode and cutaway controls.
- Animated system flows for electrical, cooling, water, air and data media, with per-link provenance.
- Component inspection: what it is, what it does, why it matters, what is known about Clonee, what has been assumed, and source links.
- Guided learning journeys, including the 220 kV grid connection as a primary narrative.
- Construction phasing on a scrub bar; commissioning driven through turnover packages with real dependency blocking.
- Resilience mode with injectable failures and an explicit account of what remains energised and what load is at risk.
- Project-controls layer (WBS, cost codes, schedule, earned value, risk, change, milestones, turnover) generated programmatically and coherent with the physical model.
- AI Evolution mode transforming one hall to a modern GPU-dense liquid-cooled design, contrasted against the delivered period architecture rather than retroactively imposed on it.
- Automated integrity tests must keep passing: typecheck, data-model self test, production build.

Constraint: the model must feel like Clonee, not like a data centre with recognisable project characteristics deliberately removed. Where public information exists, use it directly. Where it must be invented, say so.

## Brand Commitments

- The subject is a real, named, operating facility built by a real named operator. Name it accurately.
- No invented commercial, operational or capability claims. No fabricated statistics presented as real.
- The evidence classification system is load-bearing, not decoration. It must stay legible.
- Real project characteristics are preserved deliberately — hall counts, building names, generator counts, substation configuration — rather than genericised away.

## Evidence on Hand

Public documentation identified and used as the source register for the model:

- Meath County Council ePlanning RA150605 — original campus consent: ~95.5 ha site, two buildings, ~50,800 m² GFA, ~25,400 m² each, four halls per building, 36 MW per building, underground 20 kV campus cables.
- Meath County Council ePlanning RA180671 — expansion consent: two further buildings, ~57,400 m² additional GFA, further admin building, generators, roads, drainage, parking, security.
- An Bord Pleanála VA0018 planning report — 220 kV substation: ~30,100 m² compound, 12 × 220 kV bays, 3 step-down transformers, 27 lightning masts, control building, diesel-generator building, customer MV building, two new transmission towers, loop-in connection.
- EirGrid Annual Report 2017 — Clonee 220 kV station completed August 2017, customer-built, first customer-built 220 kV station in Ireland, ~15 months to connect.
- EPA Industrial Emissions Licence P1192-01 — five data-storage buildings (CLN1, CLN2, CLN3, CLN5, CLN6), 90 diesel generators, generator operating conditions, evaporative cooling-water discharge, stormwater and environmental systems.
- Meta data-centre announcements (2019 expansion to nearly 150,000 m²; innovation material for AI comparison).
- studioNWA Clonee project page — indirect air cooling, ~75,000 m² IT area, ~2.24 kW/m² IT power density.
- Irish Construction Excellence Awards — delivery, phases, contractors, substation, man-hours.

Known absences that must not be fabricated: internal single-line diagrams, per-building generator ratings and distribution, detailed cooling plant counts and control arrangements, switchgear lineups, UPS architecture, redundancy rating achieved, historical programme and cost data.

## Product Principles

1. **Real project, honest gaps.** Use public Clonee evidence wherever it improves the model; use accepted engineering practice where the record stops; use synthetic delivery data where history is unavailable. Keep the three distinguishable at all times.
2. **Trace a system end to end.** Every mode should let a visitor follow something real from source to consequence — electrons, heat, water, fibre, or a delivery dependency.
3. **Failure is teaching.** Resilience, blocking scenarios and commissioning gates exist to show what protects what, and why.
4. **The claim carries its provenance.** Nothing is asserted as historical fact that is not.
5. **Built to be published.** Static output, no runtime backend, and the maintenance burden small enough that the model keeps improving as research does.

## Accessibility & Inclusion

Keyboard-reachable controls with visible focus, Escape to deselect, labelled form controls, and a mobile layout that is a real layout rather than a collapsed desktop. Colour is never the only carrier of meaning — classification is always also given as text. Body copy meets contrast requirements against its panel ground.