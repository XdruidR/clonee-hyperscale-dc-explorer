import { useState } from 'react';
import { SOURCES } from '../data/sources';
import { FACTS, CLASSIFICATION_MEANING, CLASSIFICATION_COLORS } from '../data/facts';

export function SourcesPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'method' | 'facts' | 'sources'>('method');

  return (
    <div className="sources" onClick={onClose}>
      <div className="sources-inner" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ marginBottom: 0 }}>Research, provenance and method</h2>
          <button onClick={onClose}>Close ✕</button>
        </div>

        <div className="tabs2" style={{ marginTop: 12 }}>
          <button className={tab === 'method' ? 'active' : ''} onClick={() => setTab('method')}>
            Method
          </button>
          <button className={tab === 'facts' ? 'active' : ''} onClick={() => setTab('facts')}>
            Public facts ({FACTS.length})
          </button>
          <button className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}>
            Sources ({SOURCES.length})
          </button>
        </div>

        {tab === 'method' && (
          <div>
            <p>
              This application is a teaching model of a <b>fictional generic hyperscale data centre campus on the Southland
              plains</b>. It is informed by, but is not a reproduction of, publicly available consenting and
              construction documentation for a large hyperscale / AI data centre project developed near Makarewa and
              Invercargill, New Zealand.
            </p>
            <h3>The classification rule</h3>
            <p>
              Every technical claim in this application carries one of four labels. The label is shown on component
              labels, in the inspector, and in the fact register below.
            </p>
            {(['PUBLIC FACT', 'TYPICAL', 'SIMPLIFIED', 'SYNTHETIC'] as const).map((k) => (
              <div key={k} className="callout">
                <span className="swatch" style={{ background: CLASSIFICATION_COLORS[k], width: 10, height: 10 }} />
                <b> {k}</b> — {CLASSIFICATION_MEANING[k]}
              </div>
            ))}
            <h3>The honesty rule</h3>
            <ul>
              <li>
                The public record for the reference project runs out at a certain level of detail. It confirms a
                substation, switchgear, generators, an adiabatic cooling plant, water treatment, stormwater works and a
                subsea cable. It does <b>not</b> publish transformer ratings, UPS topology, redundancy architecture,
                piping arrangements, equipment models or a one-line diagram.
              </li>
              <li>
                Where the public record stops, this application says so and shows <b>one typical implementation</b>,
                labelled as such. It never implies that a typical arrangement is what the project has built.
              </li>
              <li>
                No company, client, contractor or designer name appears anywhere in the interface, in component names, in
                the geometry, or in this model&apos;s data. Project names appear only in the source register, where a
                provenance record has to identify documents accurately.
              </li>
              <li>
                No cost, programme date or capacity figure from the reference project is used. All cost bands, WBS
                codes and durations are synthetic placeholders, marked SYNTHETIC.
              </li>
              <li>
                Where sources disagree — for example on IT capacity, hall height or site area — both figures are shown
                and the disagreement is explained rather than resolved silently.
              </li>
            </ul>
            <h3>Architecture</h3>
            <ul>
              <li>
                <b>Data layer</b> — a single declarative campus model. Components are records with a geometry type,
                position, size, instancing offsets, construction window and systems membership. Every other view (3D,
                flow animation, delivery layer, commissioning) is derived from that one model, so nothing can drift out
                of sync with anything else.
              </li>
              <li>
                <b>Flow graph</b> — the connectivity graph is also the dependency graph. The commissioning blocker
                messages you see are computed from the same edges the animated flows are drawn from.
              </li>
              <li>
                <b>3D layer</b> — React Three Fiber. Repeated equipment (generators, racks, accelerators, cold plates,
                switches, CDUs) is drawn as instanced geometry so a campus with thousands of items stays interactive.
              </li>
              <li>
                <b>Construction model</b> — each component carries a phase window. Modules are offset from each other so
                the model shows phased delivery rather than a single simultaneous build.
              </li>
            </ul>
          </div>
        )}

        {tab === 'facts' && (
          <div>
            <p className="tiny">
              Every public quantity used anywhere in the application, with its source ids. Derived rows are arithmetic
              on those quantities and are labelled SIMPLIFIED.
            </p>
            <table className="simple">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Item</th>
                  <th style={{ width: '24%' }}>Value</th>
                  <th style={{ width: 16 }}>Label</th>
                  <th>Note and sources</th>
                </tr>
              </thead>
              <tbody>
                {FACTS.map((f) => (
                  <tr key={f.id}>
                    <td>{f.label}</td>
                    <td className="mono">{f.value}</td>
                    <td>
                      <span className="swatch" style={{ background: CLASSIFICATION_COLORS[f.classification] }} />
                      {f.classification}
                    </td>
                    <td>
                      {f.note}{' '}
                      <b>{f.sources.join(', ')}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sources' && (
          <div>
            <p className="tiny">
              Public documents are cited by id. Consent and council material is public; industry material supports only
              TYPICAL claims. Where a press report is cited it is cited to record that a figure circulates publicly, not
              as an authority.
            </p>
            {SOURCES.map((s) => (
              <div key={s.id} style={{ margin: '12px 0' }}>
                <div className="mono" style={{ color: 'var(--accent)' }}>
                  {s.id}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                  <a className="src-link" href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                </div>
                <div className="tiny">
                  {s.publisher} · {s.date} · <b>{s.kind}</b>
                </div>
                <div className="tiny" style={{ marginTop: 3 }}>
                  <b>Used for:</b> {s.usedFor}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}