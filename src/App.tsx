import { useState } from 'react';
import { Scene } from './three/Scene';
import { TopBar } from './ui/TopBar';
import { ModePanel } from './ui/ModePanel';
import { Inspector } from './ui/Inspector';
import { JourneyOverlay, JourneyStrip } from './ui/JourneyOverlay';
import { SourcesPanel } from './ui/SourcesPanel';
import { useStore } from './state/store';
import { useIsMobile } from './ui/useDevice';
import { MobileLearnSheet, MobileLegend, MobileTabBar, MobileTopBar } from './ui/Mobile';
import { BUILDINGS, CAPACITY_NOTES } from './data/campus';
import { derived, fmtInt } from './data/calculations';
import { SYSTEM_META } from './data/types';

/**
 * The campus legend.
 *
 * Only shown in Campus mode: in any other mode the mode panel is already telling
 * the reader which system is in front of them, and a second legend would be a
 * duplicate. The building list is here rather than in the mode panel because it
 * is the one fact a first-time visitor needs before anything else: the campus
 * has five data-storage buildings and there is no CLN4.
 */
function Legend() {
  const mode = useStore((s) => s.mode);
  const faults = useStore((s) => s.faults);
  const isolateBuilding = useStore((s) => s.isolateBuilding);
  const setIsolateBuilding = useStore((s) => s.setIsolateBuilding);

  return (
    <div className="legend">
      <h4>The campus</h4>
      <div className="legend-row" style={{ marginBottom: 2 }}>
        <b>{fmtInt(derived.siteAreaM2 / 10_000)} ha</b>
        <span className="blurb">consented site</span>
      </div>
      <div className="legend-row" style={{ marginBottom: 4 }}>
        <b>{fmtInt(derived.itCapacityMW)} MW</b>
        <span className="blurb">IT, five buildings</span>
      </div>

      <h4 style={{ marginTop: 10 }}>Data-storage buildings</h4>
      {BUILDINGS.map((b) => (
        <div key={b.n} className="legend-row">
          <button
            onClick={() => setIsolateBuilding(isolateBuilding === b.n ? null : b.n)}
            className={isolateBuilding === b.n ? 'active' : ''}
            style={{ padding: '1px 6px', fontSize: 'var(--t-micro)' }}
            title={`Isolate ${b.name}`}
          >
            {b.name}
          </button>
          <span className="blurb">
            {b.itMW} MW · {b.gfaM2.toLocaleString('en-IE')} m²
          </span>
        </div>
      ))}
      <div className="tiny" style={{ marginTop: 4 }}>
        There is no CLN4. The numbering gap is real and is preserved throughout.
      </div>

      {mode === 'overview' && (
        <>
          <h4 style={{ marginTop: 10 }}>Systems</h4>
          {(['power', 'cooling', 'water', 'data', 'site'] as const).map((k) => (
            <div key={k} className="legend-row">
              <span className="swatch" style={{ background: SYSTEM_META[k].color }} />
              {SYSTEM_META[k].label.toLowerCase()}
              <span className="blurb">{SYSTEM_META[k].blurb}</span>
            </div>
          ))}
          <h4 style={{ marginTop: 10 }}>Public figures that disagree</h4>
          {CAPACITY_NOTES.map((c) => (
            <div key={c.figure} className="legend-row">
              <span className="swatch" style={{ background: 'var(--derived)' }} />
              {c.figure}
            </div>
          ))}
        </>
      )}

      {faults.length > 0 && (
        <>
          <h4 style={{ marginTop: 10 }}>Injected failures</h4>
          {faults.map((f) => (
            <div key={f} className="legend-row">
              <span className="swatch" style={{ background: 'var(--danger)' }} />
              {f}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/**
 * The status readout.
 *
 * Deliberately not a help string: it reports the live state of the model, and
 * the controls are self-explanatory enough not to need a hint sitting over the
 * scene permanently.
 */
function Hud() {
  const mode = useStore((s) => s.mode);
  const phase = useStore((s) => s.constructPhase);
  const gridPhase = useStore((s) => s.gridPhase);
  const controlsMonth = useStore((s) => s.controlsMonth);
  const selected = useStore((s) => s.selected);
  const faults = useStore((s) => s.faults);
  const aiRetrofit = useStore((s) => s.aiRetrofit);

  return (
    <div className="hud">
      <span className="mode">{mode.replace('ai', 'ai evolution')}</span>
      {mode === 'construction' && <span>· {phase} of 24 phases</span>}
      {mode === 'controls' && <span>· data date {controlsMonth} of 24</span>}
      {gridPhase > 0 && <span>· grid event step {gridPhase} of 8</span>}
      {faults.length > 0 && <span>· {faults.length} failure{faults.length > 1 ? 's' : ''} injected</span>}
      {aiRetrofit && <span>· retrofit kit shown</span>}
      {selected ? <span>· Esc to deselect</span> : null}
    </div>
  );
}

export default function App() {
  const panelOpen = useStore((s) => s.panelOpen);
  const isMobile = useIsMobile();
  const [sources, setSources] = useState(false);
  const select = useStore((s) => s.select);

  if (isMobile) {
    return (
      <div className="app mobile" onKeyDown={(e) => e.key === 'Escape' && select(null, false)}>
        <Scene />
        <div className="ui-layer">
          <MobileTopBar onSources={() => setSources(true)} />
          <MobileSheet onSources={() => setSources(true)} />
          <MobileTabBar />
          <JourneyOverlay />
          {sources && <SourcesPanel onClose={() => setSources(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="app" onKeyDown={(e) => e.key === 'Escape' && select(null, false)}>
      <Scene />
      <div className="ui-layer">
        <TopBar onSources={() => setSources(true)} />
        {panelOpen && <ModePanel />}
        {panelOpen && <Inspector />}
        {panelOpen && <Hud />}
        {panelOpen && <Legend />}
        <div className="journeybar">
          <JourneyStrip />
        </div>
        <JourneyOverlay />
        {sources && <SourcesPanel onClose={() => setSources(false)} />}
      </div>
    </div>
  );
}

/** The single full-width sheet. Only one panel is reachable at a time. */
function MobileSheet({ onSources }: { onSources: () => void }) {
  const sheet = useStore((s) => s.sheet);
  const setSheet = useStore((s) => s.setSheet);
  if (!sheet) return null;
  return (
    <div className="m-sheet">
      <div className="m-sheet-head">
        <span>
          {sheet === 'mode'
            ? 'Explain'
            : sheet === 'inspect'
              ? 'Inspect'
              : sheet === 'learn'
                ? 'Journeys'
                : 'View options'}
        </span>
        <button onClick={() => setSheet(null)} aria-label="Close panel">
          Close
        </button>
      </div>
      <div className="m-sheet-body scrolly">
        {sheet === 'mode' && (
          <>
            <MobileLegend />
            <ModePanel />
          </>
        )}
        {sheet === 'inspect' && <Inspector />}
        {sheet === 'learn' && <MobileLearnSheet />}
        {sheet === 'view' && <ViewSheet onSources={onSources} />}
      </div>
    </div>
  );
}

/** View toggles, moved out of the toolbar into the sheet on a phone. */
function ViewSheet({ onSources }: { onSources: () => void }) {
  const roofOff = useStore((s) => s.roofOff);
  const cutaway = useStore((s) => s.cutaway);
  const labels = useStore((s) => s.labels);
  const flows = useStore((s) => s.flows);
  const deliveryLayer = useStore((s) => s.deliveryLayer);
  const evidenceMode = useStore((s) => s.evidenceMode);
  const aiRetrofit = useStore((s) => s.aiRetrofit);
  const explode = useStore((s) => s.explode);
  const colourBy = useStore((s) => s.colourBy);
  const dayNight = useStore((s) => s.dayNight);
  const isolateBuilding = useStore((s) => s.isolateBuilding);
  const isolateTrain = useStore((s) => s.isolateTrain);
  const toggle = useStore((s) => s.toggle);
  const setExplode = useStore((s) => s.setExplode);
  const setColourBy = useStore((s) => s.setColourBy);
  const setDayNight = useStore((s) => s.setDayNight);
  const setIsolateBuilding = useStore((s) => s.setIsolateBuilding);
  const setIsolateTrain = useStore((s) => s.setIsolateTrain);

  return (
    <div>
      <h3>View</h3>
      <div className="m-toggles">
        <label className={roofOff ? 'on' : ''}>
          <input type="checkbox" checked={roofOff} onChange={() => toggle('roofOff')} /> roof off
        </label>
        <label className={cutaway ? 'on' : ''}>
          <input type="checkbox" checked={cutaway} onChange={() => toggle('cutaway')} /> cutaway
        </label>
        <label className={labels ? 'on' : ''}>
          <input type="checkbox" checked={labels} onChange={() => toggle('labels')} /> labels
        </label>
        <label className={flows ? 'on' : ''}>
          <input type="checkbox" checked={flows} onChange={() => toggle('flows')} /> flow animation
        </label>
        <label className={aiRetrofit ? 'on' : ''}>
          <input type="checkbox" checked={aiRetrofit} onChange={() => toggle('aiRetrofit')} /> AI retrofit kit
        </label>
        <label className={deliveryLayer ? 'on' : ''}>
          <input type="checkbox" checked={deliveryLayer} onChange={() => toggle('deliveryLayer')} /> delivery layer
        </label>
        <label className={evidenceMode ? 'on' : ''}>
          <input type="checkbox" checked={evidenceMode} onChange={() => toggle('evidenceMode')} /> evidence mode
        </label>
      </div>
      <h3>Exploded</h3>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={explode}
        onChange={(e) => setExplode(Number(e.target.value))}
        aria-label="Explode the campus by system"
      />
      <h3>Isolate</h3>
      <div className="m-chips">
        <button onClick={() => setIsolateBuilding(null)} className={isolateBuilding === null ? 'active' : ''}>
          all
        </button>
        {BUILDINGS.map((b) => (
          <button
            key={b.n}
            onClick={() => setIsolateBuilding(isolateBuilding === b.n ? null : b.n)}
            className={isolateBuilding === b.n ? 'active' : ''}
          >
            {b.name}
          </button>
        ))}
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'power' ? null : 'power')}
          className={isolateTrain === 'power' ? 'active' : ''}
        >
          power train
        </button>
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'cooling' ? null : 'cooling')}
          className={isolateTrain === 'cooling' ? 'active' : ''}
        >
          cooling train
        </button>
      </div>
      <h3>Colour and light</h3>
      <div className="m-toggles">
        <select value={colourBy} onChange={(e) => setColourBy(e.target.value as 'system' | 'package')}>
          <option value="system">colour: system</option>
          <option value="package">colour: work package</option>
        </select>
        <select value={dayNight} onChange={(e) => setDayNight(e.target.value as 'day' | 'dusk' | 'night')}>
          <option value="day">day</option>
          <option value="dusk">dusk</option>
          <option value="night">night</option>
        </select>
      </div>
      <h3>Learn</h3>
      <div className="m-toggles">
        <button onClick={() => useStore.getState().startJourney('power')}>Follow the electrons</button>
        <button onClick={() => useStore.getState().startJourney('grid')}>The grid connection</button>
        <button onClick={() => useStore.getState().startJourney('water')}>The water licence</button>
        <button onClick={onSources}>Sources &amp; method</button>
      </div>
    </div>
  );
}