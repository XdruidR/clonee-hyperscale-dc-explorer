/**
 * Data-model integrity self test.
 *
 * Run with:  npm run selftest
 *
 * This does not test rendering. It tests the thing that actually breaks in an
 * app like this: the declarative model getting out of sync with the views that
 * are derived from it.
 */
import {
  COMPONENTS,
  COMPONENT_BY_ID,
  FLOW_LINKS,
  MODULES,
  HALLS,
  POWER_CHAIN,
  HEAT_CHAIN,
  FIBRE_CHAIN,
  instanceCount,
} from '../src/data/campus';
import { COMPONENT_INFO } from '../src/data/componentInfo';
import { PHASES } from '../src/data/phases';
import { JOURNEYS } from '../src/data/journeys';
import { CX_STAGES, CX_ORDER } from '../src/data/commissioning';
import { FAULT_SCENARIOS, GRID_FAILURE_SEQUENCE } from '../src/data/faults';
import { FACTS, FACT_BY_ID } from '../src/data/facts';
import { SOURCES } from '../src/data/sources';
import { buildStateOf, blockersFor, canStartStage } from '../src/state/store';
import { WATER_BALANCE } from '../src/data/water';

let failures = 0;
let checks = 0;

function ok(cond: boolean, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    console.error('  FAIL:', msg);
  }
}

function section(name: string) {
  console.log('\n' + name);
}

/* ---------------------------------------------------------------- structure */
section('campus model');
ok(COMPONENTS.length > 140, `expected a substantial component list, got ${COMPONENTS.length}`);
ok(instanceCount() > 5000, `expected thousands of rendered instances, got ${instanceCount()}`);
const ids = new Set<string>();
for (const c of COMPONENTS) {
  ok(!ids.has(c.id), `duplicate component id: ${c.id}`);
  ids.add(c.id);
  ok(!!COMPONENT_INFO[c.type], `component ${c.id} has no metadata entry for type ${c.type}`);
  ok(
    c.build[0] <= c.build[1] && c.build[0] >= 0 && c.build[1] < PHASES.length,
    `component ${c.id} has an invalid construction window ${JSON.stringify(c.build)}`,
  );
  if (c.module) ok(c.module >= 1 && c.module <= 3, `component ${c.id} has bad module ${c.module}`);
  if (c.hall) ok(c.hall >= 1 && c.hall <= 6, `component ${c.id} has bad hall ${c.hall}`);
  if (c.offsets) ok(c.offsets.length > 0, `component ${c.id} declares instancing but has no offsets`);
}
console.log(
  `  ${COMPONENTS.length} component records, ${new Set(COMPONENTS.map((c) => c.type)).size} geometry types, ${instanceCount()} rendered instances`,
);

/* ------------------------------------------------------------------- layout */
section('layout sanity');
const hallComps = COMPONENTS.filter((c) => c.type === 'data-hall');
ok(hallComps.length === 6, `expected 6 data halls, got ${hallComps.length}`);
for (const h of hallComps) {
  const area = h.size[0] * h.size[2];
  ok(
    Math.abs(area - 8210) / 8210 < 0.06,
    `hall ${h.hall} footprint ${Math.round(area)} m2 deviates from the public ~8,210 m2 figure`,
  );
  const overlaps = hallComps.filter((o) => o !== h).filter((o) =>
    Math.abs(o.pos[0] - h.pos[0]) * 2 < o.size[0] + h.size[0] && Math.abs(o.pos[2] - h.pos[2]) * 2 < o.size[2] + h.size[2],
  );
  ok(overlaps.length === 0, `hall ${h.hall} overlaps hall ${overlaps.map((o) => o.hall).join(',')}`);
}
const genBlocks = COMPONENTS.filter((c) => c.type === 'generator');
ok(genBlocks.length === 6, `six generation blocks expected (one per hall), got ${genBlocks.length}`);
ok(
  genBlocks.reduce((a, c) => a + (c.offsets?.length ?? 0), 0) === 84,
  `84 generators expected in the model, got ${genBlocks.reduce((a, c) => a + (c.offsets?.length ?? 0), 0)}`,
);
ok(genBlocks.every((c) => c.hall && c.module), 'every generation block should be attributed to a hall and module');
const genSpan = Math.max(...genBlocks.flatMap((c) => (c.offsets ?? []).map(([x]) => Math.abs(x) + c.size[0] / 2)));
ok(genSpan < 26, `generator blocks must stay inside the module plant zone, reached x=${genSpan}`);
const fuelBlocks = COMPONENTS.filter((c) => c.type === 'fuel-tank');
ok(fuelBlocks.length === 6 && fuelBlocks.every((c) => (c.offsets?.length ?? 0) === 14), 'each generation block should carry one fuel tank per set');
const plumes = COMPONENTS.filter((c) => c.type === 'heat-plume');
ok(plumes.length === 3, 'one heat rejection plume per module expected');
for (const h of hallComps) {
  const other = COMPONENTS.filter(
    (c) => c.module === h.module && c.hall !== h.hall && c.size[1] > 1.5 && c.type !== 'module-plant',
  );
  const clash = other.filter((c) =>
    Math.abs(c.pos[0] - h.pos[0]) * 2 < c.size[0] + h.size[0] && Math.abs(c.pos[2] - h.pos[2]) * 2 < c.size[2] + h.size[2],
  );
  ok(clash.length === 0, `hall ${h.hall} overlaps module plant: ${clash.map((c) => c.id).join(', ')}`);
}
const gxpTowers = COMPONENTS.filter((c) => c.type === 'hv-tower');
ok(gxpTowers.length === 4, `public record describes 4 towers (2 replaced + 2 new), got ${gxpTowers.length}`);
const bores = COMPONENTS.find((c) => c.id === 'site.bore')!;
ok(bores.offsets?.length === 5, `bore field of 4-5 bores modelled, got ${bores.offsets?.length}`);
for (const m of MODULES) {
  ok(m.halls.length === 2, `module ${m.n} should contain two halls`);
}

/* --------------------------------------------------------------- flow graph */
section('flow graph');
for (const lk of FLOW_LINKS) {
  ok(!!COMPONENT_BY_ID[lk.from], `link ${lk.id} references unknown source ${lk.from}`);
  ok(!!COMPONENT_BY_ID[lk.to], `link ${lk.id} references unknown destination ${lk.to}`);
  ok(lk.from !== lk.to, `link ${lk.id} is a self loop on ${lk.from}`);
}
ok(FLOW_LINKS.length > 100, `expected a rich flow graph, got ${FLOW_LINKS.length} links`);

const walk = (start: string, medium?: string) => {
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const lk of FLOW_LINKS) {
      if (lk.from !== cur) continue;
      if (medium && lk.medium !== medium) continue;
      if (!seen.has(lk.to)) {
        seen.add(lk.to);
        queue.push(lk.to);
      }
    }
  }
  return seen;
};
const powerReach = walk('hv.line');
ok(powerReach.has('gxp.xfmr'), 'power graph does not reach the GXP transformer from the transmission line');
ok(powerReach.has('M1-W.gpu'), 'power graph does not reach an accelerator from the transmission line');
ok(
  walk('M1-W.gpu').has('M1.cool'),
  'cooling graph does not reach heat rejection from the accelerator',
);
ok(
  walk('M1-W.hall').has('M1-W.res'),
  'water graph does not reach the reservoir from the hall roof',
);
ok(walk('site.basin').has('site.wetland'), 'water graph does not reach the wetland from the stormwater basin');
ok(walk('site.potable').has('site.ww'), 'water graph does not reach wastewater treatment from the potable system');
const dataReach = walk('site.fibre');
ok(dataReach.has('site.core'), 'data graph does not reach the campus core from the fibre route');
ok(dataReach.has('M1-W.gpu'), 'data graph does not reach an accelerator from the fibre route');
for (const h of HALLS) {
  ok(powerReach.has(`${h}.gpu`), `no power path to the accelerator in ${h}`);
  ok(walk(`${h}.gpu`).has(`${h}.cold`), `no cooling path to the cold plates in ${h}`);
  ok(walk(`${h}.gpu`).has(`${h}.cdu`), `no cooling path to a CDU in ${h}`);
  ok(dataReach.has(`${h}.switch`), `no data path to the fabric in ${h}`);
  ok(walk('site.bore').has(`${h}.res`), `no groundwater make-up path to the reservoir under ${h}`);
}
for (const chain of [POWER_CHAIN, HEAT_CHAIN, FIBRE_CHAIN]) {
  for (const id of chain) ok(!!COMPONENT_BY_ID[id], `chain references unknown component ${id}`);
}

/* ------------------------------------------------------- commissioning logic */
section('commissioning');
for (const s of CX_STAGES) {
  for (const need of s.needs) {
    ok(
      CX_ORDER.indexOf(need) < CX_ORDER.indexOf(s.id),
      `commissioning stage ${s.id} depends on ${need}, which is not earlier in the programme`,
    );
  }
}
const noneDone: string[] = [];
for (const c of COMPONENTS) {
  const info = COMPONENT_INFO[c.type];
  for (const st of info?.cxStages ?? []) {
    ok(!!CX_STAGES.find((s) => s.id === st), `${c.id} references unknown commissioning stage ${st}`);
  }
}
ok(!canStartStage('install-check', noneDone), 'install check should not be startable before the factory test');
const afterFactory = ['design-review', 'factory-test'];
ok(canStartStage('install-check', afterFactory), 'install check should be startable once the factory test is done');
const rackBlockers = blockersFor('M1-W.rack', 'functional-test', afterFactory);
ok(rackBlockers.length > 0, 'a rack should be blocked from functional testing with nothing else commissioned');
ok(
  rackBlockers.some((b) => /ups|lv|bus|pdu|sub/i.test(b.component + b.message)),
  `rack blockers should reference upstream electrical equipment, got: ${rackBlockers.map((b) => b.message).join(' | ')}`,
);

/* --------------------------------------------------------- construction time */
section('construction programme');
ok(PHASES.length === 36, `expected 36 phases, got ${PHASES.length}`);
ok(PHASES[0].id === 'existing', 'first phase should be the existing site');
ok(PHASES[PHASES.length - 1].id === 'handover', 'last phase should be operational handover');
const fullBuild = buildStateOf(COMPONENT_BY_ID['M1-W.rack'], PHASES.length - 1);
ok(fullBuild.state === 'complete', 'a rack should exist at the end of the programme');
ok(buildStateOf(COMPONENT_BY_ID['M1-W.rack'], 0).state === 'hidden', 'a rack should not exist at phase 0');
ok(buildStateOf(COMPONENT_BY_ID['hv.line'], 0).state === 'complete', 'the existing transmission line exists at phase 0');
const shedAt35 = buildStateOf(COMPONENT_BY_ID['tmp.sheds'], 35);
ok(shedAt35.state === 'hidden', 'temporary site sheds should be gone by handover');
ok(
  buildStateOf(COMPONENT_BY_ID['M3-W.rack'], 25).state !== 'complete',
  'module 3 racks should not be installed while module 1 racks are being installed (phased delivery)',
);
ok(
  buildStateOf(COMPONENT_BY_ID['M1-W.rack'], 33).state === 'complete' &&
    buildStateOf(COMPONENT_BY_ID['M3-W.rack'], 33).state !== 'complete',
  'module 1 should be operational before module 3',
);
/* the whole campus must actually finish inside the programme */
for (const id of ['M1-W.rack', 'M2-W.rack', 'M3-W.rack', 'M3-E.gpu', 'M2-E.cdu', 'M3.cool', 'gxp.xfmr']) {
  ok(
    buildStateOf(COMPONENT_BY_ID[id], PHASES.length - 1).state === 'complete',
    `${id} is still incomplete at handover - a lagged module ran off the end of the programme`,
  );
}

/* ---------------------------------------------------------------- journeys */
section('journeys');
ok(JOURNEYS.length >= 10, `expected at least 10 guided journeys, got ${JOURNEYS.length}`);
for (const j of JOURNEYS) {
  ok(j.steps.length > 0, `journey ${j.id} has no steps`);
  ok(!!j.classificationHint, `journey ${j.id} has no classification hint`);
  for (const st of j.steps) {
    ok(st.focus.length > 0, `step "${st.title}" in ${j.id} focuses nothing`);
    for (const id of st.focus) ok(!!COMPONENT_BY_ID[id], `step "${st.title}" focuses unknown component ${id}`);
    for (const id of st.look) ok(!!COMPONENT_BY_ID[id], `step "${st.title}" looks at unknown component ${id}`);
  }
}

/* ------------------------------------------------------------- provenance */
section('provenance');
ok(FACTS.length > 20, `expected a substantial fact register, got ${FACTS.length}`);
const srcIds = new Set(SOURCES.map((s) => s.id));
for (const f of FACTS) {
  ok(f.sources.length > 0, `fact ${f.id} has no source`);
  for (const sid of f.sources) ok(srcIds.has(sid), `fact ${f.id} cites unknown source ${sid}`);
}
ok(FACT_BY_ID['generators'], 'generator fact should exist');
for (const c of COMPONENTS) {
  for (const fid of c.facts ?? []) ok(!!FACT_BY_ID[fid], `component ${c.id} cites unknown fact ${fid}`);
  for (const fid of COMPONENT_INFO[c.type]?.facts ?? []) {
    ok(!!FACT_BY_ID[fid], `metadata for ${c.type} cites unknown fact ${fid}`);
  }
}
for (const r of WATER_BALANCE) {
  for (const sid of r.sources) ok(srcIds.has(sid), `water row ${r.id} cites unknown source ${sid}`);
}

/* -------------------------------------------------------------- resilience */
section('resilience');
ok(GRID_FAILURE_SEQUENCE.length >= 8, 'utility-loss sequence should have several stages');
ok(GRID_FAILURE_SEQUENCE[0].grid === 'normal', 'utility-loss sequence should start on utility');
ok(
  GRID_FAILURE_SEQUENCE.some((p) => p.grid === 'lost' && p.ups),
  'utility-loss sequence must include the UPS carrying the load',
);
ok(
  GRID_FAILURE_SEQUENCE.some((p) => p.gen),
  'utility-loss sequence must include generators running',
);
for (const s of FAULT_SCENARIOS) {
  ok(
    COMPONENTS.some((c) => c.type === s.targetType),
    `fault scenario ${s.id} targets unknown component type ${s.targetType}`,
  );
  ok(!!s.caveat, `fault scenario ${s.id} has no evidence caveat`);
  ok(s.highlight.every((id) => !!COMPONENT_BY_ID[id]), `fault scenario ${s.id} highlights unknown components`);
}

/* -------------------------------------------------------- public arithmetic */
section('public arithmetic (consistency of the published figures)');
const genMW = 84 * 3.2;
ok(Math.abs(genMW - 268.8) < 0.01, `84 x 3.2 MW should be 268.8 MW, got ${genMW}`);
ok(genMW / 240 > 1 && genMW / 240 < 1.2, 'the generation margin narrative depends on a ratio near 1.1x');
const heatMW = 84 * 5.3;
ok(Math.abs(heatMW - 445.2) < 0.01, `84 x 5.3 MW should be 445.2 MW, got ${heatMW}`);
const litresPerKWh = (288_000 * 1000) / (240 * 1000 * 8760);
ok(litresPerKWh > 0.1 && litresPerKWh < 0.2, `derived water intensity should be ~0.14 L/kWh, got ${litresPerKWh}`);
const roofArea = 6 * 74 * 110;
ok(roofArea > 40_000, `modelled hall roof area ${roofArea} m2 should exceed the public ~30,000 m2 captured area`);

/* -------------------------------------------------------------------- done */
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILURES`);
  process.exit(1);
}
console.log('OK');