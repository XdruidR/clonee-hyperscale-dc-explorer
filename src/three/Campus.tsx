import { useMemo } from 'react';
import * as THREE from 'three';
import { COMPONENTS, type CampusComponent } from '../data/campus';
import { JOURNEYS } from '../data/journeys';
import { COMPONENT_INFO } from '../data/componentInfo';
import { PACKAGE_COLOR, SYSTEM_META } from '../data/types';
import { buildStateOf, useStore, SYSTEM_FOR_MODE, type Mode } from '../state/store';
import { Shape } from './builders';
import { Label } from './Labels';

const LIFT: Record<string, number> = {
  power: 16,
  cooling: 30,
  water: -10,
  data: 7,
  site: 5,
  security: 3,
  fire: 9,
};

/** Component ids that belong to one representative electrical train (hall 1, module 1). */
const POWER_TRAIN = new Set([
  'hv.line',
  'gxp.bay',
  'gxp.xfmr',
  'gxp.ctrl',
  'M1.mv',
  'M1-W.gen',
  'M1-W.sub',
  'M1-W.upsA',
  'M1-W.upsB',
  'M1-W.batt',
  'M1-W.lv',
  'M1-W.bus',
  'M1-W.pdu',
  'M1-W.rack',
  'M1-W.gpu',
]);

const COOLING_TRAIN = new Set([
  'M1-W.gpu',
  'M1-W.cold',
  'M1-W.cdu',
  'M1-W.crah',
  'M1.hx',
  'M1.cool',
  'M1.pump',
  'M1-W.res',
  'site.wtp',
]);

/**
 * Label budget. Too many labels is worse than none, so only the highest value
 * labels are drawn, and in a system mode only that system's labels survive.
 */
const LABEL_PRIORITY: Record<string, number> = {
  'data-hall': 10,
  generator: 9,
  'gxp-transformer': 8,
  'gxp-platform': 8,
  'adiabatic-cooler': 7,
  'hv-line': 7,
  'stormwater-basin': 6,
  wetland: 6,
  bore: 6,
  'water-treatment': 6,
  'landing-station': 6,
  'fibre-route': 6,
  'network-core': 5,
  admin: 5,
  fire: 5,
  gatehouse: 5,
  road: 4,
  ups: 4,
  rack: 4,
  'module-plant': 3,
  'gxp-bay': 3,
};

function labelSetFor(mode: Mode, limit: number): Set<string> {
  const system = SYSTEM_FOR_MODE[mode];
  const pool = COMPONENTS.filter(
    (c) =>
      c.label3d &&
      (LABEL_PRIORITY[c.type] ?? 1) >= 4 &&
      (!system || c.system === system || c.system === 'site'),
  );
  pool.sort((a, b) => (LABEL_PRIORITY[b.type] ?? 1) - (LABEL_PRIORITY[a.type] ?? 1));
  return new Set(pool.slice(0, limit).map((c) => c.id));
}

function baseColour(c: CampusComponent, colourBy: 'system' | 'package') {
  if (colourBy === 'package') {
    const info = COMPONENT_INFO[c.type];
    return info ? PACKAGE_COLOR[info.delivery.package] : SYSTEM_META[c.system].color;
  }
  return SYSTEM_META[c.system].color;
}

function Node({ c, showLabel }: { c: CampusComponent; showLabel: boolean }) {
  const mode = useStore((s) => s.mode);
  const constructPhase = useStore((s) => s.constructPhase);
  const faults = useStore((s) => s.faults);
  const colourBy = useStore((s) => s.colourBy);
  const roofOff = useStore((s) => s.roofOff);
  const cutaway = useStore((s) => s.cutaway);
  const explode = useStore((s) => s.explode);
  const isolateHall = useStore((s) => s.isolateHall);
  const isolateTrain = useStore((s) => s.isolateTrain);
  const selected = useStore((s) => s.selected);
  const journey = useStore((s) => s.journey);
  const cxDone = useStore((s) => s.cxDone);
  const select = useStore((s) => s.select);
  const hover = useStore((s) => s.hover);

  const build = useMemo(() => buildStateOf(c, constructPhase), [c, constructPhase]);
  if (build.state === 'hidden') return null;

  const failed = faults.includes(c.type);
  let dim = 1;

  const modeSystem = SYSTEM_FOR_MODE[mode];
  if (modeSystem && c.system !== modeSystem && c.system !== 'site') dim = 0.22;

  if (isolateTrain === 'power') dim = POWER_TRAIN.has(c.id) ? 1 : 0.1;
  if (isolateTrain === 'cooling') dim = COOLING_TRAIN.has(c.id) ? 1 : 0.1;

  if (isolateHall !== null && c.hall !== undefined) dim = Math.min(dim, c.hall === isolateHall ? 1 : 0.08);
  if (isolateHall !== null && c.hall === undefined && c.module !== undefined) dim = Math.min(dim, c.module === Math.ceil(isolateHall / 2) ? 0.6 : 0.15);

  if (journey) {
    // dim everything not in the step focus set
    const step = journeyFocus(journey.id, journey.step);
    if (step && !step.includes(c.id)) dim = Math.min(dim, 0.12);
  }

  let colour = baseColour(c, colourBy);
  let emissive: string | undefined;

  if (mode === 'construction' && build.state === 'building') {
    colour = '#f2b13c';
    emissive = '#5c3a00';
  }
  if (failed) {
    colour = '#ff3b30';
    emissive = '#ff3b30';
  }
  if (mode === 'commissioning') {
    const info = COMPONENT_INFO[c.type];
    const stages = info?.cxStages ?? [];
    if (stages.length) {
      const complete = stages.every((s) => cxDone.includes(s));
      colour = complete ? '#41d98a' : '#f2b13c';
      emissive = complete ? '#0d3b23' : '#4a3200';
      dim = Math.min(1, complete ? 1 : 0.75);
    }
  }

  const lift = explode * (LIFT[c.system] ?? 5) * (c.ground ? 0.35 : 1);
  const isSelected = selected === c.id;

  return (
    <group
      position={[c.pos[0], c.pos[1] + lift, c.pos[2]]}
      rotation={[0, c.rot, 0]}
      userData={{ id: c.id }}
    >
      <Shape
        c={c}
        color={colour}
        opacity={dim < 1 ? 0.16 + dim * 0.84 : 1}
        emissive={emissive}
        roofOff={roofOff}
        cutaway={cutaway}
        highlight={isSelected}
        onClick={(e: any) => {
          e.stopPropagation();
          select(c.id);
        }}
        onOver={(e: any) => {
          e.stopPropagation();
          hover(c.id);
        }}
        onOut={() => hover(null)}
      />
      {showLabel && <Label c={c} dim={dim} y={c.size[1] + 4 + lift} />}
      {isSelected && <SelectionRing c={c} />}
    </group>
  );
}

function SelectionRing({ c }: { c: CampusComponent }) {
  // for instanced equipment, ring the actual extent of the instances
  const ext = c.offsets?.reduce(
    (a, [x, z]) => Math.max(a, Math.abs(x) + c.size[0] / 2, Math.abs(z) + c.size[2] / 2),
    0,
  );
  const r = (ext && ext > 0 ? ext : Math.max(c.size[0], c.size[2]) * 0.75) + 4;
  return (
    <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r, r + 1.4, 48]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

function journeyFocus(journeyId: string, stepIndex: number): string[] | null {
  const j = JOURNEYS.find((x) => x.id === journeyId);
  if (!j) return null;
  return j.steps[Math.min(stepIndex, j.steps.length - 1)]?.focus ?? null;
}

export function Campus() {
  const mode = useStore((s) => s.mode);
  const labelSet = useMemo(() => labelSetFor(mode, 20), [mode]);
  return (
    <group>
      {COMPONENTS.map((c) => (
        <Node key={c.id} c={c} showLabel={labelSet.has(c.id)} />
      ))}
    </group>
  );
}