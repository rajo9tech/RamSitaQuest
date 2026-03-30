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
          name: game.currentTurn === game.playerIds[0] ? "Player" : 
               game.currentTurn === game.playerIds[1] ? "R.9" :
               game.currentTurn === game.playerIds[2] ? "R.O" : "P10",
          isAI: game.currentTurn !== game.playerIds[0]
        };
      },

      getNextPlayer: (): Player | undefined => {
        if (!game) return undefined;
        const currentIndex = game.playerIds.indexOf(game.currentTurn);
        const nextId = game.playerIds[(currentIndex + 1) % game.playerIds.length];
        return {
          id: nextId,
          name: nextId === game.playerIds[0] ? "Player" : 
                nextId === game.playerIds[1] ? "R.9" :
                nextId === game.playerIds[2] ? "R.O" : "P10",
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

        // Improved AI strategy:
        // 1. Check if we can collect matching cards
        const cardCounts = cards.reduce((acc, card) => {
          acc[card.type] = (acc[card.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Find the card type we have the most of
        let bestType = '';
        let maxCount = 0;
        for (const [type, count] of Object.entries(cardCounts)) {
          if (count > maxCount) {
            maxCount = count;
            bestType = type;
          }
        }

        // If we have multiple of same type, keep those and discard others
        const cardIndex = cards.findIndex(card => 
          (maxCount >= 2 && card.type !== bestType) || 
          (maxCount < 2 && card.type !== 'RamChaal')
        );

        const nextPlayer = game.playerIds[(game.playerIds.indexOf(currentPlayer) + 1) % game.playerIds.length];

        return {
          cardIndex: cardIndex >= 0 ? cardIndex : Math.floor(Math.random() * cards.length),
          targetPlayerId: nextPlayer
        };
      }
    }),
    [game]
  );
}