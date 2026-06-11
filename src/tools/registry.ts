import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape, ZodTypeAny } from "zod";
import type { ToolDefinition } from "./jira.js";

function toMcpShape(schema: unknown): ZodRawShape {
  if (schema && typeof schema === "object" && "shape" in schema) {
    const shape = (schema as { shape: ZodRawShape | (() => ZodRawShape) }).shape;
    return typeof shape === "function" ? shape() : shape;
  }

  return {};
}

export function registerTools(server: McpServer, tools: Record<string, ToolDefinition>): void {
  for (const [name, tool] of Object.entries(tools)) {
    server.registerTool(
      name,
      {
        description: tool.description,
        inputSchema: toMcpShape(tool.inputSchema as ZodTypeAny)
      },
      async (input) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(await tool.handler(input), null, 2)
          }
        ]
      })
    );
  }
}
