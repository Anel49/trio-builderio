import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

interface ReferralModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralModal({
  isOpen,
  onOpenChange,
}: ReferralModalProps) {
  const { user: currentUser, checkAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleModalClose = async (open: boolean) => {
    if (!open && isOpen) {
      if (!foundUser) {
        await updateReferrer("n/a");
      }
    }
    if (!open) {
      setUsername("");
      setFoundUser(null);
      setError("");
      setIsLoading(false);
    }
    onOpenChange(open);
  };

  const handleNoReferrer = async () => {
    await updateReferrer("n/a");
    handleModalClose(false);
  };

  const updateReferrer = async (referrerId: string) => {
    try {
      const response = await apiFetch("/api/auth/referrer", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referred_by_user_id: referrerId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Failed to set referrer");
        return false;
      }

      await checkAuth();
      return true;
    } catch (err) {
      console.error("Error updating referrer:", err);
      setError("An error occurred. Please try again.");
      return false;
    }
  };

  const handleFindUser = async () => {
    if (!username.trim()) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const endpoint = `/users/username/${encodeURIComponent(username.trim())}`;
      console.log("[handleFindUser] Fetching user:", endpoint);

      const response = await apiFetch(endpoint, {
        method: "GET",
      });

      console.log("[handleFindUser] Response status:", response.status);
      console.log("[handleFindUser] Response headers:", response.headers);

      if (!response.ok) {
        const text = await response.text();
        console.log("[handleFindUser] Error response text:", text.substring(0, 200));
        setError("User not found");
        setFoundUser(null);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[handleFindUser] Non-JSON response:", text.substring(0, 200));
        setError("Invalid server response");
        setFoundUser(null);
        return;
      }

      const data = await response.json();
      console.log("[handleFindUser] Response data:", data);

      const foundUser = data.user;

      if (!foundUser) {
        setError("User not found");
        setFoundUser(null);
        return;
      }

      if (currentUser && foundUser.id === currentUser.id) {
        setError("You cannot refer yourself");
        setFoundUser(null);
        return;
      }

      setFoundUser({ id: foundUser.id, username: foundUser.username });
      setError("");
    } catch (err) {
      console.error("Error finding user:", err);
      setError("An error occurred. Please try again.");
      setFoundUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!foundUser) {
      return;
    }

    const success = await updateReferrer(String(foundUser.id));
    if (success) {
      handleModalClose(false);
    }
  };

  const isInputEmpty = !username.trim();
  const isFindUserDisabled = isInputEmpty || isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Referral
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          <div className="opacity-60">
            <DialogDescription className="text-center text-base text-foreground">
              If you were referred by an existing user, please enter the referring
              user's username below.
            </DialogDescription>
          </div>

          <div className="space-y-4">
            <div className="relative opacity-60">
              <Input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (foundUser) {
                    setFoundUser(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isFindUserDisabled) {
                    handleFindUser();
                  }
                }}
                className="w-full pr-10"
                disabled={isLoading && foundUser !== null}
              />
              {isLoading && !foundUser && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {foundUser && !isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center opacity-60">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                variant="default"
                className="flex-1"
                onClick={foundUser ? handleSubmit : handleFindUser}
                disabled={foundUser ? isLoading : isFindUserDisabled}
              >
                {isLoading && !foundUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : foundUser ? (
                  "Submit"
                ) : (
                  "Find user"
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleNoReferrer}
                disabled={isLoading}
              >
                No referrer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
