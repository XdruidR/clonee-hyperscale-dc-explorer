# Hyperscale Data Centre Explorer

An interactive 3D technical learning environment for understanding how a modern hyperscale / AI data centre
works — spatially and technically — and how one is built, commissioned and put into service.

It is built for someone who works around major infrastructure and project controls but is not a data centre
engineer. The goal is that after using it you can walk into a hyperscale data centre project meeting and
follow what people mean by the GXP, electrical trains, data halls, cooling plant, water, racks,
commissioning and dependencies.

```bash
npm install
npm run dev          # http://localhost:5173
```

### Reaching it from your tailnet

Both servers bind `0.0.0.0`, so any device on your tailnet can load it once it is running. This machine is
`minter-T460`, tailnet short name `t460`, MagicDNS name `t460.taila598b7.ts.net`, tailnet IP `100.80.3.57`.

| Server | Command | URLs that work |
| --- | --- | --- |
| Dev (hot reload) | `npm run dev` | `http://100.80.3.57:5173/` · `http://t460:5173/` · `http://t460.taila598b7.ts.net:5173/` · LAN: `http://192.168.1.8:5173/` |
| Production preview | `npm run build && npm run preview` | same four, on port **4173** |

Use the **tailnet** addresses from a device that is genuinely on the tailnet. A phone on the same Wi-Fi should
use the LAN address; `100.80.3.57` only routes over the tailnet.

Both are plain static HTTP, so no TLS or proxy is needed — the tailnet already encrypts the transport.

Three things in `vite.config.ts` make this work, each of which otherwise fails in a way that looks like "the
server is down":

- **`host: '0.0.0.0'`** — otherwise Vite listens on loopback only.
- **`allowedHosts`** — Vite answers `403 Blocked request. This host ("t460") is not allowed.` for any unlisted
  `Host` header. That happens with the tailnet *short* name even though the FQDN works, because a leading-dot
  entry like `.ts.net` only matches subdomains. The list therefore covers loopback, every local address, the OS
  hostname, `.ts.net`, `.local`, and single-label names via a regular expression. Public FQDNs are still
  rejected, which keeps the DNS-rebinding protection intact. If you rename the node, add it to the list, or set
  `TAILSCALE_ALLOWED_HOSTS=all npm run dev` to disable the check entirely.
- **`strictPort`** — stops Vite quietly moving to 5174 when the port is busy, which would invalidate a bookmark
  on your phone. It fails loudly instead.

If a device still cannot load it, check in this order on that device:

1. `tailscale status` — is Tailscale actually connected there?
2. `tailscale ping t460` — does the tailnet path reach this node?
3. `curl -sv http://100.80.3.57:5173/` — `403 Blocked request` means the host allow-list;
   `Connection refused` means nothing is listening; a hang means an ACL or firewall drop.

Note that `firewalld` is inactive on this host and `ufw`/`iptables` could not be inspected without a sudo
password. If a connection hangs rather than being refused, check your tailnet ACL permits TCP 5173/4173 to this
node, and `sudo ufw allow 5173/tcp` if `ufw` is active.

Other commands:

```bash
npm run build        # typecheck + production bundle into dist/
npm run preview      # serve the production bundle
npm run selftest     # data-model integrity checks (2,600+ assertions)
npm run smoke        # drive the real app in headless Chrome and screenshot it
```

Requires Node 20+ and a WebGL-capable browser. No accounts, no keys, no network calls, no external assets —
all geometry is generated in code.

---

## The one idea that shapes the whole application

Public planning and consent material for large Southland hyperscale data centre projects is unusually detailed
about **scale, interfaces and quantities** — and almost silent about **detailed design**. So the application
separates two things at all times:

| Label | Meaning |
| --- | --- |
| **PUBLIC FACT** | Explicitly supported by public documentation for the Southland reference project. Cited by source id. |
| **TYPICAL** | A normal hyperscale / AI data centre design assumption from industry material. Not a statement about any project. |
| **SIMPLIFIED** | Deliberately simplified or modelled for teaching. |
| **SYNTHETIC** | Invented placeholder for a delivery concept (WBS codes, cost bands, durations). Never a project fact. |

Turn on **evidence mode** in the toolbar to see the label attached to every 3D label. Open
**Sources & method** for the full classification rule, the fact register and the source list.

Where the public record stops at "cooling plant", "switchgear", "generators" or "GXP", the inspector says so
explicitly — *"What is public: … NOT PUBLIC: transformer ratings, count, or connection scheme"* — and then
shows one typical implementation. It never presents a typical arrangement as fact.

The project is a **fictional generic Southland hyperscale campus**. No company, client, contractor or designer
name appears anywhere in the interface, in component names, in the geometry or in the data model. Project names
appear only in the source register, where a provenance record has to identify documents accurately.

---

## What is in it

### Modes (top bar)

**Overview** — the whole campus, with the public headline numbers and an explanation of why several different
capacity figures circulate for the same project (IT capacity vs total demand vs generator rating vs plan value)
without pretending the public record reconciles them.

**Power** — animated flow from transmission to accelerator. Every stage is clickable and gives what it is, why
it exists, the voltage / energy transformation concept, failure modes, redundancy, and upstream/downstream
dependencies. Includes an animated utility-failure sequence: normal supply → utility lost → UPS on battery →
generators start → stabilise and synchronise → load transferred → mechanical plant restarted → utility restored
→ back to standby. Each step carries a teaching note.

**Cooling** — heat followed from the die to the atmosphere. HOT / COLD / SUPPLY / RETURN are distinguished on
the flows. The panel states exactly what the public documents say (water-glycol cold plates carrying 70-80% of
the heat, secondary liquid heat exchanger for the remaining air heat, evaporative cooling to 15-20 °C,
disinfection against legionella/algae/scale) and lists the common alternative arrangements as clearly labelled
TYPICAL: liquid-to-liquid versus liquid-to-air, in-rack vs in-row vs facility-level CDUs, warm-water operation
and the dew-point rule.

**Water** — a water balance rather than blue pipes: where water enters (roof and hardstand capture, bore field),
where it goes (evaporation, blowdown, treated recharge), what the storage buys, and the domestic stream for
comparison. Stormwater is presented as a consent obligation, not a drain.

**Data / network** — fibre from the sea bed to a top-of-rack switch, with the compute / storage / networking
distinction and what actually happens when an AI workload arrives.

**Resilience** — deliberately fail the grid, a transformer, a UPS path, a generator, a cooling pump, a cooling
unit or a fibre route, and see the modelled consequence plus the evidence caveat. Includes the N / N+1 / 2N /
2(N+1) vocabulary, concurrent maintainability, fault domains and common-mode failure, each with the question you
would ask in a real design review, plus the emergency load-shed order.

**Construction** — a 36-phase slider from an empty paddock to operational handover. Geometry appears
progressively, temporary works appear and disappear (site sheds, sediment ponds, haul route, dewatering, tower
cranes), and modules are deliberately offset from each other so you can see phased delivery rather than one
simultaneous build. A hall is a fault domain and a delivery module at the same time.

**Commissioning** — a 15-stage programme from design verification to handover, with dependencies computed from
the same graph the flows are drawn from. Try to commission a rack and it tells you which upstream item has not
finished. Includes the simulated scenarios: pull the utility, fail a generator, fail a pump, lose a path.

### Other controls

- roof off · cutaway · exploded · labels · flow animation
- isolate any data hall, one electrical train, or one cooling loop
- colour by system or by work package
- day / dusk / night
- **delivery view** — every component's inspector carries both views: a *technical view* ("what does this
  transformer do?") and a *delivery view* (WBS, package, discipline, live construction status, commissioning
  status, predecessors, successors, SYNTHETIC cost category, milestone). The **delivery layer** toggle also
  recolours the campus by work package
- **Follow the electrons** / **Follow the heat** — camera-led journeys
- 10 guided journeys along the bottom of the screen; each moves the camera and progressively highlights the
  relevant components
- click any component to focus the camera and open the inspector

---

## Architecture

```
src/
  data/                  the whole content model, all of it declarative
    sources.ts           source register (the only place project names appear)
    facts.ts             public fact register + derived arithmetic, each with sources
    types.ts             classification, system and package vocabularies
    componentInfo.ts     per-geometry-type technical + delivery metadata
    campus.ts            the campus model: components, layout, and the flow graph
    phases.ts            36-phase construction sequence
    commissioning.ts     commissioning stages, scenarios, modular delivery notes
    faults.ts            utility-loss sequence, fault scenarios, redundancy vocabulary
    water.ts             water balance and capacity-claim reconciliation
    journeys.ts          10 guided journeys with camera and view state per step
  state/store.ts         zustand store, build-state model, commissioning gating
  three/                 R3F scene, geometry builders, flow renderer, camera rig
  ui/                    panels, inspector, journeys, sources drawer
scripts/
  selftest.ts            data-model integrity checks
  smoke.mjs              headless-Chrome end-to-end smoke test with screenshots
```

Design decisions:

**One model, many views.** Components are records with a geometry type, position, size, instancing offsets,
construction window and system membership. The 3D view, the animated flows, the delivery layer, the
commissioning blockers and the resilience scenarios are all derived from that one model, so they cannot drift
apart.

**The flow graph is the dependency graph.** `FLOW_LINKS` describes how systems connect; the commissioning
blocker messages and the "isolated train" views are computed from the same edges. That is why "you cannot
commission this rack yet because upstream M1-W.lv has not completed controls and points-to-point" is a real
consequence rather than a hard-coded sentence.

**Instanced geometry.** Generators, racks, accelerators, cold plates, switches, PDUs, CDUs and in-row cooling
are drawn as single instanced meshes (~8,000 rendered instances from ~155 records), so the campus stays
interactive. Repeated equipment is authored once as offsets.

**Phased delivery with a proportional lag.** Module 2 and 3 lag module 1, but the lag is proportional to the
phase rather than a flat offset — a flat offset would push module 3's fitout past the end of the programme and
the campus would never complete. The self test asserts that every hall finishes by handover.

**Sticky import path.** The store's `setMode` also sets a sensible interior view (power, cooling, data and
resilience modes remove the roof and cut the walls), because those stories are invisible through a closed roof.
The user can always override with the toggles.

### Verification

`npm run selftest` checks the things that actually break in an app like this: that every component has
metadata and a valid phase window, that halls do not overlap and match the public footprint figure, that the
84 generators, 4 towers and 5 bores are where the public record puts them, that every flow link points at real
components, that every hall is reachable for power, cooling, data and water, that commissioning stages are
ordered, that a rack is blocked by its upstream equipment, that temporary works appear and disappear, that
every journey and fault scenario references real components, that every citation resolves, and that the public
arithmetic (268.8 MW of generation, 445.2 MW of generator heat, ~0.14 kg of water per kWh) is internally
consistent.

`npm run smoke` builds nothing itself — run `npm run build` first — then serves `dist/`, drives the real
application in headless Chrome over the DevTools protocol, exercises all eight modes, the construction slider,
the view toggles, failure injection, the utility-loss animation, commissioning gating, a guided journey, the
inspector and the sources drawer, and fails on any console error, page exception or failed request. It writes
screenshots to `smoke-out/`.

---

## What this is not

It is not a design, a simulation or a training course with a certificate. It does not reproduce any real
facility's detailed design, and the geometry is indicative rather than architectural. It deliberately does not
invent UPS autonomy, generator step-load criteria, recovery times, acceptance criteria or costs, because those
are project-specific and inventing them would be the most misleading thing it could do.

See `RESEARCH.md` for the research provenance, the confirmed public figures, the known disagreements between
sources, and the full source list.