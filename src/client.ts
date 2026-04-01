const TIMEOUT = 15_000;
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY = 150; // ~7 req/sec = 143ms between requests

let lastRequestTime = 0;

interface Config {
  subdomain: string;
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

function getConfig(): Config {
  const subdomain = process.env.AMOCRM_SUBDOMAIN || process.env.AMOCRM_DOMAIN;
  const accessToken = process.env.AMOCRM_ACCESS_TOKEN;
  if (!subdomain) throw new Error("AMOCRM_SUBDOMAIN is not set");
  if (!accessToken) throw new Error("AMOCRM_ACCESS_TOKEN is not set");
  return {
    subdomain: subdomain.replace(/\.amocrm\.ru$/, ""),
    accessToken,
    refreshToken: process.env.AMOCRM_REFRESH_TOKEN,
    clientId: process.env.AMOCRM_CLIENT_ID,
    clientSecret: process.env.AMOCRM_CLIENT_SECRET,
  };
}

function baseUrl(): string {
  const { subdomain } = getConfig();
  return `https://${subdomain}.amocrm.ru/api/v4`;
}

function headers(): Record<string, string> {
  const { accessToken } = getConfig();
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function rateLimitWait(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY - elapsed));
  }
  lastRequestTime = Date.now();
}

async function refreshAccessToken(): Promise<boolean> {
  const config = getConfig();
  if (!config.refreshToken || !config.clientId || !config.clientSecret) {
    return false;
  }

  try {
    const response = await fetch(
      `https://${config.subdomain}.amocrm.ru/oauth2/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: "refresh_token",
          refresh_token: config.refreshToken,
          redirect_uri: `https://${config.subdomain}.amocrm.ru`,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        `[amocrm-mcp] Token refresh failed: ${response.status}`,
      );
      return false;
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    };
    process.env.AMOCRM_ACCESS_TOKEN = data.access_token;
    process.env.AMOCRM_REFRESH_TOKEN = data.refresh_token;
    console.error("[amocrm-mcp] Token refreshed successfully");
    return true;
  } catch (err) {
    console.error("[amocrm-mcp] Token refresh error:", err);
    return false;
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    await rateLimitWait();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok || response.status === 204) return response;

      // 401 → try refresh token once
      if (response.status === 401 && attempt === 1) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newHeaders = headers();
          if (options.headers && typeof options.headers === "object") {
            Object.assign(options.headers, newHeaders);
          } else {
            options.headers = newHeaders;
          }
          continue;
        }
      }

      // 429 → rate limited, back off
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
        console.error(
          `[amocrm-mcp] Rate limited, waiting ${delay}ms (${attempt}/${retries})`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // 5xx → retry with backoff
      if (response.status >= 500 && attempt < retries) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.error(
          `[amocrm-mcp] ${response.status} from ${url}, retry in ${delay}ms (${attempt}/${retries})`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(
          `[amocrm-mcp] Timeout ${url}, retry (${attempt}/${retries})`,
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error("All retries exhausted");
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") {
        url.searchParams.set(k, v);
      }
    }
  }
  const response = await fetchWithRetry(url.toString(), {
    method: "GET",
    headers: headers(),
  });
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const response = await fetchWithRetry(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}
