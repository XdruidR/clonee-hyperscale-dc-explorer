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

function Legend() {
  const mode = useStore((s) => s.mode);
  const faults = useStore((s) => s.faults);
  if (mode !== 'overview') return null;
  return (
    <div className="legend">
      <h4>legend</h4>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#ffcf3f' }} />
        power
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#ff6b5b' }} />
        cooling
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#38bdf8' }} />
        water
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#a78bfa' }} />
        data / network
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#9aa6b2' }} />
        site and delivery
      </div>
      {faults.length > 0 && (
        <>
          <h4 style={{ marginTop: 8 }}>injected failures</h4>
          {faults.map((f) => (
            <div key={f} className="legend-row">
              <span className="swatch" style={{ background: '#ff3b30' }} />
              {f}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Hud() {
  const mode = useStore((s) => s.mode);
  const phase = useStore((s) => s.constructPhase);
  const gridPhase = useStore((s) => s.gridPhase);
  const selected = useStore((s) => s.selected);
  return (
    <div className="hud">
      <div>
        <b>mode</b> {mode}
        {mode === 'construction' && <> · phase {phase}</>}
        {mode === 'power' && gridPhase > 0 && (
          <>
            {' '}
            · grid event step {gridPhase}
          </>
        )}
      </div>
      <div>
        <b>hint</b> drag to orbit · scroll to zoom · click any component
        {selected ? ' · Esc or click empty ground to deselect' : ''}
      </div>
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
          ✕
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
  const explode = useStore((s) => s.explode);
  const colourBy = useStore((s) => s.colourBy);
  const dayNight = useStore((s) => s.dayNight);
  const isolateHall = useStore((s) => s.isolateHall);
  const isolateTrain = useStore((s) => s.isolateTrain);
  const toggle = useStore((s) => s.toggle);
  const setExplode = useStore((s) => s.setExplode);
  const setColourBy = useStore((s) => s.setColourBy);
  const setDayNight = useStore((s) => s.setDayNight);
  const setIsolateHall = useStore((s) => s.setIsolateHall);
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
      />
      <h3>Isolate</h3>
      <div className="m-chips">
        <button onClick={() => setIsolateHall(null)} className={isolateHall === null ? 'active' : ''}>
          all
        </button>
        {[1, 2, 3, 4, 5, 6].map((h) => (
          <button
            key={h}
            onClick={() => setIsolateHall(isolateHall === h ? null : h)}
            className={isolateHall === h ? 'active' : ''}
          >
            hall {h}
          </button>
        ))}
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'power' ? null : 'power')}
          className={isolateTrain === 'power' ? 'active' : ''}
        >
          ⚡ train
        </button>
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'cooling' ? null : 'cooling')}
          className={isolateTrain === 'cooling' ? 'active' : ''}
        >
          ❄ loop
        </button>
      </div>
      <h3>Colour and light</h3>
      <div className="m-toggles">
        <select value={colourBy} onChange={(e) => setColourBy(e.target.value as 'system' | 'package')}>
          <option value="system">colour: system</option>
          <option value="package">colour: package</option>
        </select>
        <select value={dayNight} onChange={(e) => setDayNight(e.target.value as 'day' | 'dusk' | 'night')}>
          <option value="day">day</option>
          <option value="dusk">dusk</option>
          <option value="night">night</option>
        </select>
      </div>
      <h3>Learn</h3>
      <div className="m-toggles">
        <button onClick={() => useStore.getState().startJourney('electrons')}>⚡ Follow the electrons</button>
        <button onClick={() => useStore.getState().startJourney('heat')}>🔥 Follow the heat</button>
        <button onClick={onSources}>Sources &amp; method</button>
      </div>
    </div>
  );
}