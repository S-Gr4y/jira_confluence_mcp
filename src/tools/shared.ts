import type { ConfluenceClient } from "../atlassian/confluence-client.js";
import type { JiraClient } from "../atlassian/jira-client.js";
import type { ToolDefinition } from "./jira.js";

export function buildSharedTools(input: {
  jira?: JiraClient;
  confluence?: ConfluenceClient;
}): Record<string, ToolDefinition> {
  return {
    atlassian_validate_connection: {
      description: "Validate configured Jira and Confluence connections.",
      inputSchema: {},
      handler: async () => {
        const result: Record<string, unknown> = {};
        if (input.jira) {
          result.jira = await input.jira.getMyself();
        }
        if (input.confluence) {
          result.confluence = await input.confluence.getMyself();
        }
        return result;
      }
    },
    atlassian_get_server_info: {
      description: "Get Jira and Confluence server information.",
      inputSchema: {},
      handler: async () => {
        const result: Record<string, unknown> = {};
        if (input.jira) {
          result.jira = await input.jira.getServerInfo();
        }
        if (input.confluence) {
          result.confluence = await input.confluence.getServerInfo();
        }
        return result;
      }
    },
    atlassian_whoami: {
      description: "Return the current authenticated user for configured products.",
      inputSchema: {},
      handler: async () => {
        const result: Record<string, unknown> = {};
        if (input.jira) {
          result.jira = await input.jira.getMyself();
        }
        if (input.confluence) {
          result.confluence = await input.confluence.getMyself();
        }
        return result;
      }
    }
  };
}
