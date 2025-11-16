import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import Header from "@/components/Header";
import { SignUpModal } from "@/components/ui/signup-modal";
import { format } from "date-fns";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { FavoritesModal } from "@/components/ui/favorites-modal";
import { AddToFavoritesModal } from "@/components/ui/add-to-favorites-modal";
import { RemoveFromFavoritesModal } from "@/components/ui/remove-from-favorites-modal";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
// import { usePageLoading } from "@/contexts/PageLoadingContext";
import {
  ensureCurrentUserProfile,
  getCurrentUserZipCode,
  getCurrentUserLocation,
  getCurrentUserCoordinates,
  setCurrentUserLocation,
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
import {
  Star,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Package,
  MessageCircle,
  User,
  Menu,
  X,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Heart,
  LogOut,
  User as UserIcon,
  Shield,
  Settings,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordModal } from "@/components/ui/change-password-modal";
import { ChangeEmailModal } from "@/components/ui/change-email-modal";
import { ChangeUsernameModal } from "@/components/ui/change-username-modal";

type ListedItem = {
  id: number;
  name: string;
  price: string;
  rating: number | null;
  trips: number;
  image: string;
  host: string;
  hostUserId?: number;
  hostUsername?: string;
  type: string;
  categories?: string[];
  distance: string | null;
  distanceMiles?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  reviews?: number;
  rentalPeriod?: string;
  enabled?: boolean;
  delivery?: boolean;
  freeDelivery?: boolean;
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REVIEWS_PER_PAGE = 8;

export default function Profile() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user: authUser, authenticated, logout, checkAuth } = useAuth();
  // const { setPageLoading } = usePageLoading();

  // Check if this is the current user's own profile by username (case-insensitive)
  const isOwnUsername =
    username &&
    authUser?.username &&
    username.toLowerCase() === authUser.username.toLowerCase();

  // Only viewing other user if username param exists AND doesn't match current user
  const [viewingOtherUser, setViewingOtherUser] = useState(
    Boolean(username && !isOwnUsername),
  );

  // Redirect to /profile and update state if viewing own profile via username param
  useEffect(() => {
    if (isOwnUsername) {
      setViewingOtherUser(false);
      navigate("/profile", { replace: true });
    } else if (username && !isOwnUsername) {
      setViewingOtherUser(true);
    }
  }, [isOwnUsername, username, navigate]);
  const [otherUserData, setOtherUserData] = useState<null | {
    id: number | null;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    zipCode: string | null;
    locationCity: string | null;
    locationLatitude: number | null;
    locationLongitude: number | null;
    createdAt: string | null;
    foundingSupporter: boolean;
    topReferrer: boolean;
    ambassador: boolean;
  }>(null);
  const [isLoadingOtherUser, setIsLoadingOtherUser] = useState(
    Boolean(username),
  );
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const initialLocation = getCurrentUserLocation();
  const [locationCity, setLocationCity] = useState<string | null>(
    initialLocation.city,
  );
  const [locationLatitude, setLocationLatitude] = useState<number | null>(
    initialLocation.latitude,
  );
  const [locationLongitude, setLocationLongitude] = useState<number | null>(
    initialLocation.longitude,
  );
  const [locationPostalCode, setLocationPostalCode] = useState<string | null>(
    initialLocation.postalCode,
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(authUser?.name || "");
  const [userRecord, setUserRecord] = useState<null | {
    id: number | null;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    zipCode: string | null;
    locationCity: string | null;
    locationLatitude: number | null;
    locationLongitude: number | null;
    createdAt: string | null;
    foundingSupporter: boolean;
    topReferrer: boolean;
    ambassador: boolean;
  }>(null);

  // Item reviews search and filter state
  const [itemReviewSearchQuery, setItemReviewSearchQuery] = useState("");
  const [itemReviewSortBy, setItemReviewSortBy] = useState("newest");
  const [itemReviewRatingFilter, setItemReviewRatingFilter] = useState("all");
  const [currentItemReviewPage, setCurrentItemReviewPage] = useState(1);

  // Seller reviews search and filter state
  const [sellerReviewSearchQuery, setSellerReviewSearchQuery] = useState("");
  const [sellerReviewSortBy, setSellerReviewSortBy] = useState("newest");
  const [sellerReviewRatingFilter, setSellerReviewRatingFilter] =
    useState("all");
  const [currentSellerReviewPage, setCurrentSellerReviewPage] = useState(1);

  // Mobile tabs navigation
  const [activeTab, setActiveTab] = useState("listings");
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ListedItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<ListedItem | null>(null);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [itemToDisable, setItemToDisable] = useState<ListedItem | null>(null);
  const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
  const [itemToEnable, setItemToEnable] = useState<ListedItem | null>(null);
  const [isDeleteSuccessModalOpen, setIsDeleteSuccessModalOpen] =
    useState(false);
  const [deletedItemName, setDeletedItemName] = useState<string>("");
  const [isBulkEnableConfirmOpen, setIsBulkEnableConfirmOpen] = useState(false);
  const [isBulkDisableConfirmOpen, setIsBulkDisableConfirmOpen] =
    useState(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(
    null,
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string>(
    authUser?.avatarUrl || "",
  );
  const [originalImageUrl, setOriginalImageUrl] = useState<string>(
    authUser?.avatarUrl || "",
  );
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [isChangeUsernameModalOpen, setIsChangeUsernameModalOpen] =
    useState(false);
  const [isPasswordChangeSuccessOpen, setIsPasswordChangeSuccessOpen] =
    useState(false);
  const [isEmailChangeSuccessOpen, setIsEmailChangeSuccessOpen] =
    useState(false);
  const [isUsernameChangeSuccessOpen, setIsUsernameChangeSuccessOpen] =
    useState(false);
  const [newEmailForConfirmation, setNewEmailForConfirmation] = useState("");
  const [newUsernameForConfirmation, setNewUsernameForConfirmation] =
    useState("");
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const openAvatarFilePicker = () => avatarFileInputRef.current?.click();
  const handleAvatarUpload: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setProfileImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    // reset so same file re-triggers change
    e.currentTarget.value = "";
  };

  // Fetch favorites on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      const userId = authUser?.id;
      if (!userId) {
        setFavoritedListingIds(new Set());
        return;
      }

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
        const response = await apiFetch(`favorites`, {
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

  const handleEdit = (item: ListedItem) => {
    setItemToEdit(item);
    sessionStorage.setItem("editListingData", JSON.stringify(item));
    window.location.href = `/upload?edit=${item.id}`;
  };

  const handleBulkEnableAll = async () => {
    try {
      const userId = authUser?.id;
      if (!userId) {
        console.error("Could not get user ID");
        return;
      }

      const response = await apiFetch("/listings/bulk/update-enabled", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: userId, enabled: true }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log("Bulk enabled", data.updated, "listings");

        setListedItems((prev) =>
          prev.map((item) => ({
            ...item,
            enabled: true,
          })),
        );

        setBulkSuccessMessage("All listings enabled!");
        setTimeout(() => setBulkSuccessMessage(null), 2000);
      } else {
        console.error("Failed to enable all listings");
      }
    } catch (error) {
      console.error("Error enabling all listings:", error);
    } finally {
      setIsBulkEnableConfirmOpen(false);
    }
  };

  const handleBulkDisableAll = async () => {
    try {
      const userId = authUser?.id;
      if (!userId) {
        console.error("Could not get user ID");
        return;
      }

      const response = await apiFetch("/listings/bulk/update-enabled", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: userId, enabled: false }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log("Bulk disabled", data.updated, "listings");

        setListedItems((prev) =>
          prev.map((item) => ({
            ...item,
            enabled: false,
          })),
        );

        setBulkSuccessMessage("All listings disabled!");
        setTimeout(() => setBulkSuccessMessage(null), 2000);
      } else {
        console.error("Failed to disable all listings");
      }
    } catch (error) {
      console.error("Error disabling all listings:", error);
    } finally {
      setIsBulkDisableConfirmOpen(false);
    }
  };

  // Badges state loaded from server
  const [badges, setBadges] = useState({
    foundingSupporter: false,
    topReferrer: false,
    ambassador: false,
  });

  const applyUserData = useCallback((user: any) => {
    if (!user) return;
    const extractedAvatar =
      typeof user.avatarUrl === "string" && user.avatarUrl.trim()
        ? user.avatarUrl
        : typeof user.avatar_url === "string" && user.avatar_url.trim()
          ? user.avatar_url
          : null;
    const resolvedName =
      typeof user.name === "string" && user.name.trim() ? user.name : null;
    const resolvedCityRaw =
      typeof user.locationCity === "string" && user.locationCity.trim()
        ? user.locationCity.trim()
        : typeof user.location_city === "string" && user.location_city.trim()
          ? user.location_city.trim()
          : null;
    const resolvedPostalRaw =
      typeof user.zipCode === "string"
        ? user.zipCode
        : typeof user.zip_code === "string"
          ? user.zip_code
          : "";
    const normalizedPostal =
      typeof resolvedPostalRaw === "string" && resolvedPostalRaw.trim()
        ? resolvedPostalRaw.trim()
        : null;

    const rawLat =
      typeof user.locationLatitude === "number"
        ? user.locationLatitude
        : typeof user.location_latitude === "number"
          ? user.location_latitude
          : typeof user.location_latitude === "string" &&
              user.location_latitude.trim()
            ? Number.parseFloat(user.location_latitude)
            : null;
    const rawLon =
      typeof user.locationLongitude === "number"
        ? user.locationLongitude
        : typeof user.location_longitude === "number"
          ? user.location_longitude
          : typeof user.location_longitude === "string" &&
              user.location_longitude.trim()
            ? Number.parseFloat(user.location_longitude)
            : null;
    const latValue =
      typeof rawLat === "number" && Number.isFinite(rawLat) ? rawLat : null;
    const lonValue =
      typeof rawLon === "number" && Number.isFinite(rawLon) ? rawLon : null;

    const resolvedId =
      typeof user.id === "number"
        ? user.id
        : typeof user.id === "string" && user.id.trim()
          ? Number(user.id)
          : null;
    const founding = Boolean(user.foundingSupporter ?? user.founding_supporter);
    const referrer = Boolean(user.topReferrer ?? user.top_referrer);
    const ambassador = Boolean(user.ambassador);

    if (resolvedName) {
      setName(resolvedName);
    }
    if (extractedAvatar) {
      setProfileImageUrl(extractedAvatar);
      setOriginalImageUrl(extractedAvatar);
    }
    setLocationCity(resolvedCityRaw);
    setLocationLatitude(latValue);
    setLocationLongitude(lonValue);
    setLocationPostalCode(normalizedPostal);
    setCurrentUserLocation({
      city: resolvedCityRaw,
      latitude: latValue,
      longitude: lonValue,
      postalCode: normalizedPostal,
    });
    setBadges({
      foundingSupporter: founding,
      topReferrer: referrer,
      ambassador,
    });
    setUserRecord({
      id: resolvedId,
      name: resolvedName,
      email:
        typeof user.email === "string" && user.email.trim() ? user.email : null,
      avatarUrl: extractedAvatar,
      zipCode: normalizedPostal,
      locationCity: resolvedCityRaw,
      locationLatitude: latValue,
      locationLongitude: lonValue,
      createdAt:
        typeof user.createdAt === "string"
          ? user.createdAt
          : typeof user.created_at === "string"
            ? user.created_at
            : null,
      foundingSupporter: founding,
      topReferrer: referrer,
      ambassador,
    });
  }, []);

  const handleLocationConfirm = useCallback(
    ({
      city,
      latitude,
      longitude,
      postalCode,
    }: {
      city: string | null;
      latitude: number;
      longitude: number;
      postalCode: string | null;
    }) => {
      setLocationCity(city);
      setLocationLatitude(latitude);
      setLocationLongitude(longitude);
      setLocationPostalCode(postalCode);
      setCurrentUserLocation({
        city,
        latitude,
        longitude,
        postalCode,
      });
      const userCoords = { latitude, longitude } as const;
      setListedItems((prev) =>
        prev.map((item) => {
          const listingCoords = extractCoordinates(item);
          const distanceMiles = computeDistanceMiles(userCoords, listingCoords);
          return {
            ...item,
            distance: formatDistanceLabel(distanceMiles),
            distanceMiles,
          };
        }),
      );
    },
    [setCurrentUserLocation],
  );

  const handleLocationClear = useCallback(() => {
    setLocationCity(null);
    setLocationLatitude(null);
    setLocationLongitude(null);
    setLocationPostalCode(null);
    setCurrentUserLocation({
      city: null,
      latitude: null,
      longitude: null,
      postalCode: null,
    });
    setListedItems((prev) =>
      prev.map((item) => ({
        ...item,
        distance: null,
        distanceMiles: undefined,
      })),
    );
  }, [setCurrentUserLocation]);

  useEffect(() => {
    (async () => {
      try {
        if (authUser) {
          applyUserData(authUser);
        }
      } catch {}
    })();
  }, [applyUserData, authUser]);

  const avatarOutlineClass = useMemo(() => {
    if (badges.foundingSupporter) return "ring-4 ring-sky-400";
    if (badges.topReferrer) return "ring-4 ring-purple-500";
    if (badges.ambassador) return "ring-4 ring-[rgb(168,64,64)]";
    return "";
  }, [badges]);

  const dateJoinedDisplay = useMemo(() => {
    if (userRecord?.createdAt) {
      try {
        return format(new Date(userRecord.createdAt), "MMMM yyyy");
      } catch {
        return "";
      }
    }
    return "";
  }, [userRecord?.createdAt]);

  const earnedBadges = useMemo(() => {
    const arr: { key: string; title: string; color: string }[] = [];
    if (badges.foundingSupporter)
      arr.push({
        key: "founding",
        title: "Founding Supporter",
        color: "#38bdf8",
      });
    if (badges.topReferrer)
      arr.push({ key: "referrer", title: "Top Referrer", color: "#7c3aed" });
    if (badges.ambassador)
      arr.push({
        key: "ambassador",
        title: "Ambassador",
        color: "rgb(168 64 64)",
      });
    return arr;
  }, [badges]);

  const locationDisplay = useMemo(() => {
    if (typeof locationCity === "string" && locationCity.trim()) {
      return locationCity.trim();
    }
    return null;
  }, [locationCity]);

  // Use centralized user profile data
  const profileDisplayData = viewingOtherUser
    ? otherUserData
    : userRecord || null;
  const userProfile = {
    name: viewingOtherUser
      ? otherUserData?.name || "User"
      : name || authUser?.name || "User",
    email: viewingOtherUser
      ? otherUserData?.email || ""
      : authUser?.email || "",
    profileImage: viewingOtherUser
      ? otherUserData?.avatarUrl || ""
      : profileImageUrl || authUser?.avatarUrl || "",
    locationCity: viewingOtherUser
      ? otherUserData?.locationCity || null
      : locationCity,
    locationLatitude: viewingOtherUser
      ? otherUserData?.locationLatitude || null
      : locationLatitude,
    locationLongitude: viewingOtherUser
      ? otherUserData?.locationLongitude || null
      : locationLongitude,
    zipCode: viewingOtherUser
      ? otherUserData?.zipCode || null
      : locationPostalCode,
    avgRating: 0,
    dateJoined: viewingOtherUser
      ? otherUserData?.createdAt
        ? format(new Date(otherUserData.createdAt), "MMMM yyyy")
        : "—"
      : dateJoinedDisplay || "—",
    avgResponseTime: "—",
  };

  // Mock listed items
  const listedItemsState: ListedItem[] = [
    {
      id: 1,
      name: "Professional Lawn Mower",
      price: "$45",
      rating: 4.9,
      trips: 142,
      image:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "You",
      type: "Landscaping",
      distance: "Distance unavailable",
      latitude: null,
      longitude: null,
    },
    {
      id: 2,
      name: "Designer Tool Set",
      price: "$35",
      rating: 4.7,
      trips: 67,
      image:
        "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "You",
      type: "Tools",
      distance: "Distance unavailable",
      latitude: null,
      longitude: null,
    },
    {
      id: 3,
      name: "Party Sound System",
      price: "$85",
      rating: 4.9,
      trips: 45,
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format",
      host: "You",
      type: "Party",
      distance: "Distance unavailable",
      latitude: null,
      longitude: null,
    },
    {
      id: 4,
      name: "Professional Camera Kit",
      price: "$75",
      rating: 4.8,
      trips: 89,
      image:
        "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=250&fit=crop&auto=format",
      host: "You",
      type: "Electronics",
      distance: "Distance unavailable",
      latitude: null,
      longitude: null,
    },
    {
      id: 5,
      name: "Wedding Dress",
      price: "$120",
      rating: 4.9,
      trips: 23,
      image:
        "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "You",
      type: "Clothing",
      distance: "Distance unavailable",
      latitude: null,
      longitude: null,
    },
    {
      id: 6,
      name: "Electric Guitar",
      price: "$40",
      rating: 4.7,
      trips: 156,
      image:
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=250&fit=crop&auto=format",
      host: "You",
      type: "Instruments",
      distance: "Distance unavailable",
      latitude: null,
      longitude: null,
    },
    {
      id: 7,
      name: "Mountain Bike",
      price: "$55",
      rating: 4.8,
      trips: 201,
      image:
        "https://images.unsplash.com/photo-1544191696-15693b6d3d9d?w=400&h=250&fit=crop&auto=format",
      host: "You",
      type: "Sports",
      distance: "Distance unavailable",
      latitude: null,
      longitude: null,
    },
  ];

  const [listedItems, setListedItems] = useState<ListedItem[]>([]);

  // Fetch other user data when viewing another user's profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!viewingOtherUser || !username) {
        setIsLoadingOtherUser(false);
        return;
      }

      // setPageLoading(true);

      try {
        const response = await fetch(`/api/users/username/${username}`);
        if (!response.ok || cancelled) {
          setIsLoadingOtherUser(false);
          // setPageLoading(false);
          return;
        }

        const data = await response.json();
        if (data.ok && data.user && !cancelled) {
          setOtherUserData(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        if (!cancelled) {
          setIsLoadingOtherUser(false);
          // setPageLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, viewingOtherUser]); // setPageLoading removed from deps

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const targetUserId = viewingOtherUser
          ? otherUserData?.id
          : authUser?.id;

        if (!targetUserId) {
          // Don't fetch if no user ID available
          setListedItems([]);
          // setPageLoading(false);
          return;
        }

        if (!viewingOtherUser && (!authenticated || !authUser?.id)) {
          // Don't fetch current user listings if not authenticated
          setListedItems([]);
          // setPageLoading(false);
          return;
        }

        // setPageLoading(true);

        if (!viewingOtherUser) {
          await ensureCurrentUserProfile();
        }
        if (cancelled) return;

        const coords = !viewingOtherUser ? getCurrentUserCoordinates() : null;
        const userZip = !viewingOtherUser ? getCurrentUserZipCode() : null;
        let path = `listings?user_id=${targetUserId}`;

        if (coords) {
          path += `&user_lat=${coords.latitude}&user_lng=${coords.longitude}`;
        } else if (userZip) {
          path += `&user_zip=${userZip}`;
        }

        const response = await apiFetch(path);
        if (!response.ok || cancelled) return;
        const d = await response.json().catch(() => null);
        if (!d || !d.ok || !Array.isArray(d.listings) || cancelled) return;
        const userCoords = coords ?? getCurrentUserCoordinates();
        const mapped: ListedItem[] = d.listings.map((l: any) => {
          const listingCoords = extractCoordinates(l);
          const distanceMiles = computeDistanceMiles(userCoords, listingCoords);
          const distanceLabel = formatDistanceLabel(distanceMiles);

          const categories = Array.isArray(l.categories)
            ? l.categories
            : typeof l.type === "string"
              ? [l.type]
              : ["General"];
          return {
            id: l.id,
            name: l.name,
            price: l.price,
            rating: typeof l.rating === "number" ? l.rating : null,
            reviews: typeof l.reviews === "number" ? l.reviews : undefined,
            trips: 0,
            image:
              Array.isArray(l.images) && l.images.length
                ? l.images[0]
                : l.image,
            host: l.host || "You",
            hostUserId:
              typeof l.hostUserId === "number" ? l.hostUserId : undefined,
            type: Array.isArray(categories) && categories.length > 0 ? categories[0] : "General",
            categories,
            distance: distanceLabel,
            distanceMiles,
            latitude: listingCoords?.latitude ?? null,
            longitude: listingCoords?.longitude ?? null,
            rentalPeriod: normalizeRentalPeriod((l as any).rentalPeriod),
            enabled: typeof l.enabled === "boolean" ? l.enabled : true,
            delivery: typeof l.delivery === "boolean" ? l.delivery : false,
            freeDelivery:
              typeof l.freeDelivery === "boolean" ? l.freeDelivery : false,
          };
        });
        if (cancelled) return;
        setListedItems(mapped);

        const settled = await Promise.allSettled(
          mapped.map(async (it) => {
            try {
              const res = await apiFetch(`listings/${it.id}/reviews`);
              const data = await res.json().catch(() => ({}) as any);
              const arr = Array.isArray(data?.reviews) ? data.reviews : [];
              const count = arr.length;
              const avg =
                count > 0
                  ? Number(
                      (
                        arr.reduce(
                          (s: number, r: any) => s + (Number(r.rating) || 0),
                          0,
                        ) / count
                      ).toFixed(1),
                    )
                  : null;
              return { id: it.id, count, avg, reviews: arr };
            } catch {
              return { id: it.id, count: 0, avg: null, reviews: [] };
            }
          }),
        );
        const results = settled
          .map((r: any) => (r.status === "fulfilled" ? r.value : r.value))
          .filter(Boolean) as any[];

        const countMap = new Map<
          number,
          { count: number; avg: number | null }
        >();
        let combined: {
          id: number;
          itemName: string;
          reviewer: string;
          reviewerId?: number;
          reviewerUsername?: string;
          rating: number;
          date: string;
          dateValue: Date;
          comment: string;
        }[] = [];
        results.forEach((r) => {
          countMap.set((r as any).id, {
            count: (r as any).count,
            avg: (r as any).avg,
          });
        });
        results.forEach((r) => {
          const listing = mapped.find((it) => it.id === (r as any).id);
          if (!listing) return;
          const name = listing.name;
          const arr = (r as any).reviews as any[];
          arr.forEach((rev: any) => {
            combined.push({
              id: rev.id,
              itemName: name,
              reviewer: rev.user || "",
              reviewerId: rev.reviewerId,
              reviewerUsername: rev.reviewerUsername,
              rating: Number(rev.rating) || 0,
              date: rev.date || new Date().toLocaleDateString(),
              dateValue: new Date(rev.dateValue || Date.now()),
              comment: rev.text || "",
            });
          });
        });
        if (cancelled) return;
        setItemReviews(combined);
        setListedItems((prev) =>
          prev.map((it) => {
            const entry = countMap.get(it.id);
            return entry
              ? {
                  ...it,
                  reviews: it.reviews !== undefined ? it.reviews : entry.count,
                  rating: it.rating ?? entry.avg,
                }
              : it;
          }),
        );
        // setPageLoading(false);
      } catch {
        if (!cancelled) {
          // ignore; keep existing
          // setPageLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, authUser?.id, viewingOtherUser, otherUserData?.id]); // setPageLoading removed from deps

  // Item reviews from DB
  const [itemReviews, setItemReviews] = useState<
    {
      id: number;
      itemName: string;
      reviewer: string;
      avatar?: string;
      reviewerId?: number;
      reviewerUsername?: string;
      rating: number;
      date: string;
      dateValue: Date;
      comment: string;
    }[]
  >([]);

  // Seller reviews from DB (none loaded here)
  const sellerReviews: {
    id: number;
    reviewer: string;
    avatar?: string;
    reviewerId?: number;
    reviewerUsername?: string;
    rating: number;
    date: string;
    dateValue: Date;
    comment: string;
  }[] = [
    {
      id: 1,
      reviewer: "Emily",
      reviewerId: 1,
      reviewerUsername: "emily123",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612f672?w=64&h=64&fit=crop&auto=format",
      rating: 5,
      date: "1 week ago",
      dateValue: new Date("2024-12-08"),
      comment:
        "Sarah is an amazing host! Very responsive, friendly, and her items are always in perfect condition. Highly recommend!",
    },
    {
      id: 2,
      reviewer: "Robert",
      reviewerId: 2,
      reviewerUsername: "robert456",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format",
      rating: 5,
      date: "3 weeks ago",
      dateValue: new Date("2024-11-25"),
      comment:
        "Fantastic experience renting from Sarah. Quick responses, flexible pickup times, and excellent communication throughout.",
    },
    {
      id: 3,
      reviewer: "Lisa",
      reviewerId: 3,
      reviewerUsername: "lisa789",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format",
      rating: 4,
      date: "1 month ago",
      dateValue: new Date("2024-11-15"),
      comment:
        "Great host with quality items. Sarah was very accommodating with timing and provided helpful usage tips.",
    },
  ];

  const tabs = [
    {
      id: "listings",
      label: "Listings",
      count: listedItems.length,
      icon: Package,
    },
    {
      id: "item-reviews",
      label: "Listing Reviews",
      count: itemReviews.length,
      icon: Star,
    },
    {
      id: "seller-reviews",
      label: "Seller Reviews",
      count: sellerReviews.length,
      icon: User,
    },
  ];
  const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const goToPrevTab = () => {
    const prevIndex =
      currentTabIndex > 0 ? currentTabIndex - 1 : tabs.length - 1;
    setActiveTab(tabs[prevIndex].id);
  };

  const goToNextTab = () => {
    const nextIndex =
      currentTabIndex < tabs.length - 1 ? currentTabIndex + 1 : 0;
    setActiveTab(tabs[nextIndex].id);
  };

  const calculateAvgItemRating = () => {
    if (itemReviews.length === 0) return "0.0";
    const total = itemReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / itemReviews.length).toFixed(1);
  };

  const calculateAvgSellerRating = () => {
    if (sellerReviews.length === 0) return "0.0";
    const total = sellerReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / sellerReviews.length).toFixed(1);
  };

  // Filter and sort item reviews
  const filteredAndSortedItemReviews = useMemo(() => {
    let filtered = itemReviews;

    // Filter by search query
    if (itemReviewSearchQuery) {
      filtered = filtered.filter(
        (review) =>
          review.comment
            .toLowerCase()
            .includes(itemReviewSearchQuery.toLowerCase()) ||
          review.reviewer
            .toLowerCase()
            .includes(itemReviewSearchQuery.toLowerCase()) ||
          review.itemName
            .toLowerCase()
            .includes(itemReviewSearchQuery.toLowerCase()),
      );
    }

    // Filter by rating
    if (itemReviewRatingFilter !== "all") {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(itemReviewRatingFilter),
      );
    }

    // Sort reviews
    switch (itemReviewSortBy) {
      case "newest":
        filtered.sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());
        break;
      case "rating-high":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-low":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [
    itemReviews,
    itemReviewSearchQuery,
    itemReviewSortBy,
    itemReviewRatingFilter,
  ]);

  useEffect(() => {
    setCurrentItemReviewPage(1);
  }, [
    itemReviewSearchQuery,
    itemReviewSortBy,
    itemReviewRatingFilter,
    itemReviews.length,
  ]);

  useEffect(() => {
    const totalPages = Math.ceil(
      filteredAndSortedItemReviews.length / REVIEWS_PER_PAGE,
    );
    if (totalPages === 0 && currentItemReviewPage !== 1) {
      setCurrentItemReviewPage(1);
    } else if (totalPages > 0 && currentItemReviewPage > totalPages) {
      setCurrentItemReviewPage(totalPages);
    }
  }, [filteredAndSortedItemReviews.length, currentItemReviewPage]);

  const totalItemReviewPages = Math.max(
    1,
    Math.ceil(filteredAndSortedItemReviews.length / REVIEWS_PER_PAGE),
  );

  const paginatedItemReviews = useMemo(() => {
    if (filteredAndSortedItemReviews.length === 0) {
      return [];
    }
    const startIndex = (currentItemReviewPage - 1) * REVIEWS_PER_PAGE;
    return filteredAndSortedItemReviews.slice(
      startIndex,
      startIndex + REVIEWS_PER_PAGE,
    );
  }, [filteredAndSortedItemReviews, currentItemReviewPage]);

  // Filter and sort seller reviews
  const filteredAndSortedSellerReviews = useMemo(() => {
    let filtered = sellerReviews;

    // Filter by search query
    if (sellerReviewSearchQuery) {
      filtered = filtered.filter(
        (review) =>
          review.comment
            .toLowerCase()
            .includes(sellerReviewSearchQuery.toLowerCase()) ||
          review.reviewer
            .toLowerCase()
            .includes(sellerReviewSearchQuery.toLowerCase()),
      );
    }

    // Filter by rating
    if (sellerReviewRatingFilter !== "all") {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(sellerReviewRatingFilter),
      );
    }

    // Sort reviews
    switch (sellerReviewSortBy) {
      case "newest":
        filtered.sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());
        break;
      case "rating-high":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-low":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [
    sellerReviews,
    sellerReviewSearchQuery,
    sellerReviewSortBy,
    sellerReviewRatingFilter,
  ]);

  useEffect(() => {
    setCurrentSellerReviewPage(1);
  }, [
    sellerReviewSearchQuery,
    sellerReviewSortBy,
    sellerReviewRatingFilter,
    sellerReviews.length,
  ]);

  useEffect(() => {
    const totalPages = Math.ceil(
      filteredAndSortedSellerReviews.length / REVIEWS_PER_PAGE,
    );
    if (totalPages === 0 && currentSellerReviewPage !== 1) {
      setCurrentSellerReviewPage(1);
    } else if (totalPages > 0 && currentSellerReviewPage > totalPages) {
      setCurrentSellerReviewPage(totalPages);
    }
  }, [filteredAndSortedSellerReviews.length, currentSellerReviewPage]);

  const totalSellerReviewPages = Math.max(
    1,
    Math.ceil(filteredAndSortedSellerReviews.length / REVIEWS_PER_PAGE),
  );

  const paginatedSellerReviews = useMemo(() => {
    if (filteredAndSortedSellerReviews.length === 0) {
      return [];
    }
    const startIndex = (currentSellerReviewPage - 1) * REVIEWS_PER_PAGE;
    return filteredAndSortedSellerReviews.slice(
      startIndex,
      startIndex + REVIEWS_PER_PAGE,
    );
  }, [filteredAndSortedSellerReviews, currentSellerReviewPage]);

  // If redirecting from /profile/:username to /profile (own profile), don't render the other user view
  if (isOwnUsername && username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
        aria-hidden="true"
      />

      {/* Main Content - 30/70 Split */}
      <div className="h-[calc(100vh-4rem)]">
        <div className="h-full flex overflow-hidden">
          {/* Left Side - Profile Info (30%) */}
          <div className="hidden lg:block w-1/4 bg-muted/30 overflow-hidden">
            <div className="p-6">
              {/* Settings Cog - Only for own profile */}
              {!viewingOtherUser && (
                <div className="flex justify-end mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        title="Settings"
                        className="p-0 h-8 w-8"
                      >
                        <Settings className="!size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setIsChangeUsernameModalOpen(true)}
                      >
                        Change username
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsChangePasswordModalOpen(true)}
                      >
                        Change password
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsChangeEmailModalOpen(true)}
                      >
                        Change email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <div className="text-center">
                {/* Profile Picture with Edit on Hover */}
                <div className="relative inline-block group mb-4">
                  <Avatar
                    className={cn("h-32 w-32 mx-auto", avatarOutlineClass)}
                  >
                    <AvatarImage
                      src={userProfile.profileImage}
                      alt={userProfile.name}
                    />
                    <AvatarFallback className="text-2xl">
                      {userProfile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {!viewingOtherUser && isEditingProfile && (
                    <div
                      className="absolute inset-0 bg-black/50 rounded-full opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={openAvatarFilePicker}
                      role="button"
                      aria-label="Change profile photo"
                    >
                      <Edit3 className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                {isEditingProfile ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold mb-2 text-center"
                  />
                ) : (
                  <h1 className="text-2xl font-bold mb-2">
                    {userProfile.name}
                  </h1>
                )}

                {/* Badges */}
                {earnedBadges.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {earnedBadges.map((b) => (
                      <span
                        key={b.key}
                        className="inline-flex items-center"
                        title={b.title}
                        aria-label={b.title}
                      >
                        <Shield
                          className="h-[13.2px] w-[13.2px]"
                          fill="currentColor"
                          style={{ color: b.color }}
                        />
                      </span>
                    ))}
                  </div>
                )}

                {/* Location - Only show for current user */}
                {!viewingOtherUser && (
                  <div className="mb-4">
                    {isEditingProfile ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center gap-2"
                        onClick={() => setIsLocationModalOpen(true)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="text-sm">
                          {typeof locationCity === "string" &&
                          locationCity.trim()
                            ? locationCity.trim()
                            : "Add a location"}
                        </span>
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center space-x-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {locationDisplay ?? "Add a location"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Average Review Rating */}
                <div className="mb-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.floor(userProfile.avgRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300",
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{userProfile.avgRating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({itemReviews.length} reviews)
                    </span>
                  </div>
                </div>

                {/* Date Joined */}
                <div className="mb-4">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Joined {userProfile.dateJoined}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!viewingOtherUser && (
                    <Button
                      className="w-full"
                      onClick={async () => {
                        if (isEditingProfile) {
                          try {
                            const nameParts = name.trim().split(/\s+/);
                            const firstName = nameParts[0] || "";
                            const lastName =
                              nameParts.length > 1
                                ? nameParts.slice(1).join(" ")
                                : null;
                            const body: any = {
                              email: authUser?.email,
                              name,
                              first_name: firstName,
                              last_name: lastName,
                              latitude:
                                typeof locationLatitude === "number"
                                  ? locationLatitude
                                  : null,
                              longitude:
                                typeof locationLongitude === "number"
                                  ? locationLongitude
                                  : null,
                              location_city:
                                typeof locationCity === "string" &&
                                locationCity.trim()
                                  ? locationCity.trim()
                                  : null,
                            };
                            if (profileImageUrl !== originalImageUrl) {
                              body.avatar_url = profileImageUrl;
                            }
                            const response = await apiFetch("users", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify(body),
                            });
                            const responseData = await response
                              .json()
                              .catch(() => ({}) as any);
                            if (responseData?.user) {
                              setOriginalImageUrl(profileImageUrl);
                              applyUserData(responseData.user);
                              // Refresh auth context to update authUser with new location data
                              await checkAuth();
                            }
                          } catch {}
                        } else {
                          setOriginalImageUrl(profileImageUrl);
                        }
                        setIsEditingProfile((v) => !v);
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {isEditingProfile ? "Save changes" : "Edit Profile"}
                    </Button>
                  )}
                  {!viewingOtherUser && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsFavoritesModalOpen(true)}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Favorites
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:text-white dark:border-red-600 dark:hover:text-white dark:hover:bg-red-700 dark:hover:border-red-700"
                        onClick={() => setIsLogoutModalOpen(true)}
                      >
                        Log out
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Tabs Content (70%) */}
          <div className="flex-1 bg-background overflow-y-auto no-scrollbar">
            <div className="p-8">
              {/* Mobile Tab Navigation */}
              <div className="md:hidden mb-6">
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPrevTab}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center space-x-2 flex-1 justify-center">
                    {React.createElement(tabs[currentTabIndex].icon, {
                      className: "h-4 w-4",
                    })}
                    <span className="font-medium text-sm">
                      {tabs[currentTabIndex].label} (
                      {tabs[currentTabIndex].count})
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextTab}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger
                      value="listings"
                      className="flex items-center space-x-2"
                    >
                      <Package className="h-4 w-4" />
                      <span>Listings ({listedItems.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="item-reviews"
                      className="flex items-center space-x-2"
                    >
                      <Star className="h-4 w-4" />
                      <span>Listing Reviews ({itemReviews.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="seller-reviews"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Seller Reviews ({sellerReviews.length})</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Tab Content (Works for both mobile and desktop) */}
              {activeTab === "listings" && (
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    <h2 className="text-2xl font-bold">
                      {viewingOtherUser ? "Listings" : "Your Listings"}
                    </h2>
                    {!viewingOtherUser && (
                      <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
                        {listedItems.length > 0 && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => setIsBulkEnableConfirmOpen(true)}
                            >
                              Enable All
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsBulkDisableConfirmOpen(true)}
                            >
                              Disable All
                            </Button>
                          </>
                        )}
                        <Button
                          onClick={() => (window.location.href = "/upload")}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Add New Item
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(viewingOtherUser
                      ? listedItems.filter((item) => item.enabled !== false)
                      : listedItems
                    ).map((item) => (
                      <ProductCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        price={item.price}
                        rating={item.rating}
                        reviews={item.reviews}
                        image={item.image}
                        host={item.host}
                        hostUserId={item.hostUserId}
                        hostUsername={item.hostUsername}
                        type={item.type}
                        categories={item.categories}
                        distance={viewingOtherUser ? item.distance : null}
                        hideHostInfo={true}
                        priceUnitLabel="per day"
                        onFavorite={handleFavorite}
                        isFavorited={favoritedListingIds.has(item.id)}
                        onEditClick={
                          !viewingOtherUser ? () => handleEdit(item) : undefined
                        }
                        enabled={item.enabled ?? true}
                        onDisableClick={
                          !viewingOtherUser
                            ? () => {
                                setItemToDisable(item);
                                setIsDisableModalOpen(true);
                              }
                            : undefined
                        }
                        onEnableClick={
                          !viewingOtherUser
                            ? () => {
                                setItemToEnable(item);
                                setIsEnableModalOpen(true);
                              }
                            : undefined
                        }
                        onDeleteClick={
                          !viewingOtherUser
                            ? () => {
                                setItemToDelete(item);
                                setIsDeleteModalOpen(true);
                              }
                            : undefined
                        }
                        onClick={() => {
                          window.location.href = `/listing/${item.id}`;
                        }}
                        delivery={item.delivery}
                        freeDelivery={item.freeDelivery}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "item-reviews" && (
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    <h2 className="text-2xl font-bold">
                      Reviews for Your Listings
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i <
                                Math.floor(parseFloat(calculateAvgItemRating()))
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300",
                            )}
                          />
                        ))}
                      </div>
                      <span className="font-medium">
                        {calculateAvgItemRating()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({itemReviews.length} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Review Filters and Controls */}
                  <div className="mb-8 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                      {/* Search Reviews */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reviews..."
                          value={itemReviewSearchQuery}
                          onChange={(e) =>
                            setItemReviewSearchQuery(e.target.value)
                          }
                          className="pl-9"
                        />
                      </div>

                      {/* Sort By */}
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={itemReviewSortBy}
                          onValueChange={setItemReviewSortBy}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest first</SelectItem>
                            <SelectItem value="oldest">Oldest first</SelectItem>
                            <SelectItem value="rating-high">
                              Highest rating
                            </SelectItem>
                            <SelectItem value="rating-low">
                              Lowest rating
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter by Rating */}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={itemReviewRatingFilter}
                          onValueChange={setItemReviewRatingFilter}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All ratings" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All ratings</SelectItem>
                            <SelectItem value="5">5 stars</SelectItem>
                            <SelectItem value="4">4 stars</SelectItem>
                            <SelectItem value="3">3 stars</SelectItem>
                            <SelectItem value="2">2 stars</SelectItem>
                            <SelectItem value="1">1 star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-muted-foreground">
                      Showing {paginatedItemReviews.length} of{" "}
                      {filteredAndSortedItemReviews.length} reviews
                    </div>
                  </div>

                  <div className="space-y-4">
                    {paginatedItemReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-3">
                            <button
                              onClick={() => {
                                if (review.reviewerUsername) {
                                  navigate(
                                    `/profile/${review.reviewerUsername}`,
                                  );
                                }
                              }}
                              className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                              aria-label="Open profile"
                            >
                              <Avatar>
                                <AvatarImage
                                  src={review.avatar || undefined}
                                  alt={review.reviewer}
                                />
                                <AvatarFallback>
                                  {review.reviewer
                                    .split(" ")[0][0]
                                    ?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {review.itemName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Review by {review.reviewer} • {review.date}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300",
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">
                            {review.comment}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredAndSortedItemReviews.length > 0 &&
                    totalItemReviewPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-8">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-[20px]"
                          aria-label="Previous listing reviews"
                          disabled={currentItemReviewPage === 1}
                          onClick={() =>
                            setCurrentItemReviewPage((page) =>
                              Math.max(1, page - 1),
                            )
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {currentItemReviewPage} of {totalItemReviewPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-[20px]"
                          aria-label="Next listing reviews"
                          disabled={
                            currentItemReviewPage === totalItemReviewPages
                          }
                          onClick={() =>
                            setCurrentItemReviewPage((page) =>
                              Math.min(totalItemReviewPages, page + 1),
                            )
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                </div>
              )}

              {activeTab === "seller-reviews" && (
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    <h2 className="text-2xl font-bold">Reviews as a Seller</h2>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i <
                                Math.floor(
                                  parseFloat(calculateAvgSellerRating()),
                                )
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300",
                            )}
                          />
                        ))}
                      </div>
                      <span className="font-medium">
                        {calculateAvgSellerRating()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({sellerReviews.length} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Review Filters and Controls */}
                  <div className="mb-8 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                      {/* Search Reviews */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reviews..."
                          value={sellerReviewSearchQuery}
                          onChange={(e) =>
                            setSellerReviewSearchQuery(e.target.value)
                          }
                          className="pl-9"
                        />
                      </div>

                      {/* Sort By */}
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={sellerReviewSortBy}
                          onValueChange={setSellerReviewSortBy}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest first</SelectItem>
                            <SelectItem value="oldest">Oldest first</SelectItem>
                            <SelectItem value="rating-high">
                              Highest rating
                            </SelectItem>
                            <SelectItem value="rating-low">
                              Lowest rating
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter by Rating */}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={sellerReviewRatingFilter}
                          onValueChange={setSellerReviewRatingFilter}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All ratings" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All ratings</SelectItem>
                            <SelectItem value="5">5 stars</SelectItem>
                            <SelectItem value="4">4 stars</SelectItem>
                            <SelectItem value="3">3 stars</SelectItem>
                            <SelectItem value="2">2 stars</SelectItem>
                            <SelectItem value="1">1 star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-muted-foreground">
                      Showing {paginatedSellerReviews.length} of{" "}
                      {filteredAndSortedSellerReviews.length} reviews
                    </div>
                  </div>

                  <div className="space-y-4">
                    {paginatedSellerReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-3">
                            <button
                              onClick={() => {
                                if (review.reviewerUsername) {
                                  navigate(
                                    `/profile/${review.reviewerUsername}`,
                                  );
                                }
                              }}
                              className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                              aria-label="Open profile"
                            >
                              <Avatar>
                                <AvatarImage
                                  src={review.avatar || undefined}
                                  alt={review.reviewer}
                                />
                                <AvatarFallback>
                                  {review.reviewer
                                    .split(" ")[0][0]
                                    ?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {review.reviewer}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {review.date}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300",
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">
                            {review.comment}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredAndSortedSellerReviews.length > 0 &&
                    totalSellerReviewPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-8">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-[20px]"
                          aria-label="Previous seller reviews"
                          disabled={currentSellerReviewPage === 1}
                          onClick={() =>
                            setCurrentSellerReviewPage((page) =>
                              Math.max(1, page - 1),
                            )
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {currentSellerReviewPage} of {totalSellerReviewPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-[20px]"
                          aria-label="Next seller reviews"
                          disabled={
                            currentSellerReviewPage === totalSellerReviewPages
                          }
                          onClick={() =>
                            setCurrentSellerReviewPage((page) =>
                              Math.min(totalSellerReviewPages, page + 1),
                            )
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                </div>
              )}
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
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        initialLocation={{
          city: locationCity,
          latitude: locationLatitude,
          longitude: locationLongitude,
        }}
        onConfirm={handleLocationConfirm}
        onClear={handleLocationClear}
      />

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await logout();
                setIsLogoutModalOpen(false);
                window.location.href = "/";
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Listing Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to delete ${itemToDelete?.name ?? "this listing"}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                let ok = false;
                try {
                  if (itemToDelete?.id != null) {
                    const res = await apiFetch(`listings/${itemToDelete.id}`, {
                      method: "DELETE",
                    });
                    const data = await res.json().catch(() => ({}) as any);
                    ok = Boolean(res.ok && data && data.ok);
                    if (ok) {
                      setDeletedItemName(itemToDelete.name);
                      setListedItems((prev) =>
                        prev.filter((i) => i.id !== itemToDelete.id),
                      );
                      setIsDeleteModalOpen(false);
                      setItemToDelete(null);
                      setIsDeleteSuccessModalOpen(true);
                    }
                  }
                } catch {}
                if (!ok) {
                  alert(
                    "Failed to delete listing on server. Please try again.",
                  );
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Listing Modal */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Listing</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to disable ${itemToDisable?.name ?? "this listing"}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDisableModalOpen(false);
                setItemToDisable(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                let ok = false;
                try {
                  if (itemToDisable?.id != null) {
                    const res = await apiFetch(
                      `listings/${itemToDisable.id}/toggle-enabled`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: false }),
                      },
                    );
                    const data = await res.json().catch(() => ({}) as any);
                    ok = Boolean(res.ok && data && data.ok);
                    if (ok) {
                      setListedItems((prev) =>
                        prev.map((i) =>
                          i.id === itemToDisable.id
                            ? { ...i, enabled: false }
                            : i,
                        ),
                      );
                    }
                  }
                } catch {}
                if (!ok)
                  alert(
                    "Failed to disable listing on server. Please try again.",
                  );
                setIsDisableModalOpen(false);
                setItemToDisable(null);
              }}
              className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable Listing Modal */}
      <Dialog open={isEnableModalOpen} onOpenChange={setIsEnableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Listing</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to enable ${itemToEnable?.name ?? "this listing"}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEnableModalOpen(false);
                setItemToEnable(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                let ok = false;
                try {
                  if (itemToEnable?.id != null) {
                    const res = await apiFetch(
                      `listings/${itemToEnable.id}/toggle-enabled`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: true }),
                      },
                    );
                    const data = await res.json().catch(() => ({}) as any);
                    ok = Boolean(res.ok && data && data.ok);
                    if (ok) {
                      setListedItems((prev) =>
                        prev.map((i) =>
                          i.id === itemToEnable.id
                            ? { ...i, enabled: true }
                            : i,
                        ),
                      );
                    }
                  }
                } catch {}
                if (!ok)
                  alert(
                    "Failed to enable listing on server. Please try again.",
                  );
                setIsEnableModalOpen(false);
                setItemToEnable(null);
              }}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Listing Deleted Success Modal */}
      <Dialog
        open={isDeleteSuccessModalOpen}
        onOpenChange={setIsDeleteSuccessModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Listing Deleted</DialogTitle>
            <DialogDescription>
              {`${deletedItemName} has been successfully deleted.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsDeleteSuccessModalOpen(false);
                setDeletedItemName("");
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Enable All Confirmation Modal */}
      <Dialog
        open={isBulkEnableConfirmOpen}
        onOpenChange={setIsBulkEnableConfirmOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable All Listings</DialogTitle>
            <DialogDescription>
              Are you sure you want to enable all of your listings? This will
              make them visible in search results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkEnableConfirmOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkEnableAll}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              Enable All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Disable All Confirmation Modal */}
      <Dialog
        open={isBulkDisableConfirmOpen}
        onOpenChange={setIsBulkDisableConfirmOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable All Listings</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable all of your listings? This will
              prevent them from showing in search results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkDisableConfirmOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDisableAll}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Disable All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Success Modal */}
      <Dialog
        open={Boolean(bulkSuccessMessage)}
        onOpenChange={() => setBulkSuccessMessage(null)}
      >
        <DialogContent className="sm:max-w-md py-12 px-8">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center text-xl">
              {bulkSuccessMessage}
            </DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Mobile Profile Floating Button - Only visible on mobile/tablet */}
      <Button
        onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg lg:hidden z-30"
        size="icon"
      >
        {isMobileProfileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <UserIcon className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Profile Popup - Slides up from bottom */}
      <div
        className={`fixed inset-x-0 top-24 bottom-0 z-20 border-t lg:hidden transition-transform duration-300 ease-in-out bg-white dark:bg-[rgb(44,51,62)] ${
          isMobileProfileOpen
            ? "translate-y-0" // Slide up to visible position
            : "translate-y-[115%]" // Slide down past viewport when hidden
        }`}
      >
        {/* Profile Header */}
        <div className="px-4 pb-4 pt-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Profile</h3>
          {!viewingOtherUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  title="Settings"
                  className="p-0 h-8 w-8"
                >
                  <Settings className="!size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsChangeUsernameModalOpen(true)}
                >
                  Change username
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsChangePasswordModalOpen(true)}
                >
                  Change password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsChangeEmailModalOpen(true)}
                >
                  Change email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Profile Content */}
        <div className="px-4 pb-4 h-full overflow-y-auto no-scrollbar">
          <div className="rounded-lg p-6">
            <div className="text-center">
              {/* Profile Picture */}
              <div className="relative inline-block group mb-4">
                <Avatar className={cn("h-24 w-24 mx-auto", avatarOutlineClass)}>
                  <AvatarImage
                    src={userProfile.profileImage}
                    alt={userProfile.name}
                  />
                  <AvatarFallback>
                    {userProfile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {!viewingOtherUser && isEditingProfile && (
                  <div
                    className="absolute inset-0 bg-black/50 rounded-full opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={openAvatarFilePicker}
                    role="button"
                    aria-label="Change profile photo"
                  >
                    <Edit3 className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Name and Member Since */}
              {isEditingProfile ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xl font-bold mb-1 text-center"
                />
              ) : (
                <h1 className="text-xl font-bold mb-1">{userProfile.name}</h1>
              )}

              {/* Badges */}
              {earnedBadges.length > 0 && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  {earnedBadges.map((b) => (
                    <span
                      key={b.key}
                      className="inline-flex items-center"
                      title={b.title}
                      aria-label={b.title}
                    >
                      <Shield
                        className="h-[13.2px] w-[13.2px]"
                        fill="currentColor"
                        style={{ color: b.color }}
                      />
                    </span>
                  ))}
                </div>
              )}

              {/* Location - Only show for current user */}
              {!viewingOtherUser && (
                <div className="mb-4">
                  {isEditingProfile ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center gap-2"
                      onClick={() => setIsLocationModalOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="text-sm">
                        {typeof locationCity === "string" && locationCity.trim()
                          ? locationCity.trim()
                          : "Add a location"}
                      </span>
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center space-x-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {locationDisplay ?? "Add a location"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Average Review Rating */}
              <div className="mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(userProfile.avgRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300",
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{userProfile.avgRating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({itemReviews.length} reviews)
                  </span>
                </div>
              </div>

              {/* Date Joined */}
              <div className="mb-4">
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Joined {userProfile.dateJoined}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!viewingOtherUser && (
                  <Button
                    className="w-full"
                    onClick={async () => {
                      if (isEditingProfile) {
                        try {
                          const nameParts = name.trim().split(/\s+/);
                          const firstName = nameParts[0] || "";
                          const lastName =
                            nameParts.length > 1
                              ? nameParts.slice(1).join(" ")
                              : null;
                          const body: any = {
                            email: authUser?.email,
                            name,
                            first_name: firstName,
                            last_name: lastName,
                            latitude:
                              typeof locationLatitude === "number"
                                ? locationLatitude
                                : null,
                            longitude:
                              typeof locationLongitude === "number"
                                ? locationLongitude
                                : null,
                            location_city:
                              typeof locationCity === "string" &&
                              locationCity.trim()
                                ? locationCity.trim()
                                : null,
                          };
                          if (profileImageUrl !== originalImageUrl) {
                            body.avatar_url = profileImageUrl;
                          }
                          const response = await apiFetch("users", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify(body),
                          });
                          const responseData = await response
                            .json()
                            .catch(() => ({}) as any);
                          if (responseData?.user) {
                            setOriginalImageUrl(profileImageUrl);
                            applyUserData(responseData.user);
                          }
                        } catch {}
                      } else {
                        setOriginalImageUrl(profileImageUrl);
                      }
                      setIsEditingProfile((v) => !v);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditingProfile ? "Save changes" : "Edit Profile"}
                  </Button>
                )}
                {!viewingOtherUser && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsFavoritesModalOpen(true)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Favorites
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:text-white dark:border-red-600 dark:hover:text-white dark:hover:bg-red-700 dark:hover:border-red-700"
                      onClick={() => setIsLogoutModalOpen(true)}
                    >
                      Log out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Username Modal */}
      <ChangeUsernameModal
        isOpen={isChangeUsernameModalOpen}
        onOpenChange={setIsChangeUsernameModalOpen}
        currentUsername={authUser?.username}
        onSuccess={(newUsername) => {
          setNewUsernameForConfirmation(newUsername);
          setIsUsernameChangeSuccessOpen(true);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
        onSuccess={() => {
          setIsPasswordChangeSuccessOpen(true);
        }}
      />

      {/* Change Email Modal */}
      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onOpenChange={setIsChangeEmailModalOpen}
        currentEmail={authUser?.email}
        onSuccess={(newEmail) => {
          setNewEmailForConfirmation(newEmail);
          setIsEmailChangeSuccessOpen(true);
        }}
      />

      {/* Password Change Success Modal */}
      <Dialog
        open={isPasswordChangeSuccessOpen}
        onOpenChange={setIsPasswordChangeSuccessOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Changed Successfully</DialogTitle>
            <DialogDescription>
              Your password has been updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsPasswordChangeSuccessOpen(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Change Success Modal */}
      <Dialog
        open={isEmailChangeSuccessOpen}
        onOpenChange={setIsEmailChangeSuccessOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Changed Successfully</DialogTitle>
            <DialogDescription>
              Your email has been updated to: {newEmailForConfirmation}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsEmailChangeSuccessOpen(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Username Change Success Modal */}
      <Dialog
        open={isUsernameChangeSuccessOpen}
        onOpenChange={setIsUsernameChangeSuccessOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Username Changed Successfully</DialogTitle>
            <DialogDescription>
              Your username has been updated to: {newUsernameForConfirmation}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsUsernameChangeSuccessOpen(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
