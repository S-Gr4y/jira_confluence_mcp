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

function toMcpShape(schema: unknown): ZodRawShape {
  if (isZodSchemaLike(schema) && "shape" in schema) {
    const shape = (schema as { shape: ZodRawShape | (() => ZodRawShape) }).shape;
    return typeof shape === "function" ? shape() : shape;
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
