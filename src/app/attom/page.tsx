
'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const products: any[] = [];

function ProductCard({ product, onAddToCart }: { product: typeof products[0], onAddToCart: (productName: string) => void }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={600}
            height={600}
            className="w-full h-auto aspect-square object-cover"
            data-ai-hint={product.aiHint}
          />
          {product.isNew && <Badge className="absolute top-2 left-2">NEW</Badge>}
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.rating}.0)</span>
          </div>
          <p className="text-2xl font-bold">${product.price}</p>
        </div>
      </CardContent>
      <div className="p-4 pt-0">
        <Button className="w-full" onClick={() => onAddToCart(product.name)}>
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </div>
    </Card>
  );
}

export default function AttomPage() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const currentScrollY = scrollContainerRef.current.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  };

  const handleAddToCart = (productName: string) => {
    toast({
      title: 'Added to Cart',
      description: `${productName} has been added to your cart.`,
    });
  };

  const filteredProducts = useMemo(() => {
    let productsToShow = products;

    if (activeFilter) {
      productsToShow = productsToShow.filter(p => p.category === activeFilter);
    }
    
    if (searchTerm) {
      productsToShow = productsToShow.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return productsToShow;
  }, [searchTerm, activeFilter]);
  
  const handleFilterClick = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-background">
        <Header isVisible={isHeaderVisible} />
        <main
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                The Attom Store
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover our curated collection of quantum-inspired gear and accessories.
              </p>
            </div>

            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link href="/gift-garden">Gift Garden</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/orgrim">Orgrim</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/secondsell">Secondsell</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/marco-polo">Marco Polo</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/printit">Printit</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/machinehood">Machinehood</Link>
              </Button>
              <Button asChild variant="default">
                <Link href="/tribe">Tribe</Link>
              </Button>
            </div>
            
            <div className="mb-8 max-w-lg mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full pl-10 h-12 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
               <Button
                variant={activeFilter === 'Tribe' ? 'default' : 'outline'}
                onClick={() => handleFilterClick('Tribe')}
                className="h-12"
              >
                <Filter className="mr-2 h-4 w-4" /> Tribe
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
