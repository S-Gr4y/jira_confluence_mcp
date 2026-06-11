import { z } from "zod";

export const dryRunSchema = z.object({
  dryRun: z.boolean().optional().default(false)
});

export interface AuditResult {
  summary: string;
}

export interface WriteResult {
  changed: boolean;
  target: {
    id?: string;
    key?: string;
    url: string;
  };
  audit: AuditResult;
}
