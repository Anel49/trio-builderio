let cachedBase: string | null = null;
let lastResolveFailAt = 0;
const RESOLVE_COOLDOWN_MS = 15_000;
const DISABLE_NETWORK =
  String(
    (import.meta as any).env?.VITE_DISABLE_NETWORK ?? "true",
  ).toLowerCase() !== "false";

function cleanJoin(base: string, path: string) {
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr.filter(Boolean))) as T[];
}

async function tryFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 10000,
): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
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

  if (envBase) {
    const test = await tryFetch(
      cleanJoin(envBase, "ping"),
      { method: "GET" },
      2000,
    );
    if (test && test.ok) {
      cachedBase = envBase;
      return cachedBase;
    }
  }

  const isDev = Boolean((import.meta as any).env?.DEV);

  // In production, avoid probing random candidates (prevents noisy Failed to fetch logs)
  if (!isDev) {
    lastResolveFailAt = Date.now();
    return null;
  }

  const candidates = uniq<string>([
    "/.netlify/functions/api",
    "/api",
    origin ? `${origin}/.netlify/functions/api` : "",
    origin ? `${origin}/api` : "",
  ]);

  for (const base of candidates) {
    const pingUrl = cleanJoin(base, "ping");
    const res = await tryFetch(pingUrl, { method: "GET" }, 1500);
    if (res && res.ok) {
      cachedBase = base;
      return cachedBase;
    }
  }

  lastResolveFailAt = Date.now();
  return null;
}

export async function apiFetch(path: string, init?: RequestInit) {
  // Offline mode: never perform network calls
  if (DISABLE_NETWORK) {
    const p = String(path || "");
    if (/ping$/.test(p)) {
      return new Response(JSON.stringify({ ok: true, message: "offline" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (/listings$/.test(p)) {
      const { demoListings } = await import("@/lib/demo-listings");
      return new Response(
        JSON.stringify({ ok: true, listings: demoListings }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ ok: false, offline: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Absolute URL passthrough
  if (/^https?:\/\//i.test(path)) {
    const res = await tryFetch(path, init);
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

  if (base) {
    const url = cleanJoin(base, path);
    const res = await tryFetch(url, init);
    if (res) return res;
    // Invalidate base and try to resolve once more
    cachedBase = null;
    base = await resolveApiBase();
    if (base) {
      const retryUrl = cleanJoin(base, path);
      const retryRes = await tryFetch(retryUrl, init);
      if (retryRes) return retryRes;
    }
  }

  // Graceful fallback to avoid noisy unhandled errors in environments without a backend
  return new Response(
    JSON.stringify({
      ok: false,
      error: "API unreachable",
      hint: "Set VITE_API_BASE_URL to your API base (e.g. https://<your-site>.netlify.app/.netlify/functions/api) or deploy the backend.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}
