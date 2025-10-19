import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SignUpModal } from "@/components/ui/signup-modal";
import Header from "@/components/Header";
import {
  LocationPickerModal,
  type LocationSelection,
} from "@/components/LocationPickerModal";
import { apiFetch } from "@/lib/api";
import {
  currentUser,
  getCurrentUserLocation,
  type UserLocation,
} from "@/lib/user-profile";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { cn } from "@/lib/utils";
import {
  Star,
  Heart,
  MapPin,
  Calendar,
  Upload,
  X,
  Eye,
  Menu,
  Plus,
  Flag,
  Save,
  MessageCircle,
  Info,
  Loader2,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ENABLE_UPLOAD_PREVIEW_FAVORITES } from "@/lib/constants";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const rentalPeriods = ["Hourly", "Daily", "Weekly", "Monthly"] as const;
type RentalPeriod = (typeof rentalPeriods)[number];
const priceUnitLabels: Record<RentalPeriod, string> = {
  Hourly: "hour",
  Daily: "day",
  Weekly: "week",
  Monthly: "month",
};
const pricePlaceholderByPeriod: Record<RentalPeriod, string> = {
  Hourly: "15",
  Daily: "35",
  Weekly: "150",
  Monthly: "400",
};

export default function UploadProduct() {
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const initialListingLocation = useMemo(() => getCurrentUserLocation(), []);
  const initialListingLocationRef = useRef<UserLocation>(
    initialListingLocation,
  );
  const [listingLocation, setListingLocation] = useState<UserLocation>(
    initialListingLocationRef.current,
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>("Daily");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPriceInfoOpen, setIsPriceInfoOpen] = useState(false);
  const [offerDelivery, setOfferDelivery] = useState(false);
  const [offerFreeDelivery, setOfferFreeDelivery] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const navigationRef = useRef<{ href: string; callback?: () => void } | null>(
    null,
  );
  const priceUnit = priceUnitLabels[rentalPeriod];
  const priceLabel = `Price per ${priceUnit}`;
  const pricePlaceholder = pricePlaceholderByPeriod[rentalPeriod];

  // Mock user profile data - in real app this would come from context/API
  const hasListingCoordinates =
    typeof listingLocation.latitude === "number" &&
    Number.isFinite(listingLocation.latitude) &&
    typeof listingLocation.longitude === "number" &&
    Number.isFinite(listingLocation.longitude);

  const coordinateLabel =
    hasListingCoordinates &&
    listingLocation.latitude != null &&
    listingLocation.longitude != null
      ? `${listingLocation.latitude.toFixed(3)}, ${listingLocation.longitude.toFixed(3)}`
      : null;

  const listingLocationButtonLabel =
    listingLocation.city ?? coordinateLabel ?? "Add a location";

  const listingLocationPreviewLabel =
    listingLocation.city ?? coordinateLabel ?? "Your location";

  // Check if form has content that should be saved
  const hasContent = () => {
    const initialLocation = initialListingLocationRef.current;
    const locationChanged =
      (listingLocation.city ?? null) !== (initialLocation.city ?? null) ||
      (listingLocation.latitude ?? null) !==
        (initialLocation.latitude ?? null) ||
      (listingLocation.longitude ?? null) !==
        (initialLocation.longitude ?? null) ||
      (listingLocation.postalCode ?? null) !==
        (initialLocation.postalCode ?? null);

    return (
      title.trim() !== "" ||
      price.trim() !== "" ||
      description.trim() !== "" ||
      selectedTags.length > 0 ||
      uploadedImages.length > 0 ||
      rentalPeriod !== "Daily" ||
      locationChanged
    );
  };

  // Handle navigation protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isListed && hasContent()) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (!isListed && hasContent()) {
        e.preventDefault();
        setShowDraftDialog(true);
        setPendingNavigation("back");
        // Push current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Push initial state to detect back button
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    isListed,
    title,
    price,
    listingLocation,
    description,
    selectedTags,
    uploadedImages,
    rentalPeriod,
  ]);

  const defaultCategory = "Miscellaneous";

  const recommendedTags = [
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
    "Miscellaneous",
    "Party",
    "Pet",
    "Service",
    "Sports",
    "Tech",
    "Tool",
    "Toy",
  ];

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedImages((prev) => [...prev, e.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle navigation with draft protection
  const handleNavigation = (href: string, callback?: () => void) => {
    if (!isListed && hasContent()) {
      navigationRef.current = { href, callback };
      setShowDraftDialog(true);
      setPendingNavigation(href);
    } else {
      if (callback) {
        callback();
      } else {
        window.location.href = href;
      }
    }
  };

  // Handle draft dialog responses
  const handleSaveDraft = () => {
    // Save draft logic here (API call, localStorage, etc.)
    console.log("Saving draft:", {
      title,
      price,
      location: listingLocation,
      description,
      selectedTags,
      uploadedImages,
    });

    setShowDraftDialog(false);
    proceedWithNavigation();
  };

  const handleDiscardDraft = () => {
    setShowDraftDialog(false);
    proceedWithNavigation();
  };

  const proceedWithNavigation = () => {
    if (pendingNavigation === "back") {
      window.history.back();
    } else if (navigationRef.current) {
      if (navigationRef.current.callback) {
        navigationRef.current.callback();
      } else {
        window.location.href = navigationRef.current.href;
      }
    }
    setPendingNavigation(null);
    navigationRef.current = null;
  };

  const isFormValid = () => {
    const hasTitle = title.trim() !== "";
    const hasLocation =
      listingLocation.city !== null ||
      (typeof listingLocation.latitude === "number" &&
        Number.isFinite(listingLocation.latitude) &&
        typeof listingLocation.longitude === "number" &&
        Number.isFinite(listingLocation.longitude));
    const hasPrice = price.trim() !== "" && parseFloat(price) > 0;
    const hasDescription = description.trim() !== "";
    return hasTitle && hasLocation && hasPrice && hasDescription;
  };

  const getAsteriskColor = (isFilled: boolean) => {
    return isFilled ? "text-gray-400" : "text-red-500";
  };

  const handleListProduct = () => {
    if (isFormValid()) {
      setShowConfirmModal(true);
    }
  };

  const confirmListProduct = async () => {
    try {
      const priceCents =
        Math.round(Number(price.replace(/[^0-9.]/g, "")) * 100) || 0;
      const defaultImage =
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop&auto=format";
      const imgs = uploadedImages.length > 0 ? uploadedImages : [defaultImage];
      const fallbackZip = (() => {
        if (listingLocation.postalCode) {
          return listingLocation.postalCode;
        }
        const initialZip = initialListingLocationRef.current.postalCode;
        if (initialZip) {
          return initialZip;
        }
        const candidate =
          typeof currentUser?.zipCode === "string"
            ? currentUser.zipCode.trim()
            : "";
        return /^\d{5}$/.test(candidate) ? candidate : "00000";
      })();

      const payload = {
        name: title || "Untitled",
        price_cents: priceCents,
        rating: null,
        image: imgs[0],
        images: imgs,
        host: currentUser.name,
        type: selectedTags[0] || defaultCategory,
        categories: selectedTags.length > 0 ? selectedTags : [defaultCategory],
        description,
        rental_period: rentalPeriod,
        zip_code: fallbackZip,
        location_city: listingLocation.city,
        location_latitude: listingLocation.latitude,
        location_longitude: listingLocation.longitude,
        latitude: listingLocation.latitude,
        longitude: listingLocation.longitude,
        delivery: offerDelivery,
        free_delivery: offerFreeDelivery,
      };
      const res = await apiFetch("listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      const newId = Number(data?.id);
      if (!res.ok || !data?.ok || !Number.isFinite(newId)) {
        throw new Error("Failed to create listing");
      }
      setCreatedListingId(newId);
      setIsListed(true);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      // Skip immediate refresh to avoid redundant network calls; pages load fresh on navigation
    } catch (e) {
      setShowConfirmModal(false);
      alert("Failed to list product. Please try again.");
    }
  };

  const handleCancelListing = () => {
    setShowConfirmModal(false);
  };

  const handleViewListing = () => {
    if (!createdListingId) return;
    setShowSuccessModal(false);
    window.location.href = `/product/${createdListingId}`;
  };

  const mockHost = {
    name: "You",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612-1.jpg?w=64&h=64&fit=crop&auto=format",
    rating: 4.8,
    totalReviews: 0,
    joinedDate: "2024",
    responseTime: "within an hour",
  };

  const DraftDialog = () => (
    <Dialog open={showDraftDialog} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Draft?</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            You have unsaved changes. Would you like to save this listing as a
            draft before leaving?
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDiscardDraft}
          >
            No, Discard
          </Button>
          <Button className="flex-1" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Yes, Save Draft
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const ConfirmationModal = () => (
    <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Listing</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-muted-foreground">
            Are you sure you want to list your product?
          </p>
        </div>
        <div className="flex gap-4">
          <Button className="flex-1" onClick={confirmListProduct}>
            Yes
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancelListing}
          >
            No
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const SuccessModal = () => (
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Success!</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-muted-foreground">
            Your product has been successfully listed!
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={handleViewListing} className="w-full">
            See listing
          </Button>
          {!createdListingId && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const PreviewModal = () => (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Listing Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[75vh] pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
            {/* Left Column - Product Images (60%) */}
            <div className="lg:col-span-3">
              {/* Main Image */}
              <div className="relative mb-4">
                <img
                  src={
                    uploadedImages[0] ||
                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop&auto=format"
                  }
                  alt={title || "Product preview"}
                  className="w-full h-96 object-cover rounded-lg"
                />
                {ENABLE_UPLOAD_PREVIEW_FAVORITES && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white heart-button-transition"
                  >
                    <Heart
                      className="h-5 w-5 heart-transition"
                      style={{
                        stroke: "#ff6f6f",
                        fill: "transparent",
                      }}
                    />
                  </Button>
                )}
              </div>

              {/* Image Carousel */}
              {uploadedImages.length > 1 && (
                <ScrollArea className="w-full">
                  <div className="flex space-x-3 pb-4">
                    {uploadedImages.map((image, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-300 transition-all hover:border-primary"
                      >
                        <img
                          src={image}
                          alt={`${title} ${index + 1}`}
                          className="w-20 h-20 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="mt-2">
                    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-gray-400 dark:bg-gray-500" />
                  </ScrollBar>
                </ScrollArea>
              )}
            </div>

            {/* Right Column - Product Info & Host (40%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Information */}
              <div>
                <div className="mb-2">
                  <h1 className="text-3xl font-bold">
                    {title || "Your Product Title"}
                  </h1>
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-muted-foreground mb-4 whitespace-pre-line">
                  {description ||
                    "Your product description will appear here..."}
                </p>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(mockHost.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300",
                        )}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium">
                      {mockHost.rating}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({mockHost.totalReviews} reviews)
                  </span>
                </div>

                <div className="flex items-center text-muted-foreground mb-6">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{listingLocationPreviewLabel}</span>
                </div>

                <div className="text-right mb-6">
                  <div className="text-3xl font-bold text-primary">
                    $
                    {price
                      ? (() => {
                          const num = parseFloat(price);
                          return num % 1 === 0
                            ? num.toString()
                            : num.toFixed(2);
                        })()
                      : "0"}
                  </div>
                  <div className="text-muted-foreground">per {priceUnit}</div>
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
                    <a href="/profile" aria-label="Open profile">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={mockHost.image} alt={mockHost.name} />
                        <AvatarFallback>
                          {mockHost.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </a>
                    <div>
                      <h3 className="font-semibold text-lg">{mockHost.name}</h3>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < Math.floor(mockHost.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300",
                            )}
                          />
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {mockHost.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Response time</p>
                      <p className="text-muted-foreground">
                        {mockHost.responseTime}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Joined</p>
                      <p className="text-muted-foreground">
                        {mockHost.joinedDate}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      Contact Host
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">List your product</h1>
          <p className="text-muted-foreground">
            Share your items with the community and earn money
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Image Upload (60%) */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
                      isDragging
                        ? "border-primary bg-primary/10 border-solid"
                        : "border-gray-300 dark:border-gray-700",
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload
                      className={cn(
                        "h-12 w-12 mx-auto mb-4 transition-colors",
                        isDragging ? "text-primary" : "text-gray-400",
                      )}
                    />
                    <p className="text-lg mb-2">
                      {isDragging
                        ? "Drop images here"
                        : "Upload product images"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop or click to select files
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        asChild
                      >
                        <div>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Images
                        </div>
                      </Button>
                    </label>
                  </div>

                  {/* Uploaded Images Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Product Information (40%) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium mb-2"
                  >
                    <span className="inline-flex items-center gap-1">
                      Title
                      <span className={getAsteriskColor(title.trim() !== "")}>
                        *
                      </span>
                    </span>
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your product a catchy title"
                    className="w-full"
                  />
                </div>

                {/* Location */}
                <div>
                  <span className="block text-sm font-medium mb-2">
                    <span className="inline-flex items-center gap-1">
                      Location
                      <span
                        className={getAsteriskColor(
                          listingLocation.city !== null ||
                            (typeof listingLocation.latitude === "number" &&
                              Number.isFinite(listingLocation.latitude)),
                        )}
                      >
                        *
                      </span>
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    onClick={() => setIsLocationModalOpen(true)}
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {listingLocationButtonLabel}
                    </span>
                  </Button>
                </div>

                {/* Rental Period */}
                <div>
                  <span className="block text-sm font-medium mb-2">
                    Rental period
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Rental period"
                    className="flex flex-wrap gap-2"
                  >
                    {rentalPeriods.map((period) => (
                      <Button
                        key={period}
                        type="button"
                        role="radio"
                        aria-checked={rentalPeriod === period}
                        variant={
                          rentalPeriod === period ? "default" : "outline"
                        }
                        className="flex-1 min-w-[120px]"
                        onClick={() => setRentalPeriod(period)}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium mb-2 flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-1">
                      {priceLabel}
                      <span
                        className={getAsteriskColor(
                          price.trim() !== "" && parseFloat(price) > 0,
                        )}
                      >
                        *
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label="Pricing guidance"
                      className="ml-2 text-muted-foreground hover:text-primary"
                      onClick={() => setIsPriceInfoOpen(true)}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || parseFloat(value) >= 0) {
                          setPrice(value);
                        }
                      }}
                      placeholder={pricePlaceholder}
                      aria-label={priceLabel}
                      className="w-full pl-8"
                    />
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setOfferDelivery(!offerDelivery);
                        if (offerDelivery) {
                          setOfferFreeDelivery(false);
                        }
                      }}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        offerDelivery
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-background hover:border-primary/50",
                      )}
                    >
                      {offerDelivery && (
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <label
                      htmlFor="offer-delivery"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Offer delivery
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setShowDeliveryTooltip(true)}
                        onMouseLeave={() => setShowDeliveryTooltip(false)}
                        className="p-0 h-4 w-4 text-muted-foreground hover:text-primary focus:outline-none"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      {showDeliveryTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded px-3 py-2 whitespace-nowrap z-50 pointer-events-none">
                          <p>
                            Negotiate delivery fee through messages. You keep
                            100% of the delivery fee.
                          </p>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                        </div>
                      )}
                    </div>
                    {offerDelivery && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setOfferFreeDelivery(!offerFreeDelivery)
                          }
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            offerFreeDelivery
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input bg-background hover:border-primary/50",
                          )}
                        >
                          {offerFreeDelivery && (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                        <label className="text-sm font-medium cursor-pointer whitespace-nowrap">
                          Offer free delivery
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {recommendedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          selectedTags.includes(tag) ? "default" : "outline"
                        }
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-primary/10",
                        )}
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium mb-2"
                  >
                    <span className="inline-flex items-center gap-1">
                      Description
                      <span
                        className={getAsteriskColor(description.trim() !== "")}
                      >
                        *
                      </span>
                    </span>
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your product, its condition, any special features..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                {/* Preview Button */}
                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Listing
                </Button>

                {/* Submit Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleListProduct}
                  disabled={!isFormValid()}
                >
                  List Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DraftDialog />
      <ConfirmationModal />
      <SuccessModal />
      <PreviewModal />
      <LocationPickerModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        initialLocation={listingLocation}
        onConfirm={(selection) => {
          setListingLocation({
            city: selection.city,
            latitude: selection.latitude,
            longitude: selection.longitude,
            postalCode: selection.postalCode,
          });
        }}
        onClear={() => {
          setListingLocation(initialListingLocationRef.current);
        }}
      />

      <Dialog open={isPriceInfoOpen} onOpenChange={setIsPriceInfoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pricing guidance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Stumped on a pricing rate for your item? These are our recommended
            rates. If you chose Hourly, Weekly, or Monthly, divide the price by
            24, multiply by 7, or multiply by 30.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th>Type</th>
                  <th>Examples</th>
                  <th>Suggested rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="font-semibold py-2 pr-3">Low-wear items</td>
                  <td className="py-2 pr-3">
                    Cameras, projectors, GoPros, microphones, clothing
                  </td>
                  <td className="py-2">1%-3% MSRP per day</td>
                </tr>
                <tr>
                  <td className="font-semibold py-2 pr-3">Medium-wear items</td>
                  <td className="py-2 pr-3">
                    Power drills, lawn mowers, camping tents, kayaks,
                    paddleboards
                  </td>
                  <td className="py-2">3%-5% MSRP per day</td>
                </tr>
                <tr>
                  <td className="font-semibold py-2 pr-3">High-wear items</td>
                  <td className="py-2 pr-3">
                    Chainsaws, bouncy houses, trampolines, generators
                  </td>
                  <td className="py-2">5%-8% MSRP per day</td>
                </tr>
                <tr>
                  <td className="font-semibold py-2 pr-3">
                    Expensive or brand-name items
                  </td>
                  <td className="py-2 pr-3">
                    Advanced telescopes, drones, sound systems, e-bikes,
                    lighting rigs
                  </td>
                  <td className="py-2">5%-10% MSRP per day</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
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
    </div>
  );
}
