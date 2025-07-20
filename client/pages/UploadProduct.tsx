import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SignUpModal } from "@/components/ui/signup-modal";
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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function UploadProduct() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
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
  const navigationRef = useRef<{ href: string; callback?: () => void } | null>(
    null,
  );

  // Mock user profile data - in real app this would come from context/API
  const userProfile = {
    defaultLocation: "94102", // San Francisco zip code
    hasLocation: true,
  };

  // Check if form has content that should be saved
  const hasContent = () => {
    return (
      title.trim() !== "" ||
      price.trim() !== "" ||
      location.trim() !== "" ||
      description.trim() !== "" ||
      selectedTags.length > 0 ||
      uploadedImages.length > 0
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
    location,
    description,
    selectedTags,
    uploadedImages,
  ]);

  const recommendedTags = [
    "Landscaping",
    "Clothing",
    "Tools",
    "Tech",
    "Party",
    "Instruments",
    "Sports",
    "Home",
    "Automotive",
    "Electronics",
    "Books",
    "Furniture",
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
      location,
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

  const handleListProduct = () => {
    // Product listing logic here
    setIsListed(true);
    console.log("Product listed successfully!");
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
            </div>

            {/* Image Carousel */}
            {uploadedImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
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
            )}
          </div>

          {/* Right Column - Product Info & Host (40%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold flex-1">
                  {title || "Your Product Title"}
                </h1>
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

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-muted-foreground mb-4">
                {description || "Your product description will appear here..."}
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
                <span className="text-sm">
                  {location ||
                    (userProfile.hasLocation
                      ? userProfile.defaultLocation
                      : "Your location")}
                </span>
              </div>

              <div className="text-right mb-6">
                <div className="text-3xl font-bold text-primary">
                  ${price || "0"}
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
                    <AvatarImage src={mockHost.image} alt={mockHost.name} />
                    <AvatarFallback>
                      {mockHost.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
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
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border/40 dark:border-gray-700/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-semibold">
                <a href="/" className="hover:text-primary transition-colors">
                  Trio
                </a>
              </div>
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => handleNavigation("/browse")}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Browse listings
                </button>
                <a
                  href="/upload"
                  className="text-primary font-medium hover:text-primary transition-colors"
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
              <Avatar
                className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => (window.location.href = "/profile")}
              >
                <AvatarImage
                  src="https://images.unsplash.com/photo-1494790108755-2616b612-1.jpg?w=200&h=200&fit=crop&auto=format"
                  alt="Profile"
                />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                    <label htmlFor="image-upload">
                      <Button variant="outline" className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Images
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
                    Title
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
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium mb-2"
                  >
                    Location
                  </label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      userProfile.hasLocation ? userProfile.defaultLocation : ""
                    }
                    className="w-full"
                  />
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium mb-2"
                  >
                    Price per day
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="35"
                      className="w-full pl-8"
                    />
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
                    Description
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
                >
                  List Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DraftDialog />
      <PreviewModal />
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