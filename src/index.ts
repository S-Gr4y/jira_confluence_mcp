#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConfluenceClient } from "./atlassian/confluence-client.js";
import { AtlassianHttpClient } from "./atlassian/http-client.js";
import { JiraClient } from "./atlassian/jira-client.js";
import { loadConfig } from "./config.js";
import { buildConfluenceTools } from "./tools/confluence.js";
import { buildJiraTools } from "./tools/jira.js";
import { registerTools } from "./tools/registry.js";
import { buildSharedTools } from "./tools/shared.js";

export async function main(): Promise<void> {
  const config = loadConfig();
  const server = new McpServer({
    name: "atlassian-data-center",
    version: "0.1.0"
  });

  const jira = config.jiraBaseUrl
    ? new JiraClient(
      new AtlassianHttpClient({
        baseUrl: config.jiraBaseUrl,
        pat: config.pat,
        basicAuthUsername: config.basicAuthUsername,
        basicAuthToken: config.basicAuthToken
      }),
      config.jiraBaseUrl
    )
    : undefined;

  const confluence = config.confluenceBaseUrl
    ? new ConfluenceClient(
      new AtlassianHttpClient({
        baseUrl: config.confluenceBaseUrl,
        pat: config.pat,
        basicAuthUsername: config.basicAuthUsername,
        basicAuthToken: config.basicAuthToken
      }),
      config.confluenceBaseUrl
    )
    : undefined;

  registerTools(server, buildSharedTools({ jira, confluence }));
  if (jira) {
    registerTools(server, buildJiraTools(jira));
  }
  if (confluence) {
    registerTools(server, buildConfluenceTools(confluence));
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function isCliEntrypoint(): boolean {
  if (!process.argv[1]) {
    return false;
  }

  try {
    return (
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isCliEntrypoint()) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Fatal MCP server error: ${message}`);
    process.exit(1);
  });
}
