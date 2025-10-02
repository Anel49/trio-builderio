import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { currentUser } from "@/lib/user-profile";
import {
  Star,
  Edit3,
  Calendar,
  Clock,
  MapPin,
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

type ListedItem = {
  id: number;
  name: string;
  price: string;
  rating: number | null;
  trips: number;
  image: string;
  host: string;
  type: string;
  distance: string;
  reviews?: number;
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
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [userRecord, setUserRecord] = useState<
    null | {
      id: number | null;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
      zipCode: string | null;
      createdAt: string | null;
      foundingSupporter: boolean;
      topReferrer: boolean;
      ambassador: boolean;
    }
  >(null);

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
  const [favoritedListing, setFavoritedListing] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ListedItem | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>(
    currentUser.profileImage,
  );
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const openAvatarFilePicker = () => avatarFileInputRef.current?.click();
  const handleAvatarUpload: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImageUrl(url);
    }
    // reset so same file re-triggers change
    e.currentTarget.value = "";
  };

  const handleFavorite = (listingName: string) => {
    setFavoritedListing(listingName);
    setIsFavoritesModalOpen(true);
  };

  // Badges state loaded from server
  const [badges, setBadges] = useState({
    foundingSupporter: false,
    topReferrer: false,
    ambassador: false,
  });

  const applyUserData = useCallback(
    (user: any) => {
      if (!user) return;
      const extractedAvatar =
        typeof user.avatarUrl === "string" && user.avatarUrl.trim()
          ? user.avatarUrl
          : typeof user.avatar_url === "string" && user.avatar_url.trim()
            ? user.avatar_url
            : null;
      const resolvedName =
        typeof user.name === "string" && user.name.trim() ? user.name : null;
      const resolvedZip =
        typeof user.zipCode === "string"
          ? user.zipCode
          : typeof user.zip_code === "string"
            ? user.zip_code
            : "";
      const founding = Boolean(
        user.foundingSupporter ?? user.founding_supporter,
      );
      const referrer = Boolean(user.topReferrer ?? user.top_referrer);
      const ambassador = Boolean(user.ambassador);

      if (resolvedName) {
        setName(resolvedName);
      }
      if (extractedAvatar) {
        setProfileImageUrl(extractedAvatar);
      }
      setZipCode(typeof resolvedZip === "string" ? resolvedZip : "");
      setBadges({
        foundingSupporter: founding,
        topReferrer: referrer,
        ambassador,
      });
      setUserRecord({
        id: typeof user.id === "number" ? user.id : Number(user.id) || null,
        name: resolvedName,
        email:
          typeof user.email === "string" && user.email.trim()
            ? user.email
            : null,
        avatarUrl: extractedAvatar,
        zipCode:
          typeof resolvedZip === "string" && resolvedZip.trim()
            ? resolvedZip
            : null,
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
    },
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(
          `users?email=${encodeURIComponent(currentUser.email)}`,
        );
        const data = await res.json().catch(() => ({}) as any);
        let user = data?.user ?? null;
        if (!user) {
          const up = await apiFetch("users", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: currentUser.email,
              name: currentUser.name,
              avatar_url: currentUser.profileImage,
              zip_code: zipCode && zipCode.trim() ? zipCode.trim() : null,
            }),
          });
          const upData = await up.json().catch(() => ({}) as any);
          user = upData?.user ?? null;
        }
        if (user) {
          applyUserData(user);
        }
      } catch {}
    })();
  }, [applyUserData]);

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
    if (
      typeof currentUser.joinedDate === "string" &&
      currentUser.joinedDate.trim()
    ) {
      return currentUser.joinedDate.trim();
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

  // Use centralized user profile data
  const userProfile = {
    ...currentUser,
    name,
    profileImage: profileImageUrl,
    zipCode: zipCode,
    avgRating: currentUser.rating,
    dateJoined: `March ${currentUser.joinedDate}`,
    avgResponseTime: currentUser.responseTime,
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
      distance: "0 miles",
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
      distance: "0 miles",
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
      distance: "0 miles",
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
      distance: "0 miles",
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
      distance: "0 miles",
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
      distance: "0 miles",
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
      distance: "0 miles",
    },
  ];

  const [listedItems, setListedItems] = useState<ListedItem[]>([]);

  useEffect(() => {
    apiFetch("listings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(async (d) => {
        if (d && d.ok && Array.isArray(d.listings)) {
          const mapped: ListedItem[] = d.listings.map((l: any) => ({
            id: l.id,
            name: l.name,
            price: l.price,
            rating: typeof l.rating === "number" ? l.rating : null,
            trips: 0,
            image:
              Array.isArray(l.images) && l.images.length
                ? l.images[0]
                : l.image,
            host: l.host || "You",
            type:
              Array.isArray(l.categories) && l.categories.length
                ? l.categories[0]
                : l.type || "General",
            distance: l.distance || "0 miles",
          }));
          setListedItems(mapped);

          // Fetch reviews per listing, resilient to failures
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
                rating: Number(rev.rating) || 0,
                date: rev.date || new Date().toLocaleDateString(),
                dateValue: new Date(rev.dateValue || Date.now()),
                comment: rev.text || "",
              });
            });
          });
          setItemReviews(combined);
          setListedItems((prev) =>
            prev.map((it) => {
              const entry = countMap.get(it.id);
              return entry
                ? {
                    ...it,
                    reviews: entry.count,
                    rating: it.rating ?? entry.avg,
                  }
                : it;
            }),
          );
        }
      })
      .catch(() => {});
  }, []);

  // Item reviews from DB
  const [itemReviews, setItemReviews] = useState<
    {
      id: number;
      itemName: string;
      reviewer: string;
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
    rating: number;
    date: string;
    dateValue: Date;
    comment: string;
  }[] = [
    {
      id: 1,
      reviewer: "Emily",
      rating: 5,
      date: "1 week ago",
      dateValue: new Date("2024-12-08"),
      comment:
        "Sarah is an amazing host! Very responsive, friendly, and her items are always in perfect condition. Highly recommend!",
    },
    {
      id: 2,
      reviewer: "Robert",
      rating: 5,
      date: "3 weeks ago",
      dateValue: new Date("2024-11-25"),
      comment:
        "Fantastic experience renting from Sarah. Quick responses, flexible pickup times, and excellent communication throughout.",
    },
    {
      id: 3,
      reviewer: "Lisa",
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
      label: "Listed Items",
      count: listedItems.length,
      icon: Package,
    },
    {
      id: "item-reviews",
      label: "Item Reviews",
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
                  <div
                    className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={openAvatarFilePicker}
                    role="button"
                    aria-label="Change profile photo"
                  >
                    <Edit3 className="h-6 w-6 text-white" />
                  </div>
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

                {/* Zip Code */}
                <div className="mb-4">
                  {isEditingProfile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-24 text-center"
                        maxLength={10}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {userProfile.zipCode &&
                        String(userProfile.zipCode).trim()
                          ? userProfile.zipCode
                          : "Add a zip code"}
                      </span>
                    </div>
                  )}
                </div>

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
                      ({userProfile.totalReviews} reviews)
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
                  <Button
                    className="w-full"
                    onClick={async () => {
                      if (isEditingProfile) {
                        try {
                          const body: any = {
                            email: currentUser.email,
                            name,
                            avatar_url: profileImageUrl,
                            zip_code:
                              zipCode && zipCode.trim() ? zipCode.trim() : null,
                          };
                          await apiFetch("users", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify(body),
                          });
                        } catch {}
                      }
                      setIsEditingProfile((v) => !v);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditingProfile ? "Save changes" : "Edit Profile"}
                  </Button>
                  <Button variant="outline" className="w-full hidden">
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
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Tabs Content (70%) */}
          <div className="flex-1 bg-background overflow-y-auto">
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
                      <span>Listed Items ({listedItems.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="item-reviews"
                      className="flex items-center space-x-2"
                    >
                      <Star className="h-4 w-4" />
                      <span>Item Reviews ({itemReviews.length})</span>
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
                    <h2 className="text-2xl font-bold">Your Listed Items</h2>
                    <Button onClick={() => (window.location.href = "/upload")}>
                      <Package className="h-4 w-4 mr-2" />
                      Add New Item
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listedItems.map((item) => (
                      <ProductCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        price={item.price}
                        rating={item.rating}
                        reviews={item.reviews}
                        image={item.image}
                        host={item.host}
                        type={item.type}
                        distance={item.distance}
                        hideHostInfo={true}
                        onFavorite={handleFavorite}
                        onDeleteClick={() => {
                          setItemToDelete(item);
                          setIsDeleteModalOpen(true);
                        }}
                        onClick={() => {
                          window.location.href = `/product/${item.id}`;
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "item-reviews" && (
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    <h2 className="text-2xl font-bold">
                      Reviews for Your Items
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
                          <div className="flex items-start justify-between mb-3">
                            <div>
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
                          aria-label="Previous item reviews"
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
                          aria-label="Next item reviews"
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
                          <div className="flex items-start justify-between mb-3">
                            <div>
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
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onOpenChange={setIsFavoritesModalOpen}
        listingTitle={favoritedListing}
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
              onClick={() => setIsLogoutModalOpen(false)}
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
                      setListedItems((prev) =>
                        prev.filter((i) => i.id !== itemToDelete.id),
                      );
                    }
                  }
                } catch {}
                if (!ok)
                  alert(
                    "Failed to delete listing on server. Please try again.",
                  );
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
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
        className={`fixed inset-x-0 top-16 bottom-0 z-20 bg-background border-t lg:hidden transition-transform duration-300 ease-in-out ${
          isMobileProfileOpen
            ? "translate-y-0" // Slide up to visible position
            : "translate-y-full" // Slide down to hidden position
        }`}
      >
        {/* Drag Handle Tab */}
        <div
          className="flex justify-center py-3 cursor-pointer"
          onClick={() => setIsMobileProfileOpen(false)}
        >
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
        </div>

        {/* Profile Header */}
        <div className="px-4 pb-4">
          <h3 className="text-lg font-semibold">Profile</h3>
        </div>

        {/* Profile Content */}
        <div className="px-4 pb-4 h-full overflow-y-auto">
          <div className="bg-muted/30 rounded-lg p-6">
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
                <div
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={openAvatarFilePicker}
                  role="button"
                  aria-label="Change profile photo"
                >
                  <Edit3 className="h-5 w-5 text-white" />
                </div>
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

              {/* Location */}
              <div className="mb-4">
                {isEditingProfile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-24 text-center"
                      maxLength={10}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {userProfile.zipCode && String(userProfile.zipCode).trim()
                        ? userProfile.zipCode
                        : "Add a zip code"}
                    </span>
                  </div>
                )}
              </div>

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
                    ({userProfile.totalReviews} reviews)
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
                <Button
                  className="w-full"
                  onClick={async () => {
                    if (isEditingProfile) {
                      try {
                        const body: any = {
                          email: currentUser.email,
                          name,
                          avatar_url: profileImageUrl,
                          zip_code:
                            zipCode && zipCode.trim() ? zipCode.trim() : null,
                        };
                        await apiFetch("users", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify(body),
                        });
                      } catch {}
                    }
                    setIsEditingProfile((v) => !v);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditingProfile ? "Save changes" : "Edit Profile"}
                </Button>
                <Button variant="outline" className="w-full hidden">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
