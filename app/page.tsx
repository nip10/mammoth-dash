"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import './globals.css';
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);

  const createRoom = () => {
    // Generate random room code
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/game/${newRoomCode}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/game/${roomCode.trim().toUpperCase()}`);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Crazy Mammoths</h1>

        <div className={styles.buttons}>
          <button onClick={createRoom} className={styles.button}>
            Create Room
          </button>
          <button
            onClick={() => setShowJoinForm(!showJoinForm)}
            className={styles.button}
          >
            Join Room
          </button>
        </div>

        {showJoinForm && (
          <form onSubmit={joinRoom} className={styles.form}>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className={styles.input}
            />
            <button type="submit" className={styles.button}>
              Join
            </button>
          </form>
        )}
      </div>
    </main>
  );
}