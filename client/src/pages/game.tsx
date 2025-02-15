import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, type Game as GameType } from "@shared/schema";
import { useGameState } from "@/hooks/useGameState";
import { useEffect } from "react";
import GameBoard from "@/components/game/GameBoard";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const gameId = parseInt(id || "0");

  const { data: game, isLoading } = useQuery<GameType>({
    queryKey: [`/api/games/${gameId}`],
    refetchInterval: 1000,
    enabled: !!gameId
  });

  const { mutate: makeMove } = useMutation({
    mutationFn: async ({ cardIndex, targetPlayerId }: { cardIndex: number, targetPlayerId: number }) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/move`, {
        playerId: game?.currentTurn,
        cardIndex,
        targetPlayerId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    }
  });

  const {
    getPlayerCards,
    getCurrentPlayer,
    getNextPlayer,
    checkIsPlayerTurn,
    makeAIMove
  } = useGameState(game);

  // Handle AI moves
  useEffect(() => {
    if (game?.state === "playing") {
      const currentPlayer = getCurrentPlayer();
      if (currentPlayer?.isAI) {
        const timeoutId = setTimeout(() => {
          const move = makeAIMove();
          if (move) {
            makeMove(move);
          }
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [game?.currentTurn, makeMove, getCurrentPlayer, makeAIMove]);

  if (isLoading || !game) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <GameBoard
        game={game}
        onCardSelect={(cardIndex: number) => {
          const targetPlayer = getNextPlayer();
          if (targetPlayer) {
            makeMove({ cardIndex, targetPlayerId: targetPlayer.id });
          }
        }}
        getPlayerCards={getPlayerCards}
        checkIsPlayerTurn={checkIsPlayerTurn}
      />
    </div>
  );
}