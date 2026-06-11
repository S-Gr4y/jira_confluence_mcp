import { z } from "zod";

export const jiraIssueKeySchema = z.string().regex(/^[A-Z][A-Z0-9]+-\d+$/);

export const jiraGetIssueSchema = z.object({
  issueKey: jiraIssueKeySchema
});

export const jiraSearchIssuesSchema = z.object({
  jql: z.string().min(1),
  maxResults: z.number().int().min(1).max(100).default(50),
  startAt: z.number().int().min(0).default(0)
});

export const jiraAddCommentSchema = z
  .object({
    issueKey: jiraIssueKeySchema,
    body: z.string().min(1),
    dryRun: z.boolean().optional().default(false)
  })
  .strict();

export const jiraTransitionIssueSchema = z
  .object({
    issueKey: jiraIssueKeySchema,
    transitionId: z.string().min(1),
    comment: z.string().optional(),
    dryRun: z.boolean().optional().default(false)
  })
  .strict();

export const jiraUpdateIssueFieldsSchema = z
  .object({
    issueKey: jiraIssueKeySchema,
    fields: z
      .object({
        summary: z.string().min(1).optional(),
        description: z.string().optional(),
        labels: z.array(z.string()).optional(),
        assignee: z.object({ name: z.string().min(1) }).optional(),
        priority: z.object({ name: z.string().min(1) }).optional(),
        components: z.array(z.object({ name: z.string().min(1) })).optional(),
        fixVersions: z.array(z.object({ name: z.string().min(1) })).optional()
      })
      .strict()
      .refine((fields) => Object.keys(fields).length > 0, {
        message: "At least one allowlisted Jira field is required"
      }),
    dryRun: z.boolean().optional().default(false)
  })
  .strict();
