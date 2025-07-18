
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post as Product } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/fintrack/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

function ProductPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-24 mb-8" />
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <Skeleton className="w-full aspect-square rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const router = useRouter();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!productId || !db) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const productRef = doc(db, 'posts', productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
        } else {
          toast({ variant: 'destructive', title: 'Product not found.' });
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load product details.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast]);
  
  const price = useMemo(() => {
    if (!product?.content || typeof product.content !== 'string') return '0.00';
    const priceMatch = product.content.match(/(\d+(\.\d+)?)$/);
    return priceMatch ? parseFloat(priceMatch[1]).toFixed(2) : '0.00';
  }, [product?.content]);
  
  const description = useMemo(() => {
    if (!product?.content || typeof product.content !== 'string') return '';
    const priceMatch = product.content.match(/(\d+(\.\d+)?)$/);
    return priceMatch ? product.content.substring(0, priceMatch.index).trim() : product.content;
  }, [product?.content]);

  const handleAddToCart = () => {
    if (!product) return;
    const productWithPrice = { ...product, content: price };
    addToCart(productWithPrice, 1);
    toast({
      title: 'Added to Cart',
      description: `${product.authorName} has been added to your cart.`,
    });
  };

  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground">The product you are looking for does not exist.</p>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button onClick={() => router.back()} variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to store
          </Button>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <Image
                        src={product.mediaURL!}
                        alt={product.authorName}
                        width={800}
                        height={800}
                        className="w-full h-auto aspect-square object-cover"
                    />
                </CardContent>
            </Card>
            <div className="space-y-6">
                <div>
                    <p className="text-sm font-medium text-primary">{product.category}</p>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.authorName}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Star
                        key={i}
                        className={`h-5 w-5 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                        />
                    ))}
                    </div>
                    <span className="text-sm text-muted-foreground">(123 reviews)</span>
                </div>
              
                <p className="text-4xl font-bold text-primary">${price}</p>
                
                {description && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                  </div>
                )}

                <Button size="lg" className="w-full text-lg" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
