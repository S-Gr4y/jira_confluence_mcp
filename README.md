# Jira Confluence Atlassian Interactor

Standalone MCP server for Jira and Confluence.

Use `ATLASSIAN_PAT` for Jira/Confluence Data Center/Server (Bearer token) or `ATLASSIAN_USERNAME` + `ATLASSIAN_API_TOKEN` for Cloud (Basic auth).

## Requirements

- Node.js 20 or newer
- Jira and/or Confluence
- A PAT created in Atlassian for Data Center/Server, or an Atlassian Cloud API token with username

## Quick Start

1. Create either a Data Center/Server PAT or, for Cloud, use your Atlassian username and API token.
2. Add the server to your MCP client using stdio.
3. Put the PAT in the MCP client's local environment configuration, a local shell environment variable, or a secret manager if your client supports one.
4. Run `atlassian_validate_connection` from your MCP client.

Never commit a PAT to git. Avoid putting it in any tracked config file, issue comment, Confluence page, bug report, or log.

## MCP Client Configuration

This server runs as a local stdio MCP server. All clients need the same command and environment variables:

```json
{
  "mcpServers": {
    "atlassian-dc": {
      "command": "npx",
      "args": ["-y", "jira-confluence-atlassian-interactor"],
      "env": {
        "JIRA_BASE_URL": "https://jira.example.company.com",
        "CONFLUENCE_BASE_URL": "https://confluence.example.company.com",
        "ATLASSIAN_PAT": "${env:ATLASSIAN_PAT}"
      }
    }
  }
}
```

For local-only client configuration, the `env` block is the most direct place to put product URLs and the PAT. Prefer storing the PAT in a local environment variable or secret manager when your MCP client supports it.

Configure at least one product URL. Jira tools require `JIRA_BASE_URL`; Confluence tools require `CONFLUENCE_BASE_URL`.

## Client Setup Examples

Use the examples below as starting points. Replace the URLs with your Data Center/Server instances. For the PAT, prefer `${env:ATLASSIAN_PAT}` or your client's secret input support over pasting the token into a repository file.

### OpenAI Codex

Codex reads MCP servers from `~/.codex/config.toml` or a project `.codex/config.toml`.

```toml
[mcp_servers.atlassian-dc]
command = "npx"
args = ["-y", "jira-confluence-atlassian-interactor"]
enabled = true

[mcp_servers.atlassian-dc.env]
JIRA_BASE_URL = "https://jira.example.company.com"
CONFLUENCE_BASE_URL = "https://confluence.example.company.com"
ATLASSIAN_PAT = "${env:ATLASSIAN_PAT}"
```

You can also manage servers with the Codex CLI:

```sh
codex mcp add atlassian-dc -- npx -y jira-confluence-atlassian-interactor
```

If you use the CLI command, add the three environment variables in your Codex config afterward.

### Claude Code

Claude Code can add stdio MCP servers from the terminal. Put options before the server name, then put the server command after `--`.

```sh
export ATLASSIAN_PAT="<YOUR_ATLASSIAN_PAT>"

claude mcp add --transport stdio --scope user \
  --env JIRA_BASE_URL=https://jira.example.company.com \
  --env CONFLUENCE_BASE_URL=https://confluence.example.company.com \
  --env ATLASSIAN_PAT="$ATLASSIAN_PAT" \
  atlassian-dc -- npx -y jira-confluence-atlassian-interactor
```

Verify inside Claude Code with:

```text
/mcp
```

### Claude Desktop

Open Claude Desktop's MCP configuration from the app settings, then add a local stdio server entry:

```json
{
  "mcpServers": {
    "atlassian-dc": {
      "command": "npx",
      "args": ["-y", "jira-confluence-atlassian-interactor"],
      "env": {
        "JIRA_BASE_URL": "https://jira.example.company.com",
        "CONFLUENCE_BASE_URL": "https://confluence.example.company.com",
        "ATLASSIAN_PAT": "${env:ATLASSIAN_PAT}"
      }
    }
  }
}
```

Restart Claude Desktop after editing the config.

### Cursor

Open Cursor Settings, go to MCP, and add a new server. For JSON-based setup, use:

```json
{
  "mcpServers": {
    "atlassian-dc": {
      "command": "npx",
      "args": ["-y", "jira-confluence-atlassian-interactor"],
      "env": {
        "JIRA_BASE_URL": "https://jira.example.company.com",
        "CONFLUENCE_BASE_URL": "https://confluence.example.company.com",
        "ATLASSIAN_PAT": "${env:ATLASSIAN_PAT}"
      }
    }
  }
}
```

Keep PAT-bearing Cursor config local. Do not commit workspace MCP files that contain real tokens.

### OpenCode

OpenCode reads JSON/JSONC config from `~/.config/opencode/opencode.json` (or project `opencode.json` / `.opencode/opencode.json`). Add local MCP servers under `mcp` with `type: "local"`.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "atlassian-dc": {
      "type": "local",
      "command": ["npx", "-y", "jira-confluence-atlassian-interactor"],
      "enabled": true,
      "environment": {
        "JIRA_BASE_URL": "https://jira.example.company.com",
        "CONFLUENCE_BASE_URL": "https://confluence.example.company.com",
        "ATLASSIAN_PAT": "${env:ATLASSIAN_PAT}"
      }
    }
  }
}
```

Set `ATLASSIAN_PAT` in your shell before launching OpenCode, then run:

```sh
opencode mcp list
```

### VS Code / GitHub Copilot Agent Mode

VS Code uses an `mcp.json` file with a top-level `servers` object. For workspace config, create `.vscode/mcp.json`; for user config, run `MCP: Open User Configuration`.

```json
{
  "servers": {
    "atlassian-dc": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "jira-confluence-atlassian-interactor"],
      "env": {
        "JIRA_BASE_URL": "https://jira.example.company.com",
        "CONFLUENCE_BASE_URL": "https://confluence.example.company.com",
        "ATLASSIAN_PAT": "${env:ATLASSIAN_PAT}"
      }
    }
  }
}
```

VS Code can also add a server from the command line:

```sh
code --add-mcp '{"name":"atlassian-dc","type":"stdio","command":"npx","args":["-y","jira-confluence-atlassian-interactor"]}'
```

Add the environment variables in the generated config afterward.

### Windsurf / Cascade

Windsurf Cascade reads local MCP servers from `~/.codeium/windsurf/mcp_config.json`.

```json
{
  "mcpServers": {
    "atlassian-dc": {
      "command": "npx",
      "args": ["-y", "jira-confluence-atlassian-interactor"],
      "env": {
        "JIRA_BASE_URL": "https://jira.example.company.com",
        "CONFLUENCE_BASE_URL": "https://confluence.example.company.com",
        "ATLASSIAN_PAT": "${env:ATLASSIAN_PAT}"
      }
    }
  }
}
```

Set `ATLASSIAN_PAT` in your shell or OS environment before launching Windsurf.

## Setup Notes

- Use a PAT from your own Atlassian user profile.
- If Jira and Confluence use different hosts, set both base URLs.
- If only one product is needed, omit the other base URL.
- Restart the client after editing MCP config unless the client has an explicit MCP restart command.
- Run `atlassian_validate_connection` first; it should return authenticated user details for each configured product.
- Never commit real PATs. Use user-level config, prompt inputs, environment variables, or a secret manager.

PAT handling differs by client: `env` interpolation (`${env:ATLASSIAN_PAT}`) is used where supported, while some clients may require prompt-based input blocks such as `${input:...}`.

## Reference Docs

- [Codex MCP configuration](https://developers.openai.com/codex/cli/features#model-context-protocol-mcp)
- [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Cursor MCP](https://cursor.com/docs/mcp)
- [OpenCode MCP servers](https://dev.opencode.ai/docs/mcp-servers/)
- [VS Code MCP servers](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
- [VS Code MCP configuration reference](https://code.visualstudio.com/docs/copilot/reference/mcp-configuration)
- [Windsurf Cascade MCP](https://docs.windsurf.com/windsurf/cascade/mcp)

## Verify Setup

Run the `atlassian_validate_connection` tool from your MCP client. It should return authenticated Jira and/or Confluence user details.

## Documentation

- [docs/config.md](docs/config.md): environment variables
- [docs/security.md](docs/security.md): PAT handling
- [docs/tools.md](docs/tools.md): tool list and write safety
