
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, runTransaction, collection, query, orderBy, Unsubscribe, updateDoc, writeBatch, where, getDocs, deleteDoc, arrayUnion } from 'firebase/firestore';
import type { User as AppUser, Notification, Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, username: string, email: string, password: string, country: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
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

    const lowerCaseUsername = username.toLowerCase();
    const usernameDocRef = doc(db, "usernames", lowerCaseUsername);

    try {
        const usernameDoc = await getDoc(usernameDocRef);
        if (usernameDoc.exists()) {
            const error = new Error("This username is already taken. Please choose another one.");
            (error as any).code = 'auth/username-already-in-use';
            throw error;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const photoURL = `https://placehold.co/100x100.png?text=${name.charAt(0)}`;
        await updateProfile(firebaseUser, {
            displayName: name,
            photoURL: photoURL
        });

        const batch = writeBatch(db);

        const newUserDocRef = doc(db, "users", firebaseUser.uid);
        batch.set(newUserDocRef, {
            uid: firebaseUser.uid,
            name: name,
            username: lowerCaseUsername,
            email: email,
            photoURL: photoURL,
            country: country,
            redeemedGiftCodes: 0,
            redeemedThinkCodes: 0,
            credits: 0,
            unreadNotifications: false,
            followers: [], // Starts with 0 followers
            following: [], // Starts following 0 users
        });

        const newUsernameDocRef = doc(db, "usernames", lowerCaseUsername);
        batch.set(newUsernameDocRef, { uid: firebaseUser.uid });

        await batch.commit();
        
        router.push('/');

    } catch (error: any) {
        console.error("Error during signup:", error);
        if (error.code === 'auth/username-already-in-use') {
            throw error;
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
    if (!auth || !currentUser || !db || !currentUserData) {
      throw new Error("User not found or Firebase not configured.");
    }
    
    try {
      if (!currentUser.email) {
        throw new Error("Cannot re-authenticate user without an email address.");
      }
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      const batch = writeBatch(db);

      // 1. Delete all posts by the user
      const postsQuery = query(collection(db, 'posts'), where('authorId', '==', currentUser.uid));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach(postDoc => {
        batch.delete(postDoc.ref);
      });

      // 2. Delete user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      batch.delete(userDocRef);

      // 3. Delete username document
      if (currentUserData.username) {
          const usernameDocRef = doc(db, 'usernames', currentUserData.username.toLowerCase());
          batch.delete(usernameDocRef);
      }

      // Commit all Firestore deletions
      await batch.commit();
      
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


  const value = { user, loading, login, logout, signup, deleteAccount };

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
