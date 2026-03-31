const TIMEOUT = 15_000;
const MAX_RETRIES = 3;

function getConfig() {
  const domain = process.env.AMOCRM_DOMAIN;
  const token = process.env.AMOCRM_ACCESS_TOKEN;
  if (!domain) throw new Error("Переменная окружения AMOCRM_DOMAIN не задана");
  if (!token) throw new Error("Переменная окружения AMOCRM_ACCESS_TOKEN не задана");
  return { domain, token };
}

function baseUrl(): string {
  const { domain } = getConfig();
  return `https://${domain}/api/v4`;
}

function headers(): Record<string, string> {
  const { token } = getConfig();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) return response;

      if (response.status === 204) return response;

      if (response.status >= 500 && attempt < retries) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.error(`[amocrm-mcp] ${response.status} от ${url}, повтор через ${delay}мс (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(`[amocrm-mcp] Таймаут ${url}, повтор (${attempt}/${retries})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Все попытки исчерпаны");
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const response = await fetchWithRetry(url.toString(), { method: "GET", headers: headers() });
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  return response.json() as Promise<T>;
}
