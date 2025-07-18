import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { DrawerProvider } from '@/contexts/drawer-context';
import { FloatingCounterButton } from '@/components/fintrack/floating-counter-button';
import { NotificationSheet } from '@/components/fintrack/notification-sheet';

export const metadata: Metadata = {
  title: 'Modern App',
  description: 'A sleek, modern social feed.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
            <DrawerProvider>
              <NotificationSheet>
                {children}
                <FloatingCounterButton />
              </NotificationSheet>
            </DrawerProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
