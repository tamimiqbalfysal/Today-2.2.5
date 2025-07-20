
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider, type User as FirebaseUser } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, runTransaction, collection, query, orderBy, Unsubscribe, updateDoc, writeBatch, where, getDocs, deleteDoc, arrayUnion } from 'firebase/firestore';
import { ref, deleteObject } from "firebase/storage";
import type { User as AppUser, Notification, Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, username: string, email: string, password: string, country: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateUserPreferences: (prefs: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe | null = null;
    let unsubscribeNotifications: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeNotifications) unsubscribeNotifications();

      unsubscribe = null;
      unsubscribeNotifications = null;
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        unsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (!userDoc.exists()) {
            console.warn(`User document for UID ${firebaseUser.uid} not found.`);
            setUser(null);
            setLoading(false);
            return;
          }

          const userData = userDoc.data();
          const notificationsRef = collection(db, `users/${firebaseUser.uid}/notifications`);
          const q = query(notificationsRef, orderBy('timestamp', 'desc'));

          unsubscribeNotifications = onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            const unreadNotifications = notifications.some(n => !n.read);
            
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || userData.name,
              username: userData.username,
              email: firebaseUser.email || userData.email,
              photoURL: firebaseUser.photoURL || userData.photoURL,
              redeemedGiftCodes: userData.redeemedGiftCodes || 0,
              redeemedThinkCodes: userData.redeemedThinkCodes || 0,
              paymentCategory: userData.paymentCategory,
              paymentAccountName: userData.paymentAccountName,
              paymentAccountNumber: userData.paymentAccountNumber,
              paymentNotes: userData.paymentNotes,
              country: userData.country,
              credits: userData.credits || 0,
              notifications: notifications,
              unreadNotifications: unreadNotifications,
              followers: userData.followers || [],
              following: userData.following || [],
              defaultLocalColor: userData.defaultLocalColor,
            });
            setLoading(false);
          }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
          });

        }, (error) => {
          console.error("Error fetching user document:", error);
          if (error.code === 'permission-denied') {
            toast({
              variant: 'destructive',
              title: 'User Profile Error',
              description: "Could not load your user profile. Your security rules must allow reads on the 'users' collection.",
              duration: 10000
            });
          }
          setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [toast]);

  const login = async (email: string, password: string) => {
    if (!auth) {
        const error = new Error("Firebase is not configured. Please add your Firebase project configuration to a .env file.");
        (error as any).code = 'auth/firebase-not-configured';
        throw error;
    }
    await signInWithEmailAndPassword(auth, email, password);
    router.push('/');
  };

  const signup = async (name: string, username: string, email: string, password: string, country: string) => {
    if (!auth || !db) {
        const error = new Error("Firebase is not configured. Please add your Firebase project configuration to a .env file.");
        (error as any).code = 'auth/firebase-not-configured';
        throw error;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const photoURL = `https://placehold.co/100x100.png?text=${name.charAt(0)}`;
        await updateProfile(firebaseUser, {
            displayName: name,
            photoURL: photoURL
        });

        // Fetch all existing users to make them followers of the new user
        const usersCollectionRef = collection(db, 'users');
        const allUsersSnapshot = await getDocs(usersCollectionRef);
        const allUserIds = allUsersSnapshot.docs.map(doc => doc.id);

        const newUserDocRef = doc(db, "users", firebaseUser.uid);
        const newUsernameDocRef = doc(db, 'usernames', username.toLowerCase());

        const batch = writeBatch(db);

        // Set up the new user document
        batch.set(newUserDocRef, {
            uid: firebaseUser.uid,
            name: name,
            username: username.toLowerCase(),
            email: email,
            photoURL: photoURL,
            country: country,
            redeemedGiftCodes: 0,
            redeemedThinkCodes: 0,
            credits: 0,
            unreadNotifications: false,
            followers: allUserIds, // The new user is now followed by all existing users
            following: [], // New user starts by following no one
        });

        // Update all existing users to follow the new user
        allUsersSnapshot.docs.forEach(userDoc => {
            const userRef = doc(db, 'users', userDoc.id);
            batch.update(userRef, {
                following: arrayUnion(firebaseUser.uid)
            });
        });

        batch.set(newUsernameDocRef, { uid: firebaseUser.uid });

        await batch.commit();
        
        router.push('/');

    } catch (error: any) {
        console.error("Error during signup:", error);
        if (error.code === 'auth/email-already-in-use') {
            const customError = new Error("This email is already in use by another account.");
            (customError as any).code = 'auth/email-already-in-use';
            throw customError;
        }
        
        if (auth.currentUser && auth.currentUser.uid === (error as any)?.uid) {
            await deleteUser(auth.currentUser).catch(deleteError => {
                 console.error("CRITICAL: Failed to roll back user creation after firestore error.", deleteError);
            });
        }
        throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null);
      router.push('/login');
      return;
    };
    await signOut(auth);
    router.push('/login');
  };

  const deleteAccount = async (password: string) => {
    const currentUser = auth?.currentUser;
    const currentUserData = user;
    if (!auth || !currentUser || !db || !storage || !currentUserData) {
      throw new Error("User not found or Firebase not configured.");
    }
    
    try {
      if (!currentUser.email) {
        throw new Error("Cannot re-authenticate user without an email address.");
      }
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      const batch = writeBatch(db);

      // 1. Delete all posts by the user and their associated media
      const postsQuery = query(collection(db, 'posts'), where('authorId', '==', currentUser.uid));
      const postsSnapshot = await getDocs(postsQuery);
      
      const deletePromises: Promise<void>[] = [];
      
      postsSnapshot.forEach(postDoc => {
        batch.delete(postDoc.ref);
        const postData = postDoc.data() as Post;
        if (postData.mediaURL) {
            const mediaRef = ref(storage, postData.mediaURL);
            deletePromises.push(deleteObject(mediaRef).catch(err => {
                if (err.code !== 'storage/object-not-found') {
                    console.error("Failed to delete media file:", err);
                }
            }));
        }
      });

      // 2. Delete user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      batch.delete(userDocRef);

      // 3. Delete username document
      if (currentUserData.username) {
        const usernameDocRef = doc(db, 'usernames', currentUserData.username.toLowerCase());
        const usernameDoc = await getDoc(usernameDocRef);
        // Ensure we are only deleting the username doc if it belongs to the current user
        if (usernameDoc.exists() && usernameDoc.data().uid === currentUser.uid) {
            batch.delete(usernameDocRef);
        }
      }

      // Commit all Firestore deletions
      await batch.commit();
      
      // Wait for all media deletions to complete
      await Promise.all(deletePromises);
      
      // Finally, delete the Firebase Auth user
      await deleteUser(currentUser);
      
      router.push('/login');
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/wrong-password') {
        throw new Error("The password you entered is incorrect. Please try again.");
      }
      if (error.code === 'permission-denied') {
        throw new Error("Permission denied. Check your Firestore security rules to allow deleting posts and user documents.");
      }
      throw error;
    }
  };

  const updateUserPreferences = async (prefs: Partial<AppUser>) => {
    if (!user || !db) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update preferences.' });
        return;
    }
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, prefs);
        toast({ title: 'Success', description: 'Your preferences have been updated.' });
    } catch (error: any) {
        console.error('Error updating preferences:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your preferences.' });
    }
  };


  const value = { user, loading, login, logout, signup, deleteAccount, updateUserPreferences };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
