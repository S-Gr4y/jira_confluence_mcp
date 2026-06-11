import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape, ZodTypeAny } from "zod";
import type { ToolDefinition } from "./jira.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isZodSchemaLike(value: unknown): value is ZodTypeAny {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.parse === "function" ||
    typeof value.safeParse === "function" ||
    "_def" in value ||
    "_zod" in value
  );
}

function toMcpInputSchema(schema: unknown): ZodRawShape | ZodTypeAny {
  if (isZodSchemaLike(schema)) {
    return schema;
  }

  if (isRecord(schema)) {
    const values = Object.values(schema);
    if (values.length > 0 && values.every(isZodSchemaLike)) {
      return schema as ZodRawShape;
    }
  }

  return {};
}

export function registerTools(server: McpServer, tools: Record<string, ToolDefinition>): void {
  for (const [name, tool] of Object.entries(tools)) {
    server.registerTool(
      name,
      {
        description: tool.description,
        inputSchema: toMcpInputSchema(tool.inputSchema)
      },
      async (input: unknown) => ({
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(await tool.handler(input), null, 2)
          }
        ]
      })
    );
  }
}
