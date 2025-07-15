import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Menu } from "lucide-react";

// OAuth Configuration
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID || "your-google-client-id";
const FACEBOOK_APP_ID =
  process.env.REACT_APP_FACEBOOK_APP_ID || "your-facebook-app-id";
const MICROSOFT_CLIENT_ID =
  process.env.REACT_APP_MICROSOFT_CLIENT_ID || "your-microsoft-client-id";

// Microsoft MSAL configuration
const msalConfig = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin + "/login",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      // Load Facebook SDK
      if (!window.FB) {
        await loadFacebookScript();
      }

      window.FB.login(
        (response: any) => {
          console.log("Facebook OAuth Response:", response);
          if (response.authResponse) {
            // Get user info
            window.FB.api(
              "/me",
              { fields: "name,email,picture" },
              (userInfo: any) => {
                handleOAuthSuccess("facebook", { ...response, userInfo });
              },
            );
          } else {
            alert("Facebook login failed. Please try again.");
          }
          setIsLoading(false);
        },
        { scope: "email,public_profile" },
      );
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

      window.fbAsyncInit = function () {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });
        resolve();
      };

      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
      document.head.appendChild(script);
    });
  };

  // Handle traditional email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Implement your email/password authentication here
      console.log("Email login attempt:", { email, password });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // This is where you'd make your actual API call
      alert(
        "Email login functionality - implement your backend authentication",
      );
    } catch (error) {
      console.error("Email login error:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Same as other pages */}
      <header className="relative z-50 bg-white/95 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-semibold">
                <a href="/">Trio</a>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a
                  href="/browse"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Browse listings
                </a>
                <a
                  href="#"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Rent your product
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="hidden md:inline-flex">
                <a href="/signup">Sign up</a>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Login Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your Trio account
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OAuth Login Buttons */}
            <div className="space-y-3">
              {/* Google Login */}
              <Button
                variant="outline"
                className="w-full"
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
                className="w-full"
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
                Continue with Facebook
              </Button>

              {/* Microsoft Login */}
              <Button
                variant="outline"
                className="w-full"
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

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/forgot-password">Forgot password?</a>
                </Button>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Button variant="link" asChild className="p-0">
                <a href="/signup">Sign up</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
