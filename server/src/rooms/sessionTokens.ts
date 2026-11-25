import { randomUUID } from 'node:crypto';

// Session tokens reclaim a seat after a refresh or disconnect.
// They are never logged and never sent to other players. See design/03-guardrails.md section 5.
export function createSessionToken(): string {
  return randomUUID();
}
