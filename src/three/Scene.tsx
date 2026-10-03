import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { Campus } from './Campus';
import { Flows } from './Flows';
import { useStore } from '../state/store';
import { InstancedPlanes, Plane } from './builders';

function Lighting() {
  const dayNight = useStore((s) => s.dayNight);
  const cfg =
    dayNight === 'night'
      ? { amb: 0.2, dir: 0.55, dirColor: '#93b4ff', bg: '#0b1018', fog: '#121a26', ground: '#1d2a2a', far: 3600 }
      : dayNight === 'dusk'
        ? { amb: 0.34, dir: 1.15, dirColor: '#ffb98a', bg: '#2b2f45', fog: '#4a4360', ground: '#3c4a3f', far: 4200 }
        : { amb: 0.62, dir: 2.1, dirColor: '#fff6e8', bg: '#a9bdd6', fog: '#b9c9d8', ground: '#5f6f4f', far: 5200 };
  return (
    <>
      <ambientLight intensity={cfg.amb} />
      <hemisphereLight args={['#cfe0ff', '#3a4033', cfg.amb * 0.6]} />
      <directionalLight position={[420, 520, 240]} intensity={cfg.dir} color={cfg.dirColor} />
      <directionalLight position={[-300, 200, -400]} intensity={cfg.dir * 0.25} color="#cfe0ff" />
      <color attach="background" args={[cfg.bg]} />
      <fog attach="fog" args={[cfg.fog, 1400, cfg.far]} />
      <Environment ground={cfg.ground} />
    </>
  );
}

function Environment({ ground }: { ground: string }) {
  const paddocks = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = -6; i <= 6; i++) {
      for (let j = -6; j <= 6; j++) {
        const x = i * 190 + (j % 2 ? 40 : 0);
        const z = j * 190;
        if (Math.abs(x) < 430 && Math.abs(z) < 430) continue;
        if (z < -430 && z > -520 && Math.abs(x) < 520) continue;
        out.push([x, z]);
      }
    }
    return out;
  }, []);

  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <planeGeometry args={[7000, 7000]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      {/* neighbouring paddocks */}
      <InstancedPlanes offsets={paddocks} size={[160, 160]} color="#65764f" opacity={0.85} y={-0.3} />
      {/* public road to the north */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, -470]}>
          <planeGeometry args={[4000, 16]} />
          <meshStandardMaterial color="#4a4a4c" roughness={1} />
        </mesh>
      </group>
      {/* coastal hint to the south-west */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1400, -0.4, 1500]}>
        <planeGeometry args={[2600, 1400]} />
        <meshStandardMaterial color="#2f5c74" roughness={0.4} />
      </mesh>
      <Grid
        position={[0, 0.02, 0]}
        args={[1600, 1600]}
        cellSize={50}
        cellThickness={0.6}
        cellColor="#8fa0ae"
        sectionSize={250}
        sectionThickness={1.1}
        sectionColor="#c2cedb"
        fadeDistance={1900}
        fadeStrength={1.4}
        followCamera={false}
        infiniteGrid={false}
      />
    </group>
  );
}

function CameraRig() {
  const controls = useRef<any>(null);
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
      maxDistance={2600}
      maxPolarAngle={Math.PI * 0.495}
      target={[-40, 0, 20]}
    />
  );
}

function Deselect() {
  const select = useStore((s) => s.select);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1.2, 0]}
      onClick={() => select(null, false)}
      visible={false}
    >
      <planeGeometry args={[9000, 9000]} />
      <meshBasicMaterial />
    </mesh>
  );
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [560, 430, 640], fov: 42, near: 1, far: 8000 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => useStore.getState().select(null, false)}
    >
      <CameraRig />
      <Lighting />
      <Deselect />
      <Campus />
      <Flows />
      <Plane size={[700, 700]} color="#6a7a5c" opacity={0.35} y={-0.05} />
    </Canvas>
  );
}