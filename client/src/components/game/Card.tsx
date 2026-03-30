import { motion } from "framer-motion";
import { type CardType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CardProps {
  card: {
    id: number;
    type: CardType | "Hidden";
  };
  isSelectable?: boolean;
  onSelect?: () => void;
  size?: "sm" | "default";
}

const cardColors: Record<CardType | "Hidden", string> = {
  Ram: "card-accent-ram",
  Sita: "card-accent-sita",
  Lakshman: "card-accent-lakshman",
  Ravan: "card-accent-ravan",
  RamChaal: "card-accent-ramchaal",
  Hidden: "card-accent-hidden"
};

const cardSizes = {
  sm: "w-12 h-20 text-xs",
  default: "w-24 h-36 text-lg"
};

export function GameCard({ card, isSelectable, onSelect, size = "default" }: CardProps) {
  return (
    <motion.div
      whileHover={isSelectable ? { scale: 1.1 } : {}}
      whileTap={isSelectable ? { scale: 0.95 } : {}}
      className={cn(
        "rounded-lg shadow-lg flex items-center justify-center cursor-pointer",
        "transform transition-colors duration-300",
        cardColors[card.type],
        cardSizes[size],
        isSelectable ? "hover:ring-2 ring-primary" : "opacity-80"
      )}
      onClick={isSelectable ? onSelect : undefined}
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <span className="text-white font-bold">
        {card.type === "Hidden" ? "?" : card.type}
      </span>
    </motion.div>
  );
}

export default GameCard;
