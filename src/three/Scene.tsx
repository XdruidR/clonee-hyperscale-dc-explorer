import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { framed, HOME_CAMERA } from '../state/store';
import { Campus } from './Campus';
import { Flows } from './Flows';
import { useStore } from '../state/store';
import { InstancedPlanes, Plane } from './builders';

/**
 * Lighting presets.
 *
 * The default is day, because a data centre campus is a working site and a
 * learner needs to read geometry before they read atmosphere. Night is not a
 * decorative mode here either: the campus lighting, the aircraft warning light
 * on the transmission towers and the glow of the hall interiors are what a real
 * campus looks like after dark, and it is genuinely useful for seeing which
 * buildings are actually complete.
 */
function Lighting() {
  const dayNight = useStore((s) => s.dayNight);
  const cfg =
    dayNight === 'night'
      ? { amb: 0.16, dir: 0.4, dirColor: '#8fb0ff', bg: '#080c14', fog: '#0d1520', ground: '#16201c', far: 3200 }
      : dayNight === 'dusk'
        ? { amb: 0.3, dir: 1.0, dirColor: '#ffb184', bg: '#282c40', fog: '#464059', ground: '#3a4a3d', far: 4200 }
        : { amb: 0.58, dir: 2.0, dirColor: '#fff4e4', bg: '#a4b9d2', fog: '#b4c6d6', ground: '#5c7048', far: 5600 };
  return (
    <>
      <ambientLight intensity={cfg.amb} />
      <hemisphereLight args={['#cfe0ff', '#38402f', cfg.amb * 0.7]} />
      <directionalLight position={[520, 620, 320]} intensity={cfg.dir} color={cfg.dirColor} />
      <directionalLight position={[-420, 240, -480]} intensity={cfg.dir * 0.22} color="#cfe0ff" />
      <color attach="background" args={[cfg.bg]} />
      <fog attach="fog" args={[cfg.fog, 1500, cfg.far]} />
      <Environment ground={cfg.ground} night={dayNight === 'night'} />
    </>
  );
}

/**
 * The setting around the site.
 *
 * Clonee is in County Meath: green agricultural land, hedgerow field
 * boundaries, a national road to the south, and the village close by. The
 * previous model put a coastline a kilometre away, which is the single most
 * effective way to tell a reader this is not the right place.
 */
function Environment({ ground, night }: { ground: string; night: boolean }) {
  /**
   * Field parcels, inset by the site boundary. Offsets are staggered so the
   * field boundaries do not line up on a single global grid, which is what
   * makes land look like land rather than like a chequerboard.
   */
  const fields = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = -7; i <= 7; i++) {
      for (let j = -7; j <= 7; j++) {
        const x = i * 210 + (j % 2 ? 55 : 0) + (Math.abs(j) % 3 ? 0 : 18);
        const z = j * 190 - 40;
        if (Math.abs(x) < 560 && Math.abs(z) < 520) continue;
        if (z > -620 && z < -500 && Math.abs(x) < 1300) continue; // road corridor
        out.push([x, z]);
      }
    }
    return out;
  }, []);

  /** Hedgerow lines, drawn as thin dark strips on the field boundaries. */
  const hedges = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = -7; i <= 7; i++) {
      const x = i * 210 + 105;
      if (Math.abs(x) < 545) continue;
      out.push([x, -560]);
      out.push([x, 560]);
    }
    return out;
  }, []);

  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <planeGeometry args={[9000, 9000]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>

      <InstancedPlanes offsets={fields} size={[178, 158]} color={night ? '#1b2a22' : '#63764c'} opacity={0.9} y={-0.34} />
      <InstancedPlanes offsets={fields} size={[140, 124]} color={night ? '#1f3026' : '#72854f'} opacity={0.55} y={-0.3} />
      <InstancedPlanes offsets={hedges} size={[5, 1120]} color={night ? '#13211a' : '#415134'} opacity={0.8} y={0.6} />

      {/* the national road to the south, with its junction into the site */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, -560]}>
          <planeGeometry args={[3200, 18]} />
          <meshStandardMaterial color="#43444a" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-80, -0.2, -480]}>
          <planeGeometry args={[14, 170]} />
          <meshStandardMaterial color="#43444a" roughness={1} />
        </mesh>
      </group>

      {/* Clonee village, to the south-east: low roofs, a church tower */}
      <group position={[880, 0, 620]}>
        {[
          [0, 0, 34, 12],
          [46, -22, 26, 10],
          [18, 40, 30, 11],
          [-34, 30, 24, 10],
          [72, 44, 28, 11],
          [110, -30, 22, 9],
          [-10, -52, 26, 10],
          [56, 86, 24, 10],
        ].map(([x, z, w, h], i) => (
          <mesh key={i} position={[x, h / 2, z]}>
            <boxGeometry args={[w, h, w * 0.8]} />
            <meshStandardMaterial color={night ? '#20242a' : '#c8c2b4'} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[96, 17, 12]}>
          <boxGeometry args={[9, 34, 9]} />
          <meshStandardMaterial color={night ? '#1b1f24' : '#b8b2a4'} roughness={0.9} />
        </mesh>
      </group>

      {/* the Clonee interchange: the R147 runs east-west south of the site */}
      <group position={[0, 0, -700]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
          <planeGeometry args={[2600, 26]} />
          <meshStandardMaterial color="#3f4046" roughness={1} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-420 + i * 420, 9, 0]}>
            <boxGeometry args={[10, 18, 40]} />
            <meshStandardMaterial color={night ? '#191d22' : '#b0aaa0'} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Campus lighting: mast heads and building apron wash, so the site reads
          as an operating facility rather than a diagram after dark. */}
      {night && (
        <>
          <InstancedPlanes
            offsets={[
              [-80, 0],
              [-80, -190],
              [-80, 190],
              [420, -190],
              [420, 190],
              [0, -300],
              [0, 300],
            ]}
            size={[26, 26]}
            color="#ffd79a"
            opacity={0.3}
            y={0.4}
          />
          <Plane size={[1000, 26]} color="#ffe0ae" opacity={0.09} y={0.5} z={0} />
          <Plane size={[1000, 18]} color="#ffe0ae" opacity={0.07} y={0.5} z={-300} />
          <Plane size={[1000, 18]} color="#ffe0ae" opacity={0.07} y={0.5} z={300} />
        </>
      )}

      {/* A measuring grid, because this is a survey instrument over a site and
          the grid is the only thing that gives the viewer a sense of true scale
          against 280 m bars. */}
      <Grid
        position={[0, 0.02, 0]}
        args={[2400, 2400]}
        cellSize={50}
        cellThickness={0.55}
        cellColor="#7f8f9c"
        sectionSize={250}
        sectionThickness={1.05}
        sectionColor="#b3bfcc"
        fadeDistance={2100}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid={false}
      />
    </group>
  );
}

function CameraRig() {
  const controls = useRef<any>(null);
  const initial = framed(HOME_CAMERA.pos, HOME_CAMERA.target);
  const request = useStore((s) => s.camera);
  const anim = useRef({ active: false, pos: new THREE.Vector3(), target: new THREE.Vector3() });
  const { camera } = useThree();

  useEffect(() => {
    anim.current.active = true;
    anim.current.pos.set(...request.pos);
    anim.current.target.set(...request.target);
  }, [request.token, request]);

  useFrame(() => {
    const c = controls.current;
    if (!c || !anim.current.active) return;
    const k = 0.075;
    camera.position.lerp(anim.current.pos, k);
    c.target.lerp(anim.current.target, k);
    c.update();
    if (camera.position.distanceTo(anim.current.pos) < 2.2 && c.target.distanceTo(anim.current.target) < 1.2) {
      anim.current.active = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={22}
      maxDistance={3400}
      maxPolarAngle={Math.PI * 0.495}
      target={initial.target}
    />
  );
}

function Deselect() {
  const select = useStore((s) => s.select);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} onClick={() => select(null, false)} visible={false}>
      <planeGeometry args={[12000, 12000]} />
      <meshBasicMaterial />
    </mesh>
  );
}

export function Scene() {
  const start = framed(HOME_CAMERA.pos, HOME_CAMERA.target);
  return (
    <Canvas
      camera={{ position: start.pos, fov: 42, near: 1, far: 12000 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => useStore.getState().select(null, false)}
    >
      <CameraRig />
      <Lighting />
      <Deselect />
      <Campus />
      <Flows />
      {/* The site itself: 1,020 m x 940 m, the consented 95.5 ha. */}
      <Plane size={[1020, 940]} color="#6a7a5c" opacity={0.32} y={-0.05} />
    </Canvas>
  );
}