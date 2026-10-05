import { useState } from 'react';
import { CLASSIFICATION_COLORS, CLASSIFICATION_MEANING, FACTS } from '../data/facts';
import { SOURCES, SOURCE_KIND_MEANING } from '../data/sources';
import { CLASSIFICATIONS } from '../data/types';
import { PHASES } from '../data/phases';
import { capacityReconciliationSentence, derived, fmtInt } from '../data/calculations';
import { Badge, Cite } from './common';

type Tab = 'method' | 'facts' | 'sources';

/**
 * Method, public facts and sources.
 *
 * The method tab is where the honesty rule is stated, because the evidence system
 * is load-bearing and a reader who does not understand it will misread the rest
 * of the application. The "what is not public" section is deliberately a full
 * section rather than a footnote: the boundary of the record is part of the
 * product.
 */
export function SourcesPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('method');
  const horizon = PHASES.find((p) => p.id === 'horizon');

  return (
    <div className="sources" onClick={onClose}>
      <div className="sources-inner" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h2>Research, provenance and method</h2>
          <button onClick={onClose}>Close</button>
        </div>

        <div className="tabs2">
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
          <>
            <p>
              This application reconstructs the Meta data centre campus at Clonee, County Meath, as a teaching model. It
              is not a digital twin and it is not a design. It uses as much public information as is reasonably available,
              fills the gaps with accepted hyperscale design practice, and says which is which.
            </p>
            <p>
              The campus has <strong>five data-storage buildings</strong> — CLN1, CLN2, CLN3, CLN5 and CLN6, with{' '}
              <strong>no CLN4</strong> — <strong>twenty data halls</strong> of approximately 4,170 m² each,{' '}
              <strong>ninety diesel generators</strong>, and a dedicated customer-built <strong>220 kV substation</strong>{' '}
              that EirGrid records as completed in August 2017.
            </p>

            <h3>The classification rule</h3>
            <p>
              Every claim in the model carries one of four labels. The label is visible wherever a claim is made, and turn
              on <strong>evidence mode</strong> in the toolbar to see it on labels and in panels.
            </p>
            {CLASSIFICATIONS.map((c) => (
              <div key={c} className="callout" style={{ borderLeftColor: CLASSIFICATION_COLORS[c], borderLeftWidth: 1 }}>
                <Badge c={c} /> {CLASSIFICATION_MEANING[c]}
              </div>
            ))}
            <p>
              The rule that keeps this honest: <strong>invention is allowed, misrepresentation is not.</strong> Where a
              value has to be assumed, the assumption is declared in one place with its own classification and a written
              reason, and the interface shows it as an assumption.
            </p>

            <h3>What is not public</h3>
            {horizon && <p>{horizon.detail}</p>}
            <p>
              Specifically absent from the record, and therefore never asserted here: campus single-line diagrams;
              generator ratings and their distribution between buildings; transformer ratings; switchgear lineups; UPS
              architecture and autonomy; cooling plant counts, ratings and control logic; the achieved redundancy rating;
              internal hall layout; and any historical programme or cost data.
            </p>

            <h3>The capacity figures do not agree, and that is the point</h3>
            <p>{capacityReconciliationSentence()}</p>
            <p>
              Beyond that, the sources quote {fmtInt(derived.itCapacityMW)} MW from the consent, 108 MVA from the design
              record, nearly 150,000 m² of floor area, and a higher current figure from the operator. Each is carried in
              the fact register with what it means and what it does not mean. None is averaged into the others.
            </p>

            <h3>How the model is built</h3>
            <ul className="plain">
              <li>
                <strong>Data layer.</strong> Every published input lives in one file with its source ids. Every derived
                quantity is computed once, there, and the interface reads from that. No panel restates a number by hand.
              </li>
              <li>
                <strong>Flow graph.</strong> Energy, water, air and data move along an explicit graph of about 350 links,
                each with its own provenance label. If a link is wrong, the reachability checks in the self test fail.
              </li>
              <li>
                <strong>3D layer.</strong> About 300 components and roughly 20,000 rendered instances, all instanced, with
                a single construction timeline carried on each component rather than in a second table.
              </li>
              <li>
                <strong>Commissioning model.</strong> Turnover packages with real cross-package dependencies, so a
                component's status is computed over its whole upstream closure rather than over its own package.
              </li>
            </ul>

            <h3>Project controls</h3>
            <p>
              The delivery and cost model is <strong>synthetic</strong> and generated from the same phase list as the 3D
              model, so the two cannot disagree. Its anchors are real: published Irish cost-per-MW figures, the operator's
              published workforce, and the published commissioning cost ratio. No transaction in it is historical, and
              nothing in it should be read as a claim about the real project.
            </p>

            <h3>Integrity</h3>
            <p>
              The self test in <code>scripts/selftest.ts</code> checks that every geometry type has metadata, every
              citation resolves, the flow graph reaches what the panels claim it reaches, the commissioning graph blocks
              correctly, the construction timeline is single-sourced, and the derived arithmetic agrees with the published
              figures when recomputed independently.
            </p>
          </>
        )}

        {tab === 'facts' && (
          <>
            <p>
              Every fact in the model, with its classification and sources. Values that restate the consent or the
              licence are marked as public facts; values computed from them are derived; values describing normal
              practice are typical.
            </p>
            <table className="simple">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Value</th>
                  <th>Label</th>
                  <th>Note and sources</th>
                </tr>
              </thead>
              <tbody>
                {FACTS.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <b>{f.label}</b>
                    </td>
                    <td className="mono">{f.value}</td>
                    <td>
                      <Badge c={f.classification} />
                    </td>
                    <td>
                      {f.note}
                      <div>
                        <Cite ids={f.sources} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'sources' && (
          <>
            <p>
              The source register. Planning and environmental documents carry the project facts; industry, standards and
              press sources are used only for typical practice or for delivery context, and are labelled as such wherever
              they are cited.
            </p>
            {SOURCES.map((s) => (
              <div key={s.id} className="source-item">
                <div>
                  <a className="src-link" href={s.url} target="_blank" rel="noreferrer">
                    {s.id}
                  </a>{' '}
                  <b>{s.title}</b>
                </div>
                <div className="meta">
                  {s.publisher} · {s.date} · {SOURCE_KIND_MEANING[s.kind]}
                </div>
                <div className="used">
                  <b>Used for:</b> {s.usedFor}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}