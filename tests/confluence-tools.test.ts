import { describe, expect, it, vi } from "vitest";
import { ConfluenceClient } from "../src/atlassian/confluence-client.js";
import { buildConfluenceTools } from "../src/tools/confluence.js";

describe("ConfluenceClient", () => {
  it("fetches pages with storage expansion by default", async () => {
    const http = { get: vi.fn().mockResolvedValue({ id: "123" }) };
    const client = new ConfluenceClient(http as never, "https://confluence.example.com");

    await expect(client.getPage("123")).resolves.toEqual({ id: "123" });
    expect(http.get).toHaveBeenCalledWith("/rest/api/content/123", {
      expand: "body.storage,version,space,ancestors"
    });
  });
});

describe("buildConfluenceTools", () => {
  it("dry-runs page creation without calling Confluence", async () => {
    const confluence = {
      pageUrl: vi.fn().mockReturnValue("https://confluence.example.com/pages/viewpage.action?pageId=new"),
      createPage: vi.fn()
    };
    const tools = buildConfluenceTools(confluence as never);
    const result = await tools.confluence_create_page.handler({
      spaceKey: "DOC",
      title: "Release Notes",
      storageBody: "<p>Hello</p>",
      dryRun: true
    });

    expect(confluence.createPage).not.toHaveBeenCalled();
    expect(result.changed).toBe(false);
    expect(result.audit.summary).toContain("Would create page");
  });

  it("rejects unknown top-level write keys without creating a page", async () => {
    const confluence = {
      pageUrl: vi.fn().mockReturnValue("https://confluence.example.com/pages/viewpage.action?pageId=new"),
      createPage: vi.fn()
    };
    const tools = buildConfluenceTools(confluence as never);

    await expect(
      tools.confluence_create_page.handler({
        spaceKey: "DOC",
        title: "Release Notes",
        storageBody: "<p>Hello</p>",
        dry_run: true
      })
    ).rejects.toThrow();

    expect(confluence.createPage).not.toHaveBeenCalled();
  });
});
