import { Card as CardType } from "@shared/schema";
import { Card as UICard, CardContent } from "@/components/ui/card";
import Card from "./Card";

interface PlayerStatusProps {
  isCurrentTurn: boolean;
  cards: CardType[];
  onCardSelect?: (index: number) => void;
}

export default function PlayerStatus({
  isCurrentTurn,
  cards,
  onCardSelect
}: PlayerStatusProps) {
  return (
    <UICard className={isCurrentTurn ? "ring-2 ring-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 justify-center">
          {cards.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              isSelectable={!!onCardSelect}
              onSelect={() => onCardSelect?.(index)}
            />
          ))}
        </div>
      </CardContent>
    </UICard>
  );
}
