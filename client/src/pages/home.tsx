import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  const [roomCode, setRoomCode] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);

  const startSoloGame = async () => {
    try {
      // Create human player
      const playerRes = await apiRequest("POST", "/api/players", {
        name: "Player",
        isAI: false
      });
      const player = await playerRes.json();

      // Create AI players with specific names
      const aiPlayers = await Promise.all([
        apiRequest("POST", "/api/players", { name: "R.9", isAI: true }),
        apiRequest("POST", "/api/players", { name: "R.O", isAI: true }),
        apiRequest("POST", "/api/players", { name: "P10", isAI: true })
      ].map(p => p.then(res => res.json())));

      // Create game
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

  const createMultiplayerGame = async () => {
    try {
      const res = await apiRequest("POST", "/api/games/create-room", {});
      const { roomCode } = await res.json();
      setRoomCode(roomCode);
      setJoiningRoom(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create room"
      });
    }
  };

  const joinRoom = async (code: string) => {
    try {
      const res = await apiRequest("POST", `/api/games/join-room/${code}`, {});
      const { gameId } = await res.json();
      setLocation(`/game/${gameId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid room code or room is full"
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
              onClick={createMultiplayerGame}
              className="w-full h-12"
            >
              Play with Friends
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
            <p className="text-sm text-muted-foreground">
              Waiting for other players to join...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}