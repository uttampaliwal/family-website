import { API_BASE } from "./api-client.js";

export interface SseMessage {
  type: string;
  [key: string]: unknown;
}

/**
 * Fetch-based SSE reader. EventSource cannot send Authorization headers, so
 * we read the stream manually and keep the bearer-token auth model.
 */
export async function connectSse(
  path: string,
  token: string,
  onEvent: (event: SseMessage) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`SSE connection failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          onEvent(JSON.parse(line.slice(6)) as SseMessage);
        } catch {
          // ignore malformed frames
        }
      }
    }
  }
}
