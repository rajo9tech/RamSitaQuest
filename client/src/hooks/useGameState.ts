import { useMemo } from "react";
import type { Game, Card, Player } from "@shared/schema";

export function useGameState(game: Game | undefined, currentPlayerId?: number) {
  const getPlayerName = (playerId: number, playerIds: number[]): string => {
    if (playerId === currentPlayerId) return "You";
    const playerNumber = playerIds.indexOf(playerId) + 1;
    return playerNumber > 0 ? `Player ${playerNumber}` : "Opponent";
  };

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
          name: getPlayerName(game.currentTurn, game.playerIds),
          isAI: currentPlayerId !== undefined && game.currentTurn !== currentPlayerId
        };
      },

      getNextPlayer: (): Player | undefined => {
        if (!game) return undefined;
        const currentIndex = game.playerIds.indexOf(game.currentTurn);
        const nextId = game.playerIds[(currentIndex + 1) % game.playerIds.length];
        return {
          id: nextId,
          name: getPlayerName(nextId, game.playerIds),
          isAI: currentPlayerId !== undefined && nextId !== currentPlayerId
        };
      },

      checkIsPlayerTurn: (playerId: number): boolean => {
        if (!game) return false;
        return game.currentTurn === playerId;
      },

      makeAIMove: () => {
        if (!game || game.state !== "playing") return null;
        if (!currentPlayerId) return null;

        const currentPlayer = game.currentTurn;
        if (currentPlayer === currentPlayerId) return null;

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
    [game, currentPlayerId]
  );
}
