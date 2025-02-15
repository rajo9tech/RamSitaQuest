import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPlayerSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.json(player);
    } catch (error) {
      res.status(400).json({ error: "Invalid player data" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const { playerIds } = req.body;
      const players = await Promise.all(
        playerIds.map((id: number) => storage.getPlayer(id))
      );
      
      if (players.some(p => !p)) {
        return res.status(400).json({ error: "Invalid player IDs" });
      }

      const game = await storage.createGame(players as any[]);
      res.json(game);
    } catch (error) {
      res.status(400).json({ error: "Failed to create game" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(parseInt(req.params.id));
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(400).json({ error: "Failed to get game" });
    }
  });

  app.post("/api/games/:id/move", async (req, res) => {
    try {
      const { playerId, cardIndex, targetPlayerId } = req.body;
      const game = await storage.makeMove(
        parseInt(req.params.id),
        playerId,
        cardIndex,
        targetPlayerId
      );
      res.json(game);
    } catch (error) {
      res.status(400).json({ error: "Invalid move" });
    }
  });

  return server;
}
