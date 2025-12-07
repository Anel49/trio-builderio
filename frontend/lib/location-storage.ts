export const LOCATION_STORAGE_KEY = "userLocationData";
export const LOCATION_CLEARED_SESSION_KEY = "locationClearedThisSession";

export interface StoredLocation {
  latitude: number;
  longitude: number;
  city: string | null;
}

/**
 * Save location data to localStorage
 * Only saves if latitude and longitude are valid numbers
 */
export function saveLocationToLocalStorage(
  latitude: number | null,
  longitude: number | null,
  city: string | null,
): void {
  if (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({ latitude, longitude, city: city || null }),
    );
  }
}

/**
 * Retrieve location data from localStorage
 * Returns null if no valid location is stored
 */
export function getLocationFromLocalStorage(): StoredLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);

    // Validate structure
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number" &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        city: typeof parsed.city === "string" ? parsed.city : null,
      };
    }

    return null;
  } catch {
    // If parsing fails, location data is corrupted
    return null;
  }
}

/**
 * Clear location data from localStorage
 */
export function clearLocationFromLocalStorage(): void {
  localStorage.removeItem(LOCATION_STORAGE_KEY);
  localStorage.setItem(LOCATION_CLEARED_SESSION_KEY, "true");
}

/**
 * Check if there is valid location data in localStorage
 */
export function hasLocationInLocalStorage(): boolean {
  return getLocationFromLocalStorage() !== null;
}

/**
 * Check if user has explicitly cleared location this session
 */
export function wasLocationClearedThisSession(): boolean {
  return localStorage.getItem(LOCATION_CLEARED_SESSION_KEY) === "true";
}

/**
 * Reset the session clear flag (call on logout)
 */
export function resetLocationClearedFlag(): void {
  localStorage.removeItem(LOCATION_CLEARED_SESSION_KEY);
}
