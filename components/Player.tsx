import { useRef, useState, useEffect } from "react";
import { useBox } from "@react-three/cannon";
import { PlayerProps } from "@/types/types";
import { useGameStore } from "@/store/gameStore";

export default function Player({ player, isCurrentPlayer }: PlayerProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: [player.x, player.y, player.z],
    type: "Dynamic",
    args: [1, 1, 1],
    allowSleep: false,
  }));

  const gameStarted = useGameStore((state) => state.gameStarted);

  // Use a ref to track the player's position
  const positionRef = useRef([player.x, player.y, player.z]);

  // Update physics body position when player state changes
  useEffect(() => {
    if (ref.current) {
      api.position.set(player.x, player.y, player.z);
    }
  }, [player.x, player.y, player.z, api.position]);

  // Subscribe to position changes
  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => {
      positionRef.current = p;
    });

    return unsubscribe;
  }, [api.position]);

  // Add a glow effect for the current player
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Player body */}
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={player.color}
        emissive={isCurrentPlayer && hovered ? player.color : "black"}
        emissiveIntensity={isCurrentPlayer && hovered ? 0.5 : 0}
      />

      {/* Player sled */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.5, 0.2, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Player indicator (only for current player) */}
      {isCurrentPlayer && (
        <mesh position={[0, -1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#ffff00"
            emissive="#ffff00"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </mesh>
  );
}
