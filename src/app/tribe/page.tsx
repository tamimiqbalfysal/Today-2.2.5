
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { Post as Product } from '@/lib/types';
import Image from 'next/image';
import { Upload, Star, ShoppingCart, Trash2, Info } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function ProductCard({ product, onDelete, currentUserId }: { product: Product, onDelete: (productId: string, mediaUrl?: string) => void, currentUserId?: string }) {
  const { toast } = useToast();
  const handleAddToCart = (productName: string) => {
    toast({
      title: 'Added to Cart',
      description: `${productName} has been added to your cart.`,
    });
  };

  const priceMatch = product.content.match(/(\d+(\.\d+)?)$/);
  const price = priceMatch ? parseFloat(priceMatch[1]).toFixed(2) : '0.00';
  const description = priceMatch ? product.content.substring(0, priceMatch.index).trim() : product.content;
  
  const isOwner = product.authorId === currentUserId;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
       <CardHeader className="flex-row gap-4 items-center justify-between p-4">
        <h3 className="text-lg font-semibold flex-grow truncate">{product.authorName}</h3>
         {isOwner && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your product listing.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(product.id, product.mediaURL)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
         )}
      </CardHeader>
      <CardContent className="p-0 flex flex-col flex-grow">
        <div className="relative">
          <Image
            src={product.mediaURL!}
            alt={product.authorName}
            width={600}
            height={600}
            className="w-full h-auto aspect-square object-cover"
          />
        </div>
        <div className="p-4 space-y-2 flex flex-col flex-grow">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex-grow" />
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 text-muted-foreground"
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">(0 Review)</span>
          </div>
          <p className="text-2xl font-bold">${price}</p>
        </div>
      </CardContent>
      <div className="p-4 pt-0 mt-auto">
        <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/attom/${product.id}`}>
                <Info className="mr-2 h-4 w-4" /> Details
              </Link>
            </Button>
            <Button className="w-full" onClick={() => handleAddToCart(product.authorName)}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
        </div>
      </div>
    </Card>
  );
}


export default function TribePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    if (!db || !user) return;
    setIsLoadingProducts(true);

    const postsCollection = collection(db, 'posts');
    const userPostsQuery = query(postsCollection, where('authorId', '==', user.uid));

    const unsubscribe = onSnapshot(userPostsQuery, (snapshot) => {
        const fetchedProducts = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter(product => product.category === 'Tribe');

        fetchedProducts.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        setProducts(fetchedProducts);
        setIsLoadingProducts(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your listed products. Please check your Firestore security rules if this persists.",
            duration: 10000,
        });
        setIsLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async (productId: string, mediaUrl?: string) => {
    if (!db || !storage || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to delete products.' });
        return;
    }
    
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete || productToDelete.authorId !== user.uid) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You can only delete your own products.' });
        return;
    }

    try {
        await deleteDoc(doc(db, 'posts', productId));
        if (mediaUrl) {
            const storageRef = ref(storage, mediaUrl);
            await deleteObject(storageRef).catch(err => {
                if (err.code !== 'storage/object-not-found') throw err;
            });
        }
        toast({ title: 'Success', description: 'Product deleted successfully.' });
    } catch (error: any) {
        console.error("Error deleting product:", error);
        let description = 'Could not delete the product. Please try again.';
        if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
            description = "Permission Denied. Please update your Firestore security rules to allow this action.";
        }
        toast({ variant: 'destructive', title: 'Deletion Failed', description: description, duration: 10000 });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !description || !price || !imageFile || !user) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields and select an image.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!storage || !db) throw new Error("Firebase not configured");
      
      const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      const postsCollectionRef = collection(db, `posts`);
      await addDoc(postsCollectionRef, {
        authorId: user.uid,
        authorName: productName,
        authorPhotoURL: user.photoURL,
        content: `${description}\n${parseFloat(price)}`,
        timestamp: Timestamp.now(),
        likes: [],
        comments: [],
        mediaURL: imageUrl,
        mediaType: 'image',
        type: 'original',
        category: 'Tribe',
      });
      
      toast({ title: 'Success!', description: 'Your product has been listed for sale.' });
      
      setProductName('');
      setDescription('');
      setPrice('');
      setImageFile(null);
      setImagePreview(null);
      if(fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      console.error('Error adding product:', error);
      let description = "An unexpected error occurred.";
      if (error.code === 'storage/unauthorized') {
        description = `You don't have permission to upload files. Please check your Storage security rules.`;
      } else if (error.code === 'permission-denied') {
        description = `You don't have permission to add products. Please check your Firestore security rules.`;
      }
      toast({ variant: 'destructive', title: 'Submission Failed', description });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 overflow-y-auto container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-primary">
              The Tribe Marketplace
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Sell your unique creations to the community.
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link href="/attom">Go Back to the Store</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>List a New Product</CardTitle>
                  <CardDescription>Fill in the details below to add your item to the marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Quantum Entangled Socks" disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product in detail..." disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 19.99" min="0.01" step="0.01" disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                      <Label>Product Image</Label>
                      <Input id="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isSubmitting}/>
                      <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                        <Upload className="mr-2 h-4 w-4" />
                        {imageFile ? 'Change Image' : 'Upload Image'}
                      </Button>
                      {imagePreview && (
                        <div className="mt-4 relative w-full aspect-video rounded-md border overflow-hidden">
                          <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
                        </div>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Listing...' : 'List Product'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">Your Listed Products</h2>
              {isLoadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card><CardContent className="p-4"><div className="animate-pulse space-y-4"><div className="h-40 bg-muted rounded-md"></div><div className="h-6 w-3/4 bg-muted rounded-md"></div><div className="h-4 w-1/2 bg-muted rounded-md"></div><div className="h-8 w-full bg-muted rounded-md"></div></div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="animate-pulse space-y-4"><div className="h-40 bg-muted rounded-md"></div><div className="h-6 w-3/4 bg-muted rounded-md"></div><div className="h-4 w-1/2 bg-muted rounded-md"></div><div className="h-8 w-full bg-muted rounded-md"></div></div></CardContent></Card>
                  </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} currentUserId={user?.uid} />
                    ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                  <h3 className="text-lg font-semibold">You haven't listed any products yet.</h3>
                  <p>Use the form to list your first product in the Tribe.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
  );
}
