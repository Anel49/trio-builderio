import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [step, setStep] = useState<"verify" | "reset" | "success">("verify");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Verify token on component mount
    verifyToken();
  }, []);

  const verifyToken = async () => {
    if (!token || !email) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch("/password-reset-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (data.ok) {
        setStep("reset");
        setError("");
      } else {
        setError(data.error || "Invalid or expired reset link");
        setStep("verify");
      }
    } catch (err) {
      console.error("Token verification error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setFieldErrors({});

    if (!newPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        newPassword: "New password is required",
      }));
      return;
    }

    if (newPassword.length < 6) {
      setFieldErrors((prev) => ({
        ...prev,
        newPassword: "Password must be at least 6 characters",
      }));
      return;
    }

    if (!confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Please confirm your password",
      }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
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
          token,
          email,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setStep("success");
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        });
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An error occurred while resetting your password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {step === "verify" && (
            <>
              <h1 className="text-3xl font-bold mb-2 text-center">
                Verifying Reset Link
              </h1>
              <p className="text-gray-600 text-center mb-6">
                Please wait while we verify your reset link...
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/")}
                    >
                      Return to Home
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/")}
                    >
                      Request New Link
                    </Button>
                  </div>
                </div>
              )}

              {!error && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}

          {step === "reset" && (
            <>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
              </div>

              <h1 className="text-3xl font-bold mb-2 text-center">
                Set New Password
              </h1>
              <p className="text-gray-600 text-center mb-6">
                Enter your new password below.
              </p>

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

              {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

              <div className="space-y-2 mt-6">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {step === "success" && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h1 className="text-3xl font-bold mb-2">Password Reset!</h1>
                <p className="text-gray-600 mb-6">
                  Your password has been successfully reset. You can now log in
                  with your new password.
                </p>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
