"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Environment component that adds visual elements to the game world:
 * - Snow particles
 * - Distant mountains
 * - Ambient environmental effects
 */
export default function Environment() {
  // Create a reference to the snow particles
  const snowRef = useRef<THREE.Points>(null);

  // Create snow particles
  const snowCount = 1000;

  // Create snow geometry and material
  const snowGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(snowCount * 3);

    // Fill the array with random positions
    for (let i = 0; i < snowCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100; // x
      positions[i + 1] = Math.random() * 50; // y
      positions[i + 2] = (Math.random() - 0.5) * 100; // z
    }

    // Add the positions to the geometry
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  // Create a material for the snow
  const snowMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Define the mountain type
  type Mountain = {
    position: [number, number, number];
    geometry: THREE.ConeGeometry;
    material: THREE.MeshStandardMaterial;
  };

  // Define mountain geometries and materials
  const mountains = useMemo<Mountain[]>(() => {
    return [
      {
        position: [-40, 20, -100] as [number, number, number],
        geometry: new THREE.ConeGeometry(30, 60, 16),
        material: new THREE.MeshStandardMaterial({
          color: "#b3b3b3",
          roughness: 0.8,
          flatShading: true,
        }),
      },
      {
        position: [10, 30, -120] as [number, number, number],
        geometry: new THREE.ConeGeometry(40, 80, 16),
        material: new THREE.MeshStandardMaterial({
          color: "#a1a1a1",
          roughness: 0.7,
          flatShading: true,
        }),
      },
      {
        position: [60, 25, -110] as [number, number, number],
        geometry: new THREE.ConeGeometry(35, 70, 16),
        material: new THREE.MeshStandardMaterial({
          color: "#c1c1c1",
          roughness: 0.9,
          flatShading: true,
        }),
      },
      {
        position: [-80, 35, -150] as [number, number, number],
        geometry: new THREE.ConeGeometry(45, 90, 16),
        material: new THREE.MeshStandardMaterial({
          color: "#b8b8b8",
          roughness: 0.8,
          flatShading: true,
        }),
      },
      {
        position: [120, 40, -160] as [number, number, number],
        geometry: new THREE.ConeGeometry(50, 100, 16),
        material: new THREE.MeshStandardMaterial({
          color: "#a8a8a8",
          roughness: 0.75,
          flatShading: true,
        }),
      },
    ];
  }, []);

  // Animate snow falling
  useFrame((state) => {
    if (snowRef.current) {
      const positions = snowRef.current.geometry.attributes.position
        .array as Float32Array;
      const time = state.clock.getElapsedTime();

      for (let i = 0; i < positions.length; i += 3) {
        // Move snow downward
        positions[i + 1] -= 0.05;

        // Add some gentle sway
        positions[i] += Math.sin(time + i) * 0.01;
        positions[i + 2] += Math.cos(time + i) * 0.01;

        // Reset position if snow goes below ground
        if (positions[i + 1] < -10) {
          positions[i + 1] = 50;
          positions[i] = (Math.random() - 0.5) * 100 + state.camera.position.x;
          positions[i + 2] = (Math.random() - 0.5) * 100;
        }
      }

      snowRef.current.geometry.attributes.position.needsUpdate = true;

      // Rotate snow particles to face camera
      snowRef.current.rotation.copy(state.camera.rotation);
    }
  });

  return (
    <>
      {/* Snow particles */}
      <points ref={snowRef} geometry={snowGeometry} material={snowMaterial} />

      {/* Background mountains */}
      <group>
        {mountains.map((mountain, index) => (
          <mesh
            key={index}
            position={mountain.position}
            geometry={mountain.geometry}
            material={mountain.material}
            receiveShadow
          />
        ))}
      </group>

      {/* Ground base (far background) */}
      <mesh
        position={[0, -15, -200] as [number, number, number]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Add subtle fog to create depth */}
      <fog attach="fog" args={["#e0f7ff", 100, 300]} />
    </>
  );
}
