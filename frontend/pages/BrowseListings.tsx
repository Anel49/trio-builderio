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
import { AddToFavoritesModal } from "@/components/ui/add-to-favorites-modal";
import { RemoveFromFavoritesModal } from "@/components/ui/remove-from-favorites-modal";
import { ListingsMap } from "@/components/ListingsMap";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Star,
  Heart,
  Filter,
  SlidersHorizontal,
  Search,
  Menu,
  MessageCircle,
  Calendar as CalendarIcon,
  Map,
  X,
  Loader2,
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
import { isDateRangeAvailable } from "@/lib/reservations";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  ensureCurrentUserProfile,
  getCurrentUserZipCode,
  getCurrentUserCoordinates,
} from "@/lib/user-profile";
import {
  computeDistanceMiles,
  extractCoordinates,
  formatDistanceLabel,
} from "@/lib/geo";

const RENTAL_PERIODS = ["Hourly", "Daily", "Weekly", "Monthly"] as const;
type RentalPeriod = (typeof RENTAL_PERIODS)[number];
const DEFAULT_RENTAL_PERIOD: RentalPeriod = "Daily";
const RENTAL_UNIT_LABELS: Record<RentalPeriod, string> = {
  Hourly: "hour",
  Daily: "day",
  Weekly: "week",
  Monthly: "month",
};
const normalizeRentalPeriod = (value: unknown): RentalPeriod => {
  if (typeof value !== "string") return DEFAULT_RENTAL_PERIOD;
  const lower = value.trim().toLowerCase();
  const match = RENTAL_PERIODS.find((period) => period.toLowerCase() === lower);
  return match ?? DEFAULT_RENTAL_PERIOD;
};

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
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isAddToFavoritesModalOpen, setIsAddToFavoritesModalOpen] =
    useState(false);
  const [isRemoveFromFavoritesModalOpen, setIsRemoveFromFavoritesModalOpen] =
    useState(false);
  const [favoritedListing, setFavoritedListing] = useState("");
  const [favoritedListingIds, setFavoritedListingIds] = useState<Set<number>>(
    new Set(),
  );
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string | null;
  } | null>(() => {
    // Initialize from localStorage if available
    try {
      const saved = localStorage.getItem("searchLocation");
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.removeItem("searchLocation"); // Clear after reading
        return parsed;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  });
  const [isLoadingDistances, setIsLoadingDistances] = useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("searchDateRange");
      if (saved) {
        const parsed = JSON.parse(saved);
        const start = parsed.start ? new Date(parsed.start) : undefined;
        const end = parsed.end ? new Date(parsed.end) : undefined;
        if (start && end) {
          setDateRange({ start, end });
        }
      }
    } catch {}
  }, []);

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

  // Auto-sort by distance when location is selected
  React.useEffect(() => {
    if (filterLocation) {
      setSortBy("distance-asc");
    }
  }, [filterLocation]);

  const CATEGORY_OPTIONS = [
    "Appliance",
    "Automotive",
    "Baby",
    "Child",
    "Clothing",
    "Crafts",
    "Fitness",
    "Furniture",
    "Game",
    "Garden",
    "Home",
    "Instrument",
    "Literature",
    "Party",
    "Pet",
    "Service",
    "Sports",
    "Tech",
    "Tool",
    "Toy",
  ];

  // Fetch user's favorites on mount
  React.useEffect(() => {
    const fetchFavorites = async () => {
      const userId = authUser?.id;
      if (!userId) return;

      try {
        const response = await apiFetch(`favorites/${userId}`);
        const data = await response.json().catch(() => ({}));
        if (data.ok && Array.isArray(data.favorites)) {
          const ids = new Set(
            data.favorites.map((f: any) => f.id),
          ) as Set<number>;
          setFavoritedListingIds(ids);
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      }
    };

    fetchFavorites();
  }, [authUser?.id]);

  const handleFavorite = async (listingName: string, listingId: number) => {
    const userId = authUser?.id;
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    const isCurrentlyFavorited = favoritedListingIds.has(listingId);

    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const response = await apiFetch(`favorites/${userId}/${listingId}`, {
          method: "DELETE",
        });
        const data = await response.json().catch(() => ({}));
        if (data.ok) {
          setFavoritedListing(listingName);
          setIsRemoveFromFavoritesModalOpen(true);
          // Remove from local favorites set
          setFavoritedListingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(listingId);
            return newSet;
          });
        }
      } else {
        // Add to favorites
        const response = await apiFetch("favorites", {
          method: "POST",
          body: JSON.stringify({ userId, listingId }),
          headers: { "content-type": "application/json" },
        });
        const data = await response.json().catch(() => ({}));
        if (data.ok) {
          setFavoritedListing(listingName);
          setIsAddToFavoritesModalOpen(true);
          // Add to local favorites set
          setFavoritedListingIds((prev) => new Set(prev).add(listingId));
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
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

  const initialListings = [
    {
      id: 1,
      name: "Professional Lawn Mower",
      price: "$45",
      rating: 4.9,
      reviews: 142,
      image:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Sarah M.",
      type: "Tool",
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
      type: "Tool",
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
      type: "Instrument",
      location: "Fremont, CA",
      distance: "18.9 miles",
      lat: 37.5485,
      lng: -121.9886,
      listedTime: "1 day ago",
    },
  ];

  const [listings, setListings] = useState<any[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Show loading overlay if filterLocation changed (not initial load)
        if (filterLocation) {
          setIsLoadingDistances(true);
        }

        await ensureCurrentUserProfile();
        if (cancelled) return;
        const coords = getCurrentUserCoordinates();
        if (coords && !cancelled) {
          setUserCoordinates(coords);
        }
        // Use filter location if available, otherwise use user coordinates
        const coordsToUse = filterLocation || coords;
        console.log(
          "[BrowseListings] filterLocation:",
          filterLocation,
          "userCoords:",
          coords,
          "coordsToUse:",
          coordsToUse,
        );
        const path = coordsToUse
          ? `listings?user_lat=${coordsToUse.latitude}&user_lng=${coordsToUse.longitude}&enabled=true`
          : "listings?enabled=true";
        console.log("[BrowseListings] Fetching listings with path:", path);
        const response = await apiFetch(path);
        console.log(
          "[BrowseListings] Response status:",
          response.status,
          "ok:",
          response.ok,
        );
        if (!response.ok || cancelled) {
          console.log("[BrowseListings] Response not ok, returning");
          return;
        }
        let d;
        try {
          d = await response.json();
          console.log(
            "[BrowseListings] Parsed JSON successfully, ok:",
            d?.ok,
            "listings count:",
            Array.isArray(d?.listings) ? d.listings.length : "not array",
          );
        } catch (e) {
          console.error("[BrowseListings] Failed to parse JSON:", e);
          d = null;
        }
        if (!d || !d.ok || !Array.isArray(d.listings) || cancelled) {
          console.log(
            "[BrowseListings] Data validation failed, d:",
            d,
            "cancelled:",
            cancelled,
          );
          return;
        }
        const mapped = d.listings.map((l: any) => {
          const categories =
            Array.isArray(l.categories) && l.categories.length
              ? l.categories
              : l.type
                ? [l.type]
                : [];

          return {
            id: l.id,
            name: l.name,
            price: l.price,
            rating: typeof l.rating === "number" ? l.rating : null,
            reviews: undefined,
            image:
              Array.isArray(l.images) && l.images.length
                ? l.images[0]
                : l.image,
            host: l.host,
            type: categories[0] || "General",
            categories,
            location: "",
            distance: typeof l.distance === "string" ? l.distance : null,
            distanceMiles:
              typeof l.distanceMiles === "number" ? l.distanceMiles : null,
            zipCode:
              typeof l.zipCode === "string"
                ? l.zipCode
                : typeof l.zip_code === "string"
                  ? l.zip_code
                  : null,
            latitude: typeof l.latitude === "number" ? l.latitude : null,
            longitude: typeof l.longitude === "number" ? l.longitude : null,
            createdAt: l.createdAt ?? l.created_at ?? undefined,
            rentalPeriod: normalizeRentalPeriod(
              l.rentalPeriod ?? l.rental_period,
            ),
            delivery: Boolean(l.delivery),
            freeDelivery: Boolean(l.freeDelivery),
          };
        });
        if (!cancelled) {
          console.log(
            "[BrowseListings] Setting listings with distances:",
            mapped.map((l: any) => ({
              id: l.id,
              distance: l.distance,
              distanceMiles: l.distanceMiles,
              delivery: l.delivery,
              freeDelivery: l.freeDelivery,
            })),
          );
          setListings(mapped);
          setIsLoadingDistances(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoadingDistances(false);
          // keep demo data
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterLocation]);

  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [hoveredListing, setHoveredListing] = useState<number | null>(null);
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);
  const [showPricePopup, setShowPricePopup] = useState<number | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Mobile map popup state
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);

  // Helper function to convert time strings to minutes for sorting
  const getTimeInMinutes = (timeStr?: string): number => {
    if (!timeStr || typeof timeStr !== "string") return Number.MAX_SAFE_INTEGER;
    const s = timeStr.toLowerCase();
    if (s.includes("mins")) {
      const n = parseInt(s.replace(" mins ago", ""));
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    }
    if (s.includes("hour")) {
      const n =
        parseInt(s.replace(" hours ago", "").replace(" hour ago", "")) * 60;
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    }
    if (s.includes("day")) {
      const n =
        parseInt(s.replace(" days ago", "").replace(" day ago", "")) * 24 * 60;
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    }
    return Number.MAX_SAFE_INTEGER;
  };

  // Filter and sort listings
  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = listings.filter((listing) => {
      // Search query filter - search in name and categories
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatches = listing.name.toLowerCase().includes(query);
        const cats = Array.isArray((listing as any).categories)
          ? ((listing as any).categories as string[])
          : [];
        const categoryMatches = cats.some((cat) =>
          cat.toLowerCase().includes(query),
        );
        const typeMatches = listing.type.toLowerCase().includes(query);
        if (!nameMatches && !categoryMatches && !typeMatches) {
          return false;
        }
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

      // Category filter (match any assigned category)
      if (appliedFilters.category) {
        const cats = Array.isArray((listing as any).categories)
          ? ((listing as any).categories as string[])
          : [];
        const matches =
          listing.type === appliedFilters.category ||
          cats.includes(appliedFilters.category);
        if (!matches) return false;
      }

      // Distance filter (simplified - in real app would calculate based on zip code)
      if (appliedFilters.maxDistance && appliedFilters.zipCode) {
        const distanceValue =
          typeof listing.distanceMiles === "number" &&
          Number.isFinite(listing.distanceMiles)
            ? listing.distanceMiles
            : NaN;
        if (!Number.isFinite(distanceValue)) return false;
        if (distanceValue > parseFloat(appliedFilters.maxDistance))
          return false;
      }

      // Availability filter: only when a date range is selected
      if (dateRange.start && dateRange.end) {
        const available = isDateRangeAvailable(
          dateRange.start,
          dateRange.end,
          String(listing.id),
        );
        if (!available) return false;
      }

      return true;
    });

    // Sort listings
    if (sortBy) {
      const getCreatedAtMs = (x: any) => {
        const v = (x && (x as any).createdAt) as any;
        if (typeof v === "number") return v;
        if (typeof v === "string") {
          const t = Date.parse(v);
          return Number.isFinite(t) ? t : NaN;
        }
        return NaN;
      };
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "distance-asc": {
            const da =
              typeof (a as any).distanceMiles === "number" &&
              Number.isFinite((a as any).distanceMiles)
                ? (a as any).distanceMiles
                : Number.MAX_SAFE_INTEGER;
            const db =
              typeof (b as any).distanceMiles === "number" &&
              Number.isFinite((b as any).distanceMiles)
                ? (b as any).distanceMiles
                : Number.MAX_SAFE_INTEGER;
            return da - db;
          }
          case "distance-desc": {
            const da =
              typeof (a as any).distanceMiles === "number" &&
              Number.isFinite((a as any).distanceMiles)
                ? (a as any).distanceMiles
                : Number.MAX_SAFE_INTEGER;
            const db =
              typeof (b as any).distanceMiles === "number" &&
              Number.isFinite((b as any).distanceMiles)
                ? (b as any).distanceMiles
                : Number.MAX_SAFE_INTEGER;
            return db - da;
          }
          case "price-asc":
            const pa = parseInt(String(a.price ?? "").replace("$", ""));
            const pb = parseInt(String(b.price ?? "").replace("$", ""));
            return (
              (Number.isFinite(pa) ? pa : Number.MAX_SAFE_INTEGER) -
              (Number.isFinite(pb) ? pb : Number.MAX_SAFE_INTEGER)
            );
          case "price-desc":
            const pa2 = parseInt(String(a.price ?? "").replace("$", ""));
            const pb2 = parseInt(String(b.price ?? "").replace("$", ""));
            return (
              (Number.isFinite(pb2) ? pb2 : Number.MAX_SAFE_INTEGER) -
              (Number.isFinite(pa2) ? pa2 : Number.MAX_SAFE_INTEGER)
            );
          case "time-asc": {
            // Recently Listed: newest first
            const ta = getCreatedAtMs(a);
            const tb = getCreatedAtMs(b);
            const va = Number.isFinite(ta) ? ta : -Infinity;
            const vb = Number.isFinite(tb) ? tb : -Infinity;
            return vb - va;
          }
          case "time-desc": {
            // Oldest Listed: oldest first
            const ta = getCreatedAtMs(a);
            const tb = getCreatedAtMs(b);
            const va = Number.isFinite(ta) ? ta : Infinity;
            const vb = Number.isFinite(tb) ? tb : Infinity;
            return va - vb;
          }
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [
    listings,
    searchQuery,
    appliedFilters,
    sortBy,
    dateRange.start,
    dateRange.end,
  ]);

  const listingsForMap = React.useMemo(() => {
    return filteredAndSortedListings.map((listing) => ({
      ...listing,
      priceUnitLabel: `per ${RENTAL_UNIT_LABELS[normalizeRentalPeriod((listing as any).rentalPeriod)]}`,
    }));
  }, [filteredAndSortedListings]);

  return (
    <div className="min-h-screen bg-background">
      <style>{fadeInStyle}</style>
      <Header />

      {/* Search Bar */}
      <section className="bg-accent/30 dark:bg-gray-800/30 py-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col md:flex-row gap-4 items-center md:mr-0"
            style={{ marginRight: window.innerWidth <= 991 ? "-3px" : "0" }}
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
                style={{
                  marginRight: window.innerWidth <= 991 ? "176px" : "0",
                }}
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsLocationPickerOpen(true)}
            >
              <MapPin className="h-4 w-4" />
              {filterLocation
                ? `Location: ${filterLocation.city || "Custom"}`
                : "Location"}
            </Button>
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
                          setDateRange({
                            start: range.from,
                            end: range.to,
                          });
                          if (range.to) {
                            localStorage.setItem(
                              "searchDateRange",
                              JSON.stringify({
                                start: range.from,
                                end: range.to,
                              }),
                            );
                          }
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
                        localStorage.removeItem("searchDateRange");
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
                    <Select
                      value={filters.category || "all"}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          category: value === "all" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full mt-2 h-10 text-sm">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent
                        side="bottom"
                        className="max-h-96 overflow-y-auto text-sm"
                        position="popper"
                      >
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Side - Listings Grid (70%) */}
          <div className="flex-1" style={{ width: "70%" }}>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {filteredAndSortedListings.length} listings near you
              </h1>
              <p className="text-muted-foreground">
                Discover amazing items available for rent in your area
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredAndSortedListings.map((listing) => {
                const hasRange = !!(dateRange.start && dateRange.end);
                const listingRentalPeriod = normalizeRentalPeriod(
                  (listing as any).rentalPeriod,
                );
                console.log(
                  "[BrowseListings] Listing",
                  listing.id,
                  "rentalPeriod:",
                  listingRentalPeriod,
                  "from listing:",
                  (listing as any).rentalPeriod,
                );
                const display = (() => {
                  if (!hasRange || listingRentalPeriod !== "Daily") {
                    return {
                      price: listing.price,
                      label: "per day",
                      underline: false,
                    };
                  }
                  const start = dateRange.start as Date;
                  const end = dateRange.end as Date;
                  const days =
                    Math.ceil(
                      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
                    ) + 1;
                  const baseRate = Number(
                    listing.price.replace(/[^0-9.]/g, ""),
                  );
                  if (!Number.isFinite(baseRate)) {
                    return {
                      price: listing.price,
                      label: "per day",
                      underline: false,
                    };
                  }
                  const total = baseRate * days;
                  return {
                    price: `$${total % 1 === 0 ? total.toFixed(0) : total.toFixed(2)}`,
                    label: "total",
                    underline: true,
                  };
                })();
                return (
                  <div key={listing.id} id={`listing-${listing.id}`}>
                    <ProductCard
                      id={listing.id}
                      name={listing.name}
                      price={display.price}
                      rating={listing.rating}
                      reviews={listing.reviews}
                      image={listing.image}
                      host={listing.host}
                      categories={listing.categories}
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
                      priceUnitLabel={display.label}
                      underlinePrice={display.underline}
                      delivery={listing.delivery}
                      freeDelivery={listing.freeDelivery}
                      isFavorited={favoritedListingIds.has(listing.id)}
                    />
                  </div>
                );
              })}
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
              <Card className="h-[750px] overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  <ListingsMap
                    listings={listingsForMap}
                    selectedListing={selectedListing}
                    userCoordinates={userCoordinates}
                    filterLocation={filterLocation}
                    onSelectListing={(listingId) => {
                      setSelectedListing(listingId);
                      const listingElement = document.getElementById(
                        `listing-${listingId}`,
                      );
                      if (listingElement) {
                        listingElement.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {isLoadingDistances && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center gap-4 shadow-lg max-w-sm mx-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold text-center">
              Calculating new distances
            </p>
          </div>
        </div>
      )}

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
      <AddToFavoritesModal
        isOpen={isAddToFavoritesModalOpen}
        onOpenChange={setIsAddToFavoritesModalOpen}
        listingName={favoritedListing}
        onSeeFavorites={() => setIsFavoritesModalOpen(true)}
      />
      <RemoveFromFavoritesModal
        isOpen={isRemoveFromFavoritesModalOpen}
        onOpenChange={setIsRemoveFromFavoritesModalOpen}
        listingName={favoritedListing}
        onSeeFavorites={() => setIsFavoritesModalOpen(true)}
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
          latitude:
            filterLocation?.latitude ?? userCoordinates?.latitude ?? null,
          longitude:
            filterLocation?.longitude ?? userCoordinates?.longitude ?? null,
          city: filterLocation?.city ?? null,
        }}
        onConfirm={(selection) => {
          setFilterLocation({
            latitude: selection.latitude,
            longitude: selection.longitude,
            city: selection.city,
          });
        }}
        onClear={() => setFilterLocation(null)}
      />

      {/* Mobile Map Floating Button - Only visible on mobile/tablet */}
      <Button
        onClick={() => setIsMobileMapOpen(!isMobileMapOpen)}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full shadow-lg lg:hidden z-30"
        size="icon"
      >
        {isMobileMapOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Map className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Map Popup - Slides up from bottom */}
      <div
        className={`fixed inset-x-0 top-16 bottom-0 z-20 bg-background border-t lg:hidden transition-transform duration-300 ease-in-out ${
          isMobileMapOpen
            ? "translate-y-0" // Slide up to visible position
            : "translate-y-full" // Slide down to hidden position
        }`}
      >
        {/* Drag Handle Tab */}
        <div
          className="flex justify-center py-3 cursor-pointer"
          onClick={() => setIsMobileMapOpen(false)}
        >
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
        </div>

        {/* Map Header */}
        <div className="px-4 pb-4">
          <h3 className="text-lg font-semibold">Map View</h3>
        </div>

        {/* Map Container */}
        <div className="px-4 pb-4 h-full">
          <Card className="h-full overflow-hidden">
            <CardContent className="p-0 h-full relative">
              <ListingsMap
                listings={listingsForMap}
                selectedListing={selectedListing}
                userCoordinates={userCoordinates}
                filterLocation={filterLocation}
                onSelectListing={(listingId) => {
                  setSelectedListing(listingId);
                  setIsMobileMapOpen(false);
                  const listingElement = document.getElementById(
                    `listing-${listingId}`,
                  );
                  if (listingElement) {
                    listingElement.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
