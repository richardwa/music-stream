import express from "express";
import { apiPath, type ServerApi } from "../common/interface";
import { getEnv } from "./conf";
import { readdir, readFile } from "fs/promises";
import { downloadList } from "./yt-download";
import path from "path";

const audioExtensions = new Set([".mp3", ".wma", ".flac"]);

const serverImpl: ServerApi = {
  list: async (subDir: string = "") => {
    const musicFolder = getEnv("MUSIC_FOLDER");
    const files = await readdir(
      path.join(musicFolder, decodeURIComponent(subDir)),
      {
        withFileTypes: true,
        recursive: true,
      },
    );

    const fileList = files
      .filter((f) => {
        if (!f.isFile()) return false;
        const ext = path.extname(f.name).toLowerCase();
        return audioExtensions.has(ext);
      })
      .map((f) => {
        const path = f.parentPath.slice(musicFolder.length);
        return { title: f.name, path: path + "/" };
      });

    return fileList;
  },
  ytdl: async (subDir: string) => {
    const musicFolder = getEnv("MUSIC_FOLDER");
    const absPath = path.join(musicFolder, subDir);
    const id = await readFile(path.join(absPath, ".yt-list-id.txt"), "utf8");
    await downloadList(absPath, id);
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
  const musicFolder = getEnv("MUSIC_FOLDER");
  app.use("/stream", express.static(musicFolder));
};
