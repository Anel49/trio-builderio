import React, { useState, useMemo } from "react";
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
import { PrivacyModal } from "@/components/ui/privacy-modal";
import { TermsModal } from "@/components/ui/terms-modal";
import { CookiesModal } from "@/components/ui/cookies-modal";
import { FavoritesModal } from "@/components/ui/favorites-modal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProductCard } from "@/components/ui/product-card";
import Header from "@/components/Header";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Footer } from "@/components/Footer";
import { SignUpModal } from "@/components/ui/signup-modal";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { cn } from "@/lib/utils";
import {
  Star,
  Heart,
  MapPin,
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
} from "lucide-react";

export default function ProductDetails() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewSortBy, setReviewSortBy] = useState("newest");
  const [reviewRatingFilter, setReviewRatingFilter] = useState("all");
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isCookiesModalOpen, setIsCookiesModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [favoritedListing, setFavoritedListing] = useState("");

  const handleFavorite = (listingName: string) => {
    setFavoritedListing(listingName);
    setIsFavoritesModalOpen(true);
  };

  const productImages = [
    "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1574263867128-5c8a8e78c8c0?w=600&h=400&fit=crop&auto=format",
  ];

  const product = {
    name: "Professional Riding Lawn Mower",
    price: "$45",
    categories: ["Landscaping", "Garden Equipment", "Outdoor"],
    description:
      "High-performance riding lawn mower perfect for large yards and commercial use. Features a powerful 24HP engine, 54-inch cutting deck, and comfortable seating for extended use. Includes mulching kit and side discharge chute. Regularly maintained and serviced for optimal performance.",
    rating: 4.9,
    totalReviews: 142,
    location: "2.3 miles away",
  };

  const host = {
    name: "Sarah Martinez",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612-1.jpg?w=64&h=64&fit=crop&auto=format",
    rating: 4.8,
    totalReviews: 89,
    joinedDate: "2022",
    responseTime: "within an hour",
  };

  const reviews = [
    {
      id: 1,
      user: "Mike Johnson",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&auto=format",
      rating: 5,
      date: "2 weeks ago",
      dateValue: new Date("2024-12-01"),
      text: "Excellent mower! Cut my 2-acre property with ease. Sarah was very helpful and the pickup/drop-off was smooth.",
    },
    {
      id: 2,
      user: "Jennifer Lee",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&auto=format",
      rating: 5,
      date: "1 month ago",
      dateValue: new Date("2024-11-15"),
      text: "Perfect for my large yard. The mower was in great condition and very easy to operate. Will definitely rent again!",
    },
    {
      id: 3,
      user: "David Chen",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&auto=format",
      rating: 4,
      date: "2 months ago",
      dateValue: new Date("2024-10-20"),
      text: "Good quality equipment. Minor wear but works perfectly. Host was responsive and accommodating with timing.",
    },
    {
      id: 4,
      user: "Lisa Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612f672?w=48&h=48&fit=crop&auto=format",
      rating: 3,
      date: "3 months ago",
      dateValue: new Date("2024-09-10"),
      text: "Decent mower but had some starting issues. Overall got the job done but could use better maintenance.",
    },
    {
      id: 5,
      user: "Robert Smith",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format",
      rating: 5,
      date: "4 months ago",
      dateValue: new Date("2024-08-05"),
      text: "Amazing service! The lawn mower worked flawlessly and saved me so much time. Highly recommend for large properties.",
    },
    {
      id: 6,
      user: "Emma Wilson",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&auto=format",
      rating: 2,
      date: "5 months ago",
      dateValue: new Date("2024-07-12"),
      text: "Had some mechanical problems during rental. Host was responsive but the equipment needs better upkeep.",
    },
  ];

  const similarProducts = [
    {
      id: 1,
      name: "Electric Hedge Trimmer",
      price: "$25",
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop&auto=format",
      rating: 4.7,
      type: "Landscaping",
      host: "Mike",
      distance: "1.5 miles",
    },
    {
      id: 2,
      name: "Leaf Blower Set",
      price: "$30",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format",
      rating: 4.8,
      type: "Landscaping",
      host: "Jennifer",
      distance: "2.8 miles",
    },
    {
      id: 3,
      name: "Garden Tiller",
      price: "$40",
      image:
        "https://images.unsplash.com/photo-1574263867128-5c8a8e78c8c0?w=300&h=200&fit=crop&auto=format",
      rating: 4.6,
      type: "Landscaping",
      host: "David",
      distance: "4.2 miles",
    },
    {
      id: 4,
      name: "Pressure Washer",
      price: "$35",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format",
      rating: 4.9,
      type: "Tools",
      host: "Lisa",
      distance: "3.7 miles",
    },
  ];

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Product Section - 60/40 Split */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Product Images (60%) */}
          <div className="lg:col-span-3">
            {/* Main Image */}
            <div className="relative mb-4">
              <img
                src={productImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 bg-white/80 hover:bg-white heart-button-transition"
                onMouseEnter={() => setIsHeartHovered(true)}
                onMouseLeave={() => setIsHeartHovered(false)}
                onClick={() => handleFavorite(product.name)}
              >
                <Heart
                  className="h-5 w-5 heart-transition"
                  style={{
                    stroke: "#ff6f6f",
                    fill: isHeartHovered ? "#ff6f6f" : "transparent",
                  }}
                />
              </Button>
            </div>

            {/* Image Carousel */}
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {productImages.map((image, index) => (
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
              <div className="flex flex-wrap gap-2 mb-3">
                {product.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                {product.description}
              </p>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300",
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {product.rating}
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
                  ({product.totalReviews} reviews)
                </button>
              </div>

              <div className="flex items-center text-muted-foreground mb-6">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{product.location}</span>
              </div>

              <div className="text-right mb-6">
                <div className="text-3xl font-bold text-primary">
                  {product.price}
                </div>
                <div className="text-muted-foreground">per day</div>
              </div>

              <Button size="lg" className="w-full mb-4">
                <Calendar className="mr-2 h-5 w-5" />
                Reserve Now
              </Button>
            </div>

            {/* Host Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={host.image} alt={host.name} />
                    <AvatarFallback>
                      {host.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{host.name}</h3>
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
                  <div className="flex justify-between">
                    <span>Response time:</span>
                    <span>{host.responseTime}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  Contact Host
                </Button>
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
          Reviews ({product.totalReviews})
        </h2>

        {/* Review Filters and Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
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

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedReviews.length} of {reviews.length}{" "}
            reviews
          </div>
        </div>

        <div className="space-y-6">
          {filteredAndSortedReviews.length > 0 ? (
            filteredAndSortedReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={review.avatar} alt={review.user} />
                      <AvatarFallback>
                        {review.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{review.user}</h4>
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

        {filteredAndSortedReviews.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">Load more reviews</Button>
          </div>
        )}
      </section>

      {/* Similar Products Carousel */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Similar products nearby</h2>
          <Button variant="ghost" className="group">
            View all
            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarProducts.map((item) => (
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
              onFavorite={handleFavorite}
              onClick={() => {
                window.location.href = `/product/${item.id}`;
              }}
            />
          ))}
        </div>
      </section>

      {/* Footer - Same as Homepage */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-semibold mb-4">Trio</div>
              <p className="text-muted-foreground">
                The nation's largest rental marketplace.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Rent</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="/browse"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse listings
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Weddings & events
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Host</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Rent your product
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Insurance
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              �� 2025 Trio. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => setIsTermsModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => setIsCookiesModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </footer>

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
        listingTitle={favoritedListing}
      />
    </div>
  );
}
