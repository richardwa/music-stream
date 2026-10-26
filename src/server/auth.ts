import crypto from "crypto";
import type { ServerApi } from "../common/interface";

/**
 * Enabled when LOGIN_PASSWORD is set (LOGIN_USER defaults to "admin").
 * Without LOGIN_PASSWORD the app is open, as before.
 */
export const authEnabled = () => process.env.LOGIN_PASSWORD != null;

/**
 * Auth built on solid-vanilla-server middleware:
 * - `configureApi` wires up logging, POST /api/login and Basic auth for the API
 * - `checkCredentials` is backed by the LOGIN_PASSWORD env var
 *   (LOGIN_USER defaults to "admin"). Without LOGIN_PASSWORD the app is open.
 */

export const authUser = () => process.env.LOGIN_USER ?? "admin";

/** solid-vanilla checkCredentials implementation backed by LOGIN_PASSWORD. */
export const authCheckCredentials = (login: string, password: string) => {
  const expected = process.env.LOGIN_PASSWORD ?? "";
  if (!authEnabled()) return true; // open mode: any login accepted
  return (
    login === authUser() &&
    password.length === expected.length &&
    password.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected))
  );
};

const apiImpl = (
  impl: ServerApi,
): Record<string, (...args: never[]) => Promise<unknown>> => {
  const { login: _login, logout: _logout, ...rest } = impl;
  return rest;
};

/** Configure solid-vanilla's API middleware for the given ServerApi impl. */
export const solidVanillaApiConfig = (impl: ServerApi) => ({
  serverImpl: apiImpl(impl),
  checkCredentials: async (login: string, password: string) =>
    authCheckCredentials(login, password),
  // when auth is disabled, serve everything anonymously
  anonymous: authEnabled() ? [] : Object.keys(apiImpl(impl)),
});
