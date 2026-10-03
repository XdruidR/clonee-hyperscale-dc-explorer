import { useEffect } from 'react';
import { useStore, type Mode } from '../state/store';
import { JOURNEYS } from '../data/journeys';
import { COMPONENT_BY_ID } from '../data/campus';

export function JourneyOverlay() {
  const journey = useStore((s) => s.journey);
  const setStep = useStore((s) => s.setJourneyStep);
  const endJourney = useStore((s) => s.endJourney);
  const moveCamera = useStore((s) => s.moveCamera);
  const roofOff = useStore((s) => s.roofOff);
  const cutaway = useStore((s) => s.cutaway);

  const j = JOURNEYS.find((x) => x.id === journey?.id);
  const step = j && journey ? j.steps[Math.min(journey.step, j.steps.length - 1)] : null;

  // apply the step's camera and view settings
  useEffect(() => {
    if (!j || !step || !journey) return;
    // NB: set the mode directly. The store's setMode also ends an active journey,
    // which would immediately cancel the step we are applying.
    useStore.setState({ mode: (step.mode === 'site' ? 'overview' : step.mode) as Mode });
    const v = step.view ?? {};
    useStore.setState({
      roofOff: !!v.roofOff,
      cutaway: !!v.cutaway,
      explode: v.explode ?? 0,
      isolateHall: v.isolateHall ?? null,
      flows: v.flows ?? true,
    });
    if (step.camera) moveCamera(step.camera.pos, step.camera.target);
    else if (step.look.length) {
      const cs = step.look.map((id) => COMPONENT_BY_ID[id]).filter(Boolean);
      if (cs.length) {
        const cx = cs.reduce((a, c) => a + c.pos[0], 0) / cs.length;
        const cz = cs.reduce((a, c) => a + c.pos[2], 0) / cs.length;
        const span = Math.max(...cs.map((c) => Math.max(c.size[0], c.size[2])));
        moveCamera([cx + span * 1.6 + 120, Math.max(90, span * 1.4), cz + span * 1.8 + 150], [cx, 6, cz]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.step, journey?.id]);

  if (!j || !step || !journey) return null;
  const idx = Math.min(journey.step, j.steps.length - 1);

  return (
    <div className="journey-card">
      <h4>
        {j.title}{' '}
        <span className="tiny">
          · step {idx + 1} of {j.steps.length}
        </span>
      </h4>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>{step.title}</div>
      <p className="lede" style={{ margin: '4px 0' }}>
        {step.body}
      </p>
      {step.evidence && <div className="callout">{step.evidence}</div>}
      <div className="steps">
        {j.steps.map((_, i) => (
          <span key={i} className={`dot ${i <= idx ? 'on' : ''}`} />
        ))}
      </div>
      <div className="row">
        <button disabled={idx === 0} onClick={() => setStep(idx - 1)}>
          ◀ Back
        </button>
        <button className="primary" onClick={() => (idx >= j.steps.length - 1 ? endJourney() : setStep(idx + 1))}>
          {idx >= j.steps.length - 1 ? 'Finish' : 'Next ▶'}
        </button>
        <button onClick={endJourney}>Exit</button>
        <span className="tiny" style={{ marginLeft: 'auto' }}>
          {roofOff || cutaway ? 'interior view · ' : ''}
          {step.mode}
        </span>
      </div>
    </div>
  );
}

export function JourneyStrip() {
  const startJourney = useStore((s) => s.startJourney);
  const journey = useStore((s) => s.journey);
  return (
    <div className="journey-strip">
      <span className="tiny" style={{ alignSelf: 'center', marginRight: 4 }}>
        GUIDED JOURNEYS
      </span>
      {JOURNEYS.map((j) => (
        <button
          key={j.id}
          className={journey?.id === j.id ? 'active' : ''}
          onClick={() => startJourney(j.id)}
          title={j.blurb}
        >
          {j.title}
        </button>
      ))}
    </div>
  );
}