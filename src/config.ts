export interface AppConfig {
  jiraBaseUrl?: string;
  confluenceBaseUrl?: string;
  pat?: string;
  basicAuthUsername?: string;
  basicAuthToken?: string;
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
  const basicAuthUsername = env.ATLASSIAN_USERNAME?.trim() ?? env.ATLASSIAN_USER?.trim();
  const basicAuthToken = env.ATLASSIAN_API_TOKEN?.trim() ?? env.ATLASSIAN_TOKEN?.trim();

  if (!jiraBaseUrl && !confluenceBaseUrl) {
    throw new Error("At least one of JIRA_BASE_URL or CONFLUENCE_BASE_URL is required");
  }

  if (!pat && !basicAuthUsername && !basicAuthToken) {
    throw new Error(
      "ATLASSIAN_PAT, or both ATLASSIAN_USERNAME and ATLASSIAN_API_TOKEN, are required"
    );
  }

  if ((basicAuthUsername && !basicAuthToken) || (!basicAuthUsername && basicAuthToken)) {
    throw new Error("ATLASSIAN_USERNAME and ATLASSIAN_API_TOKEN must both be set for Basic auth");
  }

  return {
    jiraBaseUrl,
    confluenceBaseUrl,
    pat,
    basicAuthUsername,
    basicAuthToken
  };
}

export function redactSensitive(input: string, secrets: string[] = []): string {
  let output = input.replace(/Bearer\s+[-._~+/A-Za-z0-9=]+/g, "Bearer [REDACTED]");

  for (const secret of secrets.filter(Boolean)) {
    output = output.split(secret).join("[REDACTED]");
  }

  return output;
}
