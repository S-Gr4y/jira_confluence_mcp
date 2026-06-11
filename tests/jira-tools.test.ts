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

  it("dry-runs transitions without calling Jira", async () => {
    const jira = { transitionIssue: vi.fn() };
    const tools = buildJiraTools(jira as never);
    const result = await tools.jira_transition_issue.handler({
      issueKey: "ABC-1",
      transitionId: "31",
      dryRun: true
    });

    expect(jira.transitionIssue).not.toHaveBeenCalled();
    expect(result.changed).toBe(false);
    expect(result.audit.summary).toContain("Would transition");
  });

  it("dry-runs field updates without calling Jira", async () => {
    const jira = { updateIssueFields: vi.fn() };
    const tools = buildJiraTools(jira as never);
    const result = await tools.jira_update_issue_fields.handler({
      issueKey: "ABC-1",
      fields: { summary: "Updated summary" },
      dryRun: true
    });

    expect(jira.updateIssueFields).not.toHaveBeenCalled();
    expect(result.changed).toBe(false);
    expect(result.audit.summary).toContain("Would update fields");
  });

  it("rejects unknown top-level write keys without mutating", async () => {
    const jira = { addComment: vi.fn() };
    const tools = buildJiraTools(jira as never);

    await expect(
      tools.jira_add_comment.handler({
        issueKey: "ABC-1",
        body: "Ready for review",
        dry_run: true
      })
    ).rejects.toThrow();

    expect(jira.addComment).not.toHaveBeenCalled();
  });

  it("rejects empty field updates without mutating", async () => {
    const jira = { updateIssueFields: vi.fn() };
    const tools = buildJiraTools(jira as never);

    await expect(
      tools.jira_update_issue_fields.handler({
        issueKey: "ABC-1",
        fields: {}
      })
    ).rejects.toThrow("At least one allowlisted Jira field is required");

    expect(jira.updateIssueFields).not.toHaveBeenCalled();
  });

  it("updates one field and reports a change", async () => {
    const jira = { updateIssueFields: vi.fn().mockResolvedValue({}) };
    const tools = buildJiraTools(jira as never);
    const result = await tools.jira_update_issue_fields.handler({
      issueKey: "ABC-1",
      fields: { summary: "Updated summary" }
    });

    expect(jira.updateIssueFields).toHaveBeenCalledWith("ABC-1", { summary: "Updated summary" });
    expect(result.changed).toBe(true);
  });
});
