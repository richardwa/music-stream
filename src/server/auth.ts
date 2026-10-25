/**
 * Optional OpenID Connect authentication.
 *
 * Auth is entirely optional: when OIDC_CLIENT_ID / OIDC_CLIENT_SECRET are not
 * configured the server runs without any login. When they are set, users can
 * log in via the issuer at OIDC_ISSUER (default https://auth.mangosplit.com).
 * Set OIDC_REQUIRE_LOGIN=true to make the API and /stream require a session.
 */
import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  ClientSecretPost,
  discovery,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";
import crypto from "crypto";
import type { AuthUser } from "../common/interface";

type UserInfo = AuthUser;

export type AuthConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  requireLogin: boolean;
};

export const authConfig = (): AuthConfig | null => {
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return {
    issuer: process.env.OIDC_ISSUER ?? "https://auth.mangosplit.com",
    clientId,
    clientSecret,
    requireLogin: process.env.OIDC_REQUIRE_LOGIN === "true",
  };
};

const sessions = new Map<string, UserInfo>();
const pending = new Map<
  string,
  { verifier: string; nonce: string; redirectUri: string }
>();

let clientPromise: Promise<unknown> | null = null;

const getClient = async () => {
  const config = authConfig()!;
  if (clientPromise == null) {
    clientPromise = discovery(
      new URL(config.issuer),
      config.clientId,
      config.clientSecret,
      ClientSecretPost(),
    );
  }
  return clientPromise as ReturnType<typeof discovery>;
};

const redirectUri = (req: any): string => {
  if (process.env.OIDC_REDIRECT_URI) return process.env.OIDC_REDIRECT_URI;
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  return `${proto}://${req.headers.host}/auth/callback`;
};

const cookieName = "ms_session";

const setSessionCookie = (res: any, id: string) => {
  res.setHeader(
    "Set-Cookie",
    `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
  );
};

const clearSessionCookie = (res: any) => {
  res.setHeader("Set-Cookie", `${cookieName}=; Path=/; HttpOnly; Max-Age=0`);
};

const sessionUser = (req: any): UserInfo | undefined => {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((c: string) => c.trim())
    .find((c: string) => c.startsWith(`${cookieName}=`));
  if (!cookie) return undefined;
  return sessions.get(cookie.slice(cookieName.length + 1));
};

export const currentUser = (req: any): UserInfo | undefined =>
  authConfig() == null ? undefined : sessionUser(req);

export const authRequired = (req: any): boolean =>
  authConfig()?.requireLogin === true && sessionUser(req) == null;

export const configureAuthRoutes = async (app: any) => {
  const config = authConfig();
  if (config == null) return;

  // Fail fast (but not fatally) if the issuer is unreachable.
  try {
    await getClient();
  } catch (err) {
    console.warn(
      `OIDC discovery failed for ${config.issuer}, login disabled:`,
      (err as Error).message,
    );
    return;
  }

  app.get("/auth/login", async (req: any, res: any) => {
    try {
      const client = await getClient();
      const verifier = randomPKCECodeVerifier();
      const state = randomState();
      const nonce = crypto.randomUUID();
      pending.set(state, {
        verifier,
        nonce,
        redirectUri: redirectUri(req),
      });
      setSessionCookie(
        res,
        `pending_${state}`, // placeholder cookie so browser carries nothing sensitive
      );
      const url = buildAuthorizationUrl(client, {
        redirect_uri: redirectUri(req),
        scope: "openid profile email",
        state,
        nonce,
        code_challenge: verifier,
        code_challenge_method: "S256",
      });
      res.redirect(url.href);
    } catch (err) {
      res.status(500).send(`Login failed: ${(err as Error).message}`);
    }
  });

  app.get("/auth/callback", async (req: any, res: any) => {
    try {
      const client = await getClient();
      const state = (req.query.state as string) ?? "";
      const ctx = pending.get(state);
      if (ctx == null) {
        res.status(400).send("Unknown or expired login attempt");
        return;
      }
      pending.delete(state);
      const currentUrl = new URL(`${ctx.redirectUri}${req.originalUrl}`);
      const tokens = await authorizationCodeGrant(client, currentUrl, {
        pkceCodeVerifier: ctx.verifier,
        expectedState: state,
        expectedNonce: ctx.nonce,
      });
      const claims = tokens.claims();
      const user: AuthUser = {
        sub: claims?.sub ?? "unknown",
        name: (claims?.name as string | undefined) ?? undefined,
        email: (claims?.email as string | undefined) ?? undefined,
      };
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, user);
      setSessionCookie(res, sessionId);
      res.redirect("/");
    } catch (err) {
      res.status(500).send(`Callback failed: ${(err as Error).message}`);
    }
  });

  app.get("/auth/logout", (req: any, res: any) => {
    const cookie = req.headers.cookie
      ?.split(";")
      .map((c: string) => c.trim())
      .find((c: string) => c.startsWith(`${cookieName}=`));
    if (cookie) sessions.delete(cookie.slice(cookieName.length + 1));
    clearSessionCookie(res);
    res.redirect("/");
  });
};
