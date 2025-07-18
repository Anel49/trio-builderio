import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import { SignUpModal } from "@/components/ui/signup-modal";
import { LoginModal } from "@/components/ui/login-modal";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ];

  // Mock item reviews
  const itemReviews = [
    {
      id: 1,
      itemName: "Professional Lawn Mower",
      reviewer: "Mike Johnson",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Excellent mower! Cut my 2-acre property with ease. Sarah was very helpful and the pickup/drop-off was smooth.",
    },
    {
      id: 2,
      itemName: "Designer Tool Set",
      reviewer: "Jennifer Lee",
      rating: 5,
      date: "1 month ago",
      comment:
        "Perfect tools for my home renovation project. All tools were in great condition and very well maintained.",
    },
    {
      id: 3,
      itemName: "Party Sound System",
      reviewer: "David Chen",
      rating: 4,
      date: "2 months ago",
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
      comment:
        "Sarah is an amazing host! Very responsive, friendly, and her items are always in perfect condition. Highly recommend!",
    },
    {
      id: 2,
      reviewer: "Robert Smith",
      rating: 5,
      date: "3 weeks ago",
      comment:
        "Fantastic experience renting from Sarah. Quick responses, flexible pickup times, and excellent communication throughout.",
    },
    {
      id: 3,
      reviewer: "Lisa Wang",
      rating: 4,
      date: "1 month ago",
      comment:
        "Great host with quality items. Sarah was very accommodating with timing and provided helpful usage tips.",
    },
  ];

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
  const filteredAndSortedItemReviews = React.useMemo(() => {
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
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
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
  const filteredAndSortedSellerReviews = React.useMemo(() => {
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
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
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
      {/* Header */}
      <header className="relative z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border/40 dark:border-gray-700/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-semibold">
                <a href="/">Trio</a>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a
                  href="/browse"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Browse listings
                </a>
                <a
                  href="/upload"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Rent your product
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="hidden md:inline-flex"
                onClick={() => setIsLoginModalOpen(true)}
              >
                Log in
              </Button>
              <Button onClick={() => setIsSignUpModalOpen(true)}>
                Sign up
              </Button>
              {/* Profile Picture Link */}
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
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
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 30/70 Split */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Left Side - Profile Info (30%) */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
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
                  <h1 className="text-2xl font-bold mb-2">
                    {userProfile.name}
                  </h1>

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
                      <span className="font-medium">
                        {userProfile.avgRating}
                      </span>
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
                      <Package className="h-4 w-4 mr-2" />
                      Add New Listing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Tabs Content (70%) */}
          <div className="lg:col-span-7">
            <Tabs defaultValue="listings" className="w-full">
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

              {/* Listed Items Tab */}
              <TabsContent value="listings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Your Listed Items</h2>
                    <Button>
                      <Package className="h-4 w-4 mr-2" />
                      Add New Item
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        onClick={() => {
                          window.location.href = `/product/${item.id}`;
                        }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Item Reviews Tab */}
              <TabsContent value="item-reviews">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
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

                  <div className="space-y-4">
                    {itemReviews.map((review) => (
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
              </TabsContent>

              {/* Seller Reviews Tab */}
              <TabsContent value="seller-reviews">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
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

                  <div className="space-y-4">
                    {sellerReviews.map((review) => (
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
              </TabsContent>
            </Tabs>
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
    </div>
  );
}
