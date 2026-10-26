import express from "express";
import { apiPath, type ServerApi } from "../common/interface";
import { musicFolder } from "./conf";
import { clearAuthCookie, createAuthCookie, login, requireAuth } from "./auth";

const folder = () => musicFolder();
import { readdir } from "fs/promises";
import path from "path";

const serverImpl: ServerApi = {
  login: async (user: string, password: string) => login(user, password),
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

export const configureRoutes = (app: ReturnType<typeof express>) => {
  // @ts-ignore
  app.use(express.json());
  const routes = express.Router();
  Object.entries(serverImpl).forEach(([key, fn]) => {
    if (key === "login" || key === "logout") return; // handled below
    routes.post(`/${key}`, async (req: any, res: express.Response) => {
      const params: unknown[] = req?.body ?? [];
      // @ts-ignore
      const result = await fn(...params);
      res.json(result);
    });
  });
  // login/logout are unauthenticated endpoints that manage the session cookie
  routes.post("/login", async (req: any, res: express.Response) => {
    const [user, password] = (req?.body ?? []) as [string, string];
    const result = await serverImpl.login(user, password);
    if (result.ok) createAuthCookie(res, result.user!);
    res.json(result);
  });
  routes.post("/logout", (_req: any, res: express.Response) => {
    clearAuthCookie(res);
    res.json(true);
  });
  // all other API endpoints require a valid session
  app.use(apiPath, requireAuth, routes);
  app.use("/stream", requireAuth, express.static(folder()));
};
