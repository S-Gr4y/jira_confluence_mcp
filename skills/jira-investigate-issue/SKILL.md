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
