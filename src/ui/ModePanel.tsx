import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../state/store';
import {
  BUILDINGS,
  CAPACITY_NOTES,
  COMPONENTS,
  COMPONENT_BY_ID,
  FIBRE_CHAIN,
  HEAT_CHAIN,
  LAYOUT_NOTE,
  POWER_CHAIN,
  RACKS_PER_HALL,
  RETROFIT_HALL,
  SITE,
} from '../data/campus';
import { ASSUMPTIONS, INPUTS, derived, fmt, capacityReconciliationSentence, waterIntensitySentence } from '../data/calculations';
import { CAPACITY_CLAIMS, WATER_BALANCE, WATER_NARRATIVE } from '../data/water';
import { FAULT_SCENARIOS, GRID_FAILURE_SEQUENCE, POWER_STRESS_NOTE, REDUNDANCY_CONCEPTS, SHED_PRIORITY } from '../data/faults';
import { CX_SCENARIOS, CX_STAGES, MODULAR_DELIVERY_NOTES } from '../data/commissioning';
import {
  blockersForPackage,
  buildingsReady,
  nextStageForPackage,
  outstandingPackages,
  packageDone,
  stageName,
} from '../state/store';
import { PACKAGE_BY_ID, TURNOVER_PACKAGES } from '../data/turnover';
import { NETWORK_LAYERS, RACK_ARCHETYPES, chainFor } from '../data/archetypes';
import { supplyFromSequenceStep, supplyState } from '../data/supply';
import { CUMULATIVE_MONTHS, PHASES, TOTAL_MONTHS } from '../data/phases';
import { CHANGES, EARNED_VALUE, MILESTONES, SCENARIOS, budgetAt, programmeStatus, risksAt } from '../data/controls';
import { CLASSIFICATION_COLORS, CLASSIFICATION_MEANING } from '../data/facts';
import { CLASSIFICATIONS, SYSTEM_META } from '../data/types';
import { Badge, Cite, FactNote, Section, Stat, num } from './common';

/* ------------------------------------------------------------------- helpers */

const A = Object.fromEntries(ASSUMPTIONS.map((x) => [x.key, x.value])) as Record<string, number>;

/** A component row that selects the component and focuses the camera on it. */
function chainButton(id: string, label: string) {
  const c = COMPONENT_BY_ID[id];
  if (!c) return null;
  return (
    <button className="row" key={id} onClick={() => useStore.getState().select(id)}>
      <span className="glyph">
        <span className="swatch" style={{ background: SYSTEM_META[c.system].color }} />
      </span>
      <span className="body">
        <b>{label}</b>
        <span className="mono">{c.id}</span>
      </span>
    </button>
  );
}

/** A vertical chain, with the selected step marked. */
function Chain({ ids, labels }: { ids: string[]; labels: string[] }) {
  const selected = useStore((s) => s.selected);
  return (
    <div>
      {ids.map((id, i) => (
        <div key={id}>
          {chainButton(id, labels[i] ?? COMPONENT_BY_ID[id]?.label ?? id)}
          {i < ids.length - 1 && (
            <div style={{ paddingLeft: 18, color: 'var(--dim)', fontSize: 12, margin: '-2px 0 2px' }}>↓</div>
          )}
          {selected === id && <div className="tiny" style={{ color: 'var(--accent)' }}>↑ selected — open the inspector on the right</div>}
        </div>
      ))}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="panel left scrolly">{children}</div>;
}

/** A small labelled bar, used inside the project-controls chart. */
function Meter({ value, max, colour, label, valueLabel }: { value: number; max: number; colour: string; label: string; valueLabel: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
        <span className="tiny">{label}</span>
        <span className="mono" style={{ color: colour }}>{valueLabel}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: colour, borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ overview */

function CapacityClaims() {
  return (
    <>
      <p className="lede">
        Public sources for this project quote more than one capacity figure and do not reconcile them. That is not a
        contradiction to be smoothed over — it is the most useful thing on this page.
      </p>
      {CAPACITY_CLAIMS.map((c) => (
        <div key={c.figure} style={{ margin: '10px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Badge c={c.classification} />
            <b className="mono" style={{ fontSize: 13 }}>{c.figure}</b>
            <Cite ids={[c.source]} />
          </div>
          <div className="tiny" style={{ marginTop: 4 }}>
            <b>Means:</b> {c.means}
          </div>
          <div className="tiny">
            <b>Does not mean:</b> {c.doesNotMean}
          </div>
        </div>
      ))}
    </>
  );
}

function ArchetypePanel({ defaultId = 'clonee-delivered' }: { defaultId?: string }) {
  const [id, setId] = useState(defaultId);
  const chain = useMemo(() => chainFor(id, derived.itCapacityMW), [id]);
  return (
    <div>
      <p className="lede">
        There is no single universal rack power architecture, and a model that shows only one teaches the wrong thing.
        Pick an archetype and the whole chain recalculates from the consented campus load of {fmt(derived.itCapacityMW, 0)} MW.
      </p>
      {RACK_ARCHETYPES.map((a) => (
        <button key={a.id} className={`row ${id === a.id ? 'on' : ''}`} onClick={() => setId(a.id)}>
          <span className="glyph">{id === a.id ? '●' : '○'}</span>
          <span className="body">
            <b>{a.name}</b>
            <span>{a.summary}</span>
          </span>
          <span className="num">
            {a.rackDensityKw[0]}–{a.rackDensityKw[1]} kW
          </span>
        </button>
      ))}

      <div className="callout derived" style={{ marginTop: 10 }}>
        <b>Recalculated from {fmt(derived.itCapacityMW, 0)} MW IT</b> <Badge c="DERIVED" />
        <table className="simple" style={{ marginTop: 6 }}>
          <tbody>
            <tr>
              <th>Rack density</th>
              <td className="num">{fmt(chain.rackDensityKw, 0)} kW</td>
            </tr>
            <tr>
              <th>Racks across the campus</th>
              <td className="num">{num(chain.racksTotal)}</td>
            </tr>
            <tr>
              <th>Racks per hall</th>
              <td className="num">{num(chain.racksPerHall)}</td>
            </tr>
            <tr>
              <th>Floor area per rack</th>
              <td className="num">{fmt(chain.hallFloorPerRackM2, 1)} m²</td>
            </tr>
            <tr>
              <th>Heat to liquid</th>
              <td className="num">{Math.round(chain.coolingToLiquidShare * 100)}%</td>
            </tr>
            <tr>
              <th>Heat still to air</th>
              <td className="num">{Math.round(chain.coolingToAirShare * 100)}%</td>
            </tr>
            <tr>
              <th>Busway current per rack</th>
              <td className="num">{Math.round(chain.buswayCurrentPerRackA)} A</td>
            </tr>
            <tr>
              <th>Same, at the worst case</th>
              <td className="num">{Math.round(chain.buswayCurrentPerRackEdbpA)} A</td>
            </tr>
            <tr>
              <th>Heat to reject</th>
              <td className="num">{fmt(chain.heatToRejectMw, 0)} MW</td>
            </tr>
            <tr>
              <th>Coolant flow per rack</th>
              <td className="num">{chain.coolantFlowLPerMinPerRack > 0 ? `${fmt(chain.coolantFlowLPerMinPerRack, 0)} L/min` : 'none'}</td>
            </tr>
            <tr>
              <th>Site water</th>
              <td className="num">
                {chain.coolingWaterM3Yr > 0 ? `${num(Math.round(chain.coolingWaterM3Yr))} m³/yr` : 'none'}
              </td>
            </tr>
            <tr>
              <th>Fabric ports per rack</th>
              <td className="num">{chain.networkPortsPerRack}</td>
            </tr>
            <tr>
              <th>Rack positions the supply funds</th>
              <td className="num">{fmt(chain.rackPositionUtilisationPct, 1)}%</td>
            </tr>
          </tbody>
        </table>
        <div className="tiny" style={{ marginTop: 6 }}>
          <b>Assumptions behind this chain</b> <Badge c="TYPICAL" />
          <table className="simple" style={{ marginTop: 4 }}>
            <tbody>
              {chain.assumptions.map((a, i) => (
                <tr key={i}>
                  <td style={{ width: '38%' }}>{a.key}</td>
                  <td className="num">{a.value}</td>
                  <td>{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="callout">
        <b>Power architecture.</b> {chain.archetype.rackPowerArchitecture}
      </div>
      <div className="callout derived">
        <b>Cooling.</b> {chain.archetype.coolingMix}
      </div>
      <div className="callout typical">
        <b>Distribution.</b>
        <ul className="plain" style={{ margin: '4px 0 0' }}>
          {chain.archetype.distributionNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
      <div className="callout typical">
        <b>Fabric.</b>
        <ul className="plain" style={{ margin: '4px 0 0' }}>
          {chain.archetype.fabricNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
      <div className="callout danger">
        <b>What limits this design:</b>
        <ul className="plain" style={{ margin: '4px 0 0' }}>
          {chain.archetype.limitingFactors.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <Panel>
      <h2>Clonee Hyperscale Data Centre Explorer</h2>
      <p className="lede">
        An interactive model of the Meta data centre campus at Clonee, County Meath: five data-storage buildings, twenty
        data halls, ninety diesel generators and one dedicated customer-built 220 kV substation, reconstructed from public
        planning, environmental, grid and industry records.
      </p>

      <div className="callout derived" style={{ marginTop: 10 }}>
        <b>The one rule of this application:</b> it separates what is <b>publicly documented for Clonee</b> from what a{' '}
        <b>typical hyperscale facility would probably contain</b>. Anything the public record does not state is labelled{' '}
        <Badge c="TYPICAL" />, even when it looks obvious. Turn on <b>evidence mode</b> in the toolbar to see the
        classification on every claim.
      </div>

      <Section title="The modelled campus">
        <div className="grid2">
          <Stat value={`${fmt(INPUTS.siteAreaHa, 1)} ha`} label="consented site" />
          <Stat value={`${INPUTS.buildingCount}`} label="data-storage buildings" />
          <Stat value={`${derived.hallCount}`} label="data halls" />
          <Stat value={`${fmt(derived.itCapacityMW, 0)} MW`} label="consented IT load" />
          <Stat value={`${INPUTS.generatorCount}`} label="diesel generators" />
          <Stat value={`${fmt(derived.transformerTotalMva, 0)} MVA`} label="substation capacity" />
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          The site, building count, IT capacity, generator count and substation rating are all published quantities. The
          transformer rating is derived from the consented load. <Cite ids={['MCC-150605', 'EPA-P1192', 'BP-VA0018']} />
        </div>
        <div className="callout" style={{ marginTop: 10 }}>
          <b>There is no CLN4.</b> The industrial emissions licence names CLN1, CLN2, CLN3, CLN5 and CLN6. The numbering
          gap is a real characteristic of the consent history, and this application preserves it rather than tidying it
          away.
        </div>
      </Section>

      <Section title="Where the buildings stand">
        <table className="simple">
          <thead>
            <tr>
              <th>Building</th>
              <th className="num">IT</th>
              <th className="num">Floor area</th>
              <th>Consent</th>
            </tr>
          </thead>
          <tbody>
            {BUILDINGS.map((b) => (
              <tr key={b.name}>
                <td>
                  <b>{b.name}</b>
                </td>
                <td className="num">{b.itMW} MW</td>
                <td className="num">{num(b.gfaM2)} m²</td>
                <td>
                  {b.consent} <Badge c={b.gfaBasis === 'PUBLISHED' ? 'PUBLIC FACT' : 'DERIVED'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="callout" style={{ marginTop: 8 }}>
          <b>About the layout.</b> {LAYOUT_NOTE}
        </div>
        <div className="tiny" style={{ marginTop: 4 }}>
          The modelled site rectangle is {num(SITE.halfW * 2)} m × {num(SITE.halfD * 2)} m, which is{' '}
          {fmt((SITE.halfW * 2 * SITE.halfD * 2) / 10_000, 1)} ha against a consented {INPUTS.siteAreaHa} ha.
        </div>
      </Section>

      <Section title="The capacity routes agree">
        <div className="callout derived">
          {capacityReconciliationSentence()}
        </div>
      </Section>

      <Section title="Why different capacity numbers exist">
        <CapacityClaims />
        <div className="tiny">
          The short version, from the campus model: <CapacityNotesTable />
        </div>
      </Section>

      <Section title="Reading the colours">
        {CLASSIFICATIONS.map((k) => (
          <div key={k} className="legend-row" style={{ alignItems: 'flex-start' }}>
            <span className="swatch" style={{ background: CLASSIFICATION_COLORS[k], marginTop: 4 }} />
            <span>
              <Badge c={k} /> {CLASSIFICATION_MEANING[k]}
            </span>
          </div>
        ))}
      </Section>

      <Section title="Rack archetypes — the chain from IT MW to a single rack">
        <ArchetypePanel />
      </Section>

      <Section title="How to use it">
        <ul className="plain">
          <li>Drag to orbit, scroll to zoom, click any component to focus it and read it. Escape deselects.</li>
          <li>Each mode emphasises one system so you can trace it end to end, and the roofs open automatically.</li>
          <li>Eight guided journeys run along the bottom, each moving the camera and lighting only what matters.</li>
          <li>Construction takes the site from a greenfield field to the mature five-building campus, on real dates.</li>
          <li>Commissioning walks the testing programme and blocks work that is not genuinely ready.</li>
          <li>Resilience lets you break something and watch the electrical state actually change.</li>
          <li>Project Controls puts a programme, a budget and a risk register behind the same physical assets.</li>
          <li>AI Evolution converts one delivered hall to modern liquid-cooled compute and finds out what stops you.</li>
        </ul>
      </Section>

      <Section title="What this is not">
        <p className="lede">
          It is not a design and it does not reproduce any operator's detailed design. It asserts no redundancy rating, no
          generator ratings and no achieved performance. Where the public record stops — at "switchgear", "cooling
          plant", "generators" — the model shows one credible implementation and labels it. Construction phase 24 is
          called "What the record does not say" and lists the gaps.
        </p>
        <FactNote c="PUBLIC FACT" ids={['EPA-P1192', 'BP-VA0018']}>
          The strongest claims in this application come from two documents: the industrial emissions licence, which names
          the five buildings and the ninety generators, and the planning report for the 220 kV substation, which fixes
          the compound, the bay count and the transformer count.
        </FactNote>
      </Section>
    </Panel>
  );
}

function CapacityNotesTable() {
  return (
    <>
      {CAPACITY_NOTES.map((c) => (
        <div key={c.figure} style={{ marginTop: 6 }}>
          <b className="mono">{c.figure}</b> <Cite ids={[c.source]} /> — {c.note}
        </div>
      ))}
    </>
  );
}

/* --------------------------------------------------------------------- power */

function PowerPanel() {
  const gridPhase = useStore((s) => s.gridPhase);
  const setGridPhase = useStore((s) => s.setGridPhase);
  const playing = useStore((s) => s.gridPlaying);
  const setPlaying = useStore((s) => s.setGridPlaying);
  const startJourney = useStore((s) => s.startJourney);
  const faults = useStore((s) => s.faults);
  const g = GRID_FAILURE_SEQUENCE[gridPhase];
  const state = supplyState(supplyFromSequenceStep(gridPhase, faults));

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
    <Panel>
      <h2>Power — 220 kV to rack</h2>
      <p className="lede">
        Every stage in this chain exists to answer one question: what stops a server losing power? Click any stage for
        its technical and delivery view.
      </p>
      <button className="primary" style={{ width: '100%', margin: '8px 0' }} onClick={() => startJourney('power')}>
        Guided tour: how does electricity reach a rack?
      </button>

      <Section title="The chain">
        <Chain
          ids={POWER_CHAIN}
          labels={[
            '220 kV transmission loop-in',
            '220 kV switchyard, 12 bays',
            'Step-down transformers, 220 → 20 kV',
            'Campus MV switchgear, 20 kV',
            'Unit substations, MV → LV',
            'UPS, battery backed',
            'LV distribution',
            'Hall busway',
            'Rack PDUs, 230 V single phase',
            'Rack',
            'Servers',
          ]}
        />
        <div className="tiny" style={{ marginTop: 6 }}>
          Consent RA150605 describes the campus distribution as underground 20 kV cables between the substation and the
          data-centre buildings, so the 20 kV run is a published arrangement. The lineup inside the building, the UPS
          architecture and the busway design are not. <Cite ids={['MCC-150605']} />
        </div>
      </Section>

      <Section title="The 220 kV connection">
        <div className="grid2">
          <Stat value="Aug 2017" label="station energised" />
          <Stat value="~15 mo" label="from start to energisation" />
        </div>
        <FactNote c="PUBLIC FACT" ids={['EIR-AR2017']}>
          EirGrid records the Clonee 220 kV station as completed in August 2017, built by the customer and connected to
          the transmission system in approximately 15 months. It was the first customer-built 220 kV station in Ireland.
        </FactNote>
        <table className="simple">
          <tbody>
            <tr>
              <th>Compound</th>
              <td className="num">{num(INPUTS.substationAreaM2)} m²</td>
            </tr>
            <tr>
              <th>Switchyard</th>
              <td>
                {INPUTS.hvBays} × 220 kV bays, outdoor air-insulated
              </td>
            </tr>
            <tr>
              <th>Step-down transformers</th>
              <td className="num">{INPUTS.stepDownTransformers}</td>
            </tr>
            <tr>
              <th>Lightning protection</th>
              <td className="num">{INPUTS.lightningMasts} masts</td>
            </tr>
            <tr>
              <th>Connection</th>
              <td>Loop-in, with {INPUTS.newTransmissionTowers} new transmission towers</td>
            </tr>
            <tr>
              <th>Modelled rating</th>
              <td className="num">
                {INPUTS.stepDownTransformers} × {fmt(A.transformerMva, 0)} MVA <Badge c="DERIVED" />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="tiny" style={{ marginTop: 4 }}>
          Bay count, transformer count, mast count, compound area, loop-in and the tower count are all published. The
          transformer rating is derived from the consented load and is not published. <Cite ids={['BP-VA0018']} />
        </div>
        <div className="callout" style={{ marginTop: 8 }}>
          <b>Why a data centre built its own grid connection.</b> The substation was the longest and least controllable
          part of the programme, so it was consented in 2015, delivered alongside the first phase, and energised before
          most of the buildings were fitted out. The civil and structural package alone was roughly 17,000 m², €6.2m and
          11 months, with 105 equipment bases and two transformer bunds holding 18,500 kg transformers.{' '}
          <Cite ids={['JP-SUB']} />
        </div>
      </Section>

      <Section title="Losing a transformer is the interesting case">
        <div className="grid3">
          <Stat value={`${fmt(derived.transformerTotalMva, 0)}`} label="MVA, three transformers" />
          <Stat value={`${fmt(derived.nMinusOneMva, 0)}`} label="MVA with one out" />
          <Stat value={`${fmt(derived.nMinusOneShortfallMW, 0)} MW`} label="shortfall at full load" />
        </div>
        <div className="callout danger" style={{ marginTop: 8 }}>
          At the modelled ratings the campus <b>does not lose power</b> when one transformer is out, because two of them
          still energise everything. What it cannot do is carry everything: {fmt(derived.nMinusOneMva, 0)} MVA against a
          facility draw of about {fmt(derived.facilityLoadMW, 0)} MW leaves roughly{' '}
          {fmt(derived.nMinusOneShortfallMW, 0)} MW to shed, which is close to one building's worth of IT load.
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          This is why a redundancy claim has to be tested against a load case rather than read off a diagram. Three
          transformers sounds robust until you ask what happens with one at campus peak.
        </p>
        <button className="primary" style={{ width: '100%' }} onClick={() => startJourney('grid')}>
          Guided tour: the 15-month grid connection
        </button>
      </Section>

      <Section title="Utility loss simulation">
        <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <button onClick={() => { setPlaying(false); setGridPhase(Math.max(0, gridPhase - 1)); }}>Back</button>
          <button onClick={() => setGridPhase(Math.min(GRID_FAILURE_SEQUENCE.length - 1, gridPhase + 1))}>Step</button>
          <button onClick={() => { setPlaying(false); setGridPhase(0); }}>Reset</button>
        </div>
        <div className="callout danger" style={{ borderColor: g.grid === 'lost' ? 'var(--danger)' : undefined }}>
          <div className="tiny mono">
            {g.t} · grid {g.grid.toUpperCase()} · UPS {g.ups ? 'ON' : 'off'} · generators {g.gen ? 'RUNNING' : 'standby'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0', color: '#fff' }}>{g.name}</div>
          <p style={{ margin: 0 }}>{g.detail}</p>
        </div>
        <div className="callout derived g teaching" style={{ marginTop: 8 }}>
          <b>What this step is teaching.</b> {g.teaching}
        </div>
        <div className="phase-list" style={{ marginTop: 8 }}>
          {GRID_FAILURE_SEQUENCE.map((p) => (
            <button
              key={p.id}
              className={`phase-row ${p.id === gridPhase ? 'now' : ''} ${p.id < gridPhase ? 'done' : ''}`}
              onClick={() => { setPlaying(false); setGridPhase(p.id); }}
            >
              <span className="phase-num">{p.t}</span>
              <span className="phase-body">
                <span>{p.name}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Electrical state of the model right now">
        <div className="grid2">
          <Stat value={state.sources.grid} label="grid source" />
          <Stat value={state.sources.generation} label="generation source" />
          <Stat value={state.carrying} label="carrying the load" />
          <Stat
            value={state.carrying === 'battery' ? `${num(Math.round(state.batteryKwh))} kWh` : 'on supply'}
            label={state.carrying === 'battery' ? `${fmt(state.autonomyMinutes, 1)} min autonomy` : 'UPS charging'}
          />
        </div>
        <div className={`callout ${state.marginMw < 0 ? 'danger' : 'fact'}`} style={{ marginTop: 8 }}>
          <b>Margin {state.marginMw >= 0 ? '+' : ''}{fmt(state.marginMw, 0)} MW</b> — utility capacity{' '}
          {fmt(state.utilityCapacityMw, 0)} MW, generation capacity {fmt(state.generationCapacityMw, 0)} MW, demand{' '}
          {fmt(state.totalLoadMw, 0)} MW.
        </div>
        {state.notes.map((n, i) => (
          <div key={i} className="callout typical" style={{ marginTop: 6 }}>
            {n}
          </div>
        ))}
        {state.marginMw < 0 && (
          <div className="callout danger">
            <b>Emergency load shed, in order.</b> The order is the teaching point.
            <table className="simple" style={{ marginTop: 6 }}>
              <tbody>
                {state.shed.map((s) => (
                  <tr key={s.action}>
                    <td className="num" style={{ width: 70 }}>{s.mw > 0 ? `${fmt(s.mw, 0)} MW` : '—'}</td>
                    <td>
                      <b>{s.action}</b>
                      <div className="tiny">{s.detail}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="tiny" style={{ marginTop: 6 }}>
          Capacities, battery energy and the shed order are <Badge c="TYPICAL" /> and <Badge c="SYNTHETIC" />. The
          transformer and generator capacities are derived from published counts and ratings. This is not a
          protection-coordination or load-flow model.
        </div>
      </Section>
    </Panel>
  );
}

/* ------------------------------------------------------------------- cooling */

function CoolingPanel() {
  const startJourney = useStore((s) => s.startJourney);
  const delivered = useMemo(() => chainFor('clonee-delivered', derived.itCapacityMW), []);
  const ai = useMemo(() => chainFor('ai-liquid', derived.itCapacityMW), []);

  return (
    <Panel>
      <h2>Cooling — chip to air</h2>
      <p className="lede">
        Clonee is indirectly air cooled, so the heat leaves the racks into air and never touches a liquid. That is a very
        different cooling architecture from a conventional data centre, and it is the reason this campus has a water
        licence at all.
      </p>
      <button className="primary" style={{ width: '100%', margin: '8px 0' }} onClick={() => startJourney('heat')}>
        Guided tour: where does the heat go?
      </button>

      <Section title="The heat path">
        <Chain
          ids={HEAT_CHAIN}
          labels={[
            'Servers (all electrical input becomes heat)',
            'In-hall air cooling',
            'Heat exchanger skids in the plant corridor',
            'Air coolers, indirectly air cooled',
            'Atmosphere',
          ]}
        />
      </Section>

      <Section title="What is public about the cooling">
        <FactNote c="PUBLIC FACT" ids={['SNWA-FB']}>
          The project uses indirect air cooling, over an IT area of approximately 75,000 m² at an IT power density of
          2.24 kW/m². Four halls per building, each of approximately 4,170 m².
        </FactNote>
        <FactNote c="PUBLIC FACT" ids={['EPA-P1192']}>
          The industrial emissions licence refers to residual evaporative cooling-water discharge, which means the plant
          runs wet at least some of the time.
        </FactNote>
        <div className="callout derived" style={{ marginTop: 8 }}>
          <b>Both are true, and together they describe the plant.</b> Indirect air cooling is by definition air-side, so
          the licensed discharge must come from an evaporative assist on the heat rejection side. The model uses a small
          assist — {Math.round(A.evaporativeFraction * 100)}% of annual heat — because Ireland has almost no cooling degree
          days and outside-air economisers carry most of the year.{' '}
          <Badge c="TYPICAL" />
        </div>
      </Section>

      <Section title="What the hall actually contains">
        <p className="lede">
          There is no coolant loop inside a delivered hall. Heat goes from the servers into air, across an air-to-water
          heat exchanger in the plant corridor, and out through air coolers to ambient. The only water on the critical
          path is the heat rejection circuit, and it is a rejector loop, not an IT loop.
        </p>
        <div className="callout" style={{ marginTop: 8 }}>
          <b>This absence is the point.</b> It means a delivered hall cannot simply be given liquid cooling, because
          there is no loop to connect to. See the AI Evolution mode.
        </div>
      </Section>

      <Section title="The 90/10 problem">
        <table className="simple">
          <thead>
            <tr>
              <th>Design</th>
              <th className="num">Heat to liquid</th>
              <th className="num">Heat still to air</th>
              <th className="num">Site water</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Clonee as delivered</td>
              <td className="num">{Math.round(delivered.coolingToLiquidShare * 100)}%</td>
              <td className="num">{Math.round(delivered.coolingToAirShare * 100)}%</td>
              <td className="num">{delivered.coolingWaterM3Yr > 0 ? `${num(Math.round(delivered.coolingWaterM3Yr))} m³/yr` : 'none'}</td>
            </tr>
            <tr>
              <td>Converted to rack-scale AI</td>
              <td className="num">{Math.round(ai.coolingToLiquidShare * 100)}%</td>
              <td className="num">{Math.round(ai.coolingToAirShare * 100)}%</td>
              <td className="num">{ai.coolingWaterM3Yr > 0 ? `${num(Math.round(ai.coolingWaterM3Yr))} m³/yr` : 'none'}</td>
            </tr>
          </tbody>
        </table>
        <div className="callout typical" style={{ marginTop: 8 }}>
          <b>Why the residual 10% matters.</b> Around nine-tenths of the heat at a rack-scale system is captured by cold
          plates, but roughly one-tenth still goes to air. In-hall air cooling therefore cannot be removed in a retrofit —
          only supplemented. <Badge c="TYPICAL" />
        </div>
      </Section>

      <Section title="Two separate heat rejection problems">
        <p className="lede">
          Ninety diesel generators reject more heat than they convert. That heat leaves through each set's own radiators,
          jacket water and exhaust, straight to ambient, with no water involved. It is a completely separate system from
          hall cooling, and it must work while everything else is also running.
        </p>
        <div className="grid2">
          <Stat value={`${fmt(derived.generatorRatedMW, 0)} MW`} label="generation rated" />
          <Stat value={`${fmt(derived.generationHeatMW, 0)} MW`} label="generation heat rejected" />
        </div>
        <div className="callout" style={{ marginTop: 8 }}>
          This is why a campus with no IT load at all still needs heat rejection, and why the campus water balance is
          driven by IT cooling rather than by the generation plant.
        </div>
        <button className="primary" style={{ width: '100%', marginTop: 10 }} onClick={() => startJourney('generators')}>
          Guided tour: ninety diesel generators
        </button>
      </Section>
    </Panel>
  );
}

/* --------------------------------------------------------------------- water */

function WaterPanel() {
  const startJourney = useStore((s) => s.startJourney);
  return (
    <Panel>
      <h2>Water — in, through, out</h2>
      <p className="lede">
        County Meath is one of the wettest places in Europe, and this campus still holds a water discharge licence. The
        reason is the single most counter-intuitive thing on this page, and it is worth understanding rather than
        accepting.
      </p>
      <button className="primary" style={{ width: '100%', margin: '8px 0' }} onClick={() => startJourney('water')}>
        Guided tour: the water licence in a wet country
      </button>

      <Section title="The answer to the obvious question">
        <div className="callout derived">
          <b>Outside-air economisers carry most of the year.</b> Ireland has almost no cooling degree days, so for the
          great majority of hours the outside air is cool enough to reject the heat without any water at all. The
          evaporative stage assists only in the hottest hours, and the licence exists for those hours.
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          That is why the modelled water use is small: {fmt(derived.wueLPerKwh, 2)} L per kWh of IT load, against an
          industry average nearer 1.8 for a conventional evaporatively cooled facility.{' '}
          {waterIntensitySentence()}
        </p>
      </Section>

      <Section title="The site water balance">
        <table className="simple">
          <thead>
            <tr>
              <th>Stream</th>
              <th className="num">Value</th>
              <th>Label</th>
            </tr>
          </thead>
          <tbody>
            {WATER_BALANCE.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.label}
                  <div className="tiny">{r.note}</div>
                  <Cite ids={r.sources} />
                </td>
                <td className="num">
                  {r.value}
                  {r.unit && <div className="tiny">{r.unit}</div>}
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
        <ul className="plain">
          {WATER_NARRATIVE.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </Section>

      <Section title="The wellfield is the backstop, and a negotiation">
        <div className="grid2">
          <Stat value={`${fmt(derived.borefieldLPerSecond, 1)} L/s`} label="modelled wellfield" />
          <Stat value={`${fmt(derived.supplyGapM3Yr, 0)}`} label="m³/yr gap to cover" />
        </div>
        <div className="callout" style={{ marginTop: 8 }}>
          Rainfall capture covers roughly {fmt(derived.groundwaterCoverage * 100, 0)}% of the modelled demand. The
          remainder is what the wellfield is for, and its capacity is a derived figure from the climate rather than a
          published value.
        </div>
      </Section>
    </Panel>
  );
}

/* ---------------------------------------------------------------------- data */

function DataPanel() {
  const startJourney = useStore((s) => s.startJourney);
  return (
    <Panel>
      <h2>Data and network — fibre to server</h2>
      <p className="lede">
        Clonee is an overland fibre campus, not a subsea landing. There is no cable arriving from the sea, which makes
        carrier diversity at the site boundary the first thing to design rather than the last.
      </p>
      <button className="primary" style={{ width: '100%', margin: '8px 0' }} onClick={() => startJourney('fibre')}>
        Guided tour: how does fibre reach the servers?
      </button>

      <Section title="The path">
        <Chain
          ids={FIBRE_CHAIN}
          labels={[
            'Terrestrial fibre routes',
            'Meet-me rooms',
            'Campus aggregation core',
            'Hall fabric',
            'Racks',
          ]}
        />
      </Section>

      <Section title="What is public">
        <FactNote c="PUBLIC FACT" ids={['SNWA-FB']}>
          Two meet-me rooms for data connectivity per building, on a campus served by a 108 MVA supply from 100%
          renewable sources.
        </FactNote>
        <div className="callout derived" style={{ marginTop: 8 }}>
          Diversity is easy to draw and easy to lose. Two routes that share a duct, a bridge or a landlord compound are
          not two routes, and a ring only protects against a cut if both ends of it can see the break. <Badge c="TYPICAL" />
        </div>
      </Section>

      <Section title="The network in layers">
        <table className="simple">
          <thead>
            <tr>
              <th>Layer</th>
              <th>Purpose</th>
              <th>Limited by</th>
            </tr>
          </thead>
          <tbody>
            {NETWORK_LAYERS.map((l) => (
              <tr key={l.id}>
                <td>
                  <b>{l.name}</b> <Badge c={l.classification} />
                  <div className="tiny mono">{l.path}</div>
                </td>
                <td>{l.purpose}</td>
                <td>
                  <ul className="plain" style={{ margin: 0, paddingLeft: 14 }}>
                    {l.limitingFactors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="What changes when an AI workload arrives">
        <ol className="plain">
          <li>Rack power rises by roughly an order of magnitude, and so does the current at the rack.</li>
          <li>Compute becomes east-west dominant, so the fabric inside and between racks carries far more than the fabric outside.</li>
          <li>At rack scale the switch fabric becomes part of the rack, which removes a whole layer of the design.</li>
          <li>Ports and optics dominate cost and failure, not bandwidth.</li>
        </ol>
        <div className="callout danger" style={{ marginTop: 8 }}>
          Power per rack rises from about {fmt(derived.deliveredRackAmps, 0)} A to about {fmt(derived.aiRackAmps, 0)} A,
          and to {fmt(derived.aiRackAmpsEdbp, 0)} A at the worst-case design point that the distribution is actually
          provisioned for. See the AI Evolution mode.
        </div>
      </Section>
    </Panel>
  );
}

/* ---------------------------------------------------------------- resilience */

function ResiliencePanel() {
  const faults = useStore((s) => s.faults);
  const toggleFault = useStore((s) => s.toggleFault);
  const clearFaults = useStore((s) => s.clearFaults);
  const startJourney = useStore((s) => s.startJourney);
  const [open, setOpen] = useState<string | null>(null);
  const state = supplyState(supplyFromSequenceStep(useStore.getState().gridPhase, faults));

  return (
    <Panel>
      <h2>Resilience — break it on purpose</h2>
      <p className="lede">
        The interesting failures on this campus are not dramatic. Total loss of grid supply is the scenario everyone
        imagines and the easy one. Losing one of three transformers is the one that teaches.
      </p>
      <button className="primary" style={{ width: '100%', margin: '8px 0' }} onClick={() => startJourney('generators')}>
        Guided tour: what happens when grid power fails?
      </button>

      <Section title="Inject a failure">
        {FAULT_SCENARIOS.map((s) => {
          const on = faults.includes(s.targetType);
          const expanded = open === s.id || on;
          const cls = s.consequence === 'absorbed' ? 'fact' : s.consequence === 'degraded' ? 'typical' : 'danger';
          return (
            <div key={s.id} style={{ marginBottom: 8 }}>
              <button
                className={`row ${on ? 'on' : ''}`}
                onClick={() => {
                  toggleFault(s.targetType);
                  setOpen(open === s.id ? null : s.id);
                }}
              >
                <span className="glyph">{on ? '■' : '□'}</span>
                <span className="body">
                  <b>
                    {s.label} — {s.targetLabel}
                  </b>
                  <span>
                    {s.siblings.length > 0
                      ? `${s.siblings.length} sibling${s.siblings.length > 1 ? 's' : ''} still working`
                      : 'No sibling of this type on the model'}
                  </span>
                </span>
                <span className="num" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.consequence}
                </span>
              </button>
              {expanded && (
                <div className="callout" style={{ marginTop: 4 }}>
                  <b>{s.headline}</b>
                  {s.siblings.length === 0 && (
                    <div className="tiny" style={{ marginTop: 4 }}>
                      This type has a single instance in the model, so there is nothing left to carry the load. That is
                      what makes it a single point of failure, and it is the finding rather than a gap in the data.
                    </div>
                  )}
                  <ul className="plain" style={{ margin: '6px 0 0' }}>
                    {s.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <div className={`callout ${cls}`} style={{ margin: '8px 0 0' }}>
                    <b>Evidence caveat.</b> {s.caveat}
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

      <Section title="What the model holds right now">
        <div className="grid2">
          <Stat value={state.carrying} label="carrying the load" />
          <Stat
            value={`${state.marginMw >= 0 ? '+' : ''}${fmt(state.marginMw, 0)} MW`}
            label="capacity margin"
          />
        </div>
        {state.notes.length > 0 && (
          <div className="callout typical" style={{ marginTop: 8 }}>
            <ul className="plain" style={{ margin: 0 }}>
              {state.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="The vocabulary">
        <table className="simple">
          <thead>
            <tr>
              <th>Term</th>
              <th>Definition</th>
              <th>How to test the claim</th>
            </tr>
          </thead>
          <tbody>
            {REDUNDANCY_CONCEPTS.map((c) => (
              <tr key={c.term}>
                <td>
                  <b>{c.term}</b>
                </td>
                <td>{c.definition}</td>
                <td style={{ color: 'var(--accent)' }}>{c.test}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Emergency load shed order">
        <table className="simple">
          <thead>
            <tr>
              <th className="num">Rank</th>
              <th>Loads</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {SHED_PRIORITY.map((s) => (
              <tr key={s.rank}>
                <td className="num">{s.rank}</td>
                <td>{s.group}</td>
                <td>{s.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="callout danger" style={{ marginTop: 14 }}>
        <b>What this mode is not.</b> {POWER_STRESS_NOTE}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- construction */

function ConstructionPanel() {
  const phase = useStore((s) => s.constructPhase);
  const setPhase = useStore((s) => s.setConstructPhase);
  const ready = useMemo(() => buildingsReady(phase, COMPONENTS), [phase]);
  const current = PHASES[phase];
  const startJourney = useStore((s) => s.startJourney);
  const liveCount = ready.filter((r) => r.live).length;
  const handedCount = ready.filter((r) => r.handedOver).length;
  const liveMw = ready.filter((r) => r.live).reduce((a, r) => a + r.itMW, 0);

  return (
    <Panel>
      <h2>Construction — field to operating campus</h2>
      <p className="lede">
        {PHASES.length} phases, anchored to real dates: consent in 2015, the 220 kV station energised in August 2017,
        CLN1 complete that December, CLN2 handed over in May 2018, CLN3 in 2019, and the expansion buildings built
        beside an operating campus.
      </p>
      <button className="primary" style={{ width: '100%', margin: '8px 0' }} onClick={() => startJourney('build')}>
        Guided tour: building beside a running data centre
      </button>

      <div
        style={{
          position: 'sticky',
          top: -12,
          background: 'var(--panel)',
          padding: '8px 0 10px',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 6 }}>
          <button onClick={() => setPhase(Math.max(0, phase - 1))} aria-label="Previous phase">‹</button>
          <span className="tiny" style={{ flex: 1, textAlign: 'center' }}>
            phase {phase} of {PHASES.length - 1} · {current.period} · {CUMULATIVE_MONTHS[phase]} months in
          </span>
          <button onClick={() => setPhase(Math.min(PHASES.length - 1, phase + 1))} aria-label="Next phase">›</button>
        </div>
        <input
          type="range"
          min={0}
          max={PHASES.length - 1}
          step={1}
          value={phase}
          onChange={(e) => setPhase(Number(e.target.value))}
          style={{ width: '100%' }}
          aria-label="Construction phase"
        />
      </div>

      <div className="callout derived">
        <div className="tiny" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          {current.period}
          {current.inferred ? ' · inferred window' : ' · dated event'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{current.name}</div>
        <p style={{ margin: 0 }}>{current.detail}</p>
      </div>

      <Section title="Live status">
        <div className="grid2">
          <Stat value={`${liveCount} of ${BUILDINGS.length}`} label="buildings carrying IT" />
          <Stat value={`${fmt(liveMw, 0)} MW`} label="IT energised" />
          <Stat value={`${handedCount} of ${BUILDINGS.length}`} label="handed to operations" />
          <Stat value={`${CUMULATIVE_MONTHS[phase]} mo`} label="elapsed" />
        </div>
        <table className="simple" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Building</th>
              <th className="num">IT</th>
              <th>Live</th>
              <th>Handed over</th>
              <th className="num">Scope complete</th>
            </tr>
          </thead>
          <tbody>
            {ready.map((r) => (
              <tr key={r.index}>
                <td>
                  <b>{r.name}</b>
                </td>
                <td className="num">{r.itMW} MW</td>
                <td style={{ color: r.live ? 'var(--fact)' : 'var(--dim)' }}>{r.live ? 'yes' : 'no'}</td>
                <td style={{ color: r.handedOver ? 'var(--fact)' : 'var(--dim)' }}>{r.handedOver ? 'yes' : 'no'}</td>
                <td className="num">
                  {r.componentsComplete}/{r.componentsTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tiny" style={{ marginTop: 4 }}>
          Each building carries {num(RACKS_PER_HALL)} racks per hall in the model, and {INPUTS.generatorsPerBuilding}{' '}
          generators. Live and handover are taken from each building's own real delivery window rather than from a
          simulated offset.
        </div>
      </Section>

      <Section title="Why phases, and why overlapping">
        <ul className="plain">
          {MODULAR_DELIVERY_NOTES.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </Section>

      <Section title="The full sequence">
        <div className="phase-list">
          {PHASES.map((p) => (
            <button
              key={p.id}
              className={`phase-row ${p.index === phase ? 'now' : ''} ${p.index < phase ? 'done' : ''}`}
              onClick={() => setPhase(p.index)}
            >
              <span className="phase-num">{String(p.index).padStart(2, '0')}</span>
              <span className="phase-body">
                <span>{p.name}</span>
                <span className="phase-period">
                  {p.period}
                  {p.inferred ? ' · inferred' : ' · published'}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Temporary works you can watch appear and disappear">
        <ul className="plain">
          <li>Site establishment, welfare accommodation and the erosion and sediment controls.</li>
          <li>The temporary haul route, which is removed once the permanent internal roads are in.</li>
          <li>Tower cranes over each building bar during shell construction.</li>
          <li>Sediment ponds, which are removed once the attenuation basin is operational.</li>
        </ul>
      </Section>

      <div className="callout" style={{ marginTop: 14 }}>
        Modelled programme: about {TOTAL_MONTHS} months from consent to the mature campus, of which{' '}
        {fmt(CUMULATIVE_MONTHS[PHASES.length - 1] - CUMULATIVE_MONTHS[0], 0)} months are the modelled AI retrofit study
        and conversion.
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- commissioning */

function CommissioningPanel() {
  const cxState = useStore((s) => s.cx);
  const completePackageStage = useStore((s) => s.completePackageStage);
  const resetCx = useStore((s) => s.resetCx);
  const [open, setOpen] = useState<string | null>(TURNOVER_PACKAGES[0].id);
  const [showStages, setShowStages] = useState(false);

  const selected = open ? PACKAGE_BY_ID[open] : null;
  const next = selected ? nextStageForPackage(cxState, selected.id) : null;
  const blockers = selected ? blockersForPackage(cxState, selected.id) : [];
  const outstanding = outstandingPackages(cxState);

  return (
    <Panel>
      <h2>Commissioning — turnover packages</h2>
      <p className="lede">
        Commissioning status belongs to turnover boundaries, not to a global progress bar. A gate on "integrated systems
        testing" across the site tells you nothing about whether one rack can be accepted; what matters is whether the
        packages containing its power, cooling, network and controls boundaries are signed off.
      </p>
      <div className="grid2" style={{ marginTop: 10 }}>
        <Stat value={`${TURNOVER_PACKAGES.length - outstanding.length}`} label="packages signed off" />
        <Stat value={`${outstanding.length}`} label="still outstanding" />
      </div>
      <div className="tiny" style={{ marginTop: 6 }}>
        The level structure L0–L6 is industry practice. Clonee publishes no commissioning information at all, so every
        stage and duration here is <Badge c="TYPICAL" />.
      </div>

      <Section title="Turnover packages">
        <div className="tiny" style={{ marginBottom: 6 }}>
          Building-level packages are shared by all four halls. Hall-level packages are scoped to one hall.
        </div>
        <div className="phase-list">
          {TURNOVER_PACKAGES.map((p) => {
            const done = packageDone(cxState, p.id).length;
            const complete = done >= p.stages.length;
            const blocked = blockersForPackage(cxState, p.id).length;
            return (
              <button
                key={p.id}
                className={`phase-row ${open === p.id ? 'now' : ''} ${complete ? 'done' : ''}`}
                onClick={() => setOpen(p.id)}
              >
                <span className="phase-num" style={{ color: complete ? 'var(--fact)' : 'var(--typical)' }}>
                  {complete ? '■' : '▣'}
                </span>
                <span className="phase-body">
                  <span>{p.title}</span>
                  <span className="tiny">
                    {done}/{p.stages.length} stages
                    {blocked > 0 && <span style={{ color: 'var(--typical)' }}> · {blocked} blockers</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {selected && (
        <Section title={selected.title}>
          <div className="callout derived">
            <b>Turnover boundary.</b> {selected.boundary}
          </div>
          <p className="lede" style={{ marginTop: 8 }}>{selected.note}</p>
          {selected.requires.length > 0 && (
            <div className="tiny" style={{ marginBottom: 8 }}>
              <b>Requires:</b>{' '}
              {selected.requires.map((r) => (
                <span key={r} style={{ marginRight: 6 }}>
                  {PACKAGE_BY_ID[r]?.title ?? r}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            <button
              className="primary"
              disabled={!next || blockers.length > 0}
              onClick={() => next && completePackageStage(selected.id, next)}
            >
              {next ? `Complete: ${stageName(next)}` : 'Package signed off'}
            </button>
            <button onClick={() => setShowStages(!showStages)}>
              {showStages ? 'Hide stages' : `Show ${selected.stages.length} stages`}
            </button>
            <button onClick={resetCx}>Reset all</button>
          </div>

          {blockers.length > 0 ? (
            <div className="callout danger">
              <b>Blocked. This package cannot advance until:</b>
              <ul className="plain" style={{ margin: '6px 0 0' }}>
                {blockers.map((b, i) => (
                  <li key={i}>{b.message}</li>
                ))}
              </ul>
            </div>
          ) : next ? (
            <div className="callout fact">
              <b>Ready.</b>{' '}
              {(
                CX_STAGES.find((s) => s.id === next)?.detail ?? ''
              )}
              <div className="tiny" style={{ marginTop: 6 }}>
                <b>Evidence produced:</b> {CX_STAGES.find((s) => s.id === next)?.evidence}
              </div>
            </div>
          ) : (
            <div className="callout fact">
              <b>Signed off.</b> {selected.title} is accepted and its successors can advance.
            </div>
          )}

          {showStages && (
            <div className="phase-list" style={{ marginTop: 8 }}>
              {selected.stages.map((s) => {
                const st = CX_STAGES.find((x) => x.id === s);
                const done = packageDone(cxState, selected.id).includes(s);
                return (
                  <div key={s} className={`phase-row ${done ? 'done' : ''}`} style={{ cursor: 'default' }}>
                    <span className="phase-num" style={{ color: done ? 'var(--fact)' : 'var(--dim)' }}>
                      {st?.level}
                    </span>
                    <span className="phase-body">
                      <span>
                        {st?.name}
                        {done && <span style={{ color: 'var(--fact)' }}> · complete</span>}
                      </span>
                      <span className="tiny">{st?.evidence}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      <Section title="Why the hall IT package is usually the gate">
        <p className="lede">
          A hall's IT package depends on its power distribution, its cooling distribution and its network fabric. The
          power package usually passes. The cooling package is the one that slips, because a hall can be electrically
          complete and thermally unable to accept IT load — and on an air-cooled campus that is partly a function of the
          weather on the day the test is run.
        </p>
      </Section>

      <Section title="Scripted scenarios">
        {CX_SCENARIOS.map((s) => (
          <details key={s.id} style={{ marginBottom: 8 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 550, marginBottom: 6 }}>{s.prompt}</summary>
            <div className="callout typical">
              <b>What this proves.</b> {s.whatYouAreTesting}
            </div>
            <div className="tiny" style={{ margin: '8px 0 4px' }}>
              <b>Expected:</b>
            </div>
            <ul className="plain">
              {s.expected.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
            <div className="tiny" style={{ margin: '8px 0 4px' }}>
              <b>Watch:</b>
            </div>
            <ul className="plain">
              {s.watch.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </details>
        ))}
      </Section>

      <div className="callout" style={{ marginTop: 14 }}>
        {outstanding.length} of {TURNOVER_PACKAGES.length} packages remain outstanding. The dependency graph is real:
        the substation gates every electrical package, and each building's electrical rooms gate all four of its halls at
        once.
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------- project controls */

function EvChart({ month }: { month: number }) {
  const slice = EARNED_VALUE.filter((e) => e.phase <= month);
  const max = Math.max(...slice.map((e) => Math.max(e.pvM, e.evM, e.acM)), 1);
  const w = 300;
  const h = 96;
  const bw = Math.max(2, (w / Math.max(slice.length, 1)) * 0.26);
  const gap = (w / Math.max(slice.length, 1)) * 0.08;
  const y = (v: number) => h - (v / max) * h;
  const cur = EARNED_VALUE[month];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 4}`} width="100%" height="128" role="img" aria-label="Planned, earned and actual cost by data date">
        <line x1={0} y1={h} x2={w} y2={h} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        {slice.map((e, i) => {
          const x = i * (bw * 3 + gap * 3) + gap;
          return (
            <g key={e.phase}>
              <rect x={x} y={y(e.pvM)} width={bw} height={h - y(e.pvM)} fill="rgba(255,255,255,0.24)" />
              <rect x={x + bw + gap} y={y(e.evM)} width={bw} height={h - y(e.evM)} fill="var(--accent)" />
              <rect x={x + (bw + gap) * 2} y={y(e.acM)} width={bw} height={h - y(e.acM)} fill="var(--typical)" />
            </g>
          );
        })}
      </svg>
      <div className="legend-row" style={{ gap: 12, marginTop: 2 }}>
        <span className="legend-row">
          <span className="swatch" style={{ background: 'rgba(255,255,255,0.24)' }} /> planned {fmt(cur.pvM, 0)}M
        </span>
        <span className="legend-row">
          <span className="swatch" style={{ background: 'var(--accent)' }} /> earned {fmt(cur.evM, 0)}M
        </span>
        <span className="legend-row">
          <span className="swatch" style={{ background: 'var(--typical)' }} /> actual {fmt(cur.acM, 0)}M
        </span>
      </div>
    </div>
  );
}

function ControlsPanel() {
  const month = useStore((s) => s.controlsMonth);
  const setMonth = useStore((s) => s.setControlsMonth);
  const scenario = useStore((s) => s.scenario);
  const setScenario = useStore((s) => s.setScenario);
  const moveCamera = useStore((s) => s.moveCamera);
  const ev = EARNED_VALUE[month];
  const lines = useMemo(() => budgetAt(month), [month]);
  const liveRisks = useMemo(() => risksAt(month), [month]);
  const active = SCENARIOS.find((s) => s.id === scenario) ?? null;
  const totalBudget = EARNED_VALUE[lines.length - 1].pvM;

  return (
    <Panel>
      <h2>Project controls</h2>
      <p className="lede">
        A synthetic delivery model built around the real physical project. The budget, the schedule shape and the
        workforce figures are anchored to published Irish cost and staffing data; the individual transactions are not
        historical, and are labelled accordingly.
      </p>

      <div className="callout synthetic" style={{ marginTop: 10 }}>
        <b>None of this is Meta's project-control data.</b> It exists to show how a programme of this shape behaves, and
        it is generated from the same phase list as the 3D model so the two cannot disagree. <Badge c="SYNTHETIC" />
      </div>

      <div style={{ display: 'flex', gap: 5, alignItems: 'center', margin: '12px 0 6px' }}>
        <button onClick={() => setMonth(Math.max(0, month - 1))} aria-label="Earlier data date">‹</button>
        <span className="tiny" style={{ flex: 1, textAlign: 'center' }}>
          data date {ev.period} · {ev.month} months in
        </span>
        <button onClick={() => setMonth(Math.min(PHASES.length - 1, month + 1))} aria-label="Later data date">›</button>
      </div>
      <input
        type="range"
        min={0}
        max={PHASES.length - 1}
        step={1}
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        style={{ width: '100%' }}
        aria-label="Project controls data date"
      />

      <Section title="Budget position">
        <Meter value={ev.evM} max={totalBudget} colour="var(--accent)" label="Earned value" valueLabel={`${fmt(ev.evM, 0)}M`} />
        <Meter value={ev.acM} max={totalBudget} colour="var(--typical)" label="Actual cost" valueLabel={`${fmt(ev.acM, 0)}M`} />
        <Meter value={ev.committedM} max={totalBudget} colour="var(--synthetic)" label="Committed" valueLabel={`${fmt(ev.committedM, 0)}M`} />
        <div className="grid3">
          <Stat value={ev.cpi.toFixed(2)} label="CPI" />
          <Stat value={ev.spi.toFixed(2)} label="SPI" />
          <Stat value={num(ev.headcount)} label="on site" />
        </div>
        <div className={`callout ${ev.svM < -8 ? 'typical' : 'fact'}`} style={{ marginTop: 8 }}>
          {programmeStatus(month)}
        </div>
      </Section>

      <Section title="Earned value to date">
        <EvChart month={month} />
      </Section>

      <Section title="Budget by work package">
        <table className="simple">
          <thead>
            <tr>
              <th>Code</th>
              <th>Package</th>
              <th className="num">Budget</th>
              <th className="num">Complete</th>
              <th className="num">Forecast</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.code}>
                <td className="mono">{l.code}</td>
                <td>
                  <b>{l.name}</b>
                  <div className="tiny">{l.delivers}</div>
                </td>
                <td className="num">{fmt(l.budgetM, 0)}M</td>
                <td className="num" style={{ color: l.completePct >= 99 ? 'var(--fact)' : 'var(--muted)' }}>
                  {fmt(l.completePct, 0)}%
                </td>
                <td className="num" style={{ color: l.forecastM > l.budgetM ? 'var(--typical)' : 'var(--muted)' }}>
                  {fmt(l.forecastM, 0)}M
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Live risks">
        {liveRisks.length === 0 ? (
          <p className="lede">No open risks are live at this data date.</p>
        ) : (
          <table className="simple">
            <thead>
              <tr>
                <th>Risk</th>
                <th className="num">L×I</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {liveRisks.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.title}</b> <Badge c="SYNTHETIC" />
                    <div className="tiny">{r.detail}</div>
                  </td>
                  <td className="num">
                    {r.likelihood}×{fmt(r.impactM, 0)}M
                  </td>
                  <td className="tiny">{r.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Change register">
        <table className="simple">
          <thead>
            <tr>
              <th>Change</th>
              <th className="num">Value</th>
              <th className="num">Days</th>
              <th>Origin</th>
            </tr>
          </thead>
          <tbody>
            {CHANGES.filter((c) => c.phase <= month).map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.title}</b>
                  <div className="tiny">{c.description}</div>
                </td>
                <td className="num">{c.valueM > 0 ? `+${fmt(c.valueM, 1)}M` : fmt(c.valueM, 1)}</td>
                <td className="num">{c.days}</td>
                <td className="tiny">{c.origin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Milestone history">
        <table className="simple">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Consequence</th>
            </tr>
          </thead>
          <tbody>
            {MILESTONES.filter((m) => m.phase <= month).map((m) => (
              <tr key={m.name}>
                <td>
                  <b>{m.name}</b>
                  {m.published && (
                    <div className="tiny" style={{ color: 'var(--fact)' }}>published event</div>
                  )}
                </td>
                <td className="tiny">{m.consequence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Scenarios">
        {SCENARIOS.map((s) => (
          <div key={s.id} style={{ marginBottom: 8 }}>
            <button
              className={`row ${scenario === s.id ? 'on' : ''}`}
              onClick={() => {
                const nextId = scenario === s.id ? null : s.id;
                setScenario(nextId);
                if (nextId) {
                  setMonth(s.phase);
                  const first = s.moves.find((m) => COMPONENT_BY_ID[m]);
                  if (first) {
                    const c = COMPONENT_BY_ID[first];
                    const span = Math.max(c.size[0], c.size[2]) * 0.9 + 40;
                    moveCamera(
                      [c.pos[0] + span * 0.7, c.pos[1] + span * 0.8, c.pos[2] + span * 0.9],
                      [c.pos[0], c.pos[1] + 8, c.pos[2]],
                    );
                  }
                }
              }}
            >
              <span className="glyph">{scenario === s.id ? '■' : '□'}</span>
              <span className="body">
                <b>{s.title}</b>
                <span>{s.prompt}</span>
              </span>
              <span className="num">+{s.delayDays} d</span>
            </button>
            {active?.id === s.id && (
              <div style={{ marginTop: 4 }}>
                <div className="callout derived">
                  <b>What moves.</b>
                  <ul className="plain" style={{ margin: '4px 0 0' }}>
                    {s.moves.slice(0, 6).map((m) => (
                      <li key={m} className="mono">{m}</li>
                    ))}
                  </ul>
                </div>
                <div className="callout synthetic">
                  <b>What the controls numbers do.</b>
                  <ul className="plain" style={{ margin: '4px 0 0' }}>
                    {s.controls.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div className="callout danger">
                  <b>What usually gets this wrong.</b> {s.misconception}
                </div>
              </div>
            )}
          </div>
        ))}
      </Section>
    </Panel>
  );
}

/* ------------------------------------------------------------- AI evolution */

function AiPanel() {
  const startJourney = useStore((s) => s.startJourney);
  const select = useStore((s) => s.select);
  const moveCamera = useStore((s) => s.moveCamera);
  const delivered = useMemo(() => chainFor('clonee-delivered', derived.itCapacityMW), []);
  const ai = useMemo(() => chainFor('ai-liquid', derived.itCapacityMW), []);

  const focusRetrofit = () => {
    const id = `${RETROFIT_HALL}.rack`;
    select(id, false);
    const c = COMPONENT_BY_ID[id];
    if (c) {
      const span = 120;
      moveCamera([c.pos[0] + span * 0.6, 90, c.pos[2] + span * 0.8], [c.pos[0], 4, c.pos[2]]);
    }
  };

  return (
    <Panel>
      <h2>AI Evolution</h2>
      <p className="lede">
        What happens if a hall delivered in 2017 had to carry modern rack-scale compute? The retrofit kit is shown in
        the scene: turn the roofs off and the cold plates, manifolds and coolant distribution units appear in{' '}
        {RETROFIT_HALL.replace('.h3', ' hall 3')} alongside the air-cooled equipment it would sit next to.
      </p>
      <button className="primary" style={{ width: '100%', margin: '8px 0' }} onClick={() => focusRetrofit()}>
        Fly to the retrofit hall
      </button>
      <button style={{ width: '100%', marginBottom: 8 }} onClick={() => startJourney('ai')}>
        Guided tour: converting a 2017 hall to AI
      </button>

      <Section title="The finding: the constraint is electricity, not space">
        <div className="grid3">
          <Stat value={num(Math.round(derived.rackPositionsInItArea))} label="rack positions the floor could hold" />
          <Stat value={num(Math.round(derived.racksAffordableAtAiDensity))} label="racks the supply could fund" />
          <Stat value={`${fmt(derived.geometricUtilisationPct, 1)}%`} label="of positions funded" />
        </div>
        <div className="callout danger" style={{ marginTop: 10 }}>
          <b>There is no shortage of floor.</b> The published IT area of approximately {num(INPUTS.itAreaM2)} m² at
          roughly 2.5 m² per rack position could physically hold about {num(Math.round(derived.rackPositionsInItArea))}{' '}
          racks. The campus has {fmt(derived.itCapacityMW, 0)} MW of electrical supply, which at {fmt(AI_KW, 0)} kW per
          rack funds about {num(Math.round(derived.racksAffordableAtAiDensity))} of them. That is{' '}
          {fmt(derived.geometricUtilisationPct, 1)}% of the geometric capacity.{' '}
          <Badge c="DERIVED" />
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          So the order of constraints is electricity, then cooling architecture, then structural floor loading, and only
          then space. Any retrofit plan that starts by counting rack positions has started in the wrong place.
        </p>
      </Section>

      <Section title="Constraint one: the power train">
        <table className="simple">
          <thead>
            <tr>
              <th>At the rack</th>
              <th className="num">Clonee as delivered</th>
              <th className="num">Rack-scale AI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rack power</td>
              <td className="num">{fmt(INPUTS.deliveredRackKw, 1)} kW</td>
              <td className="num">{fmt(AI_KW, 0)} kW</td>
            </tr>
            <tr>
              <td>Current on 415 V three-phase</td>
              <td className="num">{fmt(derived.deliveredRackAmps, 1)} A</td>
              <td className="num">{fmt(derived.aiRackAmps, 0)} A</td>
            </tr>
            <tr>
              <td>Current at the design point</td>
              <td className="num">—</td>
              <td className="num">{fmt(derived.aiRackAmpsEdbp, 0)} A</td>
            </tr>
            <tr>
              <td>Density jump</td>
              <td className="num">1×</td>
              <td className="num">{fmt(derived.densityJump, 1)}×</td>
            </tr>
          </tbody>
        </table>
        <div className="callout danger" style={{ marginTop: 8 }}>
          Distribution is provisioned to the <b>worst</b> case, not the operating case, which is why the design-point
          figure is the one that matters. At about {fmt(derived.aiRackAmpsEdbp, 0)} A per rack the existing rack PDUs and
          busway tap-offs are several times undersized, and they are the long-lead items. <Badge c="TYPICAL" />
        </div>
      </Section>

      <Section title="Constraint two: the hall has no coolant loop">
        <div className="callout danger">
          <b>An indirectly air-cooled hall cannot natively accept liquid cooling.</b> There is no coolant loop inside the
          hall to connect a coolant distribution unit to, because the IT air never touched a liquid in the first place.
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          The realistic paths are liquid-to-air sidecar units, which need no facility water and cost parasitic fan power;
          or a wholesale conversion to a chilled-water loop, which is a much larger project. A hall that already had a
          chilled-water primary loop could transition to any mix of liquid and air. This hall is the hard case.
        </p>
        <div className="grid2">
          <Stat value={`${Math.round(ai.coolingToLiquidShare * 100)}%`} label="heat to liquid at rack scale" />
          <Stat value={`${fmt(ai.coolantFlowLPerMinPerRack, 0)} L/min`} label="coolant flow per rack" />
        </div>
        <div className="tiny" style={{ marginTop: 6 }}>
          Around one-tenth of the heat still goes to air, so the in-hall air cooling cannot be removed. <Cite ids={['IND-LC']} />
        </div>
      </Section>

      <Section title="Constraint three: the slab">
        <div className="grid2">
          <Stat value="~2,100 kg/m²" label="loaded rack-scale system" />
          <Stat value="~1,500 kg/m²" label="conventional hall design" />
        </div>
        <div className="callout typical" style={{ marginTop: 8 }}>
          A loaded rack-scale system is roughly 40% heavier than a conventional hall is designed for, and the weight
          concentrates in the power shelves at the top and bottom rather than distributing evenly. Point-load checks and
          load-spreading hardware become mandatory. <Badge c="TYPICAL" />
        </div>
      </Section>

      <Section title="Delivered design against the converted design">
        <ArchetypePanel defaultId="ai-liquid" />
      </Section>

      <Section title="The numbers side by side">
        <table className="simple">
          <thead>
            <tr>
              <th />
              <th className="num">As delivered</th>
              <th className="num">Rack-scale AI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rack density</td>
              <td className="num">{fmt(delivered.rackDensityKw, 0)} kW</td>
              <td className="num">{fmt(ai.rackDensityKw, 0)} kW</td>
            </tr>
            <tr>
              <td>Racks campus-wide</td>
              <td className="num">{num(delivered.racksTotal)}</td>
              <td className="num">{num(ai.racksTotal)}</td>
            </tr>
            <tr>
              <td>Racks per hall</td>
              <td className="num">{num(delivered.racksPerHall)}</td>
              <td className="num">{num(ai.racksPerHall)}</td>
            </tr>
            <tr>
              <td>Heat to liquid</td>
              <td className="num">{Math.round(delivered.coolingToLiquidShare * 100)}%</td>
              <td className="num">{Math.round(ai.coolingToLiquidShare * 100)}%</td>
            </tr>
            <tr>
              <td>Busway per rack</td>
              <td className="num">{fmt(delivered.buswayCurrentPerRackA, 0)} A</td>
              <td className="num">{fmt(ai.buswayCurrentPerRackEdbpA, 0)} A</td>
            </tr>
            <tr>
              <td>Fabric ports per rack</td>
              <td className="num">{delivered.networkPortsPerRack}</td>
              <td className="num">{ai.networkPortsPerRack}</td>
            </tr>
            <tr>
              <td>Rack positions funded</td>
              <td className="num">{fmt(delivered.rackPositionUtilisationPct, 1)}%</td>
              <td className="num">{fmt(ai.rackPositionUtilisationPct, 1)}%</td>
            </tr>
          </tbody>
        </table>
        <div className="tiny" style={{ marginTop: 6 }}>
          All of this is a teaching model of a conversion, not a Clonee project. The delivered side is derived from
          Clonee's own published figures. <Cite ids={['SNWA-FB', 'IND-NVDA', 'IND-LC']} />
        </div>
      </Section>
    </Panel>
  );
}

const AI_KW = INPUTS.aiRackKw;

/* ----------------------------------------------------------------- dispatch */

export function ModePanel() {
  const mode = useStore((s) => s.mode);
  switch (mode) {
    case 'power':
      return <PowerPanel />;
    case 'cooling':
      return <CoolingPanel />;
    case 'water':
      return <WaterPanel />;
    case 'data':
      return <DataPanel />;
    case 'resilience':
      return <ResiliencePanel />;
    case 'construction':
      return <ConstructionPanel />;
    case 'commissioning':
      return <CommissioningPanel />;
    case 'controls':
      return <ControlsPanel />;
    case 'ai':
      return <AiPanel />;
    default:
      return <OverviewPanel />;
  }
}
