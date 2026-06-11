import { z } from "zod";

export const confluencePageIdSchema = z.string().min(1);

export const confluenceGetPageSchema = z.object({
  pageId: confluencePageIdSchema,
  includeRendered: z.boolean().optional().default(false)
});

export const confluenceSearchPagesSchema = z.object({
  cql: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(25),
  start: z.number().int().min(0).default(0)
});

export const confluenceCreatePageSchema = z
  .object({
    spaceKey: z.string().min(1),
    title: z.string().min(1),
    parentPageId: z.string().optional(),
    storageBody: z.string().min(1),
    dryRun: z.boolean().optional().default(false)
  })
  .strict();

export const confluenceUpdatePageSchema = z
  .object({
    pageId: confluencePageIdSchema,
    title: z.string().min(1).optional(),
    storageBody: z.string().min(1),
    dryRun: z.boolean().optional().default(false)
  })
  .strict();

export const confluenceAddPageCommentSchema = z
  .object({
    pageId: confluencePageIdSchema,
    storageBody: z.string().min(1),
    dryRun: z.boolean().optional().default(false)
  })
  .strict();
