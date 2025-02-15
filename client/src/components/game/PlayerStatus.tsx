import { type CardType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { GameCard } from "./Card";

interface PlayerStatusProps {
  isCurrentTurn: boolean;
  cards: Array<{
    id: number;
    type: CardType;
  }>;
  onCardSelect?: (index: number) => void;
}

export default function PlayerStatus({
  isCurrentTurn,
  cards,
  onCardSelect
}: PlayerStatusProps) {
  return (
    <Card className={isCurrentTurn ? "ring-2 ring-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 justify-center">
          {cards.map((card, index) => (
            <GameCard
              key={card.id}
              card={card}
              isSelectable={!!onCardSelect}
              onSelect={() => onCardSelect?.(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}