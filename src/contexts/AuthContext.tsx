"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
export type UserRole = "admin" | "operator" | "viewer";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** true only while Firebase is resolving the initial auth state */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

/**
 * Derives a UserRole from the Firebase User object.
 * Extend this logic once you add custom claims or Firestore role docs.
 * Currently we default every authenticated user to 'admin' for the MVP.
 */
function deriveRole(user: User): UserRole {
  // Lista de correos con permisos de Administrador Global
  const adminEmails = ["fernando@travelapp.ar", "ferincola@gmail.com"];
  
  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return "admin";
  }
  
  // Por defecto, cualquier otro usuario ingresa como operator
  return "operator";
}

function toAuthUser(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    role: deriveRole(firebaseUser),
  };
}

// ---------------------------------------------------------
// Context
// ---------------------------------------------------------
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toAuthUser(firebaseUser) : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // Set a lightweight session cookie so the Edge middleware can detect auth.
    // This is NOT a secure HttpOnly cookie – for production, replace with a
    // Firebase Admin SDK session cookie set via an API route.
    document.cookie = "ta_session=1; path=/; SameSite=Lax";
    // onAuthStateChanged above will update the user state automatically
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    // Clear session cookie so middleware redirects unauthenticated requests
    document.cookie = "ta_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------
// Hook
// ---------------------------------------------------------
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
