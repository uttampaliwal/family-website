import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  username,
  verifyEmailSchema,
} from "@family/core";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { clientInfo, recordAudit } from "../lib/audit.js";
import {
  clearAuthCookies,
  createCsrfToken,
  generateRandomToken,
  readCookie,
  REFRESH_COOKIE,
  setCsrfCookie,
  setRefreshCookie,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/auth.js";
import { buildEmailLink, sendMail } from "../lib/email.js";
import { notifyAdmins } from "../lib/notifications.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { toUserPayload } from "../lib/payloads.js";
import { validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import {
  csrfProtection,
  originCheck,
  rateLimit,
  requireApprovedAuth,
} from "../middleware/security.js";
import { User as UserModel, type UserDocument } from "../models/user.js";

const AUTH_RATE = {
  login: rateLimit({ windowMs: 60_000, max: 8, name: "login" }),
  register: rateLimit({ windowMs: 15 * 60_000, max: 6, name: "register" }),
  verify: rateLimit({ windowMs: 15 * 60_000, max: 10, name: "verify" }),
  forgot: rateLimit({ windowMs: 15 * 60_000, max: 5, name: "forgot" }),
  // Authenticated but sensitive: bounds current-password guessing.
  changePassword: rateLimit({
    windowMs: 15 * 60_000,
    max: 20,
    name: "change-password",
  }),
  general: rateLimit({ windowMs: 60_000, max: 60, name: "auth-general" }),
};

export const authRoutes = new Hono();

authRoutes.use("*", originCheck);
authRoutes.use("*", AUTH_RATE.general);

// CSRF token endpoint — primes the double-submit cookie for the login page
authRoutes.get("/csrf-token", (c) => {
  setCsrfCookie(c, createCsrfToken());
  return c.json({ ok: true });
});

// Username availability — live check for the register form.
authRoutes.get("/check-username", async (c) => {
  const raw = c.req.query("username") ?? "";
  const parsed = username.safeParse(raw);
  if (!parsed.success) {
    return c.json({
      valid: false,
      available: false,
      issues: parsed.error.issues.map((i) => i.message),
    });
  }
  const exists = await UserModel.exists({ username: parsed.data });
  return c.json({ valid: true, available: !exists });
});

// ─── Register ───────────────────────────────────────────────────────

authRoutes.post(
  "/register",
  AUTH_RATE.register,
  csrfProtection,
  validateBody(registerSchema),
  async (c) => {
    const input = c.req.valid("json");

    const existing = await UserModel.exists({
      $or: [{ email: input.email }, { username: input.username }],
    });
    if (existing) {
      throw new AppError(
        409,
        "ACCOUNT_EXISTS",
        "Email or username already in use",
      );
    }

    const verificationToken = generateRandomToken();
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      username: input.username,
      passwordHash: await hashPassword(input.password),
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      relationship: input.relationship ?? null,
      phoneNumber: input.phoneNumber || undefined,
      verificationTokenHash: sha256(verificationToken),
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const emailSent = await sendMail({
      to: user.email,
      subject: "Verify your email — Kulaya",
      text: `Welcome to Kulaya! Verify your email: ${buildEmailLink("/verify-email", { token: verificationToken })}`,
      html: `<p>Welcome to <strong>Kulaya</strong>!</p><p><a href="${buildEmailLink("/verify-email", { token: verificationToken })}">Verify your email</a></p>`,
    });
    if (!emailSent) {
      await recordAudit({
        actorId: user._id.toString(),
        action: "EMAIL_DELIVERY_FAILED",
        targetType: "user",
        targetId: user._id.toString(),
        details: { kind: "verification", username: user.username },
        ...clientInfo(c),
      });
    }

    await recordAudit({
      actorId: user._id.toString(),
      action: "REGISTER",
      targetType: "user",
      targetId: user._id.toString(),
      details: { username: user.username },
      ...clientInfo(c),
    });

    // Awaited (not fire-and-forget): the 201 response must only go out once
    // the admin notification is persisted, otherwise readers race the write
    // under load and the join notification is intermittently missing.
    await notifyAdmins({
      type: "member_joined",
      actorId: user._id.toString(),
      actorName: user.name,
      body: input.username,
      link: "/admin/approvals",
    });

    return c.json(
      {
        message: emailSent
          ? "Registration successful — check your email to verify your account"
          : "Account created, but the verification email failed to send — request a new link from the login page",
      },
      201,
    );
  },
);

// ─── Login ──────────────────────────────────────────────────────────

authRoutes.post(
  "/login",
  AUTH_RATE.login,
  csrfProtection,
  validateBody(loginSchema),
  async (c) => {
    const input = c.req.valid("json");

    const user = await UserModel.findOne({
      $or: [{ email: input.email }, { username: input.email }],
    });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      await recordAudit({
        action: "LOGIN_FAILED",
        details: { identifier: input.email, reason: "INVALID_CREDENTIALS" },
        ...clientInfo(c),
      });
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password",
      );
    }

    if (!user.isVerified) {
      await recordAudit({
        actorId: user._id.toString(),
        action: "LOGIN_FAILED",
        details: { identifier: input.email, reason: "EMAIL_NOT_VERIFIED" },
        ...clientInfo(c),
      });
      throw new AppError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Please verify your email before signing in",
      );
    }
    if (user.adminApprovalStatus === "pending") {
      await recordAudit({
        actorId: user._id.toString(),
        action: "LOGIN_FAILED",
        details: { identifier: input.email, reason: "PENDING_APPROVAL" },
        ...clientInfo(c),
      });
      throw new AppError(
        403,
        "PENDING_APPROVAL",
        "Your account is awaiting approval by an administrator",
      );
    }
    if (user.adminApprovalStatus === "rejected") {
      await recordAudit({
        actorId: user._id.toString(),
        action: "LOGIN_FAILED",
        details: { identifier: input.email, reason: "ACCESS_REJECTED" },
        ...clientInfo(c),
      });
      throw new AppError(403, "ACCESS_REJECTED", "Access was not granted");
    }
    if (user.adminApprovalStatus === "suspended") {
      await recordAudit({
        actorId: user._id.toString(),
        action: "LOGIN_FAILED",
        details: { identifier: input.email, reason: "ACCESS_SUSPENDED" },
        ...clientInfo(c),
      });
      throw new AppError(
        403,
        "ACCESS_SUSPENDED",
        "Your account has been suspended",
      );
    }

    const { accessToken, refreshToken } = await issueSession(user);
    setRefreshCookie(c, refreshToken);
    setCsrfCookie(c, createCsrfToken());

    await recordAudit({
      actorId: user._id.toString(),
      action: "LOGIN_SUCCESS",
      targetType: "user",
      targetId: user._id.toString(),
      details: { identifier: input.email },
      ...clientInfo(c),
    });

    return c.json({ user: toUserPayload(user), accessToken });
  },
);

// ─── Session helpers ────────────────────────────────────────────────

/** Replay grace for a superseded refresh JTI — tight on purpose. */
const REFRESH_GRACE_MS = 10_000;

async function issueSession(user: UserDocument) {
  const accessToken = await signAccessToken(
    user._id.toString(),
    user.authVersion,
  );
  const jti = randomUUID();
  const refreshToken = await signRefreshToken(user._id.toString(), jti);

  user.refreshSessions.push({ jtiHash: sha256(jti), createdAt: new Date() });
  while (user.refreshSessions.length > env.AUTH_MAX_ACTIVE_SESSIONS) {
    user.refreshSessions.shift();
  }
  await user.save();

  return { accessToken, refreshToken, jti };
}

/**
 * Clears every refresh session (family + legacy) and bumps the security
 * version so outstanding access tokens die immediately. Single-document
 * save: membership/authVersion/session state move together or fail closed.
 */
async function revokeAllSessions(user: UserDocument): Promise<void> {
  user.refreshTokenHashes = [];
  user.refreshSessions = [];
  user.authVersion += 1;
  await user.save();
}

type RotationOutcome =
  { status: "rotated" } | { status: "replay" } | { status: "reuse" };

/**
 * Single-flight-safe rotation over the session family:
 * - presented hash matches a session's current JTI → rotate (old JTI gets a
 *   ≤10s replay grace; no new branch is created on replay).
 * - presented hash matches a superseded JTI inside its grace window →
 *   "replay": caller must answer 401 SESSION_ROTATED WITHOUT wiping (the
 *   losing tab retries with the already-rotated cookie).
 * - presented hash matches a legacy pre-P1 hash → adopt into a session
 *   record, then rotate normally (one-time migration).
 * - anything else (unknown, or grace expired) → "reuse": token theft
 *   semantics, wipe everything.
 */
function rotateRefreshSession(
  user: UserDocument,
  presentedHash: string,
  newJti: string,
): RotationOutcome {
  const now = new Date();

  const current = user.refreshSessions.find((s) => s.jtiHash === presentedHash);
  if (current) {
    current.prevJtiHash = current.jtiHash;
    current.prevValidUntil = new Date(now.getTime() + REFRESH_GRACE_MS);
    current.jtiHash = sha256(newJti);
    return { status: "rotated" };
  }

  const replayed = user.refreshSessions.find(
    (s) =>
      s.prevJtiHash === presentedHash &&
      s.prevValidUntil &&
      s.prevValidUntil > now,
  );
  if (replayed) return { status: "replay" };

  const legacyIndex = user.refreshTokenHashes.indexOf(presentedHash);
  if (legacyIndex !== -1) {
    user.refreshTokenHashes.splice(legacyIndex, 1);
    user.refreshSessions.push({
      jtiHash: sha256(newJti),
      prevJtiHash: presentedHash,
      prevValidUntil: new Date(now.getTime() + REFRESH_GRACE_MS),
      createdAt: now,
    });
    while (user.refreshSessions.length > env.AUTH_MAX_ACTIVE_SESSIONS) {
      user.refreshSessions.shift();
    }
    return { status: "rotated" };
  }

  return { status: "reuse" };
}

// ─── Refresh ────────────────────────────────────────────────────────

authRoutes.post("/refresh", AUTH_RATE.general, csrfProtection, async (c) => {
  const token = readCookie(c, REFRESH_COOKIE);
  if (!token) throw new AppError(401, "UNAUTHORIZED", "No active session");

  const payload = await verifyRefreshToken(token);
  if (!payload) {
    clearAuthCookies(c);
    throw new AppError(401, "UNAUTHORIZED", "Session expired");
  }

  const user = await UserModel.findById(payload.sub);
  if (!user) {
    clearAuthCookies(c);
    throw new AppError(401, "UNAUTHORIZED", "Account not found");
  }

  // Fail closed: rejected/suspended/unverified accounts cannot mint new
  // access tokens, even with a live refresh cookie.
  if (!user.isVerified) {
    clearAuthCookies(c);
    throw new AppError(403, "EMAIL_NOT_VERIFIED", "Please verify your email");
  }
  if (user.adminApprovalStatus !== "approved") {
    clearAuthCookies(c);
    throw new AppError(403, "ACCESS_REVOKED", "Your access has been revoked");
  }

  const newJti = randomUUID();
  const outcome = rotateRefreshSession(user, sha256(payload.jti), newJti);
  if (outcome.status === "reuse") {
    // Token reuse detected — revoke every session for this account.
    await revokeAllSessions(user);
    clearAuthCookies(c);
    throw new AppError(401, "SESSION_REVOKED", "Session was revoked");
  }
  if (outcome.status === "replay") {
    // Losing side of a legitimate multi-tab race: do NOT wipe. The client
    // retries with the already-rotated cookie.
    throw new AppError(
      401,
      "SESSION_ROTATED",
      "Session already refreshed — retry",
    );
  }
  await user.save();

  const accessToken = await signAccessToken(
    user._id.toString(),
    user.authVersion,
  );
  const refreshToken = await signRefreshToken(user._id.toString(), newJti);
  setRefreshCookie(c, refreshToken);
  setCsrfCookie(c, createCsrfToken());

  return c.json({ user: toUserPayload(user), accessToken });
});

// ─── Logout ─────────────────────────────────────────────────────────

authRoutes.post("/logout", csrfProtection, async (c) => {
  const token = readCookie(c, REFRESH_COOKIE);
  let actorId: string | undefined;
  if (token) {
    const payload = await verifyRefreshToken(token).catch(() => null);
    if (payload) {
      actorId = payload.sub;
      const user = await UserModel.findById(payload.sub);
      if (user) {
        // Kill both the current and the grace-window previous JTI.
        const hash = sha256(payload.jti);
        user.refreshTokenHashes = user.refreshTokenHashes.filter(
          (h) => h !== hash,
        );
        user.refreshSessions = user.refreshSessions.filter(
          (s) => s.jtiHash !== hash && s.prevJtiHash !== hash,
        );
        await user.save();
      }
    }
  }
  await recordAudit({
    actorId,
    action: "LOGOUT",
    ...clientInfo(c),
  });
  clearAuthCookies(c);
  return c.json({ ok: true });
});

// ─── Me ─────────────────────────────────────────────────────────────

authRoutes.get("/me", requireApprovedAuth, async (c) => {
  const user = await UserModel.findById(c.get("userId"));
  if (!user) throw new AppError(401, "UNAUTHORIZED", "Account not found");

  return c.json({ user: toUserPayload(user) });
});

// ─── Email verification ─────────────────────────────────────────────

authRoutes.post(
  "/verify-email",
  AUTH_RATE.verify,
  csrfProtection,
  validateBody(verifyEmailSchema),
  async (c) => {
    const { token } = c.req.valid("json");
    const user = await UserModel.findOne({
      verificationTokenHash: sha256(token),
      verificationTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new AppError(
        400,
        "INVALID_TOKEN",
        "Verification link is invalid or expired",
      );
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    await recordAudit({
      actorId: user._id.toString(),
      action: "EMAIL_VERIFIED",
      targetType: "user",
      targetId: user._id.toString(),
      ...clientInfo(c),
    });

    return c.json({ message: "Email verified — you can now sign in" });
  },
);

authRoutes.post(
  "/resend-verification",
  AUTH_RATE.verify,
  csrfProtection,
  validateBody(resendVerificationSchema),
  async (c) => {
    const { email } = c.req.valid("json");
    const user = await UserModel.findOne({ email });
    if (!user || user.isVerified) {
      return c.json({
        message: "If the account exists, a verification link has been sent",
      });
    }

    const token = generateRandomToken();
    user.verificationTokenHash = sha256(token);
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const emailSent = await sendMail({
      to: user.email,
      subject: "Verify your email — Kulaya",
      text: `Verify your email: ${buildEmailLink("/verify-email", { token })}`,
      html: `<p><a href="${buildEmailLink("/verify-email", { token })}">Verify your email</a></p>`,
    });
    if (!emailSent) {
      await recordAudit({
        actorId: user._id.toString(),
        action: "EMAIL_DELIVERY_FAILED",
        targetType: "user",
        targetId: user._id.toString(),
        details: { kind: "verification-resend" },
        ...clientInfo(c),
      });
      throw new AppError(
        502,
        "EMAIL_DELIVERY_FAILED",
        "Couldn't send the verification email — please try again",
      );
    }

    return c.json({ message: "Verification link sent" });
  },
);

// ─── Password reset ─────────────────────────────────────────────────

authRoutes.post(
  "/forgot-password",
  AUTH_RATE.forgot,
  csrfProtection,
  validateBody(forgotPasswordSchema),
  async (c) => {
    const { email } = c.req.valid("json");
    const user = await UserModel.findOne({ email });
    if (!user) {
      return c.json({
        message: "If the account exists, a reset link has been sent",
      });
    }

    const token = generateRandomToken();
    user.resetPasswordTokenHash = sha256(token);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await recordAudit({
      action: "PASSWORD_RESET_REQUESTED",
      targetType: "user",
      targetId: user._id.toString(),
      details: { email },
      ...clientInfo(c),
    });

    const emailSent = await sendMail({
      to: user.email,
      subject: "Reset your password — Kulaya",
      text: `Reset your password: ${buildEmailLink("/reset-password", { token })}`,
      html: `<p><a href="${buildEmailLink("/reset-password", { token })}">Reset your password</a></p>`,
    });
    if (!emailSent) {
      // Generic response preserved (anti-enumeration); the failure is
      // audited for operators instead of being silently swallowed.
      await recordAudit({
        action: "EMAIL_DELIVERY_FAILED",
        targetType: "user",
        targetId: user._id.toString(),
        details: { kind: "password-reset", email },
        ...clientInfo(c),
      });
    }

    return c.json({
      message: "If the account exists, a reset link has been sent",
    });
  },
);

authRoutes.post(
  "/reset-password",
  AUTH_RATE.forgot,
  csrfProtection,
  validateBody(resetPasswordSchema),
  async (c) => {
    const { token, password } = c.req.valid("json");
    const user = await UserModel.findOne({
      resetPasswordTokenHash: sha256(token),
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new AppError(
        400,
        "INVALID_TOKEN",
        "Reset link is invalid or expired",
      );
    }

    user.passwordHash = await hashPassword(password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokenHashes = [];
    user.refreshSessions = [];
    user.authVersion += 1;
    await user.save();

    await recordAudit({
      actorId: user._id.toString(),
      action: "PASSWORD_RESET",
      targetType: "user",
      targetId: user._id.toString(),
      ...clientInfo(c),
    });

    return c.json({ message: "Password updated — you can now sign in" });
  },
);

// ─── Change password (authenticated) ────────────────────────────────

authRoutes.post(
  "/change-password",
  AUTH_RATE.changePassword,
  csrfProtection,
  validateBody(changePasswordSchema),
  async (c) => {
    const header = c.req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue");

    const payload = await verifyAccessToken(token);
    if (!payload) throw new AppError(401, "UNAUTHORIZED", "Session expired");

    const { currentPassword, newPassword } = c.req.valid("json");
    const user = await UserModel.findById(payload.sub);
    if (!user) throw new AppError(401, "UNAUTHORIZED", "Account not found");

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new AppError(
        400,
        "WRONG_PASSWORD",
        "Current password is incorrect",
      );
    }

    user.passwordHash = await hashPassword(newPassword);
    user.refreshTokenHashes = [];
    user.refreshSessions = [];
    user.authVersion += 1;
    await user.save();
    clearAuthCookies(c);

    await recordAudit({
      actorId: payload.sub,
      action: "PASSWORD_CHANGED",
      targetType: "user",
      targetId: payload.sub,
      ...clientInfo(c),
    });

    return c.json({ message: "Password changed — please sign in again" });
  },
);
