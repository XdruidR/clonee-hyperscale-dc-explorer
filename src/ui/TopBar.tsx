import { BUILDINGS } from '../data/campus';
import { HOME_CAMERA, useStore, type Mode } from '../state/store';

/**
 * Mode tabs.
 *
 * Ten modes, grouped the way a reader thinks about them: the campus and its
 * systems, then what it takes to deliver one. The two delivery modes sit at the
 * end because they are the ones a first-time visitor reaches last.
 */
const MODES: { id: Mode; label: string; title: string }[] = [
  { id: 'overview', label: 'CAMPUS', title: 'The five-building Clonee campus' },
  { id: 'power', label: 'POWER', title: 'Follow electricity from the 220 kV loop-in to a rack' },
  { id: 'cooling', label: 'COOLING', title: 'Follow heat from the IT to the air' },
  { id: 'water', label: 'WATER', title: 'Where water enters, circulates and leaves' },
  { id: 'data', label: 'DATA', title: 'Follow external fibre through to the servers' },
  { id: 'resilience', label: 'RESILIENCE', title: 'Break something and watch the response' },
  { id: 'construction', label: 'CONSTRUCTION', title: 'Build the campus through its real phases' },
  { id: 'commissioning', label: 'COMMISSIONING', title: 'Progress systems from installation to IT-ready' },
  { id: 'controls', label: 'PROJECT CONTROLS', title: 'Connect physical assets to schedule, cost and risk' },
  { id: 'ai', label: 'AI EVOLUTION', title: 'Convert a delivered hall to liquid-cooled AI' },
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
  const isolateBuilding = useStore((s) => s.isolateBuilding);
  const setIsolateBuilding = useStore((s) => s.setIsolateBuilding);
  const setIsolateTrain = useStore((s) => s.setIsolateTrain);
  const isolateTrain = useStore((s) => s.isolateTrain);
  const aiRetrofit = useStore((s) => s.aiRetrofit);
  const startJourney = useStore((s) => s.startJourney);
  const toggle = useStore((s) => s.toggle);
  const setExplode = useStore((s) => s.setExplode);
  const setColourBy = useStore((s) => s.setColourBy);
  const setDayNight = useStore((s) => s.setDayNight);
  const panelOpen = useStore((s) => s.panelOpen);
  const moveCamera = useStore((s) => s.moveCamera);

  /* Plan view looks straight down the service spine, which is where the two
     building rows and the substation read as a layout rather than a mass. */
  const overview = () => moveCamera(HOME_CAMERA.pos, HOME_CAMERA.target);
  const plan = () => moveCamera([10, 1180, 150], [-20, 0, 0]);
  const substation = () => moveCamera([560, 210, 520], [330, 0, 340]);

  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">
          Clonee Hyperscale Data Centre Explorer
          <span>Meta, Clonee, Co. Meath · public record and typical practice</span>
        </div>
        <div className="sep" />
        <div className="tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={mode === m.id ? 'active' : ''}
              onClick={() => setMode(m.id)}
              title={m.title}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button onClick={() => startJourney('power')} title="Camera-followed tour from the transmission corridor to a rack">
            Follow the electrons
          </button>
          <button onClick={() => startJourney('grid')} title="The 15-month 220 kV grid connection, as EirGrid recorded it">
            The grid connection
          </button>
          <button onClick={overview} title="Frame the whole 95.5 ha campus">
            Campus view
          </button>
          <button onClick={plan} title="Plan view down the service spine">
            Plan
          </button>
          <button onClick={substation} title="Frame the 220 kV substation compound">
            Substation
          </button>
          <button onClick={() => toggle('panelOpen')} className={panelOpen ? 'active' : ''} title="Hide or show the side panels">
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
            aria-label="Explode the campus by system"
          />
        </div>
        <label className={labels ? 'on' : ''}>
          <input type="checkbox" checked={labels} onChange={() => toggle('labels')} /> labels
        </label>
        <label className={flows ? 'on' : ''}>
          <input type="checkbox" checked={flows} onChange={() => toggle('flows')} /> flow animation
        </label>
        <label className={aiRetrofit ? 'on' : ''} title="Add cold plates and coolant distribution units to CLN2 hall 3">
          <input type="checkbox" checked={aiRetrofit} onChange={() => toggle('aiRetrofit')} /> AI retrofit kit
        </label>
        <div className="sep" />
        <span className="tiny">isolate a building:</span>
        <button onClick={() => setIsolateBuilding(null)} className={isolateBuilding === null ? 'active' : ''}>
          all
        </button>
        {BUILDINGS.map((b) => (
          <button
            key={b.n}
            onClick={() => setIsolateBuilding(isolateBuilding === b.n ? null : b.n)}
            className={isolateBuilding === b.n ? 'active' : ''}
            title={`Isolate ${b.name}: four data halls, ${b.itMW} MW, ${b.gfaM2.toLocaleString('en-IE')} m²`}
          >
            {b.name}
          </button>
        ))}
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'power' ? null : 'power')}
          className={isolateTrain === 'power' ? 'active' : ''}
          title="Isolate one electrical train, from the substation to the racks"
        >
          power train
        </button>
        <button
          onClick={() => setIsolateTrain(isolateTrain === 'cooling' ? null : 'cooling')}
          className={isolateTrain === 'cooling' ? 'active' : ''}
          title="Isolate one cooling train, from the racks to the air coolers"
        >
          cooling train
        </button>
        <div className="sep" />
        <select value={colourBy} onChange={(e) => setColourBy(e.target.value as 'system' | 'package')} aria-label="Colour components by">
          <option value="system">colour: system</option>
          <option value="package">colour: work package</option>
        </select>
        <select
          value={dayNight}
          onChange={(e) => setDayNight(e.target.value as 'day' | 'dusk' | 'night')}
          aria-label="Time of day"
        >
          <option value="day">day</option>
          <option value="dusk">dusk</option>
          <option value="night">night</option>
        </select>
        <label className={deliveryLayer ? 'on' : ''} title="Add WBS, work package and predecessor logic to the inspector">
          <input type="checkbox" checked={deliveryLayer} onChange={() => toggle('deliveryLayer')} /> delivery layer
        </label>
        <label className={evidenceMode ? 'on' : ''} title="Show provenance tags on labels, claims and panels">
          <input type="checkbox" checked={evidenceMode} onChange={() => toggle('evidenceMode')} /> evidence mode
        </label>
      </div>
    </div>
  );
}