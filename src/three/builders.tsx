import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { CampusComponent } from '../data/campus';

/* --------------------------------------------------------------- primitives */

export interface ShapeProps {
  c: CampusComponent;
  color: string;
  opacity: number;
  /**
   * How prominent this component is in the current view, 0..1. Distinct from
   * opacity: a dimmed component is still fully opaque, and shapes that vary
   * their saturation by prominence need this rather than a decoded opacity.
   */
  dim: number;
  emissive?: string;
  roofOff: boolean;
  cutaway: boolean;
  highlight: boolean;
}

function boxArgs(size: [number, number, number]): [number, number, number] {
  return [size[0], size[1], size[2]];
}

/**
 * Blend a colour toward another.
 *
 * Used where an equipment mass is numerous enough that its full system colour
 * would dominate the campus view. The system colour is still the source, so the
 * equipment still reads as belonging to its system without being the loudest
 * thing on screen.
 */
function mixToward(color: string, toward: string, amount: number): string {
  const a = new THREE.Color(color);
  const b = new THREE.Color(toward);
  return `#${a.lerp(b, amount).getHexString()}`;
}

/**
 * A standard opaque-ish solid.
 *
 * One material instance per component, mutated in place on colour and opacity
 * changes. Rebuilding the material on every render is what makes a scene with a
 * few hundred instanced meshes stutter when the explode slider moves.
 */
export function Solid({
  size,
  color,
  opacity = 1,
  y = 0,
  x = 0,
  z = 0,
  emissive,
  onClick,
  onOver,
  onOut,
  highlight,
}: {
  size: [number, number, number];
  color: string;
  opacity?: number;
  y?: number;
  x?: number;
  z?: number;
  emissive?: string;
  onClick?: (e: any) => void;
  onOver?: (e: any) => void;
  onOut?: (e: any) => void;
  highlight?: boolean;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: opacity < 1,
        opacity,
        emissive: new THREE.Color(emissive ?? '#000000'),
        emissiveIntensity: emissive ? 1.4 : 0,
        roughness: 0.78,
        metalness: 0.05,
        depthWrite: opacity > 0.6,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const edges = useMemo(
    () => (highlight ? new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0], size[1], size[2])) : null),
    [highlight, size[0], size[1], size[2]],
  );
  useEffect(() => {
    mat.color.set(color);
    mat.opacity = opacity;
    mat.transparent = opacity < 1;
    mat.depthWrite = opacity > 0.6;
    mat.emissive.set(emissive ?? '#000000');
    mat.emissiveIntensity = emissive ? 1.4 : 0;
    mat.needsUpdate = true;
  }, [color, opacity, emissive, mat]);
  return (
    <mesh
      position={[x, y + size[1] / 2, z]}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
      material={mat}
    >
      <boxGeometry args={boxArgs(size)} />
      {edges && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#ffffff" />
        </lineSegments>
      )}
    </mesh>
  );
}

function Cylinder({
  r,
  h,
  color,
  opacity = 1,
  y = 0,
  x = 0,
  z = 0,
  rot,
  onClick,
  onOver,
  onOut,
  segments = 12,
  rTop,
}: {
  r: number;
  h: number;
  color: string;
  opacity?: number;
  y?: number;
  x?: number;
  z?: number;
  rot?: [number, number, number];
  onClick?: (e: any) => void;
  onOver?: (e: any) => void;
  onOut?: (e: any) => void;
  segments?: number;
  /** top radius, for the tapered forms: transformer radiators, exhaust stacks */
  rTop?: number;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: opacity < 1,
        opacity,
        roughness: 0.7,
        metalness: 0.1,
        depthWrite: opacity > 0.6,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    mat.color.set(color);
    mat.opacity = opacity;
    mat.transparent = opacity < 1;
    mat.depthWrite = opacity > 0.6;
    mat.needsUpdate = true;
  }, [color, opacity, mat]);
  return (
    <mesh
      position={[x, y + h / 2, z]}
      rotation={rot}
      material={mat}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
    </mesh>
  );
}

export function Plane({
  size,
  color,
  opacity,
  y = 0.02,
  x = 0,
  z = 0,
  rot,
}: {
  size: [number, number];
  color: string;
  opacity: number;
  y?: number;
  x?: number;
  z?: number;
  rot?: [number, number, number];
}) {
  return (
    <mesh position={[x, y, z]} rotation={rot ?? [-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={opacity} roughness={1} />
    </mesh>
  );
}

/** Instanced boxes built as a single draw call. */
export function InstancedBoxes({
  offsets,
  size,
  color,
  opacity = 1,
  y = 0,
  emissive,
  onClick,
  onOver,
  onOut,
}: {
  offsets: [number, number][];
  size: [number, number, number];
  color: string;
  opacity?: number;
  y?: number;
  emissive?: string;
  onClick?: (e: any) => void;
  onOver?: (e: any) => void;
  onOut?: (e: any) => void;
}) {
  const mesh = useMemo(() => {
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      transparent: opacity < 1,
      opacity,
      emissive: new THREE.Color(emissive ?? '#000000'),
      emissiveIntensity: emissive ? 1.2 : 0,
      roughness: 0.7,
      metalness: 0.05,
      depthWrite: opacity > 0.6,
    });
    const im = new THREE.InstancedMesh(g, m, Math.max(1, offsets.length));
    im.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const mat = new THREE.Matrix4();
    offsets.forEach(([x, z], i) => {
      mat.makeTranslation(x, size[1] / 2, z);
      im.setMatrixAt(i, mat);
    });
    im.count = offsets.length;
    im.computeBoundingSphere();
    return im;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size[0], size[1], size[2], offsets]);
  useEffect(() => {
    const m = mesh.material as THREE.MeshStandardMaterial;
    m.color.set(color);
    m.opacity = opacity;
    m.transparent = opacity < 1;
    m.depthWrite = opacity > 0.6;
    m.emissive.set(emissive ?? '#000000');
    m.emissiveIntensity = emissive ? 1.2 : 0;
    m.needsUpdate = true;
  }, [color, opacity, emissive, mesh]);
  return (
    <primitive
      object={mesh}
      position-y={y}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    />
  );
}

/** Flat instanced rectangles: roads, swales, field strips. */
export function InstancedPlanes({
  offsets,
  size,
  color,
  opacity = 1,
  y = 0.02,
}: {
  offsets: [number, number][];
  size: [number, number];
  color: string;
  opacity?: number;
  y?: number;
}) {
  const mesh = useMemo(() => {
    const g = new THREE.PlaneGeometry(size[0], size[1]);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity });
    const im = new THREE.InstancedMesh(g, m, Math.max(1, offsets.length));
    const mat = new THREE.Matrix4();
    offsets.forEach(([x, z], i) => {
      mat.makeTranslation(x, 0, z);
      im.setMatrixAt(i, mat);
    });
    im.count = offsets.length;
    im.computeBoundingSphere();
    return im;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size[0], size[1], offsets]);
  return <primitive object={mesh} position-y={y} />;
}

/* ------------------------------------------------------------------ shapes */

/**
 * Geometry per component type.
 *
 * The site is a real Irish hyperscale campus, so the forms matter: long low
 * bars rather than towers, a generator compound behind each bar rather than
 * between the halls, a substation that reads as a fenced electrical compound
 * rather than a building, and air-cooled plant in banks rather than towers.
 *
 * Anything a type does not need to be told apart from its neighbours is drawn
 * as a plain solid, which is also what keeps the draw-call count sane.
 */
export function Shape({
  c,
  color,
  opacity,
  dim: dimHint,
  emissive,
  roofOff,
  cutaway,
  highlight,
  onClick,
  onOver,
  onOut,
}: ShapeProps & { onClick?: (e: any) => void; onOver?: (e: any) => void; onOut?: (e: any) => void }) {
  const [w, h, d] = c.size;
  const size: [number, number, number] = [w, h, d];
  const P = { onClick, onOver, onOut };

  switch (c.type) {
    /* ------------------------------------------------------ data-storage bar */
    case 'data-hall': {
      const wallOpacity = cutaway ? 0.1 : opacity;
      return (
        <group>
          {/* plinth and slab */}
          <Solid size={[w + 5, 1.1, d + 5]} color="#4a5259" opacity={opacity * 0.9} y={0} {...P} />
          {/* the bar itself: long, low, and read as a shed rather than a tower */}
          <Solid size={[w, h, d]} color={color} opacity={wallOpacity} y={1.1} highlight={highlight} {...P} />
          {/* roof: a shallow standing-seam deck with a service walkway strip */}
          {!roofOff && !cutaway && (
            <>
              <Solid size={[w + 2.5, 0.8, d + 2.5]} color="#5f6a74" opacity={opacity} y={h + 1.1} {...P} />
              <Solid size={[w - 8, 0.35, 2.6]} color="#7b8792" opacity={opacity * 0.8} y={h + 1.9} {...P} />
            </>
          )}
          {/* rainwater capture edge, which is where a real share of cooling make-up comes from */}
          {!roofOff && !cutaway && (
            <Solid size={[w + 2, 0.3, 1.1]} color="#38bdf8" opacity={opacity * 0.6} y={h + 1.4} {...P} />
          )}
        </group>
      );
    }

    case 'building-plant': {
      /* the service corridor along the north face: a marked-out apron, not a wall */
      return (
        <group>
          <Solid size={[w, 0.35, d]} color="#3f4750" opacity={opacity * 0.85} y={0} {...P} />
          <Solid size={[w, 0.12, d * 0.12]} color={color} opacity={opacity * 0.5} y={0.4} {...P} />
        </group>
      );
    }

    case 'hall-floor': {
      return <Solid size={[w, 0.3, d]} color="#39424b" opacity={opacity * 0.95} y={0.15} {...P} />;
    }

    /* -------------------------------------------------------------- generation */
    case 'generator': {
      /* an enclosed genset: body, acoustic louvre face, and a base plinth */
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w + 1.4, 0.5, d + 1.4]} color="#39414a" opacity={opacity} y={0} {...P} />
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0.5} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z + d / 2 + 0.1] as [number, number])}
            size={[w * 0.72, h * 0.55, 0.4]}
            color="#2a3138"
            opacity={opacity}
            y={0.7}
            {...P}
          />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z - d / 2 - 0.9] as [number, number])}
            size={[0.9, 3.4, 0.9]}
            color="#525c66"
            opacity={opacity}
            y={0.5}
            {...P}
          />
        </group>
      );
    }

    case 'gen-heat-rejection': {
      /* Radiators beside each set: a tall finned face, deliberately taller than
         the enclosure so the compound reads as a heat-rejection zone.

         The colour is pulled toward the metal rather than used at full strength.
         At campus scale there are ninety of these, and at full cooling-system
         saturation a compound of small radiators reads as a field of alarm
         rather than as plant. It still takes the system colour when one system is
         isolated, because then it is the point of the view. */
      const tint = dimHint === 1 ? mixToward(color, '#6b7280', 0.55) : color;
      return (
        <group>
          <InstancedBoxes
            offsets={c.offsets ?? [[0, 0]]}
            size={[w * 1.1, h, 0.6]}
            color={tint}
            opacity={opacity}
            emissive={emissive}
            y={0.4}
            {...P}
          />
          <InstancedBoxes
            offsets={c.offsets ?? [[0, 0]]}
            size={[w * 1.14, h * 0.16, 0.8]}
            color={mixToward(tint, '#aab3bd', 0.5)}
            opacity={opacity * 0.9}
            y={0.4}
            {...P}
          />
        </group>
      );
    }

    case 'fuel-tank': {
      /* horizontal belly tanks between the generator rows, in a bunded tray */
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w, 0.6, d]} color="#4c4239" opacity={opacity * 0.9} y={0} {...P} />
          <InstancedBoxes
            offsets={c.offsets ?? [[0, 0]]}
            size={[w * 0.86, h, d * 0.8]}
            color={color}
            opacity={opacity}
            emissive={emissive}
            y={0.6}
            {...P}
          />
        </group>
      );
    }

    case 'generator-switchgear':
    case 'mv-switchgear':
    case 'lv-switchboard':
    case 'unit-substation': {
      /* switchgear lineups: a row of panels with a visible joint every few metres */
      return (
        <group>
          <Solid size={[w + 0.8, h * 0.2, d + 0.8]} color="#3a424a" opacity={opacity} y={0} {...P} />
          <Solid size={size} color={color} opacity={opacity} emissive={emissive} y={h * 0.2} highlight={highlight} {...P} />
          <Solid size={[w * 0.96, h * 0.1, 0.25]} color="#8e99a4" opacity={opacity * 0.55} y={h * 0.2 + h * 0.55} {...P} />
        </group>
      );
    }

    case 'ups': {
      /* a UPS is cabinets, so draw the cabinet joints — this is what makes the
         component read as modular equipment rather than a box */
      const bays = Math.max(3, Math.round(w / 3.2));
      return (
        <group>
          <Solid size={[w + 0.6, h * 0.15, d + 0.6]} color="#3a424a" opacity={opacity} y={0} {...P} />
          <Solid size={size} color={color} opacity={opacity} emissive={emissive} y={h * 0.15} highlight={highlight} {...P} />
          {Array.from({ length: bays }, (_, i) => (
            <Solid
              key={i}
              size={[0.18, h * 0.72, d * 0.98]}
              color="#20262c"
              opacity={opacity}
              x={-w / 2 + ((i + 0.5) * w) / bays}
              y={h * 0.2}
              {...P}
            />
          ))}
        </group>
      );
    }

    case 'battery': {
      /* battery strings: racks of cells, which is why they are a fire hazard */
      const racks = Math.max(3, Math.round(w / 2.4));
      return (
        <group>
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z] as [number, number])}
            size={[w * 0.9, 0.3, d]}
            color="#3a424a"
            opacity={opacity}
            y={0}
            {...P}
          />
          {Array.from({ length: racks }, (_, i) => (
            <Solid
              key={i}
              size={[1.9, h, d * 0.82]}
              color={color}
              opacity={opacity}
              emissive={emissive}
              x={-w / 2 + ((i + 0.5) * w) / racks}
              y={0.3}
              {...P}
            />
          ))}
        </group>
      );
    }

    /* ---------------------------------------------------------------- cooling */
    case 'air-cooler': {
      /* Indirectly air cooled plant: a V-bank in a louvred casing, in long rows.
         Drawn as a body plus a louvre face because the louvre is the interface
         with security and fire that keeps reappearing as a design conflict.

         There are twenty-four of these per building. At full cooling-system
         saturation five banks of them are the loudest thing on the campus, which
         is both visually wrong and slightly dishonest about the balance of the
         site, so the body is pulled toward the metal at campus scale and the
         louvre face keeps the identifying colour. */
      const body = dimHint === 1 ? mixToward(color, '#71797f', 0.5) : color;
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w + 1.2, 0.5, d + 1.2]} color="#3d454d" opacity={opacity} y={0} {...P} />
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={body} opacity={opacity} emissive={emissive} y={0.5} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z + d / 2 + 0.05] as [number, number])}
            size={[w * 0.94, h * 0.82, 0.3]}
            color={color}
            opacity={opacity * 0.9}
            y={0.7}
            {...P}
          />
          {/* fan deck */}
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z] as [number, number])}
            size={[w * 0.8, 0.7, d * 0.72]}
            color={mixToward(body, '#2f363d', 0.5)}
            opacity={opacity}
            y={h + 0.5}
            {...P}
          />
        </group>
      );
    }

    case 'heat-exchanger': {
      /* skids: a low frame with a bank of finned coils on top */
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w + 1, 0.6, d + 1]} color="#3d454d" opacity={opacity} y={0} {...P} />
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0.6} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z] as [number, number])}
            size={[w * 0.9, h * 0.4, d * 0.86]}
            color="#6d7883"
            opacity={opacity * 0.9}
            y={h + 0.6}
            {...P}
          />
        </group>
      );
    }

    case 'pump': {
      /* pumps read as a motor on a volute, so draw the volute wider than the motor */
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w * 1.7, h * 0.7, w * 1.7]} color={color} opacity={opacity} emissive={emissive} y={0} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z + w * 0.5] as [number, number])}
            size={[w * 0.8, h * 0.9, w * 0.8]}
            color="#7b8792"
            opacity={opacity}
            y={0}
            {...P}
          />
        </group>
      );
    }

    case 'heat-plume': {
      /* the rejector plume. Deliberately faint: it is a weather-dependent
         artefact, not a structure, and drawing it solid would assert something
         the model cannot know. */
      return (
        <group>
          <Plane size={[w, d]} color={color} opacity={opacity * 0.13} y={h * 0.34} {...P} />
          <Plane size={[w * 0.72, d * 0.72]} color="#cfe4f0" opacity={opacity * 0.09} y={h * 0.6} {...P} />
        </group>
      );
    }

    case 'crah': {
      /* in-hall air cooling: a low unit with a discharge plinth */
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w + 0.4, 0.35, d + 0.4]} color="#39424b" opacity={opacity} y={0} {...P} />
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0.35} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z] as [number, number])}
            size={[w * 0.86, 0.3, d * 0.86]}
            color="#8a949e"
            opacity={opacity * 0.7}
            y={h + 0.35}
            {...P}
          />
        </group>
      );
    }

    /* ------------------------------------------------------- AI retrofit kit */
    case 'cold-plate': {
      /* a cold plate is a plate: wide, thin, and visibly on the face of the rack */
      return (
        <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={1.05} {...P} />
      );
    }

    case 'cdu': {
      /* a coolant distribution unit: a tall cabinet with a pump bay and a
         control head, which is how you tell it from a rack PDU at a glance */
      return (
        <group>
          <Solid size={[w + 0.3, 0.3, d + 0.3]} color="#3a424a" opacity={opacity} y={0} {...P} />
          <Solid size={size} color={color} opacity={opacity} emissive={emissive} y={0.3} highlight={highlight} {...P} />
          <Solid size={[w * 0.8, 0.5, d * 1.02]} color="#22282e" opacity={opacity * 0.9} y={0.3 + h * 0.2} {...P} />
          <Solid size={[w * 0.66, 0.3, d * 0.5]} color="#38bdf8" opacity={opacity * 0.5} y={h + 0.1} {...P} />
        </group>
      );
    }

    /* ------------------------------------------------------------------- IT */
    case 'rack': {
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z - 0.58] as [number, number])}
            size={[w * 0.92, h * 0.9, 0.06]}
            color="#20262c"
            opacity={opacity * 0.85}
            y={h * 0.05}
            {...P}
          />
        </group>
      );
    }

    case 'server': {
      /* the IT load inside the rack, shown at the rack face so density reads
         at a distance without opening the rack */
      return (
        <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0.5} {...P} />
      );
    }

    case 'network-switch': {
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w + 0.3, 0.2, d + 0.3]} color="#3a424a" opacity={opacity} y={0} {...P} />
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0.2} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z - d / 2 - 0.02] as [number, number])}
            size={[w * 0.9, 0.12, 0.05]}
            color={emissive ? '#ffffff' : '#8ad7ff'}
            opacity={opacity}
            y={0.45}
            {...P}
          />
        </group>
      );
    }

    case 'storage': {
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z - d / 2 - 0.02] as [number, number])}
            size={[w * 0.92, h * 0.86, 0.06]}
            color="#1e242a"
            opacity={opacity * 0.8}
            y={h * 0.07}
            {...P}
          />
        </group>
      );
    }

    case 'pdu': {
      return (
        <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0} {...P} />
      );
    }

    case 'busway': {
      /* overhead busway: a rectangular duct on stems, which is what makes it
         legible from above as a distribution spine rather than a rack row */
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w, h, d]} color={color} opacity={opacity} emissive={emissive} y={h} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z - d / 2] as [number, number])}
            size={[0.4, h, 0.4]}
            color="#5c666f"
            opacity={opacity}
            y={0}
            {...P}
          />
        </group>
      );
    }

    /* ------------------------------------------------------------- substation */
    case 'sub-platform': {
      /* a hardstanding compound inside a fence, with a gravel margin and a
         cable trench line running through it */
      return (
        <group>
          <Solid size={[w, 0.5, d]} color="#4b5259" opacity={opacity} y={0} {...P} />
          <Solid size={[w - 12, 0.16, d - 12]} color="#5a636b" opacity={opacity * 0.85} y={0.5} {...P} />
          <Solid size={[w * 0.9, 0.2, 1.6]} color="#6d7781" opacity={opacity * 0.7} y={0.55} {...P} />
        </group>
      );
    }

    case 'sub-bay': {
      /* 220 kV air-insulated switchgear: gantry columns carrying conductors,
         with a busbar run down the middle of the yard */
      return (
        <group>
          <Solid size={[w, 1.2, d]} color="#4e565e" opacity={opacity * 0.9} y={0} {...P} />
          {Array.from({ length: 4 }, (_, i) => (
            <Solid key={i} size={[1.4, h, 1.4]} color="#6a747e" opacity={opacity} x={-w / 2 + 2} z={-d / 2 + 6 + i * ((d - 12) / 3)} y={1.2} {...P} />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <Solid key={`b${i}`} size={[1.1, h, 1.1]} color="#6a747e" opacity={opacity} x={w / 2 - 2} z={-d / 2 + 6 + i * ((d - 12) / 3)} y={1.2} {...P} />
          ))}
          <Solid size={[1, 1, d * 0.92]} color={color} opacity={opacity} y={h + 1.6} {...P} />
          <Solid size={[w * 0.96, 0.6, 0.7]} color="#8b959f" opacity={opacity * 0.9} y={h * 0.72} {...P} />
          {/* lightning protection masts, the tall thin verticals that dominate a
             real 220 kV yard in the render */}
          {Array.from({ length: 6 }, (_, i) => (
            <Solid
              key={`m${i}`}
              size={[0.5, h * 1.28, 0.5]}
              color="#5f6a74"
              opacity={opacity * 0.9}
              x={-w / 2 + 5}
              z={-d / 2 + 8 + i * ((d - 16) / 5)}
              y={1.2}
              {...P}
            />
          ))}
        </group>
      );
    }

    case 'sub-transformer': {
      /* a large power transformer: tank, radiator banks both sides, bushings
         on top, and an oil containment bund. The published figure for this
         plant is 18,500 kg with 8,500 L of oil, so the bund is not decorative. */
      return (
        <group>
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={[w + 6, 0.7, d + 6]} color="#4a5058" opacity={opacity} y={0} {...P} />
          <InstancedBoxes offsets={c.offsets ?? [[0, 0]]} size={size} color={color} opacity={opacity} emissive={emissive} y={0.7} {...P} />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).flatMap(([x, z]) => [
              [x - w / 2 - 1.6, z] as [number, number],
              [x + w / 2 + 1.6, z] as [number, number],
            ])}
            size={[2.6, h * 0.82, d * 0.8]}
            color="#6b757f"
            opacity={opacity}
            y={1
            }
            {...P}
          />
          <InstancedBoxes
            offsets={(c.offsets ?? [[0, 0]]).map(([x, z]) => [x, z] as [number, number])}
            size={[w * 0.86, 1.1, d * 0.7]}
            color="#8b959f"
            opacity={opacity}
            y={h + 0.7}
            {...P}
          />
        </group>
      );
    }

    case 'sub-control':
    case 'sub-mv-building': {
      /* substation buildings are small and deliberately plain */
      return (
        <group>
          <Solid size={[w + 2, 0.4, d + 2]} color="#4a5058" opacity={opacity} y={0} {...P} />
          <Solid size={size} color={color} opacity={opacity} emissive={emissive} y={0.4} highlight={highlight} {...P} />
          <Solid size={[w + 1, 0.4, d + 1]} color="#5c666f" opacity={opacity} y={h + 0.4} {...P} />
        </group>
      );
    }

    case 'hv-tower': {
      /* a transmission tower: four legs and two cross arms. Drawn as members
         rather than a cone, because a cone would read as a chimney and this is
         the one piece of the site that reaches above the horizon. */
      return (
        <group>
          {[
            [-w / 2, -d / 2],
            [w / 2, -d / 2],
            [-w / 2, d / 2],
            [w / 2, d / 2],
          ].map(([ox, oz], i) => (
            <Solid key={i} size={[0.8, h, 0.8]} color="#6a747e" opacity={opacity} x={ox} z={oz} y={0} {...P} />
          ))}
          <Solid size={[w * 1.5, 0.7, 0.7]} color="#6a747e" opacity={opacity} y={h * 0.82} {...P} />
          <Solid size={[w * 1.2, 0.7, 0.7]} color="#6a747e" opacity={opacity} y={h * 0.62} {...P} />
          <Solid size={[w * 0.8, 0.7, 0.7]} color="#6a747e" opacity={opacity} y={h * 0.94} {...P} />
        </group>
      );
    }

    case 'hv-line': {
      /* the incoming circuit: conductors slung between the towers. */
      return (
        <group>
          <Solid size={[w, 0.6, 0.6]} color="#8b959f" opacity={opacity * 0.75} y={h} {...P} />
          <Solid size={[w, 0.4, 0.4]} color="#8b959f" opacity={opacity * 0.55} y={h - 3.4} {...P} />
        </group>
      );
    }

    /* ------------------------------------------------------------ site civil */
    case 'road': {
      /* The internal road network, generated from the actual campus layout:
         a perimeter ring, a central spine between the two building rows, a
         service road behind each row for the generator and plant compounds, and
         cross roads in the gaps between buildings. */
      const road = '#2f363d';
      return (
        <group>
          {/* perimeter ring */}
          <Solid size={[1020, 0.3, 22]} color={road} opacity={opacity} y={0} z={-440} {...P} />
          <Solid size={[1020, 0.3, 22]} color={road} opacity={opacity} y={0} z={440} {...P} />
          <Solid size={[22, 0.3, 900]} color={road} opacity={opacity} y={0} x={-490} {...P} />
          <Solid size={[22, 0.3, 900]} color={road} opacity={opacity} y={0} x={490} {...P} />
          {/* central spine */}
          <Solid size={[1000, 0.3, 26]} color={road} opacity={opacity} y={0} z={0} {...P} />
          {/* service roads behind each row */}
          <Solid size={[1000, 0.3, 18]} color={road} opacity={opacity} y={0} z={-300} {...P} />
          <Solid size={[1000, 0.3, 18]} color={road} opacity={opacity} y={0} z={300} {...P} />
          {/* cross roads in the gaps */}
          <Solid size={[18, 0.3, 640]} color={road} opacity={opacity} y={0} x={-165} {...P} />
          <Solid size={[18, 0.3, 640]} color={road} opacity={opacity} y={0} x={165} {...P} />
          {/* gate approach */}
          <Solid size={[18, 0.3, 120]} color={road} opacity={opacity} y={0} x={-80} z={400} {...P} />
        </group>
      );
    }

    case 'fence': {
      /* perimeter: a line plus corner posts, deliberately barely visible */
      return (
        <group>
          <Solid size={[1020, 0.1, 2.4]} color={color} opacity={opacity * 0.5} y={2.6} z={-464} {...P} />
          <Solid size={[1020, 0.1, 2.4]} color={color} opacity={opacity * 0.5} y={2.6} z={464} {...P} />
          <Solid size={[2.4, 0.1, 928]} color={color} opacity={opacity * 0.5} y={2.6} x={-504} {...P} />
          <Solid size={[2.4, 0.1, 928]} color={color} opacity={opacity * 0.5} y={2.6} x={504} {...P} />
        </group>
      );
    }

    case 'gatehouse':
    case 'admin':
    case 'fire':
    case 'water-treatment':
    case 'fibre-hub':
    case 'network-core':
    case 'site-shed': {
      /* ordinary low buildings: plinth, body, roof, and a glazed strip, because
         these are the buildings a person actually works in */
      return (
        <group>
          <Solid size={[w + 2, 0.4, d + 2]} color="#454c54" opacity={opacity} y={0} {...P} />
          <Solid size={size} color={color} opacity={opacity} emissive={emissive} y={0.4} highlight={highlight} {...P} />
          <Solid size={[w + 1.4, 0.5, d + 1.4]} color="#5c666f" opacity={opacity} y={h + 0.4} {...P} />
          <Solid size={[w * 0.86, h * 0.4, d + 1.6]} color="#38bdf8" opacity={opacity * 0.22} y={h * 0.35} {...P} />
        </group>
      );
    }

    case 'potable-tank': {
      /* vertical storage tanks */
      return (
        <group>
          <Cylinder r={w / 2} h={h} color={color} opacity={opacity} {...P} />
          <Cylinder r={w / 2 * 0.92} h={h * 0.08} color="#8a949e" opacity={opacity * 0.85} y={h} {...P} />
        </group>
      );
    }

    case 'bore': {
      /* a wellhead: a small kiosk over a riser, which is all that is above ground */
      return (
        <group>
          <Cylinder r={w * 0.2} h={h * 1.6} color="#8b959f" opacity={opacity} {...P} />
          <Solid size={[w * 1.9, h * 0.9, w * 1.9]} color="#4d555d" opacity={opacity} y={h * 1.6} {...P} />
          <Solid size={[w * 0.5, h * 0.5, w * 0.5]} color={color} opacity={opacity} emissive={emissive} y={h * 2.5} {...P} />
        </group>
      );
    }

    case 'wastewater-soakage': {
      return (
        <group>
          <Plane size={[w, d]} color="#3d4a3c" opacity={opacity * 0.9} y={0.1} {...P} />
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 10 }, (_, cc) => (
              <Plane key={`${r}-${cc}`} size={[2, 2]} color="#4b5a48" opacity={opacity * 0.8} x={-w / 2 + 4 + cc * ((w - 8) / 9)} z={-d / 2 + 5 + r * ((d - 10) / 5)} y={0.2} />
            )),
          )}
        </group>
      );
    }

    case 'stormwater-basin': {
      /* a below-grade attenuation basin: a rim, a floor and a water plane, so
         it reads as a basin rather than a green rectangle */
      return (
        <group>
          <Plane size={[w, d]} color="#3f4a3d" opacity={opacity} y={0.05} {...P} />
          <Solid size={[w, 1.4, 3]} color="#39443a" opacity={opacity * 0.9} y={-1.4} z={-d / 2} {...P} />
          <Solid size={[w, 1.4, 3]} color="#39443a" opacity={opacity * 0.9} y={-1.4} z={d / 2} {...P} />
          <Solid size={[3, 1.4, d]} color="#39443a" opacity={opacity * 0.9} y={-1.4} x={-w / 2} {...P} />
          <Solid size={[3, 1.4, d]} color="#39443a" opacity={opacity * 0.9} y={-1.4} x={w / 2} {...P} />
          <Plane size={[w - 8, d - 8]} color="#2f4a52" opacity={opacity * 0.55} y={-0.7} {...P} />
        </group>
      );
    }

    case 'watercourse': {
      return <Plane size={[w, d]} color="#2b4a55" opacity={opacity * 0.7} y={-0.4} {...P} />;
    }

    case 'fibre-route': {
      /* buried duct banks shown as a surface marker line, with a marker at
         each end of the run. Drawn below grade so it reads as buried. */
      return (
        <group>
          <Solid size={[w, 0.5, w]} color={color} opacity={opacity * 0.85} emissive={emissive} y={-0.2} {...P} />
          <Solid size={[w * 0.14, 6, w * 0.14]} color={color} opacity={opacity} y={0} {...P} />
        </group>
      );
    }

    case 'sediment-pond': {
      return (
        <group>
          <Plane size={[w, d]} color="#3a4239" opacity={opacity} y={0.05} {...P} />
          <Plane size={[w - 10, d - 10]} color="#3d4a44" opacity={opacity * 0.7} y={0.15} {...P} />
        </group>
      );
    }

    case 'tower-crane': {
      return (
        <group>
          <Solid size={[1.6, h * 0.55, 1.6]} color="#e2a33c" opacity={opacity} y={0} {...P} />
          <Solid size={[70, 1.4, 1.4]} color="#e2a33c" opacity={opacity} y={h * 0.55} {...P} />
          <Solid size={[3.4, 3, 3]} color="#c8912e" opacity={opacity} x={-8} y={h * 0.55} {...P} />
        </group>
      );
    }

    case 'temp-road': {
      return <Plane size={[w, d]} color="#3a362c" opacity={opacity * 0.9} y={0.06} {...P} />;
    }

    case 'ambient-sink': {
      /* the atmosphere is the destination of both heat problems, so it is drawn
         as a wide, very faint shell rather than an object */
      return (
        <group>
          <Plane size={[w, d]} color={color} opacity={opacity * 0.16} y={-h / 2} {...P} />
          <Plane size={[w * 0.68, d * 0.68]} color={color} opacity={opacity * 0.12} y={0} {...P} />
        </group>
      );
    }

    default: {
      /* An unknown type renders as a plain solid rather than throwing. The
         self test is what guarantees the list is complete; this is only a
         fallback so a typo degrades quietly instead of blanking the scene. */
      return <Solid size={size} color={color} opacity={opacity} emissive={emissive} highlight={highlight} {...P} />;
    }
  }
}