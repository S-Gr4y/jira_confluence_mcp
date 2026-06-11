#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export async function main(): Promise<void> {
  const server = new McpServer({
    name: "atlassian-data-center",
    version: "0.1.0"
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fatal MCP server error: ${message}`);
  process.exit(1);
});
