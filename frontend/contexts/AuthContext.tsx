import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status");
      if (!response.ok) {
        console.error("Auth status check failed with status:", response.status);
        setAuthenticated(false);
        return;
      }
      const data = await response.json();
      setAuthenticated(data.authenticated === true);
    } catch (error) {
      console.error("Failed to check auth status:", error);
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
        setAuthenticated(true);
        return true;
      } else {
        setAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Login failed:", error);
      setAuthenticated(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, logout }}>
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
