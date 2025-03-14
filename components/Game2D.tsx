"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Application, extend, useTick } from "@pixi/react";
import { Container, Graphics, Text, Ticker } from "pixi.js";
import usePartySocket from "partysocket/react";
import { useGameStore } from "@/store/gameStore";
import { Game2DProps, StartGameMessage, JoinMessage } from "@/types/types";
import styles from "./Game2D.module.css";

// Extend with Pixi components
extend({ Container, Graphics, Text });

export default function Game2D({ roomCode }: Game2DProps) {
  // Game state refs
  const jumpRef = useRef(false);
  const gameTimeRef = useRef<number>(0);
  const hasJoinedRef = useRef(false);
  const playerIdRef = useRef<string>("");
  const playerColorRef = useRef<string>("");

  // Track connection status for UI
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  // Get game state from store
  const gameStarted = useGameStore((state) => state.gameStarted);
  const players = useGameStore((state) => state.players);
  const hostId = useGameStore((state) => state.hostId);
  const finishLine = useGameStore((state) => state.finishLine);

  const currentPlayer = players[playerIdRef.current];
  const isHost = hostId === playerIdRef.current;

  // Set up PartyKit socket connection
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: roomCode,
    onOpen: () => {
      console.log("Connected to server");
      setConnectionStatus("Connected");

      // Send join message when connected
      if (!hasJoinedRef.current) {
        console.log("Sending join message to server");
        const joinMessage = {
          type: "join",
        };
        socket.send(JSON.stringify(joinMessage));
      }
    },
    onClose: () => {
      console.log("Disconnected from server");
      setConnectionStatus("Disconnected");
    },
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      switch (message.type) {
        case "joined":
          // Store our player ID if this is a response to our join
          playerIdRef.current = message.playerId;
          console.log("My player ID:", playerIdRef.current);
          break;
        case "gameState":
          // Update entire game state from server
          useGameStore.setState({
            players: message.state.players || {},
            gameStarted: message.state.gameStarted,
            hostId: message.state.hostId,
            finishLine: message.state.finishLine,
          });
          break;
        default:
          console.log("Unknown message type:", message.type);
          break;
      }
    },
  });

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        console.log("Space pressed", {
          gameStarted,
          currentPlayer: currentPlayer?.id,
          isJumping: currentPlayer?.isJumping,
          finished: currentPlayer?.finished,
        });

        if (
          gameStarted &&
          currentPlayer &&
          !currentPlayer.isJumping &&
          !currentPlayer.finished
        ) {
          console.log("Setting jump to true");
          jumpRef.current = true;
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, currentPlayer]);

  // Ground component with dynamic terrain
  const Ground = () => {
    // Get terrain segments from game store
    const terrainSegments = useGameStore((state) => state.terrain || []);

    return (
      <pixiGraphics
        draw={(g) => {
          g.clear();

          // Draw terrain based on segments
          g.beginPath();

          if (terrainSegments.length > 0) {
            // Start at the first point
            g.moveTo(terrainSegments[0].x, terrainSegments[0].height);

            // Draw lines to each segment point
            for (let i = 1; i < terrainSegments.length; i++) {
              g.lineTo(terrainSegments[i].x, terrainSegments[i].height);
            }

            // Close the path to the bottom of the screen
            const lastSegment = terrainSegments[terrainSegments.length - 1];
            g.lineTo(lastSegment.x, 400);
            g.lineTo(0, 400);
            g.closePath();
            g.fill(0x8b4513);

            // Draw grid lines for visual reference
            g.lineStyle(1, 0xffffff, 0.3);
            for (let i = 0; i < terrainSegments.length - 1; i++) {
              const segment = terrainSegments[i];
              const nextSegment = terrainSegments[i + 1];
              g.moveTo(segment.x, segment.height);
              g.lineTo(segment.x, 400);
            }
          }
        }}
      />
    );
  };

  // Helper function to get Y coordinate at a given X on the terrain
  const getYAtX = (x: number) => {
    const terrainSegments = useGameStore.getState().terrain || [];

    if (terrainSegments.length < 2) {
      return 300; // Default ground level if no terrain
    }

    // Find the segment that contains x
    for (let i = 0; i < terrainSegments.length - 1; i++) {
      const segment = terrainSegments[i];
      const nextSegment = terrainSegments[i + 1];

      if (x >= segment.x && x < nextSegment.x) {
        // Linear interpolation between the two points
        const t = (x - segment.x) / (nextSegment.x - segment.x);
        return segment.height + t * (nextSegment.height - segment.height);
      }
    }

    // If x is beyond the last segment, use the last segment's height
    return terrainSegments[terrainSegments.length - 1].height;
  };

  // Helper function to get the slope at a given X on the terrain
  const getSlopeAtX = (x: number) => {
    const terrainSegments = useGameStore.getState().terrain || [];

    if (terrainSegments.length < 2) {
      return 0; // Flat if no terrain
    }

    // Find the segment that contains x
    for (let i = 0; i < terrainSegments.length - 1; i++) {
      const segment = terrainSegments[i];
      const nextSegment = terrainSegments[i + 1];

      if (x >= segment.x && x < nextSegment.x) {
        // Calculate slope (rise / run)
        return (
          (nextSegment.height - segment.height) / (nextSegment.x - segment.x)
        );
      }
    }

    // If x is beyond the last segment, use the last segment's slope
    const lastIndex = terrainSegments.length - 1;
    const secondLastIndex = lastIndex - 1;
    return (
      (terrainSegments[lastIndex].height -
        terrainSegments[secondLastIndex].height) /
      (terrainSegments[lastIndex].x - terrainSegments[secondLastIndex].x)
    );
  };

  // Game loop component
  const GameLoop = () => {
    // Memoize the tick callback to prevent re-renders
    const tickCallback = useCallback(
      (ticker: Ticker) => {
        if (!gameStarted || !currentPlayer || currentPlayer.finished) {
          return;
        }

        // Use ticker.deltaTime for the time elapsed
        gameTimeRef.current += ticker.deltaTime / 60;

        // Update player
        const playerUpdate = {
          ...currentPlayer,
          id: currentPlayer.id,
          velocityX: currentPlayer.velocityX || 0,
          velocityY: currentPlayer.velocityY || 0,
        };

        // Handle jumping
        if (jumpRef.current && !playerUpdate.isJumping) {
          console.log("Jumping!");
          // Get the slope at the player's position
          const slope = getSlopeAtX(playerUpdate.x);
          const angle = Math.atan(slope);

          // Jump perpendicular to the terrain
          const jumpStrength = 12;
          playerUpdate.velocityX -= jumpStrength * Math.sin(angle);
          playerUpdate.velocityY -= jumpStrength * Math.cos(angle);

          playerUpdate.isJumping = true;
          jumpRef.current = false;
        }

        // Apply gravity (9.8 m/s^2)
        const gravity = 0.5;
        playerUpdate.velocityY += gravity;

        // Apply velocities
        playerUpdate.x += playerUpdate.velocityX;
        playerUpdate.y += playerUpdate.velocityY;

        // Ground collision with terrain
        const groundY = getYAtX(playerUpdate.x);
        if (playerUpdate.y > groundY) {
          playerUpdate.y = groundY;

          // Get the slope at the player's position
          const slope = getSlopeAtX(playerUpdate.x);
          const angle = Math.atan(slope);

          // Decompose velocity into parallel and perpendicular components
          const vParallel =
            playerUpdate.velocityX * Math.cos(angle) +
            playerUpdate.velocityY * Math.sin(angle);
          const vPerp =
            -playerUpdate.velocityX * Math.sin(angle) +
            playerUpdate.velocityY * Math.cos(angle);

          // Apply friction to parallel component and bounce to perpendicular
          const friction = 0.98;
          const bounce = 0.1; // Low bounce for more realistic sliding

          const newVParallel = vParallel * friction;
          const newVPerp = -vPerp * bounce; // Reverse and reduce perpendicular component

          // Recompose velocity
          playerUpdate.velocityX =
            newVParallel * Math.cos(angle) - newVPerp * Math.sin(angle);
          playerUpdate.velocityY =
            newVParallel * Math.sin(angle) + newVPerp * Math.cos(angle);

          // Reset jumping state if velocity is low enough
          if (Math.abs(playerUpdate.velocityY) < 0.5) {
            playerUpdate.isJumping = false;
          }

          // Add a force based on the slope (negative slope = acceleration)
          const slopeForce = -slope * 0.2;
          playerUpdate.velocityX += slopeForce;
        }

        // Add a small constant force for minimum movement
        const minForce = 0.02;
        if (Math.abs(playerUpdate.velocityX) < 0.1) {
          playerUpdate.velocityX += minForce;
        }

        // Check finish line
        if (
          finishLine &&
          playerUpdate.x >= finishLine &&
          !playerUpdate.finished
        ) {
          playerUpdate.finished = true;
          playerUpdate.finishTime = gameTimeRef.current;
        }

        // Send update to server
        socket?.send(
          JSON.stringify({
            type: "playerUpdate",
            player: playerUpdate,
          })
        );
      },
      [gameStarted, currentPlayer, finishLine]
    );

    useTick(tickCallback);

    return null;
  };

  // Start game handler - allow any player to start the game
  const handleStartGame = () => {
    if (socket) {
      console.log("Starting game");
      const startGameMessage: StartGameMessage = {
        type: "startGame",
      };

      socket.send(JSON.stringify(startGameMessage));
    }
  };

  // Finish line component
  const FinishLine = () => {
    if (!finishLine) return null;

    return (
      <pixiContainer x={finishLine} y={0}>
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, 10, 300);
            g.fill(0xff0000);
          }}
        />
        <pixiText
          text="FINISH"
          anchor={{ x: 0.5, y: 0.5 }}
          x={5}
          y={150}
          style={{
            fill: 0xffffff,
            fontSize: 16,
            fontWeight: "bold",
          }}
        />
      </pixiContainer>
    );
  };

  // Player component
  const PlayerComponent = ({ player }: { player: any }) => {
    const isCurrentPlayer = player.id === playerIdRef.current;

    return (
      <pixiContainer x={player.x} y={player.y}>
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(-15, -30, 30, 30);
            g.fill(player.color);
          }}
        />
        <pixiText
          text={player.id}
          anchor={{ x: 0.5, y: 0.5 }}
          x={0}
          y={-45}
          style={{
            fill: 0xffffff,
            fontSize: 12,
            fontWeight: "bold",
            stroke: 0x000000,
          }}
        />
        {isCurrentPlayer && (
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.circle(0, 10, 5);
              g.fill(0xffff00);
            }}
          />
        )}
      </pixiContainer>
    );
  };

  // Initialize player position when joining
  useEffect(() => {
    if (socket && !hasJoinedRef.current) {
      console.log("Sending join message to become host/player");

      // Send join message to server
      const joinMessage: JoinMessage = {
        type: "join",
        playerId: playerIdRef.current,
        playerColor: playerColorRef.current,
        initialPosition: {
          x: 50,
          y: 300,
          z: 0,
          velocityX: 0,
          velocityY: 0,
          isJumping: false,
          finished: false,
        },
      };

      socket.send(JSON.stringify(joinMessage));
      hasJoinedRef.current = true;
    }
  }, [socket, players]);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.uiOverlay}>
        <div className={styles.statusBar}>
          <div className={styles.connectionStatus}>{connectionStatus}</div>
          {isHost && !gameStarted && (
            <button className={styles.startButton} onClick={handleStartGame}>
              Start Race!
            </button>
          )}
        </div>
      </div>

      {Object.values(players).length > 0 && (
        <Application width={800} height={400} backgroundColor={0x87ceeb}>
          <GameLoop />
          <Ground />
          <FinishLine />
          {Object.values(players).map((player) => (
            <PlayerComponent key={player.id} player={player} />
          ))}
        </Application>
      )}
    </div>
  );
}
