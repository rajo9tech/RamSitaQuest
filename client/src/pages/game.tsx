
import React from 'react';
import { useParams, useNavigate } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { type Game as GameType } from '@shared/schema';
import { useGameState } from '@/hooks/useGameState';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';
import GameBoard from '@/components/game/GameBoard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const gameId = parseInt(id || "0");
  const navigate = useNavigate();

  const { data: game, isLoading } = useQuery<GameType>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId
  });

  const currentPlayerId = game?.playerIds[0];
  const { socket, isConnected } = useWebSocket(currentPlayerId);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'gameUpdate') {
        queryClient.setQueryData([`/api/games/${gameId}`], data.game);
      }
    };
  }, [socket, gameId]);

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {!isConnected && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Trying to reconnect to the game server...
          </AlertDescription>
        </Alert>
      )}

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
