import { useMemo } from 'react';
import * as THREE from 'three';
import { COMPONENTS, type CampusComponent } from '../data/campus';
import { JOURNEYS } from '../data/journeys';
import { COMPONENT_INFO } from '../data/componentInfo';
import { PACKAGE_COLOR, SYSTEM_META } from '../data/types';
import { buildStateOf, componentCxStatus, useStore, SYSTEM_FOR_MODE, type Mode } from '../state/store';
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

/**
 * Representative trains, for the isolate-train controls.
 *
 * Built from the campus model rather than hand-listed, so they cannot drift out
 * of step when the geometry changes. The power train is one building's supply
 * chain from the transmission loop-in to the racks; the cooling train is one
 * building's heat path from the racks out to ambient.
 */
function buildTrain(b: string, kinds: string[]): Set<string> {
  const out = new Set<string>();
  if (kinds.includes('power')) {
    out.add('hv.line');
    out.add('sub.platform');
    out.add('sub.bay');
    out.add('sub.transformer');
    out.add('sub.control');
    out.add('sub.mv-building');
  }
  for (const id of COMPONENTS) {
    const { type, id: cid, hall } = id;
    if (cid === `sub.transformer` || cid === 'sub.bay') continue;
    if (!cid.startsWith(b)) continue;
    const powerish = ['mv-switchgear', 'generator', 'generator-switchgear', 'fuel-tank', 'unit-substation', 'ups', 'battery', 'lv-switchboard', 'busway', 'pdu', 'rack', 'server'];
    const coolish = ['crah', 'cold-plate', 'cdu', 'heat-exchanger', 'air-cooler', 'pump', 'reservoir', 'water-treatment'];
    if (kinds.includes('power') && powerish.includes(type)) out.add(cid);
    if (kinds.includes('cooling') && coolish.includes(type)) out.add(cid);
    void hall;
  }
  return out;
}

const POWER_TRAIN = buildTrain('CLN1.', ['power']);
const COOLING_TRAIN = buildTrain('CLN1.', ['cooling']);

/**
 * Label budget. Too many labels is worse than none, so only the highest value
 * labels are drawn, and in a system mode only that system's labels survive.
 */
const LABEL_PRIORITY: Record<string, number> = {
  'data-hall': 10,
  'sub-transformer': 9,
  'sub-platform': 8,
  generator: 8,
  'air-cooler': 7,
  'hv-line': 7,
  'stormwater-basin': 6,
  watercourse: 6,
  bore: 6,
  'water-treatment': 6,
  'fibre-hub': 6,
  'fibre-route': 6,
  'network-core': 5,
  admin: 5,
  fire: 5,
  gatehouse: 5,
  road: 4,
  ups: 4,
  rack: 4,
  'building-plant': 3,
  'sub-bay': 3,
  'heat-plume': 3,
  cdu: 3,
};

function labelSetFor(mode: Mode, limit: number): Set<string> {
  const system = SYSTEM_FOR_MODE[mode];
  const pool = COMPONENTS.filter(
    (c) =>
      c.label3d &&
      (LABEL_PRIORITY[c.type] ?? 1) >= 4 &&
      /* The retrofit components only earn a label while the retrofit is on. */
      (!c.retrofit || mode === 'ai') &&
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
  const isolateBuilding = useStore((s) => s.isolateBuilding);
  const isolateTrain = useStore((s) => s.isolateTrain);
  const selected = useStore((s) => s.selected);
  const journey = useStore((s) => s.journey);
  const cxState = useStore((s) => s.cx);
  const aiRetrofit = useStore((s) => s.aiRetrofit);
  const select = useStore((s) => s.select);
  const hover = useStore((s) => s.hover);

  const build = useMemo(() => buildStateOf(c, constructPhase), [c, constructPhase]);

  /**
   * The retrofit kit exists in the model at all times, because it is part of
   * the Clonee campus of the future. It is only *present* when the AI mode is
   * on, so the default view never shows cold plates that a real hall does not
   * have. The delivered hall's air-cooled equipment stays visible underneath,
   * which is the comparison the mode is for.
   */
  const absent = (c.retrofit && !aiRetrofit) || build.state === 'hidden';
  if (absent) return null;

  const failed = faults.includes(c.type);
  let dim = 1;

  const modeSystem = SYSTEM_FOR_MODE[mode];
  if (modeSystem && c.system !== modeSystem && c.system !== 'site') dim = 0.22;

  if (isolateTrain === 'power') dim = POWER_TRAIN.has(c.id) ? 1 : 0.1;
  if (isolateTrain === 'cooling') dim = COOLING_TRAIN.has(c.id) ? 1 : 0.1;

  /* Isolation is by building, because a building is the unit the campus is
     actually delivered and operated in. A hall is the unit inside it. */
  if (isolateBuilding !== null) {
    const sameBuilding = c.building === isolateBuilding;
    dim = Math.min(dim, sameBuilding ? 1 : 0.08);
  }

  if (journey) {
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
    const st = componentCxStatus(cxState, c.id);
    if (st.status === 'complete') {
      colour = '#41d98a';
      emissive = '#0d3b23';
    } else if (st.status === 'in-progress') {
      colour = '#f2b13c';
      emissive = '#4a3200';
    } else if (st.status === 'not-started') {
      colour = '#8ea0b0';
      emissive = undefined;
      dim = Math.min(dim, 0.8);
    } else {
      colour = '#4a5563';
      dim = Math.min(dim, 0.4);
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
  const labelSet = useMemo(() => labelSetFor(mode, 22), [mode]);
  return (
    <group>
      {COMPONENTS.map((c) => (
        <Node key={c.id} c={c} showLabel={labelSet.has(c.id)} />
      ))}
    </group>
  );
}