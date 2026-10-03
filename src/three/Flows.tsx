import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { FLOW_LINKS, type FlowLink, type FlowMedium } from '../data/campus';
import { useStore, type Mode } from '../state/store';
import { JOURNEYS } from '../data/journeys';

export const MEDIUM_STYLE: Record<FlowMedium, { color: string; width: number; speed: number; dash: number; gap: number }> = {
  hv: { color: '#ff9f43', width: 3.4, speed: 22, dash: 9, gap: 5 },
  mv: { color: '#ffd166', width: 2.8, speed: 20, dash: 8, gap: 4.5 },
  lv: { color: '#ffe9a3', width: 2.2, speed: 18, dash: 7, gap: 4 },
  rack: { color: '#fff6d5', width: 1.7, speed: 16, dash: 5, gap: 3 },
  coolant: { color: '#ff7a5b', width: 2.1, speed: 14, dash: 7, gap: 4 },
  chilled: { color: '#ff9d8a', width: 1.9, speed: 13, dash: 6, gap: 3.5 },
  water: { color: '#38bdf8', width: 2.1, speed: 12, dash: 8, gap: 4 },
  makeup: { color: '#7dd3fc', width: 1.7, speed: 11, dash: 7, gap: 4 },
  drain: { color: '#1d4ed8', width: 1.7, speed: 10, dash: 7, gap: 4 },
  air: { color: '#fbbf24', width: 1.4, speed: 9, dash: 5, gap: 3 },
  fibre: { color: '#c4b5fd', width: 1.8, speed: 20, dash: 6, gap: 3 },
  signal: { color: '#94a3b8', width: 1.2, speed: 10, dash: 4, gap: 3 },
};

import { COMPONENT_BY_ID } from '../data/campus';

function anchor(id: string): THREE.Vector3 {
  const c = COMPONENT_BY_ID[id];
  if (!c) return new THREE.Vector3();
  return new THREE.Vector3(c.pos[0], c.pos[1] + c.size[1] / 2 + 1.2, c.pos[2]);
}

function curveFor(link: FlowLink) {
  const a = anchor(link.from);
  const b = anchor(link.to);
  if (link.via && link.via.length) {
    const pts = [a, ...link.via.map((v) => new THREE.Vector3(v[0], v[1], v[2])), b];
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25);
  }
  const dist = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y += Math.min(40, dist * 0.09);
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

function systemsForMode(mode: Mode): Set<string> {
  switch (mode) {
    case 'power':
      return new Set(['power']);
    case 'cooling':
      return new Set(['cooling']);
    case 'water':
      return new Set(['water']);
    case 'data':
      return new Set(['data']);
    case 'resilience':
      return new Set(['power', 'cooling']);
    case 'overview':
      return new Set(['power', 'cooling', 'water', 'data']);
    default:
      return new Set();
  }
}

function AnimatedLine({
  curve,
  color,
  width,
  speed,
  dash,
  gap,
  opacity,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  color: string;
  width: number;
  speed: number;
  dash: number;
  gap: number;
  opacity: number;
}) {
  const ref = useRef<any>(null);
  const pts = useMemo(() => curve.getPoints(48), [curve]);
  useFrame((_, dt) => {
    if (ref.current?.material) {
      ref.current.material.dashOffset -= speed * dt;
      ref.current.material.needsUpdate = false;
    }
  });
  return (
    <Line
      ref={ref}
      points={pts}
      color={color}
      lineWidth={width}
      dashed
      dashSize={dash}
      gapSize={gap}
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  );
}

export function Flows() {
  const mode = useStore((s) => s.mode);
  const flows = useStore((s) => s.flows);
  const selected = useStore((s) => s.selected);
  const journey = useStore((s) => s.journey);
  const isolateTrain = useStore((s) => s.isolateTrain);

  const visible = systemsForMode(mode);

  const focusSet = useMemo(() => {
    if (!journey) return null;
    const j = JOURNEYS.find((x) => x.id === journey.id);
    if (!j) return null;
    return new Set(j.steps[Math.min(journey.step, j.steps.length - 1)]?.focus ?? []);
  }, [journey]);

  const items = useMemo(() => {
    if (!flows) return [];
    return FLOW_LINKS.filter((lk) => {
      if (!visible.has(lk.system)) return false;
      if (isolateTrain === 'power' && lk.system !== 'power') return false;
      if (isolateTrain === 'cooling' && lk.system !== 'cooling') return false;
      if (focusSet && !(focusSet.has(lk.from) && focusSet.has(lk.to))) return false;
      return true;
    }).map((lk) => ({ lk, curve: curveFor(lk) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flows, visible, isolateTrain, mode, focusSet]);

  // active ids for highlighting: selected component's direct links, or journey focus
  const active = useMemo(() => {
    const set = new Set<string>();
    if (selected) {
      for (const lk of FLOW_LINKS) {
        if (lk.from === selected || lk.to === selected) {
          set.add(lk.id);
          set.add(lk.from);
          set.add(lk.to);
        }
      }
    }
    return set;
  }, [selected]);

  if (items.length === 0) return null;

  return (
    <group>
      {items.map(({ lk, curve }) => {
        const style = MEDIUM_STYLE[lk.medium];
        const focused = active.size > 0 ? active.has(lk.id) : false;
        const dimmed = active.size > 0 && !focused;
        let opacity = mode === 'overview' ? 0.34 : 0.82;
        if (focused) opacity = 1;
        if (dimmed) opacity *= 0.25;
        return (
          <group key={lk.id}>
            <AnimatedLine
              curve={lk.reversed ? reverseCurve(curve) : curve}
              color={style.color}
              width={focused ? style.width + 0.9 : style.width}
              speed={style.speed}
              dash={style.dash}
              gap={style.gap}
              opacity={opacity}
            />
            {focused && <PacketHerald curve={lk.reversed ? reverseCurve(curve) : curve} color={style.color} />}
          </group>
        );
      })}
    </group>
  );
}

function reverseCurve(c: THREE.Curve<THREE.Vector3>) {
  const pts = c.getPoints(24).reverse();
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
}

/** A bright marker travelling along an emphasised flow path. */
function PacketHerald({ curve, color }: { curve: THREE.Curve<THREE.Vector3>; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.16) % 1;
    const p = curve.getPointAt(t);
    ref.current.position.copy(p);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.1, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
