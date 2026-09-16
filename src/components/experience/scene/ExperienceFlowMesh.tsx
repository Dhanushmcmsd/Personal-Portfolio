"use client";



import { useMemo, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";

import * as THREE from "three";

import { scrollEngine } from "@/lib/scroll/scrollEngine";

import { SECTION, sectionLocalProgress, smootherstep } from "@/lib/scroll/timeline";



const vertexShader = `

  varying vec2 vUv;

  void main() {

    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  }

`;



const fragmentShader = `

  uniform float uTime;

  uniform float uOpacity;

  uniform float uScroll;

  varying vec2 vUv;



  float hash(vec2 p) {

    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);

  }



  float noise(vec2 p) {

    vec2 i = floor(p);

    vec2 f = fract(p);

    float a = hash(i);

    float b = hash(i + vec2(1.0, 0.0));

    float c = hash(i + vec2(0.0, 1.0));

    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;

  }



  float fbm(vec2 p) {

    float v = 0.0;

    float a = 0.5;

    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));

    for (int i = 0; i < 5; i++) {

      v += a * noise(p);

      p = rot * p * 2.02 + vec2(1.7, 9.2);

      a *= 0.5;

    }

    return v;

  }



  void main() {

    vec2 uv = vUv;

    float speed = 0.14;

    float t = uTime * speed;

    float scrollShift = uScroll * 0.12;



    vec2 warpUv = uv * vec2(2.4, 1.8) + vec2(t * 0.08 + scrollShift, t * 0.05);

    float warp = fbm(warpUv);

    vec2 flowUv = uv * vec2(3.2, 2.6) + vec2(warp * 1.4, t * 0.22 + scrollShift * 0.25);

    float flow = fbm(flowUv);



    float ridges = sin((uv.x + flow * 0.42 + warp * 0.2) * 140.0 + t * 0.6) * 0.5 + 0.5;

    ridges = pow(ridges, 2.8);



    float mixVal = clamp(flow * 0.72 + ridges * 0.48, 0.0, 1.0);



    vec3 deep = vec3(0.039, 0.016, 0.063);

    vec3 purple = vec3(0.102, 0.0, 0.2);

    vec3 orange = vec3(1.0, 0.478, 0.102);

    vec3 warm = vec3(1.0, 0.702, 0.278);



    vec3 col = mix(deep, purple, mixVal * 0.65);

    col = mix(col, orange, mixVal * mixVal * 0.82);

    col = mix(col, warm, ridges * flow * 0.55);



    float alpha = uOpacity * (0.42 + mixVal * 0.32 + ridges * 0.22);

    gl_FragColor = vec4(col, alpha);

  }

`;



export default function ExperienceFlowMesh() {

  const meshRef = useRef<THREE.Mesh>(null);

  const anchor = useRef(new THREE.Vector3());

  const { camera } = useThree();



  const uniforms = useMemo(

    () => ({

      uTime: { value: 0 },

      uOpacity: { value: 0 },

      uScroll: { value: 0 },

    }),

    []

  );



  const material = useMemo(

    () =>

      new THREE.ShaderMaterial({

        uniforms,

        vertexShader,

        fragmentShader,

        transparent: true,

        depthWrite: false,

        side: THREE.DoubleSide,

      }),

    [uniforms]

  );



  useFrame((state) => {

    const mesh = meshRef.current;

    if (!mesh) return;



    const local = sectionLocalProgress(

      scrollEngine.progress,

      SECTION.experience[0],

      SECTION.experience[1]

    );

    const vis = smootherstep(0, 0.14, local) * (1 - smootherstep(0.8, 1, local));



    if (vis <= 0.02) {

      mesh.visible = false;

      return;

    }



    mesh.visible = true;



    anchor.current.set(0, 0.05, -4.2);

    anchor.current.applyQuaternion(camera.quaternion);

    anchor.current.add(camera.position);

    mesh.position.copy(anchor.current);

    mesh.quaternion.copy(camera.quaternion);



    uniforms.uTime.value = state.clock.elapsedTime;

    uniforms.uOpacity.value = vis * 0.78;

    uniforms.uScroll.value = local;

  });



  return (

    <mesh ref={meshRef} visible={false} material={material}>

      <planeGeometry args={[28, 16, 1, 1]} />

    </mesh>

  );

}


