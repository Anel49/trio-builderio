import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Loader2 } from "lucide-react";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";

interface Message {
  id: number;
  senderId: number;
  toId: number;
  body: string;
  createdAt: string;
  messageThreadId?: number;
  isFromCurrentUser: boolean;
}

interface AdminReportChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: number;
  reportingUserId: number;
  reportedUserName: string | null;
  reportingUserName: string | null;
  currentUserId: number;
}

export function AdminReportChatModal({
  open,
  onOpenChange,
  reportedUserId,
  reportingUserId,
  reportedUserName,
  reportingUserName,
  currentUserId,
}: AdminReportChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadMessages();
    }
  }, [open, reportedUserId, reportingUserId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages load
    if (messagesScrollRef.current) {
      const scrollElement = messagesScrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get conversation between reported user and reporting user
      const response = await apiFetch(
        `/messages/thread?user1=${reportedUserId}&user2=${reportingUserId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();
      const loadedMessages: Message[] = (data.messages || []).map(
        (msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          toId: msg.toId,
          body: msg.body,
          createdAt: msg.createdAt,
          messageThreadId: msg.messageThreadId,
          isFromCurrentUser: msg.senderId === reportingUserId,
        })
      );

      setMessages(loadedMessages);
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Chat: {reportingUserName} → {reportedUserName}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-3">
            {error}
          </div>
        )}

        {loading ? (
          <div
            className={combineTokens(
              layouts.flex.center,
              "flex-1"
            )}
          >
            <Loader2 className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div
            className={combineTokens(
              layouts.flex.center,
              "flex-1"
            )}
          >
            <p className="text-muted-foreground">No messages in this conversation</p>
          </div>
        ) : (
          <ScrollArea
            ref={messagesScrollRef}
            className="flex-1 px-4 border rounded-lg"
          >
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
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
