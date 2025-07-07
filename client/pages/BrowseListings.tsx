import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Star,
  Heart,
  Filter,
  SlidersHorizontal,
  Search,
  Menu,
  Car,
} from "lucide-react";

export default function BrowseListings() {
  const [searchQuery, setSearchQuery] = useState("");

  const listings = [
    {
      id: 1,
      name: "Professional Lawn Mower",
      price: "$45",
      rating: 4.9,
      reviews: 142,
      image:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
      host: "Sarah M.",
      type: "Landscaping",
      location: "San Francisco, CA",
      distance: "2.3 miles",
      lat: 37.7749,
      lng: -122.4194,
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
      type: "Tools",
      location: "Berkeley, CA",
      distance: "8.7 miles",
      lat: 37.8715,
      lng: -122.273,
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
      type: "Instruments",
      location: "Fremont, CA",
      distance: "18.9 miles",
      lat: 37.5485,
      lng: -121.9886,
    },
  ];

  const [selectedListing, setSelectedListing] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Same as homepage */}
      <header className="relative z-50 bg-white/95 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-semibold">
                <a href="/">Trio</a>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a
                  href="/browse"
                  className="text-primary font-medium hover:text-primary transition-colors"
                >
                  Browse listings
                </a>
                <a
                  href="#"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Rent your product
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="hidden md:inline-flex">
                Log in
              </Button>
              <Button>Sign up</Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <section className="bg-accent/30 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content - 70/30 Split */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Side - Listings Grid (70%) */}
          <div className="flex-1" style={{ width: "70%" }}>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {listings.length} listings near you
              </h1>
              <p className="text-muted-foreground">
                Discover amazing items available for rent in your area
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <Card
                  key={listing.id}
                  className={cn(
                    "group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden",
                    selectedListing === listing.id && "ring-2 ring-primary",
                  )}
                  onClick={() => {
                    setSelectedListing(listing.id);
                    window.location.href = `/product/${listing.id}`;
                  }}
                >
                  <div className="relative">
                    <img
                      src={listing.image}
                      alt={listing.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Badge className="absolute bottom-3 left-3 bg-black/60 text-white">
                      {listing.type}
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {listing.name}
                      </h3>
                      <div className="text-right">
                        <div className="text-xl font-bold">{listing.price}</div>
                        <div className="text-sm text-muted-foreground">
                          /day
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {listing.rating}
                      </div>
                      <div>({listing.reviews} reviews)</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Hosted by {listing.host}
                      </span>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {listing.distance}
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-muted-foreground">
                      {listing.location}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg">
                Load more listings
              </Button>
            </div>
          </div>

          {/* Right Side - Interactive Map (30%) */}
          <div className="hidden lg:block" style={{ width: "30%" }}>
            <div className="sticky top-8">
              <Card className="h-[600px] overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  {/* Map Placeholder */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
                    {/* Map Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100"></div>

                    {/* Map Markers */}
                    <div className="absolute inset-0">
                      {listings.map((listing, index) => (
                        <div
                          key={listing.id}
                          className={cn(
                            "absolute w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-all duration-200",
                            selectedListing === listing.id
                              ? "bg-primary scale-125 z-10"
                              : "bg-blue-500 hover:scale-110",
                          )}
                          style={{
                            left: `${20 + index * 15}%`,
                            top: `${25 + index * 12}%`,
                          }}
                          onClick={() => setSelectedListing(listing.id)}
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>

                    {/* Map Controls */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0"
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0"
                      >
                        −
                      </Button>
                    </div>

                    {/* Map Label */}
                    <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 rounded-lg">
                      <p className="text-sm font-medium">Interactive Map</p>
                      <p className="text-xs text-muted-foreground">
                        Click markers to view details
                      </p>
                    </div>

                    {/* Selected Listing Info */}
                    {selectedListing && (
                      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-48">
                        {(() => {
                          const selected = listings.find(
                            (l) => l.id === selectedListing,
                          );
                          if (!selected) return null;
                          return (
                            <div>
                              <h4 className="font-medium text-sm mb-1">
                                {selected.name}
                              </h4>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {selected.distance}
                                </span>
                                <span className="font-bold text-primary">
                                  {selected.price}/day
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
