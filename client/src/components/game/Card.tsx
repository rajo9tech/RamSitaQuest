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
}

const cardColors: Record<CardType | "Hidden", string> = {
  Ram: "bg-blue-500",
  Sita: "bg-pink-500",
  Lakshman: "bg-green-500",
  Ravan: "bg-red-500",
  RamChaal: "bg-yellow-500",
  Hidden: "bg-gray-400"
};

export function GameCard({ card, isSelectable, onSelect }: CardProps) {
  return (
    <motion.div
      whileHover={isSelectable ? { scale: 1.1 } : {}}
      whileTap={isSelectable ? { scale: 0.95 } : {}}
      className={cn(
        "w-24 h-36 rounded-lg shadow-lg flex items-center justify-center cursor-pointer",
        "transform transition-colors duration-300",
        cardColors[card.type],
        isSelectable ? "hover:ring-2 ring-primary" : "opacity-80"
      )}
      onClick={isSelectable ? onSelect : undefined}
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <span className="text-white font-bold text-lg">
        {card.type === "Hidden" ? "?" : card.type}
      </span>
    </motion.div>
  );
}

export default GameCard;