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
