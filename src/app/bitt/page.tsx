
'use client';

import { useState, useRef } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BittPage() {
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
    <AuthGuard>
      <div className="flex flex-col h-screen bg-background">
        <Header isVisible={isHeaderVisible}/>
        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col items-center justify-center text-center p-4 overflow-y-auto"
        >
            <h1 className="text-5xl font-bold tracking-tighter text-primary">
              Welcome to Bitt
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              This is the dedicated page for the Bitt application.
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link href="/add">Go Back</Link>
            </Button>
        </main>
      </div>
    </AuthGuard>
  );
}
