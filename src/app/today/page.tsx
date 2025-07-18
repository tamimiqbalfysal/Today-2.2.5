'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp, doc, updateDoc, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { User, Post } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { CreatePostForm } from '@/components/fintrack/add-transaction-dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThinkCodeDialog } from '@/components/fintrack/gift-code-dialog';

function TodaySkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header isVisible={true} />
      <main className="container mx-auto p-4 max-w-2xl space-y-6 flex-1">
          <Skeleton className="h-[250px] w-full" />
      </main>
    </div>
  );
}


export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isThinkCodeDialogOpen, setIsThinkCodeDialogOpen] = useState(false);

  useEffect(() => {
    // Don't run on server or if user data is loading.
    if (typeof window === 'undefined' || authLoading) return;
    
    // If user exists and has NOT redeemed a code, show the gift code dialog after a delay.
    if (user && !user.redeemedThinkCodes) {
      const timeoutId = setTimeout(() => {
        // Re-check after the timeout in case the user object has updated.
        if (user && !user.redeemedThinkCodes) {
          setIsThinkCodeDialogOpen(true);
        }
      }, 60000); // 1 minute

      // Cleanup function to clear the timeout when the component unmounts
      // or when the user object changes (e.g., after redeeming a code).
      return () => clearTimeout(timeoutId);
    }
  }, [user, authLoading]);

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
  
  if (authLoading) {
    return <TodaySkeleton />;
  }
  
  const handleAddPost = async (
    content: string, 
    file: File | null, 
    postType: 'original' | 'share' = 'original', 
    sharedPostId?: string
  ) => {
      if (!user || !db || (!content.trim() && !file && postType === 'original')) return;
      
      try {
        let mediaURL: string | undefined = undefined;
        let mediaType: 'image' | 'video' | undefined = undefined;

        if (file && storage) {
          const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          mediaURL = await getDownloadURL(snapshot.ref);
          if (file.type.startsWith('image/')) {
            mediaType = 'image';
          } else if (file.type.startsWith('video/')) {
            mediaType = 'video';
          }
        }

        const newPostData: Omit<Post, 'id' | 'sharedPost'> = {
          authorId: user.uid,
          authorName: user.name,
          authorPhotoURL: user.photoURL || `https://placehold.co/40x40/FF69B4/FFFFFF?text=${user.name.charAt(0)}`,
          content: content,
          timestamp: Timestamp.now(),
          likes: [],
          comments: [],
          type: postType,
          ...(mediaURL && { mediaURL }),
          ...(mediaType && { mediaType }),
          ...(postType === 'share' && sharedPostId && { sharedPostId }),
        };


        await addDoc(collection(db, 'posts'), newPostData);
        
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { credits: increment(10) });

        toast({
          title: "Post Created!",
          description: "Your story has been successfully shared. (+10 Credits)",
        });
      } catch (error: any) {
          console.error("Error adding post:", error);
          
          if (error.code === 'storage/unauthorized') {
            toast({
                id: 'storage-permission-error',
                variant: "destructive",
                title: "File Upload Failed: Permission Denied",
                description: `CRITICAL: Your Firebase Storage security rules are blocking uploads. Go to your Firebase Console > Storage > Rules and ensure they allow writes for authenticated users. Example: "allow write: if request.auth != null;"`,
                duration: 20000,
            });
          } else if (error.code?.startsWith('storage/')) {
             toast({
                variant: "destructive",
                title: "Storage Error",
                description: `Could not upload file: ${error.message}`,
             });
          } else if (error.code === 'permission-denied') {
            toast({
                 id: 'firestore-error',
                 variant: "destructive",
                 title: "Could Not Save Post",
                 description: "Permission denied. Please check your Firestore security rules in the Firebase Console.",
                 duration: 12000
             });
          } else {
             toast({
                variant: "destructive",
                title: "Could Not Create Post",
                description: "An unexpected error occurred while creating your post.",
             });
          }
          
          throw error;
      }
  };

  return (
    <AuthGuard>
        <div className="flex flex-col h-screen">
          <Header isVisible={isHeaderVisible} />
          <main 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
             <div className="container mx-auto max-w-2xl p-4 flex-1">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Share a New Tale</CardTitle>
                            <CardDescription>What magical things are happening today?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreatePostForm 
                                user={user!} 
                                onAddPost={handleAddPost}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
          </main>
          <ThinkCodeDialog
            open={isThinkCodeDialogOpen}
            onOpenChange={setIsThinkCodeDialogOpen}
            userId={user?.uid}
          />
        </div>
    </AuthGuard>
  );
}
