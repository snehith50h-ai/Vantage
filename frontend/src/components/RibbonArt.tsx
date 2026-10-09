"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import { useInView } from "@/hooks/useInView";

function RibbonMesh({ 
  curve, 
  color, 
  emissive, 
  scale, 
  speed,
  offset 
}: { 
  curve: THREE.CatmullRomCurve3, 
  color: string, 
  emissive: string, 
  scale: [number, number, number], 
  speed: number,
  offset: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    // 64 segments for length, 8 for radial is plenty for a squashed ribbon
    return new THREE.TubeGeometry(curve, 64, 0.5, 8, false);
  }, [curve]);

  useFrame((state) => {
    if (meshRef.current) {
      // Flowing animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * speed + offset) * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.5 + offset) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={scale}>
      <meshStandardMaterial 
        color={color}
        emissive={emissive}
        emissiveIntensity={0.8}
        roughness={0.15}
        metalness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Ribbons() {
  const groupRef = useRef<THREE.Group>(null);

  const curve1 = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6, -2, -2),
    new THREE.Vector3(-2, 2, 1),
    new THREE.Vector3(2, -2, 2),
    new THREE.Vector3(6, 2, -1)
  ]), []);

  const curve2 = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6, 2, 1),
    new THREE.Vector3(-2, -2, -2),
    new THREE.Vector3(2, 2, -1),
    new THREE.Vector3(6, -2, 2)
  ]), []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      
      // Gentle mouse parallax
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        (state.pointer.y * Math.PI) / 12,
        0.05
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        (state.pointer.x * Math.PI) / 12,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <RibbonMesh 
          curve={curve1} 
          color="#0F0518" 
          emissive="#FF107A" 
          scale={[1, 0.1, 1]} // Squashed into a ribbon
          speed={0.5}
          offset={0}
        />
        <RibbonMesh 
          curve={curve2} 
          color="#0F0518" 
          emissive="#7A10FF" 
          scale={[1, 0.1, 1]} // Squashed into a ribbon
          speed={0.4}
          offset={Math.PI}
        />
      </Float>
    </group>
  );
}

function FloatingPackets() {
  const groupRef = useRef<THREE.Group>(null);
  
  const [packets] = useState(() => {
    return Array.from({ length: 6 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 15, // Spread across width
        (Math.random() - 0.5) * 10, // Spread across height
        (Math.random() - 0.5) * 5 // Depth
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      ] as [number, number, number],
      scale: Math.random() * 0.15 + 0.1,
      speed: Math.random() * 0.3 + 0.1,
      // Randomly choose between pink and cyan
      color: Math.random() > 0.5 ? "#FF107A" : "#00E5FF"
    }));
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const pkt = packets[i];
        if (!pkt) return;
        child.rotation.x += 0.01 * pkt.speed;
        child.rotation.y += 0.015 * pkt.speed;
        // Slowly float upwards
        child.position.y += 0.01 * pkt.speed;
        // Reset if it goes too high
        if (child.position.y > 6) {
          child.position.y = -6;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        packets.map((pkt: any, i: number) => (
        <mesh key={i} position={pkt.position} rotation={pkt.rotation} scale={pkt.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={pkt.color} 
            emissive={pkt.color} 
            emissiveIntensity={0.6} 
            roughness={0.2} 
            metalness={0.1} 
          />
        </mesh>
      ))}
    </group>
  );
}

export default function RibbonArt() {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '200px' });

  return (
    <div 
      ref={ref} 
      className="absolute inset-0 z-0 pointer-events-none opacity-90" 
      style={{ willChange: "transform", transform: "translate3d(0, 0, 0)", backfaceVisibility: "hidden" }}
    >
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 45 }} 
        dpr={[1, 1.2]} 
        gl={{ powerPreference: "high-performance", antialias: false, stencil: false }}
        frameloop={inView ? "always" : "never"}
      >
        {/* Base ambient lighting */}
        <ambientLight intensity={0.2} />
        
        {/* Dynamic colorful point lights to interact with the physical material */}
        <pointLight position={[-5, 2, 2]} color="#FF107A" intensity={10} distance={10} />
        <pointLight position={[5, -2, 2]} color="#7A10FF" intensity={10} distance={10} />
        <pointLight position={[0, 0, 5]} color="#ffffff" intensity={2} distance={10} />

        {/* Environment for gorgeous realistic reflections */}
        <Environment resolution={128}>
          <group rotation={[-Math.PI / 4, -0.3, 0]}>
            <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 1, 1]} />
            <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[5, -1, -1]} scale={[20, 1, 1]} />
            <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[0, 5, -2]} scale={[20, 1, 1]} />
          </group>
        </Environment>

        <Ribbons />
        <FloatingPackets />
        
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom luminanceThreshold={0.5} intensity={1.0} resolutionScale={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
