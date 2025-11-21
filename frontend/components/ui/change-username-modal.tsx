import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { WebAuthnVerificationModal } from "@/components/ui/webauthn-verification-modal";

interface ChangeUsernameModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername?: string;
  oauth?: string | null;
  onSuccess?: (newUsername: string) => void;
}

export function ChangeUsernameModal({
  isOpen,
  onOpenChange,
  currentUsername,
  oauth,
  onSuccess,
}: ChangeUsernameModalProps) {
  const [newUsername, setNewUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isWebAuthnVerificationOpen, setIsWebAuthnVerificationOpen] =
    useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const isOAuthUser = !!oauth;

  const validateUsername = (username: string): boolean => {
    // Username can contain letters, numbers, underscores, and hyphens
    // Must be 3-30 characters
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
  };

  const mapErrorToField = (errorMsg: string): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (errorMsg.includes("already taken")) {
      errors.newUsername = "This username is already taken";
    } else if (errorMsg.includes("required")) {
      errors.newUsername = "Username is required";
    } else if (errorMsg.includes("between")) {
      errors.newUsername = "Username must be between 3 and 30 characters";
    } else if (errorMsg.includes("letters, numbers")) {
      errors.newUsername =
        "Username can only contain letters, numbers, underscores, and hyphens";
    } else if (errorMsg.includes("password")) {
      errors.password = "Password is incorrect";
    }

    return errors;
  };

  const isFormValid = isOAuthUser
    ? newUsername && validateUsername(newUsername) && newUsername !== currentUsername
    : newUsername &&
      password &&
      validateUsername(newUsername) &&
      newUsername !== currentUsername;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!isFormValid) {
      if (!newUsername) {
        setFieldErrors((prev) => ({
          ...prev,
          newUsername: "New username is required",
        }));
      } else if (!validateUsername(newUsername)) {
        setFieldErrors((prev) => ({
          ...prev,
          newUsername:
            "Username must be 3-30 characters, containing only letters, numbers, underscores, and hyphens",
        }));
      }
      if (!isOAuthUser && !password) {
        setFieldErrors((prev) => ({
          ...prev,
          password: "Password is required for security",
        }));
      }
      if (newUsername === currentUsername) {
        setFieldErrors((prev) => ({
          ...prev,
          newUsername: "Please enter a different username",
        }));
      }
      return;
    }

    // For OAuth users, show WebAuthn verification modal first
    if (isOAuthUser) {
      setPendingUsername(newUsername);
      setIsWebAuthnVerificationOpen(true);
      return;
    }

    // For password users, proceed directly
    setIsLoading(true);

    try {
      const response = await apiFetch("/users/change-username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          new_username: newUsername,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        handleClose();
        if (onSuccess) {
          onSuccess(newUsername);
        }
      } else {
        const errorMsg = data.error || "Failed to change username";
        const mappedErrors = mapErrorToField(errorMsg);

        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors(mappedErrors);
        } else {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Change username error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebAuthnSuccess = async () => {
    setIsLoading(true);

    try {
      const response = await apiFetch("/users/change-username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          new_username: pendingUsername,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        handleClose();
        if (onSuccess) {
          onSuccess(pendingUsername);
        }
      } else {
        const errorMsg = data.error || "Failed to change username";
        const mappedErrors = mapErrorToField(errorMsg);

        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors(mappedErrors);
        } else {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Change username error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewUsername("");
    setPassword("");
    setError("");
    setFieldErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Username</DialogTitle>
          <DialogDescription>
            {currentUsername && (
              <p className="mb-2">Current username: {currentUsername}</p>
            )}
            Choose a new username and confirm with your password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Username */}
          <div>
            <label className="block text-sm font-medium mb-2">
              New Username
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter your new username"
              disabled={isLoading}
              className={fieldErrors.newUsername ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              3-30 characters, letters, numbers, underscores, and hyphens only
            </p>
            {fieldErrors.newUsername && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.newUsername}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Password
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password to confirm"
              disabled={isLoading}
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isFormValid}>
              {isLoading ? "Changing..." : "Change Username"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
