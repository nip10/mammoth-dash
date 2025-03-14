import type * as Party from "partykit/server";

// Define types for our game messages
type GameState = {
  players: Record<string, PlayerState>;
  terrain: TerrainPoint[];
  finishLine: number;
  gameStarted: boolean;
  hostId?: string;
};

type PlayerState = {
  id: string;
  x: number;
  y: number;
  z: number;
  velocityY: number;
  isJumping: boolean;
  color: string;
  finished: boolean;
};

type TerrainPoint = {
  x: number;
  height: number;
};

// Message types
type JoinMessage = {
  type: "join";
};

type UpdatePlayerMessage = {
  type: "updatePlayer";
  player: PlayerState;
};

type StartGameMessage = {
  type: "startGame";
};

type GameMessage = JoinMessage | UpdatePlayerMessage | StartGameMessage;

export default class CrazyMammothsParty implements Party.Server {
  constructor(readonly room: Party.Room) {}

  gameState: GameState = {
    players: {},
    terrain: [],
    finishLine: 0,
    gameStarted: false,
    hostId: undefined,
  };

  onConnect(conn: Party.Connection) {
    console.log("Client connected", conn.id);
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message) as GameMessage;

    switch (data.type) {
      case "join":
        // Generate a unique player ID
        const playerId = `player_${Math.random().toString(36).substring(2, 9)}`;

        // Generate a unique color for the player
        const color = this.generateUniqueColor(
          Object.values(this.gameState.players)
        );

        // Calculate a good starting position
        const startX = this.calculateStartPosition(
          Object.values(this.gameState.players)
        );
        const startY = 300; // Ground level

        // Create the player with server-assigned properties
        this.gameState.players[playerId] = {
          id: playerId,
          x: startX,
          y: startY,
          z: 0,
          velocityY: 0,
          isJumping: false,
          color: color,
          finished: false,
        };

        // If this is the first player, make them the host
        if (Object.keys(this.gameState.players).length === 1) {
          this.gameState.hostId = playerId;
        }

        // Send the player their ID
        sender.send(
          JSON.stringify({
            type: "joined",
            playerId,
          })
        );

        // Broadcast updated game state to all clients
        this.broadcastGameState();
        break;
      case "startGame":
        // Start the game
        this.gameState.gameStarted = true;
        this.broadcastGameState();
        break;
      case "updatePlayer":
        // Update player state
        if (this.gameState.players[data.player.id]) {
          this.gameState.players[data.player.id] = data.player;
          this.broadcastGameState();
        }
        break;
      default:
        console.log("Unknown message type:", data);
        break;
    }
  }

  onClose() {
    // For now, we'll just check if the host disconnected
    // In a real app, you'd track which connection belongs to which player
    if (this.gameState.hostId) {
      // If the host disconnected, assign a new host
      const remainingPlayers = Object.keys(this.gameState.players);
      if (remainingPlayers.length > 0) {
        this.gameState.hostId = remainingPlayers[0];
      } else {
        this.gameState.hostId = undefined;
      }
    }

    // Broadcast updated game state with new host
    this.broadcastGameState();
  }

  generateTerrain() {
    const terrainWidth = 5000;
    const terrainSegments = 100;
    const segmentWidth = terrainWidth / terrainSegments;

    this.gameState.terrain = [];

    // Start height
    let height = 0;

    // Finish line position (80% of the way)
    const finishLinePosition = terrainWidth * 0.8;
    this.gameState.finishLine = finishLinePosition;

    for (let i = 0; i <= terrainSegments; i++) {
      // Calculate x position
      const x = i * segmentWidth;

      // Calculate height using sine waves for hills
      // More hills at the beginning, flatter near the end
      const hillFactor = 1 - (x / terrainWidth) * 0.5;
      const hillHeight =
        Math.sin(x * 0.001) * 50 * hillFactor +
        Math.sin(x * 0.005) * 30 * hillFactor;

      // Calculate final height (higher near the start and end)
      const startRamp = Math.max(0, 50 - x * 0.05);
      const endRamp = Math.max(0, (x - finishLinePosition) * 0.1);
      height = hillHeight + startRamp + endRamp;

      this.gameState.terrain.push({ x, height });
    }
  }

  broadcastGameState() {
    this.room.broadcast(
      JSON.stringify({
        type: "gameState",
        state: this.gameState,
      })
    );
  }

  // Helper function to generate a unique color
  generateUniqueColor(players: PlayerState[]) {
    const usedColors = players.map((p) => p.color);
    let color;

    do {
      // Generate a random color in hexadecimal format
      const r = Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
      const g = Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
      const b = Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
      color = `0x${r}${g}${b}`;
    } while (usedColors.includes(color));

    return color;
  }

  // Helper function to calculate start position
  calculateStartPosition(players: PlayerState[]) {
    if (players.length === 0) {
      return 50; // Default starting position
    }

    // Find the rightmost player
    const rightmostX = Math.max(...players.map((p) => p.x));
    // Place new player 60px to the right (enough space for player width + gap)
    return rightmostX + 60;
  }
}
