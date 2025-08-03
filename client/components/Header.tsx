import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

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

      {/* Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome back</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full"
              />
            </div>
            <Button className="w-full">Sign in</Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setIsSignUpModalOpen(true);
                }}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal */}
      <Dialog open={isSignUpModalOpen} onOpenChange={setIsSignUpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create your account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                className="w-full"
              />
            </div>
            <Button className="w-full">Create account</Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => {
                  setIsSignUpModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
