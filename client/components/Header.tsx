import { useState } from "react";
import { MessageCircle, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { LoginModal } from "./ui/login-modal";
import { SignUpModal } from "./ui/signup-modal";
import { MobileMenu } from "./ui/mobile-menu";

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="relative z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border/40 dark:border-gray-700/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-semibold">
                <a href="/" className="hover:text-primary transition-colors">
                  Trio
                </a>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a
                  href="/browse"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Browse listings
                </a>
                <a
                  href="/upload"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Rent your product
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="hidden md:inline-flex"
                onClick={() => setIsLoginModalOpen(true)}
              >
                Log in
              </Button>
              <Button onClick={() => setIsSignUpModalOpen(true)}>
                Sign up
              </Button>

              {/* Messages Link */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => (window.location.href = "/messages")}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>

              {/* Profile Picture Link */}
              <Avatar
                className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => (window.location.href = "/profile")}
              >
                <AvatarImage
                  src="https://images.unsplash.com/photo-1494790108755-2616b612-1.jpg?w=200&h=200&fit=crop&auto=format"
                  alt="Profile"
                />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <ThemeToggle />
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
    </>
  );
}
