/**
 * Extract timezone name from JSON string or timezone name string
 * @param timezone - Stringified JSON from Geoapify API or plain timezone name
 * @returns Timezone name (e.g., "America/Chicago") or "UTC"
 */
export function extractTimezoneName(timezone: string | null): string {
  if (!timezone) {
    return "UTC";
  }

  try {
    const parsed = JSON.parse(timezone);
    if (typeof parsed.name === "string") {
      return parsed.name;
    }
  } catch {
    // Not JSON, might be plain timezone name string
    if (timezone.includes("/") || timezone === "UTC") {
      return timezone;
    }
  }

  return "UTC";
}

/**
 * Get formatted UTC offset for a given timezone and date
 * Uses Intl API for accurate DST detection
 * @param timezoneName - IANA timezone name (e.g., "America/Chicago")
 * @param date - Date to check for DST status
 * @returns Formatted offset (e.g., "UTC-5", "UTC-6", "UTC 0")
 */
export function getOffsetFromTimezone(
  timezoneName: string,
  date: Date,
): string {
  if (!timezoneName || timezoneName === "UTC") {
    return "UTC 0";
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezoneName,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");

    if (offsetPart) {
      let offset = offsetPart.value;
      offset = offset.replace("GMT", "UTC");
      if (offset === "UTC+0" || offset === "UTC-0") {
        return "UTC 0";
      }
      offset = offset.replace(/:00$/, "");
      return offset;
    }
  } catch (e) {
    // Invalid timezone name
  }

  return "UTC 0";
}

/**
 * Format date range with timezone offset
 * @param startDate - Start date
 * @param endDate - End date
 * @param timezone - Timezone JSON string or name
 * @returns Formatted string (e.g., "Dec 25, 2025 - Dec 26, 2025 (UTC-5)")
 */
export function formatDateRangeWithOffset(
  startDate: Date,
  endDate: Date,
  timezone: string | null,
): string {
  const timezoneName = extractTimezoneName(timezone);
  const offset = getOffsetFromTimezone(timezoneName, startDate);

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const startFormatted = formatter.format(startDate);
  const endFormatted = formatter.format(endDate);

  return `${startFormatted} - ${endFormatted} (${offset})`;
}

/**
 * Get timezone abbreviation (letter abbreviation like EST, CST, etc.)
 * Uses Intl API to get the short timezone name
 * @param timezoneName - IANA timezone name (e.g., "America/Chicago")
 * @param date - Date to check for DST status
 * @returns Timezone abbreviation (e.g., "EST", "CST", "EET")
 */
export function getTimezoneName(timezoneName: string, date: Date): string {
  if (!timezoneName || timezoneName === "UTC") {
    return "UTC";
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezoneName,
      timeZoneName: "short",
    });

    const parts = formatter.formatToParts(date);
    const timezonePart = parts.find((p) => p.type === "timeZoneName");

    if (timezonePart) {
      return timezonePart.value;
    }
  } catch (e) {
    // Invalid timezone name
  }

  return "UTC";
}

/**
 * Format date range with timezone abbreviation (for user-facing display)
 * @param startDate - Start date
 * @param endDate - End date
 * @param timezone - Timezone JSON string or name
 * @returns Formatted string (e.g., "Dec 25, 2025 - Dec 28, 2025 EST")
 */
export function formatDateRangeWithAbbreviation(
  startDate: Date,
  endDate: Date,
  timezone: string | null,
): string {
  const timezoneName = extractTimezoneName(timezone);
  const abbreviation = getTimezoneName(timezoneName, startDate);

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const startFormatted = formatter.format(startDate);
  const endFormatted = formatter.format(endDate);

  return `${startFormatted} - ${endFormatted} ${abbreviation}`;
}
