"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, increment, runTransaction, getDoc, writeBatch, arrayUnion, arrayRemove, addDoc, collectionGroup, setDoc, where, getDocs, deleteDoc } from "firebase/firestore";
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '@/contexts/auth-context';
import type { Post } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { PostFeed } from '@/components/fintrack/recent-transactions';
import { Skeleton } from '@/components/ui/skeleton';
import { ThinkCodeDialog } from '@/components/fintrack/gift-code-dialog';
import { Button } from '@/components/ui/button';

function TodaySkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-full bg-primary/80" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32 bg-primary/80" />
            <Skeleton className="h-10 w-10 rounded-full bg-primary/80" />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 max-w-5xl space-y-6 flex-1">
          <Skeleton className="h-[450px] w-full" />
          <Skeleton className="h-[450px] w-full" />
      </main>
    </div>
  );
}


export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isThinkCodeDialogOpen, setIsThinkCodeDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || authLoading || !user) return;
    
    if (user && user.redeemedThinkCodes === 0) {
      const timeoutId = setTimeout(() => {
        if (user && user.redeemedThinkCodes === 0) {
          setIsThinkCodeDialogOpen(true);
        }
      }, 60000); 
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
  

  useEffect(() => {
    if (authLoading || !db) return; 
    
    if (!user) {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    const postsCol = collection(db, 'posts');
    const q = query(postsCol, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedPosts: Post[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Post;
      });
      
      setPosts(fetchedPosts);
      setIsDataLoading(false);
    }, (error: any) => {
      console.error("Error fetching posts:", error);
      let description = "Could not load posts.";
      if (error.code === 'permission-denied') {
        description = "You don't have permission to view posts. Please check your Firestore security rules to allow reads on the 'posts' collection for authenticated users.";
      }
      toast({
        variant: "destructive",
        title: "Database Error",
        description: description,
        duration: 10000,
      });
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, toast]);

    const handleLikePost = async (postId: string, authorId: string) => {
        if (!user || !db) return;
        const postRef = doc(db, 'posts', postId);
        const likerId = user.uid;

        try {
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) {
                    throw "Post does not exist!";
                }

                const postData = postDoc.data();
                const currentLikes: string[] = postData.likes || [];
                const isLiking = !currentLikes.includes(likerId);

                if (isLiking) {
                    transaction.update(postRef, { likes: arrayUnion(likerId) });

                    if (authorId !== likerId) {
                        const notificationRef = doc(collection(db, `users/${authorId}/notifications`));
                        transaction.set(notificationRef, {
                            type: 'like',
                            senderId: likerId,
                            senderName: user.name,
                            senderPhotoURL: user.photoURL || '',
                            postId: postId,
                            timestamp: Timestamp.now(),
                            read: false,
                        });
                        
                        const userDocRef = doc(db, 'users', authorId);
                        transaction.update(userDocRef, { unreadNotifications: true });
                    }
                } else {
                    transaction.update(postRef, { likes: arrayRemove(likerId) });
                     if (authorId !== likerId) {
                        const notificationsCollection = collection(db, `users/${authorId}/notifications`);
                        const q = query(notificationsCollection, where("postId", "==", postId), where("senderId", "==", likerId), where("type", "==", "like"));
                        const querySnapshot = await getDocs(q);
                        querySnapshot.forEach((doc) => {
                            transaction.delete(doc.ref);
                        });
                    }
                }
            });
        } catch (error: any) {
            console.error("Error liking post:", error);
            let description = "Could not update like status.";
            if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
                description = "Permission Denied. Please check your Firestore security rules to allow 'update' on the 'posts' collection and 'write' on the 'users' collection for notifications.";
            }
            toast({
                variant: "destructive",
                title: "Error",
                description: description,
                duration: 10000,
            });
        }
    };
    
    const handleCommentPost = async (postId: string, commentText: string) => {
        if (!user || !db || !commentText.trim()) return;

        const postRef = doc(db, 'posts', postId);
        const newComment = {
            id: doc(collection(db, 'dummy')).id, // Generate a unique ID for the comment
            authorId: user.uid,
            authorName: user.name,
            authorPhotoURL: user.photoURL || '',
            content: commentText,
            timestamp: Timestamp.now(),
        };

        try {
            await updateDoc(postRef, {
                comments: arrayUnion(newComment)
            });
            toast({
                title: "Comment posted!",
                description: "Your comment has been added successfully.",
            });
        } catch (error: any) {
            console.error("Error posting comment:", error);
             let description = "Could not post your comment. Please try again.";
            if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
                description = "Permission Denied. Please check your Firestore security rules to allow updates to the 'comments' field on posts.";
            }
            toast({
                variant: "destructive",
                title: "Error",
                description: description,
            });
            // Re-throw the error to be caught by the calling component if needed
            throw error;
        }
    };

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
  
  if (authLoading || (isDataLoading && user)) {
    return <TodaySkeleton />;
  }

  return (
    <AuthGuard>
        <div className="flex flex-col h-screen">
          <Header isVisible={isHeaderVisible} />
          <main 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto scroll-snap-y-mandatory"
          >
            <div className="container mx-auto max-w-2xl">
                <PostFeed 
                posts={posts} 
                currentUser={user}
                onDeletePost={() => {}}
                onLikePost={handleLikePost}
                onCommentPost={handleCommentPost}
                onSharePost={handleAddPost}
                />
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
