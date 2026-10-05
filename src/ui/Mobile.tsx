import { useStore, type Mode } from '../state/store';
import { JOURNEYS } from '../data/journeys';
import { SYSTEM_META } from '../data/types';
import { BUILDINGS } from '../data/campus';
import { derived, fmt, fmtInt } from '../data/calculations';
import { HOME_CAMERA } from '../state/store';

/**
 * Phone layout.
 *
 * The desktop arrangement — two fixed side panels plus a wide toolbar and a
 * journey strip — does not survive a 390 px viewport, and squeezing it produces
 * something worse than useless. Instead: one full-width sheet at a time with a
 * persistent tab bar, a compact toolbar with a wrapping mode picker, and the 3D
 * view always visible behind it.
 *
 * No pictographs are used anywhere in this file. The tab bar marks its state
 * with a drawn rule and a label rather than with a glyph, because a unicode
 * symbol standing in for an icon is a costume rather than an interface.
 */

const MODES: { id: Mode; label: string }[] = [
  { id: 'overview', label: 'Campus' },
  { id: 'power', label: 'Power' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'water', label: 'Water' },
  { id: 'data', label: 'Data' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'construction', label: 'Construction' },
  { id: 'commissioning', label: 'Commissioning' },
  { id: 'controls', label: 'Controls' },
  { id: 'ai', label: 'AI' },
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
        Clonee Hyperscale Data Centre Explorer
        <span>Meta, Co. Meath · public record and typical practice</span>
      </div>
      <div className="m-topbar-actions">
        <button onClick={() => moveCamera(HOME_CAMERA.pos, HOME_CAMERA.target)} title="Frame the whole campus">
          Campus view
        </button>
        <button onClick={onSources} title="Sources and method">
          Sources
        </button>
        <button
          onClick={() => setSheet(sheet === 'view' ? null : 'view')}
          className={sheet === 'view' ? 'active' : ''}
          title="View options"
        >
          View
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

  const tabs: { id: 'mode' | 'inspect' | 'learn' | null; label: string; disabled?: boolean }[] = [
    { id: null, label: 'Campus' },
    { id: 'mode', label: 'Explain' },
    { id: 'inspect', label: 'Inspect', disabled: !selected },
    { id: 'learn', label: 'Journeys' },
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
            aria-current={on ? 'page' : undefined}
          >
            <span className="m-tabbar-rule" aria-hidden="true" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MobileLearnSheet() {
  const startJourney = useStore((s) => s.startJourney);
  const setSheet = useStore((s) => s.setSheet);

  return (
    <div>
      <p className="lede">
        A journey moves the camera and steps through the explanation. Close the sheet as it starts, so you can see the
        campus.
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
          <span className="glyph" aria-hidden="true" />
          <span className="body">
            <b>{j.title}</b>
            <span>{j.blurb}</span>
          </span>
          <span className="num">{j.steps.length} steps</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The colour key lives at the top of the explain sheet rather than floating over
 * the campus: on a phone viewport a floating legend costs a sixth of the screen
 * and obscures the thing it explains.
 *
 * It carries the campus figures as well, because on a phone the campus panel is
 * the first thing read and the numbers are the fastest route into it.
 */
export function MobileLegend() {
  return (
    <div className="m-legend-inline">
      <div className="m-legend-figures">
        <span className="legend-row">
          <b>{fmt(derived.itCapacityMW, 0)} MW</b> IT across {BUILDINGS.length} buildings
        </span>
        <span className="legend-row">
          <b>{fmtInt(derived.hallCount)}</b> data halls
        </span>
        <span className="legend-row">
          <b>90</b> diesel generators
        </span>
      </div>
      {(['power', 'cooling', 'water', 'data', 'site'] as const).map((k) => (
        <span key={k} className="legend-row">
          <span className="swatch" style={{ background: SYSTEM_META[k].color }} />
          {SYSTEM_META[k].label.toLowerCase()}
        </span>
      ))}
    </div>
  );
}