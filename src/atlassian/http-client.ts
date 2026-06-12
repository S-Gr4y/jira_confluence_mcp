import { redactSensitive } from "../config.js";
import { AtlassianError } from "./errors.js";

export interface HttpClientOptions {
  baseUrl: string;
  pat?: string;
  basicAuthUsername?: string;
  basicAuthToken?: string;
  fetchImpl?: typeof fetch;
}

export class AtlassianHttpClient {
  private readonly fetchImpl: typeof fetch;
  private readonly authorization: string;
  private readonly redactionSecrets: string[];

  constructor(private readonly options: HttpClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.authorization = this.getAuthorizationHeader(options);
    this.redactionSecrets = [options.pat, options.basicAuthToken, options.basicAuthUsername].filter(Boolean) as string[];
  }

  private getAuthorizationHeader(options: HttpClientOptions): string {
    if (options.basicAuthUsername && options.basicAuthToken) {
      const credentials = `${options.basicAuthUsername}:${options.basicAuthToken}`;
      return `Basic ${Buffer.from(credentials).toString("base64")}`;
    }

    if (options.pat) {
      return `Bearer ${options.pat}`;
    }

    throw new Error("Missing authentication credentials");
  }

  async get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const response = await this.fetchImpl(url, {
      method,
      headers: {
        accept: "application/json",
        authorization: this.authorization,
        ...(body === undefined ? {} : { "content-type": "application/json" })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await response.text();
    const parsed = text ? safeJsonParse(text) : undefined;

    if (!response.ok) {
      const message = redactSensitive(
        `Atlassian request failed with status ${response.status}: ${text}`,
        this.redactionSecrets
      );
      throw new AtlassianError(message, response.status, redactDetails(parsed, this.redactionSecrets));
    }

    return parsed as T;
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const base = new URL(this.options.baseUrl);
    const basePath = base.pathname.replace(/\/+$/, "");
    const requestPath = path.replace(/^\/+/, "");
    base.pathname = [basePath, requestPath].filter(Boolean).join("/");

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        base.searchParams.set(key, String(value));
      }
    }

    return base.toString();
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function redactDetails(details: unknown, secrets: string[]): unknown {
  if (typeof details === "string") {
    return redactSensitive(details, secrets);
  }

  if (details === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(redactSensitive(JSON.stringify(details), secrets));
  } catch {
    return redactSensitive(String(details), secrets);
  }
}
