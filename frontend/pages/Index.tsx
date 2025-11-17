import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/use-page-title";
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
import { COMPANY_NAME } from "@/lib/constants";
import { ProductCard } from "@/components/ui/product-card";
import Header from "@/components/Header";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { CategoryCard } from "@/components/CategoryCard";
import { Footer } from "@/components/Footer";
import { SignUpModal } from "@/components/ui/signup-modal";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { PrivacyModal } from "@/components/ui/privacy-modal";
import { TermsModal } from "@/components/ui/terms-modal";
import { CookiesModal } from "@/components/ui/cookies-modal";
import { FavoritesModal } from "@/components/ui/favorites-modal";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { ViewAllButton } from "@/components/ui/view-all-button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
// import { usePageLoading } from "@/contexts/PageLoadingContext";
import {
  computeDistanceMiles,
  extractCoordinates,
  formatDistanceLabel,
} from "@/lib/geo";
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
  ChevronLeft,
  Clock,
  Heart,
  MessageCircle,
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { user: authUser, authenticated } = useAuth();
  // const { setPageLoading } = usePageLoading();

  usePageTitle();

  // useEffect(() => {
  //   setPageLoading(false);
  // }, [setPageLoading]);

  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isCookiesModalOpen, setIsCookiesModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [favoritedListing, setFavoritedListing] = useState("");
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string | null;
  } | null>(null);

  const handleDateSelect = (range: any) => {
    if (range?.from) {
      if (!dateRange.start || range.to) {
        // First click or both dates selected
        setDateRange({
          start: range.from,
          end: range.to,
        });
        // Don't close the picker automatically - let user click outside or toggle button
      }
    }
  };

  const handleFavorite = (listingName: string) => {
    setFavoritedListing(listingName);
    setIsFavoritesModalOpen(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const params = new URLSearchParams();

      if (location) {
        params.set("q", location);
      }

      if (dateRange.start) {
        params.set("startDate", dateRange.start.toISOString().split("T")[0]);
      }

      if (dateRange.end) {
        params.set("endDate", dateRange.end.toISOString().split("T")[0]);
      }

      if (searchLocation) {
        params.set("latitude", searchLocation.latitude.toString());
        params.set("longitude", searchLocation.longitude.toString());
        if (searchLocation.city) {
          params.set("city", searchLocation.city);
        }
      }

      navigate(`/browse${params.toString() ? "?" + params.toString() : ""}`);
    }
  };

  const featuredListings = [
    {
      id: 1,
      name: "Riding Lawn Mower",
      price: "$45",
      rating: 4.9,
      reviews: 18,
      image:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Sarah",
      hostUserId: 2,
      hostUsername: "sarahsmith",
      type: "Landscaping",
      categories: ["Landscaping", "Garden", "Tools"],
      distance: null,
      delivery: true,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 2,
      name: "Designer Dress",
      price: "$35",
      rating: 4.8,
      reviews: 24,
      image:
        "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Michael",
      hostUserId: 3,
      hostUsername: "michaeljones",
      type: "Clothing",
      categories: ["Clothing", "Fashion"],
      distance: null,
      delivery: true,
      freeDelivery: true,
      instantBookings: false,
    },
    {
      id: 3,
      name: "Professional Tool Set",
      price: "$25",
      rating: 4.7,
      reviews: 15,
      image:
        "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Alex",
      hostUserId: 4,
      hostUsername: "alexwilson",
      type: "Tools",
      categories: ["Tools", "Hardware"],
      distance: null,
      delivery: false,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 4,
      name: "Pro Camera Kit",
      price: "$75",
      rating: 4.9,
      reviews: 32,
      image:
        "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=250&fit=crop&auto=format",
      host: "Emma",
      hostUserId: 5,
      hostUsername: "emmadavis",
      type: "Tech",
      categories: ["Tech", "Photography", "Electronics"],
      distance: null,
      delivery: true,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 5,
      name: "Party Sound System",
      price: "$55",
      rating: 4.6,
      reviews: 21,
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format",
      host: "David",
      hostUserId: 6,
      hostUsername: "davidbrown",
      type: "Party",
      categories: ["Party", "Audio", "Entertainment"],
      distance: null,
      delivery: true,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 6,
      name: "Mountain Bike",
      price: "$30",
      rating: 4.7,
      reviews: 27,
      image:
        "https://images.unsplash.com/photo-1518655048521-f130df041f66?w=400&h=250&fit=crop&auto=format",
      host: "Liam",
      hostUserId: 7,
      hostUsername: "liamatkins",
      type: "Outdoors",
      categories: ["Outdoors", "Sports", "Cycling"],
      distance: null,
      delivery: false,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 7,
      name: "Acoustic Guitar",
      price: "$22",
      rating: 4.5,
      reviews: 19,
      image:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=250&fit=crop&auto=format",
      host: "Noah",
      hostUserId: 8,
      hostUsername: "noahlee",
      type: "Instruments",
      categories: ["Instruments", "Music", "Audio"],
      distance: null,
      delivery: true,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 8,
      name: "Pressure Washer",
      price: "$28",
      rating: 4.6,
      reviews: 13,
      image:
        "https://images.unsplash.com/photo-1581578017422-3eaf2b6f62b7?w=400&h=250&fit=crop&auto=format",
      host: "Olivia",
      hostUserId: 9,
      hostUsername: "oliviawhite",
      type: "Tools",
      categories: ["Tools", "Cleaning"],
      distance: null,
      delivery: true,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 9,
      name: "Tuxedo Rental",
      price: "$40",
      rating: 4.4,
      reviews: 9,
      image:
        "https://images.unsplash.com/photo-1542060748-10c28b62716a?w=400&h=250&fit=crop&auto=format",
      host: "Mason",
      hostUserId: 10,
      hostUsername: "masonmartin",
      type: "Clothing",
      categories: ["Clothing", "Fashion", "Formal"],
      distance: null,
      delivery: true,
      freeDelivery: true,
      instantBookings: false,
    },
    {
      id: 10,
      name: "Camping Tent",
      price: "$18",
      rating: 4.3,
      reviews: 14,
      image:
        "https://images.unsplash.com/photo-1504280390368-3971e38c98e8?w=400&h=250&fit=crop&auto=format",
      host: "Ava",
      hostUserId: 11,
      hostUsername: "avagarcia",
      type: "Outdoors",
      categories: ["Outdoors", "Camping", "Sports"],
      distance: null,
      delivery: false,
      freeDelivery: false,
      instantBookings: false,
    },
    {
      id: 11,
      name: "Power Drill Kit",
      price: "$32",
      rating: 4.8,
      reviews: 26,
      image:
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=250&fit=crop&auto=format",
      host: "James",
      hostUsername: "jamesrodriguez",
      type: "Tools",
      categories: ["Tools", "Hardware", "Power Tools"],
      distance: null,
      delivery: true,
      freeDelivery: false,
      instantBookings: false,
    },
  ];

  const [listings, setListings] = useState(featuredListings);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch("listings");
        if (!response.ok || cancelled) return;
        const d = await response.json().catch(() => null);
        if (!d || !d.ok || !Array.isArray(d.listings) || cancelled) return;

        // Only use user location if authenticated and has location
        const userCoords =
          authenticated &&
          authUser?.locationLatitude &&
          authUser?.locationLongitude
            ? {
                latitude: authUser.locationLatitude,
                longitude: authUser.locationLongitude,
              }
            : null;

        const mapped = d.listings.map((l: any) => {
          let distance = null;
          let distanceMiles = null;

          // Only calculate distance if user is authenticated and has location
          if (userCoords) {
            const listingCoords = extractCoordinates(l);
            distanceMiles = computeDistanceMiles(userCoords, listingCoords);
            distance = formatDistanceLabel(distanceMiles);
          }

          return {
            ...l,
            distance,
            distanceMiles,
          };
        });

        // Filter out user's own listings
        const filtered =
          authenticated && authUser?.id
            ? mapped.filter((l: any) => l.hostUserId !== authUser.id)
            : mapped;

        // Sort by distance if user is authenticated and has location, otherwise by most recent
        const sorted = userCoords
          ? filtered.sort(
              (a, b) =>
                (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity),
            )
          : filtered.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA; // Most recent first
            });
        const limited = sorted.slice(0, 9);

        if (!cancelled) {
          setListings(limited);
        }
      } catch {
        if (!cancelled) {
          // keep local featuredListings fallback silently
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, authUser]);

  const categories = [
    { name: "Furniture", icon: "🪑" },
    { name: "Clothing", icon: "👗" },
    { name: "Tools", icon: "🔨" },
    { name: "Tech", icon: "💻" },
    { name: "Party", icon: "🎈" },
    { name: "Instruments", icon: "🎷" },
  ];

  const benefits = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Community-based",
      description:
        "Join us as we build the nation's largest peer-to-peer sharing network.",
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Protected",
      description:
        "Every rental comes with insurance coverage for added peace of mind.",
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      title: "American-Made",
      description:
        "All profits generated by this platform are reinvested into the U.S. economy.",
    },
  ];

  const listRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => setCanScrollLeft(el.scrollLeft > 0);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => el.removeEventListener("scroll", onScroll as any);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollLeft = 0;
    }
  }, [listings]);

  const scrollByPage = useCallback((dir: 1 | -1) => {
    const el = listRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.9;
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    let target = dir > 0 ? el.scrollLeft + amount : el.scrollLeft - amount;
    if (dir > 0 && el.scrollLeft + el.clientWidth >= maxScrollLeft - 5) {
      target = 0;
    }
    target = Math.max(0, Math.min(target, maxScrollLeft));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .calendar-with-range-styling .rdp-day_range_middle {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }

        .calendar-with-range-styling .rdp-day_range_start,
        .calendar-with-range-styling .rdp-day_range_end {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
      `}</style>
      <Header />

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

        <div className="relative z-10 text-center">
          <Container>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Rent from
              <br />
              peers
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
              Rent anything, anywhere
            </p>
          </Container>

          {/* Search Form */}
          <Card className="w-[70vw] mx-auto bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30">
            <CardContent className="p-6 mr-[3px]">
              <div className="grid grid-cols-1 md:grid-cols-[6fr_4fr] gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="What"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 h-14 text-lg md:text-lg border border-primary/20 dark:border-0 focus-visible:ring-1 dark:bg-gray-700 dark:placeholder:text-gray-400"
                  />
                </div>

                <div className="min-w-0 flex gap-2">
                  <Popover
                    open={isDatePickerOpen}
                    onOpenChange={setIsDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-14 text-lg justify-start text-left font-normal border border-primary/20 dark:border-0 focus-visible:ring-1 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white flex-1 min-w-0 overflow-hidden text-ellipsis",
                          !dateRange.start && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                        <span className="truncate">
                          {dateRange.start && dateRange.end
                            ? `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd")}`
                            : dateRange.start
                              ? `${format(dateRange.start, "MMM dd")} - End`
                              : "When"}
                        </span>
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
                          onSelect={handleDateSelect}
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
                              setDateRange({
                                start: undefined,
                                end: undefined,
                              });
                            }}
                            className="w-full"
                          >
                            Clear selection
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-14 w-14 flex-shrink-0 border border-primary/20 dark:border-0 focus-visible:ring-1 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white",
                      !searchLocation && "text-muted-foreground",
                      searchLocation &&
                        "bg-primary text-primary-foreground dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90",
                    )}
                    onClick={() => setIsLocationPickerOpen(true)}
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-6 h-14 text-lg relative"
                onClick={() => {
                  if (dateRange.start && dateRange.end) {
                    localStorage.setItem(
                      "searchDateRange",
                      JSON.stringify({
                        start: dateRange.start,
                        end: dateRange.end,
                      }),
                    );
                  } else {
                    localStorage.removeItem("searchDateRange");
                  }
                  if (searchLocation) {
                    localStorage.setItem(
                      "searchLocation",
                      JSON.stringify(searchLocation),
                    );
                  } else {
                    localStorage.removeItem("searchLocation");
                  }
                  window.location.href = "/browse";
                }}
              >
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
      <Section background="accent" padding="large">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Browse by category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              icon={category.icon}
              name={category.name}
              onClick={() =>
                navigate(
                  `/browse?categories=${encodeURIComponent(category.name)}`,
                )
              }
            />
          ))}
        </div>
      </Section>

      {/* Featured Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              {authUser?.locationLatitude && authUser?.locationLongitude
                ? "Recently listed near you"
                : "Recently listed"}
            </h2>
            <ViewAllButton />
          </div>

          <div className="relative">
            {/* Left Arrow */}
            {/* will show only when can go back */}
            {canScrollLeft && (
              <button
                aria-label="Previous"
                className="flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border rounded-full shadow p-2"
                onClick={() => scrollByPage(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Cards Row */}
            <div
              ref={listRef}
              className="flex gap-6 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pb-2 no-scrollbar ml-[55px] mr-[55px] pr-[55px]"
            >
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="snap-start min-w-[280px] sm:min-w-[320px]"
                >
                  <ProductCard
                    id={listing.id}
                    name={listing.name}
                    price={listing.price}
                    rating={listing.rating}
                    reviews={listing.reviews}
                    image={listing.image}
                    host={listing.host}
                    hostUserId={listing.hostUserId}
                    hostUsername={listing.hostUsername}
                    categories={
                      listing.categories || (listing.type ? [listing.type] : [])
                    }
                    distance={listing.distance}
                    onFavorite={handleFavorite}
                    className="h-full"
                    onClick={() =>
                      (window.location.href = `/listing/${listing.id}`)
                    }
                    delivery={listing.delivery}
                    freeDelivery={listing.freeDelivery}
                    instantBookings={listing.instantBookings}
                  />
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              aria-label="Next"
              className="flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border rounded-full shadow p-2"
              onClick={() => scrollByPage(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-accent/30 dark:bg-gray-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why choose {COMPANY_NAME}?
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
            Become a member of the community choosing {COMPANY_NAME} for their
            rental needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Log in
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary"
              onClick={() => setIsSignUpModalOpen(true)}
            >
              Sign up
            </Button>
          </div>
        </div>
      </section>

      <Footer />

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
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onOpenChange={setIsFavoritesModalOpen}
        userId={authUser?.id?.toString() || ""}
      />
      <LocationPickerModal
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        initialLocation={{
          latitude: searchLocation?.latitude ?? null,
          longitude: searchLocation?.longitude ?? null,
          city: searchLocation?.city ?? null,
        }}
        onConfirm={(selection) => {
          setSearchLocation({
            latitude: selection.latitude,
            longitude: selection.longitude,
            city: selection.city,
          });
        }}
        onClear={() => setSearchLocation(null)}
      />
    </div>
  );
}
