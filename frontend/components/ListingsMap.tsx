import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ListingsMap.css";

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

const DEFAULT_CENTER: LatLngExpression = [38.9072, -77.0369];

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

interface ListingsMapProps {
  listings: Array<{
    id: number;
    name: string;
    price: string;
    latitude: number | null;
    longitude: number | null;
  }>;
  selectedListing?: number | null;
  userCoordinates?: { latitude: number; longitude: number } | null;
  filterLocation?: { latitude: number; longitude: number; city: string | null } | null;
  onSelectListing?: (listingId: number) => void;
}

function InteractiveMap({
  listings,
  selectedListing,
  userCoordinates,
  filterLocation,
  onSelectListing,
}: {
  listings: Array<{
    id: number;
    name: string;
    price: string;
    latitude: number | null;
    longitude: number | null;
  }>;
  selectedListing?: number | null;
  userCoordinates?: { latitude: number; longitude: number } | null;
  filterLocation?: { latitude: number; longitude: number; city: string | null } | null;
  onSelectListing?: (listingId: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    console.log("[InteractiveMap] Mounted, listings:", listings.length);
  }, [listings]);

  const listingsWithCoords = useMemo(() => {
    return listings.filter(
      (l) => typeof l.latitude === "number" && typeof l.longitude === "number",
    );
  }, [listings]);

  // Calculate initial map center (prioritize filter location, then user location)
  const initialMapCenter = useMemo((): LatLngExpression => {
    // Prioritize filter location if available (takes priority over user coordinates)
    if (filterLocation) {
      console.log(
        "[InteractiveMap] Using filter location for map center:",
        filterLocation,
      );
      return [filterLocation.latitude, filterLocation.longitude];
    }
    // Then prioritize user's location if available
    if (userCoordinates) {
      console.log(
        "[InteractiveMap] Using user coordinates for map center:",
        userCoordinates,
      );
      return [userCoordinates.latitude, userCoordinates.longitude];
    }
    // Otherwise center on bounds of listings with coordinates
    if (listingsWithCoords.length > 0) {
      const lats = listingsWithCoords.map((l) => l.latitude as number);
      const lngs = listingsWithCoords.map((l) => l.longitude as number);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      console.log(
        "[InteractiveMap] Using listings bounds for map center:",
        centerLat,
        centerLng,
      );
      return [centerLat, centerLng];
    }
    console.log("[InteractiveMap] Using default center");
    return DEFAULT_CENTER;
  }, [filterLocation, userCoordinates, listingsWithCoords]);

  // Use a stable map center that doesn't change after initialization
  const mapCenter = initialMapCenter;

  useEffect(() => {
    console.log(
      "[InteractiveMap] useEffect for map init, container:",
      containerRef.current,
      "mapRef:",
      mapRef.current,
    );

    if (!containerRef.current || mapRef.current) {
      console.log(
        "[InteractiveMap] Skipping map init: no container or map already exists",
      );
      return;
    }

    try {
      console.log("[InteractiveMap] Creating map with center:", mapCenter);
      const map = L.map(containerRef.current, {
        center: mapCenter,
        zoom: 12,
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

      mapRef.current = map;
      console.log("[InteractiveMap] Map created successfully");

      return () => {
        console.log("[InteractiveMap] Cleaning up map");
        map.remove();
        mapRef.current = null;
        markersRef.current.clear();
      };
    } catch (e) {
      console.error("[InteractiveMap] Error creating map:", e);
    }
  }, []);

  // Center the map when the map is initialized or when userCoordinates arrive
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const target = L.latLng(mapCenter);

    console.log("[InteractiveMap] Setting map center to:", mapCenter);
    map.setView(target, map.getZoom(), { animate: false });
  }, [mapCenter]);

  useEffect(() => {
    console.log(
      "[InteractiveMap] Marker effect - map exists:",
      !!mapRef.current,
      "listings with coords:",
      listingsWithCoords.length,
    );

    if (!mapRef.current) {
      console.log("[InteractiveMap] Skipping marker render - no map");
      return;
    }

    const map = mapRef.current;
    const currentMarkerIds = new Set(markersRef.current.keys());
    const newListingIds = new Set(listingsWithCoords.map((l) => l.id));

    for (const id of currentMarkerIds) {
      if (!newListingIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      }
    }

    listingsWithCoords.forEach((listing, index) => {
      const existingMarker = markersRef.current.get(listing.id);
      const isSelected = selectedListing === listing.id;

      if (!existingMarker) {
        console.log(
          "[InteractiveMap] Creating marker for listing",
          listing.id,
          "at",
          listing.latitude,
          listing.longitude,
        );
        const markerHtml = `<div>${index + 1}</div>`;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: `listing-marker${isSelected ? " selected" : ""}`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const popup = L.popup({
          className: "listing-popup",
          closeButton: false,
          offset: [0, -10],
        }).setContent(
          `<div style="font-weight: 600; margin-bottom: 4px;">${listing.name}</div><div>${listing.price}/day</div>`,
        );

        const marker = L.marker(
          [listing.latitude as number, listing.longitude as number],
          { icon: markerIcon },
        )
          .bindPopup(popup)
          .addTo(map);

        marker.on("click", () => {
          console.log(
            "[InteractiveMap] Marker clicked for listing",
            listing.id,
          );
          // Center map on the clicked marker
          map.setView(
            [listing.latitude as number, listing.longitude as number],
            map.getZoom(),
            { animate: true },
          );
          onSelectListing?.(listing.id);
        });

        markersRef.current.set(listing.id, marker);
      } else {
        // Update marker styling when selection changes
        const markerElement = existingMarker.getElement();
        if (markerElement) {
          if (isSelected) {
            markerElement.classList.add("selected");
            existingMarker.openPopup();
          } else {
            markerElement.classList.remove("selected");
            existingMarker.closePopup();
          }
        }
      }
    });
  }, [listingsWithCoords, selectedListing, onSelectListing]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function ListingsMap({
  listings,
  selectedListing,
  userCoordinates,
  onSelectListing,
}: ListingsMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log("[ListingsMap] Component mounted");
    setIsClient(true);
  }, []);

  console.log(
    "[ListingsMap] Rendering, isClient:",
    isClient,
    "listings:",
    listings.length,
    "userCoords:",
    userCoordinates,
  );

  return (
    <div className="w-full h-full">
      {isClient ? (
        <InteractiveMap
          listings={listings}
          selectedListing={selectedListing}
          userCoordinates={userCoordinates}
          onSelectListing={onSelectListing}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          Loading map...
        </div>
      )}
    </div>
  );
}
