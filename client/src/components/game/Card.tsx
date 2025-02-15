import { motion } from "framer-motion";
import { type CardType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CardProps {
  card: {
    id: number;
    type: CardType;
  };
  isSelectable?: boolean;
  onSelect?: () => void;
}

const cardColors: Record<CardType, string> = {
  Ram: "bg-blue-500",
  Sita: "bg-pink-500",
  Lakshman: "bg-green-500",
  Ravan: "bg-red-500",
  RamChaal: "bg-yellow-500"
};

export function GameCard({ card, isSelectable, onSelect }: CardProps) {
  return (
    <motion.div
      whileHover={isSelectable ? { scale: 1.1 } : {}}
      className={cn(
        "w-24 h-36 rounded-lg shadow-lg flex items-center justify-center cursor-pointer transform transition-transform",
        cardColors[card.type],
        isSelectable ? "hover:ring-2 ring-primary" : "opacity-80"
      )}
      onClick={isSelectable ? onSelect : undefined}
    >
      <span className="text-white font-bold text-lg">{card.type}</span>
    </motion.div>
  );
}

export default GameCard;