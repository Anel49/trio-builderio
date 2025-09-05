import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoginModal } from "@/components/ui/login-modal";
import Header from "@/components/Header";
import { colors } from "@/lib/colors";
import { SignUpModal } from "@/components/ui/signup-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
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
} from "lucide-react";

export default function Messages() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSafetyBannerExpanded, setIsSafetyBannerExpanded] = useState(false);
  // Mobile sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Mobile sidebar toggle functions
  const toggleLeftSidebar = () => {
    if (rightSidebarOpen) setRightSidebarOpen(false); // Close right if open
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const toggleRightSidebar = () => {
    if (leftSidebarOpen) setLeftSidebarOpen(false); // Close left if open
    setRightSidebarOpen(!rightSidebarOpen);
  };

  // Mock chat data
  const chats = [
    {
      id: 1,
      name: "Sarah",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612f672?w=64&h=64&fit=crop&auto=format",
      lastMessage: "The lawn mower is ready for pickup anytime after 2pm",
      lastActivity: "2 min ago",
      isOnline: true,
    },
    {
      id: 2,
      name: "Michael",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format",
      lastMessage:
        "Thanks for renting the dress! Hope it worked well for the event",
      lastActivity: "1 hour ago",
      isOnline: false,
    },
    {
      id: 3,
      name: "Alex",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&auto=format",
      lastMessage: "The tool set is in great condition, will return tomorrow",
      lastActivity: "3 hours ago",
      isOnline: true,
    },
    {
      id: 4,
      name: "Emma",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format",
      lastMessage: "Is the camera still available for this weekend?",
      lastActivity: "1 day ago",
      isOnline: false,
    },
    {
      id: 5,
      name: "David",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format",
      lastMessage: "Thanks for the power drill rental, worked perfectly!",
      lastActivity: "2 days ago",
      isOnline: true,
    },
    {
      id: 6,
      name: "Lisa",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612-1.jpg?w=64&h=64&fit=crop&auto=format",
      lastMessage: "Can I extend the rental for one more day?",
      lastActivity: "3 days ago",
      isOnline: false,
    },
    {
      id: 7,
      name: "James",
      avatar:
        "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=64&h=64&fit=crop&auto=format",
      lastMessage: "The tent setup was easy, perfect for camping trip",
      lastActivity: "4 days ago",
      isOnline: true,
    },
    {
      id: 8,
      name: "Maria",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&auto=format",
      lastMessage: "Do you have any other bike accessories available?",
      lastActivity: "5 days ago",
      isOnline: false,
    },
    {
      id: 9,
      name: "Robert",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&auto=format",
      lastMessage: "The speaker system was amazing for the party!",
      lastActivity: "1 week ago",
      isOnline: true,
    },
    {
      id: 10,
      name: "Jessica",
      avatar:
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=64&h=64&fit=crop&auto=format",
      lastMessage: "I'd like to rent the projector again next month",
      lastActivity: "1 week ago",
      isOnline: false,
    },
    {
      id: 11,
      name: "Kevin",
      avatar:
        "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=64&h=64&fit=crop&auto=format",
      lastMessage: "The kayak was in excellent condition, thank you!",
      lastActivity: "2 weeks ago",
      isOnline: true,
    },
  ];

  // Mock messages for different chats
  const getMessagesForChat = (chatId: number) => {
    const chatMessages: { [key: number]: any[] } = {
      1: [
        // Sarah Martinez - Lawn Mower
        {
          id: 1,
          senderId: 1,
          senderName: "Sarah",
          content:
            "Hi! I'm interested in renting your lawn mower this weekend.",
          timestamp: "10:30 AM",
          isCurrentUser: false,
        },
        {
          id: 2,
          senderId: "current",
          senderName: "You",
          content: "Sure! It's available. When would you like to pick it up?",
          timestamp: "10:32 AM",
          isCurrentUser: true,
        },
        {
          id: 3,
          senderId: 1,
          senderName: "Sarah",
          content: "Saturday morning would be perfect. Around 9 AM?",
          timestamp: "10:35 AM",
          isCurrentUser: false,
        },
        {
          id: 4,
          senderId: "current",
          senderName: "You",
          content:
            "That works perfectly! My address is 123 Oak Street. I'll have it ready for you.",
          timestamp: "10:37 AM",
          isCurrentUser: true,
        },
        {
          id: 5,
          senderId: 1,
          senderName: "Sarah",
          content: "The lawn mower is ready for pickup anytime after 2pm",
          timestamp: "2:15 PM",
          isCurrentUser: false,
        },
      ],
      2: [
        // Michael Chen - Dress
        {
          id: 1,
          senderId: 2,
          senderName: "Michael",
          content:
            "Hello! Is the designer dress still available for this Friday?",
          timestamp: "2:15 PM",
          isCurrentUser: false,
        },
        {
          id: 2,
          senderId: "current",
          senderName: "You",
          content: "Yes, it's available! What's the occasion?",
          timestamp: "2:18 PM",
          isCurrentUser: true,
        },
        {
          id: 3,
          senderId: 2,
          senderName: "Michael",
          content: "It's for my sister's wedding. She loved it in the photos!",
          timestamp: "2:20 PM",
          isCurrentUser: false,
        },
        {
          id: 4,
          senderId: "current",
          senderName: "You",
          content: "Perfect! It's been dry cleaned and ready to go.",
          timestamp: "2:22 PM",
          isCurrentUser: true,
        },
        {
          id: 5,
          senderId: 2,
          senderName: "Michael",
          content:
            "Thanks for renting the dress! Hope it worked well for the event",
          timestamp: "Yesterday",
          isCurrentUser: false,
        },
      ],
      3: [
        // Alex Thompson - Tool Set
        {
          id: 1,
          senderId: 3,
          senderName: "Alex",
          content: "Hi! I need to borrow some tools for a weekend project.",
          timestamp: "9:00 AM",
          isCurrentUser: false,
        },
        {
          id: 2,
          senderId: "current",
          senderName: "You",
          content: "What kind of project are you working on?",
          timestamp: "9:05 AM",
          isCurrentUser: true,
        },
        {
          id: 3,
          senderId: 3,
          senderName: "Alex",
          content:
            "Building a deck in my backyard. Need drill, saw, and measuring tools.",
          timestamp: "9:07 AM",
          isCurrentUser: false,
        },
        {
          id: 4,
          senderId: "current",
          senderName: "You",
          content: "Perfect! My tool set has everything you need.",
          timestamp: "9:10 AM",
          isCurrentUser: true,
        },
        {
          id: 5,
          senderId: 3,
          senderName: "Alex",
          content: "The tool set is in great condition, will return tomorrow",
          timestamp: "6:30 PM",
          isCurrentUser: false,
        },
      ],
      4: [
        // Emma Wilson - Camera
        {
          id: 1,
          senderId: 4,
          senderName: "Emma",
          content: "Is the camera still available for this weekend?",
          timestamp: "Yesterday",
          isCurrentUser: false,
        },
        {
          id: 2,
          senderId: "current",
          senderName: "You",
          content: "Yes! What type of photography are you planning?",
          timestamp: "Yesterday",
          isCurrentUser: true,
        },
        {
          id: 3,
          senderId: 4,
          senderName: "Emma",
          content:
            "Family portraits at the beach. I heard it takes great outdoor shots!",
          timestamp: "Yesterday",
          isCurrentUser: false,
        },
      ],
    };

    return chatMessages[chatId] || [];
  };

  const messages = getMessagesForChat(selectedChat);

  const selectedChatData = chats.find((chat) => chat.id === selectedChat);

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Add message logic here
      setMessageInput("");
    }
  };

  const downloadChat = () => {
    if (!selectedChatData) return;

    const chatHistory = messages
      .map((msg) => `[${msg.timestamp}] ${msg.senderName}: ${msg.content}`)
      .join("\n");

    const content = `Chat with ${selectedChatData.name}\n${"=".repeat(30)}\n\n${chatHistory}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${selectedChatData.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
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
        <div className="h-full flex overflow-hidden shadow-sm relative">
          {/* Mobile Edge Tab Strips - Only visible on tablet/mobile */}
          <div
            onClick={toggleLeftSidebar}
            className="fixed left-0 top-1/2 -translate-y-1/2 h-32 w-3 bg-primary hover:bg-primary/80 transition-colors z-[60] md:hidden flex items-center justify-center cursor-pointer rounded-r-md shadow-lg"
          >
            <div className="w-1 h-8 bg-white rounded-full"></div>
          </div>

          <div
            onClick={toggleRightSidebar}
            className="fixed right-0 top-1/2 -translate-y-1/2 h-32 w-3 bg-primary hover:bg-primary/80 transition-colors z-[60] md:hidden flex items-center justify-center cursor-pointer rounded-l-md shadow-lg"
          >
            <div className="w-1 h-8 bg-white rounded-full"></div>
          </div>

          {/* Left Sidebar - Chat List */}
          <div
            className={`overflow-hidden transition-transform duration-300 ease-in-out ${
              // Desktop: always visible at 25% width with 30% opacity background
              // Mobile: curtain effect - always rendered but slides in/out from left edge
              "absolute left-0 top-0 h-full w-80 z-[80] bg-background md:relative md:w-1/4 md:bg-muted/30"
            } ${
              leftSidebarOpen
                ? "translate-x-0" // Slide in to normal position
                : "-translate-x-full md:translate-x-0" // Off-screen on mobile, normal on desktop
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

            {/* Search Bar */}
            <div className="p-4 md:pt-4">
              {/* md:pt-4 to keep original padding on desktop */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="h-full">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-2 ml-2 mr-4 my-0 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${
                    selectedChat === chat.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.avatar} alt={chat.name} />
                        <AvatarFallback>
                          {chat.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    <div className="flex-1 w-0">
                      <div className="font-semibold text-sm truncate">
                        {chat.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {chat.lastMessage}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div
            className={`flex-1 flex flex-col bg-background transition-all duration-300 relative z-0 ${
              // On mobile, take full width when no sidebars are open, with padding to avoid tab icon overlap
              leftSidebarOpen || rightSidebarOpen
                ? "md:flex-1"
                : "w-full md:flex-1"
            }`}
            onClick={() => {
              // Close any open sidebars when clicking on main chat area
              if (leftSidebarOpen) setLeftSidebarOpen(false);
              if (rightSidebarOpen) setRightSidebarOpen(false);
            }}
          >
            {/* Safety Banner */}
            <div className={colors.ui.safetyBanner}>
              <div className="p-4">
                <div className={`text-sm ${colors.status.error.textLight}`}>
                  <strong>Safety Notice:</strong> Avoid meeting at night or at
                  private locations. It is safest to meet during the day in
                  well-lit, public locations such as active parking lots, public
                  libraries, and outside police stations. Do not bring
                  additional people unless it is agreed upon by all parties.
                </div>

                {/* Collapsible second part */}
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
                      This includes your last name, the names or information of
                      family members or friends, phone numbers, living
                      addresses, social security or passport numbers, credit or
                      debit card numbers, bank account or routing numbers,
                      medical information, work addresses or work information,
                      etc. Keep your messages relevant to the rental item, the
                      meetup location, and the time of the meetup.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Chat Details */}
          <div
            className={`transition-transform duration-300 ease-in-out ${
              // Desktop: always visible at 20% width with 30% opacity background
              // Mobile: curtain effect - always rendered but slides in/out from right edge
              "absolute right-0 top-0 h-full w-80 z-[80] bg-background md:relative md:w-1/5 md:bg-muted/30"
            } ${
              rightSidebarOpen
                ? "translate-x-0" // Slide in to normal position
                : "translate-x-full md:translate-x-0" // Off-screen on mobile, normal on desktop
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedChatData && (
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
                  {/* md:pt-6 to keep original padding on desktop */}
                  <div className="relative inline-block mb-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={selectedChatData.avatar}
                        alt={selectedChatData.name}
                      />
                      <AvatarFallback className="text-lg">
                        {selectedChatData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChatData.isOnline && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-2">
                    {selectedChatData.name}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-6">
                    {selectedChatData.isOnline
                      ? "Online"
                      : `Last seen ${selectedChatData.lastActivity}`}
                  </p>

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
    </div>
  );
}
