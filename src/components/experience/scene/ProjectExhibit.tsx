"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { ProjectConfig } from "@/config/portfolio";
import {
  computeExhibitTransform,
  getAnimationMode,
  getModeBlend,
} from "@/lib/animation/exhibitVariants";
import { useImageTexture } from "@/lib/three/useImageTexture";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, getGlitchIntensity } from "@/lib/scroll/timeline";

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

  const uniforms = useMemo(
    () => ({
      uGlitch: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  );

  const screenMaterial = useMemo(() => {
    if (!texture) return null;
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
            float shift = sin(uv.y * 140.0 + uTime * 55.0) * 0.005 * uGlitch;
            uv.x += shift;
          }
          vec4 tex = texture2D(uMap, uv);
          vec3 col = tex.rgb;
          if (uGlitch > 0.01) {
            float r = texture2D(uMap, uv + vec2(0.012 * uGlitch, 0.0)).r;
            float b = texture2D(uMap, uv - vec2(0.012 * uGlitch, 0.0)).b;
            col = vec3(r, col.g, b);
          }
          float edge = smoothstep(0.0, 0.025, min(uv.x, min(uv.y, min(1.0-uv.x, 1.0-uv.y))));
          col += uColor * 0.12 * edge;
          col *= 0.92 + edge * 0.08;
          gl_FragColor = vec4(col, tex.a);
        }
      `,
      transparent: true,
    });
  }, [texture, project.color, uniforms.uGlitch, uniforms.uTime]);

  useFrame((state) => {
    if (!screenMaterial || !groupRef.current) return;

    const p = scrollEngine.progress;
    const visibility = exclusiveOpacity(
      p,
      project.timelineStart,
      project.timelineEnd,
      0.045
    );
    const glitch = getGlitchIntensity(p);
    const timeMs = state.clock.elapsedTime * 1000;
    const mode = getAnimationMode(timeMs);
    const blend = getModeBlend(timeMs);
    const anim = computeExhibitTransform(
      mode,
      state.clock.elapsedTime,
      visibility,
      side
    );

    uniforms.uGlitch.value = glitch;
    uniforms.uTime.value = state.clock.elapsedTime;

    const enterScale = 0.55 + visibility * 0.45;
    const depthOffset = (p - (project.timelineStart + project.timelineEnd) / 2) * 6;

    groupRef.current.visible = visibility > 0.015;
    groupRef.current.position.set(
      xOffset + anim.x * blend + side * 0.25,
      anim.y * blend,
      zPosition - depthOffset + anim.z * blend
    );
    groupRef.current.rotation.set(
      anim.rotX * blend,
      anim.rotY * blend,
      anim.rotZ * blend
    );
    groupRef.current.scale.setScalar(enterScale * anim.scale);

    if (screenRef.current) {
      screenRef.current.position.z = 0.12 + anim.textDepth * blend * 0.4;
    }
    if (backPlateRef.current) {
      const mat = backPlateRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.35 + glitch * 0.9 + visibility * 0.25;
      mat.opacity = 0.45 + visibility * 0.55;
      backPlateRef.current.position.z = -0.18 - anim.textDepth * blend * 0.25;
    }
  });

  if (!screenMaterial) return null;

  return (
    <Float speed={1.6} rotationIntensity={0.08} floatIntensity={0.18}>
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
            emissiveIntensity={0.35}
            transparent
            opacity={0.6}
            metalness={0.72}
            roughness={0.18}
          />
        </RoundedBox>

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

        <mesh position={[-2.95, 0, 0.18]}>
          <boxGeometry args={[0.05, 3.75, 0.05]} />
          <meshBasicMaterial color={project.color} transparent opacity={0.85} />
        </mesh>
        <mesh position={[2.95, 0, 0.18]}>
          <boxGeometry args={[0.05, 3.75, 0.05]} />
          <meshBasicMaterial color={project.color} transparent opacity={0.85} />
        </mesh>

        <mesh position={[0, 1.95, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.8, 2.85, 48]} />
          <meshBasicMaterial color={project.color} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>

        <pointLight position={[0, 0, 2.5]} intensity={0.8} color={project.color} distance={8} />
      </group>
    </Float>
  );
}
