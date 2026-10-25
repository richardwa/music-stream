import express from "express";
import { apiPath, type ServerApi } from "../common/interface";
import { musicFolder } from "./conf";
import { authConfig, authRequired, currentUser } from "./auth";

const folder = () => musicFolder();
import { readdir } from "fs/promises";
import path from "path";

const serverImpl: ServerApi = {
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

  me: async () => {
    throw new Error("handled per-request in configureRoutes");
  },

  authEnabled: async () => authConfig() != null,
};

export const configureRoutes = (app: ReturnType<typeof express>) => {
  // @ts-ignore
  app.use(express.json());
  const routes = express.Router();
  Object.entries(serverImpl).forEach(([key, fn]) => {
    routes.post(`/${key}`, async (req: any, res: any) => {
      const params: unknown[] = (req?.body ?? []) as unknown[];
      let result: unknown;
      if (key === "me") {
        result = currentUser(req) ?? null;
      } else if (key === "authEnabled") {
        result = authConfig() != null;
      } else {
        // @ts-ignore
        result = await fn(...params);
      }
      res.json(result);
    });
  });
  const requireLogin = (req: any, res: any, next: () => void) => {
    if (authRequired(req)) {
      res.status(401).send("Login required");
      return;
    }
    next();
  };
  app.use(apiPath as any, requireLogin as any, routes as any);
  app.use(
    "/stream" as any,
    requireLogin as any,
    express.static(folder()) as any,
  );
};
