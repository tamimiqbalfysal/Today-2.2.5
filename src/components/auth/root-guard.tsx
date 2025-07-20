
'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { FloatingCounterButton } from '@/components/fintrack/floating-counter-button';
import { FloatingCartButton } from '@/components/fintrack/floating-cart-button';

// Routes that MUST have an authenticated user.
const PROTECTED_ROUTES = [
  '/today',
  '/profile',
  '/add',
  '/admin',
  '/thank-you',
  '/marketplace',
  '/tribe',
];

// Dynamic routes that are protected.
const DYNAMIC_PROTECTED_ROUTES_PREFIX = [
  '/admin/',
];

export function RootGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname) || 
                           DYNAMIC_PROTECTED_ROUTES_PREFIX.some(p => pathname.startsWith(p));
  
  const showHeader = !['/login', '/signup'].includes(pathname);
  const showCart = user || ['/attom', '/checkout'].some(p => pathname.startsWith(p));


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
  
  // Public routes (like '/', '/attom', '/bitt', etc.)
  return (
    <>
      {showHeader && <Header />}
      {children}
      {user && <FloatingCounterButton />}
      {showCart && <FloatingCartButton />}
    </>
  );
}
