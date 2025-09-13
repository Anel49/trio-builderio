let cachedBase: string | null = null;

function cleanJoin(base: string, path: string) {
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const tried: string[] = [];
  const candidates = [
    (import.meta as any).env?.VITE_API_BASE_URL as string | undefined,
    "/api",
    "/.netlify/functions/api",
  ].filter(Boolean) as string[];

  if (cachedBase) {
    const url = cleanJoin(cachedBase, path);
    const res = await fetch(url, init);
    if (res.ok) return res;
    tried.push(cachedBase);
    cachedBase = null;
  }

  for (const base of candidates) {
    if (tried.includes(base)) continue;
    try {
      const url = cleanJoin(base, path);
      const res = await fetch(url, init);
      if (res.ok) {
        cachedBase = base;
        return res;
      }
    } catch {}
  }

  // Last attempt: relative path as-is
  const res = await fetch(path, init);
  if (res.ok) return res;
  throw new Error(`API request failed for ${path} (tried: ${[...tried, ...candidates].join(", ")})`);
}
