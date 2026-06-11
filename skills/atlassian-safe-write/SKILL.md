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
