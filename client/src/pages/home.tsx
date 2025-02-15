import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const startGame = async () => {
    try {
      // Create human player
      const playerRes = await apiRequest("POST", "/api/players", {
        name: "Player",
        isAI: false
      });
      const player = await playerRes.json();

      // Create AI players
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center bg-[url('https://img.freepik.com/free-vector/indian-traditional-paisley-pattern-oriental-ethnic-mandala-ornament_1217-1809.jpg?w=1800')]">
      <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-background/90">
        <CardContent className="pt-6 text-center">
          <h1 className="text-4xl font-bold mb-6 text-primary">Ram-Sita Adventure</h1>
          <p className="mb-8 text-muted-foreground">
            A Ramayana-themed card game where you compete against AI opponents
          </p>
          <Button 
            size="lg" 
            onClick={startGame}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}