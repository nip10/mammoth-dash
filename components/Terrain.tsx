import { useRef } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
export default function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Load snow texture
  const snowTexture = useTexture("/textures/snow.jpg");

  // Make the texture repeat
  snowTexture.repeat.set(20, 20);
  snowTexture.wrapS = snowTexture.wrapT = THREE.RepeatWrapping;

  // Create a simple ramp function for the terrain
  const getTerrainY = (x: number, z: number) => {
    // Base slope
    const baseSlope = x * 0.1;

    // Add some variation with sine waves
    const variation = Math.sin(x / 20) * 2 + Math.sin(x / 10 + z / 5) * 1;

    return baseSlope + variation;
  };

  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      ref={meshRef}
    >
      {/* Create a plane geometry for the terrain */}
      <planeGeometry args={[2000, 1000, 100, 100]} />

      {/* Apply snow material */}
      <meshStandardMaterial
        map={snowTexture}
        color="#ffffff"
        roughness={0.8}
        metalness={0.1}
        bumpMap={snowTexture}
        bumpScale={0.5}
        displacementMap={snowTexture}
        displacementScale={5}
        displacementBias={-2.5}
      />
    </mesh>
  );
}
