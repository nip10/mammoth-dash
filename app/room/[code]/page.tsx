"use client";

import dynamic from "next/dynamic";
import styles from "./page.module.css";
import { useGameStore } from "@/store/gameStore";
import { use } from "react";

const Game2D = dynamic(() => import("@/components/Game2D"), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading game...</div>,
});

export default function RoomPage({ params }: any) {
  const { code } = use(params) as { code: string };
  const players = useGameStore((state) => state.players);
  const playerCount = Object.keys(players).length;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Room: {code}</h1>

      <div className={styles.playerList}>
        <h3>Players ({playerCount})</h3>
        {Object.values(players).length > 0 ? (
          <ul>
            {Object.values(players).map((player) => (
              <li key={player.id} className={styles.playerItem}>
                <div
                  className={styles.playerColor}
                  style={{ backgroundColor: player.color }}
                ></div>
                <span className={styles.playerName}>{player.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Waiting for players to join...</p>
        )}
      </div>

      <Game2D roomCode={code} />

      <div className={styles.instructions}>
        <h2>How to Play</h2>
        <p>Press SPACE to jump. Reach the finish line first!</p>
        <p>Share this room code with friends to play together.</p>
      </div>
    </div>
  );
}
