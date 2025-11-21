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

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
  oauth?: string | null;
  onSuccess?: (newEmail: string) => void;
}

export function ChangeEmailModal({
  isOpen,
  onOpenChange,
  currentEmail,
  oauth,
  onSuccess,
}: ChangeEmailModalProps) {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isWebAuthnVerificationOpen, setIsWebAuthnVerificationOpen] =
    useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const isOAuthUser = !!oauth;

  const validateEmail = (email: string): boolean => {
    // Simple email regex validation: local@domain.tld
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const mapErrorToField = (errorMsg: string): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (errorMsg.includes("valid email")) {
      errors.newEmail = "Please enter a valid email address";
    } else if (errorMsg.includes("already")) {
      errors.newEmail = "This email is already in use";
    } else if (errorMsg.includes("match")) {
      errors.confirmEmail = "Emails do not match";
    } else if (errorMsg.includes("password")) {
      errors.password = "Password is incorrect";
    }

    return errors;
  };

  const isFormValid =
    newEmail &&
    confirmEmail &&
    password &&
    newEmail === confirmEmail &&
    validateEmail(newEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!isFormValid) {
      if (!newEmail) {
        setFieldErrors((prev) => ({
          ...prev,
          newEmail: "New email is required",
        }));
      } else if (!validateEmail(newEmail)) {
        setFieldErrors((prev) => ({
          ...prev,
          newEmail: "Please enter a valid email address",
        }));
      }
      if (!confirmEmail) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmEmail: "Please confirm your email",
        }));
      } else if (newEmail !== confirmEmail) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmEmail: "Emails do not match",
        }));
      }
      if (!password) {
        setFieldErrors((prev) => ({
          ...prev,
          password: "Password is required for security",
        }));
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/users/change-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          new_email: newEmail,
          confirm_email: confirmEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        handleClose();
        if (onSuccess) {
          onSuccess(newEmail);
        }
      } else {
        const errorMsg = data.error || "Failed to change email";
        const mappedErrors = mapErrorToField(errorMsg);

        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors(mappedErrors);
        } else {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Change email error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail("");
    setConfirmEmail("");
    setPassword("");
    setError("");
    setFieldErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
          <DialogDescription>
            {currentEmail && (
              <p className="mb-2">Current email: {currentEmail}</p>
            )}
            Enter your new email address and confirm it with your password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              New Email
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter your new email"
              disabled={isLoading}
              className={fieldErrors.newEmail ? "border-red-500" : ""}
            />
            {fieldErrors.newEmail && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.newEmail}
              </p>
            )}
          </div>

          {/* Confirm Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm Email
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm your new email"
              disabled={isLoading}
              className={fieldErrors.confirmEmail ? "border-red-500" : ""}
            />
            {fieldErrors.confirmEmail && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.confirmEmail}
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
              {isLoading ? "Changing..." : "Change Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
