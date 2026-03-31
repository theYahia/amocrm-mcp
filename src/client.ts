const TIMEOUT = 15_000;
const MAX_RETRIES = 3;

interface TokenState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let tokenState: TokenState | null = null;

function getConfig() {
  const domain = process.env.AMOCRM_DOMAIN;
  if (!domain) throw new Error("Переменная окружения AMOCRM_DOMAIN не задана");

  const accessToken = process.env.AMOCRM_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Переменная окружения AMOCRM_ACCESS_TOKEN не задана");

  const refreshToken = process.env.AMOCRM_REFRESH_TOKEN ?? "";
  const clientId = process.env.AMOCRM_CLIENT_ID ?? "";
  const clientSecret = process.env.AMOCRM_CLIENT_SECRET ?? "";

  return { domain, accessToken, refreshToken, clientId, clientSecret };
}

function ensureTokenState(): TokenState {
  if (!tokenState) {
    const cfg = getConfig();
    tokenState = {
      accessToken: cfg.accessToken,
      refreshToken: cfg.refreshToken,
      expiresAt: 0,
    };
  }
  return tokenState;
}

export async function refreshAccessToken(): Promise<void> {
  const cfg = getConfig();
  if (!cfg.refreshToken || !cfg.clientId || !cfg.clientSecret) {
    throw new Error(
      "OAuth refresh невозможен: задайте AMOCRM_REFRESH_TOKEN, AMOCRM_CLIENT_ID, AMOCRM_CLIENT_SECRET",
    );
  }

  const url = `https://${cfg.domain}/oauth2/access_token`;
  const body = {
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "refresh_token",
    refresh_token: ensureTokenState().refreshToken,
    redirect_uri: `https://${cfg.domain}`,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth refresh failed ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  tokenState = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  process.env.AMOCRM_ACCESS_TOKEN = data.access_token;
  process.env.AMOCRM_REFRESH_TOKEN = data.refresh_token;

  console.error("[amocrm-mcp] OAuth token refreshed, expires in", data.expires_in, "s");
}

function baseUrl(): string {
  const { domain } = getConfig();
  return `https://${domain}/api/v4`;
}

function headers(): Record<string, string> {
  const ts = ensureTokenState();
  return {
    Authorization: `Bearer ${ts.accessToken}`,
    "Content-Type": "application/json",
  };
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (response.status === 401 && attempt === 1) {
        console.error("[amocrm-mcp] 401 — trying refresh token");
        await refreshAccessToken();
        const retryOpts = { ...options, headers: headers() };
        return fetchWithRetry(url, retryOpts, retries - 1);
      }

      if (response.ok || response.status === 204) return response;

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
        console.error(`[amocrm-mcp] Timeout ${url}, retry (${attempt}/${retries})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("All retries exhausted");
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const response = await fetchWithRetry(url.toString(), { method: "GET", headers: headers() });
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

export function _resetTokenState(): void {
  tokenState = null;
}
