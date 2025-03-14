"use client";

import { useRef, useEffect, useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import * as THREE from "three";
import { FinishLineProps } from "@/types/types";

export default function FinishLine({ position }: FinishLineProps) {
  const finishLine = useGameStore((state) => state.finishLine);
  const bannerRef = useRef<THREE.Mesh>(null);

  // Create finish banner texture
  const bannerTexture = useMemo(() => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 512, 128);

      // Add a checkerboard pattern border
      ctx.fillStyle = 'black';
      const squareSize = 16;
      for (let x = 0; x < canvas.width; x += squareSize) {
        for (let y = 0; y < canvas.height; y += squareSize) {
          if ((x / squareSize + y / squareSize) % 2 === 0) {
            ctx.fillRect(x, 0, squareSize, squareSize); // Top border
            ctx.fillRect(x, canvas.height - squareSize, squareSize, squareSize); // Bottom border
          }
        }
      }

      // Add text
      ctx.fillStyle = 'black';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FINISH', canvas.width / 2, canvas.height / 2);
    }

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }, []);

  // Create material with the texture
  const bannerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: bannerTexture,
      side: THREE.DoubleSide,
    });
  }, [bannerTexture]);

  // Animate the finish line banner
  useEffect(() => {
    const interval = setInterval(() => {
      if (bannerRef.current) {
        bannerRef.current.rotation.y += 0.01;
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Return null if finishLine is not defined
  if (!finishLine) return null;

  const finishLinePosition = position || finishLine;

  return (
    <group position={[finishLinePosition, 0, -5]}>
      {/* Finish line posts */}
      <mesh position={[0, 10, -5] as [number, number, number]} castShadow>
        <boxGeometry args={[2, 20, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>

      <mesh position={[0, 10, 5] as [number, number, number]} castShadow>
        <boxGeometry args={[2, 20, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* Finish line banner */}
      <mesh
        ref={bannerRef}
        position={[0, 15, 0] as [number, number, number]}
        rotation={[0, Math.PI / 2, 0] as [number, number, number]}
        castShadow
      >
        <planeGeometry args={[12, 3]} />
        <primitive object={bannerMaterial} attach="material" />
      </mesh>

      {/* Checkered pattern on the ground */}
      <mesh
        position={[0, 0.1, 0] as [number, number, number]}
        rotation={[-Math.PI / 2, 0, 0] as [number, number, number]}
        receiveShadow
      >
        <planeGeometry args={[10, 20]} />
        <meshStandardMaterial color="white">
          <primitive
            object={(() => {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const squareSize = 32;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 256, 256);

                ctx.fillStyle = 'black';
                for (let x = 0; x < canvas.width; x += squareSize) {
                  for (let y = 0; y < canvas.height; y += squareSize) {
                    if ((x / squareSize + y / squareSize) % 2 === 0) {
                      ctx.fillRect(x, y, squareSize, squareSize);
                    }
                  }
                }

                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2);
                return texture;
              }

              return new THREE.Texture();
            })()}
            attach="map"
          />
        </meshStandardMaterial>
      </mesh>

      {/* Add confetti particle effect when close to finish line */}
      <points>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[
              (() => {
                const positions = new Float32Array(300 * 3);
                for (let i = 0; i < positions.length; i += 3) {
                  positions[i] = (Math.random() - 0.5) * 10;
                  positions[i + 1] = Math.random() * 20;
                  positions[i + 2] = (Math.random() - 0.5) * 10;
                }
                return positions;
              })(),
              3
            ]}
          />
          <float32BufferAttribute
            attach="attributes-color"
            args={[
              (() => {
                const colors = new Float32Array(300 * 3);
                for (let i = 0; i < colors.length; i += 3) {
                  // Random bright colors
                  colors[i] = Math.random();
                  colors[i + 1] = Math.random();
                  colors[i + 2] = Math.random();
                }
                return colors;
              })(),
              3
            ]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.5} vertexColors />
      </points>
    </group>
  );
}