/**
 * Represents the state of a single player in the game
 */
export interface PlayerState {
  /** Unique identifier for the player */
  id: string;
  /** X-coordinate position in the game world */
  x: number;
  /** Y-coordinate position in the game world */
  y: number;
  /** Z-coordinate position in the game world */
  z: number;
  /** Vertical velocity for jumping physics */
  velocityY: number;
  /** Horizontal velocity for moving left or right */
  velocityX: number;
  /** Whether the player is currently in a jump */
  isJumping: boolean;
  /** The color of the player's mammoth */
  color: string;
  /** Whether the player has reached the finish line */
  finished: boolean;
  /** Time taken to finish the race in milliseconds */
  finishTime?: number;
}

/**
 * Represents a point in the terrain for height mapping
 */
export interface TerrainPoint {
  /** X-coordinate position */
  x: number;
  /** Height at this position */
  height: number;
}

/**
 * The complete game state shared between all players
 */
export interface GameState {
  /** Whether the game has started */
  gameStarted: boolean;
  /** Map of all players by their ID */
  players: Record<string, PlayerState>;
  /** The terrain elevation data */
  terrain: TerrainPoint[];
  /** X-coordinate of the finish line */
  finishLine: number;
  /** Host ID */
  hostId?: string;
}

/**
 * Game store state, extending GameState with actions
 */
export interface GameStoreState extends GameState {
  /** Sets all or part of the game state */
  setGameState: (state: Partial<GameState>) => void;
  /** Updates a specific player's state */
  updatePlayer: (player: PlayerState) => void;
  /** Resets the game to initial state */
  resetGame: () => void;
}

// WebSocket message types

/**
 * Base interface for all PartyKit messages
 */
export interface BaseMessage {
  /** Discriminator field to identify message type */
  type: string;
}

/**
 * Message sent when a player joins the game
 */
export interface JoinMessage extends BaseMessage {
  type: "join";
  /** ID of the player joining */
  playerId: string;
  /** Color chosen for the player */
  playerColor: string;
}

/**
 * Message sent when a player's state updates
 */
export interface UpdatePlayerMessage extends BaseMessage {
  type: "updatePlayer";
  /** Updated player state */
  player: PlayerState;
}

/**
 * Message sent by the host to start the game
 */
export interface StartGameMessage extends BaseMessage {
  type: "startGame";
}

/**
 * Message sent from server to update all clients with the latest game state
 */
export interface GameStateMessage extends BaseMessage {
  type: "gameState";
  /** Complete game state */
  state: GameState;
}

/**
 * Message sent from server when player count changes
 */
export interface PlayerCountMessage extends BaseMessage {
  type: "playerCount";
  /** Number of connected players */
  count: number;
}

/**
 * Message sent when a player finishes the race
 */
export interface PlayerFinishedMessage extends BaseMessage {
  type: "playerFinished";
  /** ID of the player who finished */
  playerId: string;
  /** Time taken to finish in milliseconds */
  time: number;
}

/**
 * Message sent to restart the game
 */
export interface RestartGameMessage extends BaseMessage {
  type: "restartGame";
}

/**
 * Union type of all possible messages
 */
export type PartyMessage =
  | JoinMessage
  | UpdatePlayerMessage
  | StartGameMessage
  | GameStateMessage
  | PlayerCountMessage
  | PlayerFinishedMessage
  | RestartGameMessage;

/**
 * Props for the Game3D component
 */
export interface Game3DProps {
  /** Room code for the multiplayer session */
  roomCode: string;
  /** Callback for player count changes */
  onPlayerCountChange: (count: number) => void;
}

/**
 * Props for the Player component
 */
export interface PlayerProps {
  /** Player state data */
  player: PlayerState;
  /** Whether this is the current player */
  isCurrentPlayer: boolean;
}

/**
 * Props for the FinishLine component
 */
export interface FinishLineProps {
  /** X-coordinate position of the finish line */
  position: number;
}
