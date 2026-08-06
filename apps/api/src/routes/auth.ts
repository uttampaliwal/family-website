import { randomUUID } from "node:crypto";
import { Hono } from "hono";
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
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.js";
import { csrfProtection, originCheck, rateLimit } from "../middleware/security.js";
import {
  clearAuthCookies,
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
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { toUserPayload } from "../lib/payloads.js";
import { validateBody } from "../lib/validation.js";
import { notifyAdmins } from "../lib/notifications.js";
import { User as UserModel, type UserDocument } from "../models/user.js";

const AUTH_RATE = {
  login: rateLimit({ windowMs: 60_000, max: 8, name: "login" }),
  register: rateLimit({ windowMs: 15 * 60_000, max: 6, name: "register" }),
  verify: rateLimit({ windowMs: 15 * 60_000, max: 10, name: "verify" }),
  forgot: rateLimit({ windowMs: 15 * 60_000, max: 5, name: "forgot" }),
  general: rateLimit({ windowMs: 60_000, max: 60, name: "auth-general" }),
};

export const authRoutes = new Hono();

authRoutes.use("*", originCheck);
authRoutes.use("*", AUTH_RATE.general);

// CSRF token endpoint — primes the double-submit cookie for the login page
authRoutes.get("/csrf-token", (c) => {
  setCsrfCookie(c, generateRandomToken());
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
      throw new AppError(409, "ACCOUNT_EXISTS", "Email or username already in use");
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

    await sendMail({
      to: user.email,
      subject: "Verify your email — Kulaya",
      text: `Welcome to Kulaya! Verify your email: ${buildEmailLink("/verify-email", { token: verificationToken })}`,
      html: `<p>Welcome to <strong>Kulaya</strong>!</p><p><a href="${buildEmailLink("/verify-email", { token: verificationToken })}">Verify your email</a></p>`,
    });

    void notifyAdmins({
      type: "member_joined",
      actorId: user._id.toString(),
      actorName: user.name,
      body: input.username,
      link: "/admin/approvals",
    });

    return c.json(
      {
        message: "Registration successful — check your email to verify your account",
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
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (!user.isVerified) {
      throw new AppError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Please verify your email before signing in",
      );
    }
    if (user.adminApprovalStatus === "pending") {
      throw new AppError(
        403,
        "PENDING_APPROVAL",
        "Your account is awaiting approval by an administrator",
      );
    }
    if (user.adminApprovalStatus === "rejected") {
      throw new AppError(403, "ACCESS_REJECTED", "Access was not granted");
    }

    const { accessToken, refreshToken } = await issueSession(user);
    setRefreshCookie(c, refreshToken);
    setCsrfCookie(c, generateRandomToken());

    return c.json({ user: toUserPayload(user), accessToken });
  },
);

// ─── Session helpers ────────────────────────────────────────────────

async function issueSession(user: UserDocument) {
  const accessToken = await signAccessToken(user._id.toString());
  const jti = randomUUID();
  const refreshToken = await signRefreshToken(user._id.toString(), jti);

  const hashes = [...user.refreshTokenHashes, sha256(jti)];
  while (hashes.length > env.AUTH_MAX_ACTIVE_SESSIONS) hashes.shift();
  user.refreshTokenHashes = hashes;
  await user.save();

  return { accessToken, refreshToken, jti };
}

// ─── Refresh ────────────────────────────────────────────────────────

authRoutes.post(
  "/refresh",
  AUTH_RATE.general,
  csrfProtection,
  async (c) => {
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

    const tokenHash = sha256(payload.jti);
    const index = user.refreshTokenHashes.indexOf(tokenHash);
    if (index === -1) {
      // Token reuse detected — revoke every session for this account.
      user.refreshTokenHashes = [];
      await user.save();
      clearAuthCookies(c);
      throw new AppError(401, "SESSION_REVOKED", "Session was revoked");
    }

    user.refreshTokenHashes.splice(index, 1);
    await user.save();

    const { accessToken, refreshToken } = await issueSession(user);
    setRefreshCookie(c, refreshToken);
    setCsrfCookie(c, generateRandomToken());

    return c.json({ user: toUserPayload(user), accessToken });
  },
);

// ─── Logout ─────────────────────────────────────────────────────────

authRoutes.post("/logout", csrfProtection, async (c) => {
  const token = readCookie(c, REFRESH_COOKIE);
  if (token) {
    const payload = await verifyRefreshToken(token).catch(() => null);
    if (payload) {
      const user = await UserModel.findById(payload.sub);
      if (user) {
        const hash = sha256(payload.jti);
        user.refreshTokenHashes = user.refreshTokenHashes.filter((h) => h !== hash);
        await user.save();
      }
    }
  }
  clearAuthCookies(c);
  return c.json({ ok: true });
});

// ─── Me ─────────────────────────────────────────────────────────────

authRoutes.get("/me", async (c) => {
  const header = c.req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue");

  const payload = await verifyAccessToken(token);
  if (!payload) throw new AppError(401, "UNAUTHORIZED", "Session expired");

  const user = await UserModel.findById(payload.sub);
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
      throw new AppError(400, "INVALID_TOKEN", "Verification link is invalid or expired");
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

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
      return c.json({ message: "If the account exists, a verification link has been sent" });
    }

    const token = generateRandomToken();
    user.verificationTokenHash = sha256(token);
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Verify your email — Kulaya",
      text: `Verify your email: ${buildEmailLink("/verify-email", { token })}`,
      html: `<p><a href="${buildEmailLink("/verify-email", { token })}">Verify your email</a></p>`,
    });

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
      return c.json({ message: "If the account exists, a reset link has been sent" });
    }

    const token = generateRandomToken();
    user.resetPasswordTokenHash = sha256(token);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Reset your password — Kulaya",
      text: `Reset your password: ${buildEmailLink("/reset-password", { token })}`,
      html: `<p><a href="${buildEmailLink("/reset-password", { token })}">Reset your password</a></p>`,
    });

    return c.json({ message: "If the account exists, a reset link has been sent" });
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
      throw new AppError(400, "INVALID_TOKEN", "Reset link is invalid or expired");
    }

    user.passwordHash = await hashPassword(password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokenHashes = [];
    await user.save();

    return c.json({ message: "Password updated — you can now sign in" });
  },
);

// ─── Change password (authenticated) ────────────────────────────────

authRoutes.post(
  "/change-password",
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
      throw new AppError(400, "WRONG_PASSWORD", "Current password is incorrect");
    }

    user.passwordHash = await hashPassword(newPassword);
    user.refreshTokenHashes = [];
    await user.save();
    clearAuthCookies(c);

    return c.json({ message: "Password changed — please sign in again" });
  },
);