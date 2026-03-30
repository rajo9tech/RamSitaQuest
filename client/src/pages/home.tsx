import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAuthUser, readAuthUser } from "@/hooks/useAuth";

const cardVariants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

const titleVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.8 } }
};

export default function Home() {
  const LOCAL_PLAYER_ID_KEY_PREFIX = "ram-sita:local-player:";
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [modeSelectOpen, setModeSelectOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const user = readAuthUser();
    if (!user) {
      setLocation("/login");
      return;
    }
    setPlayerName(user.name);
  }, [setLocation]);

  const startSoloGame = async () => {
    try {
      const playerRes = await apiRequest("POST", "/api/players", {
        name: playerName || "Player",
        isAI: false
      });
      const player = await playerRes.json();

      const aiPlayers = await Promise.all([
        apiRequest("POST", "/api/players", { name: "R.9", isAI: true }),
        apiRequest("POST", "/api/players", { name: "R.O", isAI: true })
      ].map(p => p.then(res => res.json())));

      const gameRes = await apiRequest("POST", "/api/games", {
        playerIds: [player.id, ...aiPlayers.map(p => p.id)]
      });
      const game = await gameRes.json();

      localStorage.setItem(`${LOCAL_PLAYER_ID_KEY_PREFIX}${game.id}`, String(player.id));
      setLocation(`/game/${game.id}?localPlayerId=${player.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start game"
      });
    }
  };

  const createMultiplayerGame = async (password?: string) => {
    try {
      const res = await apiRequest("POST", "/api/games/create-room", { password, playerName });
      const data = await res.json();
      const roomCode = data.roomCode;
      setRoomCode(roomCode);
      setJoiningRoom(true);

      if (typeof data.gameId === "number" && typeof data.playerId === "number") {
        localStorage.setItem(`${LOCAL_PLAYER_ID_KEY_PREFIX}${data.gameId}`, String(data.playerId));
        setLocation(`/game/${data.gameId}?localPlayerId=${data.playerId}`);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create room"
      });
    }
  };

  const joinRoom = async (code: string, password?: string) => {
    try {
      const res = await apiRequest("POST", `/api/games/join-room/${code}`, { password, playerName });
      const data = await res.json();

      if (data.gameId) {
        const playerId = data.playerId ?? data.localPlayerId;
        if (typeof playerId === "number") {
          localStorage.setItem(`${LOCAL_PLAYER_ID_KEY_PREFIX}${data.gameId}`, String(playerId));
          setLocation(`/game/${data.gameId}?localPlayerId=${playerId}`);
          return;
        }
        setLocation(`/game/${data.gameId}`);
      } else {
        if (typeof data.playerId === "number") {
          localStorage.setItem(`${LOCAL_PLAYER_ID_KEY_PREFIX}pending-room-${code.toUpperCase()}`, String(data.playerId));
        }
        setWaitingForPlayers(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid room code or password"
      });
    }
  };

  const findRandomGame = async () => {
    try {
      const res = await apiRequest("POST", "/api/games/matchmaking", { playerName });
      const data = await res.json();
      const playerId = data.playerId ?? data.localPlayerId;
      if (typeof playerId === "number") {
        localStorage.setItem(`${LOCAL_PLAYER_ID_KEY_PREFIX}${data.gameId}`, String(playerId));
        setLocation(`/game/${data.gameId}?localPlayerId=${playerId}`);
        return;
      }
      setLocation(`/game/${data.gameId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to find a game"
      });
    }
  };

  return (
    <>
      <motion.div 
        initial="initial"
        animate="animate"
        className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-yellow-100 via-green-100 to-red-100 dark:from-yellow-950 dark:via-green-950 dark:to-red-950"
      >
        <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-background/90 shadow-2xl border-4 border-primary/30">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-sm text-muted-foreground">Welcome, <span className="font-semibold text-foreground">{playerName}</span></div>
            <motion.h1 
              variants={titleVariants}
              className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
            >
              🎲 Ram-Sita Ludo Arena
            </motion.h1>
            <motion.p 
              variants={cardVariants}
              className="mb-8 text-muted-foreground text-lg"
            >
              A Ramayana-themed card game where you compete against AI opponents or play with friends
            </motion.p>
            <motion.div variants={cardVariants}>
              <Button 
                size="lg" 
                onClick={() => setModeSelectOpen(true)}
                className="w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:brightness-110 text-white shadow-lg"
              >
                Start Game
              </Button>
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => {
                  clearAuthUser();
                  setLocation("/login");
                }}
              >
                Logout
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={modeSelectOpen} onOpenChange={setModeSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Game Mode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Button 
              variant="outline" 
              onClick={startSoloGame}
              className="w-full h-12"
            >
              Solo vs AI
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setModeSelectOpen(false);
                setCreateRoomOpen(true);
              }}
              className="w-full h-12"
            >
              Play with Friends
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setModeSelectOpen(false);
                setJoinRoomOpen(true);
              }}
              className="w-full h-12"
            >
              Join Room
            </Button>
            <Button 
              variant="outline" 
              onClick={findRandomGame}
              className="w-full h-12"
            >
              Random Matchmaking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Private Room</DialogTitle>
            <DialogDescription>
              Set an optional password for your room
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="room-password">Room Password (Optional)</Label>
              <Input
                id="room-password"
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Leave empty for public room"
              />
            </div>
            <Button onClick={() => createMultiplayerGame(roomPassword || undefined)}>
              Create Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="join-password">Room Password</Label>
              <Input
                id="join-password"
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Enter room password if required"
              />
            </div>
            <Button onClick={() => joinRoom(roomCode, roomPassword || undefined)}>
              Join Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={joiningRoom} onOpenChange={setJoiningRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Room Created</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <p>Share this code with your friends:</p>
            <div className="flex gap-2">
              <Input value={roomCode} readOnly />
              <Button onClick={() => navigator.clipboard.writeText(roomCode)}>
                Copy
              </Button>
            </div>
            {roomPassword && (
              <>
                <p>Room Password:</p>
                <div className="flex gap-2">
                  <Input value={roomPassword} type="password" readOnly />
                  <Button onClick={() => navigator.clipboard.writeText(roomPassword)}>
                    Copy
                  </Button>
                </div>
              </>
            )}
            <p className="text-sm text-muted-foreground">
              Waiting for other players to join...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
