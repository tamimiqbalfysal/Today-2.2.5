
'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { FloatingCounterButton } from '@/components/fintrack/floating-counter-button';
import { FloatingCartButton } from '@/components/fintrack/floating-cart-button';

const PROTECTED_ROUTES = [
  '/',
  '/today',
  '/profile',
  '/add',
  '/admin',
  '/thank-you',
  '/marketplace',
  '/attom', // Assuming base is protected
  '/bitt',
  '/gift-garden',
  '/orgrim',
  '/secondsell',
  '/marco-polo',
  '/printit',
  '/machinehood',
  '/tribe',
  '/checkout'
];

const DYNAMIC_PROTECTED_ROUTES = [
  '/u/',
  '/attom/'
];

export function RootGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname) || 
                           DYNAMIC_PROTECTED_ROUTES.some(p => pathname.startsWith(p));
  
  const showHeader = !['/login', '/signup'].includes(pathname);

  if (isProtectedRoute) {
    return (
      <AuthGuard>
        {showHeader && <Header />}
        {children}
        <FloatingCounterButton />
        <FloatingCartButton />
      </AuthGuard>
    );
  }
  
  // Public routes
  return (
    <>
      {showHeader && <Header />}
      {children}
      {user && (
          <>
            <FloatingCounterButton />
            <FloatingCartButton />
          </>
      )}
    </>
  );
}
