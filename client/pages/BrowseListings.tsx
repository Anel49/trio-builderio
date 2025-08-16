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
  Map,
  X,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

// CSS animation for price popup fade in effect and calendar range styling
const fadeInStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .calendar-with-range-styling .rdp-day_range_middle {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }

  .calendar-with-range-styling .rdp-day_range_start,
  .calendar-with-range-styling .rdp-day_range_end {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }
`;

export default function BrowseListings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [favoritedListing, setFavoritedListing] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    maxDistance: "",
    zipCode: "",
    category: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: "",
    maxPrice: "",
    maxDistance: "",
    zipCode: "",
    category: "",
  });

  // Sort state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");

  const handleFavorite = (listingName: string) => {
    setFavoritedListing(listingName);
    setIsFavoritesModalOpen(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      // First click or reset - set start date
      setDateRange({ start: date, end: undefined });
    } else if (dateRange.start && !dateRange.end) {
      // Second click - set end date
      if (date >= dateRange.start) {
        setDateRange({ ...dateRange, end: date });
        setIsDatePickerOpen(false);
      } else {
        // If selected date is before start date, make it the new start date
        setDateRange({ start: date, end: undefined });
      }
    }
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
      listedTime: "23 mins ago",
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
      listedTime: "1 hour ago",
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
      listedTime: "3 hours ago",
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
      listedTime: "2 days ago",
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
      listedTime: "5 hours ago",
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
      listedTime: "1 day ago",
    },
  ];

  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [hoveredListing, setHoveredListing] = useState<number | null>(null);
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);
  const [showPricePopup, setShowPricePopup] = useState<number | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Mobile map popup state
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);

  // Helper function to convert time strings to minutes for sorting
  const getTimeInMinutes = (timeStr: string): number => {
    if (timeStr.includes("mins")) {
      return parseInt(timeStr.replace(" mins ago", ""));
    } else if (timeStr.includes("hour")) {
      return (
        parseInt(timeStr.replace(" hours ago", "").replace(" hour ago", "")) *
        60
      );
    } else if (timeStr.includes("day")) {
      return (
        parseInt(timeStr.replace(" days ago", "").replace(" day ago", "")) *
        24 *
        60
      );
    }
    return 0;
  };

  // Filter and sort listings
  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = listings.filter((listing) => {
      // Search query filter
      if (
        searchQuery &&
        !listing.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Price filter
      if (appliedFilters.minPrice) {
        const price = parseInt(listing.price.replace("$", ""));
        if (price < parseInt(appliedFilters.minPrice)) return false;
      }
      if (appliedFilters.maxPrice) {
        const price = parseInt(listing.price.replace("$", ""));
        if (price > parseInt(appliedFilters.maxPrice)) return false;
      }

      // Category filter
      if (appliedFilters.category && listing.type !== appliedFilters.category) {
        return false;
      }

      // Distance filter (simplified - in real app would calculate based on zip code)
      if (appliedFilters.maxDistance && appliedFilters.zipCode) {
        const distance = parseFloat(listing.distance.replace(" miles", ""));
        if (distance > parseInt(appliedFilters.maxDistance)) return false;
      }

      return true;
    });

    // Sort listings
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "distance-asc":
            return (
              parseFloat(a.distance.replace(" miles", "")) -
              parseFloat(b.distance.replace(" miles", ""))
            );
          case "distance-desc":
            return (
              parseFloat(b.distance.replace(" miles", "")) -
              parseFloat(a.distance.replace(" miles", ""))
            );
          case "price-asc":
            return (
              parseInt(a.price.replace("$", "")) -
              parseInt(b.price.replace("$", ""))
            );
          case "price-desc":
            return (
              parseInt(b.price.replace("$", "")) -
              parseInt(a.price.replace("$", ""))
            );
          case "time-asc":
            // Recently listed first - parse time strings
            return (
              getTimeInMinutes(a.listedTime) - getTimeInMinutes(b.listedTime)
            );
          case "time-desc":
            // Oldest listed first
            return (
              getTimeInMinutes(b.listedTime) - getTimeInMinutes(a.listedTime)
            );
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [listings, searchQuery, appliedFilters, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <style>{fadeInStyle}</style>
      <Header />

      {/* Search Bar */}
      <section className="bg-accent/30 dark:bg-gray-800/30 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center md:mr-0" style={{ marginRight: window.innerWidth <= 991 ? '-3px' : '0' }}>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
                style={{ marginRight: window.innerWidth <= 991 ? '176px' : '0' }}
              />
            </div>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.start && dateRange.end
                    ? `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd")}`
                    : dateRange.start
                      ? `${format(dateRange.start, "MMM dd")} - End`
                      : "Dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="calendar-with-range-styling">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.start,
                      to: dateRange.end,
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        if (!dateRange.start || range.to) {
                          // First click or both dates selected
                          setDateRange({
                            start: range.from,
                            end: range.to,
                          });
                          // Don't auto-close when end date is selected
                        }
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    numberOfMonths={1}
                  />
                </div>
                {dateRange.start && (
                  <div className="p-4 border-t">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => {
                        setDateRange({ start: undefined, end: undefined });
                      }}
                      className="w-full"
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-4">
                <div className="space-y-4">
                  {/* Price Filter */}
                  <div>
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="text"
                          placeholder="Min"
                          value={filters.minPrice}
                          onChange={(e) =>
                            setFilters({ ...filters, minPrice: e.target.value })
                          }
                          className="pl-8"
                        />
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="text"
                          placeholder="Max"
                          value={filters.maxPrice}
                          onChange={(e) =>
                            setFilters({ ...filters, maxPrice: e.target.value })
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Distance Filter */}
                  <div>
                    <Label className="text-sm font-medium">Distance</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        placeholder="Miles"
                        value={filters.maxDistance}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxDistance: e.target.value,
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        miles from
                      </span>
                      <Input
                        placeholder="Zip code"
                        value={filters.zipCode}
                        onChange={(e) =>
                          setFilters({ ...filters, zipCode: e.target.value })
                        }
                        className="w-24"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        setFilters({ ...filters, category: e.target.value })
                      }
                      className="w-full mt-2 p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">All Categories</option>
                      <option value="Landscaping">Landscaping</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Tools">Tools</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Sports">Sports</option>
                      <option value="Instruments">Instruments</option>
                    </select>
                  </div>

                  {/* Apply Button */}
                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      setAppliedFilters(filters);
                      setIsFilterOpen(false);
                    }}
                  >
                    Apply filter
                  </Button>

                  {/* Clear Button */}
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      const emptyFilters = {
                        minPrice: "",
                        maxPrice: "",
                        maxDistance: "",
                        zipCode: "",
                        category: "",
                      };
                      setFilters(emptyFilters);
                      setAppliedFilters(emptyFilters);
                    }}
                  >
                    Clear filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu open={isSortOpen} onOpenChange={setIsSortOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <DropdownMenuRadioItem value="distance-asc">
                    Distance (Closest First)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="distance-desc">
                    Distance (Farthest First)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price-asc">
                    Price (Low to High)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price-desc">
                    Price (High to Low)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="time-asc">
                    Recently Listed
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="time-desc">
                    Oldest Listed
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
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
              {filteredAndSortedListings.map((listing) => (
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
                    listedTime={listing.listedTime}
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
                      {filteredAndSortedListings.map((listing, index) => (
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
