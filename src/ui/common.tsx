import type { ReactNode } from 'react';
import type { Classification } from '../data/types';
import { CLASSIFICATION_MEANING } from '../data/facts';
import { SOURCE_BY_ID } from '../data/sources';

/** Badge text. The four labels are short enough to sit in a 9.5px badge. */
const SHORT: Record<Classification, string> = {
  'PUBLIC FACT': 'FACT',
  DERIVED: 'DERIVED',
  TYPICAL: 'TYPICAL',
  SYNTHETIC: 'SYNTHETIC',
};

const CLS: Record<Classification, string> = {
  'PUBLIC FACT': 'fact',
  DERIVED: 'derived',
  TYPICAL: 'typical',
  SYNTHETIC: 'synthetic',
};

export function Badge({ c, title }: { c: Classification; title?: string }) {
  return (
    <span className={`badge ${CLS[c]}`} title={title ?? CLASSIFICATION_MEANING[c]}>
      {SHORT[c]}
    </span>
  );
}

/**
 * Citation links.
 *
 * A link renders as its source id rather than as text describing a link, because
 * the id is how the rest of the application refers to the document and it makes
 * a claim's provenance checkable at a glance.
 */
export function Cite({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <>
      {' '}
      {ids.map((id, i) => {
        const s = SOURCE_BY_ID[id];
        if (!s) return null;
        return (
          <span key={id}>
            {i > 0 && ','}
            <a
              className="src-link"
              href={s.url}
              target="_blank"
              rel="noreferrer"
              title={`${s.publisher} — ${s.title}`}
            >
              {id}
            </a>
          </span>
        );
      })}
    </>
  );
}

export function FactNote({ c, ids, children }: { c: Classification; ids?: string[]; children: ReactNode }) {
  return (
    <div className={`callout ${CLS[c]}`}>
      <Badge c={c} />
      <div style={{ marginTop: 4 }}>{children}</div>
      {ids && ids.length > 0 && (
        <div className="tiny" style={{ marginTop: 4 }}>
          Sources:<Cite ids={ids} />
        </div>
      )}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h3>{title}</h3>
      {children}
    </>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

/** Integer formatting. Irish grouping, because this is an Irish project. */
export function num(n: number) {
  return n.toLocaleString('en-IE', { maximumFractionDigits: 0 });
}

/**
 * The provenance chip used inline in evidence mode.
 *
 * Coloured background from the classification palette, so a reader scanning a
 * claim list sees the evidence status before they read the words.
 */
export function ClaimChip({ c, sources }: { c: Classification; sources?: string[] }) {
  return (
    <>
      <span className={`badge ${CLS[c]}`} title={CLASSIFICATION_MEANING[c]}>
        {SHORT[c]}
      </span>
      {sources && sources.length > 0 && <Cite ids={sources} />}
    </>
  );
}