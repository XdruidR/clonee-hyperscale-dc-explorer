import { COMPONENT_INFO } from './componentInfo';
import type { Classification, SystemKey } from './types';
import { PHASES } from './phases';

/**
 * The Clonee campus model.
 *
 * Layout intent: the site is approximately 95.5 ha, so the modelled ground is a
 * 960 m x 1000 m rectangle. Five data-storage buildings sit in two rows either
 * side of a central service spine, with the 220 kV substation compound on the
 * east side — which is where the consented design puts it, adjacent to the
 * loop-in and clear of the building bars. Generators sit behind each building,
 * not between them, because a generator compound is a fire and noise zone and
 * the halls are the valuable real estate.
 *
 * All positions are metres, y up, north = -z.
 */

export interface CampusComponent {
  id: string;
  type: string;
  label: string;
  system: SystemKey;
  pos: [number, number, number];
  rot: number;
  size: [number, number, number];
  /** instanced repeats as [dx, dz] offsets from pos */
  offsets?: [number, number][];
  /** construction phase window [start, end] */
  build: [number, number];
  temporary?: boolean;
  /** 1..5, in campus reading order: CLN1, CLN2, CLN3, CLN5, CLN6 */
  building?: number;
  /** 1..4, the hall's index within its building */
  hall?: number;
  /** sunk into the ground / below slab */
  ground?: boolean;
  label3d?: boolean;
  facts?: string[];
  kW?: number;
  voltage?: string;
  note?: string;
  /** only exists after the modelled AI retrofit */
  retrofit?: boolean;
}

export type FlowMedium =
  | 'hv'
  | 'mv'
  | 'lv'
  | 'rack'
  | 'coolant'
  | 'water'
  | 'makeup'
  | 'drain'
  | 'air'
  | 'fibre'
  | 'signal';

export interface FlowLink {
  id: string;
  from: string;
  to: string;
  system: SystemKey;
  medium: FlowMedium;
  label: string;
  classification: Classification;
  via?: [number, number, number][];
  reversed?: boolean;
}

/* ------------------------------------------------------------------ geometry */

/**
 * Site and campus constants.
 *
 * `buildingWidth` and `buildingDepth` are derived from published figures: four
 * halls of approximately 4,170 m2 plus approximately 11,000 m2 of internal
 * plant gives a bar roughly 280 m long and just over 100 m deep.
 */
export const SITE = {
  halfW: 510,
  halfD: 470,
  /** centre of the north and south building rows */
  rowZ: [-190, 190],
  buildingWidth: 280,
  buildingDepth: 106,
  /** substation compound, approximately 30,100 m2, clear of the building bars */
  sub: { x: 330, z: 340, w: 186, d: 168 },
  gateZ: 445,
};

/** Where each of the five data-storage buildings stands. */
export interface BuildingDef {
  /** 1..5 in campus reading order; the published names are CLN1, CLN2, CLN3, CLN5, CLN6 */
  n: number;
  name: string;
  cx: number;
  cz: number;
  /** consented IT capacity for this building */
  itMW: number;
  gfaM2: number;
  gfaBasis: 'PUBLISHED' | 'DERIVED';
  consent: string;
  /** phase indices */
  shell: [number, number];
  fitout: [number, number];
  handover: number;
  halls: string[];
}

function hallIds(name: string) {
  return [1, 2, 3, 4].map((h) => `${name}.h${h}`);
}

/**
 * Campus reading order is CLN1, CLN2, CLN3, CLN5, CLN6 — note that CLN4 does
 * not exist on this campus, and the numbering gap is preserved everywhere in
 * the application rather than tidied away.
 *
 * Position: two rows of parallel bars either side of a central service spine.
 * The third original building and the two expansion buildings fill the north
 * and south rows as each consent lands, which is why the expansion phases are
 * built alongside an operating campus rather than beyond it.
 */
export const BUILDINGS: BuildingDef[] = [
  {
    n: 1,
    name: 'CLN1',
    cx: -330,
    cz: -190,
    itMW: 36,
    gfaM2: 25_400,
    gfaBasis: 'PUBLISHED',
    consent: 'RA150605',
    shell: [9, 11],
    fitout: [10, 11],
    handover: 11,
    halls: hallIds('CLN1'),
  },
  {
    n: 2,
    name: 'CLN2',
    cx: 0,
    cz: -190,
    itMW: 36,
    gfaM2: 25_400,
    gfaBasis: 'PUBLISHED',
    consent: 'RA150605',
    shell: [9, 11],
    fitout: [12, 12],
    handover: 12,
    halls: hallIds('CLN2'),
  },
  {
    n: 3,
    name: 'CLN3',
    cx: -330,
    cz: 190,
    itMW: 36,
    gfaM2: 28_320,
    gfaBasis: 'PUBLISHED',
    consent: 'RA180671',
    shell: [14, 16],
    fitout: [15, 16],
    handover: 16,
    halls: hallIds('CLN3'),
  },
  {
    n: 4,
    name: 'CLN5',
    cx: 330,
    cz: -190,
    itMW: 36,
    gfaM2: 28_700,
    gfaBasis: 'DERIVED',
    consent: 'RA180671',
    shell: [17, 19],
    fitout: [19, 20],
    handover: 20,
    halls: hallIds('CLN5'),
  },
  {
    n: 5,
    name: 'CLN6',
    cx: 0,
    cz: 190,
    itMW: 36,
    gfaM2: 28_700,
    gfaBasis: 'DERIVED',
    consent: 'RA180671',
    shell: [18, 20],
    fitout: [20, 21],
    handover: 21,
    halls: hallIds('CLN6'),
  },
];

/**
 * The two-row arrangement is a deliberate, defensible simplification, so state
 * it rather than let a reader infer it from coordinates. The consented campus
 * is a set of parallel bars either side of a central corridor with the
 * substation compound to the east.
 */
export const LAYOUT_NOTE =
  'Two rows of parallel building bars either side of a central service spine, with the 220 kV substation compound on the east side beside the loop-in. Bar orientation and the spine are a DERIVED simplification of the consented layout; the building count, hall count and consented floor areas are published.';

/** Campus reading order index (1..5) for each published building name. */
export const BUILDING_INDEX: Record<string, number> = {
  CLN1: 1,
  CLN2: 2,
  CLN3: 3,
  CLN5: 4,
  CLN6: 5,
};

export const BUILDING_BY_NAME: Record<string, BuildingDef> = Object.fromEntries(
  BUILDINGS.map((b) => [b.name, b]),
);

/** Every hall id, in campus order. */
export const HALLS: string[] = BUILDINGS.flatMap((b) => b.halls);

/** Which building a hall belongs to. */
export const BUILDING_OF_HALL: Record<string, number> = Object.fromEntries(
  BUILDINGS.flatMap((b) => b.halls.map((h) => [h, b.n])),
);

/** Hall index within its building, 1..4. */
export const HALL_INDEX: Record<string, number> = Object.fromEntries(
  BUILDINGS.flatMap((b) => b.halls.map((h, i) => [h, i + 1])),
);

export const HALL_NAME: Record<string, string> = Object.fromEntries(
  BUILDINGS.flatMap((b) => b.halls.map((h, i) => [h, `${b.name} hall ${i + 1}`])),
);

/** The four public capacity figures that do not agree with each other. */
export const CAPACITY_NOTES: { figure: string; source: string; note: string }[] = [
  {
    figure: '36 MW per building',
    source: 'MCC-150605',
    note: 'Consented data capacity for each of the two original buildings. Applying it to all five gives the 180 MW campus figure used in the model.',
  },
  {
    figure: '108 MVA supply',
    source: 'SNWA-FB',
    note: 'The published power supply for the three original buildings. 108 MVA against 3 x 36 MW is almost exactly unity, which tells you it describes the IT feed rather than the whole facility draw.',
  },
  {
    figure: '75,000 m² at 2.24 kW/m²',
    source: 'SNWA-FB',
    note: 'Published IT area and power density. The multiplication gives 168 MW — close to, but not identical with, 180 MW from the consent.',
  },
  {
    figure: 'Nearly 150,000 m²',
    source: 'META-2019',
    note: 'Total facility area after the expansion. A floor area, not a power figure, and it includes plant, administration and the substation.',
  },
];

/* -------------------------------------------------------- build windows map */

/** Default construction window per geometry type, keyed to the phase sequence. */
const BUILD: Record<string, [number, number]> = {
  /* context and grid */
  'hv-line': [0, 0],
  'hv-tower': [5, 6],
  'sub-platform': [4, 6],
  'sub-bay': [6, 7],
  'sub-transformer': [7, 8],
  'sub-control': [6, 8],
  'sub-mv-building': [6, 8],

  /* generation */
  generator: [10, 12],
  'gen-heat-rejection': [10, 12],
  'fuel-tank': [10, 12],
  'generator-switchgear': [11, 13],

  /* campus distribution */
  'mv-switchgear': [11, 13],
  'unit-substation': [11, 13],
  ups: [11, 13],
  battery: [11, 13],
  'lv-switchboard': [12, 14],

  /* buildings */
  'data-hall': [9, 12],
  'building-plant': [10, 14],
  'hall-floor': [12, 14],

  /* in-hall IT and distribution */
  rack: [12, 14],
  server: [12, 14],
  'network-switch': [12, 14],
  storage: [12, 14],
  pdu: [12, 14],
  busway: [12, 14],

  /* cooling */
  crah: [11, 14],
  'air-cooler': [11, 14],
  'heat-exchanger': [11, 14],
  pump: [11, 14],
  'heat-plume': [12, 14],
  'ambient-sink': [0, 0],

  /* AI retrofit only */
  cdu: [23, 23],
  'cold-plate': [23, 23],

  /* water and civil */
  road: [4, 12],
  gatehouse: [4, 7],
  fence: [4, 10],
  admin: [9, 12],
  fire: [10, 14],
  'water-treatment': [10, 14],
  bore: [11, 15],
  'potable-tank': [10, 13],
  'wastewater-soakage': [11, 15],
  'stormwater-basin': [4, 12],
  watercourse: [0, 0],

  /* data */
  'fibre-hub': [10, 14],
  'network-core': [11, 15],
  'fibre-route': [10, 15],

  /* temporary works */
  'site-shed': [3, 12],
  'sediment-pond': [3, 10],
  'tower-crane': [9, 11],
  'temp-road': [3, 9],
};

/* ------------------------------------------------------------------ helpers */

function offsetsGrid(cols: number, rows: number, stepX: number, stepZ: number): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push([(c - (cols - 1) / 2) * stepX, (r - (rows - 1) / 2) * stepZ]);
  }
  return out;
}

/**
 * Hall floor plan: 18 rows of 40 racks, 720 per hall.
 *
 * 9 MW of consented IT load per hall over 720 racks is 12.5 kW per rack, which
 * is the right order for an air-cooled hall of this delivery period. The count
 * is DERIVED; nothing about the internal layout is published.
 */
export const HALL_RACK_ROWS = 18;
export const HALL_RACK_COLS = 40;
export const RACKS_PER_HALL = HALL_RACK_ROWS * HALL_RACK_COLS;

const rowX = (r: number) => (r - (HALL_RACK_ROWS - 1) / 2) * 3.6;
const colZ = (c: number) => (c - (HALL_RACK_COLS - 1) / 2) * 1.15;

const RACK_OFFSETS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < HALL_RACK_ROWS; r++) for (let c = 0; c < HALL_RACK_COLS; c++) out.push([rowX(r), colZ(c)]);
  return out;
})();

const SERVER_OFFSETS: [number, number][] = RACK_OFFSETS.map(([x, z]) => [x + 0.42, z] as [number, number]);

/** 18 generators per building: two rows of nine, in a compound behind the bar. */
const GEN_OFFSETS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) out.push([(i - 4) * 17, (r - 0.5) * 24]);
  return out;
})();

/** Belly tanks sit in the aisle between the two generator rows. */
const FUEL_OFFSETS: [number, number][] = Array.from({ length: 18 }, (_, i) => [(i % 9 - 4) * 17, (i < 9 ? -6 : 6)]);

/** Twenty-four heat-rejection units per building, in two banks behind the plant corridor. */
const COOLER_OFFSETS: [number, number][] = offsetsGrid(12, 2, 22, 20);

/** Where each hall sits inside its building bar. */
export function hallCentre(b: BuildingDef, hall: number): [number, number] {
  return [b.cx + (hall - 2.5) * 68, b.cz + 28];
}

/* --------------------------------------------------------------- components */

export const COMPONENTS: CampusComponent[] = (() => {
  const out: CampusComponent[] = [];
  const add = (
    id: string,
    type: string,
    label: string,
    system: SystemKey,
    pos: [number, number, number],
    size: [number, number, number] = [10, 10, 10],
    extra: Partial<CampusComponent> = {},
  ) => {
    const build = extra.build ?? BUILD[type] ?? [1, 1];
    out.push({ id, type, label, system, pos, rot: 0, size, build, ...extra });
  };

  /* ---- grid connection and substation ---- */
  add('hv.line', 'hv-line', 'Incoming 220 kV transmission', 'power', [-60, 34, -520], [900, 1, 1], {
    label3d: true,
    facts: ['grid-voltage'],
    note: 'The consented connection is a loop-in to the existing 220 kV transmission system, which is why two new towers appear on the site rather than one new radial line.',
  });
  for (let i = 0; i < 2; i++) {
    add(`sub.tower${i + 1}`, 'hv-tower', `Transmission tower ${i + 1}`, 'power', [248 + i * 17, 0, 206 + i * 22], [13, 52, 13], {
      facts: ['towers'],
      build: [5, 6],
    });
  }
  add('sub.platform', 'sub-platform', '220 kV substation compound', 'power', [SITE.sub.x, 0, SITE.sub.z], [SITE.sub.w, 1.2, SITE.sub.d], {
    label3d: true,
    facts: ['substation-area'],
  });
  add('sub.bay', 'sub-bay', '220 kV AIS switchyard, 12 bays', 'power', [SITE.sub.x + 34, 0, SITE.sub.z - 44], [16, 22, 104], {
    label3d: true,
    facts: ['hv-bays', 'lightning-masts'],
    note: 'PUBLIC FACT: outdoor 220 kV air-insulated switchgear, 12 × 220 kV bays, 27 lightning-protection masts. The bay arrangement shown is a DERIVED simplification of a loop-in scheme.',
  });
  add('sub.xfmr', 'sub-transformer', 'Step-down transformers, 3 off', 'power', [SITE.sub.x - 34, 0, SITE.sub.z + 34], [14, 13, 19], {
    label3d: true,
    offsets: [
      [-30, 0],
      [0, 0],
      [30, 0],
    ],
    facts: ['step-down-transformers'],
    voltage: '220 kV -> 20 kV',
    note: 'PUBLIC FACT: three step-down transformers. Ratings are DERIVED from the consented campus load and are typical of a 220/20 kV distribution transformer.',
  });
  add('sub.control', 'sub-control', 'Substation control building', 'power', [SITE.sub.x + 40, 0, SITE.sub.z + 56], [18, 7, 26], {
    facts: ['substation-area'],
  });
  add('sub.mvb', 'sub-mv-building', 'Customer MV building', 'power', [SITE.sub.x - 46, 0, SITE.sub.z - 48], [20, 8, 26], {
    label3d: true,
    facts: ['substation-area'],
  });

  /* ---- the five data-storage buildings ---- */
  for (const b of BUILDINGS) {
    const common = { building: b.n };

    /* the bar itself */
    add(`${b.name}.shell`, 'data-hall', `${b.name} — four data halls, ${b.itMW} MW`, 'site', [b.cx, 0, b.cz], [SITE.buildingWidth, 13, SITE.buildingDepth], {
      ...common,
      build: b.shell,
      label3d: true,
      facts: ['building-count', 'hall-count', 'hall-size', 'it-power-density'],
      note: `PUBLIC FACT: ${b.name} is one of the five data-storage buildings named in the industrial emissions licence. ${b.gfaBasis === 'PUBLISHED' ? `Floor area ${b.gfaM2.toLocaleString('en-IE')} m² is published.` : `Floor area ${b.gfaM2.toLocaleString('en-IE')} m² is DERIVED from the consent, which gives ${(57400 / 2).toLocaleString('en-IE')} m² for the pair rather than each building.`}`,
    });

    /* plant corridor on the north face of each bar */
    add(`${b.name}.zone`, 'building-plant', `${b.name} plant corridor`, 'site', [b.cx, 0, b.cz - 28], [SITE.buildingWidth - 16, 0.6, 44], {
      ...common,
      build: [b.fitout[0], b.fitout[1] + 2],
    });

    /* campus MV arrival, on the spine side */
    add(`${b.name}.mv`, 'mv-switchgear', `${b.name} MV switchgear`, 'power', [b.cx + 128, 0, b.cz - 44], [26, 6, 16], {
      ...common,
      build: [b.fitout[0], b.fitout[1] + 1],
      label3d: true,
      facts: ['campus-mv'],
      note: 'PUBLIC FACT: the consented design carries the campus distribution underground at 20 kV between the substation and the data-centre buildings. The lineup inside the building is TYPICAL: an incomer per supply with split bus sections and per-hall feeders.',
    });

    /* generation compound, behind the bar */
    const genZ = b.cz - 128;
    add(`${b.name}.gen`, 'generator', `${b.name} generators, 18 × 2.5 MW`, 'power', [b.cx, 0, genZ], [10, 5, 15], {
      ...common,
      offsets: GEN_OFFSETS,
      build: [b.fitout[0] - 1, b.fitout[1]],
      label3d: true,
      facts: ['generators'],
      kW: 45,
      voltage: '20 kV generator output',
      note: 'PUBLIC FACT: 90 diesel generators across the five-building campus. DERIVED: eighteen per building, and the 2.5 MW rating that gives each building 45 MW against its 36 MW of consented IT load.',
    });
    add(`${b.name}.genheat`, 'gen-heat-rejection', `${b.name} engine heat rejection`, 'cooling', [b.cx, 0, genZ], [9, 4.2, 11], {
      ...common,
      offsets: GEN_OFFSETS.map(([x, z]) => [x, z + 8] as [number, number]),
      build: [b.fitout[0] - 1, b.fitout[1]],
      facts: ['generator-heat'],
      note: 'Radiators, jacket water and aftercoolers belonging to the sets themselves. This heat does not enter the hall cooling loop — it leaves through the sets’ own cooling systems to ambient air, which is why a campus with no IT load still needs heat rejection.',
    });
    add(`${b.name}.fuel`, 'fuel-tank', `${b.name} fuel tanks`, 'power', [b.cx, 0, genZ], [8, 3.6, 11], {
      ...common,
      offsets: FUEL_OFFSETS,
      build: [b.fitout[0], b.fitout[1]],
      facts: ['generators'],
      note: 'TYPICAL: a tank per set, sized to run that set without a tanker on site, with the compound bundled and drained to a separator with automatic shutoff. No tank sizes are published for Clonee.',
    });
    add(`${b.name}.gensw`, 'generator-switchgear', `${b.name} generator switchgear`, 'power', [b.cx + 100, 0, genZ + 16], [22, 5, 9], {
      ...common,
      build: [b.fitout[0], b.fitout[1] + 1],
    });

    /* heat rejection, on the north side behind the generators */
    add(`${b.name}.cool`, 'air-cooler', `${b.name} indirect air cooling`, 'cooling', [b.cx, 0, b.cz - 96], [11, 12, 11], {
      ...common,
      offsets: COOLER_OFFSETS,
      build: [b.fitout[0], b.fitout[1] + 1],
      label3d: true,
      facts: ['cooling-type'],
      note: 'PUBLIC FACT: the project uses indirect air cooling. EPA-P1192 refers to residual evaporative cooling-water discharge, so the modelled plant is an evaporative-assisted indirect arrangement. Unit count and layout are TYPICAL.',
    });
    add(`${b.name}.pump`, 'pump', `${b.name} cooling water pumps`, 'cooling', [b.cx, 0, b.cz - 70], [4, 2.6, 4], {
      ...common,
      offsets: offsetsGrid(6, 1, 26, 1),
      build: [b.fitout[0], b.fitout[1] + 1],
    });
    add(`${b.name}.hx`, 'heat-exchanger', `${b.name} heat exchanger skids`, 'cooling', [b.cx, 0, b.cz - 52], [11, 5, 17], {
      ...common,
      offsets: offsetsGrid(4, 1, 34, 1),
      build: [b.fitout[0], b.fitout[1] + 1],
    });
    add(`${b.name}.plume`, 'heat-plume', `${b.name} heat and vapour rejection`, 'cooling', [b.cx, 0, b.cz - 108], [30, 38, 24], {
      ...common,
      facts: ['cooling-type'],
      note: 'The residual water vapour from the evaporative-assisted stage. Where this plume is visible, and how large it is, is entirely a function of weather and load. Everything about the geometry here is DERIVED.',
    });

    /* one electrical room set per building, serving four halls */
    add(`${b.name}.sub`, 'unit-substation', `${b.name} unit substations`, 'power', [b.cx - 118, 0, b.cz - 28], [9, 5, 11], {
      ...common,
      offsets: [
        [-58, 0],
        [58, 0],
      ],
      build: [b.fitout[0], b.fitout[1] + 1],
    });
    add(`${b.name}.upsA`, 'ups', `${b.name} UPS A`, 'power', [b.cx - 52, 0, b.cz - 28], [15, 2.8, 18], {
      ...common,
      build: [b.fitout[0], b.fitout[1] + 1],
      label3d: true,
    });
    add(`${b.name}.upsB`, 'ups', `${b.name} UPS B`, 'power', [b.cx - 22, 0, b.cz - 28], [15, 2.8, 18], {
      ...common,
      build: [b.fitout[0], b.fitout[1] + 1],
      label3d: true,
    });
    add(`${b.name}.batt`, 'battery', `${b.name} battery strings`, 'power', [b.cx + 16, 0, b.cz - 28], [15, 2.8, 15], {
      ...common,
      build: [b.fitout[0], b.fitout[1] + 1],
      facts: ['batteries'],
      note: 'PUBLIC FACT: batteries are present and they are a fire hazard. Size, chemistry and autonomy are not published.',
    });
    add(`${b.name}.lv`, 'lv-switchboard', `${b.name} LV distribution`, 'power', [b.cx + 62, 0, b.cz - 28], [5, 2.6, 16], {
      ...common,
      build: [b.fitout[0] + 1, b.fitout[1] + 2],
    });

    /* the four halls */
    for (let hi = 0; hi < 4; hi++) {
      const hallId = b.halls[hi];
      const [hx, hz] = hallCentre(b, hi + 1);
      const hcommon = { building: b.n, hall: hi + 1 };
      /* Hall fit-out sits inside the building's own fit-out window, ending no later
         than handover. This is what makes the construction scrub honest: a
         building cannot be shown carrying IT load before its fit-out phase, and
         it cannot still be installing racks after it has been handed over. */
      const fitStart = b.fitout[0];
      const fitEnd = b.fitout[1];
      /* At least two phases wide, so the scrub shows the work happening rather
         than snapping. Never later than the handover. */
      const fit: [number, number] = [fitStart, Math.max(fitStart + 1, fitEnd)];

      /* Hall content is fitted out inside the building's own fit-out window, so
         a building cannot carry IT load before its fit-out phase has arrived and
         cannot still be installing racks after it has been handed over. */
      add(`${hallId}.floor`, 'hall-floor', `${HALL_NAME[hallId]} white space`, 'site', [hx, 0.2, hz], [64, 0.4, 46], {
        ...hcommon,
        build: fit,
        facts: ['hall-size'],
      });
      add(`${hallId}.rack`, 'rack', `${HALL_NAME[hallId]} racks, ${RACKS_PER_HALL}`, 'data', [hx, 0, hz], [0.66, 2.1, 1.15], {
        ...hcommon,
        build: fit,
        offsets: RACK_OFFSETS,
        label3d: true,
        facts: ['rack-count'],
      });
      add(`${hallId}.server`, 'server', `${HALL_NAME[hallId]} IT load`, 'data', [hx, 0, hz], [0.28, 0.52, 1.02], {
        ...hcommon,
        build: [Math.min(fit[1], b.handover), Math.max(Math.min(fit[1], b.handover) + 1, b.handover)],
        offsets: SERVER_OFFSETS,
      });
      add(`${hallId}.switch`, 'network-switch', `${HALL_NAME[hallId]} fabric`, 'data', [hx, 0, hz], [0.52, 0.42, 0.92], {
        ...hcommon,
        build: fit,
        offsets: Array.from({ length: HALL_RACK_ROWS }, (_, r) => [rowX(r), -20] as [number, number]).concat(
          Array.from({ length: HALL_RACK_ROWS }, (_, r) => [rowX(r), 20] as [number, number]),
        ),
      });
      add(`${hallId}.storage`, 'storage', `${HALL_NAME[hallId]} storage`, 'data', [hx, 0, hz], [4.4, 2.3, 6.4], {
        ...hcommon,
        build: fit,
        offsets: offsetsGrid(4, 2, 12, 10),
      });
      add(`${hallId}.pdu`, 'pdu', `${HALL_NAME[hallId]} rack PDUs`, 'power', [hx, 0, hz], [0.62, 2, 1.02], {
        ...hcommon,
        build: fit,
        offsets: Array.from({ length: HALL_RACK_ROWS }, (_, r) => [rowX(r) - 0.95, -20] as [number, number]).concat(
          Array.from({ length: HALL_RACK_ROWS }, (_, r) => [rowX(r) + 0.95, 20] as [number, number]),
        ),
      });
      add(`${hallId}.bus`, 'busway', `${HALL_NAME[hallId]} busway`, 'power', [hx, 0, hz], [3.2, 1.2, 44], {
        ...hcommon,
        build: fit,
        offsets: Array.from({ length: HALL_RACK_ROWS }, (_, r) => [rowX(r), 0] as [number, number]),
      });
      add(`${hallId}.crah`, 'crah', `${HALL_NAME[hallId]} air cooling`, 'cooling', [hx, 0, hz], [2.2, 2.6, 2.6], {
        ...hcommon,
        build: [b.fitout[0], fit[0]],
        offsets: offsetsGrid(6, 2, 9, 34),
        facts: ['cooling-type'],
        note: 'PUBLIC FACT: this campus is indirectly air cooled, so the heat leaves the racks into air inside the hall. There is no coolant loop in the hall as delivered. The comparison with a liquid-cooled hall is the AI Evolution mode.',
      });

      /* AI retrofit kit: absent until the modelled conversion */
      add(`${hallId}.cold`, 'cold-plate', `${HALL_NAME[hallId]} cold plates`, 'cooling', [hx, 0, hz], [0.36, 0.16, 1.1], {
        ...hcommon,
        build: [23, 23],
        retrofit: true,
        offsets: RACK_OFFSETS,
        facts: ['ai-rack'],
      });
      add(`${hallId}.cdu`, 'cdu', `${HALL_NAME[hallId]} coolant distribution units`, 'cooling', [hx, 0, hz], [1.2, 2.3, 1.05], {
        ...hcommon,
        build: [23, 23],
        retrofit: true,
        offsets: Array.from({ length: HALL_RACK_ROWS }, (_, r) => [rowX(r) + 1.3, -22] as [number, number]),
        facts: ['ai-cdu'],
      });
    }
  }

  /* ---- site-wide infrastructure ---- */
  add('site.road', 'road', 'Internal road network', 'site', [0, 0, 0], [1020, 0.4, 940], {
    label3d: true,
    facts: ['campus-roads'],
    note: 'PUBLIC FACT: internal roads, parking and a guard house are part of the consented campus, and phase 1 delivered all internal and external roads and car parking. There is no public access into the development.',
  });
  add('site.gate', 'gatehouse', 'Gatehouse and vehicle screening', 'security', [-60, 0, SITE.gateZ], [24, 5, 15], { label3d: true });
  add('site.fence', 'fence', 'Perimeter fence and bund', 'security', [0, 0, 0], [1020, 3, 940], {
    facts: ['campus-roads'],
  });
  add('site.admin', 'admin', 'Administration and office building', 'site', [-470, 0, 60], [66, 8, 28], {
    label3d: true,
    facts: ['admin-buildings'],
    note: 'PUBLIC FACT: an administration building with staff welfare is part of the consented campus, and RA180671 consents a further administration and office building.',
  });
  add('site.admin2', 'admin', 'Expansion administration building', 'site', [-470, 0, -150], [60, 8, 26], {
    label3d: true,
    facts: ['admin-buildings'],
    build: [17, 21],
  });
  add('site.fire', 'fire', 'Fire water tanks and pump house', 'fire', [-470, 0, 300], [32, 9, 24], { label3d: true });
  add('site.wtp', 'water-treatment', 'Cooling water treatment plant', 'water', [60, 0, 340], [48, 8, 40], {
    label3d: true,
    facts: ['cooling-type'],
    note: 'DERIVED: an evaporative-assisted circuit concentrates solids as it evaporates, so it needs make-up, filtration, biocide control and a controlled discharge. EPA-P1192 refers to residual cooling-water discharge; no volumes are published.',
  });
  add('site.potable', 'potable-tank', 'Potable water tanks', 'water', [-96, 0, 372], [24, 5, 18], { facts: ['potable'] });
  add('site.ww', 'wastewater-soakage', 'Foul treatment and soakage', 'water', [160, 0, 336], [50, 0.9, 58], {
    facts: ['wastewater'],
    note: 'TYPICAL: a campus of this size has a staffing-scale domestic flow, treated on site and discharged to ground. The consent record does not publish the flow.',
  });
  add('site.basin', 'stormwater-basin', 'Stormwater attenuation basin', 'water', [-300, -1, 360], [440, 2, 70], {
    label3d: true,
    facts: ['stormwater'],
    note: 'TYPICAL: roof and hardstand runoff is attenuated and, where it can be, reused as cooling make-up. This is the cheapest water on the site and the reason the consented site area is so large relative to the built footprint.',
  });
  add('site.watercourse', 'watercourse', 'Receiving watercourse', 'water', [-60, 0, 458], [1140, 2, 38], {
    label3d: true,
    facts: ['stormwater'],
  });
  add(
    'site.bore',
    'bore',
    'Production wellfield',
    'water',
    [330, 0, -330],
    [3.4, 1.3, 3.4],
    {
      label3d: true,
      offsets: [
        [-96, 0],
        [-48, 0],
        [0, 0],
        [48, 0],
        [96, 0],
      ],
      facts: ['groundwater'],
      note: 'TYPICAL: a wellfield sized to close the gap between evaporation and rainfall capture over a dry summer. Clonee is in a moderate rainfall catchment, so the wellfield does real work here rather than being a contingency.',
    },
  );

  add('site.ambient', 'ambient-sink', 'Atmosphere', 'cooling', [0, 150, 0], [64, 6, 64], {
    label3d: true,
    note: 'The common destination of both heat rejection problems on this site: the IT cooling plant, which carries most of its energy away by evaporating water, and the ninety generators, which radiate and exhaust to air with no water involved. This is why the campus water balance is driven by IT cooling and not by the generation plant.',
  });

  /* ---- external data arrival ---- */
  add('site.fibre', 'fibre-route', 'Optical fibre routes', 'data', [-270, 2, 330], [5, 5, 5], {
    label3d: true,
    facts: ['fibre'],
    note: 'DERIVED: unlike a campus built on a subsea cable landing, Clonee connects overland. Two diverse terrestrial routes to the meet-me rooms is the standard requirement and the standard failure mode.',
  });
  add('site.fibrehub', 'fibre-hub', 'Meet-me rooms', 'data', [-196, 0, 66], [44, 6, 28], {
    label3d: true,
    facts: ['fibre', 'meet-me'],
    note: 'PUBLIC FACT: two meet-me rooms for data connectivity per building. This model shows a campus-level pair.',
  });
  add('site.core', 'network-core', 'Campus network core', 'data', [-262, 0, 66], [26, 5, 20], { facts: ['fibre'] });

  /* ---- temporary construction works ---- */
  add('tmp.sheds', 'site-shed', 'Site establishment and welfare', 'site', [-300, 0, -330], [42, 4, 13], {
    temporary: true,
    build: [3, 12],
    offsets: [
      [0, 0],
      [58, 0],
      [116, 0],
    ],
  });
  add('tmp.sed', 'sediment-pond', 'Sediment ponds and erosion control', 'water', [-90, 0, -392], [80, 1.8, 58], {
    temporary: true,
    build: [3, 10],
    offsets: offsetsGrid(2, 3, 470, 190),
  });
  add('tmp.crane', 'tower-crane', 'Tower crane', 'site', [-312, 0, -180], [7, 70, 7], {
    temporary: true,
    build: [9, 11],
    offsets: [
      [0, -120],
      [0, 120],
    ],
  });
  add('tmp.road', 'temp-road', 'Temporary haul route', 'site', [0, 0, -424], [900, 0.3, 15], {
    temporary: true,
    build: [3, 9],
  });

  return out;
})();

export const COMPONENT_BY_ID: Record<string, CampusComponent> = Object.fromEntries(
  COMPONENTS.map((c) => [c.id, c]),
);

export function infoFor(type: string) {
  return COMPONENT_INFO[type];
}

/** Total rendered instances, for the self test. */
export function instanceCount() {
  return COMPONENTS.reduce((a, c) => a + (c.offsets?.length ?? 1), 0);
}

/* ------------------------------------------------------------------- flows */

function l(
  id: string,
  from: string,
  to: string,
  system: SystemKey,
  medium: FlowMedium,
  label: string,
  classification: Classification,
  extra: Partial<FlowLink> = {},
): FlowLink {
  return { id, from, to, system, medium, label, classification, ...extra };
}

export const FLOW_LINKS: FlowLink[] = (() => {
  const out: FlowLink[] = [];
  let n = 0;
  const id = () => `f${n++}`;
  const spineZ = 0;

  /* incoming transmission into the compound */
  out.push(l(id(), 'hv.line', 'sub.bay', 'power', 'hv', 'Transmission into the 220 kV loop-in', 'PUBLIC FACT'));
  for (let i = 0; i < 3; i++) {
    const dx = -60 + (i - 1) * 60;
    out.push(
      l(id(), 'sub.bay', 'sub.xfmr', 'power', 'hv', '220 kV bay to step-down transformer', 'TYPICAL', {
        via: [
          [SITE.sub.x + 28, 11, SITE.sub.z - 44 + i * 22],
          [SITE.sub.x - 8, 9, SITE.sub.z + 34],
        ],
      }),
    );
    void dx;
  }

  for (const b of BUILDINGS) {
    const B = b.name;

    /* MV distribution from the substation to each building */
    out.push(
      l(id(), 'sub.xfmr', `${B}.mv`, 'power', 'mv', '20 kV underground cable to the building', 'PUBLIC FACT', {
        via: [
          [SITE.sub.x - 52, -2, SITE.sub.z + 60],
          [SITE.sub.x - 70, -2, spineZ],
          [b.cx + 150, -2, spineZ],
          [b.cx + 142, -2, b.cz - 44],
        ],
      }),
    );

    /* generation as an alternate source onto the same bus */
    out.push(
      l(id(), `${B}.gen`, `${B}.gensw`, 'power', 'mv', 'Generator output to generator switchgear', 'TYPICAL', {
        via: [[b.cx, -2, b.cz - 100]],
      }),
    );
    out.push(l(id(), `${B}.gensw`, `${B}.mv`, 'power', 'mv', 'Emergency bus: generation closes onto the MV bus', 'TYPICAL'));
    out.push(l(id(), `${B}.genheat`, 'site.ambient', 'cooling', 'air', 'Engine heat to ambient, via the sets’ own radiators and exhaust', 'TYPICAL'));
    out.push(l(id(), `${B}.gen`, `${B}.genheat`, 'cooling', 'air', 'Engine heat to its own cooling systems', 'PUBLIC FACT'));

    /* cooling */
    out.push(l(id(), `${B}.hx`, `${B}.cool`, 'cooling', 'water', 'Warm water to heat rejection', 'TYPICAL'));
    out.push(l(id(), `${B}.cool`, 'site.ambient', 'cooling', 'air', 'IT cooling heat to ambient', 'TYPICAL'));
    out.push(l(id(), `${B}.plume`, 'site.ambient', 'water', 'drain', 'Evaporated water vapour to atmosphere', 'PUBLIC FACT'));
    out.push(l(id(), `${B}.cool`, `${B}.plume`, 'cooling', 'air', 'Heat and vapour rejected to atmosphere', 'PUBLIC FACT'));

    /* water */
    out.push(
      l(id(), 'site.wtp', `${B}.cool`, 'water', 'makeup', 'Treated cooling water to the loop', 'TYPICAL', {
        via: [[60, -3, 322], [b.cx, -3, 322], [b.cx, -3, b.cz - 96]],
      }),
    );
    out.push(
      l(id(), `${B}.cool`, 'site.basin', 'water', 'drain', 'Blowdown and discharge to attenuation', 'PUBLIC FACT', {
        via: [[b.cx, -3, b.cz - 120], [b.cx, -3, 330], [-300, -3, 340]],
      }),
    );

    /* electrical inside the building */
    out.push(l(id(), `${B}.mv`, `${B}.sub`, 'power', 'mv', 'MV feeder to unit substations', 'TYPICAL'));
    out.push(l(id(), `${B}.sub`, `${B}.upsA`, 'power', 'lv', 'LV to UPS A', 'TYPICAL'));
    out.push(l(id(), `${B}.sub`, `${B}.upsB`, 'power', 'lv', 'LV to UPS B', 'TYPICAL'));
    out.push(l(id(), `${B}.sub`, `${B}.lv`, 'power', 'lv', 'LV to plant and hall distribution', 'TYPICAL'));
    out.push(l(id(), `${B}.upsA`, `${B}.lv`, 'power', 'lv', 'UPS A output', 'TYPICAL'));
    out.push(l(id(), `${B}.upsB`, `${B}.lv`, 'power', 'lv', 'UPS B output', 'TYPICAL'));
    out.push(
      l(id(), `${B}.lv`, 'CLN1.h1.bus', 'power', 'lv', 'Busway distribution to the halls', 'TYPICAL', {
        via: [[b.cx + 62, 4, b.cz - 10], [b.cx - 102, 4, b.cz + 28]],
      }),
    );

    /* data */
    out.push(l(id(), 'site.core', 'CLN1.h1.switch', 'data', 'fibre', 'Core to hall fabric', 'TYPICAL', {
      via: [[-250, 4, 66], [b.cx - 102, 4, b.cz + 8], [b.cx - 102, 4, b.cz + 28]],
    }));

    for (const hallId of b.halls) {
      const h = hallId;
      out.push(l(id(), `${B}.lv`, `${h}.bus`, 'power', 'lv', 'LV distribution to hall busway', 'TYPICAL'));
      out.push(l(id(), `${h}.bus`, `${h}.pdu`, 'power', 'lv', 'Busway tap to rack PDU', 'TYPICAL'));
      out.push(l(id(), `${h}.pdu`, `${h}.rack`, 'power', 'rack', 'Rack feed, 230 V single phase', 'TYPICAL'));
      out.push(l(id(), `${h}.rack`, `${h}.server`, 'power', 'rack', 'Into the server power supplies', 'TYPICAL'));

      out.push(l(id(), `${h}.server`, `${h}.crah`, 'cooling', 'air', 'Rack air to in-hall cooling', 'PUBLIC FACT'));
      out.push(
        l(id(), `${h}.crah`, `${B}.hx`, 'cooling', 'water', 'In-hall cooling to the facility loop', 'TYPICAL', {
          via: [[b.cx - 102, 3, b.cz - 10], [b.cx, 3, b.cz - 52]],
        }),
      );

      /* the retrofit coolant loop, only meaningful after the AI conversion */
      out.push(l(id(), `${h}.server`, `${h}.cold`, 'cooling', 'coolant', 'Accelerator to cold plate', 'TYPICAL'));
      out.push(l(id(), `${h}.cold`, `${h}.cdu`, 'cooling', 'coolant', 'Warm coolant return to the CDU', 'TYPICAL', { reversed: true }));
      out.push(
        l(id(), `${h}.cdu`, `${B}.hx`, 'cooling', 'coolant', 'CDU to the facility loop', 'TYPICAL', {
          via: [[b.cx - 102, 3, b.cz - 6], [b.cx, 3, b.cz - 52]],
        }),
      );

      out.push(l(id(), 'site.core', `${h}.switch`, 'data', 'fibre', 'Core to hall fabric', 'TYPICAL'));
      out.push(l(id(), `${h}.switch`, `${h}.rack`, 'data', 'fibre', 'Top-of-rack to server', 'TYPICAL'));
      out.push(l(id(), `${h}.rack`, `${h}.storage`, 'data', 'fibre', 'Fabric to storage', 'TYPICAL'));
    }
  }

  /* water sources */
  out.push(
    l(id(), 'site.bore', 'site.wtp', 'water', 'makeup', 'Groundwater make-up to the treatment plant', 'TYPICAL', {
      via: [[330, -3, -260], [120, -3, 300], [60, -3, 320]],
    }),
  );
  out.push(l(id(), 'site.basin', 'site.wtp', 'water', 'makeup', 'Harvested stormwater to cooling make-up', 'TYPICAL', {
    via: [[-300, -3, 336], [20, -3, 344]],
  }));
  out.push(l(id(), 'site.basin', 'site.watercourse', 'water', 'drain', 'Attenuated runoff to the watercourse', 'TYPICAL', {
    via: [[-300, -3, 420], [-60, -3, 440]],
  }));
  out.push(l(id(), 'site.potable', 'site.admin', 'water', 'makeup', 'Potable supply to amenities', 'TYPICAL'));
  out.push(l(id(), 'site.admin', 'site.ww', 'water', 'drain', 'Amenities foul water to treatment', 'TYPICAL'));

  /* data entry */
  out.push(l(id(), 'site.fibre', 'site.fibrehub', 'data', 'fibre', 'Terrestrial fibre to the meet-me rooms', 'TYPICAL', {
    via: [[-270, 4, 300], [-196, 4, 90]],
  }));
  out.push(l(id(), 'site.fibrehub', 'site.core', 'data', 'fibre', 'Meet-me rooms to campus core', 'TYPICAL', {
    via: [[-214, 4, 66]],
  }));

  return out;
})();

/* ------------------------------------------------------------ helper access */

/** Canonical chains, for tours and the resilience walkthroughs. */
export const POWER_CHAIN = [
  'hv.line',
  'sub.bay',
  'sub.xfmr',
  'CLN1.mv',
  'CLN1.sub',
  'CLN1.upsA',
  'CLN1.lv',
  'CLN1.h1.bus',
  'CLN1.h1.pdu',
  'CLN1.h1.rack',
  'CLN1.h1.server',
];

export const HEAT_CHAIN = ['CLN1.h1.server', 'CLN1.h1.crah', 'CLN1.hx', 'CLN1.cool', 'site.ambient'];

export const COOLANT_CHAIN = ['CLN1.h1.server', 'CLN1.h1.cold', 'CLN1.h1.cdu', 'CLN1.hx', 'CLN1.cool'];

export const WATER_CHAIN = ['site.bore', 'site.wtp', 'CLN1.cool', 'CLN1.plume', 'site.ambient'];

export const FIBRE_CHAIN = ['site.fibre', 'site.fibrehub', 'site.core', 'CLN1.h1.switch', 'CLN1.h1.rack'];

/** The hall used by the AI retrofit narrative. */
export const RETROFIT_HALL = 'CLN2.h3';

export const componentAt = (id: string) => COMPONENT_BY_ID[id];

export function phaseName(i: number) {
  return PHASES[Math.max(0, Math.min(PHASES.length - 1, i))].name;
}

export function buildingOf(id: string) {
  const c = COMPONENT_BY_ID[id];
  return c?.building;
}

export function hallOf(id: string) {
  const c = COMPONENT_BY_ID[id];
  return c?.hall;
}
