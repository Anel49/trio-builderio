import React, { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
import { AlertCircle, Loader2, ArrowLeftRight } from "lucide-react";
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
      setUserA(null);
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
      setUserB(null);
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
  };

  const handleSelectB = (user: User) => {
    setUserB(user);
    setSearchB("");
    setSuggestionsB([]);
  };

  const swapUsers = () => {
    const temp = userA;
    setUserA(userB);
    setUserB(temp);
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
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search user by name..."
              value={searchA}
              onChange={(e) => handleSearchA(e.target.value)}
              autoComplete="off"
            />
            {loadingA && (
              <div className="absolute right-3 top-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {suggestionsA.length > 0 && (
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
          </div>
          {userA && (
            <div className={combineTokens(spacing.margin.topSm, "text-sm")}>
              <p className={typography.weight.medium}>{userA.name}</p>
              <p className="text-xs text-muted-foreground">
                {userA.id}, {userA.username || "no username"}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={swapUsers}
          className={combineTokens(
            "p-2 rounded-md hover:bg-muted transition-colors",
            "flex items-center justify-center",
          )}
          title="Swap users"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search user by name..."
              value={searchB}
              onChange={(e) => handleSearchB(e.target.value)}
              autoComplete="off"
            />
            {loadingB && (
              <div className="absolute right-3 top-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {suggestionsB.length > 0 && (
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
          </div>
          {userB && (
            <div className={combineTokens(spacing.margin.topSm, "text-sm")}>
              <p className={typography.weight.medium}>{userB.name}</p>
              <p className="text-xs text-muted-foreground">{userB.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
