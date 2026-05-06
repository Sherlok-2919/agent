"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingRing({ radius, tubeRadius, color, speed, offset }: {
  radius: number; tubeRadius: number; color: string; speed: number; offset: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + offset;
    ref.current.rotation.x = Math.sin(t) * 0.5;
    ref.current.rotation.y = t * 0.3;
    ref.current.position.y = Math.sin(t * 0.5) * 0.3;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, tubeRadius, 16, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.5} wireframe />
    </mesh>
  );
}

function GlowingSphere({ position, color, scale = 0.15 }: {
  position: [number, number, number]; color: string; scale?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.3;
    ref.current.scale.setScalar(scale + Math.sin(t * 2) * 0.03);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.7} />
    </mesh>
  );
}

function HexGrid() {
  const ref = useRef<THREE.LineSegments>(null!);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const cols = 12, rows = 8, size = 0.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * size * 1.8 - (cols * size * 0.9) + (r % 2 === 0 ? size * 0.9 : 0);
        const z = r * size * 1.5 - (rows * size * 0.75);
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i, a2 = (Math.PI / 3) * (i + 1);
          vertices.push(x + Math.cos(a1) * size * 0.4, 0, z + Math.sin(a1) * size * 0.4);
          vertices.push(x + Math.cos(a2) * size * 0.4, 0, z + Math.sin(a2) * size * 0.4);
        }
      }
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  useFrame((state) => {
    ref.current.rotation.x = -Math.PI / 2.5;
    ref.current.position.y = -3;
    ref.current.position.z = -2;
    (ref.current.material as THREE.LineBasicMaterial).opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#FF4655" transparent opacity={0.12} />
    </lineSegments>
  );
}

export default function HeroScene() {
  return (
    <group>
      <ambientLight intensity={0.12} />
      <pointLight position={[5, 5, 5]} color="#FF4655" intensity={2} distance={20} />
      <pointLight position={[-5, 3, -5]} color="#17DEA6" intensity={1.2} distance={20} />
      <pointLight position={[0, -3, 5]} color="#FF4655" intensity={0.8} distance={15} />

      <FloatingRing radius={2.5} tubeRadius={0.015} color="#FF4655" speed={0.3} offset={0} />
      <FloatingRing radius={3.2} tubeRadius={0.01} color="#17DEA6" speed={0.2} offset={2} />
      <FloatingRing radius={1.8} tubeRadius={0.012} color="#FF4655" speed={0.4} offset={4} />

      <GlowingSphere position={[-3, 1, -2]} color="#FF4655" scale={0.12} />
      <GlowingSphere position={[3.5, -1, -1]} color="#17DEA6" scale={0.1} />
      <GlowingSphere position={[1, 2.5, -3]} color="#FF4655" scale={0.08} />
      <GlowingSphere position={[-2, -2, 1]} color="#BD3944" scale={0.15} />
      <GlowingSphere position={[4, 0.5, 2]} color="#17DEA6" scale={0.06} />

      <HexGrid />
    </group>
  );
}
