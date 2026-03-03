"use client";

import { useEffect, useState } from "react";
import { AppCard, AppButton } from "@/components/design";
import { getSessions, logoutOtherSessions } from "@/services/auth";
import type { SessionInfo } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

function formatSessionLabel(session: SessionInfo): string {
  const ua = session.userAgent ?? "";
  if (ua.includes("Chrome") && ua.includes("Mac")) return "Chrome, Mac";
  if (ua.includes("Safari") && ua.includes("iPhone")) return "iPhone Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.length > 0) return ua.slice(0, 50);
  return "Unknown device";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadSessions(): Promise<SessionInfo[]> {
  return getSessions();
}

export function SessionsSection() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const getStoredRefreshToken = useAuthStore((s) => s.getStoredRefreshToken);

  const fetchSessions = () => {
    setError(null);
    setLoading(true);
    loadSessions()
      .then(setSessions)
      .catch(() => setError("Could not load sessions."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  async function handleLogoutOthers() {
    const token = getStoredRefreshToken();
    if (!token) return;
    setLoggingOut(true);
    try {
      await logoutOtherSessions(token);
      fetchSessions();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <AppCard className="rounded-xl max-w-lg p-6">
      <h3 className="text-lg font-medium text-text-primary mb-2">Active sessions</h3>
      <p className="text-sm text-text-secondary mb-4">
        Devices where you are currently signed in. Sign out from all other devices to keep your account secure.
      </p>
      {loading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <AppButton variant="outline" size="sm" onClick={fetchSessions}>
            Retry
          </AppButton>
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-text-secondary">No active sessions.</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="text-text-primary">{formatSessionLabel(s)}</span>
              <span className="text-text-secondary">{formatDate(s.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      <AppButton variant="outline" onClick={handleLogoutOthers} loading={loggingOut} disabled={loggingOut || sessions.length <= 1}>
        Logout other sessions
      </AppButton>
    </AppCard>
  );
}
