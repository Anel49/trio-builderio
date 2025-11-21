import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({
  isOpen,
  onOpenChange,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const emailInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const isEmailValid = validateEmail(email);
  const isConfirmEmailValid = validateEmail(confirmEmail);
  const emailsMatch = email === confirmEmail;
  const isEmailButtonDisabled =
    !isEmailValid || !isConfirmEmailValid || !emailsMatch;

  const isPasswordValid =
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    newPassword.length >= 6;

  const handleVerifyEmail = async () => {
    if (isEmailButtonDisabled) return;

    setIsLoading(true);
    setError("");
    setFieldErrors({});
    try {
      const response = await apiFetch("/password-reset-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setEmailVerified(true);
        setVerifiedEmail(email);
      } else {
        setError(data.error || "Email not found");
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      setError("An error occurred while verifying the email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setFieldErrors({});

    if (!isPasswordValid) {
      if (!newPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          newPassword: "New password is required",
        }));
      } else if (newPassword.length < 6) {
        setFieldErrors((prev) => ({
          ...prev,
          newPassword: "Password must be at least 6 characters",
        }));
      }
      if (!confirmPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Please confirm your password",
        }));
      } else if (newPassword !== confirmPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch("/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verifiedEmail,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setResetComplete(true);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("An error occurred while resetting the password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!resetComplete) {
      setEmail("");
      setConfirmEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setEmailVerified(false);
      setVerifiedEmail("");
      setError("");
      setFieldErrors({});
    }
    onOpenChange(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open || resetComplete) {
          if (resetComplete) {
            setResetComplete(false);
            setEmailVerified(false);
            setEmail("");
            setConfirmEmail("");
            setNewPassword("");
            setConfirmPassword("");
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setError("");
            setFieldErrors({});
          }
          onOpenChange(open);
        }
      }}
    >
      <DialogContent className="max-w-md">
        {!emailVerified ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Reset Your Password
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Enter your email address to reset your password.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email Address
                  </label>
                  <Input
                    ref={emailInputRef}
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Confirm Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleVerifyEmail}
                  disabled={isEmailButtonDisabled || isLoading}
                >
                  {isLoading ? "Verifying..." : "Email reset link"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        ) : !resetComplete ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Set New Password
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Enter your new password. Password must be at least 6
                  characters.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    New Password
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      disabled={isLoading}
                      className={
                        fieldErrors.newPassword ? "border-red-500" : ""
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Confirm New Password
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      disabled={isLoading}
                      className={
                        fieldErrors.confirmPassword ? "border-red-500" : ""
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleResetPassword}
                  disabled={!isPasswordValid || isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailVerified(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                    setFieldErrors({});
                  }}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Password Reset Successful!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Your password has been successfully reset. You can now log in
                  with your new password.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
