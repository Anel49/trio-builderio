import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiSelectCategories } from "@/components/ui/multi-select-categories";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useSearchParams, useLocation } from "react-router-dom";
import { usePageTitle } from "@/hooks/use-page-title";
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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
// import { usePageLoading } from "@/contexts/PageLoadingContext";
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
  const { user: authUser, authenticated } = useAuth();
  // const { setPageLoading } = usePageLoading();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isTabletOrMobile, setIsTabletOrMobile] = React.useState(
    window.innerWidth < 1024,
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsTabletOrMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get("q") || "";
  });
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
    // Initialize from localStorage if available (check both keys for compatibility)
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
    return null;
  });
  const [isLoadingDistances, setIsLoadingDistances] = useState(false);

  usePageTitle();

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
    categories: [] as string[],
    offersDelivery: false,
    offersFreeDelivery: false,
    instantBookings: false,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: "",
    maxPrice: "",
    maxDistance: "",
    zipCode: "",
    categories: [] as string[],
    offersDelivery: false,
    offersFreeDelivery: false,
    instantBookings: false,
  });

  // Sort state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");

  // Load sort preference from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("browseSortBy");
      if (saved) {
        setSortBy(saved);
      }
    } catch {}
  }, []);

  // Load filter preferences from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("browseAppliedFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAppliedFilters(parsed);
        setFilters(parsed);
      }
    } catch {}
  }, []);

  // Reload filter preferences when navigating back to /browse
  React.useEffect(() => {
    if (location.pathname === "/browse") {
      try {
        const saved = localStorage.getItem("browseAppliedFilters");
        if (saved) {
          const parsed = JSON.parse(saved);
          setAppliedFilters(parsed);
          setFilters(parsed);
        }
      } catch {}
      try {
        const saved = localStorage.getItem("browseSortBy");
        if (saved) {
          setSortBy(saved);
        }
      } catch {}
      try {
        let saved = localStorage.getItem("browseFilterLocation");
        if (saved) {
          const parsed = JSON.parse(saved);
          setFilterLocation(parsed);
        } else {
          saved = localStorage.getItem("searchLocation");
          if (saved) {
            const parsed = JSON.parse(saved);
            setFilterLocation(parsed);
          }
        }
      } catch {}
    }
  }, [location.pathname]);

  // Handle browser back/forward button to reload filters
  React.useEffect(() => {
    const handlePopState = () => {
      // Add a small delay to ensure React Router has updated
      setTimeout(() => {
        if (window.location.pathname === "/browse") {
          try {
            const saved = localStorage.getItem("browseAppliedFilters");
            if (saved) {
              const parsed = JSON.parse(saved);
              setAppliedFilters(parsed);
              setFilters(parsed);
            }
          } catch {}
          try {
            const saved = localStorage.getItem("browseSortBy");
            if (saved) {
              setSortBy(saved);
            }
          } catch {}
          try {
            const saved = localStorage.getItem("browseFilterLocation");
            if (saved) {
              const parsed = JSON.parse(saved);
              setFilterLocation(parsed);
            }
          } catch {}
        }
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Save sort preference to localStorage whenever it changes
  React.useEffect(() => {
    if (sortBy) {
      localStorage.setItem("browseSortBy", sortBy);
    }
  }, [sortBy]);

  // Save filter preferences to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem(
      "browseAppliedFilters",
      JSON.stringify(appliedFilters),
    );
  }, [appliedFilters]);

  // Apply category filter from URL query parameter
  React.useEffect(() => {
    const categories = searchParams.get("categories");
    if (categories) {
      const categoryList = categories.split(",").filter((c) => c.trim());
      setFilters((prev) => ({
        ...prev,
        categories: categoryList,
      }));
      setAppliedFilters((prev) => ({
        ...prev,
        categories: categoryList,
      }));
    }
  }, [searchParams]);

  // Prevent auto-focus on mobile/tablet when filter opens
  React.useEffect(() => {
    if (isTabletOrMobile && isFilterOpen) {
      // Blur any focused element after popover opens
      const timer = setTimeout(() => {
        const focused = document.activeElement as HTMLElement;
        if (focused && focused.tagName === "INPUT") {
          focused.blur();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isFilterOpen, isTabletOrMobile]);

  // Listings state (moved here to avoid temporal dead zone)
  const [listings, setListings] = useState<any[]>([]);

  // Cache for listing reservations
  const [reservationsCache, setReservationsCache] = React.useState<
    Record<
      string,
      Array<{ startDate: string; endDate: string; status: string }>
    >
  >({});

  // Track previous location to detect removal
  const [prevFilterLocation, setPrevFilterLocation] = React.useState<{
    latitude: number;
    longitude: number;
    city: string | null;
  } | null>(filterLocation);

  // Fetch reservations for a listing
  const fetchReservations = React.useCallback(
    async (listingId: string) => {
      if (reservationsCache[listingId] !== undefined) {
        return; // Already cached
      }

      try {
        const response = await apiFetch(`/listings/${listingId}/reservations`);
        const data = await response.json();

        if (data.ok) {
          setReservationsCache((prev) => ({
            ...prev,
            [listingId]: data.reservations || [],
          }));
        }
      } catch (error) {
        console.error(
          `Error fetching reservations for listing ${listingId}:`,
          error,
        );
        // Set empty array if fetch fails
        setReservationsCache((prev) => ({
          ...prev,
          [listingId]: [],
        }));
      }
    },
    [reservationsCache],
  );

  // Fetch reservations for all listings when they load
  React.useEffect(() => {
    listings.forEach((listing) => {
      fetchReservations(String(listing.id));
    });
  }, [listings, fetchReservations]);

  // Save filter location to localStorage whenever it changes
  React.useEffect(() => {
    if (filterLocation) {
      localStorage.setItem("browseFilterLocation", JSON.stringify(filterLocation));
      setSortBy("distance-asc");
    } else {
      localStorage.removeItem("browseFilterLocation");
    }

    // Detect location removal (was set, now null)
    if (prevFilterLocation && !filterLocation) {
      setIsLoadingDistances(true);
    }

    setPrevFilterLocation(filterLocation);
  }, [filterLocation]);

  const CATEGORY_OPTIONS = [
    "Appliances",
    "Automotive",
    "Baby",
    "Clothing",
    "Crafts",
    "Fitness",
    "Furniture",
    "Games",
    "Garden",
    "Home",
    "Instruments",
    "Kids",
    "Literature",
    "Party",
    "Pets",
    "Sports",
    "Tech",
    "Tools",
    "Toys",
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
          body: JSON.stringify({ userId: String(userId), listingId }),
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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // setPageLoading(true);

        // Show loading overlay if filterLocation changed (not initial load)
        if (filterLocation) {
          setIsLoadingDistances(true);
        }

        if (cancelled) return;

        // Only use authenticated user's location
        let coords = null;
        if (
          authenticated &&
          authUser?.locationLatitude &&
          authUser?.locationLongitude
        ) {
          coords = {
            latitude: authUser.locationLatitude,
            longitude: authUser.locationLongitude,
          };
          setUserCoordinates(coords);
        }

        // Use filter location if available, otherwise use authenticated user coordinates
        const coordsToUse = filterLocation || coords;
        const path = coordsToUse
          ? `listings?user_lat=${coordsToUse.latitude}&user_lng=${coordsToUse.longitude}&enabled=true`
          : "listings?enabled=true";
        const response = await apiFetch(path);
        if (!response.ok || cancelled) {
          // setPageLoading(false);
          return;
        }
        let d;
        try {
          d = await response.json();
        } catch (e) {
          d = null;
        }
        if (!d || !d.ok || !Array.isArray(d.listings) || cancelled) {
          // setPageLoading(false);
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
            reviews: typeof l.reviews === "number" ? l.reviews : undefined,
            image:
              Array.isArray(l.images) && l.images.length
                ? l.images[0]
                : l.image,
            host: l.host,
            hostUserId:
              typeof l.hostUserId === "number" ? l.hostUserId : undefined,
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
            delivery: Boolean(l.delivery || l.delivery_available),
            freeDelivery: Boolean(l.freeDelivery || l.free_delivery),
            instantBookings: Boolean(l.instantBookings),
          };
        });

        // Filter out user's own listings
        const filtered =
          authenticated && authUser?.id
            ? mapped.filter((l: any) => l.hostUserId !== authUser.id)
            : mapped;

        if (!cancelled) {
          setListings(filtered);
          setIsLoadingDistances(false);
          // setPageLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoadingDistances(false);
          // setPageLoading(false);
          // keep demo data
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    filterLocation,
    authenticated,
    authUser?.locationLatitude,
    authUser?.locationLongitude,
  ]);

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
        const price = parseInt(listing.price.replace(/[\$,]/g, ""));
        if (price < parseInt(appliedFilters.minPrice)) return false;
      }
      if (appliedFilters.maxPrice) {
        const price = parseInt(listing.price.replace(/[\$,]/g, ""));
        if (price > parseInt(appliedFilters.maxPrice)) return false;
      }

      // Category filter (match any of the selected categories)
      if (appliedFilters.categories && appliedFilters.categories.length > 0) {
        const cats = Array.isArray((listing as any).categories)
          ? ((listing as any).categories as string[])
          : [];
        const matches = appliedFilters.categories.some(
          (selectedCategory) =>
            listing.type === selectedCategory ||
            cats.includes(selectedCategory),
        );
        if (!matches) return false;
      }

      // Distance filter (requires a location to be set)
      if (appliedFilters.maxDistance && filterLocation) {
        const distanceValue =
          typeof listing.distanceMiles === "number" &&
          Number.isFinite(listing.distanceMiles)
            ? listing.distanceMiles
            : NaN;
        if (!Number.isFinite(distanceValue)) return false;
        if (distanceValue > parseFloat(appliedFilters.maxDistance))
          return false;
      }

      // Delivery filter
      if (appliedFilters.offersDelivery && !listing.delivery) {
        return false;
      }

      // Free delivery filter
      if (appliedFilters.offersFreeDelivery && !listing.freeDelivery) {
        return false;
      }

      // Instant bookings filter
      if (appliedFilters.instantBookings && !listing.instantBookings) {
        return false;
      }

      // Availability filter: only when a date range is selected
      if (dateRange.start && dateRange.end) {
        const listingId = String(listing.id);
        const reservations = reservationsCache[listingId];

        if (reservations !== undefined) {
          // Check if any day in the selected range conflicts with reservations
          const currentDate = new Date(dateRange.start);
          const inclusiveEndDate = new Date(dateRange.end);
          inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);

          while (currentDate < inclusiveEndDate) {
            const dateStr = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
            const hasConflict = reservations.some((res) => {
              // Only consider pending or accepted reservations
              if (res.status !== "pending" && res.status !== "accepted") {
                return false;
              }
              // Parse the dates properly - handle ISO strings
              const resStart =
                typeof res.startDate === "string"
                  ? res.startDate.split("T")[0]
                  : new Date(res.startDate).toISOString().split("T")[0];
              const resEnd =
                typeof res.endDate === "string"
                  ? res.endDate.split("T")[0]
                  : new Date(res.endDate).toISOString().split("T")[0];

              const isConflict = dateStr >= resStart && dateStr <= resEnd;
              return isConflict;
            });

            if (hasConflict) {
              return false;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
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
            const pa = parseInt(String(a.price ?? "").replace(/[\$,]/g, ""));
            const pb = parseInt(String(b.price ?? "").replace(/[\$,]/g, ""));
            return (
              (Number.isFinite(pa) ? pa : Number.MAX_SAFE_INTEGER) -
              (Number.isFinite(pb) ? pb : Number.MAX_SAFE_INTEGER)
            );
          case "price-desc":
            const pa2 = parseInt(String(a.price ?? "").replace(/[\$,]/g, ""));
            const pb2 = parseInt(String(b.price ?? "").replace(/[\$,]/g, ""));
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
    filterLocation,
    reservationsCache,
  ]);

  const listingsForMap = React.useMemo(() => {
    return filteredAndSortedListings.map((listing) => ({
      ...listing,
      priceUnitLabel: `per ${RENTAL_UNIT_LABELS[normalizeRentalPeriod((listing as any).rentalPeriod)]}`,
    }));
  }, [filteredAndSortedListings]);

  return (
    <div
      className="bg-background"
      style={{
        minHeight: isFilterOpen ? "133vh" : "100vh",
      }}
    >
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
              variant={
                filterLocation ||
                (authenticated &&
                  authUser?.locationLatitude &&
                  authUser?.locationLongitude)
                  ? "default"
                  : "outline"
              }
              className="flex items-center gap-2"
              onClick={() => setIsLocationPickerOpen(true)}
            >
              <MapPin className="h-4 w-4" />
              {filterLocation
                ? `Location: ${filterLocation.city || "Custom"}`
                : "Location"}
            </Button>
            <Popover
              open={isDatePickerOpen}
              onOpenChange={(open) => {
                setIsDatePickerOpen(open);
                // Clear incomplete date selection when closing the popover
                if (!open && !dateRange.end) {
                  setDateRange({ start: undefined, end: undefined });
                  localStorage.removeItem("searchDateRange");
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={
                    dateRange.start && dateRange.end ? "default" : "outline"
                  }
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.start && dateRange.end
                    ? `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd")}`
                    : dateRange.start
                      ? `${format(dateRange.start, "MMM dd")} - End`
                      : "Dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align={isTabletOrMobile ? "center" : "start"}
              >
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
                    initialFocus={!isTabletOrMobile}
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
                <Button
                  variant={
                    appliedFilters.minPrice ||
                    appliedFilters.maxPrice ||
                    appliedFilters.maxDistance ||
                    appliedFilters.zipCode ||
                    (appliedFilters.categories &&
                      appliedFilters.categories.length > 0) ||
                    appliedFilters.offersDelivery ||
                    appliedFilters.offersFreeDelivery ||
                    appliedFilters.instantBookings
                      ? "default"
                      : "outline"
                  }
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align={isTabletOrMobile ? "center" : "start"}
                className="w-80 p-4"
              >
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setAppliedFilters(filters);
                              setIsFilterOpen(false);
                            }
                          }}
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setAppliedFilters(filters);
                              setIsFilterOpen(false);
                            }
                          }}
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setAppliedFilters(filters);
                            setIsFilterOpen(false);
                          }
                        }}
                        className="w-20"
                        disabled={!filterLocation}
                      />
                      <span className="text-sm text-muted-foreground">
                        miles from location
                      </span>
                    </div>
                    {!filterLocation && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Select a location to use distance filter
                      </p>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div>
                    <Label className="text-sm font-medium">Categories</Label>
                    <div className="mt-2">
                      <MultiSelectCategories
                        categories={CATEGORY_OPTIONS}
                        selected={filters.categories}
                        onSelectionChange={(selected) =>
                          setFilters({
                            ...filters,
                            categories: selected,
                          })
                        }
                        placeholder="Search categories..."
                        autoFocus={false}
                      />
                    </div>
                  </div>

                  {/* Instant Bookings */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="instant-bookings"
                      checked={filters.instantBookings}
                      onCheckedChange={(checked) =>
                        setFilters({
                          ...filters,
                          instantBookings: checked === true,
                        })
                      }
                    />
                    <label
                      htmlFor="instant-bookings"
                      className="text-sm cursor-pointer font-normal"
                    >
                      Instant Booking
                    </label>
                  </div>

                  {/* Delivery Options */}
                  <div>
                    <Label className="text-sm font-medium">
                      Delivery Options
                    </Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="offers-delivery"
                          checked={filters.offersDelivery}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              offersDelivery: checked === true,
                            })
                          }
                        />
                        <label
                          htmlFor="offers-delivery"
                          className="text-sm cursor-pointer font-normal"
                        >
                          Offers delivery
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="offers-free-delivery"
                          checked={filters.offersFreeDelivery}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              offersFreeDelivery: checked === true,
                            })
                          }
                        />
                        <label
                          htmlFor="offers-free-delivery"
                          className="text-sm cursor-pointer font-normal"
                        >
                          Offers free delivery
                        </label>
                      </div>
                    </div>
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
                        categories: [] as string[],
                        offersDelivery: false,
                        offersFreeDelivery: false,
                        instantBookings: false,
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
                <Button
                  variant={sortBy ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isTabletOrMobile ? "center" : "start"}
                className="w-56"
              >
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Recently listed</h1>
          <p className="text-muted-foreground">
            Discover amazing items available for rent in your area
          </p>
        </div>

        <div className="flex gap-8">
          {/* Left Side - Listings Grid (70%) */}
          <div className="flex-1" style={{ width: "70%" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredAndSortedListings.map((listing) => {
                const hasRange = !!(dateRange.start && dateRange.end);
                const listingRentalPeriod = normalizeRentalPeriod(
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
                  const formatted = total.toLocaleString("en-US", {
                    minimumFractionDigits: total % 1 === 0 ? 0 : 2,
                    maximumFractionDigits: 2,
                  });
                  return {
                    price: `$${formatted}`,
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
                      hostUserId={listing.hostUserId}
                      hostUsername={listing.hostUsername}
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
                        window.location.href = `/listing/${listing.id}`;
                      }}
                      priceUnitLabel={display.label}
                      underlinePrice={display.underline}
                      delivery={listing.delivery}
                      freeDelivery={listing.freeDelivery}
                      isFavorited={favoritedListingIds.has(listing.id)}
                      instantBookings={listing.instantBookings}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Interactive Map (30%) */}
          <div className="hidden lg:block" style={{ width: "30%" }}>
            <div className="sticky top-0">
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

        {/* Load More Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" size="lg">
            Load more listings
          </Button>
        </div>
      </div>

      {isLoadingDistances && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-card rounded-lg p-8 flex flex-col items-center gap-4 shadow-lg max-w-sm mx-4 border border-border">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold text-center text-foreground">
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

      <Footer />
    </div>
  );
}
