import { type CardType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { GameCard } from "./Card";
import { cn } from "@/lib/utils";

interface PlayerStatusProps {
  isCurrentTurn: boolean;
  cards: Array<{
    id: number;
    type: CardType;
  }>;
  onCardSelect?: (index: number) => void;
  playerName: string;
  hideCardDetails?: boolean;
  isWinner?: boolean;
}

export default function PlayerStatus({
  isCurrentTurn,
  cards,
  onCardSelect,
  playerName,
  hideCardDetails = false,
  isWinner = false
}: PlayerStatusProps) {
  return (
    <Card className={cn(
      "transition-all duration-300",
      isCurrentTurn ? "ring-2 ring-primary shadow-lg" : "opacity-80",
      isWinner && "border-2 border-yellow-400 dark:border-yellow-500"
    )}>
      <CardContent className="p-4">
        <div className="text-center mb-2">
          <h3 className="font-semibold text-lg">{playerName}</h3>
          {isWinner && (
            <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs rounded-full mt-1">
              Winner
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card, index) => (
            <GameCard
              key={card.id}
              card={hideCardDetails ? { ...card, type: "Hidden" } : card}
              isSelectable={!!onCardSelect}
              onSelect={() => onCardSelect?.(index)}
              size="sm"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}