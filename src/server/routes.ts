import express from "express";
import { apiPath, type ServerApi } from "../common/interface";
import { musicFolder } from "./conf";
import {
  authEnabled,
  authCheckCredentials,
  solidVanillaApiConfig,
} from "./auth";
import { configureApi, parseBasicHeader } from "solid-vanilla-server";
import type { NextFunction, Request, Response } from "express";

const folder = () => musicFolder();
import { readdir } from "fs/promises";
import path from "path";

const serverImpl: ServerApi = {
  login: async (user: string, password: string) => {
    const ok = authCheckCredentials(user, password);
    return ok ? { ok: true, user: user } : { ok: false };
  },
  logout: async () => true,
  list: async (subDir: string = "") => {
    const files = await readdir(
      path.join(folder(), decodeURIComponent(subDir)),
      {
        withFileTypes: true,
        recursive: true,
      },
    );

    const fileList = files
      .filter((f) => f.isFile())
      .map((f) => {
        const path = f.parentPath.slice(folder().length);
        return { title: f.name, path: path + "/" };
      });

    return fileList;
  },
};

/** solid-vanilla Basic auth, extended with a challenge for native prompts. */
const streamAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!authEnabled()) return next();
  const credentials = parseBasicHeader(req.headers.authorization);
  if (
    credentials &&
    authCheckCredentials(credentials.login, credentials.password)
  ) {
    return next();
  }
  res.status(401).set("WWW-Authenticate", 'Basic realm="music-stream"');
  res.json({ error: "not authenticated" });
};

export const configureRoutes = (app: ReturnType<typeof express>) => {
  // solid-vanilla middleware: logger + /api/login + Basic auth + API dispatch
  configureApi(app, solidVanillaApiConfig(serverImpl));
  // audio streams use the same Basic auth (with challenge so browsers prompt)
  app.use("/stream", streamAuth, express.static(folder()));
};
