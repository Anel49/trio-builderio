import { CookiePreferences } from "@/components/ui/cookie-banner";
import { COMPANY_NAME } from "./constants";

/**
 * Utility functions for managing cookie preferences
 */

export const getCookiePreferences = (): CookiePreferences | null => {
  try {
    const preferences = localStorage.getItem(`${COMPANY_NAME.toLowerCase()}-cookie-preferences`);
    return preferences ? JSON.parse(preferences) : null;
  } catch {
    return null;
  }
};

export const hasCookieConsent = (): boolean => {
  return localStorage.getItem(`${COMPANY_NAME.toLowerCase()}-cookies-accepted`) === "true";
};

export const canUseStatistics = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.statistics === true;
};

export const canUseMarketing = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.marketing === true;
};

export const canUsePreferences = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.preferences === true;
};

/**
 * Reset cookie preferences (for testing or user request)
 */
export const resetCookiePreferences = (): void => {
  localStorage.removeItem(`${COMPANY_NAME.toLowerCase()}-cookies-accepted`);
  localStorage.removeItem(`${COMPANY_NAME.toLowerCase()}-cookie-preferences`);
};

/**
 * Example usage for analytics tracking
 */
export const trackEvent = (event: string, data?: any) => {
  if (canUseStatistics()) {
    // Only track if user has consented to statistics
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
