# Configuration

The server reads configuration from environment variables.

| Variable | Required | Description |
| --- | --- | --- |
| `JIRA_BASE_URL` | Required when using Jira | Base URL such as `https://jira.example.company.com` |
| `CONFLUENCE_BASE_URL` | Required when using Confluence | Base URL such as `https://confluence.example.company.com` |
| `ATLASSIAN_PAT` | Yes | Personal access token supplied by the user |
| `ATLASSIAN_TLS_REJECT_UNAUTHORIZED` | No | Set to `false` only for controlled corporate TLS troubleshooting |

At least one product URL is required.

## PAT Location

For local MCP client use, set `ATLASSIAN_PAT` in the client's stdio `env` configuration, in your local shell environment, or through a local secret manager if the client supports one.

Do not commit the PAT or any config file containing it.
