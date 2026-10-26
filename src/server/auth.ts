import crypto from "crypto";
import { parseBasicHeader } from "solid-vanilla-server";
import type { NextFunction, Request, Response } from "express";
import type { ServerApi } from "../common/interface";

/**
 * All auth lives here, on top of solid-vanilla-server middleware:
 *
 * - `configureApi` (routes.ts) applies solid-vanilla's `basicAuth` to every
 *   API route and owns POST /api/login.
 * - `checkCredentials` is the only custom piece: it validates against the
 *   LOGIN_PASSWORD env var (LOGIN_USER defaults to "admin"). Without
 *   LOGIN_PASSWORD the app is open — solid-vanilla has no "disable auth"
 *   switch, so every method is marked anonymous instead.
 * - `streamAuth` protects /stream. It mirrors solid-vanilla's basicAuth but
 *   adds the WWW-Authenticate challenge, which <audio> requests need to
 *   populate the browser's native Basic-auth cache (they can't send headers).
 */

export const authEnabled = () => process.env.LOGIN_PASSWORD != null;

export const authUser = () => process.env.LOGIN_USER ?? "admin";

/** solid-vanilla checkCredentials implementation backed by LOGIN_PASSWORD. */
export const authCheckCredentials = async (
  login: string,
  password: string,
): Promise<boolean> => {
  const expected = process.env.LOGIN_PASSWORD ?? "";
  if (!authEnabled()) return true; // open mode: any login accepted
  return (
    login === authUser() &&
    password.length === expected.length &&
    password.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected))
  );
};

/** API methods handed to solid-vanilla's configureApi (login is owned by it). */
const apiImpl = (
  impl: ServerApi,
): Record<string, (...args: never[]) => Promise<unknown>> => ({ ...impl });

/** Config for solid-vanilla's configureApi middleware. */
export const apiConfig = (impl: ServerApi) => ({
  serverImpl: apiImpl(impl),
  checkCredentials: authCheckCredentials,
  // when auth is disabled, serve everything anonymously
  anonymous: authEnabled() ? [] : Object.keys(apiImpl(impl)),
});

/** solid-vanilla basicAuth + WWW-Authenticate challenge for native prompts. */
export const streamAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!authEnabled()) return next();
  const credentials = parseBasicHeader(req.headers.authorization);
  if (
    credentials &&
    (await authCheckCredentials(credentials.login, credentials.password))
  ) {
    return next();
  }
  res.status(401).set("WWW-Authenticate", 'Basic realm="music-stream"');
  res.json({ error: "not authenticated" });
};
