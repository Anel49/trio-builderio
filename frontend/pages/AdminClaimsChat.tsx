import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COMPANY_NAME } from "@/lib/constants";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import {
  Search,
  Send,
  Menu,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { usePageTitle } from "@/hooks/use-page-title";
import { Footer } from "@/components/Footer";
import { SupportMessage } from "@/components/ui/support-message";

interface ClaimThread {
  threadId: number;
  claimId: number;
  threadTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId?: number;
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

interface ClaimData {
  thread: {
    id: number;
    title: string;
  };
  claim: {
    id: number;
    claimNumber: string;
    status: string;
    claimType: string;
    claimDetails: string;
    incidentDate: string;
    createdAt: string;
  };
  claimSubmitter: {
    id: number;
    name: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  order: {
    id: number;
    number: number;
    listingTitle: string;
  };
}

function formatDateForClaim(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const tz = date
    .toLocaleTimeString("en-US", { timeZoneName: "short" })
    .split(" ")
    .pop();

  return `${month} ${day}, ${year}, ${time} ${tz}`;
}

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateJoined(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminClaimsChat() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(() => {
    const threadIdFromUrl = searchParams.get("threadId");
    return threadIdFromUrl ? parseInt(threadIdFromUrl) : null;
  });

  const [claimThreads, setClaimThreads] = useState<ClaimThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [claimDetailsLoading, setClaimDetailsLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<ClaimData | null>(null);

  // Mobile sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Message cache: Map<threadId, Message[]>
  const [messagesCache, setMessagesCache] = useState<Map<number, Message[]>>(
    new Map(),
  );

  // Refs
  const messagesScrollRef = React.useRef<HTMLDivElement>(null);

  usePageTitle();

  // Verify user is admin/moderator
  useEffect(() => {
    if (!user) return;
    if (!user.admin && !user.moderator) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch claim threads on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchThreads = async () => {
      setThreadsLoading(true);
      setError(null);
      try {
        const response = await apiFetch(
          `/admin/claims/${user.id}/threads`,
        );
        const data = await response.json();
        if (data.ok) {
          const threads = data.conversations || [];
          setClaimThreads(threads);

          // Auto-select first thread if none is selected from URL
          if (
            threads.length > 0 &&
            !selectedThreadId
          ) {
            setSelectedThreadId(threads[0].threadId);
          }
        } else {
          setError(data.error || "Failed to load claims");
        }
      } catch (err) {
        console.error("Failed to fetch claim threads:", err);
        setError("Failed to load claims");
      } finally {
        setThreadsLoading(false);
      }
    };

    fetchThreads();
  }, [user?.id]);

  // Fetch messages when selectedThreadId changes
  useEffect(() => {
    if (!selectedThreadId || !user?.id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      // Check cache first
      const cachedMessages = messagesCache.get(selectedThreadId);
      if (cachedMessages) {
        setMessages(cachedMessages);
        return;
      }

      setMessagesLoading(true);
      try {
        const response = await apiFetch(
          `/messages/${user.id}/${selectedThreadId}`,
        );
        const data = await response.json();
        if (data.ok) {
          const fetchedMessages = data.messages || [];
          setMessages(fetchedMessages);
          setMessagesCache((prev) =>
            new Map(prev).set(selectedThreadId, fetchedMessages),
          );
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedThreadId, user?.id]);

  // Fetch claim details when selectedThreadId changes
  useEffect(() => {
    if (!selectedThreadId) {
      setClaimData(null);
      return;
    }

    // Find the claim ID from the selected thread
    const selectedThread = claimThreads.find(
      (t) => t.threadId === selectedThreadId,
    );
    if (!selectedThread || !selectedThread.claimId) {
      setClaimData(null);
      return;
    }

    const fetchClaimData = async () => {
      setClaimDetailsLoading(true);
      try {
        const response = await apiFetch(
          `/admin/claims/${selectedThread.claimId}/thread-data`,
        );
        const data = await response.json();
        if (data.ok) {
          setClaimData(data);
        } else {
          console.error("Failed to load claim details:", data.error);
        }
      } catch (err) {
        console.error("Failed to fetch claim data:", err);
      } finally {
        setClaimDetailsLoading(false);
      }
    };

    fetchClaimData();
  }, [selectedThreadId, claimThreads]);

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

  // Mobile sidebar toggle
  const toggleLeftSidebar = () => {
    if (rightSidebarOpen) setRightSidebarOpen(false);
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const toggleRightSidebar = () => {
    if (leftSidebarOpen) setLeftSidebarOpen(false);
    setRightSidebarOpen(!rightSidebarOpen);
  };

  // Handle send message - always as user 2 (Support)
  const handleSendMessage = async () => {
    if (
      !messageInput.trim() ||
      !user?.id ||
      !selectedThreadId ||
      !claimData?.claimSubmitter.id
    ) {
      return;
    }

    try {
      const response = await apiFetch("/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          senderId: 2, // Always send as Support
          toId: claimData.claimSubmitter.id,
          body: messageInput,
          messageThreadId: selectedThreadId,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        const updatedMessages = [...messages, data.message];
        setMessages(updatedMessages);
        setMessageInput("");
        // Update cache
        setMessagesCache((prev) =>
          new Map(prev).set(selectedThreadId, updatedMessages),
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Filter threads by search
  const filteredThreads = claimThreads.filter(
    (thread) =>
      thread.threadTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (thread.lastMessage &&
        thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Not authenticated check
  if (!user) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-lg">
                  You must be logged in to access this page.
                </p>
                <Button onClick={() => navigate("/")} className="w-full">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Not authorized check
  if (!user.admin && !user.moderator) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-lg">
                  You do not have permission to access this page.
                </p>
                <Button onClick={() => navigate("/")} className="w-full">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-accent/30 dark:bg-gray-800/30">
      <Header />

      {/* Main Claims Chat Interface */}
      <div className="h-[calc(100vh-4rem)]">
        {/* Overlay for mobile/tablet when sidebars are open */}
        {(leftSidebarOpen || rightSidebarOpen) && (
          <div
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-[70] md:hidden"
            onClick={() => {
              setLeftSidebarOpen(false);
              setRightSidebarOpen(false);
            }}
          />
        )}

        <div className="h-full flex overflow-hidden shadow-sm relative">
          {/* Mobile Edge Tab Strips */}
          <div
            onClick={toggleLeftSidebar}
            className="group fixed left-0 top-1/2 -translate-y-1/2 h-32 w-12 z-[60] md:hidden flex items-center justify-start cursor-pointer"
          >
            <div className="flex h-full w-3 items-center justify-center rounded-r-md bg-primary shadow-lg transition-colors group-hover:bg-primary/80">
              <div className="h-8 w-1 rounded-full bg-white"></div>
            </div>
          </div>

          <div
            onClick={toggleRightSidebar}
            className="group fixed right-0 top-1/2 -translate-y-1/2 h-32 w-12 z-[60] md:hidden flex items-center justify-end cursor-pointer"
          >
            <div className="flex h-full w-3 items-center justify-center rounded-l-md bg-primary shadow-lg transition-colors group-hover:bg-primary/80">
              <div className="h-8 w-1 rounded-full bg-white"></div>
            </div>
          </div>

          {/* Left Sidebar - Claims List */}
          <div
            className={`overflow-hidden transition-transform duration-300 ease-in-out ${"absolute left-0 top-0 h-full w-80 z-[80] bg-background md:relative md:w-1/4 md:bg-muted/30"} ${
              leftSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Close Button */}
            <div className="flex justify-between items-center p-4 border-b border-border md:hidden">
              <h3 className="font-semibold">Claims</h3>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-accent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 md:pt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search claims..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Claims List */}
            <ScrollArea className="h-full [&>div]:block [&>div>div]:block">
              {error && (
                <div className="p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
              {threadsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading claims...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? "No claims match your search" : "No claims yet"}
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <div
                    key={thread.threadId}
                    onClick={() => {
                      setSelectedThreadId(thread.threadId);
                      setLeftSidebarOpen(false);
                    }}
                    className={`p-2 ml-4 mr-4 my-0 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${
                      selectedThreadId === thread.threadId ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <div className="relative flex shrink-0 overflow-hidden rounded-full bg-muted aspect-square h-full w-full">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium leading-none">
                            {thread.threadTitle.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 w-0">
                        <div className="font-semibold text-sm truncate text-left w-full">
                          {thread.threadTitle}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {thread.lastMessage ? (
                            <>
                              {thread.lastMessageSenderId === 2
                                ? "Support: "
                                : "User: "}
                              {thread.lastMessage}
                            </>
                          ) : (
                            "No messages yet"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div
            className={`flex-1 flex flex-col bg-background transition-all duration-300 relative z-0 ${
              leftSidebarOpen || rightSidebarOpen
                ? "md:flex-1"
                : "w-full md:flex-1"
            }`}
            onClick={() => {
              if (leftSidebarOpen) setLeftSidebarOpen(false);
              if (rightSidebarOpen) setRightSidebarOpen(false);
            }}
          >
            {/* Chat Messages */}
            <ScrollArea
              ref={messagesScrollRef}
              className="flex-1 px-4 [&>div>div]:md:block [&>div>div]:hidden"
            >
              {claimDetailsLoading ? (
                <div className="flex items-center justify-center h-full pt-8">
                  <div className="text-center text-muted-foreground">
                    Loading claim...
                  </div>
                </div>
              ) : !selectedThreadId || !claimData ? (
                <div className="flex items-center justify-center h-full pt-8">
                  <div className="text-center text-muted-foreground">
                    Select a claim to view details and messages
                  </div>
                </div>
              ) : messagesLoading ? (
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
                          <SupportMessage
                            text={message.body}
                            senderId={message.senderId}
                            isCurrentUser={message.isFromCurrentUser}
                          />
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

            {/* Message Input */}
            {claimData && (
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Claim Details */}
          <div
            className={`transition-transform duration-300 ease-in-out ${"absolute right-0 top-0 h-full w-80 z-[80] bg-background md:relative md:w-1/5 md:bg-muted/30"} ${
              rightSidebarOpen
                ? "translate-x-0"
                : "translate-x-full md:translate-x-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {claimData && (
              <>
                {/* Mobile Close Button */}
                <div className="flex justify-between items-center p-4 border-b border-border md:hidden">
                  <h3 className="font-semibold">Claim Details</h3>
                  <button
                    onClick={() => setRightSidebarOpen(false)}
                    className="p-1 rounded-full hover:bg-accent"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <ScrollArea className="h-full">
                  <div className="p-6 pt-12 md:pt-12 space-y-6">
                    {/* Claim Submitter Info */}
                    <div className="text-center">
                      <div className="relative inline-block mb-4 leading-none h-20">
                        <div className="relative h-20 w-20">
                          <Avatar className="h-full w-full">
                            <AvatarImage
                              src={
                                claimData.claimSubmitter.avatarUrl || undefined
                              }
                              alt={claimData.claimSubmitter.name}
                            />
                            <AvatarFallback className="text-lg">
                              {claimData.claimSubmitter.name
                                .trim()
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      <p className="font-semibold text-lg mb-1">
                        {claimData.claimSubmitter.name}
                      </p>
                      <div className="mb-4">
                        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            Joined {formatDateJoined(claimData.claimSubmitter.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border"></div>

                    {/* Claim Details */}
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold">
                          Claim #{claimData.claim.claimNumber}
                        </p>
                      </div>

                      <div>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          {toTitleCase(claimData.claim.status)}
                        </p>
                      </div>

                      <div>
                        <p>
                          <span className="font-medium">Created at</span>{" "}
                          {formatDateForClaim(claimData.claim.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p>
                          <span className="font-medium">Order #{claimData.order.number}</span>
                        </p>
                      </div>

                      <div>
                        <p>
                          <span className="font-medium">Listing:</span>{" "}
                          {claimData.order.listingTitle}
                        </p>
                      </div>

                      <div>
                        <p>
                          <span className="font-medium">Claim type:</span>{" "}
                          {claimData.claim.claimType}
                        </p>
                      </div>

                      <div>
                        <p>
                          <span className="font-medium">Incident date:</span>{" "}
                          {formatDateForClaim(claimData.claim.incidentDate)}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Claim details:</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {claimData.claim.claimDetails}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
