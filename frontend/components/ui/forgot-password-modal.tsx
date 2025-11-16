import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setConfirmEmail("");
      setResetEmailSent(false);
      setSentEmail("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const isEmailValid = validateEmail(email);
  const isConfirmEmailValid = validateEmail(confirmEmail);
  const emailsMatch = email === confirmEmail;
  const isButtonDisabled = !isEmailValid || !isConfirmEmailValid || !emailsMatch;

  const handleSendResetLink = async () => {
    if (isButtonDisabled) return;

    setIsLoading(true);
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
        setSentEmail(email);
        setResetEmailSent(true);
      } else {
        alert(data.error || "Failed to send password reset email");
      }
    } catch (error) {
      console.error("Error sending password reset email:", error);
      alert("An error occurred while sending the password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setConfirmEmail("");
      setResetEmailSent(false);
      setSentEmail("");
      setIsLoading(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md">
        {!resetEmailSent ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Reset Your Password
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Enter your email address and we'll send you a link to reset
                  your password.
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

              <div className="space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSendResetLink}
                  disabled={isButtonDisabled || isLoading}
                >
                  {isLoading ? "Sending..." : "Email reset link"}
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
                Password reset email sent to {sentEmail}!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Please allow up to 5 minutes to receive your email. If you do
                  not receive the email within that time, please{" "}
                  <a href="#" className="text-primary hover:underline">
                    contact us
                  </a>
                  .
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
