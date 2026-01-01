import React, { useState, useCallback, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
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

interface Message {
  id: number;
  senderId: number;
  toId: number;
  body: string;
  createdAt: string;
  messageThreadId?: number;
  isFromCurrentUser: boolean;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [threadId, setThreadId] = useState<number | null>(null);
  const messagesScrollRef = React.useRef<HTMLDivElement>(null);

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
    setMessages([]);
    setThreadId(null);
  };

  const clearB = () => {
    setUserB(null);
    setSearchB("");
    setSuggestionsB([]);
    setFocusedB(true);
    setMessages([]);
    setThreadId(null);
  };

  const swapUsers = () => {
    const temp = userA;
    setUserA(userB);
    setUserB(temp);
  };

  const formatUserDisplay = (user: User) => {
    return `${user.name || "Unknown"} (${user.id}, ${user.username || "no username"})`;
  };

  // Fetch messages when both users are selected
  useEffect(() => {
    if (!userA || !userB) {
      setMessages([]);
      setThreadId(null);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      setError(null);
      try {
        // Search for or create a thread between these two users
        // For now, we'll fetch from userA's perspective
        const response = await apiFetch(
          `/messages/${userA.id}/conversations`,
        );
        const data = await response.json();

        if (data.ok && data.conversations) {
          // Find thread with userB
          const thread = data.conversations.find(
            (c: any) => c.otherUserId === userB.id,
          );

          if (thread) {
            setThreadId(thread.threadId);
            // Fetch messages for this thread
            const messagesResponse = await apiFetch(
              `/messages/${userA.id}/${thread.threadId}`,
            );
            const messagesData = await messagesResponse.json();
            if (messagesData.ok) {
              setMessages(messagesData.messages || []);
            }
          } else {
            setMessages([]);
            setThreadId(null);
          }
        }
      } catch (err: any) {
        console.error("[AdminMessages] Error fetching messages:", err);
        setError(err.message || "Failed to load messages");
        setMessages([]);
        setThreadId(null);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [userA, userB]);

  // Auto-scroll to bottom when messages load or update
  useEffect(() => {
    if (messagesScrollRef.current) {
      const scrollElement = messagesScrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 0);
      }
    }
  }, [messages]);


  return (
    <div className={combineTokens(spacing.gap.md, "flex flex-col h-[calc(100vh-8rem)]")}>
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

      {/* User Selection Area */}
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

      {/* Messages Area */}
      {!userA || !userB ? (
        <div
          className={combineTokens(
            layouts.flex.center,
            "flex-1 bg-background rounded-lg border border-border",
          )}
        >
          <p className="text-muted-foreground">
            Choose a user pair to view messages
          </p>
        </div>
      ) : (
        <div
          className={combineTokens(
            "flex flex-col bg-background rounded-lg border border-border",
            "flex-1",
          )}
        >
          {/* Messages Scroll Area */}
          <ScrollArea
            ref={messagesScrollRef}
            className="flex-1 px-4 [&>div>div]:md:block [&>div>div]:hidden"
          >
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full pt-8">
                <div className="text-center text-muted-foreground">
                  Loading messages...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full pt-8">
                <div className="text-center text-muted-foreground">
                  No messages yet
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isFromCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.isFromCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
