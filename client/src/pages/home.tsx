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

const cardVariants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

const titleVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.8 } }
};

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [modeSelectOpen, setModeSelectOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);

  useEffect(() => {
    if (!roomCode || (!joiningRoom && !waitingForPlayers)) {
      return;
    }

    let isActive = true;

    const pollRoomStatus = async () => {
      try {
        const res = await apiRequest("GET", `/api/games/room/${roomCode}/status`);
        const data = await res.json();

        if (!isActive) {
          return;
        }

        if (data.started && data.gameId) {
          setJoiningRoom(false);
          setWaitingForPlayers(false);
          setLocation(`/game/${data.gameId}`);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = getApiErrorMessage(error);
        if (message.toLowerCase().includes("expired")) {
          setJoiningRoom(false);
          setWaitingForPlayers(false);
          toast({
            variant: "destructive",
            title: "Room expired",
            description: "This room is no longer active. Please create or join another room."
          });
        }
      }
    };

    pollRoomStatus();
    const interval = setInterval(pollRoomStatus, 2000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [joiningRoom, roomCode, setLocation, toast, waitingForPlayers]);

  const getApiErrorMessage = (error: unknown) => {
    if (!(error instanceof Error)) {
      return "Something went wrong";
    }

    const [, maybeJsonOrMessage = ""] = error.message.split(": ", 2);
    if (!maybeJsonOrMessage) {
      return "Something went wrong";
    }

    try {
      const parsed = JSON.parse(maybeJsonOrMessage);
      if (parsed?.error) {
        return parsed.error;
      }
    } catch {
      return maybeJsonOrMessage;
    }

    return maybeJsonOrMessage;
  };

  const startSoloGame = async () => {
    try {
      const playerRes = await apiRequest("POST", "/api/players", {
        name: "Player",
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

      setLocation(`/game/${game.id}`);
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
      const res = await apiRequest("POST", "/api/games/create-room", { password });
      const { roomCode } = await res.json();
      setRoomCode(roomCode);
      setCreateRoomOpen(false);
      setJoiningRoom(true);
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
      const res = await apiRequest("POST", `/api/games/join-room/${code}`, { password });
      const data = await res.json();

      if (data.gameId) {
        setLocation(`/game/${data.gameId}`);
      } else {
        setJoinRoomOpen(false);
        setWaitingForPlayers(true);
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: message
      });
    }
  };

  const findRandomGame = async () => {
    try {
      const res = await apiRequest("POST", "/api/games/matchmaking", {});
      const { gameId } = await res.json();
      setLocation(`/game/${gameId}`);
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
        className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-50 dark:from-orange-950 dark:to-red-900"
      >
        <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-background/90 shadow-2xl hover:shadow-3xl transition-shadow duration-500">
          <CardContent className="pt-6 text-center">
            <motion.h1 
              variants={titleVariants}
              className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
            >
              Ram-Sita Adventure
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
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Game
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

      <Dialog open={waitingForPlayers} onOpenChange={setWaitingForPlayers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waiting for Players</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <p>Waiting for the room to fill up and game to begin.</p>
            <div className="grid gap-2">
              <Label htmlFor="joined-room-code">Room Code</Label>
              <Input id="joined-room-code" value={roomCode} readOnly />
            </div>
            <p className="text-sm text-muted-foreground">
              You will be redirected automatically when the game starts.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
