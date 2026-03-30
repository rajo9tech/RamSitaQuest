import { type Player, type Game, type InsertPlayer, type InsertGame, type Card, checkWinningCombination, calculateCardPoints } from "@shared/schema";

export interface IStorage {
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: number): Promise<Player | undefined>;
  createGame(players: Player[]): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGameState(id: number, state: Game): Promise<Game>;
  makeMove(gameId: number, playerId: number, cardIndex: number, targetPlayerId: number): Promise<Game>;
}

export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private games: Map<number, Game>;
  private currentPlayerId: number;
  private currentGameId: number;

  constructor() {
    this.players = new Map();
    this.games = new Map();
    this.currentPlayerId = 1;
    this.currentGameId = 1;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const newPlayer: Player = { ...player, id, isAI: player.isAI ?? false };
    this.players.set(id, newPlayer);
    return newPlayer;
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  private generateInitialDeck(): Card[] {
    const deck: Card[] = [];
    let cardId = 1;

    // Add 1 RamChaal card
    deck.push({ id: cardId++, type: "RamChaal" });

    // Add 3 Ram cards
    for (let i = 0; i < 3; i++) {
      deck.push({ id: cardId++, type: "Ram" });
    }

    // Add 4 cards each of Sita, Lakshman, and Ravan
    const regularCardTypes = ["Sita", "Lakshman", "Ravan"] as const;
    regularCardTypes.forEach(type => {
      for (let i = 0; i < 4; i++) {
        deck.push({ id: cardId++, type });
      }
    });

    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  async createGame(players: Player[]): Promise<Game> {
    const id = this.currentGameId++;
    const deck = this.generateInitialDeck();

    // Distribute 4 cards to each player
    const playerCards: Record<number, Card[]> = {};
    const initialWinningPlayers: Record<number, boolean> = {};
    const turnsTaken: Record<number, number> = {};
    players.forEach((player, index) => {
      playerCards[player.id] = deck.slice(index * 4, (index + 1) * 4);
      initialWinningPlayers[player.id] = checkWinningCombination(playerCards[player.id]);
      turnsTaken[player.id] = 0;
    });

    // Find the player with RamChaal card to start
    let startingPlayerId = players[0].id;
    for (const [playerId, cards] of Object.entries(playerCards)) {
      if (cards.some(card => card.type === "RamChaal")) {
        startingPlayerId = parseInt(playerId);
        break;
      }
    }

    const game: Game = {
      id,
      state: "playing",
      currentTurn: startingPlayerId,
      playerIds: players.map(p => p.id),
      playerCards,
      initialWinningPlayers,
      turnsTaken,
      winners: [],
      positions: {},
      points: {}
    };

    this.games.set(id, game);
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async updateGameState(id: number, state: Game): Promise<Game> {
    this.games.set(id, state);
    return state;
  }

  async makeMove(gameId: number, playerId: number, cardIndex: number, targetPlayerId: number): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");

    const playerCards = game.playerCards[playerId];
    const targetCards = game.playerCards[targetPlayerId];

    if (!playerCards || !targetCards) throw new Error("Invalid player");

    // Move card from player to target
    const [card] = playerCards.splice(cardIndex, 1);
    targetCards.push(card);

    // Ensure backwards compatibility for older game records
    game.initialWinningPlayers = game.initialWinningPlayers || {};
    game.turnsTaken = game.turnsTaken || {};
    game.playerIds.forEach(id => {
      if (typeof game.initialWinningPlayers?.[id] !== "boolean") {
        game.initialWinningPlayers![id] = false;
      }
      if (typeof game.turnsTaken?.[id] !== "number") {
        game.turnsTaken![id] = 0;
      }
    });

    // Current player has now completed one full turn
    game.turnsTaken[playerId] += 1;

    // Check for winner
    const targetHadInitialWinningHand = game.initialWinningPlayers[targetPlayerId] ?? false;
    const targetCompletedTurn = (game.turnsTaken[targetPlayerId] ?? 0) >= 1;
    const canTargetClaimWin = !targetHadInitialWinningHand || targetCompletedTurn;

    if (
      checkWinningCombination(targetCards) &&
      canTargetClaimWin &&
      !game.winners?.includes(targetPlayerId)
    ) {
      // Add new winner
      game.winners = [...(game.winners || []), targetPlayerId];

      // If we have 3 winners, game is finished
      if (game.winners.length === 3) {
        game.state = "finished";

        // Calculate points for all players
        const playerPoints: Record<number, number> = {};
        game.playerIds.forEach(id => {
          playerPoints[id] = calculateCardPoints(game.playerCards[id]);
        });

        // Set positions based on win order
        const positions: Record<number, number> = {};
        game.winners.forEach((winnerId, index) => {
          positions[winnerId] = index + 1;
        });

        // Find the loser (player not in winners array)
        const loser = game.playerIds.find(id => !game.winners?.includes(id));
        if (loser) {
          positions[loser] = 4;
        }

        game.points = playerPoints;
        game.positions = positions;
      }
    }

    // Update turn
    const currentTurnIndex = game.playerIds.indexOf(playerId);
    game.currentTurn = game.playerIds[(currentTurnIndex + 1) % game.playerIds.length];

    await this.updateGameState(gameId, game);
    return game;
  }
}

export const storage = new MemStorage();
