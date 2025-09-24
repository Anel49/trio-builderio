import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { COMPANY_NAME } from "@/lib/constants";
import { SignUpModal } from "@/components/ui/signup-modal";
import Header from "@/components/Header";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { Menu } from "lucide-react";

// OAuth Configuration
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
        ? window.location.origin + "/login"
        : "http://localhost:8080/login",
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
};

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Load Google OAuth2 library
      if (!window.google) {
        await loadGoogleScript();
      }

      window.google.accounts.oauth2
        .initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "profile email",
          callback: (response: any) => {
            console.log("Google OAuth Response:", response);
            // Handle successful Google login
            handleOAuthSuccess("google", response);
          },
        })
        .requestAccessToken();
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Facebook OAuth Login
  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      // Check if we have a valid Facebook App ID
      if (FACEBOOK_APP_ID === "demo-facebook-app-id") {
        // Demo mode - simulate Facebook login
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
          // Not logged in, show login dialog
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
                console.log("Facebook login cancelled or failed");
                alert(
                  "Facebook login was cancelled or failed. Please try again.",
                );
              }
              setIsLoading(false);
            },
            { scope: "email,public_profile" },
          );
        }
      });
    } catch (error) {
      console.error("Facebook login error:", error);
      alert("Facebook login failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Microsoft OAuth Login
  const handleMicrosoftLogin = async () => {
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
    } catch (error) {
      console.error("Microsoft login error:", error);
      alert("Microsoft login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful OAuth login
  const handleOAuthSuccess = (provider: string, data: any) => {
    console.log(`${provider} login successful:`, data);
    // Here you would typically:
    // 1. Send the OAuth data to your backend
    // 2. Create/update user account
    // 3. Set authentication state
    // 4. Redirect to dashboard

    alert(
      `${provider} login successful! (This is a demo - implement your backend integration)`,
    );
    // Redirect to home page or dashboard
    window.location.href = "/";
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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Login Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your {COMPANY_NAME} account
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OAuth Login Buttons */}
            <div className="space-y-3">
              {/* Google Login */}
              <Button
                variant="outline"
                className="w-full hover:text-white"
                onClick={handleGoogleLogin}
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
                Continue with Google
              </Button>

              {/* Facebook Login */}
              <Button
                variant="outline"
                className="w-full hover:text-white"
                onClick={handleFacebookLogin}
                disabled={isLoading}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="#1877F2"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                {isLoading ? "Connecting..." : "Continue with Facebook"}
              </Button>

              {/* Microsoft Login */}
              <Button
                variant="outline"
                className="w-full hover:text-white"
                onClick={handleMicrosoftLogin}
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
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Button
                variant="link"
                className="p-0"
                onClick={() => setIsSignUpModalOpen(true)}
              >
                Sign up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <SignUpModal
        isOpen={isSignUpModalOpen}
        onOpenChange={setIsSignUpModalOpen}
      />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      />
    </div>
  );
}

// Extend window interface for OAuth scripts
declare global {
  interface Window {
    google: any;
    FB: any;
    fbAsyncInit: () => void;
  }
}
