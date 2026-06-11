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

  it("rejects page updates that would drop existing macros", async () => {
    const currentStorage =
      '<p>Intro</p><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro>';
    const http = {
      get: vi.fn().mockResolvedValue({
        id: "123",
        title: "Page",
        type: "page",
        version: { number: 7 },
        body: { storage: { value: currentStorage, representation: "storage" } }
      }),
      put: vi.fn()
    };
    const client = new ConfluenceClient(http as never, "https://confluence.example.com");

    await expect(client.updatePage({ pageId: "123", storageBody: "<p>Intro</p>" })).rejects.toThrow(
      "Confluence update would remove or rewrite an existing macro"
    );

    expect(http.put).not.toHaveBeenCalled();
  });
});

describe("buildConfluenceTools", () => {
  it("exposes Confluence read helpers from the approved tool surface", async () => {
    const confluence = {
      getPageChildren: vi.fn().mockResolvedValue({ results: [] }),
      getSpace: vi.fn().mockResolvedValue({ key: "DOC" }),
      getAttachments: vi.fn().mockResolvedValue({ results: [] })
    };
    const tools = buildConfluenceTools(confluence as never);

    await expect(tools.confluence_get_page_children.handler({ pageId: "123" })).resolves.toEqual({ results: [] });
    await expect(tools.confluence_get_space.handler({ spaceKey: "DOC" })).resolves.toEqual({ key: "DOC" });
    await expect(tools.confluence_get_attachments.handler({ pageId: "123" })).resolves.toEqual({ results: [] });

    expect(confluence.getPageChildren).toHaveBeenCalledWith("123");
    expect(confluence.getSpace).toHaveBeenCalledWith("DOC");
    expect(confluence.getAttachments).toHaveBeenCalledWith("123");
  });

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
