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
import { Button } from "./ui/button";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";
import { formatUTCDateTime } from "@/lib/timezone-utils";

interface Message {
  id: number;
  senderId: number;
  toId: number;
  body: string;
  createdAt: string;
  messageThreadId?: number;
  senderName?: string;
  isFromCurrentUser: boolean;
}

interface AdminReportChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: number;
  reportedUserName: string | null;
  reportingUserName: string | null;
}

export function AdminReportChatModal({
  open,
  onOpenChange,
  reportId,
  reportedUserName,
  reportingUserName,
}: AdminReportChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [paginationState, setPaginationState] = useState<{
    offset: number;
    hasMoreOlder: boolean;
    totalMessages: number;
  }>({
    offset: 0,
    hasMoreOlder: false,
    totalMessages: 0,
  });
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const isLoadingOlderRef = useRef<boolean>(false);

  useEffect(() => {
    if (open) {
      // Reset pagination state when opening
      setPaginationState({ offset: 0, hasMoreOlder: false, totalMessages: 0 });
      loadMessages();
    }
  }, [open, reportId]);

  // Auto-scroll to bottom when messages load (but not when loading older messages)
  useEffect(() => {
    // Skip auto-scroll if we're loading older messages
    if (isLoadingOlderRef.current) {
      return;
    }

    if (messagesScrollRef.current) {
      const scrollElement = messagesScrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement;
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 0);
      }
    }
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get conversation for this report - initially load 50 messages
      const response = await apiFetch(
        `/admin/reports/${reportId}/conversation?limit=50&offset=0`
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
          senderName: msg.senderName || "Unknown",
          isFromCurrentUser: msg.isFromCurrentUser,
        })
      );

      setMessages(loadedMessages);

      // Set pagination state
      setPaginationState({
        offset: 50,
        hasMoreOlder: data.hasMoreOlder || false,
        totalMessages: data.totalMessages || 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Handle loading older messages
  const handleLoadOlderMessages = async () => {
    if (!paginationState.hasMoreOlder) return;

    // Get the scroll element and save current scroll position
    const scrollElement = messagesScrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;

    if (!scrollElement) return;

    const scrollHeightBefore = scrollElement.scrollHeight;
    const scrollTopBefore = scrollElement.scrollTop;

    // Set flag to prevent auto-scroll
    isLoadingOlderRef.current = true;
    setLoadingOlderMessages(true);

    try {
      const response = await apiFetch(
        `/admin/reports/${reportId}/conversation?limit=20&offset=${paginationState.offset}`,
      );
      const data = await response.json();
      if (data.ok) {
        const olderMessages: Message[] = (data.messages || []).map(
          (msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            toId: msg.toId,
            body: msg.body,
            createdAt: msg.createdAt,
            messageThreadId: msg.messageThreadId,
            senderName: msg.senderName || "Unknown",
            isFromCurrentUser: msg.isFromCurrentUser,
          })
        );

        // Prepend older messages to the beginning
        const updatedMessages = [...olderMessages, ...messages];
        setMessages(updatedMessages);

        // Update pagination state
        setPaginationState({
          offset: paginationState.offset + 20,
          hasMoreOlder: data.hasMoreOlder || false,
          totalMessages: data.totalMessages || 0,
        });

        // Restore scroll position after DOM update
        // Wait for two frames to ensure all DOM updates are complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const scrollHeightAfter = scrollElement.scrollHeight;
            const heightDifference = scrollHeightAfter - scrollHeightBefore;
            scrollElement.scrollTop = scrollTopBefore + heightDifference;
            // Clear the flag after scroll restoration
            isLoadingOlderRef.current = false;
          });
        });
      }
    } catch (error) {
      console.error("Failed to load older messages:", error);
      isLoadingOlderRef.current = false;
    } finally {
      setLoadingOlderMessages(false);
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
              {/* Show older messages button */}
              {paginationState.hasMoreOlder && (
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadOlderMessages}
                    disabled={loadingOlderMessages}
                    className="text-xs"
                  >
                    {loadingOlderMessages ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Loading older messages...
                      </>
                    ) : (
                      "Show older messages"
                    )}
                  </Button>
                </div>
              )}

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
                    <div
                      className={`text-xs mt-1 space-y-0.5 ${
                        message.isFromCurrentUser
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      <p>{formatUTCDateTime(message.createdAt)}</p>
                      <p>{message.senderName}</p>
                    </div>
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
