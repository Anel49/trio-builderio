import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for leaflet default icon not loading
if (!L.Icon.Default.prototype._getIconUrl) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}


interface ListingLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  listingName?: string;
}

export function ListingLocationModal({
  open,
  onOpenChange,
  latitude,
  longitude,
  listingName = "Listing",
}: ListingLocationModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [copied, setCopied] = useState(false);

  console.log("ListingLocationModal rendered with:", { open, latitude, longitude, listingName });

  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    if (latitude === null || longitude === null || !containerRef.current) {
      return;
    }

    // Clear previous map if it exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Wait for DOM to be fully rendered
    const timer = setTimeout(() => {
      if (!containerRef.current) {
        console.error("Container ref not available");
        return;
      }

      try {
        console.log("Initializing map with coordinates:", latitude, longitude);
        const center: LatLngExpression = [latitude, longitude];

        const map = L.map(containerRef.current, {
          center,
          zoom: 15,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
          },
        ).addTo(map);

        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(listingName);
        marker.openPopup();

        mapRef.current = map;
        console.log("Map initialized successfully");
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, latitude, longitude, listingName]);

  const handleCopyCoordinates = async () => {
    if (latitude === null || longitude === null) return;

    const coordinatesText = `${latitude}, ${longitude}`;
    try {
      await navigator.clipboard.writeText(coordinatesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Location</DialogTitle>
          <DialogDescription>{listingName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {latitude !== null && longitude !== null ? (
            <>
              <div
                ref={containerRef}
                style={{ height: "400px", width: "100%", minHeight: "400px" }}
                className="rounded-lg overflow-hidden border border-border bg-muted relative"
              />

              <div className="flex items-center justify-between gap-2 bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground font-mono">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
                <Button
                  onClick={handleCopyCoordinates}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy coordinates
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Location information not available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
