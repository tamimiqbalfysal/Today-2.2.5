
'use client';

import { useCart } from '@/contexts/cart-context';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function FloatingCartButton() {
  const { cartCount } = useCart();
  const pathname = usePathname();

  // Pages where the cart button should be visible
  const visiblePages = ['/attom', '/checkout', '/gift-garden', '/orgrim', '/secondsell', '/marco-polo', '/printit', '/machinehood', '/tribe'];

  // Do not show the button on pages not in the list, or on the checkout page if the cart is empty
  if (!visiblePages.includes(pathname) || (pathname === '/checkout' && cartCount === 0)) {
    return null;
  }

  return (
    <Button 
      asChild
      variant="outline"
      className={cn(
        "fixed bottom-28 right-4 z-50 h-16 w-16 rounded-full shadow-lg text-foreground",
        "bg-background hover:bg-accent"
      )}
      aria-label={`View cart with ${cartCount} items`}
    >
      <Link href="/checkout">
        <ShoppingCart className="h-8 w-8" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground border-2 border-background">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
