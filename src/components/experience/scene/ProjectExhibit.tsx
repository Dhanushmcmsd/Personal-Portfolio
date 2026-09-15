"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ProjectConfig } from "@/config/portfolio";
import { useImageTexture } from "@/lib/three/useImageTexture";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getGlitchIntensity, rangeProgress, smoothstep } from "@/lib/scroll/timeline";

interface ProjectExhibitProps {
  project: ProjectConfig;
  zPosition: number;
  xOffset: number;
  onSelect?: () => void;
}

export default function ProjectExhibit({
  project,
  zPosition,
  xOffset,
  onSelect,
}: ProjectExhibitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
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
            float shift = sin(uv.y * 120.0 + uTime * 40.0) * 0.004 * uGlitch;
            uv.x += shift;
          }
          vec4 tex = texture2D(uMap, uv);
          vec3 col = tex.rgb;
          if (uGlitch > 0.01) {
            float r = texture2D(uMap, uv + vec2(0.01 * uGlitch, 0.0)).r;
            float b = texture2D(uMap, uv - vec2(0.01 * uGlitch, 0.0)).b;
            col = vec3(r, col.g, b);
          }
          float edge = smoothstep(0.0, 0.02, min(uv.x, min(uv.y, min(1.0-uv.x, 1.0-uv.y))));
          col += uColor * 0.08 * edge;
          gl_FragColor = vec4(col, tex.a);
        }
      `,
      transparent: true,
    });
  }, [texture, project.color, uniforms.uGlitch, uniforms.uTime]);

  useFrame((state) => {
    if (!screenMaterial) return;
    const p = scrollEngine.progress;
    const enter = rangeProgress(p, project.timelineStart - 0.06, project.timelineStart + 0.04);
    const exit = 1 - smoothstep(project.timelineEnd - 0.04, project.timelineEnd + 0.06, p);
    const visibility = enter * exit;

    const glitch = getGlitchIntensity(p);
    uniforms.uGlitch.value = glitch;
    uniforms.uTime.value = state.clock.elapsedTime;

    if (groupRef.current) {
      const depthOffset = (p - project.timelineStart) * 8;
      groupRef.current.position.set(
        xOffset + Math.sin(state.clock.elapsedTime * 0.4 + zPosition) * 0.15,
        Math.sin(state.clock.elapsedTime * 0.5) * 0.08,
        zPosition - depthOffset * 0.5
      );
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08 - 0.05;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.25) * 0.03;
      groupRef.current.scale.setScalar(0.6 + visibility * 0.4);
      groupRef.current.visible = visibility > 0.02;
    }

    if (frameRef.current) {
      const mat = frameRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + glitch * 0.8;
      mat.opacity = 0.5 + visibility * 0.5;
    }
  });

  if (!screenMaterial) return null;

  return (
    <group ref={groupRef} position={[xOffset, 0, zPosition]}>
      <mesh
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
        <planeGeometry args={[5.2, 3.1]} />
      </mesh>

      <mesh ref={frameRef} position={[0, 0, -0.06]}>
        <boxGeometry args={[5.5, 3.4, 0.08]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Neon edge lights */}
      <mesh position={[-2.8, 0, 0.1]}>
        <boxGeometry args={[0.06, 3.6, 0.06]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[2.8, 0, 0.1]}>
        <boxGeometry args={[0.06, 3.6, 0.06]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
