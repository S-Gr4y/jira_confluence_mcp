import type { AtlassianHttpClient } from "./http-client.js";

export class JiraClient {
  constructor(
    private readonly http: Pick<AtlassianHttpClient, "get" | "post" | "put">,
    private readonly baseUrl: string
  ) {}

  issueUrl(issueKey: string): string {
    return `${this.baseUrl}/browse/${issueKey}`;
  }

  getMyself(): Promise<unknown> {
    return this.http.get("/rest/api/2/myself");
  }

  getServerInfo(): Promise<unknown> {
    return this.http.get("/rest/api/2/serverInfo");
  }

  getIssue(issueKey: string): Promise<unknown> {
    return this.http.get(`/rest/api/2/issue/${encodeURIComponent(issueKey)}`, {
      expand: "renderedFields,names,schema,transitions"
    });
  }

  searchIssues(input: { jql: string; startAt: number; maxResults: number }): Promise<unknown> {
    return this.http.post("/rest/api/2/search", input);
  }

  getProject(projectKey: string): Promise<unknown> {
    return this.http.get(`/rest/api/2/project/${encodeURIComponent(projectKey)}`);
  }

  getTransitions(issueKey: string): Promise<unknown> {
    return this.http.get(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions`);
  }

  addComment(issueKey: string, body: string): Promise<unknown> {
    return this.http.post(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`, { body });
  }

  transitionIssue(issueKey: string, transitionId: string, comment?: string): Promise<unknown> {
    return this.http.post(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions`, {
      transition: { id: transitionId },
      ...(comment ? { update: { comment: [{ add: { body: comment } }] } } : {})
    });
  }

  updateIssueFields(issueKey: string, fields: Record<string, unknown>): Promise<unknown> {
    return this.http.put(`/rest/api/2/issue/${encodeURIComponent(issueKey)}`, { fields });
  }
}
