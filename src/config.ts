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

const templateVarPattern = /^\$\{([A-Z_]+)\}$/;

function resolveEnvVar(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(templateVarPattern);
  if (match) {
    return process.env[match[1]];
  }

  return value;
}

export function loadConfig(env: Env = process.env): AppConfig {
  const jiraBaseUrl = normalizeBaseUrl(resolveEnvVar(env.JIRA_BASE_URL));
  const confluenceBaseUrl = normalizeBaseUrl(resolveEnvVar(env.CONFLUENCE_BASE_URL));
  const pat = resolveEnvVar(env.ATLASSIAN_PAT);
  const basicAuthUsername = resolveEnvVar(env.ATLASSIAN_USERNAME) ?? resolveEnvVar(env.ATLASSIAN_USER);
  const basicAuthToken = resolveEnvVar(env.ATLASSIAN_API_TOKEN) ?? resolveEnvVar(env.ATLASSIAN_TOKEN);

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
