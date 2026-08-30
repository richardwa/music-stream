import express from "express";
import { apiPath, type ServerApi } from "../common/interface";
import { musicFolder } from "./conf";

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
};

export const configureRoutes = (app: ReturnType<typeof express>) => {
  // @ts-ignore
  app.use(express.json());
  const routes = express.Router();
  Object.entries(serverImpl).forEach(([key, fn]) => {
    routes.post(`/${key}`, async (req: any, res: express.Response) => {
      const params: unknown[] = req?.body ?? [];
      // @ts-ignore
      const result = await fn(...params);
      res.json(result);
    });
  });
  app.use(apiPath, routes);
  app.use("/stream", express.static(folder()));
};
