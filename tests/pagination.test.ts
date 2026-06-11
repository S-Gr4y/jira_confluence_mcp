import { describe, expect, it } from "vitest";
import { nextConfluenceStart, nextJiraStart } from "../src/atlassian/pagination.js";

describe("pagination", () => {
  it("computes the next Jira startAt value", () => {
    expect(nextJiraStart({ startAt: 0, maxResults: 50, total: 120, returned: 50 })).toBe(50);
    expect(nextJiraStart({ startAt: 100, maxResults: 50, total: 120, returned: 20 })).toBeUndefined();
  });

  it("computes the next Confluence start value", () => {
    expect(nextConfluenceStart({ start: 0, limit: 25, size: 25 })).toBe(25);
    expect(nextConfluenceStart({ start: 25, limit: 25, size: 10 })).toBeUndefined();
  });
});
