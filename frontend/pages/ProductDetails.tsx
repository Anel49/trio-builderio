import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FavoritesModal } from "@/components/ui/favorites-modal";
import { AddToFavoritesModal } from "@/components/ui/add-to-favorites-modal";
import { RemoveFromFavoritesModal } from "@/components/ui/remove-from-favorites-modal";
import { ReportModal } from "@/components/ui/report-modal";
import { ViewAllButton } from "@/components/ui/view-all-button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ReservationPeriod } from "@/lib/reservations";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ENABLE_FAVORITES } from "@/lib/constants";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import Header from "@/components/Header";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Footer } from "@/components/Footer";
import { SignUpModal } from "@/components/ui/signup-modal";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { ListingLocationModal } from "@/components/ui/listing-location-modal";
import { cn } from "@/lib/utils";
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
import {
  Star,
  Heart,
  MapPin,
  Map,
  Calendar,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  SlidersHorizontal,
  Flag,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const REVIEWS_PER_PAGE = 8;

export default function ProductDetails() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewSortBy, setReviewSortBy] = useState("newest");
  const [reviewRatingFilter, setReviewRatingFilter] = useState("all");
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isAddToFavoritesModalOpen, setIsAddToFavoritesModalOpen] =
    useState(false);
  const [isRemoveFromFavoritesModalOpen, setIsRemoveFromFavoritesModalOpen] =
    useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [favoritedListing, setFavoritedListing] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  const handleFavorite = async (listingName: string, listingId: number) => {
    const userId = authUser?.id;
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await apiFetch(`favorites/${userId}/${listingId}`, {
          method: "DELETE",
        });
        const data = await response.json().catch(() => ({}));
        if (data.ok) {
          setFavoritedListing(listingName);
          setIsRemoveFromFavoritesModalOpen(true);
          setIsFavorited(false);
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
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const refreshReviews = async () => {
    if (!params.id) return;
    const reviewsResponse = await apiFetch(`listing-reviews/${params.id}`);
    const reviewsData = await reviewsResponse
      .json()
      .catch(() => ({ ok: true, reviews: [] }));
    if (reviewsData && reviewsData.ok && Array.isArray(reviewsData.reviews)) {
      const mapped: Review[] = reviewsData.reviews.map((r: any) => ({
        id: r.id,
        user: r.reviewerName || "Anonymous",
        avatar: r.avatar,
        rating: typeof r.rating === "number" ? r.rating : 0,
        date: new Date(r.createdAt).toLocaleDateString(),
        dateValue: new Date(r.createdAt),
        text: r.comment || "",
        reviewerId: r.reviewerId,
      }));
      setReviews(mapped);
    }
  };

  const handleSubmitReview = async () => {
    if (!authUser?.id || !params.id) {
      console.error("User not authenticated or listing ID missing");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const endpoint = isEditingReview
        ? `listing-reviews/${editingReviewId}`
        : "listing-reviews";
      const method = isEditingReview ? "PATCH" : "POST";
      const response = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          listing_id: Number(params.id),
          reviewer_id: authUser.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
        headers: { "content-type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (data.ok) {
        setReviewComment("");
        setReviewRating(5);
        setIsReviewModalOpen(false);
        setIsEditingReview(false);
        setEditingReviewId(null);
        await refreshReviews();
      } else {
        console.error("Failed to submit review:", data.error);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setReviewRating(review.rating);
    setReviewComment(review.text);
    setIsEditingReview(true);
    setIsReviewModalOpen(true);
  };

  const handleDeleteReview = async () => {
    if (!editingReviewId) return;

    try {
      const response = await apiFetch(`listing-reviews/${editingReviewId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (data.ok) {
        setIsReviewModalOpen(false);
        setIsEditingReview(false);
        setEditingReviewId(null);
        setReviewComment("");
        setReviewRating(5);
        await refreshReviews();
      } else {
        console.error("Failed to delete review:", data.error);
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const [reservations, setReservations] = useState<ReservationPeriod[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  // Check if selected dates are valid for reservation (daily rentals only)
  const isDateRangeValid = () => {
    if (!selectedDateRange.start || !selectedDateRange.end) {
      return false;
    }
    const start = selectedDateRange.start;
    const end = selectedDateRange.end;

    // Check if dates conflict with existing reservations
    for (const r of reservations) {
      const rs = new Date(r.startDate);
      const re = new Date(r.endDate);
      if (start <= re && end >= rs) return false;
    }
    return true;
  };

  // Check if there's a conflict with existing reservations
  const hasDateConflict = () => {
    if (!selectedDateRange.start || !selectedDateRange.end) {
      return false;
    }
    const start = selectedDateRange.start;
    const end = selectedDateRange.end;

    for (const r of reservations) {
      const rs = new Date(r.startDate);
      const re = new Date(r.endDate);
      if (start <= re && end >= rs) return true;
    }
    return false;
  };

  const productImages = [
    "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1574263867128-5c8a8e78c8c0?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1592747003928-7c3877cc99b7?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1592747003928-7c3877cc99b7?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1562813733-cae6da799ae4?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?w=600&h=400&fit=crop&auto=format",
  ];

  const [product, setProduct] = useState<null | {
    name: string;
    price: string;
    categories: string[];
    description: string;
    rating: number | null;
    totalReviews: number;
    location: string | null;
    distanceMiles: number | null;
    latitude: number | null;
    longitude: number | null;
    rentalPeriod: RentalPeriod;
    image?: string;
    images?: string[];
    host?: string;
    hostUserId?: number;
    hostOpenDms?: boolean;
  }>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Host information from the product listing
  const host = {
    name: product?.host || "Product Host",
    profileImage: "",
    rating: 4.8,
    totalReviews: 42,
    joinedDate: "2024",
    responseTime: "Within an hour",
  };

  const params = useParams();
  const listingId = String(params.id || "1");

  const images = useMemo(() => {
    const imgs =
      product?.images && product.images.length > 0
        ? product.images
        : product?.image
          ? [product.image]
          : productImages;
    return imgs;
  }, [product?.images, product?.image]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [params.id, product?.image, product?.images]);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    (async () => {
      try {
        await ensureCurrentUserProfile();
        if (cancelled) return;
        const coords = getCurrentUserCoordinates();
        const userZip = getCurrentUserZipCode();
        const path = coords
          ? `listings/${params.id}?user_lat=${coords.latitude}&user_lng=${coords.longitude}`
          : userZip
            ? `listings/${params.id}?user_zip=${userZip}`
            : `listings/${params.id}`;
        const response = await apiFetch(path);
        if (!response.ok || cancelled) {
          if (!cancelled) setProduct(null);
          return;
        }
        const d = await response.json().catch(() => null);
        if (!d || !d.ok || !d.listing || cancelled) {
          if (!cancelled) setProduct(null);
          return;
        }
        const l = d.listing;
        const listingCoords = extractCoordinates(l);
        const userCoords = coords ?? getCurrentUserCoordinates();
        const distanceMiles = computeDistanceMiles(userCoords, listingCoords);
        const distanceLabel = formatDistanceLabel(distanceMiles);

        if (!cancelled) {
          setProduct({
            name: l.name ?? "",
            price: l.price ?? "",
            categories:
              Array.isArray(l.categories) && l.categories.length > 0
                ? l.categories
                : l.type
                  ? [l.type]
                  : [],
            description: l.description ?? "",
            rating: typeof l.rating === "number" ? l.rating : null,
            totalReviews: 0,
            location: distanceLabel,
            distanceMiles,
            latitude: typeof l.latitude === "number" ? l.latitude : null,
            longitude: typeof l.longitude === "number" ? l.longitude : null,
            rentalPeriod: normalizeRentalPeriod(
              l.rentalPeriod ?? l.rental_period,
            ),
            image: l.image || undefined,
            images: Array.isArray(l.images) ? l.images : undefined,
            host: typeof l.host === "string" ? l.host : undefined,
            hostUserId: typeof l.hostUserId === "number" ? l.hostUserId : undefined,
            hostOpenDms:
              typeof l.hostOpenDms === "boolean" ? l.hostOpenDms : true,
          });
        }
      } catch {
        if (!cancelled) setProduct(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // Check if current product is favorited on mount
  useEffect(() => {
    const checkFavorite = async () => {
      const userId = authUser?.id;
      if (!userId || !params.id) return;

      try {
        const response = await apiFetch(
          `favorites/${userId}/${params.id}/check`,
        );
        const data = await response.json().catch(() => ({}));
        if (data.ok) {
          setIsFavorited(data.isFavorited || false);
        }
      } catch (error) {
        console.error("Failed to check favorite:", error);
      }
    };

    checkFavorite();
  }, [params.id, authUser?.id]);

  useEffect(() => {
    if (!params.id) return;
    apiFetch(`listings/${params.id}/reservations`)
      .then(async (r) => (r.ok ? r.json() : { ok: true, reservations: [] }))
      .then((d) => {
        if (d && d.ok && Array.isArray(d.reservations)) {
          const mapped: ReservationPeriod[] = d.reservations.map((r: any) => ({
            id: String(r.id),
            startDate: new Date(r.startDate),
            endDate: new Date(r.endDate),
            renterName: r.renterName,
            status: r.status,
          }));
          setReservations(mapped);
        } else {
          setReservations([]);
        }
      })
      .catch(() => setReservations([]));
  }, [params.id]);

  // Lightbox: keyboard and swipe navigation
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentImageIndex((i) => (i + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLightboxOpen, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isLightboxOpen) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isLightboxOpen) return;
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    const SWIPE_THRESHOLD = 50;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) {
        setCurrentImageIndex((i) => (i + 1) % images.length);
      } else {
        setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  type Review = {
    id: number;
    user: string;
    avatar?: string;
    rating: number;
    date: string;
    dateValue: Date;
    text: string;
    reviewerId?: number;
  };
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!params.id) return;
    apiFetch(`listing-reviews/${params.id}`)
      .then(async (r) => (r.ok ? r.json() : { ok: true, reviews: [] }))
      .then((d) => {
        if (d && d.ok && Array.isArray(d.reviews)) {
          const mapped: Review[] = d.reviews.map((r: any) => ({
            id: r.id,
            user: r.reviewerName || "Anonymous",
            avatar: r.avatar,
            rating: typeof r.rating === "number" ? r.rating : 0,
            date: new Date(r.createdAt).toLocaleDateString(),
            dateValue: new Date(r.createdAt),
            text: r.comment || "",
            reviewerId: r.reviewerId,
          }));
          setReviews(mapped);
        }
      })
      .catch(() => setReviews([]));
  }, [params.id]);

  const similarProducts = [
    {
      id: 1,
      name: "Electric Hedge Trimmer",
      price: "$25",
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop&auto=format",
      rating: 4.7,
      reviews: 23,
      type: "Landscaping",
      categories: ["Landscaping", "Garden", "Tools"],
      host: "Mike",
      distance: "1.5 miles",
      delivery: true,
      freeDelivery: false,
    },
    {
      id: 2,
      name: "Leaf Blower Set",
      price: "$30",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format",
      rating: 4.8,
      reviews: 31,
      type: "Landscaping",
      categories: ["Landscaping", "Garden"],
      host: "Jennifer",
      distance: "2.8 miles",
      delivery: true,
      freeDelivery: true,
    },
    {
      id: 3,
      name: "Garden Tiller",
      price: "$40",
      image:
        "https://images.unsplash.com/photo-1574263867128-5c8a8e78c8c0?w=300&h=200&fit=crop&auto=format",
      rating: 4.6,
      reviews: 18,
      type: "Landscaping",
      categories: ["Landscaping", "Garden", "Tools"],
      host: "David",
      distance: "4.2 miles",
      delivery: false,
      freeDelivery: false,
    },
    {
      id: 4,
      name: "Pressure Washer",
      price: "$35",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format",
      rating: 4.9,
      reviews: 27,
      type: "Tools",
      categories: ["Tools", "Landscaping"],
      host: "Lisa",
      distance: "3.7 miles",
      delivery: true,
      freeDelivery: false,
    },
  ];

  // Find user's review for this listing
  const userReview = useMemo(() => {
    return reviews.find((r) => r.reviewerId === authUser?.id) || null;
  }, [reviews, authUser?.id]);

  // Calculate average rating from reviews
  const calculatedAverageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => {
      const rating = typeof review.rating === "number" ? review.rating : 0;
      return acc + rating;
    }, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  // Use calculated average if reviews exist, otherwise use product rating from API
  const displayRating = useMemo(() => {
    return calculatedAverageRating !== null
      ? calculatedAverageRating
      : product?.rating || null;
  }, [calculatedAverageRating, product?.rating]);

  const displayTotalReviews = reviews.length;

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = [...reviews];

    // Filter by search query
    if (reviewSearchQuery) {
      filtered = filtered.filter(
        (review) =>
          review.text.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
          review.user.toLowerCase().includes(reviewSearchQuery.toLowerCase()),
      );
    }

    // Filter by rating
    if (reviewRatingFilter !== "all") {
      const targetRating = parseInt(reviewRatingFilter);
      filtered = filtered.filter((review) => review.rating === targetRating);
    }

    // Sort reviews
    switch (reviewSortBy) {
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
  }, [reviews, reviewSearchQuery, reviewSortBy, reviewRatingFilter]);

  useEffect(() => {
    setCurrentReviewPage(1);
  }, [reviewSearchQuery, reviewSortBy, reviewRatingFilter, reviews.length]);

  useEffect(() => {
    const totalPages = Math.ceil(
      filteredAndSortedReviews.length / REVIEWS_PER_PAGE,
    );
    if (totalPages === 0 && currentReviewPage !== 1) {
      setCurrentReviewPage(1);
    } else if (totalPages > 0 && currentReviewPage > totalPages) {
      setCurrentReviewPage(totalPages);
    }
  }, [filteredAndSortedReviews.length, currentReviewPage]);

  const totalReviewPages = Math.max(
    1,
    Math.ceil(filteredAndSortedReviews.length / REVIEWS_PER_PAGE),
  );

  const paginatedReviews = useMemo(() => {
    if (filteredAndSortedReviews.length === 0) {
      return [];
    }
    const startIndex = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
    return filteredAndSortedReviews.slice(
      startIndex,
      startIndex + REVIEWS_PER_PAGE,
    );
  }, [filteredAndSortedReviews, currentReviewPage]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const hasSelectedValidRange =
    Boolean(selectedDateRange.start && selectedDateRange.end) &&
    isDateRangeValid();
  const showTotalPrice =
    product.rentalPeriod === "Daily" && hasSelectedValidRange;
  const displayedPrice = showTotalPrice
    ? (() => {
        if (!selectedDateRange.start || !selectedDateRange.end)
          return product.price;
        const start = selectedDateRange.start as Date;
        const end = selectedDateRange.end as Date;
        const days =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1;
        const numericRate = Number(product.price.replace(/[^0-9.]/g, ""));
        if (!Number.isFinite(numericRate)) return product.price;
        const total = numericRate * days;
        return `$${total % 1 === 0 ? total.toFixed(0) : total.toFixed(2)}`;
      })()
    : product.price;
  const priceSubLabel = showTotalPrice ? "total" : "per day";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Product Section - 60/40 Split */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Product Images (60%) */}
          <div className="lg:col-span-3">
            {/* Main Image */}
            <div className="relative mb-4">
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              />
              {ENABLE_FAVORITES && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white heart-button-transition"
                  onMouseEnter={() => setIsHeartHovered(true)}
                  onMouseLeave={() => setIsHeartHovered(false)}
                  onClick={() =>
                    handleFavorite(product.name, Number(params.id))
                  }
                >
                  <Heart
                    className="h-5 w-5 heart-transition"
                    style={{
                      stroke: "#ff6f6f",
                      fill:
                        isHeartHovered || isFavorited
                          ? "#ff6f6f"
                          : "transparent",
                    }}
                  />
                </Button>
              )}
            </div>

            {/* Image Carousel */}
            <ScrollArea className="w-full" enableShiftWheelX>
              <div className="flex space-x-3 pb-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                      currentImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-gray-300",
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-20 h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="mt-2">
                <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-gray-400 dark:bg-gray-500" />
              </ScrollBar>
            </ScrollArea>

            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
              <DialogContent className="w-[92vw] max-w-5xl p-0 bg-transparent border-none shadow-none rounded-none">
                <DialogHeader>
                  <DialogTitle className="sr-only">Image viewer</DialogTitle>
                </DialogHeader>
                <div
                  className="relative w-full flex items-center justify-center select-none bg-black rounded-lg"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <button
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/20 hover:bg-white/30 text-white p-2"
                    onClick={() =>
                      setCurrentImageIndex(
                        (i) => (i - 1 + images.length) % images.length,
                      )
                    }
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <img
                    src={images[currentImageIndex]}
                    alt={`${product.name} ${currentImageIndex + 1}`}
                    className="max-w-[92vw] max-h-[80vh] w-auto h-auto object-contain"
                  />

                  <button
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/20 hover:bg-white/30 text-white p-2"
                    onClick={() =>
                      setCurrentImageIndex((i) => (i + 1) % images.length)
                    }
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column - Product Info & Host (40%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold flex-1">{product.name}</h1>
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive ml-4 h-8 w-8 dark:hover:bg-red-600 dark:hover:text-white"
                        onClick={() => setIsReportModalOpen(true)}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Report listing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {product.categories.filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.categories.filter(Boolean).map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
              {product.description && (
                <p className="text-muted-foreground mb-4 whitespace-pre-line">
                  {product.description}
                </p>
              )}

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        typeof displayRating === "number" &&
                          i < Math.floor(displayRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300",
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {displayRating == null ? "Not yet rated" : displayRating}
                  </span>
                </div>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
                  onClick={() =>
                    document
                      .getElementById("reviews-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  ({displayTotalReviews}{" "}
                  {displayTotalReviews === 1 ? "review" : "reviews"})
                </button>
              </div>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center text-muted-foreground mb-6 hover:text-foreground cursor-pointer transition-colors"
              >
                <Map className="h-4 w-4 mr-1" />
                <span className="text-sm underline">
                  {product.location && product.location.trim()
                    ? product.location
                    : "Distance unavailable"}
                </span>
              </button>

              <div className="text-right mb-6">
                <div
                  className={cn(
                    "text-3xl font-bold text-primary",
                    showTotalPrice && "underline",
                  )}
                >
                  {displayedPrice}
                </div>
                <div className="text-muted-foreground">{priceSubLabel}</div>
              </div>

              {/* Date Range Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select rental dates
                </label>
                <DateRangePicker
                  value={selectedDateRange}
                  onChange={setSelectedDateRange}
                  reservations={reservations}
                  rentalPeriod={product.rentalPeriod}
                  buttonClassName="w-full"
                />
              </div>

              <Button
                size="lg"
                className={cn(
                  "w-full mb-4 transition-opacity",
                  hasDateConflict() && "bg-red-600 hover:bg-red-700",
                  !isDateRangeValid() &&
                    !hasDateConflict() &&
                    "opacity-50 cursor-not-allowed",
                )}
                disabled={!isDateRangeValid()}
                onClick={() => {
                  if (isDateRangeValid()) {
                    // Pass selected dates to checkout page via URL params or localStorage
                    localStorage.setItem(
                      "selectedDates",
                      JSON.stringify(selectedDateRange),
                    );
                    window.location.href = "/checkout";
                  }
                }}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {!selectedDateRange.start || !selectedDateRange.end
                  ? "Select dates to reserve"
                  : hasDateConflict()
                    ? "Dates conflict with reservations"
                    : isDateRangeValid()
                      ? "Reserve Now"
                      : "Select dates to reserve"}
              </Button>
            </div>

            {/* Host Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={() => {
                      if (product?.hostUserId) {
                        navigate(`/profile/${product.hostUserId}`);
                      } else {
                        navigate("/profile");
                      }
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    aria-label="Open profile"
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={host.profileImage} alt={host.name} />
                      <AvatarFallback>
                        {host.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div>
                    <button
                      onClick={() => {
                        if (product?.hostUserId) {
                          navigate(`/profile/${product.hostUserId}`);
                        } else {
                          navigate("/profile");
                        }
                      }}
                      className="font-semibold text-lg hover:underline text-left cursor-pointer"
                    >
                      {host.name}
                    </button>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < Math.floor(host.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300",
                          )}
                        />
                      ))}
                      <span className="ml-2 text-sm">
                        ({host.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Joined:</span>
                    <span>{host.joinedDate}</span>
                  </div>
                  <div className="flex justify-between hidden">
                    <span>Response time:</span>
                    <span>{host.responseTime}</span>
                  </div>
                </div>

                {authUser && product?.hostOpenDms && (
                  <Button variant="outline" className="w-full mt-4">
                    Contact Host
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews Section - Full Width */}
      <section
        id="reviews-section"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <h2 className="text-2xl font-bold mb-6">
          {reviews.length === 1 ? "Review" : "Reviews"} ({reviews.length})
        </h2>

        {/* Review Filters and Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center flex-1">
              {/* Search Reviews */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <Select value={reviewSortBy} onValueChange={setReviewSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="rating-high">Highest rating</SelectItem>
                    <SelectItem value="rating-low">Lowest rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter by Rating */}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={reviewRatingFilter}
                  onValueChange={setReviewRatingFilter}
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

            {/* Post/Edit a Review Button */}
            {authUser && (
              <Button
                onClick={() => {
                  if (userReview) {
                    handleEditReview(userReview);
                  } else {
                    setIsReviewModalOpen(true);
                  }
                }}
                className="whitespace-nowrap"
              >
                {userReview ? "Edit Review" : "Post a Review"}
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {paginatedReviews.length} of{" "}
            {filteredAndSortedReviews.length}{" "}
            {filteredAndSortedReviews.length === 1 ? "review" : "reviews"}
          </div>
        </div>

        <div className="space-y-6">
          {filteredAndSortedReviews.length > 0 ? (
            paginatedReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <a href="/profile" aria-label="Open profile">
                      <Avatar>
                        <AvatarImage src={review.avatar} alt={review.user} />
                        <AvatarFallback>
                          {review.user.split(" ")[0][0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </a>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">
                          {review.user.split(" ")[0]}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {review.date}
                        </span>
                      </div>
                      <div className="flex items-center mb-3">
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
                      <p className="text-muted-foreground">{review.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No reviews found</h3>
                  <p>
                    Try adjusting your search terms or filters to find more
                    reviews.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {filteredAndSortedReviews.length > 0 && totalReviewPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              className="rounded-[20px]"
              aria-label="Previous reviews"
              disabled={currentReviewPage === 1}
              onClick={() =>
                setCurrentReviewPage((page) => Math.max(1, page - 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentReviewPage} of {totalReviewPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="rounded-[20px]"
              aria-label="Next reviews"
              disabled={currentReviewPage === totalReviewPages}
              onClick={() =>
                setCurrentReviewPage((page) =>
                  Math.min(totalReviewPages, page + 1),
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>

      {/* Similar Products Carousel */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Similar products nearby</h2>
          <ViewAllButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarProducts.slice(0, 3).map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price}
              rating={item.rating}
              reviews={item.reviews}
              image={item.image}
              host={item.host}
              categories={item.categories}
              distance={item.distance}
              onFavorite={handleFavorite}
              onClick={() => {
                window.location.href = `/product/${item.id}`;
              }}
              delivery={item.delivery}
              freeDelivery={item.freeDelivery}
            />
          ))}
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
      <ReportModal
        isOpen={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        listingTitle={product.name}
      />
      <ListingLocationModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        latitude={product?.latitude ?? null}
        longitude={product?.longitude ?? null}
        listingName={product?.name}
      />
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          setIsDeleteConfirmOpen(open);
          if (!open && editingReviewId !== null) {
            setIsReviewModalOpen(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview}>
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={isReviewModalOpen}
        onOpenChange={(open) => {
          setIsReviewModalOpen(open);
          if (!open) {
            setIsEditingReview(false);
            setEditingReviewId(null);
            setReviewComment("");
            setReviewRating(5);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingReview ? "Edit Review" : "Post a Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewRating(rating)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`Rate ${rating} stars`}
                  >
                    <Star
                      size={28}
                      className={
                        rating <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label htmlFor="review-comment" className="text-sm font-medium">
                Your Review
              </label>
              <textarea
                id="review-comment"
                placeholder="Share your experience with this listing..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full min-h-28 p-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-between pt-4">
              <div className="flex gap-2">
                {isEditingReview && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    Delete Review
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || !reviewComment.trim()}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
