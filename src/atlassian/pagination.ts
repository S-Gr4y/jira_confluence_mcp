export interface JiraPageState {
  startAt: number;
  maxResults: number;
  total: number;
  returned: number;
}

export interface ConfluencePageState {
  start: number;
  limit: number;
  size: number;
}

export function nextJiraStart(state: JiraPageState): number | undefined {
  const next = state.startAt + state.returned;
  return next < state.total ? next : undefined;
}

export function nextConfluenceStart(state: ConfluencePageState): number | undefined {
  return state.size >= state.limit ? state.start + state.size : undefined;
}
