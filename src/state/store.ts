import { create } from 'zustand';
import type { SystemKey } from '../data/types';
import { COMPONENTS, BUILDINGS, type CampusComponent } from '../data/campus';
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
  | 'commissioning'
  | 'controls'
  | 'ai';

export interface CameraRequest {
  pos: [number, number, number];
  target: [number, number, number];
  token: number;
}

const LAST_PHASE = PHASES.length - 1;

/** The opening shot: the whole 95.5 ha campus from the north-west, at dusk. */
export const HOME_CAMERA = {
  pos: [820, 560, 900] as [number, number, number],
  target: [-30, 0, 20] as [number, number, number],
};

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
  /** data date index for the project-controls scrub, into CONTROLS_MONTHS */
  controlsMonth: number;
  /** active project-controls scenario id, or null */
  scenario: string | null;
  /** the modelled AI retrofit is applied to CLN2 hall 3 */
  aiRetrofit: boolean;
  faults: string[];
  /** campus reading index 1..5, mapping to CLN1, CLN2, CLN3, CLN5, CLN6 */
  isolateBuilding: number | null;
  isolateTrain: 'power' | 'cooling' | null;
  journey: { id: string; step: number } | null;
  camera: CameraRequest;
  panelOpen: boolean;
  /** which bottom sheet is open in the phone layout */
  sheet: 'mode' | 'inspect' | 'learn' | 'view' | null;

  setSheet: (s: 'mode' | 'inspect' | 'learn' | 'view' | null) => void;
  setMode: (m: Mode) => void;
  select: (id: string | null, focus?: boolean) => void;
  hover: (id: string | null) => void;
  toggle: (
    k: 'roofOff' | 'cutaway' | 'labels' | 'flows' | 'deliveryLayer' | 'evidenceMode' | 'panelOpen' | 'aiRetrofit',
  ) => void;
  setExplode: (v: number) => void;
  setDayNight: (v: 'day' | 'dusk' | 'night') => void;
  setColourBy: (v: 'system' | 'package') => void;
  setConstructPhase: (p: number) => void;
  setGridPhase: (p: number) => void;
  setGridPlaying: (p: boolean) => void;
  setControlsMonth: (m: number) => void;
  setScenario: (id: string | null) => void;
  completePackageStage: (pkgId: string, stageId: string) => void;
  resetCx: () => void;
  toggleFault: (type: string) => void;
  clearFaults: () => void;
  setIsolateBuilding: (b: number | null) => void;
  setIsolateTrain: (t: 'power' | 'cooling' | null) => void;
  startJourney: (id: string) => void;
  setJourneyStep: (step: number) => void;
  endJourney: () => void;
  moveCamera: (pos: [number, number, number], target: [number, number, number]) => void;
}

/** Modes that look inside the buildings, and therefore open the roofs. */
const INTERIOR_MODES: Mode[] = ['power', 'cooling', 'data', 'resilience', 'ai'];
/** Modes that need the envelope to stay closed to read as a campus. */
const EXTERIOR_MODES: Mode[] = ['construction', 'overview'];

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
  constructPhase: LAST_PHASE,
  gridPhase: 0,
  gridPlaying: false,
  cx: {},
  controlsMonth: LAST_PHASE,
  scenario: null,
  aiRetrofit: false,
  faults: [],
  isolateBuilding: null,
  isolateTrain: null,
  journey: null,
  camera: { ...HOME_CAMERA, token: 0 },
  panelOpen: true,
  sheet: 'mode',

  setSheet: (sh) => set({ sheet: sh }),

  /**
   * Switching mode also sets a sensible interior view, because a power, cooling
   * or network story is invisible through a closed roof. The user can override
   * it with the roof and cutaway toggles.
   *
   * The AI mode also switches the retrofit on, because showing a hall with cold
   * plates that are not there would be the more confusing of the two mistakes.
   */
  setMode: (m) =>
    set({
      mode: m,
      journey: null,
      isolateTrain: null,
      scenario: null,
      roofOff: INTERIOR_MODES.includes(m),
      cutaway: m === 'power' || m === 'cooling' || m === 'data' || m === 'ai',
      explode: 0,
      aiRetrofit: m === 'ai' ? true : m === 'overview' ? false : undefined,
      ...(EXTERIOR_MODES.includes(m) ? { roofOff: false, cutaway: false } : {}),
    }),

  select: (id, focus = true) => {
    set((prev) => ({ selected: id, ...(id && prev.sheet === 'mode' ? { sheet: 'inspect' as const } : {}) }));
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
  setConstructPhase: (p) => set({ constructPhase: Math.max(0, Math.min(LAST_PHASE, p)) }),
  setGridPhase: (p) => set({ gridPhase: Math.max(0, p) }),
  setGridPlaying: (p) => set({ gridPlaying: p }),
  setControlsMonth: (m) => set({ controlsMonth: Math.max(0, Math.min(LAST_PHASE, m)) }),
  setScenario: (id) => set({ scenario: id }),
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
  setIsolateBuilding: (b) => set({ isolateBuilding: b }),
  setIsolateTrain: (t) => set({ isolateTrain: t }),
  startJourney: (id) => set({ journey: { id, step: 0 }, selected: null }),
  setJourneyStep: (step) => set((s) => (s.journey ? { journey: { ...s.journey, step } } : {})),
  endJourney: () => set({ journey: null }),
  moveCamera: (pos, target) =>
    set((s) => {
      const f = framed(pos, target);
      return { camera: { pos: f.pos, target: f.target, token: s.camera.token + 1 } };
    }),
}));

/**
 * Framing compensation for narrow viewports.
 *
 * The camera field of view is vertical, so a portrait phone at 412x915 sees
 * roughly half the horizontal extent of a desktop at 1600x900 even though the
 * camera has not moved. Pulling back by the inverse aspect ratio keeps the
 * campus framed on a phone instead of showing one building.
 */
export function frameScale(): number {
  if (typeof window === 'undefined') return 1;
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  if (aspect >= 1.2) return 1;
  return Math.min(2.6, 0.95 / Math.max(0.3, aspect));
}

export function framed(pos: [number, number, number], target: [number, number, number]) {
  const k = frameScale();
  if (k === 1) return { pos, target };
  /* Taper the pull-back by how wide the shot already is. A campus overview
     needs the full compensation or the site is cropped; a close-up of one
     transformer does not, and doubling its distance would turn it into a
     mid-shot and lose the point of the step. */
  const d = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);
  const wide = Math.max(0, Math.min(1, (d - 320) / 780));
  const s = 1 + (k - 1) * wide;
  return {
    pos: [
      target[0] + (pos[0] - target[0]) * s,
      target[1] + (pos[1] - target[1]) * s,
      target[2] + (pos[2] - target[2]) * s,
    ] as [number, number, number],
    target,
  };
}

function cameraFor(c: CampusComponent): { pos: [number, number, number]; target: [number, number, number] } {
  /* Instanced components get framed on their whole extent, not one instance. */
  const span = (c.offsets ? Math.max(c.size[0], c.size[2], instanceSpan(c)) : Math.max(c.size[0], c.size[2])) * 0.9 + 40;
  return {
    pos: [c.pos[0] + span * 0.7, c.pos[1] + span * 0.75 + 20, c.pos[2] + span * 0.9],
    target: [c.pos[0], c.pos[1] + c.size[1] * 0.4, c.pos[2]],
  };
}

/** How far an instanced component's repeats reach from its origin. */
function instanceSpan(c: CampusComponent): number {
  if (!c.offsets?.length) return 0;
  let max = 0;
  for (const [dx, dz] of c.offsets) max = Math.max(max, Math.abs(dx) + c.size[0], Math.abs(dz) + c.size[2]);
  return max;
}

/* ------------------------------------------------------- construction state */

export type BuildState = 'hidden' | 'building' | 'complete';

/**
 * Build state comes straight from each component's own planned window.
 *
 * The previous model carried a separate module-lag table that shifted every
 * component's dates. That was necessary when all buildings shared one phase
 * list, and it was the single largest source of drift risk in the file. Clonee
 * is delivered in genuinely different phases, so the plan is written per
 * component instead: CLN1's shell, CLN2's fit-out and CLN6's fit-out each carry
 * their own real window, and there is no second timeline to keep in step.
 *
 * One consequence is worth stating: the modelled AI retrofit components sit
 * outside the programme entirely, so they only appear at their own phase and
 * the construction scrub genuinely shows a hall changing over time.
 */
export function buildStateOf(c: CampusComponent, phase: number): { state: BuildState; progress: number } {
  const s = c.build[0];
  const e = c.build[1];

  if (c.temporary) {
    if (phase < s || phase > e + 1) return { state: 'hidden', progress: 0 };
    return { state: 'complete', progress: 1 };
  }
  if (s === 0 && e === 0) return { state: 'complete', progress: 1 };
  if (phase < s) return { state: 'hidden', progress: 0 };
  if (phase >= e) return { state: 'complete', progress: 1 };
  return { state: 'building', progress: Math.max(0.15, (phase - s + 1) / Math.max(1, e - s + 1)) };
}

/* -------------------------------------------------------- building readiness */

export interface BuildingReadiness {
  /** campus reading index 1..5 */
  index: number;
  /** the published building name, which is not a simple sequence */
  name: string;
  itMW: number;
  /** phase at which the shell is complete */
  shellPhase: number;
  /** phase at which the last hall in the building is carrying IT load */
  fitoutPhase: number;
  /** phase at which the building is handed to operations */
  handoverPhase: number;
  /** carries IT load */
  live: boolean;
  /** handed to operations */
  handedOver: boolean;
  componentsComplete: number;
  componentsTotal: number;
  /** components whose planned window has already closed by this phase */
  componentsInProgress: number;
}

/**
 * Readiness is derived from the real plan rather than a gate constant.
 *
 * The previous model compared a phase index against a hardcoded gate number,
 * which meant changing the phase list silently broke the readiness table. Here
 * every figure comes from the building's own `fitout` and `handover` windows,
 * so the table is correct for any phase list.
 */
export function buildingReadiness(index: number, phase: number, components: CampusComponent[]): BuildingReadiness {
  const b = BUILDINGS.find((x) => x.n === index) ?? BUILDINGS[0];
  const mine = components.filter((c) => c.building === index);
  const complete = mine.filter((c) => buildStateOf(c, phase).state === 'complete').length;
  const inProgress = mine.filter((c) => buildStateOf(c, phase).state === 'building').length;
  return {
    index,
    name: b.name,
    itMW: b.itMW,
    shellPhase: b.shell[1],
    fitoutPhase: b.fitout[1],
    handoverPhase: b.handover,
    live: phase >= b.fitout[1],
    handedOver: phase >= b.handover,
    componentsComplete: complete,
    componentsTotal: mine.length,
    componentsInProgress: inProgress,
  };
}

/** All five buildings, in campus reading order. */
export function buildingsReady(phase: number, components: CampusComponent[]): BuildingReadiness[] {
  return BUILDINGS.map((b) => buildingReadiness(b.n, phase, components));
}

/** Total IT load the campus is carrying at this phase. */
export function liveItMW(phase: number) {
  return buildingsReady(phase, COMPONENTS)
    .filter((r) => r.live)
    .reduce((a, r) => a + r.itMW, 0);
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
       Programme-level prerequisites outside the boundary are carried by the
       `requires` edges instead. */
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

/** Which system each mode foregrounds, for dimming the scene and picking flows. */
export const SYSTEM_FOR_MODE: Record<Mode, SystemKey | null> = {
  overview: null,
  power: 'power',
  cooling: 'cooling',
  water: 'water',
  data: 'data',
  resilience: 'power',
  construction: null,
  commissioning: null,
  controls: null,
  ai: 'cooling',
};