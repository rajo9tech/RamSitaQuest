import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { writeAuthUser } from "@/hooks/useAuth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (!name.trim()) return;
    writeAuthUser({ name });
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-green-100 to-red-100 dark:from-yellow-950 dark:via-green-950 dark:to-red-950 p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-4 border-primary/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">🎲 Ludo Lobby Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Player Name</Label>
              <Input
                id="player-name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button className="w-full text-lg h-12" onClick={handleLogin} disabled={!name.trim()}>
              Enter Game
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
