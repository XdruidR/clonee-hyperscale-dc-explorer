import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { COMPONENT_BY_ID, MODULES } from '../data/campus';
import { CAPACITY_CLAIMS, WATER_BALANCE, WATER_NARRATIVE } from '../data/water';
import { GRID_FAILURE_SEQUENCE, FAULT_SCENARIOS, REDUNDANCY_CONCEPTS, SHED_PRIORITY } from '../data/faults';
import { CX_SCENARIOS, CX_STAGES } from '../data/commissioning';
import { blockersFor, canStartStage, stageName } from '../state/store';
import { COMPONENT_INFO } from '../data/componentInfo';
import { PHASES, CUMULATIVE_MONTHS, TOTAL_MONTHS } from '../data/phases';
import { MODULAR_DELIVERY_NOTES } from '../data/commissioning';
import { POWER_CHAIN, HEAT_CHAIN, FIBRE_CHAIN } from '../data/campus';
import { CLASSIFICATION_MEANING, CLASSIFICATION_COLORS } from '../data/facts';
import { Badge, Cite, FactNote, Section, Stat, num } from './common';

function chainButton(id: string, label: string) {
  const c = COMPONENT_BY_ID[id];
  if (!c) return null;
  return (
    <button
      className="row"
      key={id}
      onClick={() => {
        useStore.getState().select(id);
      }}
    >
      <span className="mono">{c.system === 'power' ? '⚡' : c.system === 'cooling' ? '🔥' : c.system === 'water' ? '💧' : c.system === 'data' ? '⇄' : '▮'}</span>
      <span>{label}</span>
      <span className="tiny">{c.id}</span>
    </button>
  );
}

function Chain({ ids, labels }: { ids: string[]; labels: string[] }) {
  const selected = useStore((s) => s.selected);
  return (
    <div>
      {ids.map((id, i) => (
        <div key={id}>
          {chainButton(
            id,
            labels[i] ?? COMPONENT_BY_ID[id]?.label ?? id,
          )}
          {i < ids.length - 1 && (
            <div style={{ paddingLeft: 14, color: 'var(--dim)', fontSize: 11, margin: '-2px 0 2px' }}>↓</div>
          )}
          {selected === id && <div className="tiny" style={{ color: 'var(--accent)' }}>↑ selected — see the inspector on the right</div>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ overview */

function OverviewPanel() {
  return (
    <div className="panel left scrolly">
      <h2>Hyperscale Data Centre Explorer</h2>
      <p className="lede">
        An interactive model of a fictional hyperscale / AI data centre campus on the Southland plains, built from
        publicly documented consenting for a real project nearby. Use the modes along the top, or pick a guided journey
        along the bottom.
      </p>

      <div className="callout blue" style={{ marginTop: 10 }}>
        <b>The one rule of this application:</b> it separates what is <b>publicly known</b> from what a{' '}
        <b>typical hyperscale facility would probably contain</b>. Anything the public record does not state is
        labelled <Badge c="TYPICAL" />, even when it looks obvious.
      </div>

      <Section title="The modelled campus">
        <div className="grid2">
          <Stat value="49 ha" label="site area" />
          <Stat value="6" label="data halls" />
          <Stat value="3" label="modules" />
          <Stat value="240 MW" label="consented IT load" />
          <Stat value="84" label="emergency generators" />
          <Stat value="445 MW" label="generator heat release" />
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          All six figures above are PUBLIC FACT quantities from the reference project's public documents.{' '}
          <Cite ids={['SDC-POI', 'ES-RC-DECISION', 'ES-S42A']} />
        </div>
      </Section>

      <Section title="Why different capacity numbers exist">
        <p className="lede">
          Public sources for this project quote more than one capacity figure and do not reconcile them. That is not a
          contradiction to be smoothed over — it is the most useful thing on this page.
        </p>
        {CAPACITY_CLAIMS.map((c) => (
          <div key={c.figure} style={{ margin: '8px 0' }}>
            <div style={{ fontSize: 12 }}>
              <Badge c={c.classification} /> <b className="mono">{c.figure}</b> — {c.label}
            </div>
            <div className="tiny" style={{ marginTop: 3 }}>
              <b>Means:</b> {c.means}
            </div>
            <div className="tiny">
              <b>Does not mean:</b> {c.doesNotMean}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Reading the colours">
        {(['PUBLIC FACT', 'TYPICAL', 'SIMPLIFIED', 'SYNTHETIC'] as const).map((k) => (
          <div key={k} className="legend-row">
            <span className="swatch" style={{ background: CLASSIFICATION_COLORS[k] }} />
            <span>
              <Badge c={k} /> {CLASSIFICATION_MEANING[k]}
            </span>
          </div>
        ))}
      </Section>

      <Section title="How to use it">
        <ul>
          <li>Orbit, pan and zoom with the mouse; click anything to focus it and read it.</li>
          <li>Each mode emphasises one system so you can trace it end to end.</li>
          <li>Construction mode takes the site from a paddock to an operating campus.</li>
          <li>Commissioning mode walks the testing programme and blocks work that is not ready.</li>
          <li>Resilience mode lets you deliberately break things.</li>
          <li>Turn on the delivery layer to see WBS, package and predecessor logic on every component.</li>
          <li>Evidence mode adds provenance tags to labels and panels.</li>
        </ul>
      </Section>

      <Section title="What this is not">
        <p className="lede">
          It is not a design. It does not reproduce any real facility's detailed design, and the geometry is indicative.
          Where the public record stops — at "cooling plant", "switchgear", "generators" — the diagrams here show one
          typical implementation and say so.
        </p>
      </Section>
    </div>
  );
}

/* --------------------------------------------------------------------- power */

function PowerPanel() {
  const gridPhase = useStore((s) => s.gridPhase);
  const setGridPhase = useStore((s) => s.setGridPhase);
  const playing = useStore((s) => s.gridPlaying);
  const setPlaying = useStore((s) => s.setGridPlaying);
  const startJourney = useStore((s) => s.startJourney);
  const g = GRID_FAILURE_SEQUENCE[gridPhase];
  const faults = useStore((s) => s.faults);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const p = useStore.getState().gridPhase;
      if (p >= GRID_FAILURE_SEQUENCE.length - 1) setPlaying(false);
      else setGridPhase(p + 1);
    }, 2600);
    return () => clearInterval(t);
  }, [playing, setGridPhase, setPlaying]);

  return (
    <div className="panel left scrolly">
      <h2>Power — grid to GPU</h2>
      <p className="lede">
        Every stage in this chain exists to answer one question: what stops an accelerator from losing power? Click any
        stage for the technical and delivery view.
      </p>
      <button className="primary" style={{ width: '100%', margin: '6px 0' }} onClick={() => startJourney('electrons')}>
        ▶ Guided tour: how does electricity reach a GPU?
      </button>

      <Section title="The chain">
        <Chain
          ids={POWER_CHAIN}
          labels={[
            'Transmission circuits',
            'HV bays and gantries',
            'GXP transformer (HV → MV)',
            'Campus MV switchgear',
            'Unit substation (MV → LV)',
            'UPS (conditioned, battery-backed)',
            'LV distribution board',
            'Busway',
            'Rack PDU (LV → single phase)',
            'Rack',
            'Accelerator server',
          ]}
        />
      </Section>

      <Section title="Utility loss simulation">
        <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
          <button onClick={() => setPlaying(!playing)}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          <button onClick={() => { setPlaying(false); setGridPhase(Math.max(0, gridPhase - 1)); }}>◀ Back</button>
          <button onClick={() => setGridPhase(Math.min(GRID_FAILURE_SEQUENCE.length - 1, gridPhase + 1))}>Step ▶</button>
          <button onClick={() => { setPlaying(false); setGridPhase(0); }}>Reset</button>
        </div>
        <div style={{ borderLeft: `2px solid ${g.grid === 'lost' ? 'var(--danger)' : 'var(--power)'}`, paddingLeft: 9 }}>
          <div className="tiny mono">
            {g.t} · {g.grid.toUpperCase()} · UPS {g.ups ? 'ON' : 'off'} · GEN {g.gen ? 'RUNNING' : 'standby'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, margin: '3px 0' }}>{g.name}</div>
          <p className="lede">{g.detail}</p>
          <div className="callout">{g.teaching}</div>
        </div>
        <div className="phase-list" style={{ marginTop: 8 }}>
          {GRID_FAILURE_SEQUENCE.map((p) => (
            <div
              key={p.id}
              className={`phase-row ${p.id === gridPhase ? 'now' : ''} ${p.id < gridPhase ? 'done' : ''}`}
              onClick={() => { setPlaying(false); setGridPhase(p.id); }}
              style={{ cursor: 'pointer' }}
            >
              <span className="phase-num">{p.t}</span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sources of power at a glance">
        <div className="grid2">
          <Stat value="84 × 3.2 MW" label="generation fleet (rated)" />
          <Stat value="268.8 MW" label="fleet total, all running" />
        </div>
        <div className="callout" style={{ marginTop: 8 }}>
          268.8 MW rated against up to 240 MW of IT load leaves roughly 1.1× on IT alone — and the mechanical plant has
          to be fed from the same fleet. That thin margin is the whole reason an emergency sequence has an explicit,
          tested load-shed order. <Badge c="SIMPLIFIED" />
        </div>
      </Section>

      {faults.includes('hv-line') && (
        <div className="callout danger">
          <b>Grid connection failed.</b> Running on generation — see the resilience panel for the consequences.
        </div>
      )}
      {faults.includes('gxp-transformer') && (
        <div className="callout danger">
          <b>GXP transformer failed.</b> Remaining transformers carry what they can; campus capacity is reduced.
        </div>
      )}
      {faults.includes('generator') && (
        <div className="callout danger">
          <b>Generator failed.</b> The fleet shrinks; if the margin is already consumed, the shed sequence runs.
        </div>
      )}
      {faults.includes('ups') && (
        <div className="callout danger">
          <b>UPS failed.</b> In the modelled 2N arrangement the redundant path carries the hall.
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- cooling */

function CoolingPanel() {
  const startJourney = useStore((s) => s.startJourney);
  const faults = useStore((s) => s.faults);
  return (
    <div className="panel left scrolly">
      <h2>Cooling — chip to air</h2>
      <p className="lede">
        Essentially every joule that enters a server leaves it as heat. This mode follows the heat from the die to the
        atmosphere, and is explicit about which parts are documented and which are typical.
      </p>
      <button className="primary" style={{ width: '100%', margin: '6px 0' }} onClick={() => startJourney('heat')}>
        ▶ Guided tour: where does the heat go?
      </button>

      <Section title="The heat path">
        <Chain ids={HEAT_CHAIN} labels={['GPU / accelerator', 'Cold plate on the die', 'Coolant distribution unit', 'Heat exchanger skid', 'Adiabatic heat rejection (evaporative)']} />
      </Section>

      <Section title="What is public here">
        <FactNote c="PUBLIC FACT" ids={['ES-AEE', 'ES-EMP']}>
          The public documents describe an <b>adiabatic cooling plant</b>. Liquid cooling uses plates on the GPUs and
          accelerators through which a water-glycol mixture flows, absorbing <b>70-80% of the heat</b> and transferring
          it to a heat exchanger. The remaining heat is captured as hot air and cooled using a secondary liquid-based
          heat exchanger. The warmed liquid from both processes is directed to a cooling plant where it is cooled by
          outdoor air flowing over a membrane sprayed with water; evaporation extracts heat and reduces the temperature
          to <b>15-20 °C</b>, then it is recirculated. The water is disinfected against legionella, algae and scale.
        </FactNote>
        <FactNote c="PUBLIC FACT" ids={['ES-AEE']}>
          What the documents do <b>not</b> contain: the make or model of the cooling equipment, piping arrangements,
          heat exchanger type, pump or fan counts, unit layout, water temperatures at the rack, or any redundancy
          architecture. Anything in this panel or the 3D model for those items is TYPICAL.
        </FactNote>
      </Section>

      <Section title="Typical arrangements you will hear about">
        <div className="callout blue">
          <b>Liquid-to-liquid (facility water at the rack).</b> The CDU exchanges heat between the technology cooling
          system and the facility water loop using a plate exchanger. Standard where a chilled or condenser water plant
          exists — the model shows this.
        </div>
        <div className="callout blue">
          <b>Liquid-to-air (no facility water at the rack).</b> The CDU rejects straight to room air. Useful in
          brownfield retrofits with no water plant; the room's air handling then has to absorb the heat, which caps
          density.
        </div>
        <div className="callout blue">
          <b>Where the CDU sits.</b> In-rack (smallest blast radius, most units to maintain), in-row (the density
          workhorse, one unit per row, needs N+1 or a row is at risk), or facility-level (economy of scale, largest
          footprint). This is the first question to ask in any design review.
        </div>
        <div className="callout blue">
          <b>Warm water.</b> Supply temperature is set above the room dew point — the absolute rule, or you get
          condensation on cold hardware and hoses. A higher supply temperature buys free-cooling hours.
        </div>
      </Section>

      <Section title="Legend">
        <div className="legend-row">
          <span className="swatch" style={{ background: MEDIUM_HEAT }} />
          hot / warm coolant return
        </div>
        <div className="legend-row">
          <span className="swatch" style={{ background: MEDIUM_COLD }} />
          cold coolant supply
        </div>
        <div className="legend-row">
          <span className="swatch" style={{ background: MEDIUM_AIR }} />
          air path heat
        </div>
        <div className="legend-row">
          <span className="swatch" style={{ background: MEDIUM_WATER }} />
          cooling water loop
        </div>
      </Section>

      {faults.includes('adiabatic-cooler') && (
        <div className="callout danger">
          <b>Heat rejection unit failed.</b> The array runs at reduced capacity and the cooling supply temperature
          rises. Whether there is headroom depends on the outside wet-bulb temperature.
        </div>
      )}
      {faults.includes('pump') && (
        <div className="callout danger">
          <b>Cooling pump failed.</b> Surviving pumps take the flow; if the standby is gone there is no spare until it
          is repaired.
        </div>
      )}

      <Section title="The generator problem">
        <FactNote c="PUBLIC FACT" ids={['ES-RC-DECISION']}>
          84 sets release about 5.3 MW of heat each — roughly 445 MW in total. A campus that is selling nothing still
          needs to reject heat, and it needs to reject it while the engines are running.
        </FactNote>
      </Section>
    </div>
  );
}

const MEDIUM_HEAT = '#ff7a5b';
const MEDIUM_COLD = '#7dd3fc';
const MEDIUM_AIR = '#fbbf24';
const MEDIUM_WATER = '#38bdf8';

/* --------------------------------------------------------------------- water */

function WaterPanel() {
  const startJourney = useStore((s) => s.startJourney);
  return (
    <div className="panel left scrolly">
      <h2>Water — in, through, out</h2>
      <button className="primary" style={{ width: '100%', margin: '6px 0' }} onClick={() => startJourney('water')}>
        ▶ Guided tour: why does a data centre need water?
      </button>
      <p className="lede">
        Two completely different water problems live on this campus: a cooling stream of hundreds of thousands of cubic
        metres a year, and a domestic stream of a few cubic metres a day. They are kept physically separate.
      </p>

      <Section title="The balance">
        <table className="simple">
          <thead>
            <tr>
              <th>Stream</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {WATER_BALANCE.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.label}
                  <div className="tiny">{r.note}</div>
                </td>
                <td className="num">
                  {num(r.value)}
                  <div className="tiny">{r.unit}</div>
                </td>
                <td>
                  <Badge c={r.classification} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="How to read it">
        <ul>
          {WATER_NARRATIVE.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Section>

      <Section title="Stormwater is a licence obligation, not a drain">
        <FactNote c="PUBLIC FACT" ids={['ES-CIVILS', 'ES-RC-DECISION']}>
          Swales run down both sides of the hall area to a southern basin with about 24 hours of retention, which is
          expected to remove up to 80% of sediment and 60% of other pollutants. Around 157,000 m³ a year is then
          recharged into the aquifer through a soakage trench, deliberately, because the groundwater regime supports a
          wetland to the south that the project has a consent obligation to protect. In a 1% annual exceedance event
          the basin overtops and the water follows existing flow paths south to the wetland and the stream.
        </FactNote>
      </Section>

      <Section title="Water that is not cooling water">
        <div className="callout blue">
          <b>Fire water.</b> Fire protection needs its own supply, its own pumps and — critically — its own power.
          A fire pump that loses power during a fire is the worst possible failure, so fire pumps are commonly
          duplicated with a dedicated diesel pump. That demand is separate from both the cooling stream and the
          potable stream, which is exactly why the public documents keep the potable system physically separated
          from the cooling water reservoirs.
        </div>
      </Section>

      <Section title="The bore field is the backstop, and a negotiation">
        <FactNote c="PUBLIC FACT" ids={['ES-PERMIT', 'ES-GWTAE', 'ES-WETLAND']}>
          Up to 7 L/s (604,800 L/day, 220,752,000 L/yr) from four to five production bores, used only when rainfall
          capture does not refill the reservoirs. There are 41 known bores within 3 km and the nearest neighbour well is
          about 650 m from the site centre, so drawdown effects were the main groundwater issue in consent. Without
          the soakage recharge mitigation the take could lower the wetland to the south by up to 1.4 m over 20 years, so
          a borefield pumping test is a condition of consent.
        </FactNote>
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------------- data */

function DataPanel() {
  const startJourney = useStore((s) => s.startJourney);
  return (
    <div className="panel left scrolly">
      <h2>Data and network — fibre to server</h2>
      <button className="primary" style={{ width: '100%', margin: '6px 0' }} onClick={() => startJourney('fibre')}>
        ▶ Guided tour: how does fibre reach the servers?
      </button>

      <Section title="The path">
        <Chain ids={FIBRE_CHAIN} labels={['Subsea cable and terrestrial routes', 'Cable landing station', 'Campus network core', 'Hall fabric / leaf switches', 'Top-of-rack to server']} />
      </Section>

      <Section title="What is public">
        <FactNote c="PUBLIC FACT" ids={['SDC-POI', 'ES-AEE']}>
          A submarine cable connects Australia and New Zealand, making landfall at a beach about 9 km from the campus,
          with a bulkhead, beach manhole and ducts, then trenching to an exchange and onward to the site along two
          diverse terrestrial routes. The landing station is on the campus site and is capable of serving up to three
          submarine cables. The system forms part of a ring topology across New Zealand plus Sydney and Melbourne.
        </FactNote>
        <FactNote c="PUBLIC FACT" ids={['ES-AEE']}>
          Not public: fibre pair counts, equipment, the optical design, or the redundancy architecture of the landing
          station. The Clos-style fabric in the model is TYPICAL.
        </FactNote>
      </Section>

      <Section title="What happens when an AI workload arrives">
        <ol style={{ paddingLeft: 16, lineHeight: 1.6 }}>
          <li>The request lands on the landing station and is handed to the campus core, where it is policed and routed.</li>
          <li>Core spines carry it to the leaf switches in the hall that hosts the target cluster.</li>
          <li>The fabric is a Clos topology: every leaf reaches every spine, so a spine failure is not a capacity event.</li>
          <li>Top-of-rack switches deliver it to the servers over short optical links.</li>
          <li>Storage serves the dataset — for a training run, mostly large sequential reads for checkpoints.</li>
          <li>Across thousands of accelerators the fabric must move data fast enough not to starve the compute. Optics dominate both cost and failures here.</li>
        </ol>
        <div className="callout blue">
          <b>TYPICAL.</b> The public record confirms connectivity exists at this scale and with international reach. It
          does not describe the internal fabric, and this application does not pretend otherwise.
        </div>
      </Section>

      <Section title="Three domains, deliberately separated">
        <div className="callout">
          <b>Compute</b> — dense, power-hungry, liquid cooled, replicated at the workload level so a failure loses a
          job slice rather than the run.
        </div>
        <div className="callout blue">
          <b>Storage</b> — different density, different duty cycle, and a rebuild storm after a failure that can
          saturate the fabric if you have not planned for it. Usually its own power and cooling domain.
        </div>
        <div className="callout blue">
          <b>Networking</b> — bandwidth-bound, optics-bound, and the domain that most often limits an AI rollout rather
          than the compute.
        </div>
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------- resilience */

function ResiliencePanel() {
  const faults = useStore((s) => s.faults);
  const toggleFault = useStore((s) => s.toggleFault);
  const clearFaults = useStore((s) => s.clearFaults);
  const startJourney = useStore((s) => s.startJourney);

  return (
    <div className="panel left scrolly">
      <h2>Resilience — break it on purpose</h2>
      <p className="lede">
        Failures are the reason for almost every structure on this campus. Fail something below and watch what the
        model does.
      </p>
      <button className="primary" style={{ width: '100%', margin: '6px 0' }} onClick={() => startJourney('gridfail')}>
        ▶ Guided tour: what happens when grid power fails?
      </button>

      <Section title="Inject a failure">
        {FAULT_SCENARIOS.map((s) => {
          const on = faults.includes(s.targetType);
          return (
            <div key={s.id} style={{ marginBottom: 8 }}>
              <button className={`row ${on ? 'on' : ''}`} onClick={() => toggleFault(s.targetType)}>
                <span>{on ? '✕' : '○'}</span>
                <span>
                  Fail: {s.label}
                  <div className="tiny">Siblings: {s.siblings}</div>
                </span>
                <span className="tiny">{s.consequence}</span>
              </button>
              {on && (
                <div className={`callout ${s.consequence === 'absorbed' ? 'fact' : s.consequence === 'critical' ? 'danger' : ''}`}>
                  <b>{s.headline}</b>
                  <ul style={{ margin: '4px 0 0' }}>
                    {s.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <div className="tiny" style={{ marginTop: 5 }}>
                    <b>Evidence caveat:</b> {s.caveat}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {faults.length > 0 && (
          <button style={{ width: '100%' }} onClick={clearFaults}>
            Clear all failures
          </button>
        )}
      </Section>

      <Section title="The vocabulary">
        {REDUNDANCY_CONCEPTS.map((r) => (
          <div key={r.term} style={{ margin: '8px 0' }}>
            <b>{r.term}</b>
            <div className="tiny">{r.definition}</div>
            <div className="tiny" style={{ color: 'var(--accent)' }}>
              How to test the claim: {r.test}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Emergency load shed order">
        <table className="simple">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Loads</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {SHED_PRIORITY.map((p) => (
              <tr key={p.rank}>
                <td className="num">{p.rank}</td>
                <td>
                  <b>{p.group}</b>
                  <div className="tiny">{p.loads}</div>
                </td>
                <td className="tiny">{p.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="callout">
        This model does not claim any redundancy architecture for the reference project. Public documents state that
        a GXP substation and 84 generators exist; they do not publish a redundancy target, a line-up, or a one-line
        diagram. Where this panel describes a mechanism, it is describing the mechanism, not the project.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- construction */

function ConstructionPanel() {
  const phase = useStore((s) => s.constructPhase);
  const setPhase = useStore((s) => s.setConstructPhase);
  const listRef = useRef<HTMLDivElement>(null);
  const current = PHASES[phase];

  useEffect(() => {
    const el = listRef.current?.querySelector('.phase-row.now');
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [phase]);

  return (
    <div className="panel left scrolly">
      <h2>Construction — paddock to operating campus</h2>
      <p className="lede">
        {PHASES.length} phases, refined from the brief using public Southland construction-management practice and
        normal hyperscale sequencing. Drag to build the site.
      </p>

      <div style={{ position: 'sticky', top: -12, background: 'var(--panel)', padding: '4px 0 8px', zIndex: 2 }}>
        <input
          type="range"
          min={0}
          max={PHASES.length - 1}
          value={phase}
          onChange={(e) => setPhase(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setPhase(Math.max(0, phase - 1))}>◀</button>
          <span className="tiny mono">
            phase {phase} / {PHASES.length - 1} · ~{CUMULATIVE_MONTHS[phase]} synthetic months
          </span>
          <button onClick={() => setPhase(Math.min(PHASES.length - 1, phase + 1))}>▶</button>
        </div>
      </div>

      <div className="callout" style={{ borderLeftColor: 'var(--simplified)' }}>
        <b>{current.name}</b>
        <p className="lede" style={{ margin: '4px 0 0' }}>
          {current.detail}
        </p>
      </div>

      <Section title="Live status">
        <div className="grid2">
          <Stat value={`${[0, 1, 2].filter((m) => modulesLive(phase, m)).length}`} label="modules live" />
          <Stat value={`~${CUMULATIVE_MONTHS[phase]} mo`} label="synthetic elapsed" />
          <Stat value={String(phase + 1)} label="phases started" />
          <Stat value={`${MODULES.filter((m) => modulesLive(phase, m.n)).length}/3`} label="module zones active" />
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          Modelling note: modules are offset by eight phases each so you can see that a hyperscale campus is not built
          all at once. Total programme length is SYNTHETIC and indicative.
        </div>
      </Section>

      <Section title="Modular delivery — why halls, and why in phases">
        {MODULAR_DELIVERY_NOTES.map((t, i) => (
          <div key={i} className="callout blue">
            {t}
          </div>
        ))}
      </Section>

      <Section title="Sequence">
        <div className="phase-list" ref={listRef}>
          {PHASES.map((p) => (
            <div
              key={p.id}
              className={`phase-row ${p.index === phase ? 'now' : ''} ${p.index < phase ? 'done' : ''}`}
              onClick={() => setPhase(p.index)}
              style={{ cursor: 'pointer' }}
            >
              <span className="phase-num">{String(p.index).padStart(2, '0')}</span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Temporary works you can see appear and disappear">
        <ul className="tiny">
          <li>Site establishment sheds — mobilisation to mid-build.</li>
          <li>Sediment ponds and erosion controls — before earthworks, until the site is stabilised.</li>
          <li>Temporary haul route — through bulk earthworks and aggregate delivery.</li>
          <li>Dewatering — a single phase, matching the public two-month dewatering window.</li>
          <li>Tower cranes — frame erection only.</li>
        </ul>
      </Section>
      <div className="tiny">Total modelled programme: ~{TOTAL_MONTHS} synthetic months from paddock to handover.</div>
    </div>
  );
}

function modulesLive(phase: number, module: number) {
  const shift = (module - 1) * 8;
  const fitout = 21 + shift;
  return phase >= fitout;
}

/* -------------------------------------------------------------- commissioning */

function CommissioningPanel() {
  const cxDone = useStore((s) => s.cxDone);
  const completeStage = useStore((s) => s.completeStage);
  const resetCx = useStore((s) => s.resetCx);
  const [openScenario, setOpenScenario] = useState<string | null>(null);

  const next = CX_STAGES.find((s) => !cxDone.includes(s.id));
  const blocked = next ? !canStartStage(next.id, cxDone) : false;

  const rackBlockers = useMemo(() => blockersFor('M1-W.rack', next?.id ?? 'install-check', cxDone), [next, cxDone]);

  return (
    <div className="panel left scrolly">
      <h2>Commissioning — proving it works before anyone buys it</h2>
      <p className="lede">
        Data centre commissioning is not a formality. It is the only evidence that the design intent survives contact
        with failure. Each level is a gate: sign it off before the next one starts.
      </p>

      <Section title="Progression">
        <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
          <button
            className="primary"
            disabled={!next || blocked}
            onClick={() => next && completeStage(next.id)}
            title={blocked && next ? 'Upstream stages are incomplete' : ''}
          >
            {next ? `Complete: ${next.name}` : 'Programme complete'}
          </button>
          <button onClick={resetCx}>Reset</button>
        </div>
        {next && blocked && (
          <div className="callout danger">
            <b>Blocked.</b> {next.name} needs:{' '}
            {next.needs
              .filter((n) => !cxDone.includes(n))
              .map((n) => CX_STAGES.find((s) => s.id === n)?.name)
              .join(', ')}{' '}
            still outstanding.
          </div>
        )}
        {next && !blocked && (
          <div className="callout fact">
            <b>{next.level}</b> · {next.name}
            <p className="lede" style={{ margin: '4px 0' }}>
              {next.detail}
            </p>
            <div className="tiny">Evidence produced: {next.evidence}</div>
            <div className="tiny">Indicative duration: ~{next.days} days (SYNTHETIC)</div>
          </div>
        )}
      </Section>

      <Section title="Dependency in action">
        <div className="callout">
          Try to commission a rack and the model answers with the real reason. Right now, for a representative rack in
          hall 1 at the next stage:
        </div>
        {rackBlockers.length ? (
          rackBlockers.map((b, i) => {
            const up = COMPONENT_BY_ID[b.component];
            const upTitle = up ? COMPONENT_INFO[up.type]?.title ?? up.label : b.component;
            return (
              <div key={i} className="callout blue">
                <b>
                  You cannot commission this rack yet because {upTitle} has not completed {stageName(b.stage)}.
                </b>
                <div className="tiny" style={{ marginTop: 3 }}>
                  That is the whole point of commissioning gates: you cannot commission downstream equipment until
                  upstream equipment has proved its own sequence of operation. Component id <span className="mono">{b.component}</span>.
                </div>
              </div>
            );
          })
        ) : (
          <div className="callout fact">Nothing is blocking this component at the next stage. It can proceed.</div>
        )}
      </Section>

      <Section title="Programme">
        <div className="phase-list">
          {CX_STAGES.map((s) => {
            const done = cxDone.includes(s.id);
            const isNext = next?.id === s.id;
            return (
              <div key={s.id} className={`phase-row ${isNext ? 'now' : ''} ${done ? 'done' : ''}`}>
                <span className="phase-num">{done ? '■' : s.level}</span>
                <span>{s.name}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Simulated scenarios">
        <p className="lede">
          Each of these is an integrated systems testing script in disguise. In a real project the scripts are written
          and approved before the test window opens, with hold points, abort criteria and witnesses named.
        </p>
        {CX_SCENARIOS.map((s) => (
          <div key={s.id} style={{ marginBottom: 6 }}>
            <button className={`row ${openScenario === s.id ? 'on' : ''}`} onClick={() => setOpenScenario(openScenario === s.id ? null : s.id)}>
              <span>▶</span>
              <span>{s.prompt}</span>
              <span className="tiny">L5</span>
            </button>
            {openScenario === s.id && (
              <div className="callout blue">
                <b>What it proves:</b> {s.whatYouAreTesting}
                <div className="tiny" style={{ marginTop: 5 }}>
                  <b>Expected:</b>
                </div>
                <ul className="tiny">
                  {s.expected.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
                <div className="tiny">
                  <b>Watch:</b>
                </div>
                <ul className="tiny">
                  {s.watch.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </Section>

      <div className="callout">
        Acceptance criteria and recovery times are project-specific and must come from the owner&apos;s requirements,
        the basis of design and the agreed commissioning criteria. This application deliberately does not invent them.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ exports */

export function ModePanel() {
  const mode = useStore((s) => s.mode);
  if (mode === 'power') return <PowerPanel />;
  if (mode === 'cooling') return <CoolingPanel />;
  if (mode === 'water') return <WaterPanel />;
  if (mode === 'data') return <DataPanel />;
  if (mode === 'resilience') return <ResiliencePanel />;
  if (mode === 'construction') return <ConstructionPanel />;
  if (mode === 'commissioning') return <CommissioningPanel />;
  return <OverviewPanel />;
}
