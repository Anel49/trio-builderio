import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  zipCode: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationCity: string | null;
  createdAt: string;
  foundingSupporter: boolean;
  topReferrer: boolean;
  ambassador: boolean;
  openDms: boolean;
  oauth: string | null;
}

interface AuthContextType {
  authenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("[AuthContext] Checking auth...");
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      console.log("[AuthContext] Auth response status:", response.status);
      if (response.ok) {
        try {
          const data = await response.json();
          console.log("[AuthContext] Auth user data:", data);
          setUser(data.user);
          setAuthenticated(true);
        } catch (e) {
          console.log("[AuthContext] Failed to parse auth response");
          setUser(null);
          setAuthenticated(false);
        }
      } else {
        console.log(
          "[AuthContext] Not authenticated (status",
          response.status + ")",
        );
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to check auth status:", error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        await checkAuth();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ authenticated, user, loading, login, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
