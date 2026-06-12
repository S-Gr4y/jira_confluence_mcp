import { beforeEach, describe, expect, it, vi } from "vitest";
import { AtlassianError } from "../src/atlassian/errors.js";
import { AtlassianHttpClient } from "../src/atlassian/http-client.js";

describe("AtlassianHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds bearer auth and joins relative paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com",
      pat: "secret",
      fetchImpl: fetchMock
    });

    await client.get("rest/api/2/myself");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://jira.example.com/rest/api/2/myself",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer secret"
        })
      })
    );
  });

  it("adds basic auth when username and API token are provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com",
      basicAuthUsername: "alice@example.com",
      basicAuthToken: "cloud-token",
      fetchImpl: fetchMock
    });

    await client.get("rest/api/2/myself");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://jira.example.com/rest/api/2/myself",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: `Basic ${Buffer.from("alice@example.com:cloud-token").toString("base64")}`
        })
      })
    );
  });

  it("joins trailing slash base URLs with relative paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com/",
      pat: "secret",
      fetchImpl: fetchMock
    });

    await client.get("rest/api/2/myself");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://jira.example.com/rest/api/2/myself",
      expect.any(Object)
    );
  });

  it("preserves context paths when joining leading slash paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://host.example.com/jira/",
      pat: "secret",
      fetchImpl: fetchMock
    });

    await client.get("/rest/api/2/myself");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://host.example.com/jira/rest/api/2/myself",
      expect.any(Object)
    );
  });

  it("appends query params to joined URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://host.example.com/jira/",
      pat: "secret",
      fetchImpl: fetchMock
    });

    await client.get("rest/api/2/search", {
      jql: "project = TEST",
      maxResults: 50,
      validateQuery: false,
      skip: undefined
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://host.example.com/jira/rest/api/2/search?jql=project+%3D+TEST&maxResults=50&validateQuery=false",
      expect.any(Object)
    );
  });

  it("redacts token values from failed responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorMessages: ["bad token secret"] }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com",
      pat: "secret",
      fetchImpl: fetchMock
    });

    await expect(client.get("/rest/api/2/myself")).rejects.toThrow("[REDACTED]");
  });

  it("redacts token values from failed response details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorMessages: ["bad token secret"] }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com",
      pat: "secret",
      fetchImpl: fetchMock
    });

    try {
      await client.get("/rest/api/2/myself");
      expect.fail("Expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AtlassianError);
      expect(JSON.stringify((error as AtlassianError).details)).toContain("[REDACTED]");
      expect(JSON.stringify((error as AtlassianError).details)).not.toContain("secret");
    }
  });

  it("redacts basic auth tokens from failed response details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorMessages: ["bad token cloud-token"] }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com",
      basicAuthUsername: "alice@example.com",
      basicAuthToken: "cloud-token",
      fetchImpl: fetchMock
    });

    try {
      await client.get("/rest/api/2/myself");
      expect.fail("Expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AtlassianError);
      expect(JSON.stringify((error as AtlassianError).details)).toContain("[REDACTED]");
      expect(JSON.stringify((error as AtlassianError).details)).not.toContain("cloud-token");
    }
  });
});
