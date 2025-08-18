import { useState } from "react";
import { MessageCircle, Menu, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { LoginModal } from "./ui/login-modal";
import { SignUpModal } from "./ui/signup-modal";
import { MobileMenu } from "./ui/mobile-menu";
import {
  spacing,
  typography,
  animations,
  layouts,
  zIndex,
  combineTokens,
} from "@/lib/design-tokens";

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={combineTokens(
          "relative",
          zIndex.header,
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border/40 dark:border-gray-700/40",
        )}
      >
        <div className={layouts.container}>
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
                  Trio
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

              {/* Order History Link */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                title="Order History"
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
                  src="https://images.unsplash.com/photo-1494790108755-2616b612-1.jpg?w=200&h=200&fit=crop&auto=format"
                  alt="Profile"
                />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <ThemeToggle />
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
      />

      <SignUpModal
        isOpen={isSignUpModalOpen}
        onOpenChange={setIsSignUpModalOpen}
        onSwitchToLogin={() => {
          setIsSignUpModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      />
    </>
  );
}
