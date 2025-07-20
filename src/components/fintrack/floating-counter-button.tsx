
'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { SheetTrigger } from '@/components/ui/sheet';
import type { SVGProps } from 'react';

function BellShapeButton(props: SVGProps<SVGSVGElement> & { children?: React.ReactNode }) {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21H13.73Z" />
    </svg>
  );
}

const formatCredits = (num: number): string => {
  if (num >= 1_000_000_000_000_000) {
    return (num / 1_000_000_000_000_000).toFixed(num % 1_000_000_000_000_000 === 0 ? 0 : 1) + 'Q';
  }
  if (num >= 1_000_000_000_000) {
    return (num / 1_000_000_000_000).toFixed(num % 1_000_000_000_000 === 0 ? 0 : 1) + 'T';
  }
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(num % 1_000_000_000 === 0 ? 0 : 1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + 'K';
  }
  return num.toString();
};


export function FloatingCounterButton() {
  const { user, loading } = useAuth();

  const credits = user?.credits ?? 0;
  const unreadCount = user?.notifications?.filter(n => !n.read).length ?? 0;

  if (loading || !user) {
    return null;
  }

  const formattedCredits = formatCredits(credits);

  return (
    <SheetTrigger asChild>
      <div className="fixed bottom-4 right-4 z-50">
        <div 
            className="relative flex items-center justify-center cursor-pointer"
            aria-label={`You have ${credits} credits and notifications`}
        >
            <BellShapeButton className="h-20 w-20 text-white drop-shadow-lg" />
            <div className="absolute bottom-6 flex flex-col items-center justify-center">
                <span className="text-sm font-bold leading-none text-black">{formattedCredits}</span>
            </div>
             {unreadCount > 0 && (
                <div className="absolute top-4 right-5 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 border-2 border-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
            )}
        </div>
      </div>
    </SheetTrigger>
  );
}
