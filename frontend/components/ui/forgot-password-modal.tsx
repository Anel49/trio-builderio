import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
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

  const handleSendResetEmail = async () => {
    if (isEmailButtonDisabled) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await apiFetch("/password-reset-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      // Log debug info if available
      if (data.debug) {
        console.error("Password reset debug info:", data.debug);
        setError(
          `Error sending email: ${data.debug.emailError}. Check browser console for details.`
        );
        setIsLoading(false);
        return;
      }

      if (data.ok) {
        setEmailSent(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Error sending reset email:", error);
      setError("An error occurred while sending the reset email. Check browser console.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setConfirmEmail("");
    setEmailSent(false);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        {!emailSent ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Reset Your Password
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Enter your email address and we'll send you a link to reset your password.
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

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <div className="space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSendResetEmail}
                  disabled={isEmailButtonDisabled || isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
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
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Check Your Email
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-foreground font-medium">
                  Reset link sent to {email}
                </p>
                <p className="text-muted-foreground text-sm">
                  We've sent a password reset link to your email. Click the link to set a new password. The link will expire in 24 hours.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Tip:</strong> Check your spam folder if you don't see the email.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleClose}
                >
                  Close
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmail("");
                    setConfirmEmail("");
                    setEmailSent(false);
                    setError("");
                  }}
                >
                  Send Another Link
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
