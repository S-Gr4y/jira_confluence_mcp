import type { ConfluenceClient } from "../atlassian/confluence-client.js";
import { listMacros, validateStorage } from "../atlassian/confluence-storage.js";
import {
  confluenceAddPageCommentSchema,
  confluenceCreatePageSchema,
  confluenceGetPageSchema,
  confluenceSearchPagesSchema,
  confluenceUpdatePageSchema
} from "../schemas/confluence.js";
import type { WriteResult } from "../schemas/shared.js";
import type { ToolDefinition } from "./jira.js";

export function buildConfluenceTools(confluence: ConfluenceClient): Record<string, ToolDefinition> {
  return {
    confluence_get_page: {
      description: "Get a Confluence page, using storage format by default.",
      inputSchema: confluenceGetPageSchema,
      handler: async (input) => {
        const parsed = confluenceGetPageSchema.parse(input);
        return confluence.getPage(parsed.pageId, parsed.includeRendered);
      }
    },
    confluence_search_pages: {
      description: "Search Confluence pages with CQL.",
      inputSchema: confluenceSearchPagesSchema,
      handler: async (input) => confluence.searchPages(confluenceSearchPagesSchema.parse(input))
    },
    confluence_list_page_macros: {
      description: "List macros from a Confluence page storage body.",
      inputSchema: confluenceUpdatePageSchema.pick({ storageBody: true }),
      handler: async (input) => listMacros(confluenceUpdatePageSchema.pick({ storageBody: true }).parse(input).storageBody)
    },
    confluence_create_page: {
      description: "Create a Confluence page using storage format. Supports dryRun.",
      inputSchema: confluenceCreatePageSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = confluenceCreatePageSchema.parse(input);
        validateStorage(parsed.storageBody);
        const target = { url: confluence.pageUrl("new") };
        if (parsed.dryRun) {
          return { changed: false, target, audit: { summary: `Would create page '${parsed.title}' in ${parsed.spaceKey}` } };
        }
        const created = (await confluence.createPage(parsed)) as { id?: string };
        return {
          changed: true,
          target: { id: created.id, url: confluence.pageUrl(created.id ?? "unknown") },
          audit: { summary: `Created page '${parsed.title}' in ${parsed.spaceKey}` }
        };
      }
    },
    confluence_update_page: {
      description:
        "Update a Confluence page using storage format. Existing macros must be preserved by the caller-provided storage body. Supports dryRun.",
      inputSchema: confluenceUpdatePageSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = confluenceUpdatePageSchema.parse(input);
        validateStorage(parsed.storageBody);
        const target = { id: parsed.pageId, url: confluence.pageUrl(parsed.pageId) };
        if (parsed.dryRun) {
          return { changed: false, target, audit: { summary: `Would update page ${parsed.pageId}` } };
        }
        await confluence.updatePage(parsed);
        return { changed: true, target, audit: { summary: `Updated page ${parsed.pageId}` } };
      }
    },
    confluence_add_page_comment: {
      description: "Add a storage-format comment to a Confluence page. Supports dryRun.",
      inputSchema: confluenceAddPageCommentSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = confluenceAddPageCommentSchema.parse(input);
        validateStorage(parsed.storageBody);
        const target = { id: parsed.pageId, url: confluence.pageUrl(parsed.pageId) };
        if (parsed.dryRun) {
          return { changed: false, target, audit: { summary: `Would add comment to page ${parsed.pageId}` } };
        }
        await confluence.addPageComment(parsed.pageId, parsed.storageBody);
        return { changed: true, target, audit: { summary: `Added comment to page ${parsed.pageId}` } };
      }
    }
  };
}
