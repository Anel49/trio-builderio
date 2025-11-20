import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoginModal } from "@/components/ui/login-modal";
import { COMPANY_NAME } from "@/lib/constants";
import Header from "@/components/Header";
import { colors } from "@/lib/colors";
import { SignUpModal } from "@/components/ui/signup-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
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
  Paperclip,
  Menu,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { usePageTitle } from "@/hooks/use-page-title";
import { Footer } from "@/components/Footer";

interface Conversation {
  otherUserId: number;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageFromId?: number;
}

interface Message {
  id: number;
  fromId: number;
  toId: number;
  body: string;
  createdAt: string;
  isFromCurrentUser: boolean;
}

export default function Messages() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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

  // Real data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

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
          // Set first conversation as selected if none is selected
          if (
            data.conversations &&
            data.conversations.length > 0 &&
            !selectedUserId
          ) {
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

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!user?.id || !selectedUserId) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const response = await apiFetch(
          `/messages/${user.id}/${selectedUserId}`,
        );
        const data = await response.json();
        if (data.ok) {
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id, selectedUserId]);

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

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user?.id || !selectedUserId) return;

    try {
      const response = await apiFetch("/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fromId: user.id,
          toId: selectedUserId,
          body: messageInput,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setMessages([...messages, data.message]);
        setMessageInput("");
        // Refresh conversations to update last message
        if (user?.id) {
          const convoResponse = await apiFetch(
            `/messages/${user.id}/conversations`,
          );
          const convoData = await convoResponse.json();
          if (convoData.ok) {
            setConversations(convoData.conversations || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const selectedChat = conversations.find(
    (c) => c.otherUserId === selectedUserId,
  );

  const filteredConversations = conversations.filter(
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
                    key={chat.otherUserId}
                    onClick={() => {
                      setSelectedUserId(chat.otherUserId);
                      setLeftSidebarOpen(false);
                    }}
                    className={`p-2 ml-2 mr-4 my-0 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${
                      selectedUserId === chat.otherUserId ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (chat.username) {
                              navigate(`/profile/${chat.username}`);
                            }
                          }}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          aria-label="Open profile"
                        >
                          <Avatar
                            className={`h-12 w-12 ${
                              selectedUserId === chat.otherUserId
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
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </div>
                      <div className="flex-1 w-0">
                        <div className="font-semibold text-sm truncate text-left w-full">
                          {chat.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {chat.lastMessage ? (
                            <>
                              {chat.lastMessageFromId === user?.id
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
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    Loading messages...
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    No messages yet. Start a conversation!
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
                        <p className="text-sm">{message.body}</p>
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
            <div className="p-4">
              <div className="flex space-x-2">
                <Button variant="outline" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                  disabled={!selectedUserId}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedUserId || !messageInput.trim()}
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

                <div className="p-6 text-center md:pt-6">
                  <div className="relative inline-block mb-4">
                    <button
                      onClick={() => {
                        if (selectedChat.username) {
                          navigate(`/profile/${selectedChat.username}`);
                        }
                      }}
                      aria-label="Open profile"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={selectedChat.avatarUrl || undefined}
                          alt={selectedChat.name}
                        />
                        <AvatarFallback className="text-lg">
                          {selectedChat.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedChat.username) {
                        navigate(`/profile/${selectedChat.username}`);
                      }
                    }}
                    className="font-semibold text-lg mb-2 hover:underline text-center w-full transition-colors hover:text-primary"
                  >
                    {selectedChat.name}
                  </button>

                  {/* Chat Deletion Notice */}
                  <div className="border-t border-border pt-6">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Chats will be deleted after 180 days (approximately 6
                      months) of inactivity. You may download this conversation
                      in its entirety by clicking or tapping{" "}
                      <button
                        onClick={downloadChat}
                        className="underline hover:text-foreground transition-colors font-medium"
                      >
                        here
                      </button>
                      .
                    </p>
                  </div>
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

      <Footer />
    </div>
  );
}
