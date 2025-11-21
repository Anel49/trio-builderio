import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMPANY_NAME } from "@/lib/constants";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// OAuth Configuration - same as login page
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "demo-google-client-id";
const FACEBOOK_APP_ID =
  import.meta.env.VITE_FACEBOOK_APP_ID || "demo-facebook-app-id";
const MICROSOFT_CLIENT_ID =
  import.meta.env.VITE_MICROSOFT_CLIENT_ID || "demo-microsoft-client-id";

// Microsoft MSAL configuration
const msalConfig = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",
    redirectUri:
      typeof window !== "undefined"
        ? window.location.origin + "/signup"
        : "http://localhost:8080/signup",
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
};

interface SignUpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
  onContinueWithEmail?: () => void;
}

export function SignUpModal({
  isOpen,
  onOpenChange,
  onSwitchToLogin,
  onContinueWithEmail,
}: SignUpModalProps) {
  const { checkAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Google OAuth Signup
  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setError("");
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
          await checkAuth();
          onOpenChange(false);
        } else {
          const errorMsg = data.error || "Google signup failed. Please try again.";
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

  // Facebook OAuth Signup
  const handleFacebookSignup = async () => {
    setIsLoading(true);
    try {
      // Check if we have a valid Facebook App ID
      if (FACEBOOK_APP_ID === "demo-facebook-app-id") {
        // Demo mode - simulate Facebook signup
        setTimeout(() => {
          handleOAuthSuccess("facebook", {
            authResponse: { accessToken: "demo-token" },
            userInfo: { name: "Demo User", email: "demo@facebook.com" },
          });
          setIsLoading(false);
        }, 1000);
        return;
      }

      // Load Facebook SDK
      if (!window.FB) {
        await loadFacebookScript();
      }

      // Wait for SDK to be ready
      window.FB.getLoginStatus((response: any) => {
        if (response.status === "connected") {
          // Already logged in
          handleOAuthSuccess("facebook", response);
          setIsLoading(false);
        } else {
          // Not logged in, show signup dialog
          window.FB.login(
            (loginResponse: any) => {
              console.log("Facebook OAuth Response:", loginResponse);
              if (loginResponse.authResponse) {
                // Get user info
                window.FB.api(
                  "/me",
                  { fields: "name,email,picture" },
                  (userInfo: any) => {
                    handleOAuthSuccess("facebook", {
                      ...loginResponse,
                      userInfo,
                    });
                  },
                );
              } else {
                console.log("Facebook signup cancelled or failed");
                alert(
                  "Facebook signup was cancelled or failed. Please try again.",
                );
              }
              setIsLoading(false);
            },
            { scope: "email,public_profile" },
          );
        }
      });
    } catch (error) {
      console.error("Facebook signup error:", error);
      alert("Facebook signup failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Microsoft OAuth Signup
  const handleMicrosoftSignup = async () => {
    setIsLoading(true);
    try {
      // Dynamic import of MSAL
      const { PublicClientApplication } = await import("@azure/msal-browser");

      const pca = new PublicClientApplication(msalConfig);
      await pca.initialize();

      const loginRequest = {
        scopes: ["User.Read"],
        prompt: "select_account",
      };

      const response = await pca.loginPopup(loginRequest);
      console.log("Microsoft OAuth Response:", response);
      handleOAuthSuccess("microsoft", response);
    } catch (error: any) {
      console.error("Microsoft signup error:", error);
      // Don't show alert for user cancellation
      if (error.errorCode !== "user_cancelled") {
        alert("Microsoft signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful OAuth signup
  const handleOAuthSuccess = (provider: string, data: any) => {
    console.log(`${provider} signup successful:`, data);
    // Here you would typically:
    // 1. Send the OAuth data to your backend
    // 2. Create user account
    // 3. Set authentication state
    // 4. Close modal and redirect

    alert(
      `${provider} signup successful! (This is a demo - implement your backend integration)`,
    );
    onOpenChange(false);
    // Reload the current page to refresh auth state and show authenticated content
    window.location.reload();
  };

  // Load Google OAuth2 script
  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Google OAuth script"));
      document.head.appendChild(script);
    });
  };

  // Load Facebook SDK
  const loadFacebookScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.FB) {
        resolve();
        return;
      }

      // Set up Facebook async init
      window.fbAsyncInit = function () {
        try {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: "v19.0",
          });
          console.log("Facebook SDK initialized successfully");
          resolve();
        } catch (error) {
          console.error("Facebook SDK initialization error:", error);
          reject(error);
        }
      };

      // Check if script already exists
      if (document.getElementById("facebook-jssdk")) {
        return;
      }

      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Facebook SDK script loaded");
      };
      script.onerror = (error) => {
        console.error("Failed to load Facebook SDK script:", error);
        reject(new Error("Failed to load Facebook SDK"));
      };

      // Insert script
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Join {COMPANY_NAME}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          <div className="text-center">
            <p className="text-muted-foreground">
              Create your account to start renting
            </p>
          </div>

          {/* OAuth Signup Buttons */}
          <div className="space-y-3">
            {/* Google Signup */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google signup failed. Please try again.");
                }}
                text="signup_with"
                theme="outline"
                size="large"
                width="280"
              />
            </div>
            {error && <div className="text-sm text-red-500 text-center">{error}</div>}

            {/* Facebook Signup */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleFacebookSignup}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {isLoading ? "Connecting..." : "Continue with Facebook"}
            </Button>

            {/* Microsoft Signup */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleMicrosoftSignup}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#f25022" d="M1 1h10v10H1z" />
                <path fill="#00a4ef" d="M13 1h10v10H13z" />
                <path fill="#7fba00" d="M1 13h10v10H1z" />
                <path fill="#ffb900" d="M13 13h10v10H13z" />
              </svg>
              Continue with Microsoft
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Continue with Email */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                onOpenChange(false);
                if (onContinueWithEmail) {
                  onContinueWithEmail();
                }
              }}
            >
              Continue with Email
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Button
              variant="link"
              className="p-0"
              onClick={() => {
                onOpenChange(false);
                if (onSwitchToLogin) {
                  onSwitchToLogin();
                }
              }}
            >
              Sign in
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Extend window interface for OAuth scripts (same as login page)
declare global {
  interface Window {
    google: any;
    FB: any;
    fbAsyncInit: () => void;
  }
}
