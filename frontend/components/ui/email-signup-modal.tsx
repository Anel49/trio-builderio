import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Upload, X, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface EmailSignupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupSuccess?: (user: any) => void;
  onSwitchToLogin?: () => void;
}

export function EmailSignupModal({
  isOpen,
  onOpenChange,
  onSignupSuccess,
  onSwitchToLogin,
}: EmailSignupModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [isOver18, setIsOver18] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successUser, setSuccessUser] = useState<any>(null);

  const mapErrorToField = (errorMsg: string): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (
      errorMsg.includes("email") ||
      errorMsg.includes("already registered")
    ) {
      errors.email = "Email already registered";
    }
    if (errorMsg.includes("password") && errorMsg.includes("do not match")) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (
      errorMsg.includes("password") &&
      errorMsg.includes("at least 6 characters")
    ) {
      errors.password = "Password must be at least 6 characters";
    }
    if (errorMsg.includes("first_name") || errorMsg.includes("First name")) {
      errors.firstName = "First name is required";
    }
    if (errorMsg.includes("last_name") || errorMsg.includes("Last name")) {
      errors.lastName = "Last name is required";
    }
    if (
      errorMsg.includes("valid email") ||
      (errorMsg.includes("email") && errorMsg.includes("required"))
    ) {
      errors.email = "Valid email is required";
    }

    return errors;
  };

  const handlePhotoIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoId(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoId(null);
  };

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    isOver18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccessMessage("");

    if (!isFormValid) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/users/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          photo_id: photoId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok && data.user) {
        setSuccessUser(data.user);
        setIsSuccessModalOpen(true);
      } else {
        const errorMsg = data.error || "Signup failed. Please check your information and try again.";
        const mappedErrors = mapErrorToField(errorMsg);

        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors(mappedErrors);
        } else {
          setError(errorMsg);
        }
        console.error("Signup error details:", { status: response.status, data });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhotoId(null);
    setIsOver18(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setSuccessMessage("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Create Your Account
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4 p-2">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (fieldErrors.firstName) {
                  setFieldErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.firstName;
                    return updated;
                  });
                }
              }}
              disabled={isLoading}
              required
              className={fieldErrors.firstName ? "border-red-500" : ""}
            />
            {fieldErrors.firstName && (
              <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
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
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Photo ID Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Photo ID</label>
            {!photoId ? (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoIdUpload}
                  disabled={isLoading}
                  className="hidden"
                  id="photo-id-input"
                />
                <label
                  htmlFor="photo-id-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload photo
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative inline-block w-full">
                <img
                  src={photoId}
                  alt="Photo ID preview"
                  className="max-h-40 rounded-lg mx-auto"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Age Affirmation Checkbox */}
          <div className="flex items-start gap-3 pt-4">
            <Checkbox
              id="age-check"
              checked={isOver18}
              onCheckedChange={(checked) => setIsOver18(Boolean(checked))}
              disabled={isLoading}
            />
            <label htmlFor="age-check" className="text-sm text-muted-foreground">
              I affirm that I am at least 18 years of age.{" "}
              <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Error Message */}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {/* Success Message */}
          {successMessage && (
            <div className="text-sm text-green-600">{successMessage}</div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          {/* Sign In Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Button
              variant="link"
              className="p-0"
              onClick={() => {
                handleClose();
                if (onSwitchToLogin) {
                  onSwitchToLogin();
                }
              }}
            >
              Sign in
            </Button>
          </div>
            </form>
          </ScrollArea>
      </DialogContent>
    </Dialog>

    {/* Success Modal */}
    <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
      <DialogContent className="max-w-md text-center py-12 px-8">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Account Created Successfully!
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground mb-6">
          Welcome to the platform! You are now signed in as{" "}
          <strong>{successUser?.name}</strong>.
        </p>
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => {
            setIsSuccessModalOpen(false);
            handleClose();
            if (onSignupSuccess && successUser) {
              onSignupSuccess(successUser);
            }
          }}
        >
          Continue to Dashboard
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}
