import type { Express } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertPlayerSchema } from "@shared/schema";

// Store active game rooms and matchmaking queue
interface GameRoom {
  playerIds: number[];
  password?: string;
  createdAt: Date;
}

const gameRooms = new Map<string, GameRoom>(); // roomCode -> room info
const matchmakingQueue: number[] = []; // playerIds waiting for random match

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Clean up inactive rooms every hour
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [code, room] of gameRooms.entries()) {
    if (room.createdAt < oneHourAgo && room.playerIds.length === 0) {
      gameRooms.delete(code);
    }
  }
}, 60 * 60 * 1000);

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // WebSocket server for real-time game updates
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      // Handle real-time game updates
      const message = JSON.parse(data.toString());
      wss.clients.forEach((client) => {
        if (client !== ws) {
          client.send(JSON.stringify(message));
        }
      });
    });
  });

  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.json(player);
    } catch (error) {
      res.status(400).json({ error: "Invalid player data" });
    }
  });

  app.post("/api/games/create-room", async (req, res) => {
    try {
      const { password } = req.body;
      const roomCode = generateRoomCode();

      gameRooms.set(roomCode, {
        playerIds: [],
        password,
        createdAt: new Date()
      });

      res.json({ roomCode });
    } catch (error) {
      res.status(400).json({ error: "Failed to create room" });
    }
  });

  app.post("/api/games/join-room/:code", async (req, res) => {
    try {
      const roomCode = req.params.code.toUpperCase();
      const { password } = req.body;
      const room = gameRooms.get(roomCode);

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (room.password && room.password !== password) {
        return res.status(403).json({ error: "Invalid password" });
      }

      if (room.playerIds.length >= 4) {
        return res.status(400).json({ error: "Room is full" });
      }

      // Create a new player for the joining user
      const player = await storage.createPlayer({ 
        name: `Player ${room.playerIds.length + 1}`, 
        isAI: false 
      });
      room.playerIds.push(player.id);

      // If room is full, start the game
      if (room.playerIds.length === 4) {
        const game = await storage.createGame(
          await Promise.all(room.playerIds.map(id => storage.getPlayer(id)))
        );
        gameRooms.delete(roomCode);
        res.json({ gameId: game.id });
      } else {
        res.json({ status: "waiting", playerId: player.id });
      }
    } catch (error) {
      res.status(400).json({ error: "Failed to join room" });
    }
  });

  app.post("/api/games/matchmaking", async (req, res) => {
    try {
      // Create a new player for matchmaking
      const player = await storage.createPlayer({ name: "Player", isAI: false });
      matchmakingQueue.push(player.id);

      // If we have enough players, create a game
      if (matchmakingQueue.length >= 4) {
        const playerIds = matchmakingQueue.splice(0, 4);
        const game = await storage.createGame(
          await Promise.all(playerIds.map(id => storage.getPlayer(id)))
        );
        res.json({ gameId: game.id });
      } else {
        // Add some AI players to fill the game
        const aiPlayers = await Promise.all([
          storage.createPlayer({ name: "R.9", isAI: true }),
          storage.createPlayer({ name: "R.O", isAI: true }),
          storage.createPlayer({ name: "P10", isAI: true })
        ]);

        const game = await storage.createGame([
          await storage.getPlayer(player.id),
          ...aiPlayers
        ]);
        res.json({ gameId: game.id });
      }
    } catch (error) {
      res.status(400).json({ error: "Failed to find a game" });
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

      const game = await storage.createGame(players);
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