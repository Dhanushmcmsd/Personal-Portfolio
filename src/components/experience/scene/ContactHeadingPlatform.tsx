"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SECTION } from "@/lib/scroll/timeline";

/** World-space walk surface aligned with the contact heading during the final camera pose. */
export const CONTACT_PLATFORM = {
  center: new THREE.Vector3(0, 0.1, -88),
  width: 5.6,
  topY: 0.34,
  depth: 0.55,
  frontZ: -86.4,
} as const;

export default function ContactHeadingPlatform() {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const p = scrollEngine.progress;
    const contactVis = exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.04);

    groupRef.current.visible = contactVis > 0.02;
    groupRef.current.scale.setScalar(0.88 + contactVis * 0.12);

    if (textRef.current) {
      const mat = textRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = contactVis;
      mat.transparent = true;
    }
  });

  const headingLines = PORTFOLIO_CONFIG.content.contactHeading.replace(" SOMETHING", "\nSOMETHING");

  return (
    <group ref={groupRef} position={CONTACT_PLATFORM.center} visible={false}>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[CONTACT_PLATFORM.width, 0.12, CONTACT_PLATFORM.depth]} />
        <meshStandardMaterial
          color="#101010"
          transparent
          opacity={0.92}
          roughness={0.35}
          metalness={0.08}
        />
      </mesh>

      <mesh position={[0, CONTACT_PLATFORM.topY - CONTACT_PLATFORM.center.y + 0.02, 0]}>
        <boxGeometry args={[CONTACT_PLATFORM.width * 0.98, 0.04, CONTACT_PLATFORM.depth * 0.92]} />
        <meshStandardMaterial
          color="#1a1a1a"
          transparent
          opacity={0.35}
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>

      <Text
        ref={textRef}
        font="https://cdn.jsdelivr.net/npm/three@0.175.0/examples/fonts/helvetiker_bold.typeface.json"
        position={[0, 0.18, CONTACT_PLATFORM.depth * 0.22]}
        fontSize={0.42}
        color="#101010"
        anchorX="center"
        anchorY="middle"
        maxWidth={CONTACT_PLATFORM.width * 0.95}
        textAlign="center"
        lineHeight={0.9}
      >
        {headingLines}
      </Text>
    </group>
  );
}
