/**
 * Centralized user profile data to ensure consistency across the application
 */
export const currentUser = {
  name: "Sarah",
  initials: "S",
  profileImage:
    "https://images.unsplash.com/photo-1494790108755-2616b612f672?w=64&h=64&fit=crop&auto=format",
  rating: 4.8,
  totalReviews: 89,
  joinedDate: "2022",
  responseTime: "within an hour",
  defaultLocation: "San Francisco, CA",
  zipCode: "94102",
  email: "sarah@example.com",
  phone: "+1 (555) 123-4567",
  bio: "Love sharing my collection with the community! Quick responses and always ready to help with pickup arrangements.",
};

const ZIP_CODE_REGEX = /^\d{5}$/;

export function getCurrentUserZipCode(): string | null {
  const zip = (currentUser as any)?.zipCode;
  if (typeof zip !== "string") return null;
  const trimmed = zip.trim();
  return ZIP_CODE_REGEX.test(trimmed) ? trimmed : null;
}
