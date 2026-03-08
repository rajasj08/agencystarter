/**
 * Shared constants for token-based auth links (verification, reset password, invitation).
 * Keeps sample tokens and unified card copy in one place.
 */

/** Tokens used in email template sample links; show "Sample link" card instead of calling API or showing form. */
export const SAMPLE_LINK_TOKENS = new Set(["xyz789", "abc123", "invite123"]);

export function isSampleLinkToken(token: string | null): boolean {
  return !!token && SAMPLE_LINK_TOKENS.has(token);
}

/** Unified copy for auth link status cards */
export const AUTH_LINK_COPY = {
  loading: {
    message: "Checking link…",
  },
  sampleLink: {
    title: "Sample link",
    message:
      "This is a sample link from an email template or preview. Use the link from your actual email to continue.",
  },
  invalidOrExpired: {
    title: "Invalid or expired link",
    message:
      "This link is invalid or has expired. Use the link from your email, or request a new one.",
  },
  /** Verification-specific */
  verification: {
    invalid: {
      title: "Verification link invalid",
      message:
        "This link is invalid. Use the link from your verification email, or try logging in if you've already verified.",
    },
    expired: {
      title: "Verification link expired",
      message:
        "This verification link has expired or was already used. Try logging in if you've already verified, or register again to get a new link.",
    },
    success: {
      title: "Email verified",
      message: "Your email has been verified. You can now log in to your account.",
    },
  },
  /** Reset password / invitation (same flow) */
  resetPassword: {
    invalid: {
      title: "Invalid or expired link",
      message:
        "This password reset link is invalid or has expired. Request a new link to set a new password.",
    },
    expiredAfterSubmit: {
      title: "Link expired or already used",
      message:
        "This password reset link has expired or has already been used. Request a new link to try again.",
    },
    success: {
      title: "Password reset",
      message: "Your password has been reset. You can now sign in.",
    },
    noToken: {
      title: "Invalid link",
      message:
        "Missing or invalid reset token. Use the link from your password reset email, or request a new one.",
    },
  },
} as const;
