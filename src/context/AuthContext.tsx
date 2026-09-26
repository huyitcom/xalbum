import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../utils/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  role?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isVip: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch or link profile from the existing 'users' collection in Firestore
  const fetchProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      // 1. Try finding by document ID (matching uid)
      const docRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email || '',
          displayName: data.displayName || firebaseUser.displayName,
          photoURL: data.photoURL || firebaseUser.photoURL,
          role: data.role || 'user',
          createdAt: data.createdAt,
        });
        return;
      }

      // 2. If not found by doc id, try matching by email in case the document ID is different
      if (firebaseUser.email) {
        const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const matchedDoc = qSnap.docs[0];
          const data = matchedDoc.data() as UserProfile;
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: data.displayName || firebaseUser.displayName,
            photoURL: data.photoURL || firebaseUser.photoURL,
            role: data.role || 'user',
            createdAt: data.createdAt,
          });
          return;
        }
      }

      // 3. If new user without existing profile, create a default profile
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Người dùng',
        photoURL: firebaseUser.photoURL || null,
        role: 'user', // Default role; admin can update to 'vip' in Firebase Console
        createdAt: serverTimestamp(),
      };

      await setDoc(docRef, newProfile);
      setUserProfile(newProfile);
    } catch (err) {
      console.warn('Could not read user profile from Firestore:', err);
      // Fallback with basic user info
      setUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'user',
      });
    }
  }, []);

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await fetchProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        await fetchProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        if (name && name.trim()) {
          await updateProfile(res.user, { displayName: name.trim() });
        }
        await fetchProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  // Determine VIP status (case-insensitive check for 'vip')
  const isVip = Boolean(
    userProfile?.role && userProfile.role.trim().toLowerCase() === 'vip'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isVip,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
