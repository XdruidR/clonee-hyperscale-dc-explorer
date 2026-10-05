import { useEffect } from 'react';
import { useStore, type Mode } from '../state/store';
import { JOURNEYS } from '../data/journeys';
import { COMPONENT_BY_ID } from '../data/campus';

export function JourneyOverlay() {
  const journey = useStore((s) => s.journey);
  const setStep = useStore((s) => s.setJourneyStep);
  const endJourney = useStore((s) => s.endJourney);
  const moveCamera = useStore((s) => s.moveCamera);

  const j = JOURNEYS.find((x) => x.id === journey?.id);
  const step = j && journey ? j.steps[Math.min(journey.step, j.steps.length - 1)] : null;

  /**
   * Apply the step's camera and view settings.
   *
   * NB: the mode is set directly rather than through `setMode`, because
   * `setMode` also ends an active journey and would immediately cancel the step
   * being applied.
   *
   * The journey data calls the isolation field `isolateHall`, but on this campus
   * the isolatable unit is the data-storage building, so it maps onto
   * `isolateBuilding` here. That is the only place the name is reinterpreted.
   */
  useEffect(() => {
    if (!j || !step || !journey) return;
    useStore.setState({ mode: (step.mode === 'site' ? 'overview' : step.mode) as Mode });
    const v = step.view ?? {};
    useStore.setState({
      roofOff: !!v.roofOff,
      cutaway: !!v.cutaway,
      explode: v.explode ?? 0,
      isolateBuilding: v.isolateHall ?? null,
      flows: v.flows ?? true,
      /* A journey that shows the retrofit needs the retrofit kit present, or the
         steps would point the camera at cold plates that are not there. */
      aiRetrofit: step.mode === 'ai' ? true : undefined,
    });
    if (step.camera) {
      moveCamera(step.camera.pos, step.camera.target);
    } else if (step.look.length) {
      const cs = step.look.map((id) => COMPONENT_BY_ID[id]).filter(Boolean);
      if (cs.length) {
        const cx = cs.reduce((a, c) => a + c.pos[0], 0) / cs.length;
        const cz = cs.reduce((a, c) => a + c.pos[2], 0) / cs.length;
        /* Instanced equipment spans far more than one instance, so the framing
           has to account for the extent rather than a single box. */
        const span = Math.max(
          ...cs.map((c) => {
            if (!c.offsets?.length) return Math.max(c.size[0], c.size[2]);
            return Math.max(
              ...c.offsets.map(([dx, dz]) => Math.max(Math.abs(dx) * 2 + c.size[0], Math.abs(dz) * 2 + c.size[2])),
            );
          }),
        );
        moveCamera(
          [cx + span * 1.1 + 120, Math.max(120, span * 1.0), cz + span * 1.2 + 150],
          [cx, 6, cz],
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.step, journey?.id]);

  if (!j || !step || !journey) return null;
  const idx = Math.min(journey.step, j.steps.length - 1);
  const interior = !!step.view?.roofOff || !!step.view?.cutaway;

  return (
    <div className="journey-card">
      <h4>
        {j.title}{' '}
        <span className="tiny">
          · step {idx + 1} of {j.steps.length}
        </span>
      </h4>
      <div className="title">{step.title}</div>
      <p className="lede" style={{ margin: '6px 0' }}>
        {step.body}
      </p>
      {step.evidence && <div className="callout derived">{step.evidence}</div>}
      <div className="steps">
        {j.steps.map((_, i) => (
          <span key={i} className={`dot ${i <= idx ? 'on' : ''}`} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button disabled={idx === 0} onClick={() => setStep(idx - 1)}>
          Back
        </button>
        <button className="primary" onClick={() => (idx >= j.steps.length - 1 ? endJourney() : setStep(idx + 1))}>
          {idx >= j.steps.length - 1 ? 'Finish' : 'Next'}
        </button>
        <button onClick={endJourney}>Exit</button>
        <span className="tiny" style={{ marginLeft: 'auto' }}>
          {interior ? 'interior view · ' : ''}
          {step.mode === 'site' ? 'campus' : step.mode}
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