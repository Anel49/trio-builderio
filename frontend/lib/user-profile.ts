/**
 * Centralized user profile data to ensure consistency across the application
 */
import { apiFetch } from "./api";

export interface UserLocation {
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  postalCode: string | null;
}

export const currentUser = {
  name: "Sarah",
  initials: "S",
  profileImage:
    "https://images.unsplash.com/photo-1494790108755-2616b612f672?w=64&h=64&fit=crop&auto=format",
  rating: 4.8,
  totalReviews: 89,
  joinedDate: "2022",
  responseTime: "within an hour",
  defaultLocation: "Leesburg, VA",
  locationLatitude: null as number | null,
  locationLongitude: null as number | null,
  zipCode: "20175",
  email: "sarah@example.com",
  phone: "+1 (555) 123-4567",
  bio: "Love sharing my collection with the community! Quick responses and always ready to help with pickup arrangements.",
};

const ZIP_CODE_REGEX = /^\d{5}$/;

type LocationUpdate = Partial<UserLocation> | UserLocation;

function normalizePostal(candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return ZIP_CODE_REGEX.test(trimmed) ? trimmed : null;
}

function normalizeCoordinate(candidate: unknown): number | null {
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate;
  }
  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeCity(candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed ? trimmed : null;
}

const initialLocation: UserLocation = {
  city: normalizeCity((currentUser as any)?.defaultLocation) ?? null,
  latitude: normalizeCoordinate((currentUser as any)?.latitude ?? (currentUser as any)?.locationLatitude),
  longitude: normalizeCoordinate((currentUser as any)?.longitude ?? (currentUser as any)?.locationLongitude),
  postalCode: normalizePostal((currentUser as any)?.zipCode),
};

let cachedLocation: UserLocation = { ...initialLocation };

export function getCurrentUserLocation(): UserLocation {
  return { ...cachedLocation };
}

export function getCurrentUserCoordinates(): {
  latitude: number;
  longitude: number;
} | null {
  if (
    typeof cachedLocation.latitude === "number" &&
    Number.isFinite(cachedLocation.latitude) &&
    typeof cachedLocation.longitude === "number" &&
    Number.isFinite(cachedLocation.longitude)
  ) {
    return {
      latitude: cachedLocation.latitude,
      longitude: cachedLocation.longitude,
    };
  }
  return null;
}

export function getCurrentUserCity(): string | null {
  return cachedLocation.city;
}

export function getCurrentUserZipCode(): string | null {
  return cachedLocation.postalCode;
}

function applyLocationUpdate(update: LocationUpdate) {
  const normalized: UserLocation = {
    city:
      update.city !== undefined
        ? normalizeCity(update.city)
        : cachedLocation.city,
    latitude:
      update.latitude !== undefined
        ? normalizeCoordinate(update.latitude)
        : cachedLocation.latitude,
    longitude:
      update.longitude !== undefined
        ? normalizeCoordinate(update.longitude)
        : cachedLocation.longitude,
    postalCode:
      update.postalCode !== undefined
        ? normalizePostal(update.postalCode)
        : cachedLocation.postalCode,
  };
  cachedLocation = normalized;
  (currentUser as any).locationLatitude = normalized.latitude;
  (currentUser as any).locationLongitude = normalized.longitude;
  (currentUser as any).zipCode = normalized.postalCode;
  if (normalized.city) {
    (currentUser as any).defaultLocation = normalized.city;
  }
}

export function setCurrentUserLocation(update: LocationUpdate) {
  applyLocationUpdate(update);
}

export function setCurrentUserZipCode(zip: unknown) {
  applyLocationUpdate({ postalCode: normalizePostal(zip) });
}

let profileHydration: Promise<void> | null = null;
let profileHydrated = false;

export async function ensureCurrentUserProfile() {
  if (profileHydrated) return;
  if (!profileHydration) {
    profileHydration = (async () => {
      try {
        const email =
          typeof currentUser.email === "string" && currentUser.email.trim()
            ? currentUser.email.trim()
            : "";
        if (!email) {
          applyLocationUpdate(initialLocation);
          return;
        }
        const res = await apiFetch(`users?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          applyLocationUpdate(initialLocation);
          return;
        }
        const data = await res.json().catch(() => null);
        if (data && data.ok && data.user) {
          const user = data.user;
          applyLocationUpdate({
            city: user.locationCity ?? user.location_city ?? null,
            latitude:
              user.locationLatitude ?? user.location_latitude ?? undefined,
            longitude:
              user.locationLongitude ?? user.location_longitude ?? undefined,
            postalCode: user.zipCode ?? user.zip_code ?? null,
          });
        } else {
          applyLocationUpdate(initialLocation);
        }
      } catch {
        applyLocationUpdate(initialLocation);
      } finally {
        profileHydrated = true;
      }
    })();
  }
  return profileHydration;
}
