import { describe, expect, it } from "vitest";
import { loadConfig, redactSensitive } from "../src/config.js";

describe("loadConfig", () => {
  it("requires at least one product base URL", () => {
    expect(() =>
      loadConfig({
        ATLASSIAN_PAT: "abc123"
      })
    ).toThrow("At least one of JIRA_BASE_URL or CONFLUENCE_BASE_URL is required");
  });

  it("requires a PAT", () => {
    expect(() =>
      loadConfig({
        JIRA_BASE_URL: "https://jira.example.com"
      })
    ).toThrow("ATLASSIAN_PAT, or both ATLASSIAN_USERNAME and ATLASSIAN_API_TOKEN, are required");
  });

  it("supports Basic auth via username and API token", () => {
    const config = loadConfig({
      JIRA_BASE_URL: "https://jira.example.com",
      ATLASSIAN_USERNAME: "alice@example.com",
      ATLASSIAN_API_TOKEN: "cloud-token"
    });

    expect(config.basicAuthUsername).toBe("alice@example.com");
    expect(config.basicAuthToken).toBe("cloud-token");
  });

  it("requires both ATLASSIAN_USERNAME and ATLASSIAN_API_TOKEN", () => {
    expect(() =>
      loadConfig({
        JIRA_BASE_URL: "https://jira.example.com",
        ATLASSIAN_USERNAME: "alice@example.com"
      })
    ).toThrow("ATLASSIAN_USERNAME and ATLASSIAN_API_TOKEN must both be set for Basic auth");
  });

  it("normalizes trailing slashes", () => {
    const config = loadConfig({
      JIRA_BASE_URL: "https://jira.example.com/",
      CONFLUENCE_BASE_URL: "https://confluence.example.com/",
      ATLASSIAN_PAT: "abc123"
    });

    expect(config.jiraBaseUrl).toBe("https://jira.example.com");
    expect(config.confluenceBaseUrl).toBe("https://confluence.example.com");
  });
});

describe("redactSensitive", () => {
  it("redacts bearer tokens and configured PAT values", () => {
    const redacted = redactSensitive(
      "Authorization: Bearer abc123 and token abc123",
      ["abc123"]
    );

    expect(redacted).toBe("Authorization: Bearer [REDACTED] and token [REDACTED]");
  });
});
