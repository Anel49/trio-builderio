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
 * Normalizes IPv6 localhost to 127.0.0.1
 */
export function getIPAddress(req: Request): string | null {
  // Log all relevant headers for debugging
  const debugInfo = {
    "x-forwarded-for": req.headers["x-forwarded-for"],
    "x-real-ip": req.headers["x-real-ip"],
    "cf-connecting-ip": req.headers["cf-connecting-ip"],
    "x-client-ip": req.headers["x-client-ip"],
    "x-original-ip": req.headers["x-original-ip"],
    "true-client-ip": req.headers["true-client-ip"],
    "socket.remoteAddress": req.socket?.remoteAddress,
  };
  console.log("[getIPAddress] Request headers:", debugInfo);

  // Check for IP from proxies
  const forwarded = (req.headers["x-forwarded-for"] as string)?.split(",")[0];
  let ipAddress = forwarded?.trim();

  // Check for other common proxy headers
  if (!ipAddress) {
    ipAddress =
      (req.headers["x-real-ip"] as string) ||
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-client-ip"] as string) ||
      (req.headers["x-original-ip"] as string) ||
      (req.headers["true-client-ip"] as string);
  }

  // Fall back to socket address
  if (!ipAddress) {
    ipAddress = req.socket?.remoteAddress || null;
  }

  console.log("[getIPAddress] Resolved IP:", ipAddress);

  // Normalize IPv6 localhost to 127.0.0.1
  if (ipAddress === "::1" || ipAddress === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }

  // Remove IPv6 prefix if present (e.g., "::ffff:192.168.1.1" -> "192.168.1.1")
  if (ipAddress && ipAddress.startsWith("::ffff:")) {
    return ipAddress.substring(7);
  }

  return ipAddress;
}

/**
 * Get geolocation data from IP
 * Returns: { country, city }
 *
 * NOTE: Currently returns null for all requests
 * GEOAPIFY_REVERSE_GEOCODING_API_KEY is for reverse geocoding (coords -> address), not IP geolocation
 * To implement IP geolocation, integrate a dedicated IP geolocation service like:
 * - MaxMind GeoIP2
 * - IP2Location
 * - IPStack
 * - or similar service
 */
export async function getGeolocationFromIP(
  ipAddress: string | null,
): Promise<{ country: string | null; city: string | null }> {
  if (!ipAddress) {
    return { country: null, city: null };
  }

  // Skip if IP is localhost (development environment)
  if (ipAddress === "127.0.0.1" || ipAddress === "::1" || ipAddress.includes("localhost")) {
    return { country: null, city: null };
  }

  // TODO: Integrate dedicated IP geolocation service here
  // For now, return null as we don't have the correct API configured
  return { country: null, city: null };
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
 * Updates the most recent login record without logout_at
 */
export async function logLogout(
  pool: Pool,
  userId: number,
  ipAddress: string | null,
): Promise<void> {
  try {
    // Find and update the most recent login for this user that doesn't have a logout_at yet
    // Within the last 24 hours to avoid updating old stale sessions
    const result = await pool.query(
      `update user_login_history
       set logout_at = now()
       where id = (
         select id from user_login_history
         where user_id = $1 and logout_at is null and login_at > now() - interval '24 hours'
         order by login_at desc
         limit 1
       )`,
      [userId],
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`[logLogout] Logged logout for user ${userId}`);
    } else {
      console.log(`[logLogout] No matching login record found for user ${userId}`);
    }
  } catch (error: any) {
    console.error("[logLogout] Error logging logout:", error?.message);
    // Don't throw - logout should succeed even if logging fails
  }
}
