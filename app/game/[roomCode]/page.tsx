"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import styles from "./game.module.css";
import { useGameStore } from "@/store/gameStore";

// This needs to be loaded client-side only
const Game3D = dynamic(() => import("@/components/Game3D"), { ssr: false });

export default function GamePage() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const [playerCount, setPlayerCount] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);

  // Get host ID from the game store
  const hostId = useGameStore((state) => state.hostId);
  const playerId = useGameStore((state) =>
    Object.keys(state.players).find((id) => state.players[id].id === id)
  );

  // Determine if current player is the host
  const isHost = hostId === playerId;

  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <main className={styles.main}>
      <div className={styles.gameContainer}>
        {!gameStarted ? (
          <div className={styles.lobby}>
            <h1>Room: {roomCode}</h1>
            <p>Players connected: {playerCount}</p>
            <p>Host status: {isHost ? "Host" : "Not host"}</p>

            <div className={styles.instructions}>
              <h2>How to Play</h2>
              <p>- Press SPACE to jump</p>
              <p>- Race to the finish line</p>
              <p>- Avoid obstacles and other players</p>
            </div>

            {isHost ? (
              <button onClick={startGame} className={styles.startButton}>
                Start Game
              </button>
            ) : (
              <p>Waiting for host to start the game...</p>
            )}

            <Link href="/" className={styles.backButton}>
              Leave Room
            </Link>
          </div>
        ) : (
          <Game3D roomCode={roomCode} onPlayerCountChange={setPlayerCount} />
        )}
      </div>
    </main>
  );
}
