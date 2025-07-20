'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, runTransaction, arrayUnion, arrayRemove, setDoc, updateDoc, getDoc, deleteDoc, Timestamp, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from "firebase/storage";
import { useAuth } from '@/contexts/auth-context';
import type { User, Post } from '@/lib/types';
import { db, storage } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

import { ProfileCard } from '@/components/fintrack/overview';
import { Skeleton } from '@/components/ui/skeleton';
import { PostFeed } from '@/components/fintrack/recent-transactions';
import { addDoc } from 'firebase/firestore';

function ProfileSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="container mx-auto max-w-2xl p-4 flex-1">
                <div className="w-full max-w-sm mx-auto">
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="mt-8 space-y-6">
                    <Skeleton className="h-[450px] w-full" />
                    <Skeleton className="h-[450px] w-full" />
                </div>
            </main>
        </div>
    );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user || !db) {
        setIsDataLoading(false);
        return;
    }

    setIsDataLoading(true);
    const postsCol = collection(db, 'posts');
    const q = query(postsCol, where("authorId", "==", user.uid));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const fetchedPosts: Post[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Post));
        
        fetchedPosts.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
        setPosts(fetchedPosts);
        setIsDataLoading(false);
    }, (error) => {
        console.error("Error fetching user posts:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your posts.",
        });
        setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  if (authLoading || (isDataLoading && user)) {
    return <ProfileSkeleton />;
  }

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
      } catch (error) {
          console.error("Error liking post:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not update like status." });
      }
  };
  
  const handleCommentPost = async (postId: string, commentText: string) => {
      if (!user || !db || !commentText.trim()) return;

      const postRef = doc(db, 'posts', postId);
      const newComment = {
          id: doc(collection(db, 'dummy')).id,
          authorId: user.uid,
          authorName: user.name,
          authorPhotoURL: user.photoURL || '',
          content: commentText,
          timestamp: Timestamp.now(),
      };

      try {
          await updateDoc(postRef, { comments: arrayUnion(newComment) });
          toast({ title: "Comment posted!", description: "Your comment has been added successfully." });
      } catch (error) {
          console.error("Error posting comment:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not post your comment." });
          throw error;
      }
  };

  const handleSharePost = async (
    content: string,
    file: File | null,
    postType: 'original' | 'share',
    sharedPostId: string
  ) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.name,
        authorPhotoURL: user.photoURL,
        content,
        timestamp: Timestamp.now(),
        likes: [],
        comments: [],
        type: postType,
        sharedPostId,
      });
      toast({ title: 'Shared!', description: 'Post shared successfully.' });
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not share post.' });
    }
  };
  
  const handleDeletePost = async (postId: string, mediaUrl?: string) => {
    if (!db || !storage) return;
    try {
        await deleteDoc(doc(db, 'posts', postId));
        if (mediaUrl) {
            const storageRef = ref(storage, mediaUrl);
            await deleteObject(storageRef).catch(err => {
                if (err.code !== 'storage/object-not-found') throw err;
            });
        }
        toast({ title: 'Success', description: 'Post deleted successfully.' });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Could not delete post.' });
    }
  };

  return (
        <div className="flex flex-col h-screen">
          <main className="container mx-auto max-w-2xl p-4 flex-1 overflow-y-auto">
             <div className="w-full max-w-sm mx-auto">
                <ProfileCard user={user!} />
             </div>

            <div className="mt-8 space-y-6">
                <PostFeed
                    posts={posts}
                    currentUser={user}
                    onLikePost={handleLikePost}
                    onCommentPost={handleCommentPost}
                    onDeletePost={handleDeletePost}
                    onSharePost={handleSharePost}
                />
            </div>
          </main>
        </div>
  );
}
