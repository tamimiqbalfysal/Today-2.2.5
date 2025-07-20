import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/app-providers';
import { NotificationSheet } from '@/components/fintrack/notification-sheet';
import { RootGuard } from '@/components/auth/root-guard';

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
        <AppProviders>
          <NotificationSheet>
            <RootGuard>
              {children}
            </RootGuard>
          </NotificationSheet>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
