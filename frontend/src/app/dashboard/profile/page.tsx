"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { BasicInfoForm } from "@/modules/profile/components/BasicInfoForm";
import { AccountInfoSection } from "@/modules/profile/components/AccountInfoSection";
import { SessionsSection } from "@/modules/profile/components/SessionsSection";
import { PasswordForm } from "@/modules/profile/components/PasswordForm";
import { NotificationPreferencesForm } from "@/modules/profile/components/NotificationPreferencesForm";
import { PreferencesForm } from "@/modules/profile/components/PreferencesForm";
import { useAuthStore } from "@/store/auth";
import { getMe, updateProfile } from "@/services/auth";
import type { AuthUser } from "@/services/auth";
import type { UserPreferences } from "@/services/auth";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { User, CircleUser, Monitor, Lock, Bell, Settings } from "lucide-react";

type ProfileTabId = "basic" | "account" | "sessions" | "security" | "notifications" | "preferences";

const TABS: { id: ProfileTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "basic", label: "Basic info", icon: User },
  { id: "account", label: "Account", icon: CircleUser },
  { id: "sessions", label: "Sessions", icon: Monitor },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Settings },
];

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthFromMe = useAuthStore((s) => s.setAuthFromMe);
  const [user, setUserState] = useState<AuthUser | null>(storeUser);
  const [activeTab, setActiveTab] = useState<ProfileTabId>("basic");
  const [loading, setLoading] = useState(true);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    setUserState(storeUser);
  }, [storeUser]);

  useEffect(() => {
    getMe()
      .then((me) => {
        setUserState(me.user);
        setAuthFromMe(me.user, me.permissions, me.permissionVersion);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setAuthFromMe]);

  async function handleBasicInfoSubmit(values: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    avatarUrl?: string;
    jobTitle?: string;
    department?: string;
  }) {
    setSavingBasic(true);
    try {
      const updated = await updateProfile({
        firstName: values.firstName || null,
        lastName: values.lastName || null,
        displayName: values.displayName || null,
        phone: values.phone || null,
        avatarUrl: values.avatarUrl || null,
        jobTitle: values.jobTitle || null,
        department: values.department || null,
      });
      setUserState(updated);
      setUser(updated);
      toast.success("Profile updated.");
    } finally {
      setSavingBasic(false);
    }
  }

  async function handleNotificationPrefsSubmit(prefs: Partial<UserPreferences>) {
    setSavingNotif(true);
    try {
      const updated = await updateProfile({
        preferences: { ...user?.preferences, ...prefs } as UserPreferences,
      });
      setUserState(updated);
      setUser(updated);
      toast.success("Notification preferences saved.");
    } finally {
      setSavingNotif(false);
    }
  }

  async function handlePreferencesSubmit(prefs: Pick<UserPreferences, "language" | "timezone">) {
    setSavingPrefs(true);
    try {
      const updated = await updateProfile({
        preferences: { ...user?.preferences, ...prefs } as UserPreferences,
      });
      setUserState(updated);
      setUser(updated);
      toast.success("Preferences saved.");
    } finally {
      setSavingPrefs(false);
    }
  }

  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "U";
  const initial = displayName.charAt(0).toUpperCase();

  if (loading && !user) {
    return (
      <PageContainer title="Profile">
        <p className="text-text-secondary">Loading…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Profile">
      <div className="w-full">
        {/* Tab navigation */}
        <nav
          className="mb-6 flex flex-nowrap gap-1 overflow-x-auto border-b border-border"
          aria-label="Profile sections"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:border-border hover:text-text-primary"
                )}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {activeTab === "basic" && (
            <AppCard className="rounded-xl p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-text-secondary">
                    {initial}
                  </div>
                )}
                <div>
                  <p className="font-medium text-text-primary">{displayName}</p>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                </div>
              </div>
              <BasicInfoForm user={user} onSubmit={handleBasicInfoSubmit} loading={savingBasic} />
            </AppCard>
          )}

          {activeTab === "account" && (
            <AppCard className="rounded-xl max-w-3xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-text-primary mb-2">Account information</h2>
              <p className="text-sm text-text-secondary mb-4">Read-only. Managed by your administrator.</p>
              <AccountInfoSection user={user} />
            </AppCard>
          )}

          {activeTab === "sessions" && <SessionsSection />}

          {activeTab === "security" && (
            <section>
              <PasswordForm onSuccess={() => toast.success("Password changed.")} />
            </section>
          )}

          {activeTab === "notifications" && (
            <NotificationPreferencesForm
              preferences={user?.preferences}
              onSubmit={handleNotificationPrefsSubmit}
              loading={savingNotif}
            />
          )}

          {activeTab === "preferences" && (
            <PreferencesForm
              preferences={user?.preferences}
              onSubmit={handlePreferencesSubmit}
              loading={savingPrefs}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
