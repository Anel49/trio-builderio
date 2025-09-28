let cachedBase: string | null = null;
let lastResolveFailAt = 0;
const RESOLVE_COOLDOWN_MS = 15_000;
let offlineUntil = 0;
const TEMP_OFFLINE_MS = 60_000;
let lastPingOkAt = 0;
let lastPingCheckAt = 0;
const PING_TTL_MS = 15_000;
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

async function tryFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 12000,
): Promise<Response | null> {
  try {
    let settled = false;
    const timeout = new Promise<Response | null>((resolve) => {
      setTimeout(() => {
        if (!settled) resolve(null);
      }, timeoutMs);
    });
    const res = await Promise.race([
      fetch(url, init).then((r) => {
        settled = true;
        return r;
      }),
      timeout,
    ]);
    return (res as Response) || null;
  } catch {
    return null;
  }
}

async function pingBase(base: string): Promise<boolean> {
  const res = await tryFetch(cleanJoin(base, "ping"), { method: "GET" }, 800);
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

  if (envBase) {
    if (await pingBase(envBase)) {
      cachedBase = envBase;
      return cachedBase;
    }
  }

  const candidates = uniq<string>([
    // Prefer same-origin candidates first to avoid CORS/network blockers
    "/api",
    "/.netlify/functions/api",
    origin ? `${origin}/api` : "",
    origin ? `${origin}/.netlify/functions/api` : "",
  ]);

  for (const base of candidates) {
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

  const isDataEndpoint =
    /^(listings($|\/\d+(?:\/(?:reviews|reservations))?)|users(\?|$)|stripe\/create-payment-intent)/.test(
      p,
    );
  if (base) {
    // For data endpoints, ensure backend is responsive recently; otherwise avoid failing fetches
    if (isDataEndpoint) {
      const now = Date.now();
      if (now - lastPingOkAt > PING_TTL_MS && now - lastPingCheckAt > 1000) {
        lastPingCheckAt = now;
        const ok = await pingBase(base);
        if (ok) lastPingOkAt = Date.now();
        if (!ok) {
          lastResolveFailAt = Date.now();
          offlineUntil = Date.now() + TEMP_OFFLINE_MS;
          // fall through to stubs below without attempting the failing fetch
        } else {
          const url = cleanJoin(base, path);
          const res = await tryFetch(url, init, 15000);
          if (res) return res;
        }
      } else {
        const url = cleanJoin(base, path);
        const res = await tryFetch(url, init, 15000);
        if (res) return res;
      }
    } else {
      const url = cleanJoin(base, path);
      const res = await tryFetch(url, init, 8000);
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

  return new Response(
    JSON.stringify({
      ok: false,
      error: "API unreachable",
      hint: "Set VITE_API_BASE_URL to your API base (e.g. https://<your-site>.netlify.app/.netlify/functions/api) or deploy the backend.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}
