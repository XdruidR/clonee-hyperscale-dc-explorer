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
  BUILDINGS,
  SITE,
  HALLS,
  RETROFIT_HALL,
  POWER_CHAIN,
  HEAT_CHAIN,
  FIBRE_CHAIN,
  COOLANT_CHAIN,
  instanceCount,
  RACKS_PER_HALL,
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
  buildingsReady,
  canStartStage,
  blockersForPackage,
  nextStageForPackage,
  componentCxStatus,
  packageDone,
  outstandingPackages,
} from '../src/state/store';
import { TURNOVER_PACKAGES, PACKAGE_BY_ID, packagesContaining } from '../src/data/turnover';
import { derived, INPUTS, ASSUMPTIONS, waterIntensitySentence, capacityReconciliationSentence } from '../src/data/calculations';
import { supplyFromSequenceStep, supplyState, SUPPLY_ASSUMPTIONS } from '../src/data/supply';
import { RACK_ARCHETYPES, chainFor, NETWORK_LAYERS } from '../src/data/archetypes';
import { toClaim, CLASSIFICATIONS } from '../src/data/types';
import { SCENARIOS, budgetAt, EARNED_VALUE, RISKS, CHANGES, MILESTONES, TOTAL_BUDGET_M } from '../src/data/controls';
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
ok(instanceCount() > 20000, `expected thousands of rendered instances, got ${instanceCount()}`);
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
/* The five data-storage buildings are single-storey bars. Their footprint is
   the published four halls plus the published plant area, so this is the one
   geometric check that can be made against a source. */
const bars = COMPONENTS.filter((c) => c.type === 'data-hall');
ok(bars.length === BUILDINGS.length, `expected ${BUILDINGS.length} data-storage bars, got ${bars.length}`);
for (const bar of bars) {
  const b = BUILDINGS.find((x) => x.n === bar.building)!;
  const area = bar.size[0] * bar.size[2];
  /* Four halls of 4,170 m2 plus about 11,000 m2 of plant. The modelled bar is
     280 m x 106 m, which is deliberately a little larger than the arithmetic
     because it includes circulation and the plant corridor. */
  const expected = b.halls.length * INPUTS.hallFloorM2 + INPUTS.plantAreaM2PerBuilding;
  ok(
    area > expected && area < expected * 1.35,
    `${b.name} bar footprint ${Math.round(area)} m2 should sit just above ${expected} m2 of published hall and plant area`,
  );
  ok(bar.size[1] < 20, `${b.name} should be a single-storey bar, got ${bar.size[1]} m tall`);
}
/* No two buildings may overlap. */
for (const bar of bars) {
  const overlaps = bars.filter((o) => o !== bar).filter(
    (o) => Math.abs(o.pos[0] - bar.pos[0]) * 2 < o.size[0] + bar.size[0] && Math.abs(o.pos[2] - bar.pos[2]) * 2 < o.size[2] + bar.size[2],
  );
  ok(overlaps.length === 0, `${bar.id} overlaps ${overlaps.map((o) => o.id).join(',')}`);
}
/* Every building must sit inside the consented site. */
for (const bar of bars) {
  ok(
    Math.abs(bar.pos[0]) + bar.size[0] / 2 <= SITE.halfW && Math.abs(bar.pos[2]) + bar.size[2] / 2 <= SITE.halfD,
    `${bar.id} extends outside the ${(SITE.halfW * 2 * SITE.halfD * 2 / 10_000).toFixed(1)} ha site`,
  );
}
ok(
  Math.abs((SITE.halfW * 2 * SITE.halfD * 2) / 10_000 - INPUTS.siteAreaHa) < 2,
  `the modelled site rectangle should be about the consented ${INPUTS.siteAreaHa} ha`,
);

/* Generation: 90 sets across five compounds, 18 each. */
const genBlocks = COMPONENTS.filter((c) => c.type === 'generator');
ok(genBlocks.length === BUILDINGS.length, `one generation compound per building expected, got ${genBlocks.length}`);
const genTotal = genBlocks.reduce((a, c) => a + (c.offsets?.length ?? 0), 0);
ok(genTotal === INPUTS.generatorCount, `${INPUTS.generatorCount} generators expected in the model, got ${genTotal}`);
ok(
  genBlocks.every((c) => (c.offsets?.length ?? 0) === INPUTS.generatorsPerBuilding),
  `every building should carry ${INPUTS.generatorsPerBuilding} generators`,
);
ok(genBlocks.every((c) => c.building), 'every generation compound should be attributed to a building');
/* A generator compound must clear its own building, which is the whole reason
   it sits behind the bar rather than between the halls. */
for (const g of genBlocks) {
  const bar = bars.find((b) => b.building === g.building)!;
  const gap = g.pos[2] - (bar.pos[2] + bar.size[2] / 2);
  const compoundHalfDepth = 24 + g.size[2] / 2;
  ok(gap < -compoundHalfDepth, `${g.id} overlaps its own building bar`);
}
const fuelBlocks = COMPONENTS.filter((c) => c.type === 'fuel-tank');
ok(
  fuelBlocks.length === genBlocks.length &&
    fuelBlocks.every((c, i) => (c.offsets?.length ?? 0) === (genBlocks[i].offsets?.length ?? 0)),
  'each generation compound should carry one fuel tank per set',
);
/* One rejector plume per building. */
const plumes = COMPONENTS.filter((c) => c.type === 'heat-plume');
ok(plumes.length === BUILDINGS.length, `one heat rejection plume per building expected, got ${plumes.length}`);

/* Building-level equipment sits inside the bar footprint on purpose: the plant
   corridor and the electrical rooms are part of the building, not beside it. The
   assertion that matters is that everything inside the envelope is genuinely at
   ground level and low enough to fit under a single-storey roof. */
for (const bar of bars) {
  const inside = COMPONENTS.filter(
    (c) =>
      c.id !== bar.id &&
      c.building === bar.building &&
      c.hall === undefined &&
      Math.abs(c.pos[0] - bar.pos[0]) * 2 < bar.size[0] + c.size[0] &&
      Math.abs(c.pos[2] - bar.pos[2]) * 2 < bar.size[2] + c.size[2] &&
      c.type !== 'building-plant' &&
      c.type !== 'hall-floor',
  );
  ok(inside.length > 0, `${bar.id} should contain building-level plant and electrical rooms`);
  const tooTall = inside.filter((c) => c.pos[1] + c.size[1] > bar.size[1]);
  ok(
    tooTall.length === 0,
    `${bar.id}: equipment inside the envelope must fit under the roof: ${tooTall.map((c) => c.id).join(', ')}`,
  );
  /* The generator compound and the heat rejection must be outside it. */
  const outside = COMPONENTS.filter((c) => c.building === bar.building && (c.type === 'generator' || c.type === 'air-cooler'));
  for (const o of outside) {
    const withinX = Math.abs(o.pos[0] - bar.pos[0]) * 2 < bar.size[0] + o.size[0];
    const withinZ = Math.abs(o.pos[2] - bar.pos[2]) * 2 < bar.size[2] + o.size[2];
    ok(!(withinX && withinZ), `${o.id} (${o.type}) must sit outside ${bar.id}`);
  }
}

/* Two new 220 kV transmission towers for the loop-in. */
const towers = COMPONENTS.filter((c) => c.type === 'hv-tower');
ok(towers.length === INPUTS.newTransmissionTowers, `the consent describes ${INPUTS.newTransmissionTowers} new transmission towers, got ${towers.length}`);
const bores = COMPONENTS.find((c) => c.id === 'site.bore')!;
ok(bores.offsets && bores.offsets.length >= 4, `a wellfield of several bores expected, got ${bores.offsets?.length}`);

/* The substation compound must hold the published equipment. */
ok(
  Math.abs((SITE.sub.w * SITE.sub.d - INPUTS.substationAreaM2) / INPUTS.substationAreaM2) < 0.08,
  `the modelled substation compound should be about the published ${INPUTS.substationAreaM2} m2`,
);
ok(
  COMPONENTS.filter((c) => c.id.startsWith('sub.tower')).length === INPUTS.newTransmissionTowers,
  'both new transmission towers must be modelled',
);
ok(
  COMPONENTS.find((c) => c.id === 'sub.xfmr')!.offsets?.length === INPUTS.stepDownTransformers,
  `three step-down transformers expected, got ${COMPONENTS.find((c) => c.id === 'sub.xfmr')!.offsets?.length}`,
);
for (const b of BUILDINGS) {
  ok(b.halls.length === 4, `${b.name} should contain four halls, got ${b.halls.length}`);
}
/* The published building names skip CLN4, and the model must preserve that
   rather than renumbering. */
ok(
  BUILDINGS.map((b) => b.name).join(',') === 'CLN1,CLN2,CLN3,CLN5,CLN6',
  `building names must be the published ones with the CLN4 gap preserved, got ${BUILDINGS.map((b) => b.name).join(',')}`,
);
ok(
  BUILDINGS.every((b) => b.itMW === INPUTS.itMwPerBuilding),
  'every building should carry the consented 36 MW capacity',
);
ok(
  BUILDINGS.filter((b) => b.gfaBasis === 'PUBLISHED').length >= 3,
  'at least three buildings should have a published floor area',
);

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
ok(powerReach.has('sub.xfmr'), 'power graph does not reach the GXP transformer from the transmission line');
ok(powerReach.has('CLN1.h1.server'), 'power graph does not reach the IT load from the transmission line');
ok(
  walk('CLN1.h1.server').has('CLN1.cool'),
  'cooling graph does not reach heat rejection from the IT load',
);
ok(
  walk('CLN1.h1.server').has('site.ambient'),
  'the cooling graph must terminate at the atmosphere',
);
ok(walk('site.basin').has('site.watercourse'), 'water graph does not reach the watercourse from the attenuation basin');
ok(walk('site.potable').has('site.ww'), 'water graph does not reach wastewater treatment from the potable system');
const dataReach = walk('site.fibre');
ok(dataReach.has('site.core'), 'data graph does not reach the campus core from the fibre route');
ok(dataReach.has('CLN1.h1.server'), 'data graph does not reach the IT load from the fibre route');

/* Every hall must be reachable and must be able to reject its heat. This is the
   check that catches a flow graph that works for the first building only. */
for (const h of HALLS) {
  const b = h.split('.')[0];
  ok(powerReach.has(`${h}.server`), `no power path to the IT load in ${h}`);
  ok(walk(`${h}.server`).has(`${h}.crah`), `no cooling path to the in-hall air cooling in ${h}`);
  ok(walk(`${h}.server`).has(`${b}.cool`), `no cooling path to heat rejection in ${h}`);
  /* The retrofit kit is modelled for every hall, because the AI mode may be
     pointed at any of them; it must have a complete loop when it exists. */
  ok(walk(`${h}.server`).has(`${h}.cold`), `no cooling path to the cold plates in ${h}`);
  ok(walk(`${h}.server`).has(`${h}.cdu`), `no cooling path to a coolant distribution unit in ${h}`);
  ok(dataReach.has(`${h}.switch`), `no data path to the fabric in ${h}`);
  ok(walk('site.bore').has(`${b}.cool`), `no groundwater make-up path to the cooling plant of ${b}`);
  /* Cooling must be a real path from the rack to atmosphere, not just a link
     to a component with no onward route. */
  ok(walk(`${h}.server`).has('site.ambient'), `no route from ${h} to ambient`);
}
for (const chain of [POWER_CHAIN, HEAT_CHAIN, COOLANT_CHAIN, FIBRE_CHAIN]) {
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
const itPkg = 'CLN1.h1.IT';
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
  const itStages = PACKAGE_BY_ID['CLN1.h1.IT'].stages;
  for (const st of itStages) cx['CLN1.h1.IT'] = [...(cx['CLN1.h1.IT'] ?? []), st];
  ok(
    blockersForPackage(cx, 'CLN1.h1.IT').length > 0,
    'signing off every IT stage must still be blocked by the upstream packages',
  );
  /* satisfy the whole upstream chain and it should clear */
  for (const id of ['SUB', 'CLN1.h2.PWR', 'CLN1.GEN', 'CLN1.COOL', 'SITE.NET', 'CLN1.h1.PWR', 'CLN1.h1.NET', 'CLN1.h1.COOL']) {
    cx[id] = [...PACKAGE_BY_ID[id].stages];
  }
  ok(
    blockersForPackage(cx, 'CLN1.h1.IT').length === 0,
    `IT package should be unblocked once every upstream package is signed off, got: ${blockersForPackage(cx, 'CLN1.h1.IT').map((b) => b.message).join(' | ')}`,
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

  ok(componentCxStatus(cx, 'CLN1.h1.rack').status === 'not-started', 'a rack should be not-started initially');
  ok(componentCxStatus(cx, 'CLN1.upsA').status === 'not-started', 'a UPS should be not-started initially');

  /* Sign off the UPS's own building-level electrical package only. It still
     cannot be accepted, because that package depends on the building MV
     switchgear and the generation block, neither of which is signed off. This
     is the whole point of computing status over the upstream closure rather
     than over the component's own package. */
  cx['CLN1.ELEC'] = [...PACKAGE_BY_ID['CLN1.ELEC'].stages];
  ok(
    componentCxStatus(cx, 'CLN1.upsA').status === 'in-progress',
    'a UPS whose own package is signed off but whose upstream packages are not must be in-progress, not complete',
  );
  ok(
    componentCxStatus(cx, 'CLN1.upsA').blocking.length > 0,
    'the UPS must report its unsigned upstream packages as blockers',
  );
  ok(
    componentCxStatus(cx, 'CLN1.h1.rack').status !== 'complete',
    'a rack must NOT complete when only its power package is signed off',
  );
  ok(
    componentCxStatus(cx, 'CLN1.h1.rack').packages.length > 1,
    'a rack status must span its own package plus the packages it depends on',
  );

  completeClosure('CLN1.h1.IT');
  ok(
    componentCxStatus(cx, 'CLN1.h1.rack').status === 'complete',
    `completing the IT package and its full upstream closure should complete the rack, got ${componentCxStatus(cx, 'CLN1.h1.rack').status}`,
  );
  ok(
    componentCxStatus(cx, 'CLN1.h1.server').status === 'complete',
    'an accelerator in the same package should complete with it',
  );
  ok(
    componentCxStatus(cx, 'CLN1.h2.rack').status !== 'complete',
    'completing hall 1 must not complete hall 2 - turnover packages are hall-scoped',
  );
  ok(
    componentCxStatus(cx, 'CLN1.h2.gpu').status !== 'complete',
    'completing hall 1 must not complete hall 2 accelerators',
  );
  ok(outstandingPackages(cx).length > 0, 'the site as a whole is still not fully commissioned');
}
ok(packagesContaining('CLN1.h1.rack').length === 1, 'a rack should sit in exactly one turnover package');
ok(packagesContaining('CLN1.mv').length === 1, 'an MV lineup should sit in exactly one turnover package');
ok(packagesContaining('CLN1.upsA').length === 1, 'a UPS should sit in exactly one turnover package');

/* --------------------------------------------------------- construction time */
section('construction programme');
ok(PHASES.length >= 20, `expected a substantial phase sequence, got ${PHASES.length}`);
ok(PHASES[0].id === 'baseline', 'the first phase should be the greenfield site');
ok(
  PHASES.some((p) => p.id === 'grid-energised'),
  'the programme must contain the 220 kV energisation, which is the hinge of the real delivery',
);
ok(
  PHASES[PHASES.length - 1].id === 'horizon',
  'the last phase should be the statement of what the record does not say',
);
/* The real dates are the point of this sequence, so they must survive. */
const gridPhase = PHASES.find((p) => p.id === 'grid-energised')!;
ok(gridPhase.period.includes('2017'), `the grid energisation should be dated 2017, got "${gridPhase.period}"`);
ok(
  PHASES.some((p) => p.period.includes('2015')),
  'the consent year must appear in the programme',
);
ok(
  PHASES.filter((p) => !p.inferred && p.months > 0).length >= 8,
  'the programme must be anchored to at least eight dated published events',
);
/* Inferred phases must be marked rather than hidden. */
ok(
  PHASES.some((p) => p.inferred) && PHASES.some((p) => !p.inferred),
  'the programme should distinguish dated phases from inferred ones',
);

const fullBuild = buildStateOf(COMPONENT_BY_ID['CLN1.h1.rack'], PHASES.length - 1);
ok(fullBuild.state === 'complete', 'a rack should exist at the end of the programme');
ok(buildStateOf(COMPONENT_BY_ID['CLN1.h1.rack'], 0).state === 'hidden', 'a rack should not exist at phase 0');
ok(buildStateOf(COMPONENT_BY_ID['hv.line'], 0).state === 'complete', 'the transmission line exists at phase 0');
const shedAtEnd = buildStateOf(COMPONENT_BY_ID['tmp.sheds'], PHASES.length - 1);
ok(shedAtEnd.state === 'hidden', 'temporary site sheds should be gone by handover');

/* Phased delivery, using the real building windows rather than a lag table. */
{
  const cln1Fitout = BUILDINGS[0].fitout[1];
  const cln6Fitout = BUILDINGS.find((b) => b.name === 'CLN6')!.fitout[1];
  ok(
    buildStateOf(COMPONENT_BY_ID['CLN1.h1.rack'], cln1Fitout).state === 'complete',
    'CLN1 racks must be installed by the end of the CLN1 fit-out',
  );
  ok(
    buildStateOf(COMPONENT_BY_ID['CLN6.h1.rack'], cln1Fitout).state !== 'complete',
    'CLN6 racks must not be installed while CLN1 is still being fitted out - phased delivery',
  );
  ok(cln6Fitout > cln1Fitout, 'CLN6 must be delivered after CLN1');
  ok(
    buildStateOf(COMPONENT_BY_ID['CLN6.h1.rack'], cln6Fitout).state === 'complete',
    'CLN6 racks must be complete by the end of the CLN6 fit-out',
  );
}
/* there must be exactly one module-lag model in the source tree */
{
  /* There must be exactly one construction timeline, and it must be the per
     component build window in campus.ts. The predecessor carried a second
     hidden model in a MODULE_SHIFT table that shifted every component's dates;
     Clonee's buildings have genuinely different schedules, so the lag was
     removed and the information moved onto the components. These assertions
     exist to stop it creeping back in. */
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f.name)) {
        const src = readFileSync(p, 'utf8');
        if (/MODULE_SHIFT/.test(src)) offenders.push(`${p}: MODULE_SHIFT timeline is gone; use build windows`);
        if (/laggedPhase/.test(src)) offenders.push(`${p}: laggedPhase timeline is gone; use build windows`);
        if (/modulePhaseOffset/.test(src)) offenders.push(`${p}: module lag table is gone; use build windows`);
      }
    }
  };
  walk('src');
  ok(offenders.length === 0, `a second construction-timeline model crept back in: ${offenders.join('; ')}`);
}

/* Every component must carry its own build window, and it must be inside the
   phase list. This is what makes the timeline single-sourced. */
for (const c of COMPONENTS) {
  ok(c.build.length === 2 && c.build[0] <= c.build[1], `${c.id} has an invalid build window ${c.build}`);
  ok(
    c.build[0] >= 0 && c.build[1] < PHASES.length,
    `${c.id} build window ${c.build} falls outside the ${PHASES.length}-phase programme`,
  );
}

/* building readiness must be monotonic and end with every building handed over */
{
  const start = buildingsReady(0, COMPONENTS);
  const end = buildingsReady(PHASES.length - 1, COMPONENTS);
  ok(start.every((r) => !r.live), 'no building should be live at phase 0');
  ok(end.every((r) => r.live && r.handedOver), 'all five buildings should be handed over at the end');
  ok(start.every((r) => r.componentsComplete === 0), 'nothing should be complete at phase 0');
  ok(
    end.every((r) => r.componentsComplete === r.componentsTotal),
    'every building component should be complete at handover',
  );
  /* Phased delivery: CLN1 is live long before CLN6, which is the whole point of
     a campus delivered in tranches rather than all at once. */
  const atCln1Handover = buildingsReady(BUILDINGS[0].handover, COMPONENTS);
  ok(
    atCln1Handover[0].live && !atCln1Handover[4].live,
    'CLN1 should be live before CLN6 - phased delivery',
  );
  /* Readiness must not go backwards as the programme advances. Compared per
     component id, because comparing per-building totals would hide a component
     disappearing while its siblings accumulate. */
  {
    const regressions: string[] = [];
    const prev = new Set<string>();
    for (let p = 0; p < PHASES.length; p++) {
      const now = new Set(
        COMPONENTS.filter((c) => c.building !== undefined && buildStateOf(c, p).state === 'complete').map((c) => c.id),
      );
      for (const id of prev) if (!now.has(id)) regressions.push(`${id} at phase ${p}`);
      prev.clear();
      for (const id of now) prev.add(id);
    }
    ok(regressions.length === 0, `component completion must be monotonic; regressions: ${regressions.slice(0, 5).join(', ')}`);
  }
  ok(
    buildingsReady(PHASES.length - 1, COMPONENTS).reduce((a, r) => a + r.itMW, 0) === INPUTS.buildingCount * INPUTS.itMwPerBuilding,
    'the live IT load at handover must equal the consented campus capacity',
  );
}

/* the whole campus must actually finish inside the programme */
for (const id of [
  'CLN1.h1.rack',
  'CLN1.h2.rack',
  'CLN3.h4.rack',
  'CLN5.h1.rack',
  'CLN6.h4.server',
  'CLN6.cool',
  'sub.xfmr',
  'CLN3.gen',
  'site.wtp',
]) {
  ok(
    buildStateOf(COMPONENT_BY_ID[id], PHASES.length - 1).state === 'complete',
    `${id} is still incomplete at handover - a lagged module ran off the end of the programme`,
  );
}

/* ---------------------------------------------------------------- journeys */
section('journeys');
ok(JOURNEYS.length >= 8, `expected at least 8 guided journeys, got ${JOURNEYS.length}`);
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
/* Campus capacity, from the consent. */
ok(INPUTS.buildingCount * INPUTS.itMwPerBuilding === 180, 'five buildings at 36 MW is 180 MW IT');
ok(derived.itCapacityMW === 180, `derived campus IT should be 180 MW, got ${derived.itCapacityMW}`);
/* The two independent public routes must nearly agree, or the reconciliation
   narrative in the UI is making a claim the arithmetic does not support. */
ok(
  derived.capacityRoutesDifferPct < 10,
  `the two public capacity routes should agree to within 10%, they differ by ${derived.capacityRoutesDifferPct.toFixed(1)}%`,
);
ok(
  derived.hallPowerDensityFromConsentKwM2 > 2 && derived.hallPowerDensityFromConsentKwM2 < 2.5,
  `36 MW over four 4,170 m2 halls should land near the published 2.24 kW/m2, got ${derived.hallPowerDensityFromConsentKwM2}`,
);

/* Generation: 90 sets is published, the split and rating are derived. */
ok(INPUTS.generatorCount === 90, 'EPA P1192 records 90 diesel generators');
ok(
  derived.generatorRatedMW > derived.itCapacityMW,
  'generation must exceed the IT load, or the emergency power system has no margin',
);
ok(
  derived.generationVsIt > 1.1 && derived.generationVsIt < 1.4,
  `generation should sit around 1.25x IT load, got ${derived.generationVsIt.toFixed(2)}x`,
);

/* The N-1 transformer case is the resilience narrative; it only works if there
   is a real shortfall, which is why the model must not quietly size the
   transformers so that N-1 is free. */
ok(
  derived.nMinusOneMva > 0 && derived.nMinusOneShortfallMW > 0,
  'losing one of three transformers must leave a real capacity shortfall, or the N-1 teaching point is false',
);
ok(
  derived.nMinusOneShortfallMW > 20 && derived.nMinusOneShortfallMW < 90,
  `the N-1 shortfall should be about one building, got ${derived.nMinusOneShortfallMW.toFixed(0)} MW`,
);

/* Water: Irish climate, so a small evaporative fraction and a low intensity. */
ok(
  derived.wueLPerKwh > 0.02 && derived.wueLPerKwh < 0.5,
  `derived WUE should be low for an Irish air-cooled campus, got ${derived.wueLPerKwh.toFixed(3)} L/kWh`,
);
ok(
  derived.dischargeM3Yr > 100_000 && derived.dischargeM3Yr < 600_000,
  `derived annual site water should be in the low hundreds of thousands of m3, got ${derived.dischargeM3Yr.toFixed(0)}`,
);

/* The AI finding: the retrofit is power-constrained, not space-constrained. */
ok(
  derived.geometricUtilisationPct < 25,
  `the supply should fund a small fraction of the physical rack positions, got ${derived.geometricUtilisationPct.toFixed(1)}%`,
);
ok(
  derived.aiRackAmpsEdbp > derived.deliveredRackAmps * 5,
  'an AI rack at the design point must draw several times the delivered per-rack current',
);
ok(
  derived.densityJump > 5,
  `the rack density jump should be about an order of magnitude, got ${derived.densityJump.toFixed(1)}x`,
);

/* Roof area available for water capture. */
const roofArea = BUILDINGS.length * SITE.buildingWidth * SITE.buildingDepth;
ok(roofArea > 100_000, `modelled building roof area ${roofArea} m2 should exceed the published 97,000 m2 total area`);

/* ================================================================== SEMANTIC
 * Tests from the review's section 10: these check the meaning of the model,
 * not just that identifiers resolve.
 * ====================================================================== */

section('semantic: canonical calculations drive every displayed quantity');

/* The canonical figures, recomputed independently from the assumptions rather
   than read back out of `derived`, so a change to the derivation cannot pass by
   agreeing with itself. */
{
  const A = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a.value])) as Record<string, number>;
  const hours = derived.hoursPerYear;
  const itMw = derived.itCapacityMW;

  /* Water. IT heat is all the electrical input, so the same litres per kWh is
     both the water per kWh of IT and the water per kWh of heat rejected. */
  const heatGjPerYear = itMw * 1000 * hours * 0.0036;
  const expectedEvaporation = (heatGjPerYear * A.evaporativeFraction) / A.evaporationEnthalpy;
  const expectedDischarge = expectedEvaporation * A.blowdownFactor;
  const expectedLPerKWh = (expectedDischarge * 1000) / (itMw * 1000 * hours);
  ok(
    Math.abs(derived.dischargeM3Yr - expectedDischarge) < 1,
    `derived site water drifted: ${derived.dischargeM3Yr.toFixed(0)} vs ${expectedDischarge.toFixed(0)} m3/yr`,
  );
  ok(
    Math.abs(derived.wueLPerKwh - expectedLPerKWh) < 1e-9,
    `canonical water intensity drifted: ${derived.wueLPerKwh} vs ${expectedLPerKWh}`,
  );
  /* m3/MWh and L/kWh are the same quantity expressed differently. */
  ok(
    Math.abs(derived.wueM3PerMwh - derived.wueLPerKwh) < 1e-9,
    'm3/MWh and L/kWh are the same quantity and must agree',
  );
  /* Discharge exceeds evaporation, because blowdown carries the concentrated
     solids that evaporation leaves behind. The ratio is the blowdown factor. */
  ok(
    derived.dischargeM3Yr > derived.evaporationM3Yr && derived.blowdownM3Yr > 0,
    'discharge must exceed evaporation: blowdown carries the concentrated solids',
  );
  ok(
    Math.abs(derived.dischargeM3Yr / derived.evaporationM3Yr - A.blowdownFactor) < 1e-9,
    'discharge must be evaporation scaled by the blowdown factor',
  );

  /* Generation. */
  const expectedGenMw = (INPUTS.generatorCount * A.generatorRatedKw) / 1000;
  ok(
    Math.abs(derived.generatorRatedMW - expectedGenMw) < 1e-9,
    `generation rated MW drifted: ${derived.generatorRatedMW} vs ${expectedGenMw}`,
  );
  const expectedGenHeat = (INPUTS.generatorCount * A.generatorHeatReleaseKw) / 1000;
  ok(
    Math.abs(derived.generationHeatMW - expectedGenHeat) < 1e-9,
    `generator heat MW drifted: ${derived.generationHeatMW} vs ${expectedGenHeat}`,
  );
  /* Engines reject more heat than they convert. This is why a campus with no IT
     load still needs heat rejection. */
  ok(
    A.generatorHeatReleaseKw > A.generatorRatedKw,
    'each generator must reject more heat than it makes electricity',
  );

  /* The canonical sentence must carry the figure, or the panels can drift. */
  ok(
    waterIntensitySentence().includes(derived.wueLPerKwh.toFixed(2)),
    `the canonical water sentence must contain the canonical figure ${derived.wueLPerKwh.toFixed(2)}`,
  );
  ok(
    capacityReconciliationSentence().includes('180'),
    'the capacity reconciliation must state the derived campus capacity',
  );
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
  /* Generation is per building on this campus, so the source is one compound
     and the check is that it can reach every hall in its own building. */
  for (const b of BUILDINGS) {
    const reach = fromGen(`${b.name}.gen`);
    ok(reach.has(`${b.name}.mv`), `generation in ${b.name} has no path to the building MV / emergency bus`);
    for (const h of b.halls) {
      ok(
        reach.has(`${h}.server`),
        `generation in ${b.name} has no electrical path to the IT load in ${h}`,
      );
    }
    /* The substation transformer is fed BY the grid, not by the generators:
       they are alternative sources into the same bus, not a chain. This is the
       assertion that stops a supply model treating generation as downstream of
       the grid connection. */
    ok(
      !reach.has('sub.transformer'),
      `generation in ${b.name} must not reach the step-down transformer: grid and generation are alternate sources`,
    );
    ok(
      !reach.has('hv.line'),
      `generation in ${b.name} must not reach the transmission line`,
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
  for (const b of BUILDINGS) {
    const feeders = FLOW_LINKS.filter((lk) => lk.medium === 'mv' && lk.to === `${b.name}.mv`).map((lk) => lk.from);
    ok(feeders.some((f) => f.includes('xfmr')), `${b.name}.mv has no utility source`);
    ok(feeders.some((f) => f.includes('gensw')), `${b.name}.mv has no generation source`);
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
    !!COMPONENT_BY_ID['site.ambient'] && !!COMPONENT_BY_ID['CLN1.genheat'],
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

  const fullAutonomy = (SUPPLY_ASSUMPTIONS.batteryKwh * 60) / derived.itCapacityMW;
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
  completeClosure('CLN1.h1.IT');
  ok(componentCxStatus(cx, 'CLN1.h1.rack').status === 'complete', 'full closure should complete the rack');
  /* now delete the cooling package and it must stop being complete */
  delete cx['CLN1.h1.COOL'];
  ok(
    componentCxStatus(cx, 'CLN1.h1.rack').status !== 'complete',
    'removing the cooling package must stop the rack being commissioned',
  );
  ok(
    componentCxStatus(cx, 'CLN1.h1.rack').blocking.some((b) => /cooling distribution/i.test(b.message)),
    'the blocker must name the cooling package',
  );
  delete cx['CLN1.h1.PWR'];
  ok(
    componentCxStatus(cx, 'CLN1.h1.rack').blocking.some((b) => /power distribution|electrical rooms/i.test(b.message)),
    'the blocker must name the building electrical package',
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
  const hallCount = INPUTS.buildingCount * INPUTS.hallsPerBuilding;
  for (const a of RACK_ARCHETYPES) {
    const c = chainFor(a.id);
    ok(c.racksTotal > 0, `archetype ${a.id} produced no racks`);
    ok(
      c.racksPerHall * hallCount >= c.racksTotal,
      `archetype ${a.id}: racks per hall must cover the campus total across ${hallCount} halls`,
    );
    ok(
      Math.abs(c.heatToRejectMw - derived.itCapacityMW) < 1e-6,
      `archetype ${a.id}: heat rejected must equal the IT load`,
    );
    /* Heat splits between liquid and air, and the split must add up. This is the
       90/10 split that means in-hall air cooling cannot be removed in a retrofit. */
    ok(
      Math.abs(c.heatToLiquidMw + c.heatToAirMw - c.heatToRejectMw) < 1e-6,
      `archetype ${a.id}: liquid and air heat must sum to the total rejected`,
    );
    ok(c.buswayCurrentPerRackA > 0, `archetype ${a.id}: busway current must be positive`);
    ok(
      c.buswayCurrentPerRackEdbpA >= c.buswayCurrentPerRackA,
      `archetype ${a.id}: busway must be provisioned to the worst case, not the operating case`,
    );
    ok(
      c.coolingWaterM3Yr >= 0 && Number.isFinite(c.coolingWaterM3Yr),
      `archetype ${a.id}: water figure must be a finite non-negative number, got ${c.coolingWaterM3Yr}`,
    );
    /* Only a liquid-dominant design uses site water at all. */
    if (c.coolingToLiquidShare === 0) {
      ok(c.coolingWaterM3Yr === 0, `archetype ${a.id} is air-only, so it should use no cooling water`);
      ok(c.coolantFlowLPerMinPerRack === 0, `archetype ${a.id} is air-only, so it needs no coolant flow`);
    } else {
      ok(c.coolantFlowLPerMinPerRack > 0, `archetype ${a.id} is liquid-cooled and needs a coolant flow`);
    }
    ok(a.limitingFactors.length > 0, `archetype ${a.id} should say what limits it`);
    /* The delivered design is derived from Clonee's own published figures, so it
       is DERIVED; the two comparators are published industry practice. */
    ok(
      a.classification === 'DERIVED' || a.classification === 'TYPICAL',
      `archetype ${a.id} classification must be DERIVED or TYPICAL, not fact`,
    );
    ok(
      a.id === 'clonee-delivered' ? a.classification === 'DERIVED' : a.classification === 'TYPICAL',
      `archetype ${a.id} has the wrong classification for its relationship to Clonee`,
    );
  }
  /* The archetype the campus actually has must reproduce the modelled campus:
     720 racks per hall at about 12.5 kW. If this drifts, the 3D model and the
     archetype panel have stopped agreeing. */
  {
    const delivered = chainFor('clonee-delivered');
    ok(
      Math.abs(delivered.rackDensityKw - INPUTS.deliveredRackKw) < 3,
      `the delivered archetype should sit near ${INPUTS.deliveredRackKw} kW per rack, got ${delivered.rackDensityKw}`,
    );
    ok(
      Math.abs((INPUTS.itMwPerBuilding / INPUTS.hallsPerBuilding) * 1000 / RACKS_PER_HALL - INPUTS.deliveredRackKw) /
        INPUTS.deliveredRackKw < 0.06,
      'the modelled 3D rack density and the delivered archetype must agree',
    );
    ok(delivered.coolingToLiquidShare === 0, 'the delivered campus is air-cooled and has no liquid share');
  }
  /* Denser racks must mean fewer racks for the same IT load, more heat to air at
     intermediate densities, and more fabric ports. */
  const conv = chainFor('clonee-delivered');
  const modern = chainFor('modern-air');
  const ai = chainFor('ai-liquid');
  ok(ai.racksTotal < modern.racksTotal && modern.racksTotal < conv.racksTotal, 'denser archetypes must need fewer racks');
  ok(ai.coolingToLiquidShare > modern.coolingToLiquidShare, 'the AI archetype must capture more heat in liquid');
  ok(
    Math.abs(ai.heatToRejectMw - conv.heatToRejectMw) < 1e-6,
    'heat rejected is a function of IT load, not of rack density',
  );
  ok(ai.networkPortsPerRack > modern.networkPortsPerRack, 'a denser archetype must imply more fabric ports');
  /* The headline finding: the supply funds a small fraction of the physical
     rack positions. This is the whole point of the AI panel. */
  ok(
    ai.rackPositionUtilisationPct < conv.rackPositionUtilisationPct,
    'the denser AI design must fund a smaller share of the physical rack positions',
  );
  ok(
    ai.rackPositionUtilisationPct < 25,
    `the AI retrofit should fund under a quarter of the rack positions, got ${ai.rackPositionUtilisationPct.toFixed(1)}%`,
  );
  ok(NETWORK_LAYERS.length >= 4, 'the network should be explained in layers');
  ok(
    NETWORK_LAYERS.some((l) => /top-of-rack|hall fabric/i.test(l.name)),
    'the rack-level fabric must be called out as its own layer',
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