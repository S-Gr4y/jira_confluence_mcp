import { redactSensitive } from "../config.js";

export class AtlassianError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "AtlassianError";
  }
}

export function sanitizeErrorMessage(message: string, secrets: string[] = []): string {
  return redactSensitive(message, secrets);
}
