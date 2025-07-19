

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, increment, runTransaction, getDoc, writeBatch, arrayUnion, arrayRemove, addDoc, collectionGroup, setDoc, where, getDocs, deleteDoc } from "firebase/firestore";
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
      const fetchedPosts: Post[] = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Post))
        .filter(post => !post.isPrivate || post.authorId === user?.uid);

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
                
                const authorRef = doc(db, 'users', authorId);
                const likerRef = doc(db, 'users', likerId);
                const authorDoc = await transaction.get(authorRef);
                const likerDoc = await transaction.get(likerRef);

                if (!authorDoc.exists() || !likerDoc.exists()) {
                    throw "User does not exist!";
                }

                if (isLiking) {
                    transaction.update(postRef, { likes: arrayUnion(likerId) });
                    transaction.update(authorRef, { followers: arrayUnion(likerId) });
                    transaction.update(likerRef, { following: arrayUnion(authorId) });

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
                        
                        transaction.update(authorRef, { unreadNotifications: true });
                    }
                } else {
                    transaction.update(postRef, { likes: arrayRemove(likerId) });
                    transaction.update(authorRef, { followers: arrayRemove(likerId) });
                    transaction.update(likerRef, { following: arrayRemove(authorId) });

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
      contentBangla: string,
      file: File | null,
      fileBangla: File | null,
      defenceCredit: number,
      postType: 'original' | 'share' = 'original',
      sharedPostId?: string
    ) => {
      if (!user || !db || (!content.trim() && !file && !contentBangla.trim() && !fileBangla && postType === 'original')) return;
  
      try {
        let mediaURL: string | undefined = undefined;
        let mediaType: 'image' | 'video' | undefined = undefined;
        let mediaURLBangla: string | undefined = undefined;
        let mediaTypeBangla: 'image' | 'video' | undefined = undefined;
  
        if (file && storage) {
          const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          mediaURL = await getDownloadURL(snapshot.ref);
          mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        }

        if (fileBangla && storage) {
          const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${fileBangla.name}_bn`);
          const snapshot = await uploadBytes(storageRef, fileBangla);
          mediaURLBangla = await getDownloadURL(snapshot.ref);
          mediaTypeBangla = fileBangla.type.startsWith('image/') ? 'image' : 'video';
        }
  
        const newPostData: Omit<Post, 'id' | 'sharedPost'> = {
          authorId: user.uid,
          authorName: user.name,
          authorPhotoURL: user.photoURL || `https://placehold.co/40x40/FF69B4/FFFFFF?text=${user.name.charAt(0)}`,
          content: content,
          contentBangla: contentBangla,
          timestamp: Timestamp.now(),
          likes: [],
          comments: [],
          type: postType,
          isPrivate: false,
          ...(mediaURL && { mediaURL }),
          ...(mediaType && { mediaType }),
          ...(mediaURLBangla && { mediaURLBangla }),
          ...(mediaTypeBangla && { mediaTypeBangla }),
          ...(defenceCredit > 0 && { defenceCredit }),
          ...(postType === 'share' && sharedPostId && { sharedPostId }),
        };
  
        const userDocRef = doc(db, 'users', user.uid);
        
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userDocRef);
          if (!userDoc.exists()) {
            throw "User does not exist!";
          }
          
          const currentCredits = userDoc.data().credits || 0;
          if (currentCredits < defenceCredit) {
            throw new Error("You do not have enough credits.");
          }

          const postCollectionRef = collection(db, 'posts');
          transaction.set(doc(postCollectionRef), newPostData);

          const creditChange = 10 - defenceCredit;
          transaction.update(userDocRef, { credits: increment(creditChange) });
        });
  
        toast({
          title: "Post Created!",
          description: `Your story has been shared. Credits changed by ${10 - defenceCredit}.`,
        });

      } catch (error: any) {
          console.error("Error adding post:", error);
          
          if (error.message === "You do not have enough credits.") {
             toast({
                variant: "destructive",
                title: "Insufficient Credits",
                description: error.message,
             });
          } else if (error.code === 'storage/unauthorized') {
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
                description: error.message || "An unexpected error occurred while creating your post.",
             });
          }
          
          throw error;
      }
    };

    const handleDeletePost = async (postId: string, mediaUrl?: string) => {
      if (!db || !storage || !user) return;
      try {
        await runTransaction(db, async (transaction) => {
          const postRef = doc(db, 'posts', postId);
          const postDoc = await transaction.get(postRef);

          if (!postDoc.exists()) {
              throw new Error("Post does not exist!");
          }
          
          const postData = postDoc.data() as Post;
          if (postData.authorId !== user.uid) {
            throw new Error("You can only delete your own posts.");
          }

          if (postData.defenceCredit && postData.defenceCredit > 0) {
              const userRef = doc(db, 'users', user.uid);
              transaction.update(userRef, { credits: increment(postData.defenceCredit) });
          }
          
          transaction.delete(postRef);
        });

        if (mediaUrl) {
            const storageRef = ref(storage, mediaUrl);
            await deleteObject(storageRef).catch(err => {
                if (err.code !== 'storage/object-not-found') throw err;
            });
        }
        toast({ title: 'Success', description: 'Post deleted successfully.' });
      } catch (error: any) {
          console.error("Error deleting post:", error);
          toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message || 'Could not delete post.' });
      }
    };
    
    const handleMakePostPrivate = async (post: Post, offenceCredit: number) => {
      if (!db || !storage || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }
      
      const attackerId = user.uid;
      const authorId = post.authorId;
      const defenceCredit = post.defenceCredit || 0;

      if (attackerId === authorId) {
        toast({ variant: 'destructive', title: 'Error', description: "You cannot use offence credits on your own post." });
        return;
      }
      if (offenceCredit <= defenceCredit) {
        toast({ variant: 'destructive', title: 'Failed', description: `Offence credit must be greater than ${defenceCredit}.` });
        return;
      }

      try {
        await runTransaction(db, async (transaction) => {
            const attackerRef = doc(db, 'users', attackerId);
            const authorRef = doc(db, 'users', authorId);
            const postRef = doc(db, 'posts', post.id);

            const [attackerDoc, authorDoc, postDoc] = await Promise.all([
                transaction.get(attackerRef),
                transaction.get(authorRef),
                transaction.get(postRef)
            ]);
            
            if (!attackerDoc.exists() || !authorDoc.exists() || !postDoc.exists()) {
                throw new Error("Required data not found. Could not complete the action.");
            }

            const attackerCredits = attackerDoc.data().credits || 0;
            if (attackerCredits < offenceCredit) {
                throw new Error("You do not have enough credits for this offence.");
            }
            
            // 1. Update credits
            transaction.update(attackerRef, { credits: increment(-offenceCredit) });
            transaction.update(authorRef, { credits: increment(defenceCredit) });
            
            // 2. Make Post Private
            transaction.update(postRef, { isPrivate: true });
            
            // 3. Send notification to original author
            const notificationRef = doc(collection(db, `users/${authorId}/notifications`));
            transaction.set(notificationRef, {
                type: 'postMadePrivate',
                senderId: attackerId,
                senderName: user.name,
                senderPhotoURL: user.photoURL || '',
                postId: post.id,
                timestamp: Timestamp.now(),
                read: false,
            });
            transaction.update(authorRef, { unreadNotifications: true });
        });
        
        toast({ title: 'Success!', description: 'The post has been deleted.' });

      } catch (error: any) {
        console.error("Error during offence action:", error);
        toast({ variant: 'destructive', title: 'Action Failed', description: error.message || 'An unexpected error occurred.' });
      }
    };
    
    const handleMakePostPublic = async (postId: string, newDefenceCredit: number) => {
        if (!db || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', user.uid);
                const postRef = doc(db, 'posts', postId);

                const [userDoc, postDoc] = await Promise.all([
                    transaction.get(userRef),
                    transaction.get(postRef)
                ]);

                if (!userDoc.exists() || !postDoc.exists()) {
                    throw new Error("User or Post not found.");
                }
                
                if (postDoc.data().authorId !== user.uid) {
                    throw new Error("You are not the author of this post.");
                }

                const userCredits = userDoc.data().credits || 0;
                if (userCredits < newDefenceCredit) {
                    throw new Error("You do not have enough credits.");
                }

                // Deduct credits from user
                transaction.update(userRef, { credits: increment(-newDefenceCredit) });
                // Add credits to post and make public
                transaction.update(postRef, {
                    defenceCredit: increment(newDefenceCredit),
                    isPrivate: false
                });

                // Optional: Notify followers that the post is public again
                const notificationRef = doc(collection(db, `users/${user.uid}/notifications`));
                 transaction.set(notificationRef, {
                    type: 'postMadePublic',
                    senderId: user.uid,
                    senderName: 'System',
                    senderPhotoURL: '',
                    postId: postId,
                    timestamp: Timestamp.now(),
                    read: false,
                });
                transaction.update(userRef, { unreadNotifications: true });
            });

            toast({ title: 'Success!', description: 'Your post is now public again.' });

        } catch (error: any) {
            console.error("Error making post public:", error);
            toast({ variant: 'destructive', title: 'Action Failed', description: error.message || 'An unexpected error occurred.' });
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
                onDeletePost={handleDeletePost}
                onMakePostPrivate={handleMakePostPrivate}
                onMakePostPublic={handleMakePostPublic}
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
