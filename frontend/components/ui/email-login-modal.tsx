import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ForgotPasswordModal } from "@/components/ui/forgot-password-modal";

interface EmailLoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export function EmailLoginModal({
  isOpen,
  onOpenChange,
  onLoginSuccess,
  onSwitchToSignUp,
}: EmailLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const mapErrorToField = (errorMsg: string): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (errorMsg === "valid email is required") {
      errors.email = "Valid email is required";
    } else if (errorMsg === "password is required") {
      errors.password = "Password is required";
    } else if (errorMsg === "email or password is incorrect") {
      errors.general = "Email or password is incorrect";
    }

    return errors;
  };

  const isFormValid = email.trim() && password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!isFormValid) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/users/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          staySignedIn,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok && data.user) {
        handleClose();
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        // Reload the current page to refresh auth state and show authenticated content
        window.location.reload();
      } else {
        const errorMsg = data.error || "Login failed. Please try again.";
        const mappedErrors = mapErrorToField(errorMsg);

        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors(mappedErrors);
        } else {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setStaySignedIn(false);
    setError("");
    setFieldErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome back
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          <div className="text-center">
            <p className="text-muted-foreground">
              Sign in with your email and password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.email;
                      return updated;
                    });
                  }
                }}
                disabled={isLoading}
                required
                className={fieldErrors.email ? "border-red-500" : ""}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.password;
                        return updated;
                      });
                    }
                  }}
                  disabled={isLoading}
                  required
                  className={`pr-10 ${fieldErrors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            {/* Stay Signed In Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="staySignedIn"
                checked={staySignedIn}
                onCheckedChange={(checked) => setStaySignedIn(checked === true)}
                disabled={isLoading}
              />
              <label
                htmlFor="staySignedIn"
                className="text-sm font-medium cursor-pointer"
              >
                Stay signed in
              </label>
            </div>

            {/* Error Message */}
            {error && <div className="text-sm text-red-500">{error}</div>}
            {fieldErrors.general && (
              <div className="text-sm text-red-500">{fieldErrors.general}</div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="p-0 text-sm h-auto"
                onClick={() => {
                  onOpenChange(false);
                  setIsForgotPasswordOpen(true);
                }}
              >
                Forgot your password?
              </Button>
            </div>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don't have an account?{" "}
            </span>
            <Button
              variant="link"
              className="p-0"
              onClick={() => {
                handleClose();
                if (onSwitchToSignUp) {
                  onSwitchToSignUp();
                }
              }}
            >
              Sign up
            </Button>
          </div>
        </div>
      </DialogContent>

      {isForgotPasswordOpen && (
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onOpenChange={setIsForgotPasswordOpen}
        />
      )}
    </Dialog>
  );
}
