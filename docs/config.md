# Configuration

The server reads configuration from environment variables.

| Variable | Required | Description |
| --- | --- | --- |
| `JIRA_BASE_URL` | Required when using Jira | Base URL such as `https://jira.example.company.com` |
| `CONFLUENCE_BASE_URL` | Required when using Confluence | Base URL such as `https://confluence.example.company.com` |
| `ATLASSIAN_PAT` | Yes | Personal access token supplied by the user |
| `ATLASSIAN_USERNAME` | Optional | Username/email for Atlassian Cloud Basic auth |
| `ATLASSIAN_API_TOKEN` | Optional | API token for Atlassian Cloud Basic auth |

At least one product URL is required.

## PAT Location

For local MCP client use, set `ATLASSIAN_PAT` (Data Center/Server bearer) **or** `ATLASSIAN_USERNAME` + `ATLASSIAN_API_TOKEN` (Cloud basic auth) in the client's stdio `env` configuration, in your local shell environment, or through a local secret manager if the client supports one.

Do not commit the PAT or any config file containing it.
