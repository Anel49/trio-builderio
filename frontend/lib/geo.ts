export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_MILES = 3958.8;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeCoordinate(value: unknown): number | null {
  if (isFiniteNumber(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function extractCoordinates(record: any): Coordinates | null {
  if (!record || typeof record !== "object") return null;

  const latitudeCandidates = [
    record.locationLatitude,
    record.location_latitude,
    record.latitude,
    record.lat,
    record?.location?.latitude,
    record?.coords?.latitude,
  ];

  const longitudeCandidates = [
    record.locationLongitude,
    record.location_longitude,
    record.longitude,
    record.lng,
    record?.location?.longitude,
    record?.coords?.longitude,
  ];

  const latitude = latitudeCandidates.reduce<number | null>((acc, candidate) => {
    if (acc != null) return acc;
    return normalizeCoordinate(candidate);
  }, null);

  const longitude = longitudeCandidates.reduce<number | null>(
    (acc, candidate) => {
      if (acc != null) return acc;
      return normalizeCoordinate(candidate);
    },
    null,
  );

  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

export function calculateDistanceMiles(
  from: Coordinates,
  to: Coordinates,
): number | null {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lon1 = (from.longitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const lon2 = (to.longitude * Math.PI) / 180;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  if (!Number.isFinite(distance)) return null;
  return Math.round(distance * 10) / 10;
}

export function formatDistanceLabel(distanceMiles: number | null): string {
  return distanceMiles != null ? `${distanceMiles.toFixed(1)} miles` : "Distance unavailable";
}

export function computeDistanceMiles(
  user: Coordinates | null,
  listing: Coordinates | null,
): number | null {
  if (!user || !listing) return null;
  return calculateDistanceMiles(user, listing);
}
