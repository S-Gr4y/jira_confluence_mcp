import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { registerTools } from "../src/tools/registry.js";

describe("registerTools", () => {
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
});
