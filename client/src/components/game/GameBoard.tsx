import { motion } from "framer-motion";
import { Game, Player } from "@shared/schema";
import Card from "./Card";
import PlayerStatus from "./PlayerStatus";

interface GameBoardProps {
  game: Game;
  onCardSelect: (index: number) => void;
  getPlayerCards: (playerId: number) => Card[];
  checkIsPlayerTurn: (playerId: number) => boolean;
}

export default function GameBoard({
  game,
  onCardSelect,
  getPlayerCards,
  checkIsPlayerTurn
}: GameBoardProps) {
  if (game.state === "finished") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-background/80 flex items-center justify-center"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {game.winner === game.playerIds[0] ? "You Won!" : "AI Won!"}
          </h1>
          <p className="text-muted-foreground">Game Over</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {game.playerIds.map((playerId) => (
          <PlayerStatus
            key={playerId}
            isCurrentTurn={checkIsPlayerTurn(playerId)}
            cards={getPlayerCards(playerId)}
            onCardSelect={
              checkIsPlayerTurn(playerId) && !game.playerCards[playerId][0]?.isAI
                ? onCardSelect
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
