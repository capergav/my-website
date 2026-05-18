"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment } from "@react-three/drei";
import * as THREE from "three";

function PhoneModel({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotY = useRef(0);
  const targetRotX = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    targetRotY.current = mouseX * 0.4;
    targetRotX.current = -mouseY * 0.15;
    groupRef.current.rotation.y +=
      (targetRotY.current - groupRef.current.rotation.y) * 0.08;
    groupRef.current.rotation.x +=
      (targetRotX.current - groupRef.current.rotation.x) * 0.08;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
  });

  const silverMat = {
    metalness: 0.95,
    roughness: 0.08,
    color: new THREE.Color("#c8c8d0"),
    envMapIntensity: 1.5,
  };

  const edgeMat = {
    metalness: 0.98,
    roughness: 0.05,
    color: new THREE.Color("#b0b0bc"),
    envMapIntensity: 2,
  };

  return (
    <group ref={groupRef} rotation={[0.08, -0.15, 0]}>
      {/* Main body */}
      <RoundedBox args={[1.8, 3.8, 0.18]} radius={0.22} smoothness={8}>
        <meshStandardMaterial {...silverMat} />
      </RoundedBox>

      {/* Screen face */}
      <RoundedBox args={[1.55, 3.3, 0.01]} radius={0.18} smoothness={8} position={[0, 0, 0.095]}>
        <meshStandardMaterial color="#050505" metalness={0.0} roughness={0.1} envMapIntensity={0.5} />
      </RoundedBox>

      {/* Dynamic island */}
      <RoundedBox args={[0.42, 0.1, 0.01]} radius={0.05} position={[0, 1.52, 0.11]}>
        <meshStandardMaterial color="#000000" roughness={0.2} />
      </RoundedBox>

      {/* Camera bump */}
      <RoundedBox args={[0.52, 0.52, 0.06]} radius={0.1} position={[-0.48, 1.35, -0.11]}>
        <meshStandardMaterial {...edgeMat} />
      </RoundedBox>
      {/* Camera lenses */}
      {([[-0.58, 1.45], [-0.38, 1.45], [-0.58, 1.25]] as [number, number][]).map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.13]}>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 32]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Power button — right */}
      <RoundedBox args={[0.04, 0.35, 0.1]} radius={0.02} position={[0.92, 0.25, 0]}>
        <meshStandardMaterial {...edgeMat} />
      </RoundedBox>

      {/* Volume buttons — left */}
      {([0.55, 0.15, -0.2] as number[]).map((y, i) => (
        <RoundedBox key={i} args={[0.04, 0.2, 0.1]} radius={0.02} position={[-0.92, y, 0]}>
          <meshStandardMaterial {...edgeMat} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Scene({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#e8f0ff" />
      <pointLight position={[0, 0, 4]} intensity={0.5} color="#fff8f0" />
      <PhoneModel mouseX={mouseX} mouseY={mouseY} />
    </>
  );
}

export default function Phone3D({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouse({ x, y });
  };

  const handleMouseLeave = () => setMouse({ x: 0, y: 0 });

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: 280, height: 560 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D phone canvas */}
      <Canvas
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        camera={{ position: [0, 0, 5.5], fov: 35 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene mouseX={mouse.x} mouseY={mouse.y} />
        </Suspense>
      </Canvas>

      {/* Screen content overlay aligned to 3D screen face */}
      <div style={{
        position: "absolute",
        top: "8.5%",
        left: "11%",
        right: "11%",
        bottom: "7%",
        borderRadius: "10%",
        overflow: "hidden",
        pointerEvents: "none",
        transform: `perspective(800px) rotateY(${-mouse.x * 8}deg) rotateX(${mouse.y * 4}deg)`,
        transition: "transform 0.1s ease-out",
      }}>
        {children}
      </div>
    </div>
  );
}
