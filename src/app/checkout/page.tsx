
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/fintrack/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/cart-context';
import { X, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, addPurchasedProducts, lastViewedProductId } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const handleProceedToPayment = () => {
    toast({
      title: 'Success!',
      description: 'Your order has been placed. (This is a simulation)',
    });
    
    // Add items to purchased list
    const purchasedIds = cartItems.map(item => item.product.id);
    addPurchasedProducts(purchasedIds);
    
    // Clear the cart
    clearCart();

    // Redirect back to the last product viewed, if available
    if (lastViewedProductId) {
      router.push(`/attom/${lastViewedProductId}`);
    } else {
      router.push('/attom');
    }
  };
  
  const getPrice = (content: string) => {
    const priceMatch = content.match(/(\d+(\.\d+)?)$/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-primary">
              Your Shopping Cart
            </h1>
          </div>

          {cartCount > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cart Items ({cartCount})</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {cartItems.map(item => {
                       const price = getPrice(item.product.content);
                       return (
                          <div key={item.product.id} className="flex items-center gap-4 py-4">
                            <Image
                              src={item.product.mediaURL!}
                              alt={item.product.authorName}
                              width={80}
                              height={80}
                              className="rounded-md object-cover aspect-square"
                            />
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold">{item.product.authorName}</p>
                              <p className="text-sm text-muted-foreground">${price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value, 10) || 1)}
                                className="w-16 h-9 text-center"
                              />
                            </div>
                            <p className="font-semibold w-20 text-right">
                              ${(price * item.quantity).toFixed(2)}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                       );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Subtotal</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Shipping</p>
                      <p>Free</p>
                    </div>
                     <div className="flex justify-between font-bold text-lg">
                      <p>Total</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button className="w-full" onClick={handleProceedToPayment}>
                      Proceed to Payment
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/attom">Shop More</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">Your cart is empty</h3>
                <p className="mt-2">Looks like you haven't added anything to your cart yet.</p>
                <Button asChild className="mt-6">
                    <Link href="/attom">Start Shopping</Link>
                </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
