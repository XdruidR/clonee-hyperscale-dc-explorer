import { useStore, type Mode } from '../state/store';
import { JOURNEYS } from '../data/journeys';
import { SYSTEM_META } from '../data/types';

/**
 * Phone layout.
 *
 * The desktop arrangement - two fixed side panels plus a wide toolbar and a
 * journey strip - does not survive a 412 px viewport, and squeezing it produces
 * something worse than useless. Instead: one full-width sheet at a time with a
 * persistent tab bar, a compact toolbar with a mode picker, and the 3D view
 * always visible behind it.
 */

const MODES: { id: Mode; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'power', label: 'Power' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'water', label: 'Water' },
  { id: 'data', label: 'Data' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'construction', label: 'Construction' },
  { id: 'commissioning', label: 'Commissioning' },
];

export function MobileTopBar({ onSources }: { onSources: () => void }) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const setSheet = useStore((s) => s.setSheet);
  const moveCamera = useStore((s) => s.moveCamera);
  const sheet = useStore((s) => s.sheet);

  return (
    <div className="m-topbar">
      <div className="m-brand">
        Hyperscale Data Centre Explorer
        <span>educational model</span>
      </div>
      <div className="m-topbar-actions">
        <button onClick={() => moveCamera([560, 430, 640], [-40, 0, 20])} title="Frame the whole campus">
          ⤢
        </button>
        <button onClick={onSources} title="Sources and method">
          ⓘ
        </button>
        <button
          onClick={() => setSheet(sheet === 'view' ? null : 'view')}
          className={sheet === 'view' ? 'active' : ''}
          title="View options"
        >
          ☰
        </button>
      </div>
      <div className="m-modepicker">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={mode === m.id ? 'active' : ''}
            onClick={() => {
              setMode(m.id);
              setSheet('mode');
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MobileTabBar() {
  const sheet = useStore((s) => s.sheet);
  const setSheet = useStore((s) => s.setSheet);
  const selected = useStore((s) => s.selected);

  const tabs: { id: 'mode' | 'inspect' | 'learn' | null; label: string; glyph: string; disabled?: boolean }[] = [
    { id: null, label: 'Campus', glyph: '⬒' },
    { id: 'mode', label: 'Explain', glyph: '≡' },
    { id: 'inspect', label: 'Inspect', glyph: 'ⓘ', disabled: !selected },
    { id: 'learn', label: 'Journeys', glyph: '▷' },
  ];

  return (
    <div className="m-tabbar">
      {tabs.map((t) => {
        const on = t.id === null ? sheet === null : sheet === t.id;
        return (
          <button
            key={t.label}
            className={on ? 'active' : ''}
            disabled={t.disabled}
            onClick={() => setSheet(on ? null : t.id)}
          >
            <span className="glyph">{t.glyph}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MobileLearnSheet() {
  const startJourney = useStore((s) => s.startJourney);
  const sheet = useStore((s) => s.sheet);
  const setSheet = useStore((s) => s.setSheet);

  return (
    <div>
      <p className="lede">
        Guided journeys move the camera and step through the explanation. Best with the sheet closed, so you can see
        the campus.
      </p>
      {JOURNEYS.map((j) => (
        <button
          key={j.id}
          className="row"
          onClick={() => {
            startJourney(j.id);
            setSheet(null);
          }}
        >
          <span>▷</span>
          <span>
            {j.title}
            <div className="tiny">{j.blurb}</div>
          </span>
          <span className="tiny">{j.steps.length} steps</span>
        </button>
      ))}
      <div className="tiny" style={{ marginTop: 8 }}>
        {sheet === 'learn' ? 'Tap a journey to start. The campus button returns to the 3D view.' : ''}
      </div>
    </div>
  );
}

/**
 * The colour key lives at the top of the explain sheet rather than floating over
 * the campus: on a 412px viewport a floating legend costs a sixth of the screen
 * and obscures the thing it explains.
 */
export function MobileLegend() {
  return (
    <div className="m-legend-inline">
      {Object.values(SYSTEM_META).map((s) => (
        <span key={s.label} className="legend-row">
          <span className="swatch" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}