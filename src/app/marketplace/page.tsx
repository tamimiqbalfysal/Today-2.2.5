'use client';
 
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MarketplacePage() {
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
      <div className="flex flex-col h-screen" style={{ backgroundColor: '#003366' }}>
        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col items-center justify-center text-center p-4 overflow-y-auto"
        >
            <h1 className="text-6xl font-bold tracking-tighter" style={{ backgroundImage: 'linear-gradient(to right, #0070f3, #0099ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Coming Soon
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              We are working hard to bring this feature to you!
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link href="/thank-you">Go Back</Link>
            </Button>
        </main>
      </div>
  );
}
