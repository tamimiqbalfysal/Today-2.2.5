'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { DrawerProvider } from '@/contexts/drawer-context';
import { CartProvider } from '@/contexts/cart-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <DrawerProvider>
            {children}
        </DrawerProvider>
      </CartProvider>
    </AuthProvider>
  );
}
