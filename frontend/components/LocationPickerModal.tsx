import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Loader2, MapPin } from "lucide-react";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
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

const DEFAULT_CENTER: LatLngExpression = [38.9072, -77.0369]; // Washington, D.C. as neutral US center

// Configure default marker assets once
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

export interface LocationSelection {
  latitude: number;
  longitude: number;
  city: string | null;
  postalCode: string | null;
}

interface LocationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation: {
    latitude: number | null;
    longitude: number | null;
    city: string | null;
  };
  onConfirm: (selection: LocationSelection) => void;
}

type LatLngTuple = [number, number];

function InteractiveMap({
  center,
  zoom,
  selectedPosition,
  onSelect,
  active,
}: {
  center: LatLngExpression;
  zoom: number;
  selectedPosition: LatLngTuple | null;
  onSelect: (lat: number, lng: number) => void;
  active: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const selectHandlerRef = useRef(onSelect);
  const isActiveRef = useRef(active);
  const hasUserZoomedRef = useRef(false);

  useEffect(() => {
    selectHandlerRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    isActiveRef.current = active;
    if (!active) {
      hasUserZoomedRef.current = false;
    }
  }, [active]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
      inertia: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap contributors © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    const handleClick = (event: LeafletMouseEvent) => {
      if (!isActiveRef.current) {
        return;
      }
      selectHandlerRef.current(event.latlng.lat, event.latlng.lng);
    };

    const handleZoomStart = () => {
      hasUserZoomedRef.current = true;
    };

    map.on("click", handleClick);
    map.on("zoomstart", handleZoomStart);
    mapRef.current = map;

    return () => {
      map.off("click", handleClick);
      map.off("zoomstart", handleZoomStart);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !active) {
      return;
    }
    const map = mapRef.current;
    const target = L.latLng(center);
    const currentCenter = map.getCenter();
    const centerChanged = currentCenter.distanceTo(target) > 0.5;

    if (centerChanged) {
      const id = requestAnimationFrame(() => {
        map.setView(target, map.getZoom(), { animate: false });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [active, center]);

  useEffect(() => {
    if (!mapRef.current || !active) {
      return;
    }
    if (hasUserZoomedRef.current) {
      return;
    }
    const map = mapRef.current;
    const currentZoom = map.getZoom();
    if (Math.abs(currentZoom - zoom) > 0.1) {
      const id = requestAnimationFrame(() => {
        map.setZoom(zoom, { animate: false });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [active, zoom]);

  useEffect(() => {
    if (!mapRef.current || !active) {
      return;
    }
    const id = requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });
    return () => cancelAnimationFrame(id);
  }, [active]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (selectedPosition) {
      if (!markerRef.current) {
        markerRef.current = L.marker(selectedPosition).addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng(selectedPosition);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [selectedPosition]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function LocationPickerModal({
  open,
  onOpenChange,
  initialLocation,
  onConfirm,
}: LocationPickerModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedLat(initialLocation.latitude ?? null);
      setSelectedLng(initialLocation.longitude ?? null);
      setError(null);
    }
  }, [open, initialLocation.latitude, initialLocation.longitude]);

  const handleSelect = useCallback((lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setError(null);
  }, []);

  const mapCenter = useMemo((): LatLngExpression => {
    if (
      typeof selectedLat === "number" &&
      Number.isFinite(selectedLat) &&
      typeof selectedLng === "number" &&
      Number.isFinite(selectedLng)
    ) {
      return [selectedLat, selectedLng];
    }
    if (
      typeof initialLocation.latitude === "number" &&
      Number.isFinite(initialLocation.latitude) &&
      typeof initialLocation.longitude === "number" &&
      Number.isFinite(initialLocation.longitude)
    ) {
      return [initialLocation.latitude, initialLocation.longitude];
    }
    return DEFAULT_CENTER;
  }, [
    selectedLat,
    selectedLng,
    initialLocation.latitude,
    initialLocation.longitude,
  ]);

  const zoomLevel = useMemo(() => {
    if (
      typeof selectedLat === "number" &&
      Number.isFinite(selectedLat) &&
      typeof selectedLng === "number" &&
      Number.isFinite(selectedLng)
    ) {
      return 12;
    }
    if (
      typeof initialLocation.latitude === "number" &&
      Number.isFinite(initialLocation.latitude) &&
      typeof initialLocation.longitude === "number" &&
      Number.isFinite(initialLocation.longitude)
    ) {
      return 10;
    }
    return 5;
  }, [
    selectedLat,
    selectedLng,
    initialLocation.latitude,
    initialLocation.longitude,
  ]);

  const handleConfirm = useCallback(async () => {
    if (
      typeof selectedLat !== "number" ||
      !Number.isFinite(selectedLat) ||
      typeof selectedLng !== "number" ||
      !Number.isFinite(selectedLng)
    ) {
      setError("Select a location on the map to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch("geocode/reverse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ latitude: selectedLat, longitude: selectedLng }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(
          (payload && payload.error) ||
            "Unable to resolve city for this location.",
        );
      }

      onConfirm({
        latitude: selectedLat,
        longitude: selectedLng,
        city: payload.city ?? initialLocation.city ?? null,
        postalCode: payload.postalCode ?? null,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(String(err?.message || err || "Unexpected error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLat, selectedLng, initialLocation.city, onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select your city</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tap or click anywhere on the map to drop the pin. When you save,
            we’ll convert the coordinates into the closest city name.
          </p>
          <div className="h-[420px] w-full overflow-hidden rounded-lg border border-border">
            {isClient ? (
              <InteractiveMap
                center={mapCenter}
                zoom={zoomLevel}
                selectedPosition={
                  typeof selectedLat === "number" &&
                  Number.isFinite(selectedLat) &&
                  typeof selectedLng === "number" &&
                  Number.isFinite(selectedLng)
                    ? [selectedLat, selectedLng]
                    : null
                }
                onSelect={handleSelect}
                active={open}
              />
            ) : null}
          </div>
          {typeof selectedLat === "number" &&
          typeof selectedLng === "number" ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-[2px]" />
              <div>
                <div>
                  Latitude: {selectedLat.toFixed(5)}, Longitude:{" "}
                  {selectedLng.toFixed(5)}
                </div>
                <div className="text-xs">
                  We’ll match these coordinates to the nearest city when you
                  save.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No location selected yet.
            </div>
          )}
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
              </>
            ) : (
              "Save location"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
