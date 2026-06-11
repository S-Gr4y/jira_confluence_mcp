import type { JiraClient } from "../atlassian/jira-client.js";
import {
  jiraAddCommentSchema,
  jiraGetBoardsSchema,
  jiraGetIssueSchema,
  jiraGetIssueTransitionsSchema,
  jiraGetProjectSchema,
  jiraGetSprintsSchema,
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
  const targetFor = (issueKey: string) => ({
    key: issueKey,
    url: typeof jira.issueUrl === "function" ? jira.issueUrl(issueKey) : ""
  });

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
    jira_get_issue_transitions: {
      description: "Get valid transitions for a Jira issue.",
      inputSchema: jiraGetIssueTransitionsSchema,
      handler: async (input) => jira.getTransitions(jiraGetIssueTransitionsSchema.parse(input).issueKey)
    },
    jira_get_project: {
      description: "Get a Jira project by key.",
      inputSchema: jiraGetProjectSchema,
      handler: async (input) => jira.getProject(jiraGetProjectSchema.parse(input).projectKey)
    },
    jira_get_boards: {
      description: "Get Jira Agile boards, optionally filtered by project.",
      inputSchema: jiraGetBoardsSchema,
      handler: async (input) => jira.getBoards(jiraGetBoardsSchema.parse(input))
    },
    jira_get_sprints: {
      description: "Get Jira Agile sprints for a board.",
      inputSchema: jiraGetSprintsSchema,
      handler: async (input) => jira.getSprints(jiraGetSprintsSchema.parse(input))
    },
    jira_add_comment: {
      description: "Add a comment to a Jira issue. Supports dryRun.",
      inputSchema: jiraAddCommentSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = jiraAddCommentSchema.parse(input);
        const target = targetFor(parsed.issueKey);

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
        const target = targetFor(parsed.issueKey);
        if (parsed.dryRun) {
          return { changed: false, target, audit: { summary: `Would transition ${parsed.issueKey}` } };
        }
        await jira.getTransitions(parsed.issueKey);
        await jira.transitionIssue(parsed.issueKey, parsed.transitionId, parsed.comment);
        return { changed: true, target, audit: { summary: `Transitioned ${parsed.issueKey}` } };
      }
    },
    jira_update_issue_fields: {
      description: "Update allowlisted Jira issue fields. Supports dryRun.",
      inputSchema: jiraUpdateIssueFieldsSchema,
      handler: async (input): Promise<WriteResult> => {
        const parsed = jiraUpdateIssueFieldsSchema.parse(input);
        const target = targetFor(parsed.issueKey);
        if (parsed.dryRun) {
          return { changed: false, target, audit: { summary: `Would update fields on ${parsed.issueKey}` } };
        }
        await jira.updateIssueFields(parsed.issueKey, parsed.fields);
        return { changed: true, target, audit: { summary: `Updated fields on ${parsed.issueKey}` } };
      }
    }
  };
}
