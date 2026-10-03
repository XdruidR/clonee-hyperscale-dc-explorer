import { buildStateOf, useStore, type BuildState } from '../state/store';
import { toClaim } from '../data/types';
import { componentCxStatus } from '../state/store';
import { COMPONENT_BY_ID, HALL_INDEX } from '../data/campus';
import { COMPONENT_INFO } from '../data/componentInfo';
import { FACT_BY_ID } from '../data/facts';
import { SYSTEM_META, PACKAGE_COLOR } from '../data/types';
import { Badge, Cite, Section } from './common';
import { PACKAGES } from '../data/types';

function statusLabel(state: BuildState, progress: number) {
  if (state === 'hidden') return 'not started at this point in the programme';
  if (state === 'building') return `under construction — ${Math.round(progress * 100)}% through its window`;
  return 'complete';
}

export function Inspector() {
  const selected = useStore((s) => s.selected);
  const hovered = useStore((s) => s.hovered);
  const select = useStore((s) => s.select);
  const deliveryLayer = useStore((s) => s.deliveryLayer);
  const setIsolateHall = useStore((s) => s.setIsolateHall);
  const cxState = useStore((s) => s.cx);
  const constructPhase = useStore((s) => s.constructPhase);
  const evidenceMode = useStore((s) => s.evidenceMode);

  const id = selected ?? hovered;
  if (!id) return null;
  const c = COMPONENT_BY_ID[id];
  const info = COMPONENT_INFO[c?.type ?? ''];
  if (!c || !info) return null;
  const cx = componentCxStatus(cxState, c.id);

  const hallId = c.hall ? Object.entries(HALL_INDEX).find(([, v]) => v === c.hall)?.[0] : undefined;

  return (
    <div className="panel right scrolly">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>{info.title}</h2>
          <div className="tiny">
            <span className="swatch" style={{ background: SYSTEM_META[c.system].color }} />
            {SYSTEM_META[c.system].label}
            {c.module ? ` · module ${c.module}` : ''}
            {c.hall ? ` · hall ${c.hall}` : ''}
            {selected ? '' : ' · (hover)'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge c={info.provenance} />
          {selected && (
            <div>
              <button style={{ marginTop: 5 }} onClick={() => select(null, false)}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="lede" style={{ marginTop: 8 }}>
        {info.what}
      </p>
      {c.note && <div className="callout">{c.note}</div>}

      <Section title="Why it exists">
        <p>{info.why}</p>
      </Section>

      <Section title="Technical">
        <ul className="claims">
          {info.technical.map((entry, i) => {
            const claim = toClaim(entry, info.provenance);
            const mixed = info.technical.some((e) => typeof e !== 'string');
            return (
              <li key={i}>
                {mixed && evidenceMode && (
                  <span className="claim-chip" title={claim.classification}>
                    {claim.classification === 'PUBLIC FACT'
                      ? 'FACT'
                      : claim.classification === 'TYPICAL'
                        ? 'TYP'
                        : claim.classification === 'SIMPLIFIED'
                          ? 'SIMP'
                          : 'SYN'}
                  </span>
                )}
                <span>{claim.text}</span>
                {evidenceMode && claim.sources && claim.sources.length > 0 && (
                  <span className="tiny">
                    {' '}
                    <Cite ids={claim.sources} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {info.voltage && (
          <div className="tiny" style={{ marginTop: 6 }}>
            Voltage / energy step: <span className="mono">{info.voltage}</span>
          </div>
        )}
      </Section>

      <Section title="Failure modes">
        <ul>
          {info.failureModes.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Section>

      <Section title="Redundancy">
        <p>{info.redundancy}</p>
      </Section>

      <Section title="Dependencies">
        <div className="tiny" style={{ lineHeight: 1.7 }}>
          <div>
            <b>Upstream</b> · {info.upstream}
          </div>
          <div>
            <b>Downstream</b> · {info.downstream}
          </div>
          {c.hall && (
            <div>
              <b>Fault domain</b> · hall {c.hall} ({hallId})
              {c.hall > 1 && (
                <>
                  {' '}
                  <button style={{ padding: '0 5px' }} onClick={() => setIsolateHall(c.hall!)}>
                    isolate
                  </button>
                  <button style={{ padding: '0 5px' }} onClick={() => setIsolateHall(null)}>
                    all
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section title="Delivery view">
        {!deliveryLayer && (
          <div className="tiny" style={{ marginBottom: 6 }}>
            Turn on the delivery layer in the toolbar to also colour components by work package.
          </div>
        )}
          <table className="simple">
            <tbody>
              <tr>
                <th>WBS</th>
                <td className="mono">
                  {info.delivery.wbs} <Badge c="SYNTHETIC" />
                </td>
              </tr>
              <tr>
                <th>Package</th>
                <td>
                  <span className="swatch" style={{ background: PACKAGE_COLOR[info.delivery.package] }} />
                  {info.delivery.package}
                </td>
              </tr>
              <tr>
                <th>Discipline</th>
                <td>{info.delivery.discipline}</td>
              </tr>
              <tr>
                <th>Cost category</th>
                <td>
                  {info.delivery.costBand} <Badge c="SYNTHETIC" />
                </td>
              </tr>
              <tr>
                <th>Milestone</th>
                <td>{info.delivery.milestone}</td>
              </tr>
              <tr>
                <th>Construction status</th>
                <td>{statusLabel(buildStateOf(c, constructPhase).state, buildStateOf(c, constructPhase).progress)}</td>
              </tr>
              <tr>
                <th>Commissioning status</th>
                <td>
                  {cx.status === 'out-of-scope'
                    ? 'not inside a turnover boundary'
                    : cx.status === 'complete'
                      ? `commissioned (${cx.packages.map((p) => `${p.id} ${p.done}/${p.total}`).join(', ')})`
                      : cx.status === 'in-progress'
                        ? `in progress (${cx.packages.map((p) => `${p.id} ${p.done}/${p.total}`).join(', ')})`
                        : `not started (${cx.packages.map((p) => p.id).join(', ')})`}
                </td>
              </tr>
              <tr>
                <th>Predecessors</th>
                <td>{info.delivery.predecessors.join(' · ')}</td>
              </tr>
              <tr>
                <th>Successors</th>
                <td>{info.delivery.successors.join(' · ')}</td>
              </tr>
            </tbody>
          </table>
      </Section>

      {cx.packages.length > 0 && (
        <Section title="Commissioning status (turnover packages)">
          {cx.status === 'complete' ? (
            <div className="callout fact">
              All turnover packages containing this equipment are signed off.
            </div>
          ) : (
            <table className="simple">
              <thead>
                <tr>
                  <th>Turnover package</th>
                  <th>Tests complete</th>
                </tr>
              </thead>
              <tbody>
                {cx.packages.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td className="num">
                      {p.done}/{p.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {cx.blocking.length > 0 && (
            <div className="callout">
              <b>Why this equipment is not yet commissioned:</b>
              <ul style={{ margin: '4px 0 0' }}>
                {cx.blocking.slice(0, 4).map((b, i) => (
                  <li key={i}>{b.message}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {(c.facts?.length || info.facts?.length || info.publicLimit) && (
        <Section title="Evidence">
          {info.publicLimit && (
            <div className="callout blue">
              <b>What is public:</b> {info.publicLimit}
            </div>
          )}
          {(c.facts ?? []).map((fid) => {
            const f = FACT_BY_ID[fid];
            if (!f) return null;
            return (
              <div key={fid} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12 }}>
                  <Badge c={f.classification} /> <b>{f.label}</b>
                </div>
                <div className="mono" style={{ margin: '2px 0' }}>
                  {f.value}
                </div>
                <div className="tiny">{f.note}</div>
                <div className="tiny">
                  Sources:<Cite ids={f.sources} />
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {info.interfaceRisk && info.interfaceRisk.length > 0 && (
        <Section title="What interface usually causes trouble?">
          <ul className="tiny">
            {info.interfaceRisk.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Section>
      )}

      {info.controlsTrack && info.controlsTrack.length > 0 && (
        <Section title="What should project controls track?">
          <ul className="tiny">
            {info.controlsTrack.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Section>
      )}

      {info.meetingQuestion && (
        <Section title="What question should I ask in a meeting?">
          <div className="callout blue">{info.meetingQuestion}</div>
        </Section>
      )}

      <Section title="Colour key">
        <div className="tiny">
          {deliveryLayer
            ? PACKAGES.map((p) => (
                <div key={p} className="legend-row">
                  <span className="swatch" style={{ background: PACKAGE_COLOR[p] }} />
                  {p}
                </div>
              ))
            : Object.values(SYSTEM_META).map((s) => (
                <div key={s.label} className="legend-row">
                  <span className="swatch" style={{ background: s.color }} />
                  {s.label} — {s.blurb}
                </div>
              ))}
        </div>
      </Section>
    </div>
  );
}