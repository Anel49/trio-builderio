import { Pool } from "pg";
import type { Request } from "express";

export interface LoginHistoryData {
  userId: number | null;
  success: boolean;
  ipAddress: string | null;
  ipCountry: string | null;
  ipCity: string | null;
  deviceType: "desktop" | "tablet" | "mobile" | null;
  method: "email/password" | "oauth";
  oauthProvider: string | null;
  mfaUsed: boolean | null;
  mfaMethod: string | null;
  userAgent: string | null;
  browser: string | null;
  notes: string | null;
}

/**
 * Parse user agent to extract browser name and version
 * Supports: Chrome, Firefox, Safari, Edge, Opera, etc.
 */
export function parseBrowserFromUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;

  // Chrome
  if (userAgent.includes("Chrome")) {
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) return `Chrome ${match[1]}`;
  }

  // Firefox
  if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) return `Firefox ${match[1]}`;
  }

  // Safari
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) return `Safari ${match[1]}`;
  }

  // Edge
  if (userAgent.includes("Edg")) {
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    if (match) return `Edge ${match[1]}`;
  }

  // Opera
  if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    const match = userAgent.match(/(?:OPR|Opera)\/(\d+\.\d+)/);
    if (match) return `Opera ${match[1]}`;
  }

  return null;
}

/**
 * Detect device type from user agent
 * Returns: "desktop", "tablet", or "mobile"
 */
export function detectDeviceType(
  userAgent: string | null,
): "desktop" | "tablet" | "mobile" | null {
  if (!userAgent) return null;

  const lowerUA = userAgent.toLowerCase();

  // Tablet detection
  if (
    lowerUA.includes("ipad") ||
    lowerUA.includes("tablet") ||
    lowerUA.includes("kindle") ||
    lowerUA.includes("playbook")
  ) {
    return "tablet";
  }

  // Mobile detection
  if (
    lowerUA.includes("mobile") ||
    lowerUA.includes("android") ||
    lowerUA.includes("iphone") ||
    lowerUA.includes("ipod") ||
    lowerUA.includes("windows phone") ||
    lowerUA.includes("blackberry")
  ) {
    return "mobile";
  }

  // Default to desktop if no mobile/tablet indicators
  return "desktop";
}

/**
 * Get IP address from request
 * Handles proxies and various headers
 */
export function getIPAddress(req: Request): string | null {
  // Check for IP from proxies
  const forwarded = (req.headers["x-forwarded-for"] as string)?.split(",")[0];
  if (forwarded) return forwarded.trim();

  // Check for other common proxy headers
  const proxyIP =
    (req.headers["x-real-ip"] as string) ||
    (req.headers["cf-connecting-ip"] as string);
  if (proxyIP) return proxyIP;

  // Fall back to socket address
  return req.socket?.remoteAddress || null;
}

/**
 * Get geolocation data from IP using GEOAPIFY API
 * Returns: { country, city }
 */
export async function getGeolocationFromIP(
  ipAddress: string | null,
): Promise<{ country: string | null; city: string | null }> {
  if (!ipAddress) {
    return { country: null, city: null };
  }

  try {
    const apiKey = process.env.GEOAPIFY_REVERSE_GEOCODING_API_KEY;
    if (!apiKey) {
      console.warn("[getGeolocationFromIP] API key not configured");
      return { country: null, city: null };
    }

    // Skip if IP is localhost
    if (ipAddress === "127.0.0.1" || ipAddress === "::1" || ipAddress.includes("localhost")) {
      return { country: null, city: null };
    }

    // Note: GEOAPIFY has different endpoints for IP vs coordinates
    // This uses reverse geocoding with coordinates, but for IP geolocation
    // you might want to use a dedicated IP geolocation service
    // For now, we'll return null as a placeholder since GEOAPIFY is for reverse geocoding
    // You can integrate a dedicated IP geolocation service here
    
    return { country: null, city: null };
  } catch (error: any) {
    console.error("[getGeolocationFromIP] Error:", error?.message);
    return { country: null, city: null };
  }
}

/**
 * Log a login attempt to the user_login_history table
 */
export async function logLoginAttempt(
  pool: Pool,
  data: LoginHistoryData,
): Promise<void> {
  try {
    const {
      userId,
      success,
      ipAddress,
      ipCountry,
      ipCity,
      deviceType,
      method,
      oauthProvider,
      mfaUsed,
      mfaMethod,
      userAgent,
      browser,
      notes,
    } = data;

    await pool.query(
      `insert into user_login_history (
        user_id, success, ip_address, ip_country, ip_city, device_type,
        method, oauth_provider, mfa_used, mfa_method, user_agent, browser, notes
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        userId,
        success,
        ipAddress,
        ipCountry,
        ipCity,
        deviceType,
        method,
        oauthProvider,
        mfaUsed,
        mfaMethod,
        userAgent,
        browser,
        notes,
      ],
    );

    console.log(`[logLoginAttempt] Logged login attempt for user ${userId}`);
  } catch (error: any) {
    console.error("[logLoginAttempt] Error logging login attempt:", error?.message);
    // Don't throw - login should succeed even if logging fails
  }
}

/**
 * Record logout for a user
 */
export async function logLogout(
  pool: Pool,
  userId: number,
  ipAddress: string | null,
): Promise<void> {
  try {
    // Find the most recent login for this user from this IP
    const result = await pool.query(
      `update user_login_history 
       set logout_at = now()
       where user_id = $1 and ip_address = $2 and logout_at is null and login_at > now() - interval '24 hours'
       order by login_at desc
       limit 1`,
      [userId, ipAddress],
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`[logLogout] Logged logout for user ${userId}`);
    }
  } catch (error: any) {
    console.error("[logLogout] Error logging logout:", error?.message);
    // Don't throw - logout should succeed even if logging fails
  }
}
