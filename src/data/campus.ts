import { COMPONENT_INFO } from './componentInfo';
import type { Classification, SystemKey } from './types';
import { PHASES } from './phases';

export interface CampusComponent {
  id: string;
  type: string;
  label: string;
  system: SystemKey;
  /** world position in metres, y up, north = -z */
  pos: [number, number, number];
  rot: number;
  /** width, height, depth */
  size: [number, number, number];
  /** instanced repeats as [dx, dz] offsets from pos */
  offsets?: [number, number][];
  /** construction phase window [start, end] */
  build: [number, number];
  temporary?: boolean;
  module?: number;
  hall?: number;
  /** sunk into the ground / below slab */
  ground?: boolean;
  label3d?: boolean;
  facts?: string[];
  kW?: number;
  /** voltage / energy-step annotation shown in the inspector */
  voltage?: string;
  /** short clarifier shown in the inspector */
  note?: string;
}

export type FlowMedium =
  | 'hv'
  | 'mv'
  | 'lv'
  | 'rack'
  | 'coolant'
  | 'chilled'
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
  /** explicit routing waypoints */
  via?: [number, number, number][];
  /** rendered with flow direction from `to` to `from` (return legs) */
  reversed?: boolean;
}

/* ------------------------------------------------------------------ geometry */

export const SITE = {
  halfW: 350,
  halfD: 350,
  /** three module rectangles across the site, with service corridors between them */
  moduleCentres: [-209, 0, 209],
  /** half width of a module rectangle (two halls on the outside, plant inside) */
  moduleHalfW: 98,
  hallHalfW: 37,
  hallHalfD: 55,
  /** hall centre offset from the module centre */
  hallOffset: 61,
  moduleZ: [-165, 165],
  gateZ: -336,
  gxp: { x: 230, z: -255, w: 180, d: 170 },
};

export const MODULES = [
  { n: 1, id: 'M1', cx: SITE.moduleCentres[0], halls: ['M1-W', 'M1-E'] },
  { n: 2, id: 'M2', cx: SITE.moduleCentres[1], halls: ['M2-W', 'M2-E'] },
  { n: 3, id: 'M3', cx: SITE.moduleCentres[2], halls: ['M3-W', 'M3-E'] },
];

/** Hall index 1..6 in reading order, used by isolate and phasing. */
export const HALL_INDEX: Record<string, number> = {
  'M1-W': 1,
  'M1-E': 2,
  'M2-W': 3,
  'M2-E': 4,
  'M3-W': 5,
  'M3-E': 6,
};

export const HALLS = Object.keys(HALL_INDEX);

/** Synthetic module capacities: 240 MW IT is public; the split across three
 *  modules is not published, so it is modelled as an equal split (SYNTHETIC). */
export const MODULE_IT_MW: Record<number, number> = { 1: 80, 2: 80, 3: 80 };
export const HALL_IT_MW: Record<number, number> = { 1: 40, 2: 40, 3: 40, 4: 40, 5: 40, 6: 40 };

const BUILD: Record<string, [number, number]> = {
  'hv-line': [0, 0],
  'hv-tower': [13, 14],
  'gxp-platform': [8, 13],
  'gxp-transformer': [14, 14],
  'gxp-bay': [13, 14],
  'gxp-control': [14, 15],
  'mv-switchgear': [15, 16],
  'unit-substation': [21, 22],
  ups: [22, 22],
  battery: [22, 22],
  generator: [17, 17],
  'fuel-tank': [17, 18],
  'lv-switchboard': [22, 23],
  busway: [24, 24],
  pdu: [24, 25],
  'cold-plate': [29, 29],
  cdu: [25, 25],
  crah: [25, 25],
  'adiabatic-cooler': [19, 19],
  'heat-exchanger': [20, 20],
  'heat-plume': [19, 19],
  pump: [20, 20],
  reservoir: [10, 10],
  'water-treatment': [20, 21],
  bore: [5, 6],
  'potable-tank': [7, 8],
  'wastewater-soakage': [7, 8],
  'stormwater-basin': [5, 8],
  wetland: [4, 4],
  'fibre-route': [27, 27],
  'landing-station': [26, 27],
  'network-core': [27, 27],
  'network-switch': [29, 29],
  rack: [29, 29],
  'gpu-server': [29, 29],
  storage: [29, 29],
  'data-hall': [10, 12],
  'module-plant': [8, 11],
  road: [2, 9],
  gatehouse: [9, 12],
  fence: [5, 9],
  admin: [10, 14],
  fire: [28, 28],
  'site-shed': [1, 14],
  dewatering: [6, 6],
  'sediment-pond': [3, 10],
  'tower-crane': [11, 13],
  'temp-road': [2, 9],
};

function offsetsGrid(cols: number, rows: number, stepX: number, stepZ: number): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push([(c - (cols - 1) / 2) * stepX, (r - (rows - 1) / 2) * stepZ]);
  }
  return out;
}

/** 14 generators: two rows of seven, 3.2 MW each = 44.8 MW per block. */
const GEN_OFFSETS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) out.push([(r - 0.5) * 32, (i - 3) * 15]);
  return out;
})();
/** Belly tanks sit between the two generator rows, interleaved along the block. */
const FUEL_OFFSETS: [number, number][] = Array.from({ length: 14 }, (_, i) => [0, (i - 6.5) * 7.5]);

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

  /* ---- context and incoming supply ---- */
  add('hv.line', 'hv-line', 'Incoming HV transmission', 'power', [280, 36, -356], [900, 1, 1], {
    label3d: true,
    facts: ['grid-voltage'],
    note: 'Existing circuits crossing the north-east corner of the site.',
  });
  for (let i = 0; i < 4; i++) {
    add(`gxp.tower${i + 1}`, 'hv-tower', `Line tower ${i + 1}`, 'power', [150 + i * 46, 0, -352], [10, 50, 10], {
      facts: ['towers'],
    });
  }

  /* ---- grid exit point ---- */
  add('gxp.platform', 'gxp-platform', 'GXP platform and enclosure', 'power', [SITE.gxp.x, 0, SITE.gxp.z], [SITE.gxp.w, 1.2, SITE.gxp.d], {
    label3d: true,
    facts: ['gxp-area'],
  });
  add('gxp.xfmr', 'gxp-transformer', 'GXP power transformer', 'power', [SITE.gxp.x - 40, 0, SITE.gxp.z], [14, 12, 18], {
    label3d: true,
    offsets: [
      [0, -46],
      [0, 0],
      [0, 46],
    ],
    facts: ['gxp-area'],
    voltage: 'HV -> MV (typical 220/110 kV class down to 33 kV)',
    note: 'Count and ratings are TYPICAL: the public record says the substation includes transformers but publishes no schedule.',
  });
  add('gxp.bay', 'gxp-bay', 'HV switchyard bay and gantry', 'power', [SITE.gxp.x + 50, 0, SITE.gxp.z - 44], [16, 20, 30], {
    label3d: true,
    offsets: [
      [0, 0],
      [0, 44],
      [0, 88],
    ],
  });
  add('gxp.ctrl', 'gxp-control', 'Substation control building', 'power', [SITE.gxp.x - 30, 0, SITE.gxp.z - 60], [16, 6, 22], {
    note: 'Public fact: substation buildings are under 10 m tall.',
  });

  /* ---- modules, halls and their plant ---- */
  for (const mod of MODULES) {
    const cx = mod.cx;
    add(`${mod.id}.zone`, 'module-plant', `Module ${mod.n} plant zone`, 'site', [cx, 0, 0], [48, 0.5, 330], {
      module: mod.n,
      label3d: true,
    });
    add(`${mod.id}.cool`, 'adiabatic-cooler', 'Adiabatic heat rejection', 'cooling', [cx, 0, -140], [9, 11, 10], {
      module: mod.n,
      offsets: offsetsGrid(4, 2, 11, 14),
      label3d: true,
      facts: ['cooling-type'],
      note: 'PUBLIC FACT: evaporative/adiabatic plant with membrane spray cooling to 15-20 C. TYPICAL: unit size, count and layout.',
    });
    add(`${mod.id}.pump`, 'pump', 'Cooling water pumps', 'cooling', [cx, 0, -112], [4, 2.4, 4], {
      module: mod.n,
      offsets: offsetsGrid(3, 2, 11, 9),
    });
    add(`${mod.id}.mv`, 'mv-switchgear', `Module ${mod.n} MV switchgear`, 'power', [cx, 0, 0], [40, 6, 14], {
      module: mod.n,
      label3d: true,
      note: 'TYPICAL: dual incomer with split bus sections and per-hall feeders.',
    });
    add(`${mod.id}.hx`, 'heat-exchanger', 'Heat exchanger skids', 'cooling', [cx, 0, 130], [10, 5, 16], {
      module: mod.n,
      offsets: offsetsGrid(3, 1, 16, 1),
      facts: ['cooling-type'],
    });
    add(`${mod.id}.plume`, 'heat-plume', 'Heat rejection to atmosphere', 'cooling', [cx, 0, -152], [26, 34, 22], {
      module: mod.n,
      facts: ['cooling-type'],
      note: 'PUBLIC FACT: the evaporative process discharges water vapour; the consent decision records that vapour may be visible near the site in some conditions. Everything about the geometry of this plume is SIMPLIFIED.',
    });

    for (const hallId of mod.halls) {
      const hn = HALL_INDEX[hallId];
      const side = hallId.endsWith('W') ? -1 : 1;
      const hx = cx + side * SITE.hallOffset;
      const itMw = HALL_IT_MW[hn];
      const common = { hall: hn, module: mod.n };

      add(`${hallId}.hall`, 'data-hall', `Data hall ${hn} (${itMw} MW IT typical)`, 'site', [hx, 0, 0], [74, 12, 110], {
        ...common,
        label3d: true,
        facts: ['halls', 'hall-height'],
        note: 'PUBLIC FACT: about 8,210 m2 footprint in phase 1, 12 m tall, halls on the outer sides of each module rectangle.',
      });
      add(`${hallId}.res`, 'reservoir', `Cooling water reservoir ${hn}`, 'water', [hx, -6, 0], [70, 8, 104], {
        ...common,
        ground: true,
        facts: ['water-storage'],
        note: 'PUBLIC FACT: sealed reservoirs 1.5-2.0 m below ground level beneath the buildings, roughly 75,000 m3 across the site.',
      });

      /* generation: one 14-set block per hall, inside the module rectangle */
      add(`${hallId}.gen`, 'generator', `Generator block ${hn} (14 x 3.2 MW)`, 'power', [cx, 0, -62 * side], [9, 5, 14], {
        ...common,
        offsets: GEN_OFFSETS,
        label3d: true,
        facts: ['generators', 'generator-heat'],
        kW: 3.2 * 14,
        note: 'PUBLIC FACT: 84 sets of 3,200 kWe in six blocks of 14. TYPICAL: one block per hall, adjacent, inside the rectangle.',
      });
      add(`${hallId}.fuel`, 'fuel-tank', 'Fuel tanks and bunding', 'power', [cx, 0, -62 * side], [7, 3.4, 10], {
        ...common,
        offsets: FUEL_OFFSETS,
        facts: ['generators'],
        note: 'PUBLIC FACT: 10,000 L belly tank per set, 840,000 L total, individually refuelled by tanker; each block bundled to a full-retention separator with automatic shutoff.',
      });

      /* electrical rooms on the outer wall */
      add(`${hallId}.sub`, 'unit-substation', `Unit substation ${hn}`, 'power', [hx + side * 29, 0, 44], [7, 5, 9], common);
      add(`${hallId}.upsA`, 'ups', `UPS ${hn}A`, 'power', [hx + side * 29, 0, -14], [13, 2.6, 16], {
        ...common,
        label3d: true,
      });
      add(`${hallId}.upsB`, 'ups', `UPS ${hn}B`, 'power', [hx + side * 29, 0, 4], [13, 2.6, 16], common);
      add(`${hallId}.batt`, 'battery', `Battery strings ${hn}`, 'power', [hx + side * 29, 0, 22], [13, 2.6, 14], {
        ...common,
        note: 'PUBLIC FACT: batteries exist and are a fire hazard. Size and autonomy are not published.',
      });
      add(`${hallId}.lv`, `lv-switchboard`, `LV distribution ${hn}`, 'power', [hx + side * 33, 0, -34], [4, 2.4, 14], common);

      /* floor content */
      /** 12 rows of 44 cabinets: 528 racks per hall, laid out to fill the floor. */
      const ROWS = 12;
      const COLS = 44;
      const rowX = (r: number) => (r - (ROWS - 1) / 2) * 2.0;
      const colZ = (c: number) => (c - (COLS - 1) / 2) * 1.4;
      const rackOffsets: [number, number][] = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) rackOffsets.push([rowX(r), colZ(c)]);
      add(`${hallId}.rack`, `rack`, `Racks ${hn} (528 typical)`, 'data', [hx - side * 6, 0, 0], [0.7, 2.1, 1.2], {
        ...common,
        label3d: true,
        offsets: rackOffsets,
      });
      const gpuOffsets: [number, number][] = [];
      for (const [x, z] of rackOffsets) gpuOffsets.push([x - 0.35, z], [x + 0.35, z]);
      add(`${hallId}.gpu`, 'gpu-server', `Accelerator servers ${hn}`, 'data', [hx - side * 6, 0, 0], [0.3, 0.5, 1.05], {
        ...common,
        offsets: gpuOffsets,
      });
      add(`${hallId}.cold`, 'cold-plate', 'Cold plates and rack manifolds', 'cooling', [hx - side * 6, 0, 0], [0.4, 0.14, 1.1], {
        ...common,
        offsets: rackOffsets.map(([x, z]) => [x, z] as [number, number]),
        facts: ['cooling-type'],
      });
      add(`${hallId}.switch`, 'network-switch', `Fabric leaf switches ${hn}`, 'data', [hx - side * 6, 0, 0], [0.5, 0.4, 0.9], {
        ...common,
        offsets: Array.from({ length: ROWS }, (_, r) => [rowX(r), -34] as [number, number]).concat(
          Array.from({ length: ROWS }, (_, r) => [rowX(r), 34] as [number, number]),
        ),
      });
      add(`${hallId}.pdu`, 'pdu', `Rack PDUs ${hn}`, 'power', [hx - side * 6, 0, 0], [0.6, 2, 1.0], {
        ...common,
        offsets: Array.from({ length: ROWS }, (_, r) => [rowX(r) - 0.9, -34] as [number, number]).concat(
          Array.from({ length: ROWS }, (_, r) => [rowX(r) + 0.9, 34] as [number, number]),
        ),
      });
      add(`${hallId}.bus`, `busway`, `Busway ${hn}`, 'power', [hx - side * 6, 0, 0], [3, 1.1, 96], {
        ...common,
        offsets: Array.from({ length: ROWS }, (_, r) => [rowX(r), 0] as [number, number]),
      });
      add(`${hallId}.cdu`, 'cdu', `CDUs ${hn}`, 'cooling', [hx - side * 6, 0, 0], [1.1, 2.2, 1.0], {
        ...common,
        offsets: Array.from({ length: ROWS }, (_, r) => [rowX(r) + 1.2, -36] as [number, number]).concat(
          Array.from({ length: ROWS }, (_, r) => [rowX(r) + 1.2, 36] as [number, number]),
        ),
      });
      add(`${hallId}.crah`, 'crah', 'In-row cooling units', 'cooling', [hx - side * 6, 0, 0], [1.8, 2.4, 2.4], {
        ...common,
        offsets: Array.from({ length: 6 }, (_, r) => [(r - 2.5) * 8, -40] as [number, number]).concat(
          Array.from({ length: 6 }, (_, r) => [(r - 2.5) * 8, 40] as [number, number]),
        ),
      });
      add(`${hallId}.storage`, 'storage', `Storage pods ${hn}`, 'data', [hx - side * 6, 0, 46], [4, 2.2, 6], {
        ...common,
        offsets: offsetsGrid(4, 2, 8, 9),
      });
    }
  }

  /* ---- site infrastructure ---- */
  add('site.road', 'road', 'Internal road network', 'site', [0, 0, 0], [700, 0.4, 700], {
    label3d: true,
    facts: ['earthworks'],
    note: 'PUBLIC FACT: internal roads encircle the buildings and run between modules; no public access into the development.',
  });
  add('site.gate', 'gatehouse', 'Gatehouse and screening', 'security', [-104, 0, -336], [22, 5, 14], { label3d: true });
  add('site.fence', 'fence', 'Perimeter fence and bund', 'security', [0, 0, 0], [700, 3, 700], {
    facts: ['earthworks'],
    note: 'PUBLIC FACT: perimeter fencing plus a bund built from site-won material as noise and visual screening.',
  });
  add('site.log', 'admin', 'Logistics and workshop', 'site', [-284, 0, -300], [44, 8, 30], { facts: ['ops-staffing'] });
  add('site.admin', 'admin', 'Operations and support building', 'site', [-90, 0, -292], [60, 7, 26], {
    label3d: true,
    facts: ['ops-staffing'],
  });
  add('site.fire', 'fire', 'Fire water tanks and pump house', 'fire', [10, 0, -292], [30, 8, 22], { label3d: true });
  add('site.wtp', 'water-treatment', 'Cooling water treatment plant', 'water', [150, 0, 236], [46, 7, 40], {
    label3d: true,
    facts: ['cooling-type'],
  });
  add('site.potable', 'potable-tank', 'Potable water tanks', 'water', [40, 0, 258], [22, 5, 16], { facts: ['potable'] });
  add('site.ww', 'wastewater-soakage', 'Wastewater treatment and soakage field', 'water', [190, 0, 250], [50, 0.8, 60], {
    facts: ['wastewater'],
  });
  add('site.basin', 'stormwater-basin', 'Stormwater basin and swales', 'water', [-80, -1, 300], [440, 2, 70], {
    label3d: true,
    facts: ['stormwater'],
  });
  add('site.wetland', 'wetland', 'Wetland interface and recharge trench', 'water', [30, 0, 440], [500, 2, 150], {
    label3d: true,
    facts: ['wetland'],
  });
  add(
    'site.bore',
    'bore',
    'Production bores (5 typical)',
    'water',
    [-290, 0, -190],
    [3, 1.2, 3],
    {
      label3d: true,
      offsets: [
        [-200, 0],
        [-100, 0],
        [0, 0],
        [100, 0],
        [200, 0],
      ],
      facts: ['groundwater-take'],
      note: 'PUBLIC FACT: a bore field of four to five production bores, up to 7 L/s total, with a pumping test as a condition of consent.',
    },
  );
  add('site.landing', 'landing-station', 'Cable landing station', 'data', [-286, 0, 236], [56, 9, 44], {
    label3d: true,
    facts: ['fibre'],
    note: 'PUBLIC FACT: a landing station on the campus site capable of serving up to three submarine cables.',
  });
  add('site.core', 'network-core', 'Campus network core', 'data', [-180, 0, 250], [24, 5, 18], { facts: ['fibre'] });
  add('site.fibre', 'fibre-route', 'Subsea cable and terrestrial routes', 'data', [-286, 2, 236], [4, 4, 4], {
    label3d: true,
    facts: ['fibre'],
    note: 'PUBLIC FACT: submarine cable from Australia, landfall at a southern beach, two diverse terrestrial routes to the site, ring topology.',
  });

  /* ---- temporary construction works ---- */
  add('tmp.sheds', 'site-shed', 'Site establishment and welfare', 'site', [-250, 0, -200], [40, 4, 12], {
    temporary: true,
    offsets: [
      [0, 0],
      [56, 0],
      [112, 0],
    ],
  });
  add('tmp.dewater', 'dewatering', 'Dewatering and settlement monitoring', 'site', [0, 0, 0], [600, 0.3, 300], {
    temporary: true,
    facts: ['groundwater-take'],
    note: 'PUBLIC FACT: temporary dewatering up to 60 L/s for up to two months, with settlement monitoring in the ground settlement management plan.',
  });
  add('tmp.sed', 'sediment-pond', 'Sediment ponds and erosion controls', 'water', [0, 0, -110], [80, 1.6, 60], {
    temporary: true,
    offsets: offsetsGrid(2, 3, 480, 200),
    note: 'PUBLIC FACT: an erosion and sediment control plan was certified for construction, with wetland protection to the south.',
  });
  add('tmp.crane', 'tower-crane', 'Tower crane', 'site', [-209, 0, 0], [6, 68, 6], {
    temporary: true,
    offsets: [
      [0, -70],
      [0, 70],
    ],
  });
  add('tmp.road', 'temp-road', 'Temporary haul route', 'site', [0, 0, 0], [660, 0.3, 14], { temporary: true });

  return out;
})();

export const COMPONENT_BY_ID: Record<string, CampusComponent> = Object.fromEntries(
  COMPONENTS.map((c) => [c.id, c]),
);

export function infoFor(type: string) {
  return COMPONENT_INFO[type];
}

/** total rendered instances, for the self test */
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

  /* incoming HV */
  out.push(l(id(), 'hv.line', 'gxp.bay', 'power', 'hv', 'Transmission into the grid exit point', 'PUBLIC FACT'));
  for (let i = 0; i < 3; i++) {
    const z = SITE.gxp.z - 60 + (i - 1) * 110;
    out.push(
      l(id(), 'gxp.bay', 'gxp.xfmr', 'power', 'hv', 'HV bay to transformer', 'TYPICAL', {
        via: [
          [SITE.gxp.x + 45, 9, z],
          [SITE.gxp.x - 32, 7, z],
        ],
      }),
    );
  }

  for (const mod of MODULES) {
    const m = mod.id;
    const cx = mod.cx;
    for (let i = 0; i < 3; i++) {
      const z = SITE.gxp.z - 60 + (i - 1) * 110;
      out.push(
        l(id(), 'gxp.xfmr', `${m}.mv`, 'power', 'mv', 'Campus MV distribution', 'TYPICAL', {
          via: [
            [SITE.gxp.x - 55, 3, z],
            [SITE.gxp.x - 95, 3, -175],
            [cx, 3, -175],
          ],
        }),
      );
    }
    out.push(l(id(), `${m}.hx`, `${m}.cool`, 'cooling', 'chilled', 'Warm water to heat rejection', 'TYPICAL'));
    out.push(l(id(), `${m}.cool`, `${m}.plume`, 'cooling', 'air', 'Heat and vapour rejected to atmosphere', 'PUBLIC FACT'));

    for (const hallId of mod.halls) {
      const h = hallId;
      const side = hallId.endsWith('W') ? -1 : 1;
      out.push(l(id(), `${m}.mv`, `${h}.sub`, 'power', 'mv', 'MV feeder to unit substation', 'TYPICAL'));
      out.push(l(id(), `${h}.sub`, `${h}.upsA`, 'power', 'lv', 'LV to UPS A', 'TYPICAL'));
      out.push(l(id(), `${h}.sub`, `${h}.upsB`, 'power', 'lv', 'LV to UPS B', 'TYPICAL'));
      out.push(l(id(), `${h}.sub`, `${h}.lv`, 'power', 'lv', 'LV to plant distribution', 'TYPICAL'));
      out.push(l(id(), `${h}.upsA`, `${h}.lv`, 'power', 'lv', 'UPS A output', 'TYPICAL'));
      out.push(l(id(), `${h}.upsB`, `${h}.lv`, 'power', 'lv', 'UPS B output', 'TYPICAL'));
      out.push(
        l(id(), `${h}.lv`, `${h}.bus`, 'power', 'lv', 'Busway distribution', 'TYPICAL', {
          via: [[cx + side * SITE.moduleHalfW + side * 36, 6, -34]],
        }),
      );
      out.push(l(id(), `${h}.bus`, `${h}.pdu`, 'power', 'lv', 'Busway tap to rack PDU', 'TYPICAL'));
      out.push(l(id(), `${h}.pdu`, `${h}.rack`, 'power', 'rack', 'Rack feed (230 V single phase)', 'TYPICAL'));
      out.push(l(id(), `${h}.rack`, `${h}.gpu`, 'power', 'rack', 'Into the server power supplies', 'TYPICAL'));

      out.push(l(id(), `${h}.gpu`, `${h}.cold`, 'cooling', 'coolant', 'Accelerator to cold plate', 'PUBLIC FACT'));
      out.push(
        l(id(), `${h}.cold`, `${h}.cdu`, 'cooling', 'coolant', 'Warm coolant return from the rack', 'PUBLIC FACT', {
          reversed: true,
        }),
      );
      out.push(
        l(id(), `${h}.cdu`, `${m}.hx`, 'cooling', 'coolant', 'CDU to facility water loop', 'TYPICAL', {
          via: [[cx, 3, 60 * side], [cx, 3, 130]],
        }),
      );
      out.push(l(id(), `${h}.gpu`, `${h}.crah`, 'cooling', 'air', 'Air path heat (minority of load)', 'PUBLIC FACT'));
      out.push(
        l(id(), `${h}.crah`, `${m}.hx`, 'cooling', 'chilled', 'In-row cooling to facility loop', 'TYPICAL', {
          via: [[cx, 3, 60 * side], [cx, 3, 130]],
        }),
      );

      out.push(l(id(), `${h}.hall`, `${h}.res`, 'water', 'water', 'Roof rainwater to storage', 'PUBLIC FACT'));
      out.push(
        l(id(), `${h}.res`, `${m}.cool`, 'water', 'makeup', 'Cooling water make-up from storage', 'PUBLIC FACT', {
          via: [[cx, -3, 90], [cx, -3, -140]],
        }),
      );
      out.push(
        l(id(), `${m}.cool`, `${h}.res`, 'water', 'drain', 'Overflow and blowdown to basin', 'TYPICAL', {
          via: [[cx, -3, -170]],
        }),
      );

      out.push(l(id(), 'site.core', `${h}.switch`, 'data', 'fibre', 'Core to hall fabric', 'TYPICAL'));
      out.push(l(id(), `${h}.switch`, `${h}.rack`, 'data', 'fibre', 'Top-of-rack to server', 'TYPICAL'));
      out.push(l(id(), `${h}.rack`, `${h}.storage`, 'data', 'fibre', 'Fabric to storage pods', 'TYPICAL'));
    }
  }

  const boreTargets = ['M1-W.res', 'M2-W.res', 'M3-W.res', 'M2-E.res', 'M3-E.res'];
  boreTargets.forEach((target, i) => {
    out.push(
      l(id(), 'site.bore', target, 'water', 'makeup', 'Groundwater make-up to storage', 'PUBLIC FACT', {
        via: [[-250, -3, -190 + i * 95], [-120, -3, -190 + i * 95]],
      }),
    );
  });
  out.push(l(id(), 'site.basin', 'M1-W.res', 'water', 'water', 'Treated stormwater to cooling water', 'PUBLIC FACT'));
  out.push(l(id(), 'site.basin', 'site.wetland', 'water', 'drain', 'Soakage recharge to wetland', 'PUBLIC FACT'));
  out.push(l(id(), 'site.potable', 'site.admin', 'water', 'makeup', 'Potable supply to amenities', 'PUBLIC FACT'));
  out.push(l(id(), 'site.potable', 'site.ww', 'water', 'drain', 'Amenities wastewater to treatment', 'PUBLIC FACT'));
  out.push(
    l(id(), 'site.wtp', 'M2-E.res', 'water', 'makeup', 'Treated cooling water to loop', 'PUBLIC FACT', {
      via: [[150, -3, 200], [60, -3, 120]],
    }),
  );

  out.push(l(id(), 'site.fibre', 'site.landing', 'data', 'fibre', 'Subsea cable landfall to landing station', 'PUBLIC FACT'));
  out.push(l(id(), 'site.landing', 'site.core', 'data', 'fibre', 'Landing station to campus core', 'PUBLIC FACT'));

  return out;
})();

/* ------------------------------------------------------------ helper access */

/** Canonical "how does electricity reach a GPU" chain, for tours. */
export const POWER_CHAIN = [
  'hv.line',
  'gxp.bay',
  'gxp.xfmr',
  'M1.mv',
  'M1-W.sub',
  'M1-W.upsA',
  'M1-W.lv',
  'M1-W.bus',
  'M1-W.pdu',
  'M1-W.rack',
  'M1-W.gpu',
];

export const HEAT_CHAIN = ['M1-W.gpu', 'M1-W.cold', 'M1-W.cdu', 'M1.hx', 'M1.cool'];

export const FIBRE_CHAIN = ['site.fibre', 'site.landing', 'site.core', 'M1-W.switch', 'M1-W.rack'];

export const componentAt = (id: string) => COMPONENT_BY_ID[id];

export function phaseName(i: number) {
  return PHASES[Math.max(0, Math.min(PHASES.length - 1, i))].name;
}