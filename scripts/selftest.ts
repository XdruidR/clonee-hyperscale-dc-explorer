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
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildStateOf,
  laggedPhase,
  modulePhaseOffset,
  modulesReady,
  canStartStage,
  blockersForPackage,
  nextStageForPackage,
  componentCxStatus,
  packageDone,
  outstandingPackages,
} from '../src/state/store';
import { TURNOVER_PACKAGES, PACKAGE_BY_ID, packagesContaining } from '../src/data/turnover';
import { derived, INPUTS, waterIntensitySentence } from '../src/data/calculations';
import { supplyFromSequenceStep, supplyState, SUPPLY_ASSUMPTIONS } from '../src/data/supply';
import { RACK_ARCHETYPES, chainFor, NETWORK_LAYERS } from '../src/data/archetypes';
import { toClaim } from '../src/data/types';
import { WATER_BALANCE } from '../src/data/water';

const cxStageIndex = (id: string) => CX_ORDER.indexOf(id);

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
const emptyCx: Record<string, string[]> = {};
const itPkg = 'M1-W.IT';
const itBlockers = blockersForPackage(emptyCx, itPkg);
ok(itBlockers.length > 0, 'a hall IT turnover package should be blocked with nothing commissioned');
ok(
  itBlockers.some((b) => /power train|cooling distribution|network fabric/.test(b.message)),
  `IT blockers should reference upstream turnover packages, got: ${itBlockers.map((b) => b.message).join(' | ')}`,
);

/* turnover packages must be internally consistent */
for (const p of TURNOVER_PACKAGES) {
  ok(p.scope.length > 0 || p.id === 'SITE.FIRE', `turnover package ${p.id} has no scope`);
  for (const c of p.scope) ok(!!COMPONENT_BY_ID[c], `turnover package ${p.id} scopes unknown component ${c}`);
  for (const r of p.requires) ok(!!PACKAGE_BY_ID[r], `turnover package ${p.id} requires unknown package ${r}`);
  ok(!p.requires.includes(p.id), `turnover package ${p.id} requires itself`);
  const seen = new Set<string>();
  for (const st of p.stages) {
    ok(!!CX_STAGES.find((s) => s.id === st), `turnover package ${p.id} lists unknown stage ${st}`);
    ok(!seen.has(st), `turnover package ${p.id} repeats stage ${st}`);
    seen.add(st);
  }
}
/* an IT package cannot be signed off while its upstream packages are not */
{
  const cx: Record<string, string[]> = {};
  const itStages = PACKAGE_BY_ID['M1-W.IT'].stages;
  for (const st of itStages) cx['M1-W.IT'] = [...(cx['M1-W.IT'] ?? []), st];
  ok(
    blockersForPackage(cx, 'M1-W.IT').length > 0,
    'signing off every IT stage must still be blocked by the upstream packages',
  );
  /* satisfy the whole upstream chain and it should clear */
  for (const id of ['GXP', 'M1.PWR', 'M1.GEN', 'M1.COOL', 'SITE.NET', 'M1-W.PWR', 'M1-W.NET', 'M1-W.COOL']) {
    cx[id] = [...PACKAGE_BY_ID[id].stages];
  }
  ok(
    blockersForPackage(cx, 'M1-W.IT').length === 0,
    `IT package should be unblocked once every upstream package is signed off, got: ${blockersForPackage(cx, 'M1-W.IT').map((b) => b.message).join(' | ')}`,
  );
}
/* component commissioning status is derived from its package AND the packages it
   depends on, not from a global stage flag */
{
  const cx: Record<string, string[]> = {};
  const completeClosure = (pkgId: string) => {
    const seen = new Set<string>();
    const walk = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      for (const r of PACKAGE_BY_ID[id].requires) walk(r);
      cx[id] = [...PACKAGE_BY_ID[id].stages];
    };
    walk(pkgId);
  };

  ok(componentCxStatus(cx, 'M1-W.rack').status === 'not-started', 'a rack should be not-started initially');
  ok(componentCxStatus(cx, 'M1-W.upsA').status === 'not-started', 'a UPS should be not-started initially');

  /* sign off the power package only: a UPS still cannot be accepted, because its
     package depends on the module MV switchgear and the generation block */
  cx['M1-W.PWR'] = [...PACKAGE_BY_ID['M1-W.PWR'].stages];
  ok(
    componentCxStatus(cx, 'M1-W.upsA').status === 'in-progress',
    'a UPS whose own package is signed off but whose upstream packages are not must be in-progress, not complete',
  );
  ok(
    componentCxStatus(cx, 'M1-W.upsA').blocking.length > 0,
    'the UPS must report its unsigned upstream packages as blockers',
  );
  ok(
    componentCxStatus(cx, 'M1-W.rack').status !== 'complete',
    'a rack must NOT complete when only its power package is signed off',
  );
  ok(
    componentCxStatus(cx, 'M1-W.rack').packages.length > 1,
    'a rack status must span its own package plus the packages it depends on',
  );

  completeClosure('M1-W.IT');
  ok(
    componentCxStatus(cx, 'M1-W.rack').status === 'complete',
    `completing the IT package and its full upstream closure should complete the rack, got ${componentCxStatus(cx, 'M1-W.rack').status}`,
  );
  ok(
    componentCxStatus(cx, 'M1-W.gpu').status === 'complete',
    'an accelerator in the same package should complete with it',
  );
  ok(
    componentCxStatus(cx, 'M2-W.rack').status !== 'complete',
    'completing hall 1 must not complete hall 2 - turnover packages are hall-scoped',
  );
  ok(
    componentCxStatus(cx, 'M2-W.gpu').status !== 'complete',
    'completing hall 1 must not complete hall 2 accelerators',
  );
  ok(outstandingPackages(cx).length > 0, 'the site as a whole is still not fully commissioned');
}
ok(packagesContaining('M1-W.rack').length === 1, 'a rack should sit in exactly one turnover package');
ok(packagesContaining('M1.mv').length === 1, 'an MV lineup should sit in exactly one turnover package');
ok(packagesContaining('M1-W.upsA').length === 1, 'a UPS should sit in exactly one turnover package');

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
/* there must be exactly one module-lag model in the source tree */
{
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f.name)) {
        const src = readFileSync(p, 'utf8');
        // any hardcoded (module - 1) * n lag, or a second MODULE_SHIFT table
        if (/\(module\s*-\s*1\)\s*\*/.test(src)) offenders.push(`${p}: duplicate module lag expression`);
        if (/MODULE_SHIFT\s*[:=]/.test(src) && !p.endsWith('state/store.ts')) offenders.push(`${p}: second MODULE_SHIFT`);
        if (/modulesLive/.test(src)) offenders.push(`${p}: leftover modulesLive timeline`);
      }
    }
  };
  walk('src');
  ok(offenders.length === 0, `duplicate construction-timeline models found: ${offenders.join('; ')}`);
  ok(modulePhaseOffset(1) === 0 && modulePhaseOffset(2) > 0 && modulePhaseOffset(3) > modulePhaseOffset(2),
    'module lag must increase with module number');
  ok(laggedPhase(29, 3) <= PHASES.length - 1, 'module 3 fitout must land inside the programme');
}

/* module readiness must be monotonic and end with all modules handed over */
{
  const r1 = modulesReady(0, COMPONENTS);
  const r35 = modulesReady(PHASES.length - 1, COMPONENTS);
  ok(r1.every((r) => !r.live), 'no module should be live at phase 0');
  ok(r35.every((r) => r.live && r.handedOver), 'all modules should be handed over at the end');
  ok(
    modulesReady(20, COMPONENTS).every((r) => !r.live),
    'no module should be live before the fitout phase',
  );
  const mids = modulesReady(29, COMPONENTS);
  ok(mids[0].live && !mids[2].live, 'module 1 should be live before module 3 - phased delivery');
  ok(
    r35.every((r) => r.componentsComplete === r.componentsTotal),
    'every module component should be complete at handover',
  );
}

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

/* ================================================================== SEMANTIC
 * Tests from the review's section 10: these check the meaning of the model,
 * not just that identifiers resolve.
 * ====================================================================== */

section('semantic: canonical calculations drive every displayed quantity');

/* the canonical figures, recomputed independently here */
{
  const expectLPerKWh = (288_000 * 1000) / (INPUTS.itCapacityMW * 1000 * INPUTS.hoursPerYear);
  ok(
    Math.abs(derived.waterKgPerKwhIt - expectLPerKWh) < 1e-9,
    `canonical water intensity drifted: ${derived.waterKgPerKwhIt} vs ${expectLPerKWh}`,
  );
  ok(
    Math.abs(derived.waterKgPerKwhHeat - derived.waterKgPerKwhIt) < 1e-9,
    'water per kWh of heat rejected must equal water per kWh of IT load, since all IT power becomes heat',
  );
  ok(
    Math.abs(derived.waterM3PerMwhIt - derived.waterKgPerKwhIt) < 1e-9,
    'm3/MWh and kg/kWh are numerically identical and must agree',
  );
  ok(Math.abs(derived.generationRatedMW - 268.8) < 0.01, 'generation rated MW drifted');
  ok(Math.abs(derived.generationHeatMW - 445.2) < 0.01, 'generator heat MW drifted');
  ok(waterIntensitySentence().includes('0.137'), 'the canonical sentence must contain the canonical figure');
}

/* No UI narrative may restate a derived quantity by hand. */
{
  const banned: [RegExp, string][] = [
    [/0\.57\s*(kg|per kWh)/i, 'the superseded 0.57 kg/kWh figure'],
    [/0\.137/, 'a hand-copied water intensity'],
    [/roughly\s+1\s*m3\s+per\s+MWh/i, 'the superseded 1 m3/MWh narrative'],
  ];
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f.name) && !p.endsWith('calculations.ts') && !p.endsWith('selftest.ts')) {
        const src = readFileSync(p, 'utf8');
        for (const [re, why] of banned) if (re.test(src)) offenders.push(`${p}: ${why}`);
      }
    }
  };
  walk('src');
  ok(offenders.length === 0, `narrative restates a derived number: ${offenders.join('; ')}`);
}

section('semantic: every operational source reaches its critical loads');
{
  /* generation must be a real source, not narrative */
  const fromGen = (genId: string) => {
    const seen = new Set<string>([genId]);
    const queue = [genId];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const lk of FLOW_LINKS) {
        if (lk.from !== cur) continue;
        if (!seen.has(lk.to)) {
          seen.add(lk.to);
          queue.push(lk.to);
        }
      }
    }
    return seen;
  };
  for (const h of HALLS) {
    const reach = fromGen(`${h}.gen`);
    ok(
      reach.has(`${h}.gpu`),
      `generation in ${h} has no electrical path to the accelerator in the same hall`,
    );
    const mod = h.slice(0, 2);
    ok(reach.has(`${mod}.mv`), `generation in ${h} has no path to the campus MV / emergency bus`);
    /* the GXP transformer is fed BY the grid, not by the generators: they are
       alternative sources into the same bus, not a chain */
    ok(
      !reach.has('gxp.xfmr'),
      `generation must not reach the GXP transformer in ${h}: grid and generation are alternate sources`,
    );
  }
  /* and generation must be able to close onto the same bus the grid feeds */
  const busFeeders = new Set(
    FLOW_LINKS.filter((lk) => lk.medium === 'mv' && lk.to.endsWith('.mv')).map((lk) => lk.from),
  );
  ok(
    [...busFeeders].some((f) => f.includes('xfmr')),
    'no utility source reaches the campus MV bus',
  );
  ok(
    [...busFeeders].some((f) => f.includes('gensw')),
    'no generation source reaches the campus MV / emergency bus',
  );
  /* both sources must converge on the same bus, which is what makes the
     utility-loss sequence an electrical state change rather than a narration */
  for (const mod of MODULES) {
    const feeders = FLOW_LINKS.filter((lk) => lk.medium === 'mv' && lk.to === `${mod.id}.mv`).map((lk) => lk.from);
    ok(feeders.some((f) => f.includes('xfmr')), `${mod.id}.mv has no utility source`);
    ok(feeders.some((f) => f.includes('gensw')), `${mod.id}.mv has no generation source`);
  }
}

section('semantic: generator heat does not flow through the IT cooling loop');
{
  const genHeatLinks = FLOW_LINKS.filter((lk) => lk.from.endsWith('.genheat') || lk.from.endsWith('.gen'));
  const intoItCooling = genHeatLinks.filter((lk) =>
    ['.cool', '.hx', '.cdu', '.crah', '.res'].some((s) => lk.to.endsWith(s)),
  );
  ok(
    intoItCooling.length === 0,
    `generator heat must not flow into the IT cooling plant, found: ${intoItCooling.map((l) => `${l.from}->${l.to}`).join(', ')}`,
  );
  ok(
    FLOW_LINKS.some((lk) => lk.from.endsWith('.genheat') && lk.to === 'site.ambient'),
    'generator heat must be modelled as rejecting to ambient',
  );
  /* the two problems must be separately visible in the model */
  ok(
    !!COMPONENT_BY_ID['site.ambient'] && !!COMPONENT_BY_ID['M1-W.genheat'],
    'both heat rejection problems need their own components in the model',
  );
}

section('semantic: UPS energy behaves correctly through a utility loss');
{
  const base = { gridLost: false, generatorFault: false, transformerFailed: false, generationAvailable: false, secondsOnBattery: 0 };
  const normal = supplyState(base);
  ok(normal.carrying === 'utility', 'with the grid up the utility should carry the load');
  ok(normal.batteryKwh === SUPPLY_ASSUMPTIONS.batteryKwh, 'batteries should be full on utility');

  const lostNoGen = supplyState({ ...base, gridLost: true, secondsOnBattery: 60 });
  ok(lostNoGen.carrying === 'battery', 'with the grid lost and no generation the UPS must carry the load');
  ok(
    lostNoGen.batteryKwh < normal.batteryKwh,
    `UPS energy must decrease while on battery: ${lostNoGen.batteryKwh} vs ${normal.batteryKwh}`,
  );
  ok(lostNoGen.marginMw < 0, 'carrying on battery must show a capacity shortfall');
  const lostLater = supplyState({ ...base, gridLost: true, secondsOnBattery: 120 });
  ok(lostLater.batteryKwh < lostNoGen.batteryKwh, 'energy must keep falling as time on battery increases');

  const fullAutonomy = (SUPPLY_ASSUMPTIONS.batteryKwh * 60) / INPUTS.itCapacityMW;
  ok(
    lostNoGen.autonomyMinutes < fullAutonomy,
    'autonomy must shrink as the battery drains',
  );
  ok(
    lostLater.autonomyMinutes < lostNoGen.autonomyMinutes,
    'autonomy must keep shrinking with time on battery',
  );

  const lostWithGen = supplyState({ ...base, gridLost: true, generationAvailable: true, secondsOnBattery: 120 });
  ok(lostWithGen.carrying === 'generation', 'generation should carry the load once synchronised');
  ok(lostWithGen.batteryKwh === SUPPLY_ASSUMPTIONS.batteryKwh, 'batteries should be recharging on generation');
  ok(lostWithGen.sources.generation === 'energised', 'the generation source should read energised');

  const genFault = supplyState({ ...base, gridLost: true, generationAvailable: true, generatorFault: true });
  ok(
    genFault.generationCapacityMw < lostWithGen.generationCapacityMw,
    'a generator failure must reduce available generation capacity',
  );

  const xfmrFault = supplyState({ ...base, transformerFailed: true });
  ok(
    xfmrFault.utilityCapacityMw < normal.utilityCapacityMw,
    'a transformer failure must reduce utility import capacity',
  );
  ok(xfmrFault.marginMw < 0, 'losing a transformer must produce a shortfall the operator must act on');
}

section('semantic: the animation and the model cannot disagree');
{
  const inputs = supplyFromSequenceStep(1, []);
  ok(inputs.gridLost, 'sequence step 1 must read as grid lost');
  ok(!inputs.generationAvailable, 'sequence step 1 must not have generation available');
  ok(supplyState(inputs).carrying === 'battery', 'step 1 must show the UPS carrying the load');
  ok(supplyState(supplyFromSequenceStep(5, [])).carrying === 'generation', 'step 5 must show generation carrying');
  ok(
    supplyState(supplyFromSequenceStep(0, [])).carrying === 'utility',
    'step 0 must show the utility carrying the load',
  );
  ok(
    supplyState(supplyFromSequenceStep(8, [])).carrying === 'utility',
    'step 8 must be back on the utility after restoration',
  );
}

section('semantic: a commissioned rack requires its power and cooling systems');
{
  const cx: Record<string, string[]> = {};
  const completeClosure = (pkgId: string) => {
    const seen = new Set<string>();
    const walk = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      for (const r of PACKAGE_BY_ID[id].requires) walk(r);
      cx[id] = [...PACKAGE_BY_ID[id].stages];
    };
    walk(pkgId);
  };
  completeClosure('M1-W.IT');
  ok(componentCxStatus(cx, 'M1-W.rack').status === 'complete', 'full closure should complete the rack');
  /* now delete the cooling package and it must stop being complete */
  delete cx['M1-W.COOL'];
  ok(
    componentCxStatus(cx, 'M1-W.rack').status !== 'complete',
    'removing the cooling package must stop the rack being commissioned',
  );
  ok(
    componentCxStatus(cx, 'M1-W.rack').blocking.some((b) => /cooling distribution/i.test(b.message)),
    'the blocker must name the cooling package',
  );
  delete cx['M1-W.PWR'];
  ok(
    componentCxStatus(cx, 'M1-W.rack').blocking.some((b) => /power train/i.test(b.message)),
    'the blocker must name the power package',
  );
}

section('semantic: every PUBLIC FACT statement carries a public source');
{
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f.name) && !p.endsWith('selftest.ts')) {
        if (!p.endsWith('componentInfo.ts')) continue; // Claims live in the component registry
        const src = readFileSync(p, 'utf8');
        /* explicit Claim objects carry text + classification: PUBLIC FACT must list sources */
        const re = /text:[\s\S]{0,400}?classification:\s*'PUBLIC FACT'[\s\S]{0,200}?\n\s*\}/g;
        for (const m of src.matchAll(re)) {
          if (!/sources:\s*\[/.test(m[0])) offenders.push(p);
        }
      }
    }
  };
  walk('src');
  ok(offenders.length === 0, `PUBLIC FACT claims without sources in: ${[...new Set(offenders)].join(', ')}`);

  /* and the fact register must always cite */
  for (const f of FACTS) ok(f.sources.length > 0, `fact ${f.id} has no source`);
}

section('semantic: rack archetypes and the calculation chain');
{
  ok(RACK_ARCHETYPES.length === 3, 'expected three rack archetypes');
  for (const a of RACK_ARCHETYPES) {
    const c = chainFor(a);
    ok(c.racksTotal > 0, `archetype ${a.id} produced no racks`);
    ok(
      c.racksPerHall === Math.round(c.racksTotal / 6),
      `archetype ${a.id}: racks per hall must be a sixth of the campus total`,
    );
    ok(
      Math.abs(c.heatToRejectMw - INPUTS.itCapacityMW) < 1e-6,
      `archetype ${a.id}: heat rejected must equal the IT load`,
    );
    ok(c.compressorLoadMw >= 0, `archetype ${a.id}: compressor load must be non-negative`);
    ok(c.buswayCurrentPerRackA > 0, `archetype ${a.id}: busway current must be positive`);
    ok(
      Math.abs(c.coolingWaterM3Yr - INPUTS.coolingDemandM3Yr) / INPUTS.coolingDemandM3Yr < 0.25,
      `archetype ${a.id}: water must stay near the published campus figure, got ${c.coolingWaterM3Yr}`,
    );
    ok(a.limitingFactors.length > 0, `archetype ${a.id} should say what limits it`);
    ok(a.classification === 'TYPICAL', `archetype ${a.id} parameters are typical, not fact`);
  }
  /* denser racks must mean fewer racks, and more cooling plant */
  const conv = chainFor(RACK_ARCHETYPES[0]);
  const ai = chainFor(RACK_ARCHETYPES[2]);
  ok(ai.racksTotal < conv.racksTotal, 'a denser archetype must need fewer racks');
  ok(
    ai.compressorLoadMw < conv.compressorLoadMw,
    'a liquid-dominant archetype must imply less compressor load at the same IT load',
  );
  ok(
    Math.abs(ai.heatToRejectMw - conv.heatToRejectMw) < 1e-6,
    'heat rejected is a function of IT load, not of rack density',
  );
  ok(ai.networkPortsPerRack > conv.networkPortsPerRack, 'a denser archetype must imply more fabric ports');
  ok(NETWORK_LAYERS.length >= 4, 'the network should be explained in layers');
  ok(
    NETWORK_LAYERS.some((l) => /east-west/i.test(l.name)),
    'the east-west fabric must be called out as its own layer',
  );
  ok(
    NETWORK_LAYERS.every((l) => l.limitingFactors.length > 0),
    'every network layer should say what limits it',
  );
}

/* -------------------------------------------------------------------- done */
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILURES`);
  process.exit(1);
}
console.log('OK');