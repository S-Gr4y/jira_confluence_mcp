import type { AtlassianHttpClient } from "./http-client.js";

interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  version: { number: number };
  body?: { storage?: { value: string; representation: "storage" } };
}

export class ConfluenceClient {
  constructor(
    private readonly http: Pick<AtlassianHttpClient, "get" | "post" | "put">,
    private readonly baseUrl: string
  ) {}

  pageUrl(pageId: string): string {
    return `${this.baseUrl}/pages/viewpage.action?pageId=${encodeURIComponent(pageId)}`;
  }

  getMyself(): Promise<unknown> {
    return this.http.get("/rest/api/user/current");
  }

  getServerInfo(): Promise<unknown> {
    return this.http.get("/rest/api/settings/systemInfo");
  }

  getPage(pageId: string, includeRendered = false): Promise<unknown> {
    return this.http.get(`/rest/api/content/${encodeURIComponent(pageId)}`, {
      expand: includeRendered ? "body.storage,body.view,version,space,ancestors" : "body.storage,version,space,ancestors"
    });
  }

  searchPages(input: { cql: string; start: number; limit: number }): Promise<unknown> {
    return this.http.get("/rest/api/content/search", input);
  }

  getPageChildren(pageId: string): Promise<unknown> {
    return this.http.get(`/rest/api/content/${encodeURIComponent(pageId)}/child/page`);
  }

  getSpace(spaceKey: string): Promise<unknown> {
    return this.http.get(`/rest/api/space/${encodeURIComponent(spaceKey)}`);
  }

  getAttachments(pageId: string): Promise<unknown> {
    return this.http.get(`/rest/api/content/${encodeURIComponent(pageId)}/child/attachment`);
  }

  createPage(input: {
    spaceKey: string;
    title: string;
    parentPageId?: string;
    storageBody: string;
  }): Promise<unknown> {
    return this.http.post("/rest/api/content", {
      type: "page",
      title: input.title,
      space: { key: input.spaceKey },
      ...(input.parentPageId ? { ancestors: [{ id: input.parentPageId }] } : {}),
      body: {
        storage: {
          value: input.storageBody,
          representation: "storage"
        }
      }
    });
  }

  async updatePage(input: { pageId: string; title?: string; storageBody: string }): Promise<unknown> {
    const current = (await this.getPage(input.pageId)) as ConfluencePage;
    return this.http.put(`/rest/api/content/${encodeURIComponent(input.pageId)}`, {
      id: current.id,
      type: current.type ?? "page",
      title: input.title ?? current.title,
      version: { number: current.version.number + 1 },
      body: {
        storage: {
          value: input.storageBody,
          representation: "storage"
        }
      }
    });
  }

  addPageComment(pageId: string, storageBody: string): Promise<unknown> {
    return this.http.post("/rest/api/content", {
      type: "comment",
      container: { id: pageId, type: "page" },
      body: {
        storage: {
          value: storageBody,
          representation: "storage"
        }
      }
    });
  }
}
