# Atlassian Data Center MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone TypeScript MCP server for Jira and Confluence Data Center/Server with PAT bearer authentication, safe-write tools, macro-safe Confluence handling, skills, and user setup documentation.

**Architecture:** The MCP server runs over stdio and exposes workflow-oriented tools backed by small Atlassian REST clients. Shared config, HTTP, pagination, error redaction, schema validation, and Confluence storage parsing are isolated in focused modules. Codex skills live beside the server but the server remains a normal reusable MCP package.

**Tech Stack:** Node.js 20+, TypeScript, `@modelcontextprotocol/sdk`, Zod, Vitest, Undici/fetch, `fast-xml-parser`, npm package scripts.

---

## File Structure

Create or modify these files:

- `package.json`: npm metadata, bin entry, dependencies, scripts.
- `tsconfig.json`: TypeScript compiler config.
- `vitest.config.ts`: test runner config.
- `.gitignore`: ignore dependencies, build output, coverage, and local secret files.
- `.env.example`: placeholder-only configuration sample.
- `src/index.ts`: MCP stdio entrypoint and tool registration.
- `src/config.ts`: environment parsing and validation.
- `src/atlassian/http-client.ts`: authenticated REST wrapper, URL joining, response handling, redaction.
- `src/atlassian/errors.ts`: normalized Atlassian/MCP error helpers.
- `src/atlassian/pagination.ts`: Jira and Confluence pagination helpers.
- `src/atlassian/jira-client.ts`: Jira REST client.
- `src/atlassian/confluence-client.ts`: Confluence REST client.
- `src/atlassian/confluence-storage.ts`: macro-aware storage XHTML parsing and preservation helpers.
- `src/schemas/shared.ts`: shared schemas and result types.
- `src/schemas/jira.ts`: Jira tool input schemas.
- `src/schemas/confluence.ts`: Confluence tool input schemas.
- `src/tools/shared.ts`: shared MCP tools.
- `src/tools/jira.ts`: Jira MCP tools.
- `src/tools/confluence.ts`: Confluence MCP tools.
- `src/tools/registry.ts`: tool registration helper.
- `tests/config.test.ts`: config tests.
- `tests/http-client.test.ts`: HTTP/redaction tests.
- `tests/pagination.test.ts`: pagination tests.
- `tests/confluence-storage.test.ts`: macro preservation tests.
- `tests/jira-tools.test.ts`: mocked Jira tool/client tests.
- `tests/confluence-tools.test.ts`: mocked Confluence tool/client tests.
- `tests/fixtures/confluence-macro-page.xml`: storage-format fixture with structured, nested, rich-text, and plain-text macros.
- `skills/jira-investigate-issue/SKILL.md`: Jira investigation workflow.
- `skills/confluence-research-topic/SKILL.md`: Confluence research workflow.
- `skills/atlassian-safe-write/SKILL.md`: safe write approval workflow.
- `README.md`: quick start and MCP client setup.
- `docs/config.md`: environment variable reference.
- `docs/security.md`: PAT handling and security guidance.
- `docs/tools.md`: tool catalog and write safety notes.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/index.ts`

- [ ] **Step 1: Add package metadata and scripts**

Create `package.json`:

```json
{
  "name": "jira-confluence-atlassian-interactor",
  "version": "0.1.0",
  "description": "MCP server for Jira and Confluence Data Center/Server using PAT bearer authentication.",
  "type": "module",
  "bin": {
    "jira-confluence-atlassian-interactor": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "docs",
    "skills"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "start": "node dist/index.js"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.13.0",
    "fast-xml-parser": "^4.5.3",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@types/node": "^20.14.12",
    "typescript": "^5.8.3",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Add TypeScript configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Add Vitest configuration**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true
  }
});
```

- [ ] **Step 4: Add ignore rules and example env**

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
*.log
```

Create `.env.example`:

```env
JIRA_BASE_URL=https://jira.example.company.com
CONFLUENCE_BASE_URL=https://confluence.example.company.com
ATLASSIAN_PAT=replace-with-a-local-token
```

- [ ] **Step 5: Add a temporary MCP entrypoint**

Create `src/index.ts`:

```ts
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
```

- [ ] **Step 6: Install dependencies and verify scaffold**

Run:

```bash
npm install
npm run typecheck
npm test
```

Expected:

```text
typecheck passes
vitest exits successfully with no tests found or an empty test suite success message
```

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore .env.example src/index.ts
git commit -m "chore: scaffold TypeScript MCP package"
```

---

### Task 2: Configuration and Secret Redaction

**Files:**
- Create: `src/config.ts`
- Create: `src/atlassian/errors.ts`
- Create: `tests/config.test.ts`

- [ ] **Step 1: Write failing config tests**

Create `tests/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadConfig, redactSensitive } from "../src/config.js";

describe("loadConfig", () => {
  it("requires at least one product base URL", () => {
    expect(() =>
      loadConfig({
        ATLASSIAN_PAT: "abc123"
      })
    ).toThrow("At least one of JIRA_BASE_URL or CONFLUENCE_BASE_URL is required");
  });

  it("requires a PAT", () => {
    expect(() =>
      loadConfig({
        JIRA_BASE_URL: "https://jira.example.com"
      })
    ).toThrow("ATLASSIAN_PAT is required");
  });

  it("normalizes trailing slashes", () => {
    const config = loadConfig({
      JIRA_BASE_URL: "https://jira.example.com/",
      CONFLUENCE_BASE_URL: "https://confluence.example.com/",
      ATLASSIAN_PAT: "abc123"
    });

    expect(config.jiraBaseUrl).toBe("https://jira.example.com");
    expect(config.confluenceBaseUrl).toBe("https://confluence.example.com");
  });
});

describe("redactSensitive", () => {
  it("redacts bearer tokens and configured PAT values", () => {
    const redacted = redactSensitive(
      "Authorization: Bearer abc123 and token abc123",
      ["abc123"]
    );

    expect(redacted).toBe("Authorization: Bearer [REDACTED] and token [REDACTED]");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/config.test.ts
```

Expected:

```text
FAIL tests/config.test.ts
Cannot find module '../src/config.js'
```

- [ ] **Step 3: Implement config and redaction**

Create `src/config.ts`:

```ts
export interface AppConfig {
  jiraBaseUrl?: string;
  confluenceBaseUrl?: string;
  pat: string;
}

export type Env = Record<string, string | undefined>;

function normalizeBaseUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new URL(value);
  return parsed.toString().replace(/\/$/, "");
}

export function loadConfig(env: Env = process.env): AppConfig {
  const jiraBaseUrl = normalizeBaseUrl(env.JIRA_BASE_URL);
  const confluenceBaseUrl = normalizeBaseUrl(env.CONFLUENCE_BASE_URL);
  const pat = env.ATLASSIAN_PAT?.trim();

  if (!jiraBaseUrl && !confluenceBaseUrl) {
    throw new Error("At least one of JIRA_BASE_URL or CONFLUENCE_BASE_URL is required");
  }

  if (!pat) {
    throw new Error("ATLASSIAN_PAT is required");
  }

  return {
    jiraBaseUrl,
    confluenceBaseUrl,
    pat
  };
}

export function redactSensitive(input: string, secrets: string[] = []): string {
  let output = input.replace(/Bearer\s+[-._~+/A-Za-z0-9=]+/g, "Bearer [REDACTED]");

  for (const secret of secrets.filter(Boolean)) {
    output = output.split(secret).join("[REDACTED]");
  }

  return output;
}
```

Create `src/atlassian/errors.ts`:

```ts
import { redactSensitive } from "../config.js";

export class AtlassianError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "AtlassianError";
  }
}

export function sanitizeErrorMessage(message: string, secrets: string[] = []): string {
  return redactSensitive(message, secrets);
}
```

- [ ] **Step 4: Run config tests**

Run:

```bash
npm test -- tests/config.test.ts
```

Expected:

```text
PASS tests/config.test.ts
```

- [ ] **Step 5: Commit config**

```bash
git add src/config.ts src/atlassian/errors.ts tests/config.test.ts
git commit -m "feat: add config loading and redaction"
```

---

### Task 3: HTTP Client and Pagination

**Files:**
- Create: `src/atlassian/http-client.ts`
- Create: `src/atlassian/pagination.ts`
- Create: `tests/http-client.test.ts`
- Create: `tests/pagination.test.ts`

- [ ] **Step 1: Write failing HTTP client tests**

Create `tests/http-client.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AtlassianHttpClient } from "../src/atlassian/http-client.js";

describe("AtlassianHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds bearer auth and joins relative paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com",
      pat: "secret",
      fetchImpl: fetchMock
    });

    await client.get("/rest/api/2/myself");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://jira.example.com/rest/api/2/myself",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer secret"
        })
      })
    );
  });

  it("redacts token values from failed responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorMessages: ["bad token secret"] }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new AtlassianHttpClient({
      baseUrl: "https://jira.example.com",
      pat: "secret",
      fetchImpl: fetchMock
    });

    await expect(client.get("/rest/api/2/myself")).rejects.toThrow("[REDACTED]");
  });
});
```

- [ ] **Step 2: Write failing pagination tests**

Create `tests/pagination.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextConfluenceStart, nextJiraStart } from "../src/atlassian/pagination.js";

describe("pagination", () => {
  it("computes the next Jira startAt value", () => {
    expect(nextJiraStart({ startAt: 0, maxResults: 50, total: 120, returned: 50 })).toBe(50);
    expect(nextJiraStart({ startAt: 100, maxResults: 50, total: 120, returned: 20 })).toBeUndefined();
  });

  it("computes the next Confluence start value", () => {
    expect(nextConfluenceStart({ start: 0, limit: 25, size: 25 })).toBe(25);
    expect(nextConfluenceStart({ start: 25, limit: 25, size: 10 })).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test -- tests/http-client.test.ts tests/pagination.test.ts
```

Expected:

```text
FAIL tests/http-client.test.ts
FAIL tests/pagination.test.ts
```

- [ ] **Step 4: Implement HTTP client and pagination helpers**

Create `src/atlassian/http-client.ts`:

```ts
import { redactSensitive } from "../config.js";
import { AtlassianError } from "./errors.js";

export interface HttpClientOptions {
  baseUrl: string;
  pat: string;
  fetchImpl?: typeof fetch;
}

export class AtlassianHttpClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: HttpClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const response = await this.fetchImpl(url, {
      method,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.options.pat}`,
        ...(body === undefined ? {} : { "content-type": "application/json" })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await response.text();
    const parsed = text ? safeJsonParse(text) : undefined;

    if (!response.ok) {
      const message = redactSensitive(
        `Atlassian request failed with status ${response.status}: ${text}`,
        [this.options.pat]
      );
      throw new AtlassianError(message, response.status, parsed);
    }

    return parsed as T;
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.options.baseUrl}${normalizedPath}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
```

Create `src/atlassian/pagination.ts`:

```ts
export interface JiraPageState {
  startAt: number;
  maxResults: number;
  total: number;
  returned: number;
}

export interface ConfluencePageState {
  start: number;
  limit: number;
  size: number;
}

export function nextJiraStart(state: JiraPageState): number | undefined {
  const next = state.startAt + state.returned;
  return next < state.total ? next : undefined;
}

export function nextConfluenceStart(state: ConfluencePageState): number | undefined {
  return state.size >= state.limit ? state.start + state.size : undefined;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- tests/http-client.test.ts tests/pagination.test.ts
```

Expected:

```text
PASS tests/http-client.test.ts
PASS tests/pagination.test.ts
```

- [ ] **Step 6: Commit HTTP layer**

```bash
git add src/atlassian/http-client.ts src/atlassian/pagination.ts tests/http-client.test.ts tests/pagination.test.ts
git commit -m "feat: add Atlassian HTTP and pagination helpers"
```

---

### Task 4: Jira Client, Schemas, and Tools

**Files:**
- Create: `src/schemas/shared.ts`
- Create: `src/schemas/jira.ts`
- Create: `src/atlassian/jira-client.ts`
- Create: `src/tools/jira.ts`
- Create: `tests/jira-tools.test.ts`

- [ ] **Step 1: Write failing Jira tests**

Create `tests/jira-tools.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { JiraClient } from "../src/atlassian/jira-client.js";
import { buildJiraTools } from "../src/tools/jira.js";

describe("JiraClient", () => {
  it("fetches an issue with useful expansions", async () => {
    const http = { get: vi.fn().mockResolvedValue({ key: "ABC-1" }) };
    const client = new JiraClient(http as never, "https://jira.example.com");

    await expect(client.getIssue("ABC-1")).resolves.toEqual({ key: "ABC-1" });
    expect(http.get).toHaveBeenCalledWith("/rest/api/2/issue/ABC-1", {
      expand: "renderedFields,names,schema,transitions"
    });
  });
});

describe("buildJiraTools", () => {
  it("dry-runs comments without calling Jira", async () => {
    const jira = { addComment: vi.fn() };
    const tools = buildJiraTools(jira as never);
    const result = await tools.jira_add_comment.handler({
      issueKey: "ABC-1",
      body: "Ready for review",
      dryRun: true
    });

    expect(jira.addComment).not.toHaveBeenCalled();
    expect(result.changed).toBe(false);
    expect(result.audit.summary).toContain("Would add comment");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/jira-tools.test.ts
```

Expected:

```text
FAIL tests/jira-tools.test.ts
Cannot find module '../src/atlassian/jira-client.js'
```

- [ ] **Step 3: Add Jira schemas and client**

Create `src/schemas/shared.ts`:

```ts
import { z } from "zod";

export const dryRunSchema = z.object({
  dryRun: z.boolean().optional().default(false)
});

export interface AuditResult {
  summary: string;
}

export interface WriteResult {
  changed: boolean;
  target: {
    id?: string;
    key?: string;
    url: string;
  };
  audit: AuditResult;
}
```

Create `src/schemas/jira.ts`:

```ts
import { z } from "zod";

export const jiraIssueKeySchema = z.string().regex(/^[A-Z][A-Z0-9]+-\d+$/);

export const jiraGetIssueSchema = z.object({
  issueKey: jiraIssueKeySchema
});

export const jiraSearchIssuesSchema = z.object({
  jql: z.string().min(1),
  maxResults: z.number().int().min(1).max(100).default(50),
  startAt: z.number().int().min(0).default(0)
});

export const jiraAddCommentSchema = z.object({
  issueKey: jiraIssueKeySchema,
  body: z.string().min(1),
  dryRun: z.boolean().optional().default(false)
});

export const jiraTransitionIssueSchema = z.object({
  issueKey: jiraIssueKeySchema,
  transitionId: z.string().min(1),
  comment: z.string().optional(),
  dryRun: z.boolean().optional().default(false)
});

export const jiraUpdateIssueFieldsSchema = z.object({
  issueKey: jiraIssueKeySchema,
  fields: z
    .object({
      summary: z.string().min(1).optional(),
      description: z.string().optional(),
      labels: z.array(z.string()).optional(),
      assignee: z.object({ name: z.string().min(1) }).optional(),
      priority: z.object({ name: z.string().min(1) }).optional(),
      components: z.array(z.object({ name: z.string().min(1) })).optional(),
      fixVersions: z.array(z.object({ name: z.string().min(1) })).optional()
    })
    .strict(),
  dryRun: z.boolean().optional().default(false)
});
```

Create `src/atlassian/jira-client.ts`:

```ts
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
```

- [ ] **Step 4: Add Jira tool handlers**

Create `src/tools/jira.ts`:

```ts
import type { JiraClient } from "../atlassian/jira-client.js";
import {
  jiraAddCommentSchema,
  jiraGetIssueSchema,
  jiraSearchIssuesSchema,
  jiraTransitionIssueSchema,
  jiraUpdateIssueFieldsSchema
} from "../schemas/jira.js";
import type { WriteResult } from "../schemas/shared.js";

export interface ToolDefinition {
  description: string;
  inputSchema: unknown;
  handler(input: unknown): Promise<unknown>;
}

export function buildJiraTools(jira: JiraClient): Record<string, ToolDefinition> {
  return {
    jira_get_issue: {
      description: "Get a Jira issue by key.",
      inputSchema: jiraGetIssueSchema,
      handler: async (input) => jira.getIssue(jiraGetIssueSchema.parse(input).issueKey)
    },
    jira_search_issues: {
      description: "Search Jira issues with JQL.",
      inputSchema: jiraSearchIssuesSchema,
      handler: async (input) => jira.searchIssues(jiraSearchIssuesSchema.parse(input))
    },
    jira_add_comment: {
      description: "Add a comment to a Jira issue. Supports dryRun.",
      inputSchema: jiraAddCommentSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = jiraAddCommentSchema.parse(input);
        const target = { key: parsed.issueKey, url: jira.issueUrl(parsed.issueKey) };

        if (parsed.dryRun) {
          return {
            changed: false,
            target,
            audit: { summary: `Would add comment to ${parsed.issueKey}` }
          };
        }

        await jira.addComment(parsed.issueKey, parsed.body);
        return {
          changed: true,
          target,
          audit: { summary: `Added comment to ${parsed.issueKey}` }
        };
      }
    },
    jira_transition_issue: {
      description: "Transition a Jira issue using an exact transition id. Supports dryRun.",
      inputSchema: jiraTransitionIssueSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = jiraTransitionIssueSchema.parse(input);
        const target = { key: parsed.issueKey, url: jira.issueUrl(parsed.issueKey) };
        if (parsed.dryRun) {
          return { changed: false, target, audit: { summary: `Would transition ${parsed.issueKey}` } };
        }
        await jira.transitionIssue(parsed.issueKey, parsed.transitionId, parsed.comment);
        return { changed: true, target, audit: { summary: `Transitioned ${parsed.issueKey}` } };
      }
    },
    jira_update_issue_fields: {
      description: "Update allowlisted Jira issue fields. Supports dryRun.",
      inputSchema: jiraUpdateIssueFieldsSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = jiraUpdateIssueFieldsSchema.parse(input);
        const target = { key: parsed.issueKey, url: jira.issueUrl(parsed.issueKey) };
        if (parsed.dryRun) {
          return { changed: false, target, audit: { summary: `Would update fields on ${parsed.issueKey}` } };
        }
        await jira.updateIssueFields(parsed.issueKey, parsed.fields);
        return { changed: true, target, audit: { summary: `Updated fields on ${parsed.issueKey}` } };
      }
    }
  };
}
```

- [ ] **Step 5: Run Jira tests**

Run:

```bash
npm test -- tests/jira-tools.test.ts
```

Expected:

```text
PASS tests/jira-tools.test.ts
```

- [ ] **Step 6: Commit Jira layer**

```bash
git add src/schemas/shared.ts src/schemas/jira.ts src/atlassian/jira-client.ts src/tools/jira.ts tests/jira-tools.test.ts
git commit -m "feat: add Jira client and safe-write tools"
```

---

### Task 5: Confluence Storage Macro Handling

**Files:**
- Create: `src/atlassian/confluence-storage.ts`
- Create: `tests/confluence-storage.test.ts`
- Create: `tests/fixtures/confluence-macro-page.xml`

- [ ] **Step 1: Add macro fixture**

Create `tests/fixtures/confluence-macro-page.xml`:

```xml
<p>Intro</p>
<ac:structured-macro ac:name="expand">
  <ac:parameter ac:name="title">Details</ac:parameter>
  <ac:rich-text-body>
    <p>Nested text</p>
    <ac:structured-macro ac:name="code">
      <ac:parameter ac:name="language">typescript</ac:parameter>
      <ac:plain-text-body><![CDATA[const value = "<keep>";]]></ac:plain-text-body>
    </ac:structured-macro>
  </ac:rich-text-body>
</ac:structured-macro>
<p>Outro</p>
```

- [ ] **Step 2: Write failing storage tests**

Create `tests/confluence-storage.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  listMacros,
  replaceParagraphTextPreservingMacros,
  validateStorage
} from "../src/atlassian/confluence-storage.js";

const fixture = readFileSync("tests/fixtures/confluence-macro-page.xml", "utf8");

describe("Confluence storage macro handling", () => {
  it("lists structured macros including nested macros", () => {
    expect(listMacros(fixture)).toEqual([
      {
        name: "expand",
        parameters: { title: "Details" },
        bodyType: "rich-text"
      },
      {
        name: "code",
        parameters: { language: "typescript" },
        bodyType: "plain-text"
      }
    ]);
  });

  it("preserves macro bodies when editing non-macro paragraph text", () => {
    const updated = replaceParagraphTextPreservingMacros(fixture, "Intro", "Updated intro");

    expect(updated).toContain("Updated intro");
    expect(updated).toContain("ac:name=\"expand\"");
    expect(updated).toContain("ac:name=\"code\"");
    expect(updated).toContain("<![CDATA[const value = \"<keep>\";]]>");
  });

  it("fails closed on malformed storage", () => {
    expect(() => validateStorage("<ac:structured-macro>")).toThrow("Invalid Confluence storage XHTML");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
npm test -- tests/confluence-storage.test.ts
```

Expected:

```text
FAIL tests/confluence-storage.test.ts
Cannot find module '../src/atlassian/confluence-storage.js'
```

- [ ] **Step 4: Implement macro parser**

Create `src/atlassian/confluence-storage.ts`:

```ts
import { XMLParser, XMLValidator } from "fast-xml-parser";

export interface ConfluenceMacro {
  name: string;
  parameters: Record<string, string>;
  bodyType: "none" | "rich-text" | "plain-text";
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  preserveOrder: true,
  trimValues: false,
  cdataPropName: "#cdata"
});

export function validateStorage(storage: string): void {
  const wrapped = `<root xmlns:ac="http://atlassian.com/content">${storage}</root>`;
  const result = XMLValidator.validate(wrapped);
  if (result !== true) {
    throw new Error("Invalid Confluence storage XHTML");
  }
}

export function listMacros(storage: string): ConfluenceMacro[] {
  validateStorage(storage);
  const wrapped = `<root>${storage}</root>`;
  const document = parser.parse(wrapped) as unknown[];
  const macros: ConfluenceMacro[] = [];
  visitNodes(document, macros);
  return macros;
}

export function replaceParagraphTextPreservingMacros(
  storage: string,
  fromText: string,
  toText: string
): string {
  validateStorage(storage);
  const escapedFrom = escapeRegExp(fromText);
  return storage.replace(new RegExp(`(<p>)${escapedFrom}(</p>)`, "u"), `$1${escapeXmlText(toText)}$2`);
}

function visitNodes(nodes: unknown, macros: ConfluenceMacro[]): void {
  if (!Array.isArray(nodes)) {
    return;
  }

  for (const node of nodes) {
    if (!node || typeof node !== "object") {
      continue;
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "ac:structured-macro" && Array.isArray(value)) {
        macros.push(readMacro(value));
        visitNodes(value, macros);
      } else {
        visitNodes(value, macros);
      }
    }
  }
}

function readMacro(nodes: unknown[]): ConfluenceMacro {
  const attributes = nodes.find((node) => isAttributeNode(node)) as Record<string, unknown> | undefined;
  const name = String(attributes?.[":@"] && typeof attributes[":@"] === "object"
    ? (attributes[":@"] as Record<string, unknown>)["ac:name"] ?? "unknown"
    : "unknown");

  const parameters: Record<string, string> = {};
  let bodyType: ConfluenceMacro["bodyType"] = "none";

  for (const node of nodes) {
    if (!node || typeof node !== "object") {
      continue;
    }

    if ("ac:parameter" in node) {
      const parameterNodes = (node as { "ac:parameter": unknown[] })["ac:parameter"];
      const attrNode = parameterNodes.find((item) => isAttributeNode(item)) as Record<string, unknown> | undefined;
      const attr = attrNode?.[":@"] as Record<string, unknown> | undefined;
      const parameterName = String(attr?.["ac:name"] ?? "");
      const textNode = parameterNodes.find((item) => typeof item === "object" && item !== null && "#text" in item) as
        | { "#text": string }
        | undefined;
      if (parameterName) {
        parameters[parameterName] = textNode?.["#text"] ?? "";
      }
    }

    if ("ac:rich-text-body" in node) {
      bodyType = "rich-text";
    }

    if ("ac:plain-text-body" in node) {
      bodyType = "plain-text";
    }
  }

  return { name, parameters, bodyType };
}

function isAttributeNode(node: unknown): boolean {
  return Boolean(node && typeof node === "object" && ":@" in node);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

- [ ] **Step 5: Run storage tests**

Run:

```bash
npm test -- tests/confluence-storage.test.ts
```

Expected:

```text
PASS tests/confluence-storage.test.ts
```

- [ ] **Step 6: Commit macro handling**

```bash
git add src/atlassian/confluence-storage.ts tests/confluence-storage.test.ts tests/fixtures/confluence-macro-page.xml
git commit -m "feat: preserve Confluence storage macros"
```

---

### Task 6: Confluence Client, Schemas, and Tools

**Files:**
- Create: `src/schemas/confluence.ts`
- Create: `src/atlassian/confluence-client.ts`
- Create: `src/tools/confluence.ts`
- Create: `tests/confluence-tools.test.ts`

- [ ] **Step 1: Write failing Confluence tests**

Create `tests/confluence-tools.test.ts`:

```ts
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
    const confluence = { pageUrl: vi.fn().mockReturnValue("https://confluence.example.com/pages/viewpage.action?pageId=new") };
    const tools = buildConfluenceTools(confluence as never);
    const result = await tools.confluence_create_page.handler({
      spaceKey: "DOC",
      title: "Release Notes",
      storageBody: "<p>Hello</p>",
      dryRun: true
    });

    expect(result.changed).toBe(false);
    expect(result.audit.summary).toContain("Would create page");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/confluence-tools.test.ts
```

Expected:

```text
FAIL tests/confluence-tools.test.ts
Cannot find module '../src/atlassian/confluence-client.js'
```

- [ ] **Step 3: Add Confluence schemas and client**

Create `src/schemas/confluence.ts`:

```ts
import { z } from "zod";

export const confluencePageIdSchema = z.string().min(1);

export const confluenceGetPageSchema = z.object({
  pageId: confluencePageIdSchema,
  includeRendered: z.boolean().optional().default(false)
});

export const confluenceSearchPagesSchema = z.object({
  cql: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(25),
  start: z.number().int().min(0).default(0)
});

export const confluenceCreatePageSchema = z.object({
  spaceKey: z.string().min(1),
  title: z.string().min(1),
  parentPageId: z.string().optional(),
  storageBody: z.string().min(1),
  dryRun: z.boolean().optional().default(false)
});

export const confluenceUpdatePageSchema = z.object({
  pageId: confluencePageIdSchema,
  title: z.string().min(1).optional(),
  storageBody: z.string().min(1),
  dryRun: z.boolean().optional().default(false)
});

export const confluenceAddPageCommentSchema = z.object({
  pageId: confluencePageIdSchema,
  storageBody: z.string().min(1),
  dryRun: z.boolean().optional().default(false)
});
```

Create `src/atlassian/confluence-client.ts`:

```ts
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
```

- [ ] **Step 4: Add Confluence tool handlers**

Create `src/tools/confluence.ts`:

```ts
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
      description: "Update a Confluence page using storage format. Existing macros must be preserved by the caller-provided storage body. Supports dryRun.",
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
```

- [ ] **Step 5: Run Confluence tests**

Run:

```bash
npm test -- tests/confluence-tools.test.ts tests/confluence-storage.test.ts
```

Expected:

```text
PASS tests/confluence-tools.test.ts
PASS tests/confluence-storage.test.ts
```

- [ ] **Step 6: Commit Confluence layer**

```bash
git add src/schemas/confluence.ts src/atlassian/confluence-client.ts src/tools/confluence.ts tests/confluence-tools.test.ts
git commit -m "feat: add Confluence client and safe-write tools"
```

---

### Task 7: MCP Registration and Shared Tools

**Files:**
- Create: `src/tools/shared.ts`
- Create: `src/tools/registry.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add shared tool handlers**

Create `src/tools/shared.ts`:

```ts
import type { ConfluenceClient } from "../atlassian/confluence-client.js";
import type { JiraClient } from "../atlassian/jira-client.js";
import type { ToolDefinition } from "./jira.js";

export function buildSharedTools(input: {
  jira?: JiraClient;
  confluence?: ConfluenceClient;
}): Record<string, ToolDefinition> {
  return {
    atlassian_validate_connection: {
      description: "Validate configured Jira and Confluence connections.",
      inputSchema: {},
      handler: async () => {
        const result: Record<string, unknown> = {};
        if (input.jira) {
          result.jira = await input.jira.getMyself();
        }
        if (input.confluence) {
          result.confluence = await input.confluence.getMyself();
        }
        return result;
      }
    },
    atlassian_get_server_info: {
      description: "Get Jira and Confluence server information.",
      inputSchema: {},
      handler: async () => {
        const result: Record<string, unknown> = {};
        if (input.jira) {
          result.jira = await input.jira.getServerInfo();
        }
        if (input.confluence) {
          result.confluence = await input.confluence.getServerInfo();
        }
        return result;
      }
    },
    atlassian_whoami: {
      description: "Return the current authenticated user for configured products.",
      inputSchema: {},
      handler: async () => {
        const result: Record<string, unknown> = {};
        if (input.jira) {
          result.jira = await input.jira.getMyself();
        }
        if (input.confluence) {
          result.confluence = await input.confluence.getMyself();
        }
        return result;
      }
    }
  };
}
```

- [ ] **Step 2: Add MCP registry helper**

Create `src/tools/registry.ts`:

```ts
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
    server.tool(name, tool.description, toMcpShape(tool.inputSchema as ZodTypeAny), async (input) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await tool.handler(input), null, 2)
        }
      ]
    }));
  }
}
```

- [ ] **Step 3: Wire entrypoint**

Replace `src/index.ts` with:

```ts
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { AtlassianHttpClient } from "./atlassian/http-client.js";
import { JiraClient } from "./atlassian/jira-client.js";
import { ConfluenceClient } from "./atlassian/confluence-client.js";
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
    ? new JiraClient(new AtlassianHttpClient({ baseUrl: config.jiraBaseUrl, pat: config.pat }), config.jiraBaseUrl)
    : undefined;

  const confluence = config.confluenceBaseUrl
    ? new ConfluenceClient(
        new AtlassianHttpClient({ baseUrl: config.confluenceBaseUrl, pat: config.pat }),
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fatal MCP server error: ${message}`);
  process.exit(1);
});
```

- [ ] **Step 4: Typecheck**

Run:

```bash
npm run typecheck
```

Expected:

```text
typecheck passes
```

- [ ] **Step 5: Commit MCP registration**

```bash
git add src/index.ts src/tools/shared.ts src/tools/registry.ts
git commit -m "feat: register Atlassian MCP tools"
```

---

### Task 8: Skills and User Documentation

**Files:**
- Create: `README.md`
- Create: `docs/config.md`
- Create: `docs/security.md`
- Create: `docs/tools.md`
- Create: `skills/jira-investigate-issue/SKILL.md`
- Create: `skills/confluence-research-topic/SKILL.md`
- Create: `skills/atlassian-safe-write/SKILL.md`

- [ ] **Step 1: Add README**

Create `README.md`:

```md
# Jira Confluence Atlassian Interactor

Standalone MCP server for Jira and Confluence Data Center/Server using user-provided personal access tokens.

## Requirements

- Node.js 20 or newer
- Jira Data Center/Server and/or Confluence Data Center/Server
- A PAT created by the user in Atlassian

## MCP Client Configuration

Use stdio with `npx`:

```json
{
  "mcpServers": {
    "atlassian-dc": {
      "command": "npx",
      "args": ["-y", "jira-confluence-atlassian-interactor"],
      "env": {
        "JIRA_BASE_URL": "https://jira.example.company.com",
        "CONFLUENCE_BASE_URL": "https://confluence.example.company.com",
        "ATLASSIAN_PAT": "paste-your-token-here"
      }
    }
  }
}
```

Prefer storing the PAT in a local environment variable or secret manager when your MCP client supports it.

## Verify Setup

Run the `atlassian_validate_connection` tool from your MCP client. It should return authenticated Jira and/or Confluence user details.

## Documentation

- `docs/config.md`: environment variables
- `docs/security.md`: PAT handling
- `docs/tools.md`: tool list and write safety
```

- [ ] **Step 2: Add config docs**

Create `docs/config.md`:

```md
# Configuration

The server reads configuration from environment variables.

| Variable | Required | Description |
| --- | --- | --- |
| `JIRA_BASE_URL` | Required when using Jira | Base URL such as `https://jira.example.company.com` |
| `CONFLUENCE_BASE_URL` | Required when using Confluence | Base URL such as `https://confluence.example.company.com` |
| `ATLASSIAN_PAT` | Yes | Personal access token supplied by the user |

At least one product URL is required.
```

- [ ] **Step 3: Add security docs**

Create `docs/security.md`:

```md
# Security

Create the PAT from your own Jira or Confluence Data Center/Server user profile. Do not use shared admin accounts.

Keep the PAT local:

- Do not commit it to git.
- Do not paste it into Jira comments or Confluence pages.
- Do not include it in bug reports or logs.
- Rotate it if it is exposed.

The server sends the PAT as:

```text
Authorization: Bearer <PAT>
```

Errors and logs redact bearer tokens and configured PAT values.
```

- [ ] **Step 4: Add tool docs**

Create `docs/tools.md`:

```md
# Tools

## Shared

- `atlassian_validate_connection`
- `atlassian_get_server_info`
- `atlassian_whoami`

## Jira

- `jira_get_issue`
- `jira_search_issues`
- `jira_add_comment`
- `jira_transition_issue`
- `jira_update_issue_fields`

Write tools support `dryRun`.

## Confluence

- `confluence_get_page`
- `confluence_search_pages`
- `confluence_list_page_macros`
- `confluence_create_page`
- `confluence_update_page`
- `confluence_add_page_comment`

Confluence page writes use storage format and preserve macros by default. Delete and archive tools are not included.
```

- [ ] **Step 5: Add skills**

Create `skills/atlassian-safe-write/SKILL.md`:

```md
---
name: atlassian-safe-write
description: Draft and confirm Jira or Confluence writes before calling mutating Atlassian MCP tools.
---

# Atlassian Safe Write

Before using any mutating tool:

1. Draft the exact comment, transition, field update, page body, or page comment.
2. Show the target issue or page URL.
3. Ask the user for explicit approval.
4. Use `dryRun: true` first when practical.
5. Apply the write only after approval.

Never call delete, archive, or permission mutation operations.
```

Create `skills/jira-investigate-issue/SKILL.md`:

```md
---
name: jira-investigate-issue
description: Gather Jira issue context and related Confluence references.
---

# Jira Investigate Issue

1. Call `jira_get_issue`.
2. Review description, comments, links, status, assignee, labels, components, and fix versions.
3. Use `jira_get_issue_transitions` when status movement is relevant.
4. Search Confluence for related keys or terms when documentation is needed.
5. Summarize findings with source issue and page URLs.
```

Create `skills/confluence-research-topic/SKILL.md`:

```md
---
name: confluence-research-topic
description: Search Confluence Data Center and summarize selected pages with citations.
---

# Confluence Research Topic

1. Use `confluence_search_pages` with CQL.
2. Fetch relevant pages with `confluence_get_page`.
3. Prefer storage content when macro structure matters.
4. Use `confluence_list_page_macros` for macro-heavy pages.
5. Summarize with page titles and URLs.
```

- [ ] **Step 6: Commit docs and skills**

```bash
git add README.md docs/config.md docs/security.md docs/tools.md skills
git commit -m "docs: add setup guidance and Atlassian skills"
```

---

### Task 9: Final Verification and Package Readiness

**Files:**
- Modify: `package.json` if metadata needs adjustment after verification.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Expected:

```text
typecheck passes
all tests pass
build creates dist/index.js
npm pack --dry-run lists dist, docs, skills, README.md, and package metadata
```

- [ ] **Step 2: Inspect git status**

Run:

```bash
git status --short
```

Expected:

```text
no uncommitted files, or only package metadata updates from Step 3
```

- [ ] **Step 3: Commit final package metadata only if changed**

If Step 1 revealed package metadata changes, commit them:

```bash
git add package.json package-lock.json
git commit -m "chore: finalize package metadata"
```

- [ ] **Step 4: Record verification result**

Add the final verification commands and outcomes to the implementation summary in the final response. Include any command that could not be run and the reason.
