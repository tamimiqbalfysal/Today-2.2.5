
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RollTheDice } from '@/components/bitt/roll-the-dice';
import { Whiteboard } from '@/components/bitt/whiteboard';
import { Dice6, Brush } from 'lucide-react';
import { cn } from '@/lib/utils';

type Software = 'dice' | 'whiteboard';

export default function BittPage() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeSoftware, setActiveSoftware] = useState<Software | null>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const currentScrollY = scrollContainerRef.current.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  };

  return (
      <div className="flex flex-col h-screen bg-secondary">
        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            <h1 className="text-5xl font-bold tracking-tighter text-primary">
              Bitt Workspace
            </h1>
            <p className="text-lg text-muted-foreground">
              Select a tool to get started.
            </p>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={() => setActiveSoftware('dice')}
                variant={activeSoftware === 'dice' ? 'default' : 'outline'}
              >
                <Dice6 className="mr-2" /> Roll The Dice
              </Button>
              <Button 
                size="lg" 
                onClick={() => setActiveSoftware('whiteboard')}
                variant={activeSoftware === 'whiteboard' ? 'default' : 'outline'}
              >
                <Brush className="mr-2" /> Tepantor
              </Button>
            </div>
            
            <div className="w-full mt-8">
              {activeSoftware === 'dice' && <RollTheDice />}
              {activeSoftware === 'whiteboard' && <Whiteboard />}
            </div>
          </div>
        </main>
      </div>
  );
}
