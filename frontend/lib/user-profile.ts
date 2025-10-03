/**
 * Centralized user profile data to ensure consistency across the application
 */
import { apiFetch } from "./api";

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
  zipCode: "20175",
  email: "sarah@example.com",
  phone: "+1 (555) 123-4567",
  bio: "Love sharing my collection with the community! Quick responses and always ready to help with pickup arrangements.",
};

const ZIP_CODE_REGEX = /^\d{5}$/;

let cachedZipCode: string | null = normalizeZip((currentUser as any)?.zipCode);

function normalizeZip(candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return ZIP_CODE_REGEX.test(trimmed) ? trimmed : null;
}

export function getCurrentUserZipCode(): string | null {
  return cachedZipCode;
}

export function setCurrentUserZipCode(zip: unknown) {
  cachedZipCode = normalizeZip(zip);
  (currentUser as any).zipCode = cachedZipCode;
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
          setCurrentUserZipCode((currentUser as any)?.zipCode ?? null);
          return;
        }
        const res = await apiFetch(`users?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          setCurrentUserZipCode((currentUser as any)?.zipCode ?? null);
          return;
        }
        const data = await res.json().catch(() => null);
        if (data && data.ok && data.user) {
          const user = data.user;
          setCurrentUserZipCode(user.zipCode ?? user.zip_code ?? null);
        } else {
          setCurrentUserZipCode((currentUser as any)?.zipCode ?? null);
        }
      } catch {
        setCurrentUserZipCode((currentUser as any)?.zipCode ?? null);
      } finally {
        profileHydrated = true;
      }
    })();
  }
  return profileHydration;
}
