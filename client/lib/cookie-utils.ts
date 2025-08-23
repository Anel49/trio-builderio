import { CookiePreferences } from "@/components/ui/cookie-banner";

/**
 * Utility functions for managing cookie preferences
 */

export const getCookiePreferences = (): CookiePreferences | null => {
  try {
    const preferences = localStorage.getItem("trio-cookie-preferences");
    return preferences ? JSON.parse(preferences) : null;
  } catch {
    return null;
  }
};

export const hasCookieConsent = (): boolean => {
  return localStorage.getItem("trio-cookies-accepted") === "true";
};

export const canUseAnalytics = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.analytics === true;
};

export const canUseMarketing = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.marketing === true;
};

export const canUseFunctional = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.functional === true;
};

/**
 * Reset cookie preferences (for testing or user request)
 */
export const resetCookiePreferences = (): void => {
  localStorage.removeItem("trio-cookies-accepted");
  localStorage.removeItem("trio-cookie-preferences");
};

/**
 * Example usage for analytics tracking
 */
export const trackEvent = (event: string, data?: any) => {
  if (canUseAnalytics()) {
    // Only track if user has consented to analytics
    console.log("Analytics event:", event, data);
    // Here you would integrate with your analytics service (GA, Mixpanel, etc.)
  }
};

/**
 * Example usage for marketing pixels
 */
export const loadMarketingPixels = () => {
  if (canUseMarketing()) {
    // Only load marketing pixels if user has consented
    console.log("Loading marketing pixels...");
    // Here you would load Facebook Pixel, Google Ads, etc.
  }
};
