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

const markerIconRetinaUrl = new URL(
  "leaflet/dist/images/marker-icon-2x.png",
  import.meta.url,
).href;
const markerIconUrl = new URL(
  "leaflet/dist/images/marker-icon.png",
  import.meta.url,
).href;
const markerShadowUrl = new URL(
  "leaflet/dist/images/marker-shadow.png",
  import.meta.url,
).href;

const defaultIcon = L.icon({
  iconRetinaUrl: markerIconRetinaUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

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
      if (!containerRef.current) return;

      try {
        const center: LatLngExpression = [latitude, longitude];

        const map = L.map(containerRef.current, {
          center,
          zoom: 15,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution: "© OpenStreetMap contributors © CARTO",
            subdomains: "abcd",
            maxZoom: 19,
          },
        ).addTo(map);

        const marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(
          map,
        );
        marker.bindPopup(listingName);
        marker.openPopup();

        mapRef.current = map;
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Location</DialogTitle>
          <DialogDescription>{listingName}</DialogDescription>
        </DialogHeader>

        {latitude !== null && longitude !== null ? (
          <>
            <div
              ref={containerRef}
              className="w-full h-96 rounded-lg overflow-hidden border border-border"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
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
      </DialogContent>
    </Dialog>
  );
}
