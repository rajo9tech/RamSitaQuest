import { motion } from "framer-motion";
import { type Game, type CardType } from "@shared/schema";
import { GameCard } from "./Card";
import PlayerStatus from "./PlayerStatus";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  game: Game;
  onCardSelect: (index: number) => void;
  getPlayerCards: (playerId: number) => Array<{
    id: number;
    type: CardType;
  }>;
  checkIsPlayerTurn: (playerId: number) => boolean;
}

export default function GameBoard({
  game,
  onCardSelect,
  getPlayerCards,
  checkIsPlayerTurn
}: GameBoardProps) {
  const currentPlayerId = game.playerIds[0]; // The local player is always first

  // Game over screen
  if (game.state === "finished") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
          "flex items-center justify-center"
        )}
      >
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {game.winner === currentPlayerId ? "You Won!" : `${game.winner === game.playerIds[1] ? "R.9" : game.winner === game.playerIds[2] ? "R.O" : "P10"} Won!`}
          </h1>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {game.playerIds.map((playerId) => (
              <div key={playerId} className="text-center">
                <h3 className="font-semibold mb-2">
                  {playerId === currentPlayerId ? "You" : 
                   playerId === game.playerIds[1] ? "R.9" :
                   playerId === game.playerIds[2] ? "R.O" : "P10"}
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getPlayerCards(playerId).map((card) => (
                    <GameCard
                      key={card.id}
                      card={card}
                      isSelectable={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Current turn indicator
  const currentTurnName = game.currentTurn === currentPlayerId ? "Your" :
    game.currentTurn === game.playerIds[1] ? "R.9's" :
    game.currentTurn === game.playerIds[2] ? "R.O's" : "P10's";

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Turn indicator */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-primary">
          {currentTurnName} Turn
        </h2>
      </motion.div>

      {/* Game board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AI Players */}
        {game.playerIds.slice(1).map((playerId, index) => (
          <motion.div
            key={playerId}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <PlayerStatus
              isCurrentTurn={checkIsPlayerTurn(playerId)}
              cards={getPlayerCards(playerId)}
              playerName={playerId === game.playerIds[1] ? "R.9" :
                         playerId === game.playerIds[2] ? "R.O" : "P10"}
              hideCardDetails={true}
            />
          </motion.div>
        ))}

        {/* Local Player */}
        <motion.div
          className="col-span-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <PlayerStatus
            isCurrentTurn={checkIsPlayerTurn(currentPlayerId)}
            cards={getPlayerCards(currentPlayerId)}
            onCardSelect={checkIsPlayerTurn(currentPlayerId) ? onCardSelect : undefined}
            playerName="You"
          />
        </motion.div>
      </div>
    </div>
  );
}