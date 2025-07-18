'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center p-4 border-b">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-9 w-48" />
                </div>
                <div className="p-4 md:p-8 space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid gap-4 md:grid-cols-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-5">
                      <div className="lg:col-span-3 space-y-6">
                        <Skeleton className="h-80 w-full" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                       <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-80 w-full" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  // If not loading and no user, the redirect is in flight.
  // Return null to render nothing while the redirect happens.
  return null;
}
