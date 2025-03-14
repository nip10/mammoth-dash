"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Sky, PerspectiveCamera, Stats } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import Terrain from "./Terrain";
import Player from "./Player";
import FinishLine from "./FinishLine";
import usePartySocket from "partysocket/react";
import { generateRandomColor } from "@/utils/helpers";
import { Game3DProps, JoinMessage, StartGameMessage } from "@/types/types";
import { Vector3 } from "three";
import styles from "./Game3D.module.css";

export default function Game3D({ roomCode, onPlayerCountChange }: Game3DProps) {
  // Generate a unique player ID and color
  const playerIdRef = useRef(
    `player_${Math.random().toString(36).substring(2, 9)}`
  );
  const playerColorRef = useRef(generateRandomColor());

  // Game state refs
  const jumpRef = useRef(false);
  const gameTimeRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const hasJoinedRef = useRef(false);

  // Track connection status for UI
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [showStartButton, setShowStartButton] = useState(false);
  const [scores, setScores] = useState<{ [key: string]: number }>({});

  // Get game state from store
  const gameStarted = useGameStore((state) => state.gameStarted);
  const players = useGameStore((state) => state.players);
  const hostId = useGameStore((state) => state.hostId);
  const finishLine = useGameStore((state) => state.finishLine);

  const currentPlayer = players[playerIdRef.current];
  const isHost = hostId === playerIdRef.current;

  // Show start button for host when connected but game not started
  useEffect(() => {
    setShowStartButton(
      isHost && connectionStatus === "Connected" && !gameStarted
    );
  }, [isHost, connectionStatus, gameStarted]);

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        gameStarted &&
        currentPlayer &&
        !currentPlayer.isJumping &&
        !currentPlayer.finished
      ) {
        jumpRef.current = true;
        e.preventDefault();
      }
    },
    [gameStarted, currentPlayer]
  );

  // Game loop function
  const startGameLoop = useCallback(
    (socket: { send: (data: string) => void }) => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }

      if (!gameStarted || !currentPlayer || currentPlayer.finished) {
        return;
      }

      let lastTime = performance.now();

      const gameLoop = (currentTime: number) => {
        const deltaTime = Math.min(currentTime - lastTime, 33); // Cap at ~30fps for stability
        lastTime = currentTime;
        gameTimeRef.current += deltaTime;

        // Only update if we have a current player
        if (currentPlayer && !currentPlayer.finished && gameStarted) {
          const playerUpdate = {
            ...currentPlayer,
            velocityX: currentPlayer.velocityX || 0, // Initialize if not present
          };

          // Handle jumping
          if (jumpRef.current && !playerUpdate.isJumping) {
            playerUpdate.velocityY = -8; // Negative is up
            playerUpdate.isJumping = true;
            jumpRef.current = false;

            // Small forward boost when jumping
            playerUpdate.velocityX += 0.5;
          }

          // Apply gravity
          const gravity = 0.4 * (deltaTime / 16.67);
          playerUpdate.velocityY += gravity;

          // Apply terrain effect - steeper slope = more acceleration
          const terrainSlope = Math.sin(playerUpdate.x / 50) * 0.5 + 0.3; // Base downhill slope

          // Accelerate based on slope
          playerUpdate.velocityX += terrainSlope * 0.1 * (deltaTime / 16.67);

          // Apply friction
          playerUpdate.velocityX *= 0.99;

          // Ensure minimum speed
          playerUpdate.velocityX = Math.max(playerUpdate.velocityX, 0.1);

          // Update position
          playerUpdate.x += playerUpdate.velocityX * (deltaTime / 16.67);
          playerUpdate.y += playerUpdate.velocityY * (deltaTime / 16.67);

          // Ground collision detection
          const groundY =
            Math.sin(playerUpdate.x / 50) * 5 + playerUpdate.x * 0.1;
          if (playerUpdate.y > groundY) {
            playerUpdate.y = groundY;
            playerUpdate.velocityY = 0;
            playerUpdate.isJumping = false;
          }

          // Check finish line
          if (playerUpdate.x >= finishLine) {
            playerUpdate.finished = true;
            playerUpdate.finishTime = gameTimeRef.current;

            // Update scores
            setScores((prev) => ({
              ...prev,
              [playerUpdate.id]: Math.floor(gameTimeRef.current / 1000),
            }));
          }

          // Send updated player state
          socket.send(
            JSON.stringify({
              type: "updatePlayer",
              player: playerUpdate,
            })
          );
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [gameStarted, currentPlayer, finishLine]
  );

  // Use the official PartySocket hook
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: roomCode,
    onOpen: () => {
      setConnectionStatus("Connected");

      // Join the game when connected
      if (!hasJoinedRef.current) {
        const joinMessage: JoinMessage = {
          type: "join",
          playerId: playerIdRef.current,
          playerColor: playerColorRef.current,
        };

        socket.send(JSON.stringify(joinMessage));
        hasJoinedRef.current = true;
      }
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data as string);

        if (data.type === "gameState") {
          useGameStore.getState().setGameState(data.state);

          // Update scores from game state
          if (data.state.scores) {
            setScores(data.state.scores);
          }
        } else if (data.type === "playerCount") {
          onPlayerCountChange(data.count);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    },
    onClose: () => {
      setConnectionStatus("Disconnected - Trying to reconnect...");
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Connection error");
    },
  });

  // Handle keyboard events
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Start/stop game loop based on game state
  useEffect(() => {
    if (gameStarted && currentPlayer && socket) {
      startGameLoop(socket);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameStarted, currentPlayer, socket, startGameLoop]);

  // Calculate camera position based on player position or use a default position
  const cameraPosition = useMemo(() => {
    if (gameStarted && currentPlayer) {
      // Position camera above and behind player during race
      return new Vector3(currentPlayer.x - 10, currentPlayer.y - 15, 20);
    } else {
      // Position camera to show the starting ramp before race starts
      return new Vector3(-20, -10, 30);
    }
  }, [gameStarted, currentPlayer]);

  // Calculate camera target
  const cameraTarget = useMemo(() => {
    if (gameStarted && currentPlayer) {
      // Look at player during race
      return new Vector3(currentPlayer.x, currentPlayer.y, 0);
    } else {
      // Look at starting area before race
      return new Vector3(10, 0, 0);
    }
  }, [gameStarted, currentPlayer]);

  // Start the game (host only)
  const handleStartGame = () => {
    if (isHost && socket) {
      const startMessage: StartGameMessage = {
        type: "startGame",
      };
      socket.send(JSON.stringify(startMessage));
    }
  };

  // Get player positions sorted by progress
  const playerPositions = useMemo(() => {
    return Object.values(players)
      .sort((a, b) => b.x - a.x)
      .map((player, index) => ({
        id: player.id,
        position: index + 1,
        color: player.color,
        x: player.x.toFixed(1),
        finished: player.finished,
        score: scores[player.id] || 0,
      }));
  }, [players, scores]);

  return (
    <>
      <div className={styles.gameUi}>
        <div className={styles.gameControls}>
          {gameStarted && (
            <div className={styles.controlHint}>SPACE to jump</div>
          )}

          <div className={styles.gameStatus}>
            <div className={styles.playerCount}>
              Players: {Object.keys(players).length}
            </div>
            <div
              className={`${styles.connectionStatus} ${
                connectionStatus === "Connected"
                  ? styles.connected
                  : styles.disconnected
              }`}
            >
              {connectionStatus}
            </div>
          </div>

          {showStartButton && (
            <button className={styles.startButton} onClick={handleStartGame}>
              Start Race!
            </button>
          )}

          {gameStarted && (
            <div className={styles.scoreBoard}>
              <div className={styles.scoreTitle}>SCORE | BEST</div>
              {playerPositions.map((player) => (
                <div key={player.id} className={styles.scoreRow}>
                  <div
                    className={styles.scorePosition}
                    style={{ color: player.color }}
                  >
                    {player.position < 10
                      ? `0${player.position}`
                      : player.position}
                  </div>
                  <div className={styles.scoreValue}>
                    {player.finished ? player.score : "-"}
                  </div>
                  <div className={styles.scoreBest}>
                    {player.finished ? player.score : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        {/* Sky blue background */}
        <color attach="background" args={[0x87ceeb]} />

        {/* Camera setup */}
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          lookAt={cameraTarget}
          fov={60}
          near={0.1}
          far={1000}
        />

        {/* Lighting and environment */}
        <Sky sunPosition={[100, 10, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Game elements */}
        <Physics gravity={[0, 9.8, 0]}>
          {/* Snowy mountain terrain */}
          <Terrain />

          {/* Finish line */}
          <FinishLine position={finishLine || 1000} />

          {/* Players */}
          {Object.values(players).map((player) => (
            <Player
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === playerIdRef.current}
            />
          ))}
        </Physics>

        {process.env.NODE_ENV === "development" && <Stats />}
      </Canvas>
    </>
  );
}
