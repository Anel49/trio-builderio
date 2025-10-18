import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  onSelectListing?: (listingId: number) => void;
}

function InteractiveMap({
  listings,
  selectedListing,
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
  onSelectListing?: (listingId: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  const listingsWithCoords = useMemo(() => {
    const filtered = listings.filter(
      (l) => typeof l.latitude === "number" && typeof l.longitude === "number",
    );
    console.log("[ListingsMap] All listings:", listings);
    console.log("[ListingsMap] Filtered listings with coords:", filtered);
    return filtered;
  }, [listings]);

  const mapCenter = useMemo((): LatLngExpression => {
    if (listingsWithCoords.length > 0) {
      const lats = listingsWithCoords.map((l) => l.latitude as number);
      const lngs = listingsWithCoords.map((l) => l.longitude as number);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      return [centerLat, centerLng];
    }
    return DEFAULT_CENTER;
  }, [listingsWithCoords]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

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

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const target = L.latLng(mapCenter);
    const currentCenter = map.getCenter();

    if (currentCenter.distanceTo(target) > 10) {
      map.setView(target, map.getZoom(), { animate: true });
    }
  }, [mapCenter]);

  useEffect(() => {
    if (!mapRef.current) return;

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
        const markerHtml = `<div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid ${isSelected ? "white" : "#999"};
          background-color: ${isSelected ? "#3b82f6" : "#d3d3d3"};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          color: ${isSelected ? "white" : "black"};
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        ">${index + 1}</div>`;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: "custom-listing-marker",
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
          onSelectListing?.(listing.id);
        });

        markersRef.current.set(listing.id, marker);
      } else if (isSelected) {
        existingMarker.openPopup();
      } else {
        existingMarker.closePopup();
      }
    });
  }, [listingsWithCoords, selectedListing, onSelectListing]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function ListingsMap({
  listings,
  selectedListing,
  onSelectListing,
}: ListingsMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {isClient ? (
        <InteractiveMap
          listings={listings}
          selectedListing={selectedListing}
          onSelectListing={onSelectListing}
        />
      ) : null}
    </>
  );
}
