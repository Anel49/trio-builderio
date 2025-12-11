import React, { useState, useRef } from "react";
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

export function ReferralModal({ isOpen, onOpenChange }: ReferralModalProps) {
  const { user: currentUser, checkAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const successfulSubmissionRef = useRef(false);

  const handleModalClose = async (open: boolean) => {
    console.log(
      "[handleModalClose] Modal close requested, open:",
      open,
      "isOpen:",
      isOpen,
      "successfulSubmission:",
      successfulSubmissionRef.current,
    );
    if (!open && isOpen && !successfulSubmissionRef.current) {
      console.log("[handleModalClose] Calling updateReferrer with 0");
      await updateReferrer(0);
    }
    if (!open) {
      setUsername("");
      setFoundUser(null);
      setError("");
      setSuccessMessage("");
      setIsLoading(false);
      successfulSubmissionRef.current = false;
    }
    onOpenChange(open);
  };

  const handleNoReferrer = async () => {
    console.log("[handleNoReferrer] No referrer clicked");
    await updateReferrer(0);
    setUsername("");
    setFoundUser(null);
    setError("");
    setSuccessMessage("");
    setIsLoading(false);
    onOpenChange(false);
  };

  const updateReferrer = async (referrerId: string | number) => {
    try {
      console.log("[updateReferrer] Setting referrer to:", referrerId);
      const response = await apiFetch("/auth/referrer", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referred_by_user_id: referrerId }),
      });

      console.log("[updateReferrer] Response status:", response.status);
      console.log("[updateReferrer] Response ok:", response.ok);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("[updateReferrer] Error response:", data);
        setError(data.error || "Failed to set referrer");
        return false;
      }

      const data = await response.json();
      console.log("[updateReferrer] Success response:", data);
      await checkAuth();
      return true;
    } catch (err) {
      console.error("[updateReferrer] Error updating referrer:", err);
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
        console.log(
          "[handleFindUser] Error response text:",
          text.substring(0, 200),
        );
        setError("User not found");
        setFoundUser(null);
        setSuccessMessage("");
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error(
          "[handleFindUser] Non-JSON response:",
          text.substring(0, 200),
        );
        setError("Invalid server response");
        setFoundUser(null);
        setSuccessMessage("");
        return;
      }

      const data = await response.json();
      console.log("[handleFindUser] Response data:", data);

      const foundUser = data.user;

      if (!foundUser) {
        setError("User not found");
        setFoundUser(null);
        setSuccessMessage("");
        return;
      }

      if (currentUser && foundUser.id === currentUser.id) {
        setError("You cannot refer yourself");
        setFoundUser(null);
        setSuccessMessage("");
        return;
      }

      setFoundUser({ id: foundUser.id, username: foundUser.username });
      setError("");
      setSuccessMessage("User found!");
    } catch (err) {
      console.error("Error finding user:", err);
      setError("An error occurred. Please try again.");
      setFoundUser(null);
      setSuccessMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!foundUser) {
      return;
    }

    const success = await updateReferrer(foundUser.id);
    if (success) {
      successfulSubmissionRef.current = true;
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
              If you were referred by an existing user, please enter the
              referring user's username below.
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
                    setSuccessMessage("");
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

            {(error || successMessage) && (
              <p className="text-sm text-foreground text-center opacity-60">
                {error || successMessage}
              </p>
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
