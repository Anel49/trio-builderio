import { setTimeout as delay } from "node:timers/promises";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const ZIP_CODE_REGEX = /^\d{5}$/;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const RETRY_DELAYS_MS = [0, 250, 750];

const coordinateCache = new Map<string, { expiresAt: number; coords: Coordinates }>();

function isValidZipCode(zip: string | null | undefined): zip is string {
  return typeof zip === "string" && ZIP_CODE_REGEX.test(zip.trim());
}

export function normalizeZipCode(zip: string | null | undefined): string | null {
  if (!isValidZipCode(zip)) return null;
  return zip.trim();
}

function cacheKey(zip: string) {
  return zip.trim();
}

function readCache(zip: string): Coordinates | null {
  const key = cacheKey(zip);
  const cached = coordinateCache.get(key);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    coordinateCache.delete(key);
    return null;
  }
  return cached.coords;
}

function writeCache(zip: string, coords: Coordinates) {
  const key = cacheKey(zip);
  coordinateCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, coords });
}

async function fetchCoordinatesFromZippopotam(zip: string): Promise<Coordinates | null> {
  const endpoint = `https://api.zippopotam.us/us/${encodeURIComponent(zip)}`;
  const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as any;
  if (!data || !Array.isArray(data.places) || data.places.length === 0) {
    return null;
  }
  const place = data.places[0];
  const lat = typeof place?.latitude === "string" ? parseFloat(place.latitude) : NaN;
  const lon = typeof place?.longitude === "string" ? parseFloat(place.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return { latitude: lat, longitude: lon };
}

export async function getZipCoordinates(zip: string): Promise<Coordinates | null> {
  if (!isValidZipCode(zip)) return null;
  const normalizedZip = zip.trim();
  const cached = readCache(normalizedZip);
  if (cached) return cached;

  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    try {
      const coords = await fetchCoordinatesFromZippopotam(normalizedZip);
      if (coords) {
        writeCache(normalizedZip, coords);
        return coords;
      }
    } catch {
      // Ignore and retry
    }
    const delayMs = RETRY_DELAYS_MS[i];
    if (delayMs > 0) {
      await delay(delayMs);
    }
  }

  return null;
}

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function calculateDistanceMiles(
  from: Coordinates,
  to: Coordinates,
): number {
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);
  const lat2 = toRadians(to.latitude);
  const lon2 = toRadians(to.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;
  return Math.round(distance * 10) / 10;
}
