# Jira Confluence Atlassian Interactor

Standalone MCP server for Jira and Confluence Data Center/Server using user-provided personal access tokens.

## Requirements

- Node.js 20 or newer
- Jira Data Center/Server and/or Confluence Data Center/Server
- A PAT created by the user in Atlassian

## Quick Start

1. Create a personal access token from your own Jira or Confluence Data Center/Server user profile.
2. Add the server to your MCP client using stdio.
3. Put the PAT in the MCP client's local environment configuration, a local shell environment variable, or a secret manager if your client supports one.
4. Run `atlassian_validate_connection` from your MCP client.

Never commit a PAT to git. Avoid putting it in any tracked config file, issue comment, Confluence page, bug report, or log.

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

For local-only client configuration, the `env` block is the most direct place to put product URLs and the PAT. Prefer storing the PAT in a local environment variable or secret manager when your MCP client supports it.

Configure at least one product URL. Jira tools require `JIRA_BASE_URL`; Confluence tools require `CONFLUENCE_BASE_URL`.

## Verify Setup

Run the `atlassian_validate_connection` tool from your MCP client. It should return authenticated Jira and/or Confluence user details.

## Documentation

- `docs/config.md`: environment variables
- `docs/security.md`: PAT handling
- `docs/tools.md`: tool list and write safety
