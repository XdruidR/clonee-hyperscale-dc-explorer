import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Line as DxfLine } from '@react-three/drei';
import type { CampusComponent } from '../data/campus';

/* --------------------------------------------------------------- primitives */

export interface ShapeProps {
  c: CampusComponent;
  color: string;
  opacity: number;
  emissive?: string;
  roofOff: boolean;
  cutaway: boolean;
  highlight: boolean;
}

function boxArgs(size: [number, number, number]): [number, number, number] {
  return [size[0], size[1], size[2]];
}

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
        roughness: 0.75,
        metalness: 0.06,
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
      {highlight && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(size[0], size[1], size[2])]} />
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
    <mesh position={[x, y + h / 2, z]} rotation={rot} material={mat} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <cylinderGeometry args={[r, r, h, segments]} />
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
  }, [size[0], size[1], size[2], offsets.length]);
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

/** Flat instanced rectangles (roads, swales, field strips). */
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
  }, [size[0], size[1], offsets.length]);
  return <primitive object={mesh} position-y={y} />;
}

/* ------------------------------------------------------------------ shapes */

export function Shape({
  c,
  color,
  opacity,
  emissive,
  roofOff,
  cutaway,
  highlight,
  onClick,
  onOver,
  onOut,
}: ShapeProps & { onClick?: (e: any) => void; onOver?: (e: any) => void; onOut?: (e: any) => void }) {
  const [w, h, d] = c.size;
  const P = { onClick, onOver, onOut };

  switch (c.type) {
    case 'data-hall': {
      const wallOpacity = cutaway ? 0.13 : opacity;
      return (
        <group>
          <Solid size={[w, 1.2, d]} color="#5c6672" opacity={opacity * 0.9} y={0} {...P} />
          <Solid size={[w, h, d]} color={color} opacity={wallOpacity} y={1.2} highlight={highlight} {...P} />
          {!roofOff && !cutaway && (
            <Solid size={[w + 1.6, 0.9, d + 1.6]} color="#78838f" opacity={opacity} y={h + 1.2} {...P} />
          )}
          {/* roof-level rainwater capture arrows/edge */}
          {!roofOff && !cutaway && (
            <Solid size={[w + 2, 0.35, 1.2]} color="#38bdf8" opacity={opacity * 0.75} y={h + 0.6} {...P} />
          )}
        </group>
      );
    }
    case 'reservoir':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={Math.max(0.14, opacity * 0.32)} y={0} {...P} />
          <Plane size={[w - 2, d - 2]} color="#7dd3fc" opacity={Math.max(0.2, opacity * 0.4)} y={h - 0.4} />
        </group>
      );
    case 'module-plant':
      return <Solid size={[w, 0.4, d]} color={color} opacity={opacity * 0.5} {...P} />;
    case 'generator':
      return (
        <group>
          <Solid size={[w, 0.5, d]} color="#4c545e" opacity={opacity} {...P} />
          <Solid size={[w - 1, 4.2, d - 1]} color={color} opacity={opacity} y={0.5} highlight={highlight} {...P} />
          <Cylinder r={0.35} h={h + 10} color="#9aa6b2" opacity={opacity} y={h - 10} x={w / 2 - 1.2} {...P} />
          <Solid size={[w - 2.4, 0.9, 2]} color="#c9d3dd" opacity={opacity * 0.9} y={4.7} {...P} />
        </group>
      );
    case 'fuel-tank':
      return (
        <group>
          <Cylinder r={1.5} h={7} color={color} opacity={opacity} rot={[0, 0, Math.PI / 2]} y={1.2} {...P} />
          <Solid size={[w, 0.9, d]} color="#4c545e" opacity={opacity * 0.9} {...P} />
        </group>
      );
    case 'adiabatic-cooler':
      return (
        <group>
          <Solid size={[w, h * 0.72, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Cylinder r={2.2} h={1.6} color="#5b6672" opacity={opacity} y={h * 0.72} x={-w * 0.22} segments={14} {...P} />
          <Cylinder r={2.2} h={1.6} color="#5b6672" opacity={opacity} y={h * 0.72} x={w * 0.22} segments={14} {...P} />
          <Solid size={[w + 0.6, 0.4, d + 0.6]} color="#94a3b8" opacity={opacity * 0.8} y={h * 0.72 + 1.6} {...P} />
        </group>
      );
    case 'heat-plume':
      return (
        <group>
          <Solid size={[w, 2, d]} color="#7dd3fc" opacity={opacity * 0.16} y={0} {...P} />
          <Solid size={[w * 0.8, h * 0.55, d * 0.8]} color="#a5d8f7" opacity={opacity * 0.1} y={2} {...P} />
          <Solid size={[w * 0.55, h * 0.5, d * 0.55]} color="#cfe6f7" opacity={opacity * 0.07} y={h * 0.55} {...P} />
        </group>
      );
    case 'heat-exchanger':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Cylinder r={0.6} h={d + 6} color="#9aa6b2" opacity={opacity} rot={[Math.PI / 2, 0, 0]} y={h * 0.6} {...P} />
        </group>
      );
    case 'pump':
      return (
        <group>
          <Solid size={[w, 1.2, d]} color="#4c545e" opacity={opacity} {...P} />
          <Cylinder r={1.1} h={h} color={color} opacity={opacity} y={1.2} rot={[0, 0, Math.PI / 2]} {...P} />
        </group>
      );
    case 'unit-substation':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          {[0, 1, 2].map((i) => (
            <Cylinder key={i} r={0.55} h={1.5} color="#c9d3dd" opacity={opacity} x={-w / 3 + i * (w / 3)} y={h} {...P} />
          ))}
        </group>
      );
    case 'ups':
      return (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <Solid
              key={i}
              size={[w / 4 - 0.3, h, d]}
              color={color}
              opacity={opacity}
              y={0}
              x={-w / 2 + (i + 0.5) * (w / 4)}
              highlight={highlight && i === 0}
              {...P}
            />
          ))}
          <Solid size={[w + 0.4, 0.3, d + 0.4]} color="#94a3b8" opacity={opacity * 0.7} y={h} {...P} />
        </group>
      );
    case 'battery':
      return (
        <group>
          {[0, 1, 2, 3, 4].map((i) => (
            <Solid
              key={i}
              size={[w / 5 - 0.3, h, d]}
              color={color}
              opacity={opacity}
              x={-w / 2 + (i + 0.5) * (w / 5)}
            />
          ))}
        </group>
      );
    case 'lv-switchboard':
      return <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />;
    case 'busway':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} y={h > 2 ? h * 0 : 6.2} highlight={highlight} {...P} />
          {c.offsets?.map(([x, z], i) => (
            <Solid key={i} size={[1.1, 0.8, 1.1]} color="#e5e7eb" opacity={opacity * 0.9} y={5.7} x={x} z={z} {...P} />
          ))}
        </group>
      );
    case 'pdu':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={color} opacity={opacity} onClick={onClick} onOver={onOver} onOut={onOut} />
      ) : null;
    case 'rack':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={color} opacity={opacity} onClick={onClick} onOver={onOver} onOut={onOut} />
      ) : null;
    case 'gpu-server':
      return c.offsets ? (
        <InstancedBoxes
          offsets={c.offsets}
          size={c.size}
          color={emissive ?? color}
          opacity={opacity}
          emissive={emissive}
          onClick={onClick}
          onOver={onOver}
          onOut={onOut}
        />
      ) : null;
    case 'cold-plate':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={emissive ?? color} opacity={opacity} emissive={emissive} />
      ) : null;
    case 'network-switch':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={emissive ?? color} opacity={opacity} emissive={emissive} />
      ) : null;
    case 'storage':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={color} opacity={opacity} />
      ) : null;
    case 'cdu':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={color} opacity={opacity} onClick={onClick} onOver={onOver} onOut={onOut} />
      ) : null;
    case 'crah':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={color} opacity={opacity} onClick={onClick} onOver={onOver} onOut={onOut} />
      ) : null;
    case 'mv-switchgear':
      return (
        <group>
          <Solid size={[w, h, d]} color="#5f6b78" opacity={opacity} y={0} {...P} />
          <Solid size={[w - 2, h * 0.7, 0.6]} color={color} opacity={opacity} y={0.8} z={d / 2 + 0.1} highlight={highlight} {...P} />
          <Solid size={[w + 1, 0.5, d + 1]} color="#8b97a4" opacity={opacity} y={h} {...P} />
        </group>
      );
    case 'gen-heat-rejection':
      return c.offsets ? (
        <group>
          <InstancedBoxes offsets={c.offsets} size={c.size} color="#b0532f" opacity={opacity} emissive="#2a0d04" />
          {c.offsets.map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Cylinder r={0.45} h={9} color="#8d8f92" opacity={opacity * 0.9} y={3.4} x={-2.6} segments={8} />
              <Solid size={[6, 1.2, 7]} color="#c96a3f" opacity={opacity * 0.18} y={3.4} z={-6} />
            </group>
          ))}
        </group>
      ) : null;
    case 'generator-switchgear':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          {[-1, 0, 1].map((i) => (
            <Solid key={i} size={[2.2, h * 1.15, 1.2]} color="#e7e2d3" opacity={opacity * 0.9} x={i * 5.5} y={0} {...P} />
          ))}
        </group>
      );
    case 'ambient-sink':
      return (
        <group>
          <Solid size={[w, h * 0.35, d]} color="#7dd3fc" opacity={opacity * 0.16} y={0} {...P} />
          <Solid size={[w * 0.72, h * 0.3, d * 0.72]} color="#a5d8f7" opacity={opacity * 0.1} y={h * 0.35} {...P} />
          <Solid size={[w * 0.45, h * 0.3, d * 0.45]} color="#cfe6f7" opacity={opacity * 0.07} y={h * 0.65} {...P} />
        </group>
      );
    case 'gxp-platform':
      return (
        <group>
          <Solid size={[w, 1.2, d]} color="#6b7280" opacity={opacity} y={0} {...P} />
          {/* security fence line */}
          {[
            [0, -d / 2],
            [0, d / 2],
            [-w / 2, 0],
            [w / 2, 0],
          ].map(([x, z], i) => (
            <Solid
              key={i}
              size={i < 2 ? [w + 4, 2.5, 1.4] : [1.4, 2.5, d + 4]}
              color="#94a3b8"
              opacity={opacity * 0.8}
              x={x as number}
              z={z as number}
              y={1.2}
              {...P}
            />
          ))}
        </group>
      );
    case 'gxp-transformer':
      return (
        <group>
          <Solid size={[w + 3, 1, d + 3]} color="#5b6470" opacity={opacity} {...P} />
          <Solid size={[w, h * 0.75, d]} color={color} opacity={opacity} y={1} highlight={highlight} {...P} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Solid
              key={i}
              size={[1.2, h * 0.55, d * 0.9]}
              color="#7d8794"
              opacity={opacity}
              x={w / 2 + 0.8}
              y={1.4}
              z={-d / 2 + 1 + i * ((d - 2) / 4)}
              {...P}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <Cylinder key={i} r={0.5} h={4.5} color="#d7dee6" opacity={opacity} x={-w / 2 + 1.4 + i * 4} y={1 + h * 0.75} segments={8} {...P} />
          ))}
          <Solid size={[w * 0.5, 2.4, d * 0.4]} color="#6f7a87" opacity={opacity} y={1 + h * 0.75} {...P} />
        </group>
      );
    case 'gxp-bay':
      return c.offsets ? (
        <group>
          {c.offsets.map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Solid size={[1, h, 1]} color="#7d8794" opacity={opacity} x={-4} />
              <Solid size={[1, h, 1]} color="#7d8794" opacity={opacity} x={4} />
              <Solid size={[9, 0.9, 0.9]} color={color} opacity={opacity} y={h * 0.82} highlight={highlight} {...P} />
              <Solid size={[9, 0.7, 0.7]} color={color} opacity={opacity * 0.85} y={h * 0.58} {...P} />
              <Solid size={[4.5, 3.5, 4]} color="#8f9aa6" opacity={opacity} y={0} {...P} />
            </group>
          ))}
        </group>
      ) : null;
    case 'gxp-control':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Solid size={[w + 1, 0.4, d + 1]} color="#8b97a4" opacity={opacity} y={h} {...P} />
        </group>
      );
    case 'hv-tower':
      return (
        <group>
          {[
            [-3, -3],
            [3, -3],
            [-3, 3],
            [3, 3],
          ].map(([x, z], i) => (
            <Solid key={i} size={[0.9, h, 0.9]} color="#8b97a4" opacity={opacity} x={x as number} z={z as number} {...P} />
          ))}
          {[0.42, 0.62, 0.82].map((f, i) => (
            <Solid key={i} size={[11 - i, 0.7, 0.7]} color="#a6b1bd" opacity={opacity} y={h * f} {...P} />
          ))}
          <Solid size={[14, 1, 1]} color={color} opacity={opacity} y={h * 0.94} {...P} />
        </group>
      );
    case 'hv-line':
      return (
        <group>
          {/* three conductors plus an earth wire, drawn as lines so they stay
              legible at campus scale; a slim box keeps the component clickable */}
          {[0.9, 0.95, 1.0, 0.78].map((f, i) => (
            <DxfLine
              key={i}
              points={[
                [-w / 2, h * f, 0],
                [-w / 4, h * f - 1.6, 0],
                [0, h * f - 2.2, 0],
                [w / 4, h * f - 1.6, 0],
                [w / 2, h * f, 0],
              ]}
              color={i === 3 ? '#8fa3b8' : '#e8f0fa'}
              lineWidth={i === 3 ? 1 : 1.6}
              transparent
              opacity={opacity}
            />
          ))}
          <Solid size={[w, 0.5, 0.5]} color="#dbe6f2" opacity={opacity * 0.25} y={h * 0.95} {...P} />
        </group>
      );
    case 'road':
      return (
        <group>
          {/* perimeter loop */}
          <Solid size={[700, 0.3, 12]} color={color} opacity={opacity * 0.95} z={-336} {...P} />
          <Solid size={[700, 0.3, 12]} color={color} opacity={opacity * 0.95} z={336} {...P} />
          <Solid size={[12, 0.3, 660]} color={color} opacity={opacity * 0.95} x={-336} {...P} />
          <Solid size={[12, 0.3, 660]} color={color} opacity={opacity * 0.95} x={336} {...P} />
          {/* spine roads in the corridors between modules */}
          <Solid size={[13, 0.3, 600]} color={color} opacity={opacity * 0.9} x={-104} {...P} />
          <Solid size={[13, 0.3, 600]} color={color} opacity={opacity * 0.9} x={104} {...P} />
          {/* cross roads */}
          {[-186, 186].map((z) => (
            <Solid key={z} size={[660, 0.3, 12]} color={color} opacity={opacity * 0.85} z={z} {...P} />
          ))}
          {/* link to the grid exit point */}
          <Solid size={[13, 0.3, 150]} color={color} opacity={opacity * 0.85} x={322} z={-260} {...P} />
          {/* entry from the public road */}
          <Solid size={[16, 0.3, 34]} color={color} opacity={opacity * 0.9} x={-104} z={-353} {...P} />
        </group>
      );
    case 'gatehouse':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Solid size={[w + 3, 0.5, d + 3]} color="#8b97a4" opacity={opacity} y={h} {...P} />
          <Solid size={[w + 6, 0.3, 4]} color="#cbd5e1" opacity={opacity * 0.8} y={h - 0.6} z={d / 2 + 3} {...P} />
        </group>
      );
    case 'fence':
      return (
        <group>
          <Solid size={[700, 2.6, 4]} color="#6f7c8a" opacity={opacity * 0.7} z={-346} {...P} />
          <Solid size={[700, 2.6, 4]} color="#6f7c8a" opacity={opacity * 0.7} z={346} {...P} />
          <Solid size={[4, 2.6, 700]} color="#6f7c8a" opacity={opacity * 0.7} x={-346} {...P} />
          <Solid size={[4, 2.6, 700]} color="#6f7c8a" opacity={opacity * 0.7} x={346} {...P} />
          <Solid size={[700, 2.2, 9]} color="#7d8b6a" opacity={opacity * 0.5} z={-332} {...P} />
          <Solid size={[700, 2.2, 9]} color="#7d8b6a" opacity={opacity * 0.5} z={332} {...P} />
          <Solid size={[9, 2.2, 690]} color="#7d8b6a" opacity={opacity * 0.5} x={-332} {...P} />
          <Solid size={[9, 2.2, 690]} color="#7d8b6a" opacity={opacity * 0.5} x={332} {...P} />
        </group>
      );
    case 'admin':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Solid size={[w + 1, 0.4, d + 1]} color="#8b97a4" opacity={opacity} y={h} {...P} />
        </group>
      );
    case 'fire':
      return (
        <group>
          <Cylinder r={6} h={h} color={color} opacity={opacity} x={-8} segments={16} {...P} />
          <Cylinder r={6} h={h} color={color} opacity={opacity} x={8} segments={16} {...P} />
          <Solid size={[30, 5, 22]} color="#6b7280" opacity={opacity} x={0} z={14} {...P} />
        </group>
      );
    case 'water-treatment':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Solid size={[w + 1, 0.4, d + 1]} color="#8b97a4" opacity={opacity} y={h} {...P} />
          {[-1, 1].map((s) => (
            <Cylinder key={s} r={3.5} h={7} color="#94d3ea" opacity={opacity} x={s * 30} y={0} segments={14} {...P} />
          ))}
        </group>
      );
    case 'bore':
      return c.offsets ? (
        <group>
          <InstancedBoxes offsets={c.offsets} size={c.size} color={color} opacity={opacity} onClick={onClick} onOver={onOver} onOut={onOut} />
          {c.offsets.map(([x, z], i) => (
            <Cylinder key={i} r={0.25} h={3} color="#9fb3c8" opacity={opacity} x={x} z={z} />
          ))}
        </group>
      ) : null;
    case 'potable-tank':
      return (
        <group>
          <Cylinder r={7} h={h} color={color} opacity={opacity} x={-9} segments={18} {...P} />
          <Cylinder r={7} h={h} color={color} opacity={opacity} x={9} segments={18} {...P} />
        </group>
      );
    case 'wastewater-soakage':
      return (
        <group>
          <Plane size={[w, d]} color={color} opacity={opacity * 0.5} />
          {Array.from({ length: 7 }).map((_, i) => (
            <Solid key={i} size={[w - 6, 0.2, 1.2]} color="#8fb8a6" opacity={opacity * 0.7} z={-d / 2 + 6 + i * ((d - 12) / 6)} y={0.3} {...P} />
          ))}
        </group>
      );
    case 'stormwater-basin':
      return (
        <group>
          <Solid size={[w, 2.4, d]} color="#4b5563" opacity={opacity} y={-2.4} {...P} />
          <Plane size={[w - 6, d - 6]} color="#3b82c4" opacity={opacity * 0.45} y={-0.9} />
          <Solid size={[w + 4, 0.5, 3]} color="#6b8f5f" opacity={opacity * 0.7} z={d / 2 + 2} {...P} />
        </group>
      );
    case 'wetland':
      return (
        <group>
          <Plane size={[w, d]} color={color} opacity={opacity * 0.55} y={0.05} />
          <Plane size={[w * 0.55, d * 0.5]} color="#5d8f74" opacity={opacity * 0.35} y={0.12} x={-40} />
          <Solid size={[w, 0.3, 2.4]} color="#38bdf8" opacity={opacity * 0.6} y={0.2} z={-d / 2 - 8} {...P} />
        </group>
      );
    case 'landing-station':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Solid size={[w + 1, 0.5, d + 1]} color="#8b97a4" opacity={opacity} y={h} {...P} />
          <Solid size={[w * 0.6, 2.2, 6]} color="#a78bfa" opacity={opacity * 0.85} y={h + 0.5} z={d / 2 + 2} {...P} />
        </group>
      );
    case 'network-core':
      return (
        <group>
          <Solid size={[w, h, d]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Solid size={[w * 0.85, 1.6, 1.2]} color="#c4b5fd" opacity={opacity} y={h} {...P} />
        </group>
      );
    case 'fibre-route':
      return (
        <group>
          <Solid size={[4, 4, 4]} color={color} opacity={opacity} highlight={highlight} {...P} />
          <Solid size={[6, 0.3, 260]} color="#a78bfa" opacity={opacity * 0.7} z={-140} {...P} />
          <Solid size={[300, 0.3, 6]} color="#a78bfa" opacity={opacity * 0.7} x={-170} z={-270} {...P} />
        </group>
      );
    case 'site-shed':
      return c.offsets ? (
        <InstancedBoxes offsets={c.offsets} size={c.size} color={color} opacity={opacity} />
      ) : null;
    case 'dewatering':
      return (
        <group>
          <Plane size={[w, d]} color="#3b82f6" opacity={opacity * 0.2} y={0.05} />
          {Array.from({ length: 9 }).map((_, i) => (
            <Solid key={i} size={[3, 0.5, 3]} color="#60a5fa" opacity={opacity * 0.7} x={-140 + i * 36} z={-100} y={0.3} {...P} />
          ))}
        </group>
      );
    case 'sediment-pond':
      return (
        <group>
          <Solid size={[w, 1.8, d]} color="#4b5563" opacity={opacity} y={-1.4} {...P} />
          <Plane size={[w - 4, d - 4]} color="#a16207" opacity={opacity * 0.5} y={-0.3} />
        </group>
      );
    case 'tower-crane':
      return c.offsets ? (
        <group>
          {c.offsets.map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Solid size={[3, h, 3]} color="#facc15" opacity={opacity * 0.9} y={0} />
              <Solid size={[3, 3, 70]} color="#fde047" opacity={opacity * 0.9} y={h} z={24} {...P} />
              <Solid size={[3, 8, 3]} color="#4b5563" opacity={opacity} y={-8} z={-8} />
            </group>
          ))}
        </group>
      ) : null;
    case 'temp-road':
      return (
        <group>
          <Solid size={[660, 0.3, 14]} color="#8a7355" opacity={opacity} z={-120} {...P} />
          <Solid size={[14, 0.3, 420]} color="#8a7355" opacity={opacity} x={-300} {...P} />
          <Solid size={[14, 0.3, 300]} color="#8a7355" opacity={opacity} x={250} z={120} {...P} />
        </group>
      );
    default:
      return <Solid size={c.size} color={color} opacity={opacity} y={0} highlight={highlight} {...P} />;
  }
}