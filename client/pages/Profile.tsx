import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import Header from "@/components/Header";
import { SignUpModal } from "@/components/ui/signup-modal";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { FavoritesModal } from "@/components/ui/favorites-modal";
import { cn } from "@/lib/utils";
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
  Check,
  X,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Heart,
  LogOut,
  User as UserIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Profile() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditingZipCode, setIsEditingZipCode] = useState(false);
  const [zipCode, setZipCode] = useState("94102");
  const [tempZipCode, setTempZipCode] = useState("");

  // Item reviews search and filter state
  const [itemReviewSearchQuery, setItemReviewSearchQuery] = useState("");
  const [itemReviewSortBy, setItemReviewSortBy] = useState("newest");
  const [itemReviewRatingFilter, setItemReviewRatingFilter] = useState("all");

  // Seller reviews search and filter state
  const [sellerReviewSearchQuery, setSellerReviewSearchQuery] = useState("");
  const [sellerReviewSortBy, setSellerReviewSortBy] = useState("newest");
  const [sellerReviewRatingFilter, setSellerReviewRatingFilter] =
    useState("all");

  // Mobile tabs navigation
  const [activeTab, setActiveTab] = useState("listings");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [favoritedListing, setFavoritedListing] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const handleFavorite = (listingName: string) => {
    setFavoritedListing(listingName);
    setIsFavoritesModalOpen(true);
  };

  // Mock user profile data
  const userProfile = {
    name: "Sarah Martinez",
    profileImage:
      "https://images.unsplash.com/photo-1494790108755-2616b612-1.jpg?w=200&h=200&fit=crop&auto=format",
    zipCode: zipCode,
    avgRating: 4.8,
    totalReviews: 89,
    dateJoined: "March 2022",
    avgResponseTime: "within 1 hour",
  };

  // Mock listed items
  const listedItems = [
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

  // Mock item reviews
  const itemReviews = [
    {
      id: 1,
      itemName: "Professional Lawn Mower",
      reviewer: "Mike Johnson",
      rating: 5,
      date: "2 weeks ago",
      dateValue: new Date("2024-12-01"),
      comment:
        "Excellent mower! Cut my 2-acre property with ease. Sarah was very helpful and the pickup/drop-off was smooth.",
    },
    {
      id: 2,
      itemName: "Designer Tool Set",
      reviewer: "Jennifer Lee",
      rating: 5,
      date: "1 month ago",
      dateValue: new Date("2024-11-15"),
      comment:
        "Perfect tools for my home renovation project. All tools were in great condition and very well maintained.",
    },
    {
      id: 3,
      itemName: "Party Sound System",
      reviewer: "David Chen",
      rating: 4,
      date: "2 months ago",
      dateValue: new Date("2024-10-20"),
      comment:
        "Great sound quality for our outdoor party. Easy setup and Sarah provided clear instructions.",
    },
  ];

  // Mock seller reviews
  const sellerReviews = [
    {
      id: 1,
      reviewer: "Emily Rodriguez",
      rating: 5,
      date: "1 week ago",
      dateValue: new Date("2024-12-08"),
      comment:
        "Sarah is an amazing host! Very responsive, friendly, and her items are always in perfect condition. Highly recommend!",
    },
    {
      id: 2,
      reviewer: "Robert Smith",
      rating: 5,
      date: "3 weeks ago",
      dateValue: new Date("2024-11-25"),
      comment:
        "Fantastic experience renting from Sarah. Quick responses, flexible pickup times, and excellent communication throughout.",
    },
    {
      id: 3,
      reviewer: "Lisa Wang",
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

  const handleZipCodeEdit = () => {
    setTempZipCode(zipCode);
    setIsEditingZipCode(true);
  };

  const handleZipCodeSave = () => {
    setZipCode(tempZipCode);
    setIsEditingZipCode(false);
  };

  const handleZipCodeCancel = () => {
    setTempZipCode("");
    setIsEditingZipCode(false);
  };

  const calculateAvgItemRating = () => {
    const total = itemReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / itemReviews.length).toFixed(1);
  };

  const calculateAvgSellerRating = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content - 30/70 Split */}
      <div className="h-[calc(100vh-4rem)]">
        <div className="h-full flex overflow-hidden">
          {/* Left Side - Profile Info (30%) */}
          <div className="w-1/4 bg-muted/30 overflow-hidden">
            <div className="p-6">
              <div className="text-center">
                {/* Profile Picture with Edit on Hover */}
                <div className="relative inline-block group mb-4">
                  <Avatar className="h-32 w-32 mx-auto">
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
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Edit3 className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-2xl font-bold mb-2">{userProfile.name}</h1>

                {/* Zip Code - Editable on Hover */}
                <div className="mb-4">
                  {isEditingZipCode ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Input
                        value={tempZipCode}
                        onChange={(e) => setTempZipCode(e.target.value)}
                        className="w-20 text-center"
                        maxLength={5}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleZipCodeSave}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleZipCodeCancel}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="group flex items-center justify-center space-x-1 cursor-pointer hover:bg-accent/50 rounded px-2 py-1"
                      onClick={handleZipCodeEdit}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {userProfile.zipCode}
                      </span>
                      <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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

                {/* Average Response Time */}
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Responds {userProfile.avgResponseTime}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button className="w-full">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full">
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
                        image={item.image}
                        host={item.host}
                        type={item.type}
                        distance={item.distance}
                        hideHostInfo={true}
                        onFavorite={handleFavorite}
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
                      Showing {filteredAndSortedItemReviews.length} of{" "}
                      {itemReviews.length} reviews
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredAndSortedItemReviews.map((review) => (
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
                      Showing {filteredAndSortedSellerReviews.length} of{" "}
                      {sellerReviews.length} reviews
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredAndSortedSellerReviews.map((review) => (
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
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
