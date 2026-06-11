import { describe, expect, it, vi } from "vitest";
import { JiraClient } from "../src/atlassian/jira-client.js";
import { buildJiraTools } from "../src/tools/jira.js";

describe("JiraClient", () => {
  it("fetches an issue with useful expansions", async () => {
    const http = { get: vi.fn().mockResolvedValue({ key: "ABC-1" }) };
    const client = new JiraClient(http as never, "https://jira.example.com");

    await expect(client.getIssue("ABC-1")).resolves.toEqual({ key: "ABC-1" });
    expect(http.get).toHaveBeenCalledWith("/rest/api/2/issue/ABC-1", {
      expand: "renderedFields,names,schema,transitions"
    });
  });
});

describe("buildJiraTools", () => {
  it("dry-runs comments without calling Jira", async () => {
    const jira = { addComment: vi.fn() };
    const tools = buildJiraTools(jira as never);
    const result = await tools.jira_add_comment.handler({
      issueKey: "ABC-1",
      body: "Ready for review",
      dryRun: true
    });

    expect(jira.addComment).not.toHaveBeenCalled();
    expect(result.changed).toBe(false);
    expect(result.audit.summary).toContain("Would add comment");
  });
});
