import type { Request, Response } from "express";

function formatCityLabel(address: Record<string, any> | null | undefined) {
  if (!address) return null;
  const cityLike =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.locality ||
    address.neighbourhood;
  const state = address.state || address.region || null;
  const cityPart =
    typeof cityLike === "string" && cityLike.trim() ? cityLike.trim() : null;
  const statePart =
    typeof state === "string" && state.trim() ? state.trim() : null;
  if (cityPart && statePart) return `${cityPart}, ${statePart}`;
  return cityPart || statePart || null;
}

function parseCoordinate(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function reverseGeocode(req: Request, res: Response) {
  try {
    const { latitude, longitude } = (req.body || {}) as Record<string, unknown>;
    const lat = parseCoordinate(latitude);
    const lon = parseCoordinate(longitude);

    if (lat == null || lon == null) {
      return res
        .status(400)
        .json({ ok: false, error: "latitude and longitude are required" });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res
        .status(400)
        .json({ ok: false, error: "coordinates out of range" });
    }

    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      zoom: "12",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          "User-Agent": "LendItApp/1.0 (support@lendit.com)",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: `geocoding service responded with status ${response.status}`,
      });
    }

    const data = (await response.json().catch(() => null)) as any;
    if (!data) {
      return res
        .status(502)
        .json({ ok: false, error: "failed to parse geocoding response" });
    }

    const address = data?.address ?? null;
    const cityLabel = formatCityLabel(address);
    const postalCodeRaw = address?.postcode;
    const postalCode =
      typeof postalCodeRaw === "string" && postalCodeRaw.trim()
        ? postalCodeRaw.trim()
        : null;

    res.json({ ok: true, city: cityLabel, postalCode });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
