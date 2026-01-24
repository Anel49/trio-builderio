import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Menu, ClipboardList, Heart, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { LoginModal } from "./ui/login-modal";
import { SignUpModal } from "./ui/signup-modal";
import { EmailSignupModal } from "./ui/email-signup-modal";
import { EmailLoginModal } from "./ui/email-login-modal";
import { MobileMenu } from "./ui/mobile-menu";
import { FavoritesModal } from "./ui/favorites-modal";
import { BankingSetupModal } from "./ui/banking-setup-modal";
import { IdentificationRequiredModal } from "./ui/identification-required-modal";
import { PendingIdentityModal } from "./ui/pending-identity-modal";
import { AccountDeactivatedModal } from "./ui/account-deactivated-modal";
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
import {
  SuccessModal,
  ConfirmationModal,
  BinaryModal,
  LoadingModal,
} from "./ui/modal-templates";

export default function Header() {
  const { authenticated, user, logout, checkAuth } = useAuth();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isEmailSignupModalOpen, setIsEmailSignupModalOpen] = useState(false);
  const [isEmailLoginModalOpen, setIsEmailLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [
    isIdentificationRequiredModalOpen,
    setIsIdentificationRequiredModalOpen,
  ] = useState(false);
  const [isPendingIdentityModalOpen, setIsPendingIdentityModalOpen] =
    useState(false);
  const [isBankingSetupModalOpen, setIsBankingSetupModalOpen] = useState(false);
  const [isAccountDeactivatedModalOpen, setIsAccountDeactivatedModalOpen] =
    useState(false);

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // Demo modal states
  const [isSuccessModalDemoOpen, setIsSuccessModalDemoOpen] = useState(false);
  const [isConfirmationModalDemoOpen, setIsConfirmationModalDemoOpen] =
    useState(false);
  const [isBinaryModalDemoOpen, setIsBinaryModalDemoOpen] = useState(false);
  const [isLoadingModalDemoOpen, setIsLoadingModalDemoOpen] = useState(false);

  useEffect(() => {
    if (authenticated && user && !user.active) {
      setIsAccountDeactivatedModalOpen(true);
    }
  }, [authenticated, user]);

  useEffect(() => {
    if (authenticated) {
      checkAuth();
    }
  }, [location.pathname, authenticated]);

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
              "leading-none",
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
                  <>
                    <button
                      onClick={() => {
                        if (user?.pendingIdentityVer === null) {
                          setIsIdentificationRequiredModalOpen(true);
                        } else if (user?.pendingIdentityVer === true) {
                          setIsPendingIdentityModalOpen(true);
                        } else if (!user?.stripeSecret) {
                          setIsBankingSetupModalOpen(true);
                        } else {
                          window.location.href = "/upload";
                        }
                      }}
                      className={`transition-colors mt-[2px] ml-8 ${
                        user?.pendingIdentityVer === null ||
                        user?.pendingIdentityVer === true ||
                        !user?.stripeSecret
                          ? "text-muted-foreground opacity-50"
                          : "text-foreground hover:text-primary"
                      }`}
                    >
                      Rent your product
                    </button>
                    {/* Demo Modal Buttons */}
                    <button
                      onClick={() => setIsSuccessModalDemoOpen(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors ml-4 opacity-75"
                    >
                      success-modal
                    </button>
                    <button
                      onClick={() => setIsConfirmationModalDemoOpen(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors opacity-75"
                    >
                      confirmation-modal
                    </button>
                    <button
                      onClick={() => setIsBinaryModalDemoOpen(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors opacity-75"
                    >
                      binary-modal
                    </button>
                    <button
                      onClick={() => setIsLoadingModalDemoOpen(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors opacity-75"
                    >
                      loading-modal
                    </button>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4 leading-none">
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
                  <div className="relative leading-none h-8">
                    <a
                      href="/profile"
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                          e.preventDefault();
                          window.location.href = "/profile";
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setIsContextMenuOpen(true);
                      }}
                      className="inline-flex items-center justify-center rounded-full hover:opacity-80 transition-opacity p-0 h-8 w-8 leading-none"
                      title="Profile"
                    >
                      <Avatar className="h-full w-full flex-shrink-0">
                        <AvatarImage
                          src={user?.avatarUrl || undefined}
                          alt={user?.name || "Profile"}
                        />
                        <AvatarFallback>
                          {getInitials(user?.name || null)}
                        </AvatarFallback>
                      </Avatar>
                    </a>
                    {isContextMenuOpen && (
                      <div
                        className="absolute right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-[100]"
                        onMouseLeave={() => setIsContextMenuOpen(false)}
                      >
                        {(user?.admin || user?.moderator) && (
                          <a
                            href="/admin"
                            className="text-left block px-3 py-1.5 text-sm hover:bg-accent rounded-sm rounded-b-none whitespace-nowrap"
                          >
                            Admin Dashboard
                          </a>
                        )}
                        <button
                          onClick={handleLogout}
                          className={`text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm whitespace-nowrap w-full ${
                            user?.admin || user?.moderator
                              ? "rounded-t-none"
                              : ""
                          }`}
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
        onOpenChange={(open) => {
          console.log(
            "[Header] EmailSignupModal onOpenChange called, open:",
            open,
          );
          setIsEmailSignupModalOpen(open);
        }}
        onSignupSuccess={() => {
          console.log(
            "[Header] EmailSignupModal onSignupSuccess callback fired",
          );
          setIsSignUpModalOpen(false);
          // Modal will reload the page to refresh auth state
        }}
        onSwitchToLogin={() => {
          console.log(
            "[Header] EmailSignupModal onSwitchToLogin callback fired",
          );
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
        onOpenIdentificationRequiredModal={() =>
          setIsIdentificationRequiredModalOpen(true)
        }
        onOpenPendingIdentityModal={() => setIsPendingIdentityModalOpen(true)}
        onOpenBankingSetupModal={() => setIsBankingSetupModalOpen(true)}
      />

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onOpenChange={setIsFavoritesModalOpen}
        userId={user?.id.toString()}
      />

      <IdentificationRequiredModal
        isOpen={isIdentificationRequiredModalOpen}
        onOpenChange={setIsIdentificationRequiredModalOpen}
      />

      <PendingIdentityModal
        isOpen={isPendingIdentityModalOpen}
        onOpenChange={setIsPendingIdentityModalOpen}
      />

      <BankingSetupModal
        isOpen={isBankingSetupModalOpen}
        onOpenChange={setIsBankingSetupModalOpen}
      />

      <AccountDeactivatedModal
        isOpen={isAccountDeactivatedModalOpen}
        onOpenChange={async (open) => {
          if (!open) {
            setIsAccountDeactivatedModalOpen(false);
            await logout();
            window.location.href = "/";
          }
        }}
      />

      {/* Demo Modal Implementations */}
      <SuccessModal
        isOpen={isSuccessModalDemoOpen}
        onOpenChange={setIsSuccessModalDemoOpen}
        title="Success!"
        description="Your action was completed successfully."
        icon={<CheckCircle2 className="h-12 w-12 text-green-500" />}
      />

      <ConfirmationModal
        isOpen={isConfirmationModalDemoOpen}
        onOpenChange={setIsConfirmationModalDemoOpen}
        title="Confirm Action"
        description="Do you understand the implications of this action?"
        confirmLabel="I Understand"
        onConfirm={() => {
          console.log("Confirmation received");
          setIsConfirmationModalDemoOpen(false);
        }}
      />

      <BinaryModal
        isOpen={isBinaryModalDemoOpen}
        onOpenChange={setIsBinaryModalDemoOpen}
        title="Delete Item?"
        description="This action cannot be undone."
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimary={() => {
          console.log("Delete confirmed");
          setIsBinaryModalDemoOpen(false);
        }}
        onSecondary={() => {
          console.log("Canceled");
          setIsBinaryModalDemoOpen(false);
        }}
        isDangerous
      />

      <LoadingModal
        isOpen={isLoadingModalDemoOpen}
        onOpenChange={setIsLoadingModalDemoOpen}
        text="Loading demo content..."
      />
    </>
  );
}
