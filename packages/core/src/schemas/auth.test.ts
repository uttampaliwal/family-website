import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.js";

describe("registerSchema", () => {
  const valid = {
    name: "Aarav Sharma",
    email: "aarav@example.com",
    username: "aarav_s",
    password: "strong-password-123",
    dateOfBirth: "1990-05-20",
    gender: "male",
    relationship: "son",
    phoneNumber: "+919876543210",
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a weak password", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid relationship", () => {
    const result = registerSchema.safeParse({
      ...valid,
      relationship: "cousin-of",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts email or username with a password", () => {
    expect(
      loginSchema.safeParse({
        email: "aarav@example.com",
        password: "x".repeat(8),
      }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: "aarav_s", password: "x".repeat(8) })
        .success,
    ).toBe(true);
  });

  it("rejects a missing password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
  });
});
