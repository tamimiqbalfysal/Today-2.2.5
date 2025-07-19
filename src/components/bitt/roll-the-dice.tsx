
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';

const diceFaces = [
    // Face 1
    (key: number) => <circle key={key} cx="12" cy="12" r="2" fill="currentColor" />,
    // Face 2
    (key: number) => <><circle key={`${key}-1`} cx="8" cy="8" r="2" fill="currentColor" /><circle key={`${key}-2`} cx="16" cy="16" r="2" fill="currentColor" /></>,
    // Face 3
    (key: number) => <><circle key={`${key}-1`} cx="8" cy="8" r="2" fill="currentColor" /><circle key={`${key}-2`} cx="12" cy="12" r="2" fill="currentColor" /><circle key={`${key}-3`} cx="16" cy="16" r="2" fill="currentColor" /></>,
    // Face 4
    (key: number) => <><circle key={`${key}-1`} cx="8" cy="8" r="2" fill="currentColor" /><circle key={`${key}-2`} cx="16" cy="8" r="2" fill="currentColor" /><circle key={`${key}-3`} cx="8" cy="16" r="2" fill="currentColor" /><circle key={`${key}-4`} cx="16" cy="16" r="2" fill="currentColor" /></>,
    // Face 5
    (key: number) => <><circle key={`${key}-1`} cx="8" cy="8" r="2" fill="currentColor" /><circle key={`${key}-2`} cx="16" cy="8" r="2" fill="currentColor" /><circle key={`${key}-3`} cx="12" cy="12" r="2" fill="currentColor" /><circle key={`${key}-4`} cx="8" cy="16" r="2" fill="currentColor" /><circle key={`${key}-5`} cx="16" cy="16" r="2" fill="currentColor" /></>,
    // Face 6
    (key: number) => <><circle key={`${key}-1`} cx="8" cy="8" r="2" fill="currentColor" /><circle key={`${key}-2`} cx="16" cy="8" r="2" fill="currentColor" /><circle key={`${key}-3`} cx="8" cy="12" r="2" fill="currentColor" /><circle key={`${key}-4`} cx="16" cy="12" r="2" fill="currentColor" /><circle key={`${key}-5`} cx="8" cy="16" r="2" fill="currentColor" /><circle key={`${key}-6`} cx="16" cy="16" r="2" fill="currentColor" /></>,
];

export function RollTheDice() {
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // This useEffect ensures Math.random() is only called on the client side after mount.
  useEffect(() => {
    setDiceValue(Math.floor(Math.random() * 6) + 1);
  }, []);

  const rollDice = () => {
    setIsRolling(true);
    // Show a few random faces quickly for animation effect
    const rollInterval = setInterval(() => {
        setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 50);

    setTimeout(() => {
        clearInterval(rollInterval);
        setDiceValue(Math.floor(Math.random() * 6) + 1);
        setIsRolling(false);
    }, 500);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>Roll The Dice</CardTitle>
        <CardDescription>Click the button to roll the die.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8">
        <div className="w-48 h-48">
            <AnimatePresence mode="wait">
                <motion.div
                    key={diceValue}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                >
                    <svg viewBox="0 0 24 24" className="text-primary w-full h-full">
                        <rect width="20" height="20" x="2" y="2" rx="4" stroke="currentColor" strokeWidth="1.5" fill="hsl(var(--card))" />
                        {diceValue !== null && diceFaces[diceValue - 1](diceValue)}
                    </svg>
                </motion.div>
            </AnimatePresence>
        </div>
        <Button size="lg" onClick={rollDice} disabled={isRolling}>
            <Dices className="mr-2"/>
            {isRolling ? 'Rolling...' : 'Roll Dice'}
        </Button>
      </CardContent>
    </Card>
  );
}
