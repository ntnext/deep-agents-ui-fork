"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

interface AuthSession {
  accessToken: string;
}

interface AuthContextType {
  session: AuthSession | null;
}

const AuthContext = createContext<AuthContextType>({ session: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    // Use localStorage LANGSMITH_API_KEY for main agent
    const updateSession = () => {
      const langsmithApiKey = localStorage.getItem("LANGSMITH_API_KEY") || "";
      setSession({
        accessToken: langsmithApiKey,
      });
    };

    updateSession();

    // Listen for localStorage changes
    const handleStorageChange = () => {
      updateSession();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
