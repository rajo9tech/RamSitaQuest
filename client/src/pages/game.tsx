import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import GameBoard from "@/components/game/GameBoard";
import { apiRequest } from "@/lib/queryClient";
import { useGameState } from "@/hooks/useGameState";
import { Card } from "@shared/schema";

export default function Game() {
  const { id } = useParams();
  const gameId = parseInt(id);

  const { data: game, isLoading } = useQuery({
    queryKey: ["/api/games", gameId],
    refetchInterval: 1000
  });

  const { mutate: makeMove } = useMutation({
    mutationFn: async ({ cardIndex, targetPlayerId }: { cardIndex: number, targetPlayerId: number }) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/move`, {
        playerId: game.currentTurn,
        cardIndex,
        targetPlayerId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
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
  React.useEffect(() => {
    if (game?.state === "playing") {
      const currentPlayer = getCurrentPlayer();
      if (currentPlayer?.isAI) {
        setTimeout(() => {
          const move = makeAIMove();
          if (move) {
            makeMove(move);
          }
        }, 1000);
      }
    }
  }, [game?.currentTurn]);

  if (isLoading) {
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
