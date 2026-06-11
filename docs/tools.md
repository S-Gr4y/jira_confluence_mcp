# Tools

The server exposes read tools and guarded write tools for configured Jira and Confluence Data Center/Server products.

## Shared Tools

| Tool | Purpose |
| --- | --- |
| `atlassian_validate_connection` | Validate configured Jira and Confluence connections and return authenticated user details. |
| `atlassian_get_server_info` | Return server information for configured products. |
| `atlassian_whoami` | Return the current authenticated user for configured products. |

## Jira Tools

| Tool | Purpose |
| --- | --- |
| `jira_get_issue` | Get a Jira issue by key. |
| `jira_search_issues` | Search Jira issues with JQL. |
| `jira_add_comment` | Add a comment to a Jira issue. Supports `dryRun`. |
| `jira_transition_issue` | Transition a Jira issue by exact transition id. Supports `dryRun`. |
| `jira_update_issue_fields` | Update allowlisted Jira issue fields. Supports `dryRun`. |

## Confluence Tools

| Tool | Purpose |
| --- | --- |
| `confluence_get_page` | Get a Confluence page, using storage format by default. |
| `confluence_search_pages` | Search Confluence pages with CQL. |
| `confluence_list_page_macros` | List macros from a Confluence page storage body. |
| `confluence_create_page` | Create a Confluence page using storage format. Supports `dryRun`. |
| `confluence_update_page` | Update a Confluence page using storage format. Supports `dryRun`. |
| `confluence_add_page_comment` | Add a storage-format comment to a Confluence page. Supports `dryRun`. |

## Write Safety

Mutating Jira and Confluence tools support `dryRun` where noted. Use `dryRun: true` before applying changes when practical. Dry runs validate input and return the target and audit summary without changing Jira or Confluence.

Jira field updates are limited to allowlisted fields enforced by the server.

Confluence writes use storage-format XHTML in `storageBody`. The server validates storage syntax before create, update, or comment writes. When updating an existing page, preserve existing macros in the caller-provided storage body unless intentionally changing them. Use `confluence_list_page_macros` to inspect macro-heavy storage before editing.

This server does not expose delete, archive, or permission mutation tools.
