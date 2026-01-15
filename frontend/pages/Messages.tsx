import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoginModal } from "@/components/ui/login-modal";
import { ReportUserModal } from "@/components/ui/report-user-modal";
import { COMPANY_NAME } from "@/lib/constants";
import Header from "@/components/Header";
import { colors } from "@/lib/colors";
import { SignUpModal } from "@/components/ui/signup-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Send,
  Menu,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  Star,
  Calendar,
  Shield,
  MessageCircleOff,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { usePageTitle } from "@/hooks/use-page-title";
import { useBlockStatus } from "@/hooks/useBlockStatus";
import { Footer } from "@/components/Footer";
import { LinkifiedMessage } from "@/components/ui/linkified-message";
import { SupportMessage } from "@/components/ui/support-message";
import { formatLocalDateTime } from "@/lib/timezone-utils";

interface Conversation {
  threadId: number;
  otherUserId: number;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId?: number;
  threadTitle?: string;
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

export default function Messages() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReportUserModalOpen, setIsReportUserModalOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(
    () => {
      const threadIdFromUrl = searchParams.get("threadId");
      return threadIdFromUrl ? parseInt(threadIdFromUrl) : null;
    },
  );
  const [selectedUserId, setSelectedUserId] = useState<number | null>(() => {
    const userIdFromUrl = searchParams.get("userId");
    return userIdFromUrl ? parseInt(userIdFromUrl) : null;
  });

  const { isBlocked, refetch: refetchBlockStatus } =
    useBlockStatus(selectedUserId);

  // Track if userId or threadId came from URL params
  const userIdFromUrl = searchParams.get("userId");
  const threadIdFromUrl = searchParams.get("threadId");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSafetyBannerExpanded, setIsSafetyBannerExpanded] = useState(false);
  // Mobile sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  // Settings popover and toggle states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdatingOpenDms, setIsUpdatingOpenDms] = useState(false);
  const [isBlockingUser, setIsBlockingUser] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedUserName, setBlockedUserName] = useState<string | null>(null);
  const [isUnblockedModalOpen, setIsUnblockedModalOpen] = useState(false);
  const [unblockedUserName, setUnblockedUserName] = useState<string | null>(
    null,
  );

  // Real data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [temporaryConversation, setTemporaryConversation] =
    useState<Conversation | null>(null);
  // Message cache: Map<threadId, Message[]>
  const [messagesCache, setMessagesCache] = useState<Map<number, Message[]>>(
    new Map(),
  );
  // Track if a thread was not found
  const [selectedThreadNotFound, setSelectedThreadNotFound] = useState(false);
  // User reviews and rating
  const [selectedUserReviews, setSelectedUserReviews] = useState<any[]>([]);
  const [selectedUserCreatedAt, setSelectedUserCreatedAt] = useState<
    string | null
  >(null);
  // User badges
  const [selectedUserBadges, setSelectedUserBadges] = useState({
    foundingSupporter: false,
    topReferrer: false,
    ambassador: false,
  });

  // State for ghost conversation (when userId is provided but threadId doesn't exist)
  const [ghostUserData, setGhostUserData] = useState<{
    id: number;
    name: string;
    avatarUrl: string | null;
    username: string | null;
  } | null>(null);

  // State for hovered conversation
  const [hoveredThreadId, setHoveredThreadId] = useState<number | null>(null);
  const [isHidingThread, setIsHidingThread] = useState(false);

  // Ref for scrolling messages to bottom
  const messagesScrollRef = React.useRef<HTMLDivElement>(null);

  usePageTitle();

  // Handle open_dms toggle change
  const handleOpenDmsToggle = async (checked: boolean) => {
    setIsUpdatingOpenDms(true);
    try {
      const response = await fetch("/api/auth/me/open-dms", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ openDms: checked }),
      });

      if (response.ok) {
        await checkAuth();
      }
    } catch (error) {
      console.error("Failed to update open_dms setting:", error);
    } finally {
      setIsUpdatingOpenDms(false);
    }
  };

  // Fetch conversations when user is authenticated
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversations = async () => {
      setConversationsLoading(true);
      try {
        const response = await apiFetch(`/messages/${user.id}/conversations`);
        const data = await response.json();
        if (data.ok) {
          setConversations(data.conversations || []);
          // Set first conversation as selected if none is selected and no userId in URL
          if (
            data.conversations &&
            data.conversations.length > 0 &&
            !selectedThreadId &&
            !userIdFromUrl
          ) {
            setSelectedThreadId(data.conversations[0].threadId);
            setSelectedUserId(data.conversations[0].otherUserId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setConversationsLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id]);

  // Handle temporary conversation creation when threadId is in URL params
  useEffect(() => {
    if (!user?.id || !selectedThreadId) {
      setTemporaryConversation(null);
      setSelectedThreadNotFound(false);
      return;
    }

    // Check if selectedThreadId already exists in conversations
    const existingConversation = conversations.find(
      (c) => c.threadId === selectedThreadId,
    );

    if (existingConversation) {
      // Thread is in existing conversations, no need for temporary
      setTemporaryConversation(null);
      setSelectedThreadNotFound(false);
      setSelectedUserId(existingConversation.otherUserId);
      return;
    }

    // Thread not found in existing conversations
    setTemporaryConversation(null);
    setSelectedThreadNotFound(true);
  }, [selectedThreadId, conversations, user?.id]);

  // Handle ghost conversation (userId provided without threadId)
  useEffect(() => {
    // Only show ghost conversation if userId is in URL params but threadId is not
    if (!userIdFromUrl || threadIdFromUrl) {
      setGhostUserData(null);
      return;
    }

    // If userId is in URL without threadId, show ghost conversation
    const fetchGhostUserData = async () => {
      try {
        const response = await apiFetch(`/users/${selectedUserId}`);
        const data = await response.json();
        if (data.ok && data.user) {
          setGhostUserData({
            id: data.user.id,
            name: data.user.name || "Unknown",
            avatarUrl: data.user.avatarUrl || null,
            username: data.user.username || null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch ghost user data:", error);
      }
    };

    if (selectedUserId) {
      fetchGhostUserData();
    }
  }, [selectedUserId, userIdFromUrl, threadIdFromUrl]);

  // Fetch user reviews and details when selected user changes
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchUserDetails = async () => {
      try {
        const response = await apiFetch(`/users/${selectedUserId}`);
        const data = await response.json();
        if (data.ok && data.user) {
          setSelectedUserCreatedAt(data.user.createdAt);
          const founding = Boolean(
            data.user.foundingSupporter ?? data.user.founding_supporter,
          );
          const referrer = Boolean(
            data.user.topReferrer ?? data.user.top_referrer,
          );
          const ambassador = Boolean(data.user.ambassador);
          setSelectedUserBadges({
            foundingSupporter: founding,
            topReferrer: referrer,
            ambassador,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    };

    const fetchUserReviews = async () => {
      try {
        const response = await apiFetch(`/users/${selectedUserId}/reviews`);
        const data = await response.json();
        if (data.ok) {
          setSelectedUserReviews(data.reviews || []);
        }
      } catch (error) {
        console.error("Failed to fetch user reviews:", error);
      }
    };

    fetchUserDetails();
    fetchUserReviews();
  }, [selectedUserId]);

  // Fetch messages when selected thread changes
  useEffect(() => {
    if (!user?.id || !selectedThreadId) return;

    // Check if messages are cached
    const cachedMessages = messagesCache.get(selectedThreadId);
    if (cachedMessages) {
      setMessages(cachedMessages);
      setSelectedThreadNotFound(false);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const response = await apiFetch(
          `/messages/${user.id}/${selectedThreadId}`,
        );
        const data = await response.json();
        if (data.ok) {
          const fetchedMessages = data.messages || [];
          setMessages(fetchedMessages);
          setSelectedThreadNotFound(false);
          // Cache the messages
          setMessagesCache((prevCache) =>
            new Map(prevCache).set(selectedThreadId, fetchedMessages),
          );
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id, selectedThreadId, messagesCache]);

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

  // Mobile sidebar toggle functions
  const toggleLeftSidebar = () => {
    if (rightSidebarOpen) setRightSidebarOpen(false);
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const toggleRightSidebar = () => {
    if (leftSidebarOpen) setLeftSidebarOpen(false);
    setRightSidebarOpen(!rightSidebarOpen);
  };

  // Support Chat (pinned)
  const SUPPORT_CHAT_ID = 0;
  const supportChat = {
    id: SUPPORT_CHAT_ID,
    name: `${COMPANY_NAME} Support`,
    avatar: "",
    lastMessage: "Open a claim or get help",
    lastActivity: "Online",
    isOnline: true,
  };

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (selectedUserReviews.length === 0) return "0.0";
    const total = selectedUserReviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0,
    );
    return (total / selectedUserReviews.length).toFixed(1);
  };

  // Format date joined
  const formatDateJoined = () => {
    if (!selectedUserCreatedAt) return "—";
    try {
      const date = new Date(selectedUserCreatedAt);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Get avatar outline class based on badges
  const getAvatarOutlineClass = () => {
    if (selectedUserBadges.foundingSupporter) return "ring-4 ring-sky-400";
    if (selectedUserBadges.topReferrer) return "ring-4 ring-purple-500";
    if (selectedUserBadges.ambassador) return "ring-4 ring-[rgb(168,64,64)]";
    return "";
  };

  // Get earned badges array
  const getEarnedBadges = () => {
    const arr: { key: string; title: string; color: string }[] = [];
    if (selectedUserBadges.foundingSupporter)
      arr.push({
        key: "founding",
        title: "Founding Supporter",
        color: "#38bdf8",
      });
    if (selectedUserBadges.topReferrer)
      arr.push({ key: "referrer", title: "Top Referrer", color: "#7c3aed" });
    if (selectedUserBadges.ambassador)
      arr.push({
        key: "ambassador",
        title: "Ambassador",
        color: "rgb(168 64 64)",
      });
    return arr;
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user?.id || !selectedUserId) return;

    try {
      const messageBody: any = {
        senderId: user.id,
        toId: selectedUserId,
        body: messageInput,
      };

      // Only include messageThreadId if we have one (not a ghost conversation)
      if (selectedThreadId) {
        messageBody.messageThreadId = selectedThreadId;
      }

      const response = await apiFetch("/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(messageBody),
      });

      const data = await response.json();
      if (data.ok) {
        const updatedMessages = [...messages, data.message];
        setMessages(updatedMessages);
        setMessageInput("");

        // If this was a ghost conversation, update the threadId
        const newThreadId = selectedThreadId || data.message.messageThreadId;
        if (newThreadId && !selectedThreadId) {
          setSelectedThreadId(newThreadId);
        }

        // Update cache with the new message
        setMessagesCache((prevCache) =>
          new Map(prevCache).set(newThreadId, updatedMessages),
        );

        // Refresh conversations to update last message
        if (user?.id) {
          const convoResponse = await apiFetch(
            `/messages/${user.id}/conversations`,
          );
          const convoData = await convoResponse.json();
          if (convoData.ok) {
            setConversations(convoData.conversations || []);
            setGhostUserData(null);
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle hide thread
  const handleHideThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.id) return;

    setIsHidingThread(true);
    try {
      const response = await apiFetch("/messages/thread/hide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          threadId: threadId,
          isHidden: true,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        // Remove the thread from the conversations list
        setConversations(conversations.filter((c) => c.threadId !== threadId));

        // If the hidden thread was selected, deselect it
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
          setSelectedUserId(null);
        }
      }
    } catch (error) {
      console.error("Failed to hide thread:", error);
    } finally {
      setIsHidingThread(false);
    }
  };

  // Handle block/unblock user
  const handleBlockUser = async () => {
    if (!user?.id || !selectedUserId) return;

    setIsBlockingUser(true);
    try {
      const endpoint = isBlocked ? "blocks/remove" : "blocks/create";
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: selectedUserId }),
      });

      const data = await response.json();
      if (data.ok) {
        if (!isBlocked) {
          // Show blocked modal when blocking
          setBlockedUserName(selectedChat?.name || "User");
          setIsBlockedModalOpen(true);
        } else {
          // Show unblocked modal when unblocking
          setUnblockedUserName(selectedChat?.name || "User");
          setIsUnblockedModalOpen(true);
        }
        // Refetch block status to update UI
        await refetchBlockStatus();
      } else {
        alert(
          "Failed to update block status: " + (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Failed to update block status:", error);
      alert("Failed to update block status");
    } finally {
      setIsBlockingUser(false);
    }
  };

  // Create ghost conversation from ghostUserData for display
  const ghostConversation: Conversation | null = ghostUserData
    ? {
        threadId: -1, // Use -1 as a placeholder for ghost threads
        otherUserId: ghostUserData.id,
        name: ghostUserData.name,
        avatarUrl: ghostUserData.avatarUrl,
        username: ghostUserData.username,
        lastMessage: "",
        lastMessageTime: new Date().toISOString(),
      }
    : null;

  // Combine regular conversations with ghost conversation or temporary conversation
  const allConversations = ghostConversation
    ? [
        ghostConversation,
        ...conversations.filter((c) => c.otherUserId !== ghostUserData?.id),
      ]
    : temporaryConversation
      ? [
          temporaryConversation,
          ...conversations.filter(
            (c) => c.threadId !== temporaryConversation.threadId,
          ),
        ]
      : conversations;

  const selectedChat = ghostConversation
    ? ghostConversation
    : allConversations.find((c) => c.threadId === selectedThreadId);

  const filteredConversations = allConversations.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage &&
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const downloadChat = () => {
    if (!selectedChat) return;

    const chatHistory = messages
      .map((msg) => {
        const date = new Date(msg.createdAt).toLocaleTimeString();
        const senderName = msg.isFromCurrentUser ? "You" : selectedChat.name;
        return `[${date}] ${senderName}: ${msg.body}`;
      })
      .join("\n");

    const content = `Chat with ${selectedChat.name}\n${"=".repeat(30)}\n\n${chatHistory}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${selectedChat.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-accent/30 dark:bg-gray-800/30">
      <Header />

      {/* Main Messages Interface */}
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
          {/* Mobile Edge Tab Strips - Only visible on tablet/mobile */}
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

          {/* Left Sidebar - Chat List */}
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
              <h3 className="font-semibold">Conversations</h3>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-accent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar and Settings */}
            <div className="p-4 md:pt-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  title="Show hidden threads"
                >
                  <MessageCircleOff className="h-4 w-4" />
                </Button>
                {user && (
                  <Popover
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        disabled={isUpdatingOpenDms}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-64">
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold">
                          Message Settings
                        </h3>
                        <div className="flex items-center justify-between space-x-2">
                          <div className="flex flex-col space-y-1 flex-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Enable open messages
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Allow renters to message you without submitting a
                              request
                            </p>
                          </div>
                          <Switch
                            checked={user.openDms}
                            onCheckedChange={handleOpenDmsToggle}
                            disabled={isUpdatingOpenDms}
                            className={user.openDms ? "bg-green-500" : ""}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="h-full">
              {conversationsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                filteredConversations.map((chat) => (
                  <div
                    key={chat.threadId}
                    onClick={() => {
                      setSelectedThreadId(chat.threadId);
                      setSelectedUserId(chat.otherUserId);
                      setLeftSidebarOpen(false);
                    }}
                    className={`p-2 ml-4 mr-4 my-0 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${
                      selectedThreadId === chat.threadId ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative h-12 w-12">
                        <Avatar
                          className={`h-full w-full ${
                            selectedThreadId === chat.threadId
                              ? "!bg-slate-400 dark:!bg-slate-600"
                              : ""
                          }`}
                        >
                          <AvatarImage
                            src={chat.avatarUrl || undefined}
                            alt={chat.name}
                          />
                          <AvatarFallback>
                            {chat.name
                              .trim()
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {chat.otherUserId === 2 && (
                          <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border border-white dark:border-slate-950">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-label="LendIt Support verified"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 w-0">
                        <div className="font-semibold text-sm truncate text-left w-full">
                          {chat.name.trim()}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {chat.lastMessage ? (
                            <>
                              {chat.lastMessageSenderId === user?.id
                                ? "You: "
                                : "Them: "}
                              {chat.lastMessage}
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
            {/* Safety Banner (temporarily disabled) */}
            {false && selectedUserId && (
              <div className={colors.ui.safetyBanner}>
                <div className="p-4">
                  <div className={`text-sm ${colors.status.error.textLight}`}>
                    <strong>Safety Notice:</strong> Avoid meeting at night or at
                    private locations. It is safest to meet during the day in
                    well-lit, public locations such as active parking lots,
                    public libraries, or outside police stations. Do not bring
                    additional people unless it is agreed upon by all parties.
                  </div>

                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setIsSafetyBannerExpanded(!isSafetyBannerExpanded)
                      }
                      className={`flex items-center text-xs ${colors.status.error.textMuted} ${colors.status.error.hover} transition-colors`}
                    >
                      {isSafetyBannerExpanded ? "Hide" : "Show"} privacy
                      guidelines
                      {isSafetyBannerExpanded ? (
                        <ChevronUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ChevronDown className="ml-1 h-3 w-3" />
                      )}
                    </button>

                    {isSafetyBannerExpanded && (
                      <div
                        className={`mt-2 text-xs ${colors.status.error.textMuted} ${colors.status.error.backgroundAccent} p-3 rounded`}
                      >
                        <strong>Privacy Protection:</strong> Do not send any
                        personal or identifiable information in your messages.
                        This includes your last name, the names or information
                        of family members or friends, phone numbers, living
                        addresses, social security or passport numbers, credit
                        or debit card numbers, bank account or routing numbers,
                        medical information, work addresses or work information,
                        etc. Keep your messages relevant to the rental item, the
                        meetup location, and the time of the meetup.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
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
                    {selectedThreadNotFound
                      ? "Thread not found."
                      : "No messages yet. Start a conversation!"}
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
                          {formatLocalDateTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder={
                    isBlocked ? "Cannot message this user" : "Type a message..."
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                  disabled={!selectedUserId || isBlocked}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    !selectedUserId || !messageInput.trim() || isBlocked
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Chat Details */}
          <div
            className={`transition-transform duration-300 ease-in-out ${"absolute right-0 top-0 h-full w-80 z-[80] bg-background md:relative md:w-1/5 md:bg-muted/30"} ${
              rightSidebarOpen
                ? "translate-x-0"
                : "translate-x-full md:translate-x-0"
            } ${supportModalOpen ? "hidden lg:block" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedChat && (
              <>
                {/* Mobile Close Button */}
                <div className="flex justify-between items-center p-4 border-b border-border md:hidden">
                  <h3 className="font-semibold">Chat Details</h3>
                  <button
                    onClick={() => setRightSidebarOpen(false)}
                    className="p-1 rounded-full hover:bg-accent"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 pt-12 text-center md:pt-12">
                  <div className="relative inline-block mb-4 leading-none h-20">
                    <a
                      href={
                        selectedChat.username
                          ? `/profile/${selectedChat.username}`
                          : "#"
                      }
                      aria-label="Open profile"
                      className="inline-flex items-center justify-center rounded-full hover:opacity-80 transition-opacity h-20 w-20 p-0 leading-none"
                      onClick={(e) => {
                        // Allow default link behavior (new tab, etc.)
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                          e.preventDefault();
                          if (selectedChat.username) {
                            navigate(`/profile/${selectedChat.username}`);
                          }
                        }
                      }}
                    >
                      <div className="relative h-20 w-20">
                        <Avatar
                          className={cn(
                            "h-full w-full flex-shrink-0",
                            getAvatarOutlineClass(),
                          )}
                        >
                          <AvatarImage
                            src={selectedChat.avatarUrl || undefined}
                            alt={selectedChat.name}
                          />
                          <AvatarFallback className="text-lg">
                            {selectedChat.name
                              .trim()
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {selectedUserId === 2 && (
                          <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white dark:border-slate-950">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-label="LendIt Support verified"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </a>
                  </div>

                  <a
                    href={
                      selectedChat.username
                        ? `/profile/${selectedChat.username}`
                        : "#"
                    }
                    className="font-semibold text-lg mb-2 text-center w-full transition-colors hover:text-primary block"
                    onClick={(e) => {
                      // Allow default link behavior (new tab, etc.)
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                        e.preventDefault();
                        if (selectedChat.username) {
                          navigate(`/profile/${selectedChat.username}`);
                        }
                      }
                    }}
                  >
                    {selectedChat.name && selectedChat.name.trim()}
                  </a>

                  {/* Earned Badges */}
                  {getEarnedBadges().length > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getEarnedBadges().map((b) => (
                        <span
                          key={b.key}
                          className="inline-flex items-center"
                          title={b.title}
                          aria-label={b.title}
                        >
                          <Shield
                            className="h-[13.2px] w-[13.2px]"
                            fill="currentColor"
                            style={{ color: b.color }}
                          />
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Average Review Rating */}
                  {selectedUserId !== 2 && (
                    <div className="mb-4">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => {
                              const avgRating = parseFloat(
                                calculateAverageRating(),
                              );
                              const fullStars = Math.floor(avgRating ?? 0);
                              const hasHalfStar =
                                typeof avgRating === "number" &&
                                avgRating % 1 >= 0.5;
                              const isFullStar = i < fullStars;
                              const isHalfStar =
                                hasHalfStar && i === fullStars && i < 5;

                              if (isHalfStar) {
                                return (
                                  <div key={i} className="relative h-4 w-4">
                                    <Star className="absolute h-4 w-4 text-gray-300" />
                                    <div className="absolute h-4 w-2 overflow-hidden">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    isFullStar
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300",
                                  )}
                                />
                              );
                            })}
                          </div>
                          <span className="font-medium">
                            {calculateAverageRating()}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({selectedUserReviews.length}{" "}
                          {selectedUserReviews.length === 1
                            ? "review"
                            : "reviews"}
                          )
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Date Joined */}
                  {selectedUserId !== 2 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          Joined {formatDateJoined()}
                        </span>
                      </div>
                    </div>
                  )}

                  {user?.id &&
                    selectedUserId !== 2 &&
                    user.id !== selectedUserId && (
                      <Button
                        variant="outline"
                        className="w-full max-w-[300px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:text-white dark:border-red-600 dark:hover:text-white dark:hover:bg-red-700 dark:hover:border-red-700 mx-auto block mb-2"
                        onClick={handleBlockUser}
                        disabled={isBlockingUser}
                      >
                        {isBlockingUser
                          ? isBlocked
                            ? "Unblocking..."
                            : "Blocking..."
                          : isBlocked
                            ? "Unblock user"
                            : "Block user"}
                      </Button>
                    )}

                  {selectedUserId !== 2 && (
                    <Button
                      variant="outline"
                      className="w-full max-w-[300px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:text-white dark:border-red-600 dark:hover:text-white dark:hover:bg-red-700 dark:hover:border-red-700 mx-auto block"
                      onClick={() => setIsReportUserModalOpen(true)}
                    >
                      Report user
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onSwitchToSignUp={() => {
          setIsLoginModalOpen(false);
          setIsSignUpModalOpen(true);
        }}
      />
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onOpenChange={setIsSignUpModalOpen}
        onSwitchToLogin={() => {
          setIsSignUpModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      />
      <ReportUserModal
        isOpen={isReportUserModalOpen}
        onOpenChange={setIsReportUserModalOpen}
        userId={selectedUserId || undefined}
        userName={selectedChat?.name?.trim()}
        onUserBlocked={() => refetchBlockStatus()}
      />

      {/* Contact Support Modal */}
      <Dialog open={supportModalOpen} onOpenChange={setSupportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Do you want to open a support ticket?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSupportModalOpen(false)}
            >
              No
            </Button>
            <Button onClick={() => setSupportModalOpen(false)}>Yes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Blocked Modal */}
      <Dialog open={isBlockedModalOpen} onOpenChange={setIsBlockedModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User blocked</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {blockedUserName} has been blocked. You can no longer reserve
            listings, message, or review each other. You can unblock them at any
            time.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsBlockedModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Unblocked Modal */}
      <Dialog
        open={isUnblockedModalOpen}
        onOpenChange={setIsUnblockedModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User unblocked</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {unblockedUserName} has been unblocked. You may now reserve
            listings, message, and review each other.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsUnblockedModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
