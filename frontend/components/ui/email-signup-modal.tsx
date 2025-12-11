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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EmailInUseModal } from "@/components/ui/email-in-use-modal";

interface EmailSignupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function EmailSignupModal({
  isOpen,
  onOpenChange,
  onSignupSuccess,
  onSwitchToLogin,
}: EmailSignupModalProps) {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoIds, setPhotoIds] = useState<
    Array<{ tempId: string; preview: string; s3Url: string }>
  >([]);
  const [isOver18, setIsOver18] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successUser, setSuccessUser] = useState<any>(null);
  const [useGoogleSignup, setUseGoogleSignup] = useState(false);
  const [emailInUseModalOpen, setEmailInUseModalOpen] = useState(false);
  const [emailInUseError, setEmailInUseError] = useState<string>("");

  // Load photo ID previews and S3 URLs from localStorage when modal opens
  React.useEffect(() => {
    if (isOpen) {
      try {
        const storedPhotos = localStorage.getItem("signupPhotoIds");
        if (storedPhotos) {
          const photos = JSON.parse(storedPhotos);
          if (Array.isArray(photos)) {
            setPhotoIds(photos);
          }
        }
      } catch (err) {
        console.error(
          "[EmailSignupModal] Error loading photos from localStorage:",
          err,
        );
      }
    }
  }, [isOpen]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_.-]*$/;

  const validateEmail = (emailValue: string): boolean => {
    return emailRegex.test(emailValue);
  };

  const validateUsername = (usernameValue: string): string | null => {
    if (usernameValue.length > 30) {
      return "Username must be 30 characters or less";
    }
    if (!usernameRegex.test(usernameValue)) {
      return "Username can only contain letters, numbers, underscores, hyphens, and periods";
    }
    return null;
  };

  const mapErrorToField = (errorMsg: string): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Exact matches for backend error messages
    if (errorMsg === "first_name is required") {
      errors.firstName = "First name is required";
    } else if (errorMsg === "last_name is required") {
      errors.lastName = "Last name is required";
    } else if (errorMsg === "username is required") {
      errors.username = "Username is required";
    } else if (errorMsg === "username already taken") {
      errors.username = "Username already taken";
    } else if (errorMsg === "valid email is required") {
      errors.email = "Valid email is required";
    } else if (errorMsg === "email already registered") {
      errors.email = "Email already registered";
    } else if (errorMsg === "password must be at least 6 characters") {
      errors.password = "Password must be at least 6 characters";
    } else if (errorMsg === "passwords do not match") {
      errors.confirmPassword = "Passwords do not match";
    }

    console.log("[Email Signup] Error mapping:", {
      originalMsg: errorMsg,
      mappedErrors: errors,
      mappedCount: Object.keys(errors).length,
    });

    return errors;
  };

  const handlePhotoIdUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setError("");

      // Process each selected file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("application/pdf")
        ) {
          continue;
        }

        // Generate a temporary ID for this photo (will be renamed after signup)
        // In browser, we use timestamp-based ID since crypto.randomUUID() is not available via require
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;

        // Create a local preview data URL immediately
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const url = event.target?.result as string;
            resolve(url);
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        // Get presigned URL from backend
        const presignedResponse = await apiFetch(
          "/users/presigned-photo-id-url",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
            }),
          },
        );

        const presignedData = await presignedResponse.json().catch(() => ({}));

        if (!presignedResponse.ok || !presignedData.presignedUrl) {
          console.warn(
            `[EmailSignupModal] Failed to get presigned URL for ${file.name}:`,
            presignedData.error,
          );
          continue;
        }

        // Upload file to S3 using presigned URL
        const uploadResponse = await fetch(presignedData.presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          console.warn(
            `[EmailSignupModal] Failed to upload ${file.name} to S3`,
          );
          continue;
        }

        // Extract S3 URL (without query params)
        const s3Url = presignedData.presignedUrl.split("?")[0];

        // Add to photos array
        setPhotoIds((prev) => [...prev, { tempId, preview: dataUrl, s3Url }]);

        console.log(
          `[EmailSignupModal] Photo ${i + 1} uploaded successfully with tempId: ${tempId}`,
        );
      }

      // Save to localStorage
      setPhotoIds((prev) => {
        localStorage.setItem("signupPhotoIds", JSON.stringify(prev));
        return prev;
      });
    } catch (err) {
      console.error("[EmailSignupModal] Photo upload error:", err);
      setError("Failed to upload photos. Please try again.");
    }

    // Reset file input
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoIds((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem("signupPhotoIds", JSON.stringify(updated));
      return updated;
    });
  };

  const isFormValid =
    firstName.trim() &&
    username.trim() &&
    !validateUsername(username) &&
    email.trim() &&
    validateEmail(email) &&
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
          username: username.trim().toLowerCase(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          photo_ids: photoIds.map((p) => p.s3Url),
          photo_id: photoIds.length > 0 ? photoIds[0].s3Url : null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok && data.user) {
        setSuccessUser(data.user);
        setIsSuccessModalOpen(true);
      } else if (data.error === "email already registered") {
        setEmailInUseError(email.trim());
        setEmailInUseModalOpen(true);
      } else {
        const errorMsg =
          data.error ||
          "Signup failed. Please check your information and try again.";
        const mappedErrors = mapErrorToField(errorMsg);

        console.log("[Email Signup] Backend error:", {
          status: response.status,
          errorMsg,
          mappedErrorsCount: Object.keys(mappedErrors).length,
          mappedErrors,
        });

        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors(mappedErrors);
          // Also set a general message that errors are below
          setError("");
        } else {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log(
      "[EmailSignupModal] handleClose called, calling onOpenChange(false)",
    );
    setFirstName("");
    setLastName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhotoIds([]);
    setIsOver18(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setSuccessMessage("");
    // Clear photo IDs from localStorage when closing modal
    localStorage.removeItem("signupPhotoIds");
    onOpenChange(false);
  };

  const handleSuccessModalClose = async (open: boolean) => {
    console.log(
      "[EmailSignupModal] handleSuccessModalClose called, open:",
      open,
    );
    if (!open) {
      console.log(
        "[EmailSignupModal] Closing success modal by outside interaction, refreshing page",
      );
      setIsSuccessModalOpen(false);
      handleClose();
      // Clear the image previews from localStorage after successful signup
      localStorage.removeItem("uploadSessionImagePreview");
      localStorage.removeItem("signupPhotoIds");
      window.location.reload();
    }
  };

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      try {
        const response = await apiFetch("/users/google-oauth", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: codeResponse.access_token,
            staySignedIn: false,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.ok && data.user) {
          // Clear the image previews from localStorage after successful signup
          localStorage.removeItem("uploadSessionImagePreview");
          localStorage.removeItem("signupPhotoIds");
          await checkAuth();
          handleClose();
          if (onSignupSuccess) {
            onSignupSuccess();
          }
        } else if (data.error === "email_in_use") {
          setEmailInUseError(data.email || "");
          setEmailInUseModalOpen(true);
        } else {
          const errorMsg =
            data.error || "Google signup failed. Please try again.";
          setError(errorMsg);
        }
      } catch (err) {
        console.error("Google signup error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google signup failed. Please try again.");
    },
  });

  return (
    <>
      <EmailInUseModal
        isOpen={emailInUseModalOpen}
        onOpenChange={setEmailInUseModalOpen}
        email={emailInUseError}
      />
      <Dialog open={isOpen && !isSuccessModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Create Your Account
            </DialogTitle>
          </DialogHeader>

          {/* Google OAuth Section */}
          <div className="space-y-3 px-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleGoogleSignup()}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Connecting..." : "Continue with Google"}
            </Button>
            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or sign up with email
                </span>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[calc(90vh-220px)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4 p-2">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  autoComplete="given-name"
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
                  <p className="text-xs text-red-500">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (fieldErrors.lastName) {
                      setFieldErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.lastName;
                        return updated;
                      });
                    }
                  }}
                  disabled={isLoading}
                  className={fieldErrors.lastName ? "border-red-500" : ""}
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    const emailValue = e.target.value;
                    setEmail(emailValue);
                    if (emailValue.trim() && !validateEmail(emailValue)) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: "Please enter a valid email address",
                      }));
                    } else {
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
                    autoComplete="new-password"
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
                    tabIndex={-1}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.confirmPassword;
                          return updated;
                        });
                      }
                    }}
                    disabled={isLoading}
                    required
                    className={`pr-10 ${fieldErrors.confirmPassword ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
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
                  <p className="text-xs text-red-500">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
                {!fieldErrors.confirmPassword &&
                  password &&
                  confirmPassword &&
                  password !== confirmPassword && (
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
              </div>

              {/* Profile Name */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">
                    Profile Name <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Profile Name will be used in your profile's URL.
                  </p>
                </div>
                <Input
                  type="text"
                  autoComplete="off"
                  maxLength={30}
                  value={username}
                  onChange={(e) => {
                    const usernameValue = e.target.value;
                    setUsername(usernameValue);
                    if (usernameValue.trim()) {
                      const error = validateUsername(usernameValue);
                      if (error) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          username: error,
                        }));
                      } else {
                        setFieldErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.username;
                          return updated;
                        });
                      }
                    } else {
                      setFieldErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.username;
                        return updated;
                      });
                    }
                  }}
                  disabled={isLoading}
                  required
                  className={fieldErrors.username ? "border-red-500" : ""}
                />
                {fieldErrors.username && (
                  <p className="text-xs text-red-500">{fieldErrors.username}</p>
                )}
              </div>

              {/* Photo ID Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Photo ID / Documents
                </label>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
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
                      Click to upload photo ID or documents
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      Multiple files allowed
                    </span>
                  </label>
                </div>

                {/* Photo Previews Grid */}
                {photoIds.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {photoIds.map((photo, index) => (
                      <div
                        key={`${photo.tempId}-${index}`}
                        className="relative rounded-lg overflow-hidden border border-muted-foreground/20"
                      >
                        <img
                          src={photo.preview}
                          alt={`Photo ID ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-white rounded-full p-1 shadow-lg"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
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
                <label
                  htmlFor="age-check"
                  className="text-sm text-muted-foreground"
                >
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
      <Dialog open={isSuccessModalOpen} onOpenChange={handleSuccessModalClose}>
        <DialogContent className="max-w-md text-center py-12 px-8">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-center">
              Account Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground mb-6">
            Welcome to the platform! You are now signed in as{" "}
            <strong>{successUser?.name}</strong>.
          </p>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={async () => {
              console.log(
                "[EmailSignupModal] Continue to Dashboard button clicked",
              );
              // Clear the image previews from localStorage after successful signup
              localStorage.removeItem("uploadSessionImagePreview");
              localStorage.removeItem("signupPhotoIds");
              setIsSuccessModalOpen(false);
              handleClose();
              if (onSignupSuccess) {
                onSignupSuccess();
              }
              await checkAuth();
              if (successUser?.username) {
                console.log(
                  "[EmailSignupModal] Navigating to /profile/" +
                    successUser.username,
                );
                navigate(`/profile/${successUser.username}`);
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
