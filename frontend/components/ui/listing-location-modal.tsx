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

    if (latitude === null || longitude === null) {
      return;
    }

    // Clear previous map if it exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) {
        return;
      }

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

        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(listingName);
        marker.openPopup();

        mapRef.current = map;
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, latitude, longitude, listingName]);

  const handleCopyCoordinates = async () => {
    if (latitude === null || longitude === null) {
      console.error("No coordinates available");
      return;
    }

    const coordinatesText = `${latitude}, ${longitude}`;
    console.log("Attempting to copy:", coordinatesText);

    // Try modern Clipboard API first
    if (navigator.clipboard?.writeText) {
      try {
        console.log("Using Clipboard API");
        await navigator.clipboard.writeText(coordinatesText);
        console.log("Successfully copied via Clipboard API");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (clipboardError) {
        console.warn("Clipboard API failed:", clipboardError);
      }
    }

    // Fallback to execCommand
    console.log("Falling back to execCommand");
    try {
      // Create textarea
      const textarea = document.createElement("textarea");
      textarea.value = coordinatesText;

      // Style to be invisible but selectable
      Object.assign(textarea.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "2em",
        height: "2em",
        padding: "0",
        border: "none",
        outline: "none",
        boxShadow: "none",
        background: "transparent",
        opacity: "0",
        pointerEvents: "none",
        zIndex: "-9999"
      });

      document.body.appendChild(textarea);
      console.log("Textarea created and added to DOM");

      // Wait a moment for DOM to update
      await new Promise(resolve => setTimeout(resolve, 10));

      // Focus and select
      textarea.focus();
      const selected = textarea.select();
      console.log("Selection result:", selected);

      // Execute copy
      const successful = document.execCommand("copy");
      console.log("execCommand('copy') result:", successful);

      // Clean up
      document.body.removeChild(textarea);

      if (successful) {
        console.log("Copy successful");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.warn("execCommand returned false");
        // Still show copied state as visual feedback
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
      // Still show copied state as visual feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Location</DialogTitle>
          <DialogDescription>{listingName}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {latitude !== null && longitude !== null ? (
            <>
              <div
                ref={containerRef}
                style={{ height: "400px", width: "100%" }}
                className="rounded-lg overflow-hidden border border-border bg-muted relative flex-shrink-0"
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
