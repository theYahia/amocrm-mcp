import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.AMOCRM_DOMAIN = "test.amocrm.ru";
process.env.AMOCRM_ACCESS_TOKEN = "test-access-token";
process.env.AMOCRM_REFRESH_TOKEN = "test-refresh-token";
process.env.AMOCRM_CLIENT_ID = "test-client-id";
process.env.AMOCRM_CLIENT_SECRET = "test-client-secret";

import { apiGet, apiPost, apiPatch, refreshAccessToken, _resetTokenState } from "../src/client.js";

describe("client", () => {
  beforeEach(() => {
    _resetTokenState();
    process.env.AMOCRM_DOMAIN = "test.amocrm.ru";
    process.env.AMOCRM_ACCESS_TOKEN = "test-access-token";
    process.env.AMOCRM_REFRESH_TOKEN = "test-refresh-token";
    process.env.AMOCRM_CLIENT_ID = "test-client-id";
    process.env.AMOCRM_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("apiGet sends GET with Bearer token", async () => {
    const mockResponse = { _embedded: { leads: [{ id: 1, name: "Test" }] } };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await apiGet("/leads", { page: "1" });
    expect(result).toEqual(mockResponse);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain("https://test.amocrm.ru/api/v4/leads");
    const hdrs = call[1]?.headers as Record<string, string>;
    expect(hdrs["Authorization"]).toBe("Bearer test-access-token");
  });

  it("apiPost sends POST with JSON body", async () => {
    const mockResponse = { _embedded: { leads: [{ id: 99 }] } };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const body = [{ name: "New Lead", price: 5000 }];
    const result = await apiPost("/leads", body);
    expect(result).toEqual(mockResponse);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBe(JSON.stringify(body));
  });

  it("apiPatch sends PATCH request", async () => {
    const mockResponse = { id: 1, name: "Updated" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await apiPatch("/leads/1", { name: "Updated" });
    expect(result).toEqual(mockResponse);
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe("PATCH");
  });

  it("handles 204 No Content gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    );
    const result = await apiGet("/leads");
    expect(result).toEqual({});
  });

  it("throws on non-retryable HTTP errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Bad Request", { status: 400 }),
    );
    await expect(apiGet("/leads")).rejects.toThrow("HTTP 400");
  });
});

describe("OAuth auto-refresh on 401", () => {
  beforeEach(() => {
    _resetTokenState();
    process.env.AMOCRM_DOMAIN = "test.amocrm.ru";
    process.env.AMOCRM_ACCESS_TOKEN = "expired-token";
    process.env.AMOCRM_REFRESH_TOKEN = "test-refresh-token";
    process.env.AMOCRM_CLIENT_ID = "test-client-id";
    process.env.AMOCRM_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshAccessToken calls /oauth2/access_token", async () => {
    const tokenResponse = {
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      expires_in: 86400,
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(tokenResponse), { status: 200 }),
    );

    await refreshAccessToken();

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("https://test.amocrm.ru/oauth2/access_token");
    expect(call[1]?.method).toBe("POST");

    const body = JSON.parse(call[1]?.body as string);
    expect(body.grant_type).toBe("refresh_token");
    expect(body.refresh_token).toBe("test-refresh-token");
    expect(body.client_id).toBe("test-client-id");
    expect(body.client_secret).toBe("test-client-secret");

    expect(process.env.AMOCRM_ACCESS_TOKEN).toBe("new-access-token");
    expect(process.env.AMOCRM_REFRESH_TOKEN).toBe("new-refresh-token");
  });

  it("auto-refreshes token on 401 and retries request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "fresh-token",
          refresh_token: "fresh-refresh",
          expires_in: 86400,
        }),
        { status: 200 },
      ),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ _embedded: { leads: [] } }), { status: 200 }),
    );

    const result = await apiGet("/leads");
    expect(result).toEqual({ _embedded: { leads: [] } });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const retryCall = fetchMock.mock.calls[2];
    expect((retryCall[1]?.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer fresh-token",
    );
  });

  it("throws when refresh credentials are missing", async () => {
    process.env.AMOCRM_REFRESH_TOKEN = "";
    process.env.AMOCRM_CLIENT_ID = "";
    _resetTokenState();
    await expect(refreshAccessToken()).rejects.toThrow("OAuth refresh");
  });
});
