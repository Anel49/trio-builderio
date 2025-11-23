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
import { Footer } from "@/components/Footer";
import {
  LocationPickerModal,
  type LocationSelection,
} from "@/components/LocationPickerModal";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUserLocation, type UserLocation } from "@/lib/user-profile";
import { LoginModal } from "@/components/ui/login-modal";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/use-page-title";
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
  ChevronDown,
  ChevronUp,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user: authUser } = useAuth();
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
  const [enableInstantBooking, setEnableInstantBooking] = useState(false);
  const [showInstantBookingModal, setShowInstantBookingModal] = useState(false);
  const [addons, setAddons] = useState<
    Array<{ id: string; item: string; style: string; price: string; consumable?: boolean }>
  >([]);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState(false);
  const navigationRef = useRef<{ href: string; callback?: () => void } | null>(
    null,
  );
  // Price label is now always "Daily" since rental period is fixed to Daily
  const priceUnit = "day";
  const priceLabel = "Price per day";
  const pricePlaceholder = "35";
  const [editListingId, setEditListingId] = useState<number | null>(null);
  const [listingNotFound, setListingNotFound] = useState(false);
  const [isCheckingListing, setIsCheckingListing] = useState(false);

  usePageTitle();

  // Load listing data when editing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listingIdParam = params.get("edit");
    if (listingIdParam) {
      const listingId = Number.parseInt(listingIdParam, 10);
      setEditListingId(listingId);
      setIsCheckingListing(true);

      // Fetch the complete listing data from the API
      (async () => {
        try {
          const response = await apiFetch(`listings/${listingId}`);
          const data = await response.json().catch(() => ({}));
          if (data.ok && data.listing) {
            const listing = data.listing;

            // Check authorization: user can only edit their own listings
            if (!authUser || authUser.id !== listing.hostUserId) {
              setListingNotFound(true);
              setIsCheckingListing(false);
              return;
            }

            // Set all form fields from the listing data
            setTitle(listing.name || "");

            // Parse price: remove $ and convert from price format (e.g., "$60" -> "60")
            if (listing.price) {
              const priceStr = listing.price.replace(/[^0-9.]/g, "");
              setPrice(priceStr || "");
            }

            setDescription(listing.description || "");

            // Set rental period
            if (
              listing.rentalPeriod &&
              rentalPeriods.includes(listing.rentalPeriod as RentalPeriod)
            ) {
              setRentalPeriod(listing.rentalPeriod as RentalPeriod);
            }

            // Set location
            if (
              listing.location_city ||
              listing.latitude != null ||
              listing.longitude != null
            ) {
              setListingLocation({
                city: listing.location_city || null,
                latitude:
                  typeof listing.latitude === "number"
                    ? listing.latitude
                    : null,
                longitude:
                  typeof listing.longitude === "number"
                    ? listing.longitude
                    : null,
                postalCode: listing.zipCode || null,
              });
            }

            // Set categories
            if (
              Array.isArray(listing.categories) &&
              listing.categories.length > 0
            ) {
              setSelectedTags(listing.categories);
            }

            // Set delivery options
            if (typeof listing.delivery === "boolean") {
              setOfferDelivery(listing.delivery);
            }
            if (typeof listing.freeDelivery === "boolean") {
              setOfferFreeDelivery(listing.freeDelivery);
            }

            // Set instant booking
            if (typeof listing.instantBooking === "boolean") {
              setEnableInstantBooking(listing.instantBooking);
            }

            // Set images
            if (Array.isArray(listing.images) && listing.images.length > 0) {
              setUploadedImages(listing.images);
            } else if (listing.image && typeof listing.image === "string") {
              setUploadedImages([listing.image]);
            }

            // Set addons if they exist
            if (Array.isArray(listing.addons) && listing.addons.length > 0) {
              setAddons(
                listing.addons.map((addon: any, index: number) => ({
                  id: addon.id || `addon-${Date.now()}-${index}`,
                  item: addon.item || "",
                  style: addon.style || "",
                  price: addon.price ? String(addon.price) : "",
                })),
              );
              setIsAddonsExpanded(true);
            }
            setIsCheckingListing(false);
          } else {
            // Listing not found or invalid response
            setListingNotFound(true);
            setIsCheckingListing(false);
          }
        } catch (error) {
          console.error("Failed to load listing data:", error);
          setListingNotFound(true);
          setIsCheckingListing(false);
        }
      })();

      // Clear session storage if it exists
      sessionStorage.removeItem("editListingData");
    }
  }, [authUser]);

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

  const defaultCategory = "General";

  const recommendedTags = [
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

  const toggleAddonConsumable = (id: string) => {
    setAddons(
      addons.map((addon) =>
        addon.id === id ? { ...addon, consumable: !addon.consumable } : addon,
      ),
    );
  };

  const addAddonEntry = () => {
    const newAddon = {
      id: `addon-${Date.now()}`,
      item: "",
      style: "",
      price: "",
      consumable: false,
    };
    setAddons([...addons, newAddon]);
  };

  const updateAddonField = (
    id: string,
    field: "item" | "style" | "price",
    value: string,
  ) => {
    setAddons(
      addons.map((addon) =>
        addon.id === id ? { ...addon, [field]: value } : addon,
      ),
    );
  };

  const removeAddon = (id: string) => {
    setAddons(addons.filter((addon) => addon.id !== id));
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
    const hasImage = uploadedImages.length > 0;
    return hasTitle && hasLocation && hasPrice && hasDescription && hasImage;
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
      const userId = authUser?.id;
      if (!userId) {
        console.error("User not authenticated");
        return;
      }

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
          typeof authUser?.zipCode === "string" ? authUser.zipCode.trim() : "";
        return /^\d{5}$/.test(candidate) ? candidate : "00000";
      })();

      const payload = {
        name: title || "Untitled",
        price_cents: priceCents,
        rating: null,
        image: imgs[0],
        images: imgs,
        host: authUser?.name || "User",
        host_id: userId,
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
        instant_bookings: enableInstantBooking,
        addons: addons
          .filter((addon) => addon.item.trim() !== "")
          .map((addon) => {
            const addonData: any = {
              item: addon.item,
              style: addon.style,
              price: addon.price ? parseFloat(addon.price) : null,
            };
            // Only include ID for existing addons (not newly created ones)
            const addonIdStr = String(addon.id);
            if (!addonIdStr.startsWith("addon-")) {
              addonData.id = Number(addon.id);
            }
            return addonData;
          }),
      };
      console.log("[UploadProduct] Sending payload:", payload);

      const endpoint = editListingId ? `listings/${editListingId}` : "listings";
      const method = editListingId ? "PUT" : "POST";

      console.log(
        "[UploadProduct] Calling API endpoint:",
        endpoint,
        "method:",
        method,
      );
      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(
        "[UploadProduct] Response status:",
        res.status,
        "ok:",
        res.ok,
      );

      let data: any = {};
      try {
        const responseText = await res.text();
        console.log("[UploadProduct] Response text:", responseText);
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("[UploadProduct] Failed to parse response:", e);
        data = {};
      }

      console.log("[UploadProduct] Response data:", data);
      const resultId = editListingId || Number(data?.id);
      if (!res.ok || !data?.ok || !Number.isFinite(resultId)) {
        const errorMsg = editListingId
          ? "Failed to update listing"
          : "Failed to create listing";
        console.error("[UploadProduct] Error:", errorMsg, "Response:", data);
        throw new Error(data?.error || errorMsg);
      }
      setCreatedListingId(resultId);
      setIsListed(true);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      // Skip immediate refresh to avoid redundant network calls; pages load fresh on navigation
    } catch (e) {
      setShowConfirmModal(false);
      alert(
        editListingId
          ? "Failed to update product. Please try again."
          : "Failed to list product. Please try again.",
      );
    }
  };

  const handleCancelListing = () => {
    setShowConfirmModal(false);
  };

  const handleViewListing = () => {
    if (!createdListingId) return;
    setShowSuccessModal(false);
    window.location.href = `/listing/${createdListingId}`;
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

  const DeliveryModal = () => (
    <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delivery Fee</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-muted-foreground">
            Negotiate delivery fees through messages. You keep 100% of the
            delivery fee.
          </p>
        </div>
        <Button onClick={() => setShowDeliveryModal(false)} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );

  const InstantBookingModal = () => (
    <Dialog
      open={showInstantBookingModal}
      onOpenChange={setShowInstantBookingModal}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Instant Booking</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-muted-foreground">
            Enabling Instant Booking configures your listing to automatically
            approve incoming booking requests that do not conflict with any
            existing Pending or Accepted requests, eliminating the need for
            manual approval.
          </p>
        </div>
        <Button
          onClick={() => setShowInstantBookingModal(false)}
          className="w-full"
        >
          Got it
        </Button>
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
                {uploadedImages[0] ? (
                  <img
                    src={uploadedImages[0]}
                    alt={title || "Product preview"}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                    <svg
                      className="h-24 w-24 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
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
                    <div className="hidden">
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

  const params = new URLSearchParams(window.location.search);
  const urlEditId = params.get("edit");

  if (urlEditId && (isCheckingListing || !editListingId)) {
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

  if (listingNotFound && editListingId) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">
              Listing not found
            </h1>
            <p className="text-muted-foreground">
              The listing you're trying to edit doesn't exist or you don't have
              permission to edit it.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="mt-4"
            >
              Return to Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {editListingId ? "Edit your product" : "List your product"}
          </h1>
          <p className="text-muted-foreground">
            {editListingId
              ? "Update your listing information"
              : "Share your items with the community and earn money"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Image Upload (60%) */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1">
                  Product Images
                  <span
                    className={
                      uploadedImages.length === 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }
                  >
                    *
                  </span>
                </CardTitle>
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
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-60 group-hover:opacity-100 transition-opacity"
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

                {/* Rental Period - Disabled */}
                {/* Rental period selector temporarily disabled */}

                {/* Price */}
                <div>
                  <div className="block text-sm font-medium mb-2 flex items-center gap-1">
                    <label
                      htmlFor="price"
                      className="text-sm font-medium cursor-pointer inline-flex items-center gap-1"
                    >
                      {priceLabel}
                      <span
                        className={getAsteriskColor(
                          price.trim() !== "" && parseFloat(price) > 0,
                        )}
                      >
                        *
                      </span>
                    </label>
                    <button
                      type="button"
                      aria-label="Pricing guidance"
                      className="p-0 h-4 w-4 text-muted-foreground hover:text-primary focus:outline-none"
                      onClick={() => setIsPriceInfoOpen(true)}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
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
                      onWheel={(e) => e.currentTarget.blur()}
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
                      onClick={() =>
                        setEnableInstantBooking(!enableInstantBooking)
                      }
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        enableInstantBooking
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-background hover:border-primary/50",
                      )}
                    >
                      {enableInstantBooking && (
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
                    <label className="text-sm font-medium cursor-pointer">
                      Enable Instant Booking
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInstantBookingModal(true)}
                      className="p-0 h-4 w-4 text-muted-foreground hover:text-primary focus:outline-none"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setOfferDelivery(!offerDelivery);
                        if (offerDelivery) {
                          setOfferFreeDelivery(false);
                        }
                      }}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
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
                    <button
                      type="button"
                      onClick={() => setShowDeliveryModal(true)}
                      className="p-0 h-4 w-4 text-muted-foreground hover:text-primary focus:outline-none"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    {offerDelivery && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setOfferFreeDelivery(!offerFreeDelivery)
                          }
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
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
                        <label className="text-sm font-medium cursor-pointer">
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

                {/* Optional Addons Section */}
                <div className="border border-border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsAddonsExpanded(!isAddonsExpanded)}
                    className={`w-full flex items-center justify-between p-4 bg-background hover:bg-accent/50 transition-colors ${
                      isAddonsExpanded ? "rounded-t-md" : "rounded-md"
                    }`}
                  >
                    <span className="text-sm font-medium">Optional Addons</span>
                    {isAddonsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {isAddonsExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      <Button
                        type="button"
                        onClick={addAddonEntry}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Addon
                      </Button>
                      {addons.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Delete or mark addons consumable using (⋮)
                        </p>
                      )}

                      <div className="space-y-3">
                        {addons.map((addon, index) => (
                          <div key={addon.id}>
                            {/* Desktop Layout - All fields in one row */}
                            <div className="hidden md:flex gap-3 items-end">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Item
                                </label>
                                <Input
                                  type="text"
                                  placeholder='"Tablecloth"'
                                  value={addon.item}
                                  onChange={(e) =>
                                    updateAddonField(
                                      addon.id,
                                      "item",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full"
                                />
                              </div>

                              <div className="flex-1">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Style
                                </label>
                                <Input
                                  type="text"
                                  placeholder='"Red"'
                                  value={addon.style}
                                  onChange={(e) =>
                                    updateAddonField(
                                      addon.id,
                                      "style",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full"
                                />
                              </div>

                              <div className="w-24">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Price
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    value={addon.price}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (
                                        value === "" ||
                                        parseFloat(value) >= 0
                                      ) {
                                        updateAddonField(
                                          addon.id,
                                          "price",
                                          value,
                                        );
                                      }
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-full pl-8"
                                  />
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-2 hover:bg-muted rounded transition-colors mb-1"
                                    title="Addon options"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleAddonConsumable(addon.id)
                                    }
                                  >
                                    {addon.consumable
                                      ? "Mark reusable"
                                      : "Mark consumable"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => removeAddon(addon.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Mobile Layout - 3 rows for all mobile views */}
                            <div className="md:hidden border border-border rounded-lg p-3 bg-muted/30">
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Item
                                  </label>
                                  <Input
                                    type="text"
                                    placeholder='"Tablecloth"'
                                    value={addon.item}
                                    onChange={(e) =>
                                      updateAddonField(
                                        addon.id,
                                        "item",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Style
                                  </label>
                                  <Input
                                    type="text"
                                    placeholder='"Red"'
                                    value={addon.style}
                                    onChange={(e) =>
                                      updateAddonField(
                                        addon.id,
                                        "style",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>

                                <div className="flex gap-3 items-end">
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                      Price
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                        $
                                      </span>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        value={addon.price}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (
                                            value === "" ||
                                            parseFloat(value) >= 0
                                          ) {
                                            updateAddonField(
                                              addon.id,
                                              "price",
                                              value,
                                            );
                                          }
                                        }}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        className="w-full pl-8"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeAddon(addon.id)}
                                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                                    title="Remove addon"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {addons.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No addons yet. Click "Create Addon" to add one.
                        </p>
                      )}
                    </div>
                  )}
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
      <DeliveryModal />
      <InstantBookingModal />
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
            rates.
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
