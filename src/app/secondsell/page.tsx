
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SecondsellPage() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      <div className="flex flex-col h-screen bg-background">
        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col items-center justify-center text-center p-4 overflow-y-auto"
        >
            <h1 className="text-5xl font-bold tracking-tighter text-primary">
              Welcome to Secondsell
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              This is the dedicated page for the Secondsell section.
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link href="/attom">Go Back to the Store</Link>
            </Button>
        </main>
      </div>
  );
}
