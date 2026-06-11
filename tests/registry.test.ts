import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { jiraAddCommentSchema } from "../src/schemas/jira.js";
import { registerTools } from "../src/tools/registry.js";

describe("registerTools", () => {
  it("preserves strict Zod object schemas for SDK validation", () => {
    const handler = vi.fn();
    const server = { registerTool: vi.fn() };

    registerTools(server as never, {
      jira_add_comment: {
        description: "Add a comment.",
        inputSchema: jiraAddCommentSchema,
        handler
      }
    });

    expect(server.registerTool).toHaveBeenCalledWith(
      "jira_add_comment",
      {
        description: "Add a comment.",
        inputSchema: jiraAddCommentSchema
      },
      expect.any(Function)
    );

    const [, config] = server.registerTool.mock.calls[0];
    expect(() =>
      config.inputSchema.parse({
        issueKey: "ABC-1",
        body: "Ready for review",
        dry_run: true
      })
    ).toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes raw Zod shapes through as MCP input schemas", () => {
    const issueKey = z.string();
    const rawShape = { issueKey };
    const server = { registerTool: vi.fn() };

    registerTools(server as never, {
      jira_get_issue: {
        description: "Get an issue.",
        inputSchema: rawShape,
        handler: async () => ({ key: "ABC-1" })
      }
    });

    expect(server.registerTool).toHaveBeenCalledWith(
      "jira_get_issue",
      {
        description: "Get an issue.",
        inputSchema: rawShape
      },
      expect.any(Function)
    );
  });

  it("returns handler results as formatted JSON text content", async () => {
    const server = { registerTool: vi.fn() };

    registerTools(server as never, {
      atlassian_whoami: {
        description: "Return the current user.",
        inputSchema: {},
        handler: async () => ({ jira: { name: "qa" } })
      }
    });

    const [, , callback] = server.registerTool.mock.calls[0];
    await expect(callback({})).resolves.toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({ jira: { name: "qa" } }, null, 2)
        }
      ]
    });
  });
});
