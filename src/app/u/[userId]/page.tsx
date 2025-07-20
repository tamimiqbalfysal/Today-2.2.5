'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot, runTransaction, arrayUnion, arrayRemove, Timestamp, updateDoc, addDoc, getDocs, orderBy } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import type { User, Post } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from "@/hooks/use-toast";
import { ProfileCard } from '@/components/fintrack/overview';
import { Skeleton } from '@/components/ui/skeleton';
import { PostFeed } from '@/components/fintrack/recent-transactions';
import { deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from "firebase/storage";


function UserProfileSkeleton() {
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

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const userId = params.userId as string;

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isFollowing = currentUser?.following?.includes(userId) ?? false;
  
  useEffect(() => {
    if (!userId || !db) {
      setIsLoading(false);
      return;
    }
    
    if (currentUser?.uid === userId) {
      router.replace('/profile');
      return;
    }

    setIsLoading(true);

    const userDocRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as User);
      } else {
        toast({
          variant: 'destructive',
          title: 'User not found',
        });
        setUserProfile(null);
      }
    }, (error) => {
        console.error("Error fetching user profile:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load user profile.'
        });
    });


    const postsQuery = query(collection(db, 'posts'), where("authorId", "==", userId));
    const unsubscribePosts = onSnapshot(postsQuery,
      async (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        fetchedPosts.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
        setPosts(fetchedPosts);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching user posts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load user's posts.",
        });
        setIsLoading(false);
      }
    );

    return () => {
        unsubscribeUser();
        unsubscribePosts();
    };
  }, [userId, currentUser, router, toast]);

  const handleFollowToggle = async () => {
    if (!currentUser || !userProfile || !db) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to follow users."
        });
        return;
    }

    const currentUserRef = doc(db, "users", currentUser.uid);
    const targetUserRef = doc(db, "users", userProfile.uid);

    try {
        await runTransaction(db, async (transaction) => {
            if (isFollowing) {
                // Unfollow
                transaction.update(currentUserRef, { following: arrayRemove(userProfile.uid) });
                transaction.update(targetUserRef, { followers: arrayRemove(currentUser.uid) });
            } else {
                // Follow
                transaction.update(currentUserRef, { following: arrayUnion(userProfile.uid) });
                transaction.update(targetUserRef, { followers: arrayUnion(currentUser.uid) });
            }
        });
        toast({
            title: isFollowing ? "Unfollowed" : "Followed",
            description: `You are no longer following ${userProfile.name}.`
        })
    } catch (error) {
        console.error("Error toggling follow:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Could not ${isFollowing ? 'unfollow' : 'follow'} the user.`
        });
    }
  };


  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (!userProfile) {
    return (
        <div className="flex flex-col h-screen">
          <main className="flex-1 flex items-center justify-center">
            <p>User not found.</p>
          </main>
        </div>
    );
  }

  const handleLikePost = async (postId: string, authorId: string) => {
      if (!currentUser || !db) return;
      const postRef = doc(db, 'posts', postId);
      const likerId = currentUser.uid;

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
                          senderName: currentUser.name,
                          senderPhotoURL: currentUser.photoURL || '',
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
      if (!currentUser || !db || !commentText.trim()) return;

      const postRef = doc(db, 'posts', postId);
      const newComment = {
          id: doc(collection(db, 'dummy')).id,
          authorId: currentUser.uid,
          authorName: currentUser.name,
          authorPhotoURL: currentUser.photoURL || '',
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
    if (!currentUser || !db) return;
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: currentUser.uid,
        authorName: currentUser.name,
        authorPhotoURL: currentUser.photoURL,
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
    const postToDelete = posts.find(p => p.id === postId);
    if (!db || !storage || !currentUser || postToDelete?.authorId !== currentUser.uid) {
        toast({ variant: 'destructive', title: 'Error', description: 'You cannot delete this post.' });
        return;
    }

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
            <ProfileCard 
              user={userProfile} 
              isOwnProfile={false}
              isFollowing={isFollowing}
              onFollowToggle={handleFollowToggle}
            />
          </div>
          <div className="mt-8 space-y-6">
            <PostFeed
                posts={posts}
                currentUser={currentUser}
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
