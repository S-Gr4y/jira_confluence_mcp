export interface AppConfig {
  jiraBaseUrl?: string;
  confluenceBaseUrl?: string;
  pat: string;
}

export type Env = Record<string, string | undefined>;

function normalizeBaseUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new URL(value);
  return parsed.toString().replace(/\/$/, "");
}

export function loadConfig(env: Env = process.env): AppConfig {
  const jiraBaseUrl = normalizeBaseUrl(env.JIRA_BASE_URL);
  const confluenceBaseUrl = normalizeBaseUrl(env.CONFLUENCE_BASE_URL);
  const pat = env.ATLASSIAN_PAT?.trim();

  if (!jiraBaseUrl && !confluenceBaseUrl) {
    throw new Error("At least one of JIRA_BASE_URL or CONFLUENCE_BASE_URL is required");
  }

  if (!pat) {
    throw new Error("ATLASSIAN_PAT is required");
  }

  return {
    jiraBaseUrl,
    confluenceBaseUrl,
    pat
  };
}

export function redactSensitive(input: string, secrets: string[] = []): string {
  let output = input.replace(/Bearer\s+[-._~+/A-Za-z0-9=]+/g, "Bearer [REDACTED]");

  for (const secret of secrets.filter(Boolean)) {
    output = output.split(secret).join("[REDACTED]");
  }

  return output;
}
