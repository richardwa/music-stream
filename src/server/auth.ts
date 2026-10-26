import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Simple cookie-based login.
 *
 * Enabled when LOGIN_PASSWORD is set (LOGIN_USER defaults to "admin").
 * Without LOGIN_PASSWORD the app is open, as before.
 */
export const authUser = () => process.env.LOGIN_USER ?? "admin";

export const authEnabled = () => process.env.LOGIN_PASSWORD != null;

const sign = (value: string) =>
  crypto
    .createHmac("sha256", process.env.LOGIN_PASSWORD ?? "")
    .update(value)
    .digest("hex");

const tokenFor = (user: string) =>
  `${Buffer.from(user).toString("base64url")}.${sign(user)}`;

const verifyToken = (token: string | undefined): string | null => {
  if (!token) return null;
  const [b64, mac] = token.split(".");
  if (!b64 || !mac) return null;
  const user = Buffer.from(b64, "base64url").toString();
  const expected = sign(user);
  if (
    mac.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  ) {
    return user;
  }
  return null;
};

const checkCredentials = (user: string, password: string) => {
  const expected = process.env.LOGIN_PASSWORD ?? "";
  return (
    user === authUser() &&
    password.length === expected.length &&
    password.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected))
  );
};

export const createAuthCookie = (res: Response, user: string) => {
  res.cookie("auth", tokenFor(user), {
    httpOnly: true,
    // @ts-ignore sameSite is missing from the CookieOptions type
    sameSite: "strict",
  });
};

export const clearAuthCookie = (res: Response) => res.clearCookie("auth");

const cookieUser = (req: Request): string | null => {
  const header = req.headers.cookie;
  if (!header) return null;
  const token = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("auth="))
    ?.slice(5);
  return verifyToken(token ? decodeURIComponent(token) : undefined);
};

/** Express middleware rejecting requests without a valid session cookie. */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!authEnabled()) return next();
  // login/logout manage the session itself and must stay reachable
  if (req.path === "/login" || req.path === "/logout") return next();
  if (cookieUser(req) != null) return next();
  res.status(401).json({ error: "unauthorized" });
};

/** ServerApi login implementation. */
export const login = (user: string, password: string) => {
  if (!authEnabled() || checkCredentials(user, password)) {
    return { ok: true, user: authUser() };
  }
  return { ok: false };
};
