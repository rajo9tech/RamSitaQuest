import { pgTable, text, serial, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type CardType = "Ram" | "Sita" | "Lakshman" | "Ravan" | "RamChaal";

export const cardSchema = z.object({
  id: z.number(),
  type: z.enum(["Ram", "Sita", "Lakshman", "Ravan", "RamChaal"]),
});

export type Card = z.infer<typeof cardSchema>;

export const gameStates = ["waiting", "playing", "finished"] as const;
export type GameState = (typeof gameStates)[number];

// Add points for each card type
export const cardPoints: Record<CardType, number> = {
  RamChaal: 10,
  Ram: 8,
  Sita: 6,
  Lakshman: 4,
  Ravan: 2
};

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isAI: boolean("is_ai").default(false),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  state: text("state").notNull().$type<GameState>(),
  themeSeed: integer("theme_seed").notNull(),
  currentTurn: integer("current_turn").notNull(),
  playerIds: integer("player_ids").array().notNull(),
  playerCards: jsonb("player_cards").$type<Record<number, Card[]>>().notNull(),
  // Track multiple winners
  winners: integer("winners").array(),
  // Store positions (1-4) and points for each player
  positions: jsonb("positions").$type<Record<number, number>>(),
  points: jsonb("points").$type<Record<number, number>>(),
});

export const insertPlayerSchema = createInsertSchema(players);
export const insertGameSchema = createInsertSchema(games);

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Player = typeof players.$inferSelect;
export type Game = typeof games.$inferSelect;

// Calculate points for a set of cards
export function calculateCardPoints(cards: Card[]): number {
  return cards.reduce((total, card) => total + cardPoints[card.type], 0);
}

export const checkWinningCombination = (cards: Card[]): boolean => {
  const cardCounts = cards.reduce((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1;
    return acc;
  }, {} as Record<CardType, number>);

  return (
    // RamChaal + 3 Ram cards
    (cardCounts["RamChaal"] >= 1 && cardCounts["Ram"] >= 3) ||
    // 4 of any other type
    cardCounts["Sita"] >= 4 ||
    cardCounts["Lakshman"] >= 4 ||
    cardCounts["Ravan"] >= 4
  );
};
