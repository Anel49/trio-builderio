import { setTimeout as delay } from "node:timers/promises";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const ZIP_CODE_REGEX = /^\d{5}$/;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const RETRY_DELAYS_MS = [0, 250, 750];

const coordinateCache = new Map<
  string,
  { expiresAt: number; coords: Coordinates }
>();

function isValidZipCode(zip: string | null | undefined): zip is string {
  return typeof zip === "string" && ZIP_CODE_REGEX.test(zip.trim());
}

export function normalizeZipCode(
  zip: string | null | undefined,
): string | null {
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

async function fetchCoordinatesFromZippopotam(
  zip: string,
): Promise<Coordinates | null> {
  const endpoint = `https://api.zippopotam.us/us/${encodeURIComponent(zip)}`;
  const res = await fetch(endpoint, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as any;
  if (!data || !Array.isArray(data.places) || data.places.length === 0) {
    return null;
  }
  const place = data.places[0];
  const lat =
    typeof place?.latitude === "string" ? parseFloat(place.latitude) : NaN;
  const lon =
    typeof place?.longitude === "string" ? parseFloat(place.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return { latitude: lat, longitude: lon };
}

export async function getZipCoordinates(
  zip: string,
): Promise<Coordinates | null> {
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

export interface GeoapifyLocationData {
  country: string | null;
  country_code: string | null;
  state: string | null;
  state_code: string | null;
  county: string | null;
  city: string | null;
  postcode: string | null;
  timezone: string | null;
  address: string | null;
}

export async function getLocationDataFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<GeoapifyLocationData | null> {
  console.log("===== GEOAPIFY FUNCTION CALLED =====");
  console.log(
    `[getLocationDataFromCoordinates] Starting with lat=${latitude}, lon=${longitude}`,
  );

  const apiKey = process.env.GEOAPIFY_REVERSE_GEOCODING_API_KEY;
  console.log("[getLocationDataFromCoordinates] API Key available:", !!apiKey);

  if (!apiKey) {
    console.error(
      "ERROR: [getLocationDataFromCoordinates] GEOAPIFY_REVERSE_GEOCODING_API_KEY is not set",
    );
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.error(
      `ERROR: [getLocationDataFromCoordinates] Invalid coordinates: lat=${latitude}, lon=${longitude}`,
    );
    return null;
  }

  try {
    const endpoint = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`;
    console.log("[getLocationDataFromCoordinates] === MAKING FETCH CALL ===");
    console.log(
      `[getLocationDataFromCoordinates] URL:`,
      endpoint.replace(apiKey, "***KEY***"),
    );

    const res = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });

    console.log(
      `[getLocationDataFromCoordinates] === FETCH RESPONSE RECEIVED ===`,
    );
    console.log(`[getLocationDataFromCoordinates] Status: ${res.status}`);
    console.log(`[getLocationDataFromCoordinates] Ok: ${res.ok}`);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(
        `ERROR: [getLocationDataFromCoordinates] API returned status ${res.status}`,
      );
      console.error("[getLocationDataFromCoordinates] Response:", errorText);
      return null;
    }

    const data = (await res.json().catch((e) => {
      console.error("[getLocationDataFromCoordinates] JSON parse error:", e);
      return null;
    })) as any;

    console.log(`[getLocationDataFromCoordinates] === PARSED RESPONSE ===`);
    console.log(
      `[getLocationDataFromCoordinates] Data:`,
      JSON.stringify(data).slice(0, 500),
    );

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      console.warn(
        "WARNING: [getLocationDataFromCoordinates] No results from Geoapify API",
      );
      console.warn(
        "[getLocationDataFromCoordinates] Full data:",
        JSON.stringify(data),
      );
      return null;
    }

    const result = data.results[0];
    console.log(
      `[getLocationDataFromCoordinates] === EXTRACTING DATA FROM RESULT ===`,
    );
    console.log(
      `[getLocationDataFromCoordinates] Result:`,
      JSON.stringify(result),
    );

    const returnValue = {
      country: result.country || null,
      country_code: result.country_code || null,
      state: result.state || null,
      state_code: result.state_code || null,
      county: result.county || null,
      city: result.city || null,
      postcode: result.postcode || null,
      timezone: result.timezone ? JSON.stringify(result.timezone) : null,
      address: result.formatted || null,
    };

    console.log(`[getLocationDataFromCoordinates] === RETURNING ===`);
    console.log(
      `[getLocationDataFromCoordinates] Value:`,
      JSON.stringify(returnValue),
    );

    return returnValue;
  } catch (error: any) {
    console.error(
      "CRITICAL ERROR: [getLocationDataFromCoordinates] Exception:",
      error,
    );
    console.error(
      "[getLocationDataFromCoordinates] Error message:",
      error?.message,
    );
    console.error(
      "[getLocationDataFromCoordinates] Error stack:",
      error?.stack,
    );
    return null;
  }
}
