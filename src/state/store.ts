import { create } from 'zustand';
import type { SystemKey } from '../data/types';
import { COMPONENTS, type CampusComponent } from '../data/campus';
import { PHASES } from '../data/phases';
import { CX_STAGES } from '../data/commissioning';
import {
  TURNOVER_PACKAGES,
  PACKAGE_BY_ID,
  packagesContaining,
  stageIndex,
  type TurnoverPackage,
} from '../data/turnover';

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
  /** packageId -> completed stage ids. Commissioning is asset-specific. */
  cx: Record<string, string[]>;
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
  completePackageStage: (pkgId: string, stageId: string) => void;
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
  cx: {},
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
  completePackageStage: (pkgId, stageId) =>
    set((s) => {
      const done = s.cx[pkgId] ?? [];
      if (done.includes(stageId)) return {};
      return { cx: { ...s.cx, [pkgId]: [...done, stageId] } };
    }),
  resetCx: () => set({ cx: {} }),
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
/**
 * The one and only module-lag model.
 *
 * Later modules lag module 1, but the lag is proportional to the phase rather
 * than a flat offset. A flat offset would push module 3's fitout past the end of
 * the programme and the campus would never complete.
 *
 * Everything that needs to know when a module is live derives from
 * modulePhaseOffset() - the construction panel, the HUD and the 3D build state
 * all call the same function, so there is no second timeline model to drift.
 */
const MODULE_SHIFT: Record<number, number> = { 1: 0, 2: 4, 3: 8 };
const LAST_PHASE = PHASES.length - 1;

export function modulePhaseOffset(moduleId: number | undefined): number {
  return (moduleId ? MODULE_SHIFT[moduleId] ?? 0 : 0);
}

/** Apply the module lag to a planned phase index. */
export function laggedPhase(phase: number, moduleId?: number): number {
  const shift = modulePhaseOffset(moduleId);
  if (!shift) return phase;
  return Math.min(LAST_PHASE, phase + Math.round((shift * phase) / LAST_PHASE));
}

export function buildStateOf(c: CampusComponent, phase: number): { state: BuildState; progress: number } {
  const s = laggedPhase(c.build[0], c.module);
  const e = laggedPhase(c.build[1], c.module);
  if (c.temporary) {
    if (phase < s || phase > e + 1) return { state: 'hidden', progress: 0 };
    return { state: 'complete', progress: 1 };
  }
  if (s === 0 && e === 0) return { state: 'complete', progress: 1 };
  if (phase < s) return { state: 'hidden', progress: 0 };
  if (phase >= e) return { state: 'complete', progress: 1 };
  return { state: 'building', progress: Math.max(0.15, (phase - s + 1) / Math.max(1, e - s + 1)) };
}

/* -------------------------------------------------------- module readiness */

export interface ModuleReadiness {
  module: number;
  /** lagged phase at which the module's white space is energised */
  fitoutPhase: number;
  /** lagged phase at which its last turnover package completes */
  readyPhase: number;
  live: boolean;
  handedOver: boolean;
  componentsComplete: number;
  componentsTotal: number;
}

/** Planned phases that mean "carries IT load" and "operational handover". */
const FITOUT_GATE = 29; // racks and IT equipment installed
const HANDOVER_GATE = 35; // operational handover

export function moduleReadiness(moduleId: number, phase: number, components: CampusComponent[]): ModuleReadiness {
  const fitoutPhase = laggedPhase(FITOUT_GATE, moduleId);
  const readyPhase = laggedPhase(HANDOVER_GATE, moduleId);
  const mine = components.filter((c) => c.module === moduleId);
  const complete = mine.filter((c) => buildStateOf(c, phase).state === 'complete').length;
  return {
    module: moduleId,
    fitoutPhase,
    readyPhase,
    live: phase >= fitoutPhase,
    handedOver: phase >= readyPhase,
    componentsComplete: complete,
    componentsTotal: mine.length,
  };
}

export function modulesReady(phase: number, components: CampusComponent[]): ModuleReadiness[] {
  return [1, 2, 3].map((m) => moduleReadiness(m, phase, components));
}

/* ------------------------------------------------------ commissioning state */

export interface CxBlocker {
  packageId: string;
  packageTitle: string;
  message: string;
}

/** Stages already complete for a turnover package. */
export function packageDone(state: Record<string, string[]>, pkgId: string) {
  return state[pkgId] ?? [];
}

/** The next stage this package has to complete, if any. */
export function nextStageForPackage(state: Record<string, string[]>, pkgId: string): string | null {
  const pkg = PACKAGE_BY_ID[pkgId];
  if (!pkg) return null;
  const done = packageDone(state, pkgId);
  return pkg.stages.find((s) => !done.includes(s)) ?? null;
}

/**
 * Why a package cannot advance, expressed as real dependency reasons:
 * either a stage in its own scope has not been signed off, or an upstream
 * turnover package is behind it.
 */
export function blockersForPackage(state: Record<string, string[]>, pkgId: string): CxBlocker[] {
  const pkg = PACKAGE_BY_ID[pkgId];
  if (!pkg) return [];
  const done = packageDone(state, pkgId);
  const next = pkg.stages.find((s) => !done.includes(s));
  const out: CxBlocker[] = [];

  /* upstream packages must be at least as far along as the stage we are on */
  const want = next ? stageIndex(next) : Infinity;
  for (const upId of pkg.requires) {
    const up = PACKAGE_BY_ID[upId];
    if (!up) continue;
    const upDone = packageDone(state, upId);
    const upHas = up.stages.filter((s) => stageIndex(s) <= want);
    const behind = upHas.filter((s) => !upDone.includes(s));
    if (behind.length) {
      const verb = next ? 'cannot advance' : 'cannot be signed off';
      out.push({
        packageId: upId,
        packageTitle: up.title,
        message: `${pkg.title} ${verb} because upstream turnover package "${up.title}" has not completed ${stageName(behind[behind.length - 1])}`,
      });
    }
  }

  if (next) {
    const stage = CX_STAGES.find((s) => s.id === next);
    /* Only prerequisites that fall INSIDE this turnover boundary can block it.
       Programme-level prerequisites outside the boundary (for example factory
       testing of bought-in equipment that is commissioned elsewhere) are carried
       by the `requires` edges instead. */
    const inBoundary = new Set(pkg.stages);
    const missing = (stage?.needs ?? []).filter((n) => inBoundary.has(n) && !done.includes(n));
    for (const m of missing) {
      out.push({
        packageId: pkgId,
        packageTitle: pkg.title,
        message: `${pkg.title}: ${stageName(m)} has not been completed in this package`,
      });
    }
  }
  return out;
}

/** Commissioning summary for one component, via its turnover packages. */
export interface ComponentCxStatus {
  packages: { id: string; title: string; done: number; total: number; complete: boolean }[];
  blocking: CxBlocker[];
  status: 'not-started' | 'in-progress' | 'complete' | 'out-of-scope';
}

/**
 * A component is only complete when its own turnover package AND every package
 * that package depends on are signed off. A rack sits in one package, but it
 * genuinely requires its power, cooling and network packages, so the status has
 * to be computed over that upstream closure.
 */
export function requiredPackagesFor(componentId: string): TurnoverPackage[] {
  const direct = packagesContaining(componentId);
  if (!direct.length) return [];
  const seen = new Set<string>();
  const queue = direct.map((p) => p.id);
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const r of PACKAGE_BY_ID[id]?.requires ?? []) queue.push(r);
  }
  return [...seen].map((id) => PACKAGE_BY_ID[id]).filter(Boolean);
}

export function componentCxStatus(state: Record<string, string[]>, componentId: string): ComponentCxStatus {
  const own = packagesContaining(componentId);
  if (!own.length) return { packages: [], blocking: [], status: 'out-of-scope' };
  const required = requiredPackagesFor(componentId);
  const summary = required.map((p) => {
    const done = packageDone(state, p.id).length;
    return { id: p.id, title: p.title, done, total: p.stages.length, complete: done >= p.stages.length };
  });
  const blocking = own.flatMap((p) => blockersForPackage(state, p.id));
  const status: ComponentCxStatus['status'] = summary.every((s) => s.complete)
    ? 'complete'
    : summary.some((s) => s.done > 0)
      ? 'in-progress'
      : 'not-started';
  return { packages: summary, blocking, status };
}

/** Packages whose commissioning status is currently blocking the campus. */
export function outstandingPackages(state: Record<string, string[]>) {
  return TURNOVER_PACKAGES.filter((p) => (state[p.id] ?? []).length < p.stages.length);
}

export function stageName(id: string) {
  return CX_STAGES.find((s) => s.id === id)?.name ?? id;
}

/** Programme-level prerequisite check, used by the commissioning panel header. */
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