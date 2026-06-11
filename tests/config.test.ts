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
    ).toThrow("ATLASSIAN_PAT is required");
  });

  it("normalizes trailing slashes", () => {
    const config = loadConfig({
      JIRA_BASE_URL: "https://jira.example.com/",
      CONFLUENCE_BASE_URL: "https://confluence.example.com/",
      ATLASSIAN_PAT: "abc123",
      ATLASSIAN_TLS_REJECT_UNAUTHORIZED: "false"
    });

    expect(config.jiraBaseUrl).toBe("https://jira.example.com");
    expect(config.confluenceBaseUrl).toBe("https://confluence.example.com");
    expect(config.tlsRejectUnauthorized).toBe(false);
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
