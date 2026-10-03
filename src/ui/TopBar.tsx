import { useStore, type Mode } from '../state/store';

const MODES: { id: Mode; label: string }[] = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'power', label: 'POWER' },
  { id: 'cooling', label: 'COOLING' },
  { id: 'water', label: 'WATER' },
  { id: 'data', label: 'DATA' },
  { id: 'resilience', label: 'RESILIENCE' },
  { id: 'construction', label: 'CONSTRUCTION' },
  { id: 'commissioning', label: 'COMMISSIONING' },
];

export function TopBar({ onSources }: { onSources: () => void }) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const roofOff = useStore((s) => s.roofOff);
  const cutaway = useStore((s) => s.cutaway);
  const explode = useStore((s) => s.explode);
  const labels = useStore((s) => s.labels);
  const flows = useStore((s) => s.flows);
  const evidenceMode = useStore((s) => s.evidenceMode);
  const deliveryLayer = useStore((s) => s.deliveryLayer);
  const colourBy = useStore((s) => s.colourBy);
  const dayNight = useStore((s) => s.dayNight);
  const isolateHall = useStore((s) => s.isolateHall);
  const setIsolateHall = useStore((s) => s.setIsolateHall);
  const setIsolateTrain = useStore((s) => s.setIsolateTrain);
  const isolateTrain = useStore((s) => s.isolateTrain);
  const startJourney = useStore((s) => s.startJourney);
  const toggle = useStore((s) => s.toggle);
  const setExplode = useStore((s) => s.setExplode);
  const setColourBy = useStore((s) => s.setColourBy);
  const setDayNight = useStore((s) => s.setDayNight);
  const panelOpen = useStore((s) => s.panelOpen);
  const moveCamera = useStore((s) => s.moveCamera);

  const overview = () => moveCamera([560, 430, 640], [-40, 0, 20]); // framed in the store
  const topDown = () => moveCamera([10, 900, 120], [-20, 0, 0]);

  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">
          Hyperscale Data Centre Explorer
          <span>generic Southland campus · educational model</span>
        </div>
        <div className="sep" />
        <div className="tabs">
          {MODES.map((m) => (
            <button key={m.id} className={mode === m.id ? 'active' : ''} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          <button onClick={() => startJourney('electrons')} title="Camera-followed tour from the transmission corridor to an accelerator">
            ⚡ Follow the electrons
          </button>
          <button onClick={() => startJourney('heat')} title="Camera-followed tour from the die to the atmosphere">
            🔥 Follow the heat
          </button>
          <button onClick={overview} title="Frame the whole campus">
            ⤢ Overview
          </button>
          <button onClick={topDown} title="Plan view">
            ▦ Plan
          </button>
          <button onClick={() => toggle('panelOpen')} className={panelOpen ? 'active' : ''}>
            Panels
          </button>
          <button onClick={onSources}>Sources &amp; method</button>
        </div>
      </div>

      <div className="toolrow">
        <label className={roofOff ? 'on' : ''}>
          <input type="checkbox" checked={roofOff} onChange={() => toggle('roofOff')} /> roof off
        </label>
        <label className={cutaway ? 'on' : ''}>
          <input type="checkbox" checked={cutaway} onChange={() => toggle('cutaway')} /> cutaway
        </label>
        <div className="explode">
          exploded
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={explode}
            onChange={(e) => setExplode(Number(e.target.value))}
          />
        </div>
        <label className={labels ? 'on' : ''}>
          <input type="checkbox" checked={labels} onChange={() => toggle('labels')} /> labels
        </label>
        <label className={flows ? 'on' : ''}>
          <input type="checkbox" checked={flows} onChange={() => toggle('flows')} /> flow animation
        </label>
        <div className="sep" />
        <span className="tiny">isolate:</span>
        <button onClick={() => setIsolateHall(null)} className={isolateHall === null ? 'active' : ''}>
          all
        </button>
        {[1, 2, 3, 4, 5, 6].map((h) => (
          <button
            key={h}
            onClick={() => setIsolateHall(isolateHall === h ? null : h)}
            className={isolateHall === h ? 'active' : ''}
            title={`Isolate data hall ${h}`}
          >
            hall {h}
          </button>
        ))}
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'power' ? null : 'power')}
          className={isolateTrain === 'power' ? 'active' : ''}
          title="Isolate one electrical train"
        >
          ⚡ train
        </button>
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'cooling' ? null : 'cooling')}
          className={isolateTrain === 'cooling' ? 'active' : ''}
          title="Isolate one cooling loop"
        >
          ❄ loop
        </button>
        <div className="sep" />
        <select value={colourBy} onChange={(e) => setColourBy(e.target.value as 'system' | 'package')}>
          <option value="system">colour: system</option>
          <option value="package">colour: package</option>
        </select>
        <select value={dayNight} onChange={(e) => setDayNight(e.target.value as 'day' | 'dusk' | 'night')}>
          <option value="day">day</option>
          <option value="dusk">dusk</option>
          <option value="night">night</option>
        </select>
        <label className={deliveryLayer ? 'on' : ''} title="Add WBS, package and predecessor logic to the inspector">
          <input type="checkbox" checked={deliveryLayer} onChange={() => toggle('deliveryLayer')} /> delivery layer
        </label>
        <label className={evidenceMode ? 'on' : ''} title="Show provenance tags on labels and in panels">
          <input type="checkbox" checked={evidenceMode} onChange={() => toggle('evidenceMode')} /> evidence mode
        </label>
      </div>
    </div>
  );
}