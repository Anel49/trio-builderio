import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import Header from "@/components/Header";
import { Container } from "@/components/Container";
import { SignUpModal } from "@/components/ui/signup-modal";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { FavoritesModal } from "@/components/ui/favorites-modal";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Star,
  Heart,
  Filter,
  SlidersHorizontal,
  Search,
  Menu,
  Car,
  MessageCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

// CSS animation for price popup fade in effect
const fadeInStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

export default function BrowseListings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [favoritedListing, setFavoritedListing] = useState("");
  const [dateRange, setDateRange] = useState<{start: Date | undefined, end: Date | undefined}>({
    start: undefined,
    end: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleFavorite = (listingName: string) => {
    setFavoritedListing(listingName);
    setIsFavoritesModalOpen(true);
  };

  const listings = [
    {
      id: 1,
      name: "Professional Lawn Mower",
      price: "$45",
      rating: 4.9,
      reviews: 142,
      image:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Sarah M.",
      type: "Landscaping",
      location: "San Francisco, CA",
      distance: "2.3 miles",
      lat: 37.7749,
      lng: -122.4194,
    },
    {
      id: 2,
      name: "Designer Wedding Dress",
      price: "$85",
      rating: 4.8,
      reviews: 89,
      image:
        "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Michael R.",
      type: "Clothing",
      location: "Oakland, CA",
      distance: "5.1 miles",
      lat: 37.8044,
      lng: -122.2712,
    },
    {
      id: 3,
      name: "Complete Tool Set",
      price: "$35",
      rating: 4.7,
      reviews: 203,
      image:
        "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Alex K.",
      type: "Tools",
      location: "Berkeley, CA",
      distance: "8.7 miles",
      lat: 37.8715,
      lng: -122.273,
    },
    {
      id: 4,
      name: "Professional Camera Kit",
      price: "$75",
      rating: 4.9,
      reviews: 156,
      image:
        "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=250&fit=crop&auto=format",
      host: "Emma L.",
      type: "Tech",
      location: "Palo Alto, CA",
      distance: "12.4 miles",
      lat: 37.4419,
      lng: -122.143,
    },
    {
      id: 5,
      name: "Party Sound System",
      price: "$55",
      rating: 4.6,
      reviews: 94,
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format",
      host: "David H.",
      type: "Party",
      location: "San Jose, CA",
      distance: "15.2 miles",
      lat: 37.3382,
      lng: -121.8863,
    },
    {
      id: 6,
      name: "Electric Guitar",
      price: "$40",
      rating: 4.8,
      reviews: 67,
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format",
      host: "Jessica T.",
      type: "Instruments",
      location: "Fremont, CA",
      distance: "18.9 miles",
      lat: 37.5485,
      lng: -121.9886,
    },
  ];

  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [hoveredListing, setHoveredListing] = useState<number | null>(null);
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);
  const [showPricePopup, setShowPricePopup] = useState<number | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <style>{fadeInStyle}</style>
      <Header />

      {/* Search Bar */}
      <section className="bg-accent/30 dark:bg-gray-800/30 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content - 70/30 Split */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Side - Listings Grid (70%) */}
          <div className="flex-1" style={{ width: "70%" }}>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {listings.length} listings near you
              </h1>
              <p className="text-muted-foreground">
                Discover amazing items available for rent in your area
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <div key={listing.id} id={`listing-${listing.id}`}>
                  <ProductCard
                    id={listing.id}
                    name={listing.name}
                    price={listing.price}
                    rating={listing.rating}
                    reviews={listing.reviews}
                    image={listing.image}
                    host={listing.host}
                    type={listing.type}
                    distance={listing.distance}
                    onFavorite={handleFavorite}
                    className={cn(
                      selectedListing === listing.id &&
                        "ring-2 ring-primary scale-105",
                      hoveredListing === listing.id && "scale-105",
                    )}
                    onMouseEnter={() => setHoveredListing(listing.id)}
                    onMouseLeave={() => setHoveredListing(null)}
                    onClick={() => {
                      setSelectedListing(listing.id);
                      window.location.href = `/product/${listing.id}`;
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg">
                Load more listings
              </Button>
            </div>
          </div>

          {/* Right Side - Interactive Map (30%) */}
          <div className="hidden lg:block" style={{ width: "30%" }}>
            <div className="sticky top-8">
              <Card className="h-[600px] overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  {/* Map Placeholder */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
                    {/* Map Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100"></div>

                    {/* Map Markers */}
                    <div className="absolute inset-0">
                      {listings.map((listing, index) => (
                        <div
                          key={listing.id}
                          className="absolute"
                          style={{
                            left: `${20 + index * 15}%`,
                            top: `${25 + index * 12}%`,
                          }}
                        >
                          {/* Map Pin */}
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 relative",
                              // Default style: light gray background, darker gray border, black text
                              selectedListing === listing.id ||
                                hoveredListing === listing.id
                                ? "bg-primary border-white scale-125 z-10"
                                : "bg-gray-200 border-gray-400 hover:scale-110",
                            )}
                            onClick={() => {
                              setSelectedListing(listing.id);
                              // Scroll to the listing
                              const listingElement = document.getElementById(
                                `listing-${listing.id}`,
                              );
                              if (listingElement) {
                                listingElement.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }
                            }}
                            onMouseEnter={() => {
                              setHoveredPin(listing.id);
                              // Set timeout for price popup
                              const timeout = setTimeout(() => {
                                setShowPricePopup(listing.id);
                              }, 200);
                              setHoverTimeout(timeout);
                            }}
                            onMouseLeave={() => {
                              setHoveredPin(null);
                              // Clear timeout and hide popup unless pin is selected
                              if (hoverTimeout) {
                                clearTimeout(hoverTimeout);
                                setHoverTimeout(null);
                              }
                              if (selectedListing !== listing.id) {
                                setShowPricePopup(null);
                              }
                            }}
                          >
                            <span
                              className={cn(
                                "text-base font-bold transition-colors duration-200",
                                selectedListing === listing.id ||
                                  hoveredListing === listing.id
                                  ? "text-white"
                                  : "text-black",
                              )}
                              style={{
                                transform:
                                  selectedListing === listing.id ||
                                  hoveredListing === listing.id
                                    ? "scale(0.8)"
                                    : "scale(1)",
                              }}
                            >
                              {index + 1}
                            </span>
                          </div>

                          {/* Price Popup */}
                          {(showPricePopup === listing.id ||
                            selectedListing === listing.id) && (
                            <div
                              className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-2 rounded text-sm font-semibold whitespace-nowrap shadow-lg z-20"
                              style={{
                                animation:
                                  showPricePopup === listing.id
                                    ? "fadeIn 0.2s ease-in"
                                    : undefined,
                              }}
                            >
                              {listing.price}/day
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Map Controls */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0 flex items-center justify-center"
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0 flex items-center justify-center"
                      >
                        −
                      </Button>
                    </div>

                    {/* Map Label */}
                    <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-lg">
                      <p className="text-sm font-medium dark:text-white">
                        Interactive Map
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-300">
                        Click markers to view details
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

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
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onOpenChange={setIsFavoritesModalOpen}
        listingTitle={favoritedListing}
      />
    </div>
  );
}
