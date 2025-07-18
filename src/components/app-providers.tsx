'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { DrawerProvider } from '@/contexts/drawer-context';
import { NotificationSheet } from '@/components/fintrack/notification-sheet';
import { FloatingCounterButton } from '@/components/fintrack/floating-counter-button';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DrawerProvider>
        <NotificationSheet>
          {children}
          <FloatingCounterButton />
        </NotificationSheet>
      </DrawerProvider>
    </AuthProvider>
  );
}
