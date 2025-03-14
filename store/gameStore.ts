import { create } from "zustand";
import { GameState, GameStoreState } from "@/types/types";

/**
 * Initial empty game state
 */
const initialState: GameState = {
  gameStarted: false,
  players: {},
  terrain: [],
  finishLine: 0,
  hostId: undefined,
};

/**
 * Global game state store using Zustand
 */
export const useGameStore = create<GameStoreState>((set) => ({
  ...initialState,

  /**
   * Update the game state with new values
   * @param newState - Partial state to merge with current state
   */
  setGameState: (newState) =>
    set((state) => ({
      ...state,
      ...(newState.gameStarted !== undefined
        ? { gameStarted: newState.gameStarted }
        : {}),
      ...(newState.players !== undefined ? { players: newState.players } : {}),
      ...(newState.terrain !== undefined ? { terrain: newState.terrain } : {}),
      ...(newState.finishLine !== undefined
        ? { finishLine: newState.finishLine }
        : {}),
      ...(newState.hostId !== undefined ? { hostId: newState.hostId } : {}),
    })),

  /**
   * Update a specific player's state
   * @param player - New player state to merge
   */
  updatePlayer: (player) =>
    set((state) => ({
      ...state,
      players: {
        ...state.players,
        [player.id]: player,
      },
    })),

  /**
   * Reset the game to initial state
   */
  resetGame: () => set(initialState),
}));
