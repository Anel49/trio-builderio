import React, { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AlertCircle, Loader2, ArrowLeftRight, X } from "lucide-react";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";

interface User {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
}

export default function AdminMessages() {
  const [userA, setUserA] = useState<User | null>(null);
  const [userB, setUserB] = useState<User | null>(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [suggestionsA, setSuggestionsA] = useState<User[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<User[]>([]);
  const [focusedA, setFocusedA] = useState(false);
  const [focusedB, setFocusedB] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        search: query,
        limit: "10",
        offset: "0",
      });

      const response = await apiFetch(`/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to search users");

      const data = await response.json();
      return data.users || [];
    } catch (err: any) {
      console.error("[AdminMessages] Search error:", err);
      setError(err.message || "Failed to search users");
      return [];
    }
  }, []);

  const handleSearchA = useCallback(
    async (value: string) => {
      setSearchA(value);
      setError(null);

      if (!value.trim()) {
        setSuggestionsA([]);
        return;
      }

      setLoadingA(true);
      try {
        const results = await searchUsers(value);
        setSuggestionsA(results);
      } finally {
        setLoadingA(false);
      }
    },
    [searchUsers],
  );

  const handleSearchB = useCallback(
    async (value: string) => {
      setSearchB(value);
      setError(null);

      if (!value.trim()) {
        setSuggestionsB([]);
        return;
      }

      setLoadingB(true);
      try {
        const results = await searchUsers(value);
        setSuggestionsB(results);
      } finally {
        setLoadingB(false);
      }
    },
    [searchUsers],
  );

  const handleSelectA = (user: User) => {
    setUserA(user);
    setSearchA("");
    setSuggestionsA([]);
    setFocusedA(false);
  };

  const handleSelectB = (user: User) => {
    setUserB(user);
    setSearchB("");
    setSuggestionsB([]);
    setFocusedB(false);
  };

  const clearA = () => {
    setUserA(null);
    setSearchA("");
    setSuggestionsA([]);
    setFocusedA(true);
  };

  const clearB = () => {
    setUserB(null);
    setSearchB("");
    setSuggestionsB([]);
    setFocusedB(true);
  };

  const swapUsers = () => {
    const temp = userA;
    setUserA(userB);
    setUserB(temp);
  };

  const formatUserDisplay = (user: User) => {
    return `${user.name || "Unknown"} (${user.id}, ${user.username || "no username"})`;
  };

  return (
    <div className={combineTokens(spacing.gap.md, "flex flex-col")}>
      {error && (
        <div
          className={combineTokens(
            "bg-destructive/10 border border-destructive text-destructive",
            spacing.padding.md,
            "rounded-lg flex items-center gap-2",
          )}
        >
          <AlertCircle className={spacing.dimensions.icon.sm} />
          <span>{error}</span>
        </div>
      )}

      <div className={combineTokens(layouts.flex.center, "gap-4 py-6")}>
        {/* User A Input */}
        <div className="flex-1">
          <div className="relative">
            {userA && !focusedA ? (
              <Button
                onClick={clearA}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-3"
              >
                <span className="flex-1 truncate">
                  {formatUserDisplay(userA)}
                </span>
                <X className="h-4 w-4 ml-2 flex-shrink-0" />
              </Button>
            ) : (
              <>
                <Input
                  type="text"
                  placeholder="Search user by name..."
                  value={searchA}
                  onChange={(e) => handleSearchA(e.target.value)}
                  onFocus={() => setFocusedA(true)}
                  onBlur={() => {
                    setTimeout(() => setFocusedA(false), 200);
                  }}
                  autoComplete="off"
                />
                {loadingA && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {suggestionsA.length > 0 && focusedA && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10">
                    {suggestionsA.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectA(user)}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                      >
                        <p className={typography.weight.medium}>
                          {user.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.id}, {user.username || "no username"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={swapUsers}
          className={combineTokens(
            "p-2 rounded-md hover:bg-muted transition-colors",
            "flex items-center justify-center flex-shrink-0",
          )}
          title="Swap users"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </button>

        {/* User B Input */}
        <div className="flex-1">
          <div className="relative">
            {userB && !focusedB ? (
              <Button
                onClick={clearB}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-3"
              >
                <span className="flex-1 truncate">
                  {formatUserDisplay(userB)}
                </span>
                <X className="h-4 w-4 ml-2 flex-shrink-0" />
              </Button>
            ) : (
              <>
                <Input
                  type="text"
                  placeholder="Search user by name..."
                  value={searchB}
                  onChange={(e) => handleSearchB(e.target.value)}
                  onFocus={() => setFocusedB(true)}
                  onBlur={() => {
                    setTimeout(() => setFocusedB(false), 200);
                  }}
                  autoComplete="off"
                />
                {loadingB && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {suggestionsB.length > 0 && focusedB && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10">
                    {suggestionsB.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectB(user)}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                      >
                        <p className={typography.weight.medium}>
                          {user.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.id}, {user.username || "no username"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
