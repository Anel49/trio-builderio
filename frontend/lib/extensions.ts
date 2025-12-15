/**
 * Booking Extensions Utility Functions
 * Handles validation and constraints for extension requests
 */

/**
 * Get the minimum date for an extension (24 hours from now)
 */
export function get24HourMinimumDate(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now;
}

/**
 * Get the earliest date an extension can start (day after order ends)
 */
export function getEarliestExtensionDate(orderEndDate: Date): Date {
  const nextDay = new Date(orderEndDate);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
}

/**
 * Validate an extension date range
 */
export function isValidExtensionDateRange(
  startDate: Date,
  endDate: Date,
  orderEndDate: Date,
  conflictingDates: Array<{ startDate: string | Date; endDate: string | Date }> = []
): { valid: boolean; reason?: string } {
  const now = new Date();
  const minTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const earliestDate = getEarliestExtensionDate(orderEndDate);

  if (startDate < minTime) {
    return {
      valid: false,
      reason: "Extension must start at least 24 hours from now",
    };
  }

  if (startDate < earliestDate) {
    return {
      valid: false,
      reason: "Extension must start after the original order ends",
    };
  }

  if (startDate > endDate) {
    return { valid: false, reason: "Start date must be before end date" };
  }

  // Check overlaps with conflicting dates
  for (const range of conflictingDates) {
    const rangeStart = new Date(range.startDate);
    const rangeEnd = new Date(range.endDate);
    // Add 1 day to end date to make it inclusive
    rangeEnd.setDate(rangeEnd.getDate() + 1);
    if (startDate <= rangeEnd && endDate >= rangeStart) {
      return {
        valid: false,
        reason: "Dates overlap with existing bookings",
      };
    }
  }

  return { valid: true };
}

/**
 * Format dates for API requests (YYYY-MM-DD format)
 */
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate total price for an extension
 */
export function calculateExtensionTotal(
  dailyPriceCents: number,
  startDate: Date,
  endDate: Date
): number {
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  return dailyPriceCents * days;
}
