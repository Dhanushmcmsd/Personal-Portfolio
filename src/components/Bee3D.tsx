"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Bee3DProps {
  position: [number, number, number];
  buzzing: boolean;
}

export default function Bee3D({ position, buzzing }: Bee3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const wingSpeed = buzzing ? 45 : 25;
    const wingAmp = buzzing ? 0.55 : 0.35;

    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = Math.sin(t * wingSpeed) * wingAmp + 0.2;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -Math.sin(t * wingSpeed) * wingAmp - 0.2;
    }
    if (bodyRef.current) {
      bodyRef.current.rotation.z = buzzing
        ? Math.sin(t * 20) * 0.08
        : Math.sin(t * 2) * 0.03;
    }
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(t * 3) * 0.002;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={buzzing ? 1.05 : 1}>
      <group ref={bodyRef}>
        {/* Abdomen */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <sphereGeometry args={[0.32, 20, 20]} />
          <meshStandardMaterial color="#F5C518" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Stripes */}
        {[-0.05, 0.02, 0.09].map((y) => (
          <mesh key={y} position={[0, y - 0.1, 0.28]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.55, 0.06, 0.08]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        ))}

        {/* Thorax */}
        <mesh position={[0, 0.12, 0.05]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#F5C518" roughness={0.4} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.28, 0.12]} castShadow>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#F5C518" roughness={0.35} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.08, 0.3, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.08, 0.3, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Antennae */}
        <mesh position={[-0.05, 0.38, 0.18]} rotation={[0.3, 0, 0.4]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.05, 0.38, 0.18]} rotation={[0.3, 0, -0.4]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Stinger */}
        <mesh position={[0, -0.42, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.04, 0.1, 6]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Wings */}
      <mesh ref={leftWingRef} position={[-0.28, 0.15, 0.05]}>
        <planeGeometry args={[0.45, 0.28]} />
        <meshStandardMaterial
          color="#e8eeff"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          roughness={0.1}
        />
      </mesh>
      <mesh ref={rightWingRef} position={[0.28, 0.15, 0.05]}>
        <planeGeometry args={[0.45, 0.28]} />
        <meshStandardMaterial
          color="#e8eeff"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
