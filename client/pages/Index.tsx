import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import { SignUpModal } from "@/components/ui/signup-modal";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { PrivacyModal } from "@/components/ui/privacy-modal";
import { TermsModal } from "@/components/ui/terms-modal";
import { CookiesModal } from "@/components/ui/cookies-modal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Search,
  MapPin,
  Star,
  Users,
  Shield,
  Zap,
  Menu,
  ChevronRight,
  Car,
  Clock,
  Heart,
} from "lucide-react";

export default function Index() {
  const [pickupDate, setPickupDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isCookiesModalOpen, setIsCookiesModalOpen] = useState(false);

  const featuredCars = [
    {
      id: 1,
      name: "Riding Lawn Mower",
      price: "$45",
      rating: 4.9,
      image:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Sarah",
      type: "Landscaping",
      distance: "2.3 miles",
    },
    {
      id: 2,
      name: "Designer Dress",
      price: "$35",
      rating: 4.8,
      image:
        "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Michael",
      type: "Clothing",
      distance: "1.8 miles",
    },
    {
      id: 3,
      name: "Professional Tool Set",
      price: "$25",
      rating: 4.7,
      image:
        "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Alex",
      type: "Tools",
      distance: "3.1 miles",
    },
  ];

  const categories = [
    { name: "Landscaping", icon: "🌻", count: "500+" },
    { name: "Clothing", icon: "👗", count: "300+" },
    { name: "Tools", icon: "🔨", count: "800+" },
    { name: "Tech", icon: "📷", count: "150+" },
    { name: "Party", icon: "🎈", count: "200+" },
    { name: "Instruments", icon: "🎷", count: "50+" },
  ];

  const benefits = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Community-based",
      description:
        "Join thousands of members nationwide in our peer-to-peer sharing network.",
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Protection included",
      description:
        "Every rental includes comprehensive insurance coverage and live chat assistance.",
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Instant booking",
      description:
        "Book instantly with renters who have enabled Instant Book for immediate confirmation.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border/40 dark:border-gray-700/40">
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

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/11727078/pexels-photo-11727078.jpeg?w=1200&h=600&fit=crop&auto=format')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Rent from
            <br />
            peers
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            Rent anything, anywhere
          </p>

          {/* Search Form */}
          <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Where"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 h-14 text-lg border border-primary/20 dark:border-0 focus-visible:ring-1 dark:bg-gray-700 dark:placeholder:text-gray-400"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-14 justify-start text-left font-normal border border-primary/20 dark:border-0 focus-visible:ring-1 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white",
                        !pickupDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {pickupDate ? format(pickupDate, "MMM dd") : "Pick up"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={setPickupDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-14 justify-start text-left font-normal border border-primary/20 dark:border-0 focus-visible:ring-1 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white",
                        !returnDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {returnDate ? format(returnDate, "MMM dd") : "Return"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={setReturnDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button size="lg" className="w-full mt-6 h-14 text-lg relative">
                <span className="flex items-center justify-center w-full">
                  Search
                </span>
                <Search className="h-5 w-5 absolute left-1/2 -translate-x-16" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="py-16 bg-accent/30 dark:bg-gray-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Browse by category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">
                    <p>{category.icon}</p>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">
                    {category.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {category.count}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Recently listed near you
            </h2>
            <Button variant="ghost" className="group">
              View all
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCars.map((car) => (
              <ProductCard
                key={car.id}
                id={car.id}
                name={car.name}
                price={car.price}
                rating={car.rating}
                image={car.image}
                host={car.host}
                type={car.type}
                distance={car.distance}
                onClick={() => {
                  // Navigate to product details
                  window.location.href = `/product/${car.id}`;
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-accent/30 dark:bg-gray-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why choose Trio?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of people who choose Trio for their rental needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <a href="/browse">Browse listings</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary"
              asChild
            >
              <a href="/upload">Rent your item</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-semibold mb-4">Trio</div>
              <p className="text-muted-foreground">
                The nation's largest rental marketplace.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Rent</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse listings
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Weddings & events
                  </a>
                </li>

              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Host</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="/upload"
                    className="hover:text-foreground transition-colors"
                  >
                    Rent your product
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Insurance
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact us
                  </a>
                </li>

              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2025 Trio. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => setIsTermsModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => setIsCookiesModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </footer>

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
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onOpenChange={setIsPrivacyModalOpen}
      />
      <TermsModal
        isOpen={isTermsModalOpen}
        onOpenChange={setIsTermsModalOpen}
      />
      <CookiesModal
        isOpen={isCookiesModalOpen}
        onOpenChange={setIsCookiesModalOpen}
      />
    </div>
  );
}
