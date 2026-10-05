"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

import { useInView } from "@/hooks/useInView";

function Starfield() {
  const count = 150;
  
  const [[positions, opacities]] = useState(() => {
    const pos = new Float32Array(count * 3);
    const ops = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
      ops[i] = Math.random() * 0.5 + 0.1;
    }
    return [pos, ops];
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        color: { value: new THREE.Color("#ffffff") }
      },
      vertexShader: `
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0 * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(color, vOpacity * (1.0 - dist * 2.0));
        }
      `
    });
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} args={[positions, 3]} />
        <bufferAttribute attach="attributes-opacity" count={count} args={[opacities, 1]} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}

function FloatingSquares() {
  const groupRef = useRef<THREE.Group>(null);
  
  const [squares] = useState(() => {
    return Array.from({ length: 8 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 8, 
        (Math.random() - 0.5) * 6, 
        (Math.random() - 0.5) * 4 + 2
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      ] as [number, number, number],
      scale: Math.random() * 0.15 + 0.1,
      speed: Math.random() * 0.5 + 0.2
    }));
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const t = state.clock.elapsedTime;
        child.rotation.x += 0.01 * squares[i].speed;
        child.rotation.y += 0.015 * squares[i].speed;
        child.position.y += Math.sin(t * squares[i].speed + i) * 0.005;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        squares.map((sq: any, i: number) => (
        <mesh key={i} position={sq.position} rotation={sq.rotation} scale={sq.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#FF107A" emissive="#FF107A" emissiveIntensity={0.5} roughness={0.2} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

import { Environment, Float, Lightformer } from "@react-three/drei";

function SlicedSphere() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      groupRef.current.rotation.x = Math.PI / 4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  const R = 2.4;
  const numSlices = 12; // Number of bands
  const sliceHeight = (R * 2) / numSlices;
  const gap = 0.08;

  const slices = [];
  for (let i = 0; i < numSlices; i++) {
    const y = -R + (i + 0.5) * sliceHeight;
    // Radius at this height
    const r = Math.sqrt(Math.max(0, R * R - y * y));
    if (r > 0.1) {
      slices.push(
        <mesh key={i} position={[0, y, 0]}>
          {/* Cylinder args: radiusTop, radiusBottom, height, radialSegments */}
          <cylinderGeometry args={[r, r, sliceHeight - gap, 32]} />
          <meshStandardMaterial 
            color="#46103A" // Deep magenta/purple
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
      );
    }
  }

  return (
    <group>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={groupRef}>
          {slices}
        </group>
      </Float>
      
      {/* Outer subtle glowing dome */}
      <mesh>
        <sphereGeometry args={[R + 0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#FF3D8B"
          transparent
          opacity={0.08}
          roughness={0.1}
          metalness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function SphereArt() {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '200px' });

  return (
    <div ref={ref} className="absolute inset-0 z-0 pointer-events-none opacity-100" style={{ willChange: "transform" }}>
      {inView && (
        <Canvas 
          camera={{ position: [0, 0, 7.5], fov: 45 }}
          dpr={[1, 1.2]}
          gl={{ powerPreference: "high-performance", antialias: false, stencil: false }}
          frameloop="always"
        >
          <ambientLight intensity={0.4} />
          {/* Main light to highlight the bands */}
          <directionalLight position={[5, 5, 5]} intensity={2.5} color="#FF5C93" />
          <directionalLight position={[-5, -5, -5]} intensity={1} color="#C02BD6" />
          
          <SlicedSphere />
          <FloatingSquares />
          <Starfield />
        </Canvas>
      )}
    </div>
  );
}
