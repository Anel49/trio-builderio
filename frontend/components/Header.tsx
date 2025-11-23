import { useState } from "react";
import { MessageCircle, Menu, ClipboardList, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { LoginModal } from "./ui/login-modal";
import { SignUpModal } from "./ui/signup-modal";
import { EmailSignupModal } from "./ui/email-signup-modal";
import { EmailLoginModal } from "./ui/email-login-modal";
import { MobileMenu } from "./ui/mobile-menu";
import { FavoritesModal } from "./ui/favorites-modal";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

export default function Header() {
  const { authenticated, user, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isEmailSignupModalOpen, setIsEmailSignupModalOpen] = useState(false);
  const [isEmailLoginModalOpen, setIsEmailLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  const getInitials = (name: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    setIsContextMenuOpen(false);
    await logout();
    window.location.reload();
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
                {authenticated && (
                  <a
                    href="/upload"
                    className="text-foreground hover:text-primary transition-colors mt-[2px] ml-8"
                  >
                    Rent your product
                  </a>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {!authenticated && (
                <>
                  <Button
                    variant="ghost"
                    className="pt-[6px] pb-[8px] px-4"
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
                  <a
                    href="/messages"
                    className="relative inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors h-10 w-10 [&_svg]:size-4"
                    title="Messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>

                  {/* Favorites Link */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    title="Favorites"
                    onClick={() => setIsFavoritesModalOpen(true)}
                  >
                    <Heart className="h-5 w-5" />
                  </Button>

                  {/* Rentals and Requests Link */}
                  <a
                    href="/rentals-and-requests"
                    className="relative hidden sm:inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors h-10 w-10 [&_svg]:size-4"
                    title="Rentals and Requests"
                  >
                    <ClipboardList className="h-5 w-5" />
                  </a>

                  {/* Profile Picture with Right-Click Menu */}
                  <div className="relative">
                    <button
                      onClick={() => window.location.href = "/profile"}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setIsContextMenuOpen(true);
                      }}
                      className="inline-flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
                      title="Profile"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user?.avatarUrl || undefined}
                          alt={user?.name || "Profile"}
                        />
                        <AvatarFallback>
                          {getInitials(user?.name || null)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    {isContextMenuOpen && (
                      <div
                        className="absolute right-0 mt-1 w-40 bg-popover border border-border rounded-md shadow-md z-50"
                        onMouseLeave={() => setIsContextMenuOpen(false)}
                      >
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent rounded-md"
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
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

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onOpenChange={setIsFavoritesModalOpen}
        userId={user?.id.toString()}
      />
    </>
  );
}
