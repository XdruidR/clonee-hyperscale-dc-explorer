import { useState } from 'react';
import { Scene } from './three/Scene';
import { TopBar } from './ui/TopBar';
import { ModePanel } from './ui/ModePanel';
import { Inspector } from './ui/Inspector';
import { JourneyOverlay, JourneyStrip } from './ui/JourneyOverlay';
import { SourcesPanel } from './ui/SourcesPanel';
import { useStore } from './state/store';

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
  const [sources, setSources] = useState(false);
  const select = useStore((s) => s.select);

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