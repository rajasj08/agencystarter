"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppCard, AppButton } from "@/components/design";
import { toast } from "@/lib/toast";
import {
  getVariables,
  sendTestEmail,
  type EmailTemplateKey,
  type UpdateTemplateBody,
} from "@/services/emailTemplates";
import { Monitor, Smartphone, Mail, ChevronDown, ChevronUp, X } from "lucide-react";
import { RichEmailEditor, type RichEmailEditorRef } from "@/modules/email/components/RichEmailEditor";

type Base = "superadmin" | "settings";

interface EmailTemplateEditorProps {
  base: Base;
  templateKey: string;
  backHref: string;
  /** Current override if any */
  initialSubject: string;
  initialHtmlBody: string;
  initialTextBody: string | null;
  /** When base is "settings", pass organization name so preview shows it for {{organizationName}}. */
  organizationName?: string | null;
  onSave: (body: UpdateTemplateBody) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EmailTemplateEditor({
  base,
  templateKey,
  backHref,
  initialSubject,
  initialHtmlBody,
  initialTextBody,
  organizationName,
  onSave,
  onDelete,
}: EmailTemplateEditorProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject);
  const [htmlBody, setHtmlBody] = useState(initialHtmlBody);
  const [textBody, setTextBody] = useState(initialTextBody ?? "");
  const [variables, setVariables] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [plainTextOpen, setPlainTextOpen] = useState(false);
  const bodyEditorRef = useRef<RichEmailEditorRef>(null);

  useEffect(() => {
    setSubject(initialSubject);
    setHtmlBody(initialHtmlBody);
    setTextBody(initialTextBody ?? "");
  }, [initialSubject, initialHtmlBody, initialTextBody]);

  useEffect(() => {
    getVariables(base, templateKey).then(setVariables).catch(() => setVariables([]));
  }, [base, templateKey]);

  const SAMPLE_VARS: Record<string, string> = {
    organizationName: organizationName ?? "Acme Corp",
    userName: "John Doe",
    verificationLink: "https://example.com/verify?token=abc",
    resetLink: "https://example.com/reset?token=xyz",
    expiryMinutes: "60",
    setPasswordLink: "https://example.com/set-password?token=inv",
    expiryDisplay: "7 days",
  };

  const previewHtml = (() => {
    let out = htmlBody;
    for (const [k, v] of Object.entries(SAMPLE_VARS)) {
      out = out.replace(new RegExp(`{{${k}}}`, "g"), v);
    }
    return out;
  })();

  // Wrap preview with same font and spacing as editor so they match
  const PREVIEW_FONT_STACK =
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const previewStyles = `
    body { font-family: ${PREVIEW_FONT_STACK}; font-size: 16px; line-height: 1.6; margin: 0; padding: 16px; color: #111827; -webkit-font-smoothing: antialiased; }
    h1 { margin: 0 0 0.4em; font-size: 1.25rem; font-weight: 600; line-height: 1.3; }
    h2 { margin: 0 0 0.4em; font-size: 1.125rem; font-weight: 600; line-height: 1.3; }
    h3 { margin: 0 0 0.4em; font-size: 1rem; font-weight: 600; line-height: 1.3; }
    p { margin: 0 0 1em; }
    p:last-child { margin-bottom: 0; }
    a.email-cta-button { display: inline-block; background: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; }
  `;
  const previewDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${previewStyles}</style></head><body>${previewHtml || "<p>Enter content above.</p>"}</body></html>`;
  const previewSubject = (() => {
    let out = subject;
    for (const [k, v] of Object.entries(SAMPLE_VARS)) {
      out = out.replace(new RegExp(`{{${k}}}`, "g"), v);
    }
    return out;
  })();

  const handleInsertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;
    if (bodyEditorRef.current) {
      bodyEditorRef.current.insertAtCursor(placeholder);
    } else {
      setHtmlBody((prev) => prev + placeholder);
    }
  };

  /** Button-style link: class makes it render as button in editor; style ensures email compatibility when saved. */
  const LINK_BUTTON_CLASS = "email-cta-button";
  const LINK_BUTTON_STYLE =
    "display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;";
  const VARIABLE_LINKS: { variable: string; label: string; linkText: string }[] = [
    { variable: "verificationLink", label: "Verification link button", linkText: "Verify email" },
    { variable: "resetLink", label: "Reset link button", linkText: "Reset password" },
    { variable: "setPasswordLink", label: "Set password link button", linkText: "Set your password" },
  ];
  const handleInsertLinkVariable = (variable: string, linkText: string) => {
    const href = `{{${variable}}}`;
    const html = `<a href="${href}" class="${LINK_BUTTON_CLASS}" style="${LINK_BUTTON_STYLE}">${linkText}</a>`;
    if (bodyEditorRef.current?.insertHtml) {
      bodyEditorRef.current.insertHtml(html);
    } else {
      setHtmlBody((prev) => prev + html);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        subject,
        htmlBody,
        textBody: textBody.trim() || null,
      });
      toast.success("Template saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("Remove override and revert to default?")) return;
    setDeleting(true);
    try {
      await onDelete();
      toast.success("Reverted to default");
      router.push(backHref);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }
    setSendingTest(true);
    try {
      await sendTestEmail(base, { templateKey: templateKey as EmailTemplateKey, email: testEmail.trim() });
      toast.success("Test email sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      {/* Main: compose area */}
      <div className="min-w-0 flex-1 space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm lg:p-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground">
            Compose
          </h2>
          <p className="mb-6 text-base text-muted-foreground">
            Subject and body are used when this template is sent. Click a variable above the editor to insert it at the cursor.
          </p>

          <div className="space-y-5">
            <div>
              <label htmlFor="email-subject" className="mb-1.5 block text-base font-medium text-foreground">
                Subject line
              </label>
              <input
                id="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Verify your email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-base font-medium text-foreground">
                Variables
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {variables.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No variables for this template.</span>
                ) : (
                  variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))
                )}
              </div>
              {VARIABLE_LINKS.some((l) => variables.includes(l.variable)) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="mr-1 self-center text-sm text-muted-foreground">Insert link button:</span>
                  {VARIABLE_LINKS.filter((l) => variables.includes(l.variable)).map((l) => (
                    <button
                      key={l.variable}
                      type="button"
                      onClick={() => handleInsertLinkVariable(l.variable, l.linkText)}
                      className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-base font-medium text-foreground">
                Body
              </label>
              <div className="w-full rounded-lg border border-border bg-background/50 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <RichEmailEditor
                  ref={bodyEditorRef}
                  value={htmlBody}
                  onChange={setHtmlBody}
                  placeholder="Write your email content. Format with the toolbar; click variables above to insert placeholders."
                  maxWidth="100%"
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Optional: plain text fallback (collapsible) */}
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setPlainTextOpen((o) => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/50"
            aria-expanded={plainTextOpen}
          >
            <span className="text-base font-medium text-foreground">Plain text fallback (optional)</span>
            {plainTextOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {plainTextOpen && (
            <div className="border-t border-border px-6 pb-6 pt-4">
              <textarea
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Plain text version for clients that don’t support HTML"
              />
            </div>
          )}
        </section>

      </div>

      {/* Sidebar: actions + test email (sticky on large screens) */}
      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-80">
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <AppButton onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save template"}
            </AppButton>
            <AppButton variant="outline" onClick={() => setPreviewOpen(true)} className="w-full">
              <Monitor className="mr-1.5 h-4 w-4" />
              Preview
            </AppButton>
            {onDelete && (
              <AppButton variant="outline" onClick={handleDelete} disabled={deleting} className="w-full">
                {deleting ? "Reverting…" : "Reset to default"}
              </AppButton>
            )}
          </div>

          <AppCard className="overflow-hidden p-0">
            <div className="border-b border-border bg-muted/30 px-4 py-3">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Mail className="h-5 w-5 text-muted-foreground" />
                Send test email
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Receive a sample with current content
              </p>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <AppButton
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={sendingTest}
                  className="w-full"
                >
                  {sendingTest ? "Sending…" : "Send test"}
                </AppButton>
              </div>
            </div>
          </AppCard>
        </div>
      </aside>

      {/* Preview modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Email preview"
          onClick={(e) => e.target === e.currentTarget && setPreviewOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-lg font-semibold text-foreground">Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-colors ${previewDevice === "desktop" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  <Monitor className="h-4 w-4" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-colors ${previewDevice === "mobile" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="ml-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <div
                className="mx-auto overflow-hidden rounded-lg border border-border bg-white shadow-inner"
                style={{
                  width: previewDevice === "mobile" ? "360px" : "600px",
                  maxWidth: "100%",
                }}
              >
                <div className="border-b border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                  <span className="font-medium">Subject:</span> {previewSubject || "(empty)"}
                </div>
                <iframe
                  title="Email preview"
                  srcDoc={previewDoc}
                  className="block border-0"
                  style={{
                    width: previewDevice === "mobile" ? "360px" : "600px",
                    minHeight: "400px",
                    maxWidth: "100%",
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
