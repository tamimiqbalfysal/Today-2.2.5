'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { DrawerProvider } from '@/contexts/drawer-context';
import { NotificationSheet } from '@/components/fintrack/notification-sheet';
import { FloatingCounterButton } from '@/components/fintrack/floating-counter-button';
import { FloatingCartButton } from '@/components/fintrack/floating-cart-button';
import { CartProvider } from '@/contexts/cart-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <DrawerProvider>
          <NotificationSheet>
            {children}
            <FloatingCounterButton />
            <FloatingCartButton />
          </NotificationSheet>
        </DrawerProvider>
      </CartProvider>
    </AuthProvider>
  );
}
