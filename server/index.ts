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
  playerId: string;
  playerColor: string;
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
    // Send the current game state to the new connection
    conn.send(
      JSON.stringify({
        type: "gameState",
        state: this.gameState,
      })
    );

    // Let all clients know someone joined
    this.room.broadcast(
      JSON.stringify({
        type: "playerCount",
        count: [...this.room.getConnections()].length,
      })
    );
  }

  onMessage(message: string) {
    const data = JSON.parse(message) as GameMessage;

    switch (data.type) {
      case "join":
        // Add new player to the game
        this.gameState.players[data.playerId] = {
          id: data.playerId,
          x: 0,
          y: 0,
          z: 0,
          velocityY: 0,
          isJumping: false,
          color: data.playerColor,
          finished: false,
        };

        // If this is the first player, make them the host and generate terrain
        if (Object.keys(this.gameState.players).length === 1) {
          this.gameState.hostId = data.playerId;
          this.generateTerrain();
        }

        // Broadcast updated game state
        this.broadcastGameState();
        break;

      case "updatePlayer":
        // Update player state
        if (this.gameState.players[data.player.id]) {
          this.gameState.players[data.player.id] = data.player;
          this.broadcastGameState();
        }
        break;

      case "startGame":
        // Start the game
        this.gameState.gameStarted = true;
        this.broadcastGameState();
        break;
    }
  }

  onClose(conn: Party.Connection) {
    // Find and remove players associated with this connection
    // In a real app with authentication, you'd have a more robust way to track this
    const playersToRemove: string[] = [];

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

    // Broadcast updated player count
    this.room.broadcast(
      JSON.stringify({
        type: "playerCount",
        count: [...this.room.getConnections()].length,
      })
    );

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
}
