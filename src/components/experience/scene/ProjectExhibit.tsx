"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { ProjectConfig } from "@/config/portfolio";
import { computeScrollExhibitTransform, exclusiveOpacity, getGlitchIntensity, sectionLocalProgress } from "@/lib/scroll/timeline";
import { useImageTexture } from "@/lib/three/useImageTexture";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import FinanceMoneyAsset from "./FinanceMoneyAsset";

interface ProjectExhibitProps {
  project: ProjectConfig;
  zPosition: number;
  xOffset: number;
  side: -1 | 1;
  onSelect?: () => void;
}

export default function ProjectExhibit({
  project,
  zPosition,
  xOffset,
  side,
  onSelect,
}: ProjectExhibitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const backPlateRef = useRef<THREE.Mesh>(null);
  const texture = useImageTexture(project.image);
  const isFinance = project.id === "finance";

  const uniforms = useMemo(
    () => ({
      uGlitch: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  );

  const screenMaterial = useMemo(() => {
    if (!texture || isFinance) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uGlitch: uniforms.uGlitch,
        uTime: uniforms.uTime,
        uColor: { value: new THREE.Color(project.color) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uGlitch;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          if (uGlitch > 0.01) {
            float shift = sin(uv.y * 120.0 + uTime * 30.0) * 0.004 * uGlitch;
            uv.x += shift;
          }
          vec4 tex = texture2D(uMap, uv);
          vec3 col = tex.rgb;
          float edge = smoothstep(0.0, 0.025, min(uv.x, min(uv.y, min(1.0-uv.x, 1.0-uv.y))));
          col += uColor * 0.1 * edge;
          gl_FragColor = vec4(col, tex.a);
        }
      `,
      transparent: true,
    });
  }, [texture, project.color, uniforms.uGlitch, uniforms.uTime, isFinance]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const p = scrollEngine.progress;
    const visibility = exclusiveOpacity(
      p,
      project.timelineStart,
      project.timelineEnd,
      0.022
    );
    const local = sectionLocalProgress(p, project.timelineStart, project.timelineEnd);
    const anim = computeScrollExhibitTransform(local, side, visibility);
    const glitch = getGlitchIntensity(p);

    if (screenMaterial) {
      uniforms.uGlitch.value = glitch;
      uniforms.uTime.value = state.clock.elapsedTime;
    }

    groupRef.current.visible = visibility > 0.01;
    groupRef.current.position.set(
      xOffset + anim.x,
      anim.y,
      zPosition + anim.z
    );
    groupRef.current.rotation.set(anim.rotX, anim.rotY, anim.rotZ);
    groupRef.current.scale.setScalar(anim.scale);

    if (screenRef.current) {
      screenRef.current.position.z = 0.1 + anim.depth * 0.35;
    }
    if (backPlateRef.current) {
      const mat = backPlateRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + glitch * 0.6 + visibility * 0.2;
      mat.opacity = 0.4 + visibility * 0.55;
      backPlateRef.current.position.z = -0.14 - anim.depth * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[xOffset, 0, zPosition]}>
      <RoundedBox
        ref={backPlateRef}
        args={[5.8, 3.55, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[0, 0, -0.12]}
      >
        <meshStandardMaterial
          color="#0a1018"
          emissive={project.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.55}
          metalness={0.7}
          roughness={0.2}
        />
      </RoundedBox>

      {isFinance ? (
        <FinanceMoneyAsset color={project.color} onSelect={onSelect} />
      ) : screenMaterial ? (
        <mesh
          ref={screenRef}
          material={screenMaterial}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          <planeGeometry args={[5.35, 3.05]} />
        </mesh>
      ) : null}

      <mesh position={[-2.95, 0, 0.16]}>
        <boxGeometry args={[0.05, 3.75, 0.05]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.8} />
      </mesh>
      <mesh position={[2.95, 0, 0.16]}>
        <boxGeometry args={[0.05, 3.75, 0.05]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.8} />
      </mesh>

      <pointLight position={[0, 0, 2]} intensity={0.55} color={project.color} distance={7} />
    </group>
  );
}
