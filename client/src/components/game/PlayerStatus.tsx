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
}

export default function PlayerStatus({
  isCurrentTurn,
  cards,
  onCardSelect,
  playerName,
  hideCardDetails = false
}: PlayerStatusProps) {
  return (
    <Card className={cn(
      "transition-all duration-300",
      isCurrentTurn ? "ring-2 ring-primary shadow-lg" : "opacity-80"
    )}>
      <CardContent className="p-4">
        <div className="text-center mb-2">
          <h3 className="font-semibold text-lg">{playerName}</h3>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {cards.map((card, index) => (
            <GameCard
              key={card.id}
              card={hideCardDetails ? { ...card, type: "Hidden" } : card}
              isSelectable={!!onCardSelect}
              onSelect={() => onCardSelect?.(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}