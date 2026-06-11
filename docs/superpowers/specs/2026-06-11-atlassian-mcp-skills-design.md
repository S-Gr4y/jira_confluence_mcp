# Atlassian Data Center MCP and Skills Design

## Goal

Build a reusable MCP server that makes Jira and Confluence Data Center/Server easier and safer to use from AI coding tools. The server will authenticate with a personal access token supplied by the user at runtime and expose a small, workflow-oriented set of read and safe-write tools.

Codex skills will be provided as an optional layer on top of the MCP server. The MCP server itself must remain compatible with other MCP clients.

## Target Platform

The first version targets Atlassian Data Center/Server only.

Authentication uses a PAT passed as a bearer token:

```text
Authorization: Bearer <PAT>
```

Cloud support is out of scope for v1 because Atlassian Cloud uses different URL structure and authentication conventions.

## Recommended Approach

Use a standalone TypeScript MCP server package with optional skills stored separately in the same repository.

This gives the project two clean layers:

- MCP server: reusable by any MCP-compatible host.
- Skills: client-specific workflow guidance for Codex or other environments that support skill-style instructions.

The server should avoid Codex-specific behavior. It should expose normal MCP tools, use environment-based configuration, and return structured results that are useful to any MCP client.

## Project Shape

```text
jira-confluence-atlassian-interactor/
  package.json
  src/
    index.ts
    config.ts
    atlassian/
      http-client.ts
      jira-client.ts
      confluence-client.ts
      errors.ts
      pagination.ts
    tools/
      jira.ts
      confluence.ts
      shared.ts
    schemas/
      jira.ts
      confluence.ts
  skills/
    jira-investigate-issue/SKILL.md
    confluence-research-topic/SKILL.md
    atlassian-safe-write/SKILL.md
  docs/
    config.md
    tools.md
    security.md
```

## Configuration

The server reads configuration from environment variables.

```env
JIRA_BASE_URL=https://jira.example.company.com
CONFLUENCE_BASE_URL=https://confluence.example.company.com
ATLASSIAN_PAT=...
ATLASSIAN_TLS_REJECT_UNAUTHORIZED=true
```

Jira and Confluence may be configured independently. This supports installations where only one product is available or where each product has a separate base URL.

The PAT must not be stored in repository files. Logs and errors must redact `Authorization` headers and token-like values.

## MCP Tool Surface

The v1 tool surface should be intentionally small and workflow-oriented instead of exposing the full Atlassian REST API.

### Shared Tools

- `atlassian_validate_connection`
- `atlassian_get_server_info`
- `atlassian_whoami`

### Jira Read Tools

- `jira_get_issue`
- `jira_search_issues`
- `jira_get_issue_transitions`
- `jira_get_project`
- `jira_get_boards`
- `jira_get_sprints`

The Agile tools are included only when Jira Agile endpoints are available.

### Jira Safe-Write Tools

- `jira_add_comment`
- `jira_transition_issue`
- `jira_update_issue_fields`

`jira_update_issue_fields` starts with a constrained allowlist of fields such as summary, description, labels, assignee, priority, components, and fixVersions.

### Confluence Read Tools

- `confluence_get_page`
- `confluence_search_pages`
- `confluence_get_page_children`
- `confluence_get_space`
- `confluence_get_attachments`
- `confluence_list_page_macros`

### Confluence Safe-Write Tools

- `confluence_create_page`
- `confluence_update_page`
- `confluence_add_page_comment`

Delete, archive, permission mutation, and bulk mutation tools are out of scope for v1.

## Safety Model

Safe writes are supported, but the server should make accidental mutation difficult.

Rules enforced by the MCP server:

- All write tools accept `dryRun?: boolean`.
- Delete and archive tools are not provided in v1.
- Confluence updates fetch the current page first and submit `version.number + 1`.
- `jira_transition_issue` requires an exact transition id, ideally obtained from `jira_get_issue_transitions`.
- `jira_update_issue_fields` accepts only an explicit allowlist of fields.
- Every write response includes `changed`, target key or id, target URL, and a short audit summary.
- Errors and logs redact PATs and `Authorization` headers.

Skills must draft write content first and ask the user for approval before calling a mutating tool.

## Implementation Architecture

Use TypeScript and Node.js.

Runtime choices:

- MCP transport: stdio first.
- HTTP client: shared wrapper around `fetch`.
- Validation: Zod schemas for tool inputs.
- Output: stable structured JSON plus concise human-readable summaries where useful.
- Pagination: shared helpers for Jira `startAt/maxResults` and Confluence `start/limit`.
- Version detection: connection validation probes Jira and Confluence separately.

Internal boundaries:

- `config.ts`: reads and validates environment configuration.
- `atlassian/http-client.ts`: adds auth headers, performs requests, handles response parsing, and redacts sensitive values.
- `atlassian/jira-client.ts`: Jira REST methods.
- `atlassian/confluence-client.ts`: Confluence REST methods.
- `atlassian/confluence-storage.ts`: parses, inspects, preserves, and serializes Confluence storage XHTML.
- `atlassian/pagination.ts`: shared pagination helpers.
- `atlassian/errors.ts`: normalizes Atlassian errors into MCP-friendly errors.
- `tools/*.ts`: MCP tool registration, input validation, and output mapping.
- `schemas/*.ts`: Zod schemas shared by tools and tests.

## Data Flow

Read flow:

```text
MCP client -> tool input -> Zod validation -> product client -> REST API -> normalized response
```

Write flow:

```text
MCP client -> tool input -> validation -> dryRun check -> preflight fetch if needed -> REST API write -> audit response
```

Confluence page update flow:

```text
get current page -> prepare updated title/body -> PUT page with version + 1 -> return page URL
```

Confluence page updates must preserve macros by default. The server should fetch and update `body.storage` rather than rendered `view` HTML, because Confluence storage format is the XHTML-based representation that contains macro elements such as structured macros, parameters, rich-text bodies, and plain-text bodies.

Macro-aware update flow:

```text
get current page with body.storage -> parse storage XHTML -> preserve existing macro nodes -> apply targeted edit -> serialize storage XHTML -> PUT page with version + 1
```

The server must not convert a macro-containing page from rendered HTML back to storage format. That conversion can lose macro structure or macro bodies.

Jira issue transition flow:

```text
get valid transitions -> require exact transitionId -> POST transition -> return issue URL
```

## Initial Skills

Skills should describe workflows rather than mirror API documentation.

- `jira-investigate-issue`: fetch an issue, comments, linked issues, and related Confluence pages when possible.
- `atlassian-safe-write`: draft first, ask for user approval, then call the appropriate write tool.
- `confluence-research-topic`: search with CQL, summarize selected pages, and cite page URLs.
- `jira-standup-update`: gather recent assigned issues and draft a status update.

## Confluence Macro Handling

Macro handling is a first-class v1 requirement.

Read behavior:

- `confluence_get_page` can return storage content, rendered content, or both.
- `confluence_list_page_macros` inspects `body.storage` and returns macro names, parameters, body type, and location hints.
- Macro bodies are treated as structured content, not plain text.

Write behavior:

- `confluence_update_page` defaults to preserving all existing macros.
- Existing macros are not reformatted, regenerated, or removed unless the tool input explicitly asks for a macro-level change.
- Macro-level changes are out of scope for v1 unless they can be expressed as safe insertion of new storage-format content.
- Pages containing unknown or malformed macro storage fail closed with a clear error instead of risking a lossy update.

The implementation should use an XML/XHTML parser for storage content instead of regex-based string manipulation. This is required for preserving nested macros, macro parameters, rich-text macro bodies, and plain-text macro bodies.

## Testing Strategy

The normal test suite must not require a real PAT.

Test layers:

- Unit tests for config parsing, URL construction, pagination, redaction, and schema validation.
- Mocked HTTP tests for every tool using fixture responses.
- Storage-format tests for Confluence pages containing structured macros, nested macros, rich-text macro bodies, and plain-text macro bodies.
- Optional integration smoke tests against real Jira and Confluence instances when environment variables are present.

Integration tests must be opt-in and must not run during normal CI unless explicitly configured.

## Out of Scope for v1

- Atlassian Cloud support.
- OAuth.
- Basic authentication.
- Delete/archive tools.
- Permission mutation tools.
- Bulk write operations.
- Full REST API passthrough.
- Storing PATs in project files.

## Open Implementation Notes

- Data Center/Server versions vary, so connection and capability detection should be explicit.
- Jira Agile endpoints may not exist in every installation.
- Confluence storage format is the safest v1 body representation for page create/update operations.
- Macro preservation should be verified with fixture pages before enabling Confluence update tools by default.
- Later versions can add prompt templates, MCP resources, Cloud support, and stricter per-tool permission policies.
