import { useMemo } from "react";
import type { Game, Card, Player } from "@shared/schema";

export function useGameState(game: Game | undefined) {
  return useMemo(
    () => ({
      getPlayerCards: (playerId: number): Card[] => {
        if (!game) return [];
        return game.playerCards[playerId] || [];
      },

      getCurrentPlayer: (): Player | undefined => {
        if (!game) return undefined;
        return {
          id: game.currentTurn,
          name: game.currentTurn === game.playerIds[0] ? "Player" : "AI",
          isAI: game.currentTurn !== game.playerIds[0]
        };
      },

      getNextPlayer: (): Player | undefined => {
        if (!game) return undefined;
        const currentIndex = game.playerIds.indexOf(game.currentTurn);
        const nextId = game.playerIds[(currentIndex + 1) % game.playerIds.length];
        return {
          id: nextId,
          name: nextId === game.playerIds[0] ? "Player" : "AI",
          isAI: nextId !== game.playerIds[0]
        };
      },

      checkIsPlayerTurn: (playerId: number): boolean => {
        if (!game) return false;
        return game.currentTurn === playerId;
      },

      makeAIMove: () => {
        if (!game || game.state !== "playing") return null;
        
        const currentPlayer = game.currentTurn;
        if (currentPlayer === game.playerIds[0]) return null;

        const cards = game.playerCards[currentPlayer];
        if (!cards?.length) return null;

        // Simple AI: randomly select a card
        const cardIndex = Math.floor(Math.random() * cards.length);
        const nextPlayer = game.playerIds[(game.playerIds.indexOf(currentPlayer) + 1) % game.playerIds.length];

        return {
          cardIndex,
          targetPlayerId: nextPlayer
        };
      }
    }),
    [game]
  );
}
