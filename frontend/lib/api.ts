let cachedBase: string | null = null;
let lastResolveFailAt = 0;
const RESOLVE_COOLDOWN_MS = 5_000; // Reduced from 15s to recover faster
let offlineUntil = 0;
const TEMP_OFFLINE_MS = 15_000; // Reduced from 60s to 15s for faster recovery
let lastPingOkAt = 0;
let lastPingCheckAt = 0;
const PING_TTL_MS = 10_000; // Reduced from 15s to check more frequently
const DISABLE_NETWORK =
  String(
    (import.meta as any).env?.VITE_DISABLE_NETWORK ?? "false",
  ).toLowerCase() === "true";

function cleanJoin(base: string, path: string) {
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr.filter(Boolean))) as T[];
}

function buildFallbackGeocodeResponse(init?: RequestInit) {
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (init?.body) {
    try {
      const rawBody =
        typeof init.body === "string" ? JSON.parse(init.body) : init.body;
      const latValue = rawBody?.latitude;
      const lonValue = rawBody?.longitude;

      const parseCoord = (value: unknown) => {
        if (typeof value === "number") {
          return Number.isFinite(value) ? value : null;
        }
        if (typeof value === "string") {
          const parsed = Number.parseFloat(value.trim());
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      latitude = parseCoord(latValue);
      longitude = parseCoord(lonValue);
    } catch {
      latitude = null;
      longitude = null;
    }
  }

  const fallbackCity =
    latitude != null && longitude != null
      ? `Selected point (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`
      : null;

  return new Response(
    JSON.stringify({ ok: true, city: fallbackCity, postalCode: null }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function tryFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 12000,
): Promise<Response | null> {
  try {
    let settled = false;
    const timeout = new Promise<Response | null>((resolve) => {
      setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, timeoutMs);
    });
    const res = await Promise.race([
      fetch(url, init).then((r) => {
        if (!settled) {
          settled = true;
          return r;
        }
        return null;
      }),
      timeout,
    ]);
    return (res as Response) || null;
  } catch (error) {
    // Log errors for debugging, but don't throw
    if (process.env.NODE_ENV !== "production") {
      console.debug("[tryFetch] Network error for", url, error);
    }
    return null;
  }
}

async function pingBase(base: string): Promise<boolean> {
  const res = await tryFetch(cleanJoin(base, "ping"), { method: "GET" }, 5000);
  return !!(res && res.ok);
}

async function resolveApiBase(): Promise<string | null> {
  if (DISABLE_NETWORK) return null;
  if (cachedBase) return cachedBase;
  const now = Date.now();
  if (now - lastResolveFailAt < RESOLVE_COOLDOWN_MS) return null;

  const envBase = (import.meta as any).env?.VITE_API_BASE_URL as
    | string
    | undefined;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // Build candidates list: try env var first if provided, then standard candidates
  const candidates = uniq<string>([
    // Try env var first if provided
    envBase ? envBase : "",
    // Prefer same-origin candidates next to avoid CORS/network blockers
    "/api",
    "/.netlify/functions/api",
    origin ? `${origin}/api` : "",
    origin ? `${origin}/.netlify/functions/api` : "",
  ]);

  for (const base of candidates) {
    if (!base) continue;
    const pingUrl = cleanJoin(base, "ping");
    const res = await tryFetch(pingUrl, { method: "GET" }, 1200);
    if (res && res.ok) {
      cachedBase = base;
      return cachedBase;
    }
  }

  lastResolveFailAt = Date.now();
  return null;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const pRaw = String(path || "");
  const p = pRaw.replace(/^\//, "");

  // Build final init
  const finalInit = {
    ...init,
    credentials: !/^https?:\/\//i.test(path)
      ? ("include" as const)
      : init?.credentials,
  };

  // Always short-circuit ping without network
  if (/^ping$/.test(p)) {
    return new Response(JSON.stringify({ ok: true, message: "local-ping" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Demo-only endpoints: short-circuit without network to prevent failures in read-only environments
  if (
    /^stripe\/create-payment-intent$/.test(p) &&
    (init?.method || "GET").toUpperCase() === "POST"
  ) {
    return new Response(
      JSON.stringify({ ok: true, clientSecret: "demo_secret" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Offline mode (forced or temporary): never perform network calls
  if (DISABLE_NETWORK || Date.now() < offlineUntil) {
    if (/ping$/.test(p)) {
      return new Response(JSON.stringify({ ok: true, message: "offline" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (
      /^geocode\/reverse$/.test(p) &&
      (finalInit?.method || "GET").toUpperCase() === "POST"
    ) {
      return buildFallbackGeocodeResponse(finalInit);
    }
    if (/^listings$/.test(p)) {
      return new Response(JSON.stringify({ ok: true, listings: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (/^listings\/\d+$/.test(p)) {
      return new Response(JSON.stringify({ ok: false, listing: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (/^listings\/\d+\/reviews$/.test(p)) {
      return new Response(JSON.stringify({ ok: true, reviews: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (/^listings\/\d+\/reservations$/.test(p)) {
      return new Response(JSON.stringify({ ok: true, reservations: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (/^(api\/)?reservations\/\d+$/.test(p)) {
      return new Response(JSON.stringify({ ok: true, reservations: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (/^listings\/\d+\/reviews$/.test(p)) {
      return new Response(JSON.stringify({ ok: true, reviews: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (
      /^users(\?|$)/.test(p) &&
      (finalInit?.method || "GET").toUpperCase() === "GET"
    ) {
      return new Response(JSON.stringify({ ok: true, user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (
      /^users$/.test(p) &&
      (finalInit?.method || "GET").toUpperCase() === "POST"
    ) {
      try {
        const body =
          typeof finalInit?.body === "string" ? JSON.parse(finalInit.body) : {};
        const user = {
          id: 0,
          name: body?.name ?? null,
          email: body?.email ?? null,
          avatarUrl: body?.avatar_url ?? null,
          zipCode: body?.zip_code ?? null,
          createdAt: new Date().toISOString(),
          foundingSupporter: Boolean(body?.founding_supporter),
          topReferrer: Boolean(body?.top_referrer),
          ambassador: Boolean(body?.ambassador),
        };
        return new Response(JSON.stringify({ ok: true, user }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ ok: true, user: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    if (/^favorites($|\/[^\/]+)/.test(p)) {
      if ((finalInit?.method || "GET").toUpperCase() === "POST") {
        return new Response(
          JSON.stringify({ ok: true, alreadyFavorited: false }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ ok: true, favorites: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: false, offline: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Absolute URL passthrough
  if (/^https?:\/\//i.test(path)) {
    const res = await tryFetch(path, finalInit);
    if (res) return res;
    return new Response(
      JSON.stringify({ ok: false, error: `Network error for ${path}` }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let base = cachedBase;
  if (!base) base = await resolveApiBase();

  const isDataEndpoint =
    /^(api\/)?(listings($|\/\d+(?:\/(?:reviews|reservations))?)|users(\?|$)|favorites|reservations|listing-reviews|stripe\/create-payment-intent|geocode\/reverse)/.test(
      p,
    );

  // DEBUG: Log all API calls for reservations
  if (p.includes("reservations")) {
    console.log("[apiFetch] Reservations call:", { p, base, isDataEndpoint });
  }

  if (base) {
    // For data endpoints, ensure backend is responsive recently; otherwise avoid failing fetches
    if (isDataEndpoint) {
      const now = Date.now();
      if (now - lastPingOkAt > PING_TTL_MS && now - lastPingCheckAt > 1000) {
        lastPingCheckAt = now;
        const ok = await pingBase(base);
        if (ok) {
          lastPingOkAt = Date.now();
          const url = cleanJoin(base, path);
          if (p.includes("reservations")) {
            console.log("[apiFetch] Fetching reservations from:", url);
          }
          const res = await tryFetch(url, finalInit, 15000);
          if (res) {
            if (p.includes("reservations")) {
              console.log(
                "[apiFetch] Reservations response status:",
                res.status,
                "content-type:",
                res.headers.get("content-type"),
              );
            }
            return res;
          }
        } else {
          lastResolveFailAt = Date.now();
          offlineUntil = Date.now() + TEMP_OFFLINE_MS;
          // fall through to stubs below without attempting the failing fetch
        }
      } else {
        const url = cleanJoin(base, path);
        if (p.includes("reservations")) {
          console.log("[apiFetch] Fetching reservations from:", url);
        }
        const res = await tryFetch(url, finalInit, 15000);
        if (res) {
          if (p.includes("reservations")) {
            console.log(
              "[apiFetch] Reservations response status:",
              res.status,
              "content-type:",
              res.headers.get("content-type"),
            );
          }
          return res;
        }
      }
    } else {
      const url = cleanJoin(base, path);
      const res = await tryFetch(url, finalInit, 8000);
      if (res) return res;
    }
  }
  // Mark temporary offline to avoid spamming network with failing calls
  lastResolveFailAt = Date.now();
  offlineUntil = Date.now() + TEMP_OFFLINE_MS;

  // Graceful fallback to avoid noisy unhandled errors in environments without a backend
  if (/^ping$/.test(p)) {
    return new Response(
      JSON.stringify({ ok: true, message: "unreachable-fallback" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  if (/^listings$/.test(p)) {
    // Do not return demo data; prefer empty to avoid confusion
    return new Response(JSON.stringify({ ok: true, listings: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (
    /^stripe\/create-payment-intent$/.test(p) &&
    (finalInit?.method || "GET").toUpperCase() === "POST"
  ) {
    return new Response(
      JSON.stringify({ ok: true, clientSecret: "demo_secret" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  if (
    /^geocode\/reverse$/.test(p) &&
    (finalInit?.method || "GET").toUpperCase() === "POST"
  ) {
    return buildFallbackGeocodeResponse(finalInit);
  }
  const m = p.match(/^listings\/(\d+)$/);
  if (m) {
    return new Response(JSON.stringify({ ok: false, error: "unreachable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  const m2 = p.match(/^listings\/(\d+)\/reviews$/);
  if (m2) {
    return new Response(JSON.stringify({ ok: true, reviews: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const m3 = p.match(/^listings\/(\d+)\/reservations$/);
  if (m3) {
    return new Response(JSON.stringify({ ok: true, reservations: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const m4 = p.match(/^api\/reservations\/(\d+)$/);
  if (m4) {
    return new Response(JSON.stringify({ ok: true, reservations: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (
    /^users(\?|$)/.test(p) &&
    (finalInit?.method || "GET").toUpperCase() === "GET"
  ) {
    return new Response(JSON.stringify({ ok: true, user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (
    /^users$/.test(p) &&
    (finalInit?.method || "GET").toUpperCase() === "POST"
  ) {
    try {
      const body =
        typeof finalInit?.body === "string" ? JSON.parse(finalInit.body) : {};
      const user = {
        id: 0,
        name: body?.name ?? null,
        email: body?.email ?? null,
        avatarUrl: body?.avatar_url ?? null,
        createdAt: new Date().toISOString(),
        foundingSupporter: Boolean(body?.founding_supporter),
        topReferrer: Boolean(body?.top_referrer),
        ambassador: Boolean(body?.ambassador),
      };
      return new Response(JSON.stringify({ ok: true, user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ ok: true, user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  if (/^favorites($|\/[^\/]+)/.test(p)) {
    if ((finalInit?.method || "GET").toUpperCase() === "POST") {
      return new Response(
        JSON.stringify({ ok: true, alreadyFavorited: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({ ok: true, favorites: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "API unreachable",
      hint: "Set VITE_API_BASE_URL to your API base (e.g. https://<your-site>.netlify.app/.netlify/functions/api) or deploy the backend.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}

/**
 * Get a presigned URL for uploading a file to S3
 * @param listingId - The listing ID (can be a temporary value like 0 for new listings)
 * @param filename - The original filename
 * @param contentType - The MIME type (e.g., "image/jpeg")
 * @param imageNumber - The sequential image number (1, 2, 3, etc.)
 * @returns An object with presignedUrl, presignedWebpUrl, and s3Urls
 */
export async function getS3PresignedUrl(
  listingId: number,
  filename: string,
  contentType: string,
  imageNumber: number,
): Promise<{
  ok: boolean;
  presignedUrl?: string;
  presignedWebpUrl?: string;
  s3Url?: string;
  s3WebpUrl?: string;
  s3Key?: string;
  s3WebpKey?: string;
  error?: string;
}> {
  try {
    const response = await apiFetch(`/listings/${listingId}/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        contentType,
        imageNumber,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        ok: false,
        error: errorData?.error || "Failed to get presigned URL",
      };
    }

    const data = await response.json();
    return {
      ok: data.ok,
      presignedUrl: data.presignedUrl,
      presignedWebpUrl: data.presignedWebpUrl,
      s3Url: data.s3Url,
      s3WebpUrl: data.s3WebpUrl,
      s3Key: data.s3Key,
      s3WebpKey: data.s3WebpKey,
    };
  } catch (error: any) {
    console.error("[getS3PresignedUrl] Error:", error);
    return {
      ok: false,
      error: error?.message || "Network error",
    };
  }
}

/**
 * Delete an image from S3
 * @param imageUrl - The S3 URL of the image to delete
 * @returns An object with ok status
 */
export async function deleteS3Image(imageUrl: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const response = await apiFetch(`/listings/delete-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
      }),
    });

    const data = await response.json();
    return {
      ok: data.ok,
      error: data.error,
    };
  } catch (error: any) {
    console.error("[deleteS3Image] Error:", error);
    return {
      ok: false,
      error: error?.message || "Network error",
    };
  }
}

/**
 * Update a reservation status (accept or reject)
 * @param reservationId - The reservation ID
 * @param status - The new status ('accepted' or 'rejected')
 * @returns An object with ok status and updated reservation
 */
export async function updateReservationStatus(
  reservationId: string | number,
  status: "pending" | "accepted" | "rejected",
): Promise<{
  ok: boolean;
  reservation?: {
    id: string | number;
    status: string;
  };
  error?: string;
}> {
  try {
    console.log(
      "[updateReservationStatus] Sending PATCH request for reservation",
      reservationId,
      "with status",
      status,
    );
    const response = await apiFetch(
      `/reservations/${reservationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      },
    );

    if (!response) {
      console.error("[updateReservationStatus] No response from apiFetch");
      return {
        ok: false,
        error: "No response from server",
      };
    }

    console.log(
      "[updateReservationStatus] Response status:",
      response.status,
      "headers:",
      response.headers,
    );

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(
        "[updateReservationStatus] Non-JSON response:",
        response.status,
        text.substring(0, 200),
      );
      return {
        ok: false,
        error: `Server returned ${response.status}: ${text.substring(0, 100)}`,
      };
    }

    const data = await response.json();
    console.log("[updateReservationStatus] Response data:", data);

    // Check if response indicates success
    if (!response.ok) {
      console.error(
        "[updateReservationStatus] HTTP error",
        response.status,
        "data:",
        data,
      );
      return {
        ok: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      ok: data.ok,
      reservation: data.reservation,
      error: data.error,
    };
  } catch (error: any) {
    console.error("[updateReservationStatus] Exception:", error);
    return {
      ok: false,
      error: error?.message || "Network error",
    };
  }
}
