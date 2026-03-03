/**
 * Simple in-process event bus. Use for decoupling: emit after mutations; listeners handle email, audit, analytics.
 * Replace with Redis pub/sub or a queue later if needed.
 */

type Listener<T = unknown> = (payload: T) => void | Promise<void>;

const listeners = new Map<string, Listener[]>();

export function emit<T = unknown>(event: string, payload: T): void {
  const fns = listeners.get(event);
  if (!fns?.length) return;
  for (const fn of fns) {
    Promise.resolve(fn(payload)).catch((err) => {
      console.error(`[events] listener error for "${event}":`, err);
    });
  }
}

export function on<T = unknown>(event: string, listener: Listener<T>): () => void {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event)!.push(listener as Listener);
  return () => {
    const fns = listeners.get(event)!;
    const i = fns.indexOf(listener as Listener);
    if (i !== -1) fns.splice(i, 1);
  };
}

/** Event names (extend as needed). */
export const EVENTS = {
  USER_REGISTERED: "user.registered",
  USER_INVITED: "user.invited",
  AGENCY_CREATED: "agency.created",
  PASSWORD_RESET_REQUESTED: "password_reset.requested",
} as const;
