import { create } from 'zustand';
import type { SystemKey } from '../data/types';
import { COMPONENTS, FLOW_LINKS, type CampusComponent } from '../data/campus';
import { PHASES } from '../data/phases';
import { CX_STAGES, CX_ORDER, cxOrderIndex } from '../data/commissioning';

export type Mode =
  | 'overview'
  | 'power'
  | 'cooling'
  | 'water'
  | 'data'
  | 'resilience'
  | 'construction'
  | 'commissioning';

export interface CameraRequest {
  pos: [number, number, number];
  target: [number, number, number];
  token: number;
}

interface State {
  mode: Mode;
  selected: string | null;
  hovered: string | null;
  roofOff: boolean;
  cutaway: boolean;
  explode: number;
  labels: boolean;
  flows: boolean;
  dayNight: 'day' | 'dusk' | 'night';
  colourBy: 'system' | 'package';
  deliveryLayer: boolean;
  evidenceMode: boolean;
  constructPhase: number;
  gridPhase: number;
  gridPlaying: boolean;
  cxDone: string[];
  cxCursor: number;
  cxRunning: boolean;
  faults: string[];
  isolateHall: number | null;
  isolateTrain: 'power' | 'cooling' | null;
  journey: { id: string; step: number } | null;
  camera: CameraRequest;
  panelOpen: boolean;
  setMode: (m: Mode) => void;
  select: (id: string | null, focus?: boolean) => void;
  hover: (id: string | null) => void;
  toggle: (k: 'roofOff' | 'cutaway' | 'labels' | 'flows' | 'deliveryLayer' | 'evidenceMode' | 'panelOpen') => void;
  setExplode: (v: number) => void;
  setDayNight: (v: 'day' | 'dusk' | 'night') => void;
  setColourBy: (v: 'system' | 'package') => void;
  setConstructPhase: (p: number) => void;
  setGridPhase: (p: number) => void;
  setGridPlaying: (p: boolean) => void;
  completeStage: (id: string) => void;
  resetCx: () => void;
  toggleFault: (type: string) => void;
  clearFaults: () => void;
  setIsolateHall: (h: number | null) => void;
  setIsolateTrain: (t: 'power' | 'cooling' | null) => void;
  startJourney: (id: string) => void;
  setJourneyStep: (step: number) => void;
  endJourney: () => void;
  moveCamera: (pos: [number, number, number], target: [number, number, number]) => void;
}

export const useStore = create<State>((set, get) => ({
  mode: 'overview',
  selected: null,
  hovered: null,
  roofOff: false,
  cutaway: false,
  explode: 0,
  labels: true,
  flows: true,
  dayNight: 'day',
  colourBy: 'system',
  deliveryLayer: false,
  evidenceMode: false,
  constructPhase: PHASES.length - 1,
  gridPhase: 0,
  gridPlaying: false,
  cxDone: [],
  cxCursor: 0,
  cxRunning: false,
  faults: [],
  isolateHall: null,
  isolateTrain: null,
  journey: null,
  camera: { pos: [560, 430, 640], target: [-40, 0, 20], token: 0 },
  panelOpen: true,

  /**
   * Switching mode also sets a sensible interior view, because a power, cooling
   * or network story is invisible through a closed roof. The user can override
   * it with the roof and cutaway toggles.
   */
  setMode: (m) =>
    set({
      mode: m,
      journey: null,
      isolateTrain: null,
      roofOff: m === 'power' || m === 'cooling' || m === 'data' || m === 'resilience',
      cutaway: m === 'power' || m === 'cooling' || m === 'data',
      explode: 0,
      ...(m === 'construction' ? { roofOff: false, cutaway: false } : {}),
    }),
  select: (id, focus = true) => {
    set({ selected: id });
    if (id && focus) {
      const c = COMPONENTS.find((x) => x.id === id);
      if (c) {
        const { pos, target } = cameraFor(c);
        get().moveCamera(pos, target);
      }
    }
  },
  hover: (id) => set({ hovered: id }),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<State>),
  setExplode: (v) => set({ explode: v }),
  setDayNight: (v) => set({ dayNight: v }),
  setColourBy: (v) => set({ colourBy: v }),
  setConstructPhase: (p) => set({ constructPhase: Math.max(0, Math.min(PHASES.length - 1, p)) }),
  setGridPhase: (p) => set({ gridPhase: Math.max(0, p) }),
  setGridPlaying: (p) => set({ gridPlaying: p }),
  completeStage: (id) =>
    set((s) => {
      const done = s.cxDone.includes(id) ? s.cxDone : [...s.cxDone, id];
      const idx = CX_ORDER.indexOf(id);
      return { cxDone: done, cxCursor: Math.max(s.cxCursor, idx + 1) };
    }),
  resetCx: () => set({ cxDone: [], cxCursor: 0 }),
  toggleFault: (type) =>
    set((s) => ({ faults: s.faults.includes(type) ? s.faults.filter((f) => f !== type) : [...s.faults, type] })),
  clearFaults: () => set({ faults: [] }),
  setIsolateHall: (h) => set({ isolateHall: h }),
  setIsolateTrain: (t) => set({ isolateTrain: t }),
  startJourney: (id) => set({ journey: { id, step: 0 }, selected: null }),
  setJourneyStep: (step) => set((s) => (s.journey ? { journey: { ...s.journey, step } } : {})),
  endJourney: () => set({ journey: null }),
  moveCamera: (pos, target) => set((s) => ({ camera: { pos, target, token: s.camera.token + 1 } })),
}));

function cameraFor(c: CampusComponent): { pos: [number, number, number]; target: [number, number, number] } {
  const span = Math.max(c.size[0], c.size[2]) * 0.9 + 40;
  return {
    pos: [c.pos[0] + span * 0.7, c.pos[1] + span * 0.75 + 20, c.pos[2] + span * 0.9],
    target: [c.pos[0], c.pos[1] + c.size[1] * 0.4, c.pos[2]],
  };
}

/* ------------------------------------------------------- construction state */

export type BuildState = 'hidden' | 'building' | 'complete';

/**
 * Phased delivery: later modules lag the first one, but the lag is applied
 * proportionally rather than as a flat offset. A flat offset would push module
 * three's fitout past the end of the programme, which would mean the campus
 * never actually completes.
 */
const MODULE_SHIFT: Record<number, number> = { 1: 0, 2: 4, 3: 8 };
const LAST_PHASE = PHASES.length - 1;

function lagged(phase: number, shift: number) {
  if (!shift) return phase;
  return Math.min(LAST_PHASE, phase + Math.round((shift * phase) / LAST_PHASE));
}

export function buildStateOf(c: CampusComponent, phase: number): { state: BuildState; progress: number } {
  const shift = c.module ? MODULE_SHIFT[c.module] : 0;
  const s = lagged(c.build[0], shift);
  const e = lagged(c.build[1], shift);
  if (c.temporary) {
    if (phase < s || phase > e + 1) return { state: 'hidden', progress: 0 };
    return { state: 'complete', progress: 1 };
  }
  if (s === 0 && e === 0) return { state: 'complete', progress: 1 };
  if (phase < s) return { state: 'hidden', progress: 0 };
  if (phase >= e) return { state: 'complete', progress: 1 };
  return { state: 'building', progress: Math.max(0.15, (phase - s + 1) / Math.max(1, e - s + 1)) };
}

/* ------------------------------------------------------ commissioning state */

export interface CxBlocker {
  message: string;
  component: string;
  stage: string;
}

/** Upstream gates that must be complete before a component can pass a stage. */
function upstreamOf(id: string): string[] {
  return UPSTREAM[id] ?? [];
}

/** The flow graph is the dependency graph: anything that feeds a component must
 *  be commissioned before it. Modelled from FLOW_LINKS rather than hand-listed. */
const POWER_MEDIA = new Set(['hv', 'mv', 'lv', 'rack', 'coolant', 'chilled', 'fibre']);
const UPSTREAM: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const link of FLOW_LINKS) {
    if (!POWER_MEDIA.has(link.medium)) continue;
    m[link.to] = [...(m[link.to] ?? []), link.from];
  }
  return m;
})();

export function blockersFor(componentId: string, stageId: string, done: string[]): CxBlocker[] {
  const out: CxBlocker[] = [];
  const si = cxOrderIndex(stageId);
  if (si < 0) return out;
  const required = CX_ORDER.slice(0, si + 1);
  for (const up of upstreamOf(componentId)) {
    const upDoneAll = required.every((r) => done.includes(r));
    if (!upDoneAll) {
      const missing = required.filter((r) => !done.includes(r));
      const last = missing[missing.length - 1];
      out.push({
        message: `Upstream ${up} has not completed ${stageName(last)}`,
        component: up,
        stage: last,
      });
    }
  }
  return out;
}

export function stageName(id: string) {
  return CX_STAGES.find((s) => s.id === id)?.name ?? id;
}

export function canStartStage(stageId: string, done: string[]): boolean {
  const stage = CX_STAGES.find((s) => s.id === stageId);
  if (!stage) return false;
  return stage.needs.every((n) => done.includes(n));
}

export const SYSTEM_FOR_MODE: Record<Mode, SystemKey | null> = {
  overview: null,
  power: 'power',
  cooling: 'cooling',
  water: 'water',
  data: 'data',
  resilience: 'power',
  construction: null,
  commissioning: null,
};