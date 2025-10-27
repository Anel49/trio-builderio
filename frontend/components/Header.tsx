import { useState } from "react";
import { MessageCircle, Menu, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { LoginModal } from "./ui/login-modal";
import { SignUpModal } from "./ui/signup-modal";
import { EmailSignupModal } from "./ui/email-signup-modal";
import { EmailLoginModal } from "./ui/email-login-modal";
import { MobileMenu } from "./ui/mobile-menu";
import { useAuth } from "@/contexts/AuthContext";
import { COMPANY_NAME } from "@/lib/constants";
import {
  spacing,
  typography,
  animations,
  layouts,
  zIndex,
  combineTokens,
} from "@/lib/design-tokens";

export default function Header() {
  const { authenticated, user, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isEmailSignupModalOpen, setIsEmailSignupModalOpen] = useState(false);
  const [isEmailLoginModalOpen, setIsEmailLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header
        className={combineTokens(
          "relative",
          zIndex.header,
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border/40 dark:border-gray-700/40",
        )}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div
            className={combineTokens(
              layouts.flex.between,
              spacing.dimensions.header,
            )}
          >
            <div className={combineTokens(layouts.flex.start, "space-x-8")}>
              <div
                className={combineTokens(
                  typography.size["2xl"],
                  typography.weight.semibold,
                )}
              >
                <a
                  href="/"
                  className={combineTokens(
                    "hover:text-primary",
                    animations.combinations.button,
                  )}
                >
                  {COMPANY_NAME}
                </a>
              </div>
              <nav className="hidden md:flex space-x-8 mt-[1px] ml-8">
                <a
                  href="/browse"
                  className="text-foreground hover:text-primary transition-colors mt-[2px]"
                >
                  Browse listings
                </a>
                <a
                  href="/upload"
                  className="text-foreground hover:text-primary transition-colors mt-[2px] ml-8"
                >
                  Rent your product
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {!authenticated && (
                <>
                  <Button
                    variant="ghost"
                    className="hidden md:inline-flex pt-[6px] pb-[8px] px-4"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    Log in
                  </Button>
                  <Button
                    className="pt-[6px] pb-[8px] px-4"
                    onClick={() => setIsSignUpModalOpen(true)}
                  >
                    Sign up
                  </Button>
                </>
              )}

              {authenticated && (
                <>
                  {/* Messages Link */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    title="Messages"
                    onClick={() => (window.location.href = "/messages")}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  {/* Orders and Requests Link */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hidden sm:inline-flex"
                    title="Orders and Requests"
                    onClick={() => (window.location.href = "/order-history")}
                  >
                    <ClipboardList className="h-5 w-5" />
                  </Button>

                  {/* Profile Picture Link */}
                  <Avatar
                    className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                    title="Profile"
                    onClick={() => (window.location.href = "/profile")}
                  >
                    <AvatarImage
                      src={user?.avatarUrl || undefined}
                      alt={user?.name || "Profile"}
                    />
                    <AvatarFallback>
                      {getInitials(user?.name || null)}
                    </AvatarFallback>
                  </Avatar>
                </>
              )}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {authenticated && user && (
        <div className="bg-black/5 dark:bg-white/5 border-b border-border/40 dark:border-gray-700/40 px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-lime-500 font-mono text-sm">
            LOGGED IN AS: {user.name}, id: {user.id}
          </p>
        </div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onSwitchToSignUp={() => {
          setIsLoginModalOpen(false);
          setIsSignUpModalOpen(true);
        }}
        onContinueWithEmail={() => {
          setIsEmailLoginModalOpen(true);
        }}
      />

      <SignUpModal
        isOpen={isSignUpModalOpen}
        onOpenChange={setIsSignUpModalOpen}
        onSwitchToLogin={() => {
          setIsSignUpModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onContinueWithEmail={() => {
          setIsEmailSignupModalOpen(true);
        }}
      />

      <EmailSignupModal
        isOpen={isEmailSignupModalOpen}
        onOpenChange={setIsEmailSignupModalOpen}
        onSignupSuccess={() => {
          setIsSignUpModalOpen(false);
          // Modal will reload the page to refresh auth state
        }}
        onSwitchToLogin={() => {
          setIsEmailSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <EmailLoginModal
        isOpen={isEmailLoginModalOpen}
        onOpenChange={setIsEmailLoginModalOpen}
        onLoginSuccess={() => {
          // Modal will reload the page to refresh auth state
        }}
        onSwitchToSignUp={() => {
          setIsEmailLoginModalOpen(false);
          setIsSignUpModalOpen(true);
        }}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      />
    </>
  );
}
