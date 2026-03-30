import { AnimatePresence, motion } from "framer-motion";
import { type Game, type CardType } from "@shared/schema";
import { GameCard } from "./Card";
import PlayerStatus from "./PlayerStatus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useMemo, useRef, useState } from "react";

interface GameBoardProps {
  game: Game;
  onPassCard: (move: { cardIndex: number; targetPlayerId: number }) => Promise<void> | void;
  getPlayerCards: (playerId: number) => Array<{
    id: number;
    type: CardType;
  }>;
  checkIsPlayerTurn: (playerId: number) => boolean;
}

export default function GameBoard({
  game,
  onPassCard,
  getPlayerCards,
  checkIsPlayerTurn
}: GameBoardProps) {
  const currentPlayerId = game.playerIds[0]; // The local player is always first
  const [, setLocation] = useLocation();
  const playerContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [isPassing, setIsPassing] = useState(false);
  const [passAnimation, setPassAnimation] = useState<{
    card: { id: number; type: CardType };
    cardIndex: number;
    targetPlayerId: number;
    x: number;
    y: number;
    key: string;
  } | null>(null);

  const themeClass = useMemo(() => `game-theme-${Math.abs(game.themeSeed) % 6}`, [game.themeSeed]);

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
        <div className="bg-background/95 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <h1 className="text-xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent text-center">
            Game Over!
          </h1>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {game.playerIds.map((playerId) => {
              const position = game.positions?.[playerId] || 0;
              const isWinner = position <= 3;
              return (
                <div 
                  key={playerId} 
                  className={cn(
                    "p-4 rounded-lg",
                    "transition-all duration-300",
                    isWinner 
                      ? "border-2 border-yellow-400 dark:border-yellow-500 shadow-lg" 
                      : "border-2 border-gray-300 dark:border-gray-600"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {playerId === currentPlayerId ? "You" : 
                       playerId === game.playerIds[1] ? "Player 2" :
                       playerId === game.playerIds[2] ? "Player 3" : "Player 4"}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      isWinner 
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                    )}>
                      {isWinner ? `${position}${position === 1 ? "st" : position === 2 ? "nd" : "rd"} Winner` : "Loser"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Points: {game.points?.[playerId] || 0}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {getPlayerCards(playerId).map((card) => (
                      <GameCard
                        key={card.id}
                        card={card}
                        isSelectable={false}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Button 
              onClick={() => setLocation("/")}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Play Again
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const handlePassCard = async (cardIndex: number) => {
    if (isPassing) return;

    const sourcePlayerId = currentPlayerId;
    const sourceCards = getPlayerCards(sourcePlayerId);
    const selectedCard = sourceCards[cardIndex];
    if (!selectedCard) return;

    const sourceTurnIndex = game.playerIds.indexOf(sourcePlayerId);
    const targetPlayerId = game.playerIds[(sourceTurnIndex + 1) % game.playerIds.length];

    const sourceRect = playerContainerRefs.current[sourcePlayerId]?.getBoundingClientRect();
    const targetRect = playerContainerRefs.current[targetPlayerId]?.getBoundingClientRect();

    if (sourceRect && targetRect) {
      setPassAnimation({
        card: selectedCard,
        cardIndex,
        targetPlayerId,
        x: targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2),
        y: targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2),
        key: `${selectedCard.id}-${Date.now()}`
      });
      setIsPassing(true);
      return;
    }

    setIsPassing(true);
    await onPassCard({ cardIndex, targetPlayerId });
    setIsPassing(false);
  };

  const currentTurnName = game.currentTurn === currentPlayerId ? "Your" :
    game.currentTurn === game.playerIds[1] ? "Player 2's" :
    game.currentTurn === game.playerIds[2] ? "Player 3's" : "Player 4's";

  return (
    <div className={cn("game-board-shell max-w-4xl mx-auto p-2 sm:p-4 rounded-2xl", themeClass)}>
      {/* Turn indicator */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4 sm:mb-8"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-primary">
          {currentTurnName} Turn
        </h2>
        {game.winners?.length ? (
          <p className="text-sm text-muted-foreground mt-2">
            Winners: {game.winners.length}/3
          </p>
        ) : null}
      </motion.div>

      {/* Game board */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 relative">
        {/* Other Players */}
        {game.playerIds.slice(1).map((playerId, index) => (
          <motion.div
            key={playerId}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            layout
            ref={(node) => {
              playerContainerRefs.current[playerId] = node;
            }}
          >
            <PlayerStatus
              isCurrentTurn={checkIsPlayerTurn(playerId)}
              cards={getPlayerCards(playerId)}
              playerName={`Player ${index + 2}`}
              hideCardDetails={true}
              isWinner={game.winners?.includes(playerId)}
            />
          </motion.div>
        ))}

        {/* Local Player */}
        <motion.div
          className="col-span-2 mt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          layout
          ref={(node) => {
            playerContainerRefs.current[currentPlayerId] = node;
          }}
        >
          <PlayerStatus
            isCurrentTurn={checkIsPlayerTurn(currentPlayerId)}
            cards={getPlayerCards(currentPlayerId)}
            onCardSelect={checkIsPlayerTurn(currentPlayerId) && !isPassing ? handlePassCard : undefined}
            playerName="You"
            isWinner={game.winners?.includes(currentPlayerId)}
          />
        </motion.div>

        <AnimatePresence>
          {passAnimation ? (
            <motion.div
              key={passAnimation.key}
              className="pointer-events-none absolute left-1/2 top-[84%] z-20 -translate-x-1/2 -translate-y-1/2"
              initial={{ x: 0, y: 0, scale: 0.95, opacity: 0.95 }}
              animate={{ x: passAnimation.x, y: passAnimation.y, scale: 0.7, opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              onAnimationComplete={async () => {
                await onPassCard({ cardIndex: passAnimation.cardIndex, targetPlayerId: passAnimation.targetPlayerId });
                setPassAnimation(null);
                setIsPassing(false);
              }}
            >
              <GameCard
                card={passAnimation.card}
                isSelectable={false}
                size="sm"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
