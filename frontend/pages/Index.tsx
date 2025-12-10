import React, { useState, useEffect } from "react";
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
import { getLocationFromLocalStorage, saveLocationToLocalStorage } from "@/lib/location-storage";
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
  } | null>(() => {
    // Initialize from localStorage (single source of truth for location)
    // Check multiple keys for backward compatibility
    try {
      let saved = localStorage.getItem("browseFilterLocation");
      if (saved) {
        return JSON.parse(saved);
      }
      saved = localStorage.getItem("searchLocation");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parsing errors
    }

    // Fall back to standardized location key
    return getLocationFromLocalStorage();
  });

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

  const [listings, setListings] = useState([]);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1500,
  );

  // Track window resize to determine how many listings to show
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch("listings");
        if (!response.ok || cancelled) return;
        const d = await response.json().catch(() => null);
        if (!d || !d.ok || !Array.isArray(d.listings) || cancelled) return;

        // Use location from localStorage (single source of truth)
        const userCoords = searchLocation
          ? {
              latitude: searchLocation.latitude,
              longitude: searchLocation.longitude,
            }
          : null;

        const mapped = d.listings.map((l: any) => {
          let distance = null;
          let distanceMiles = null;

          // Only calculate distance if location is available
          if (userCoords) {
            const listingCoords = extractCoordinates(l);
            distanceMiles = computeDistanceMiles(userCoords, listingCoords);
            distance = formatDistanceLabel(distanceMiles);
          }

          return {
            ...l,
            distance,
            distanceMiles,
            instantBookings: Boolean(l.instantBookings),
          };
        });

        // Filter out user's own listings
        const filtered =
          authenticated && authUser?.id
            ? mapped.filter((l: any) => l.hostUserId !== authUser.id)
            : mapped;

        // Sort by distance if location is available, otherwise by most recent
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
        const limited = sorted.slice(0, 4);

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
  }, [authenticated, authUser?.id, searchLocation]);

  const categories = [
    { name: "Furniture", icon: "🪑" },
    { name: "Clothing", icon: "👗" },
    { name: "Tools", icon: "🔨" },
    { name: "Tech", icon: "💻" },
    { name: "Party", icon: "🎈" },
    { name: "Instruments", icon: "🎷" },
  ];

  // Determine grid columns based on screen width
  const getGridCols = () => {
    if (windowWidth < 700) return 1;
    if (windowWidth < 1000) return 2;
    if (windowWidth < 1350) return 3;
    return 4;
  };

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
            backgroundImage: "url('/images/hero-background.jpg')",
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
                    saveLocationToLocalStorage(
                      searchLocation.latitude,
                      searchLocation.longitude,
                      searchLocation.city,
                    );
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

          <div
            className="grid gap-6 pb-2"
            style={{ gridTemplateColumns: `repeat(${getGridCols()}, 1fr)` }}
          >
            {listings.map((listing) => (
              <div key={listing.id}>
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
