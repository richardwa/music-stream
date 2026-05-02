import express from "express";
import { apiPath, type ServerApi } from "../common/interface";
import { getEnv } from "./conf";
import { readdir, readFile } from "fs/promises";
import { downloadList } from "./yt-download";
import path from "path";

const audioExtensions = new Set([".mp3", ".wma", ".flac"]);

class ServerImpl implements ServerApi {

  async list(subDir: string = "") {
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
  };

  async ytListId(subDir: string) {
    const musicFolder = getEnv("MUSIC_FOLDER");
    const absPath = path.join(musicFolder, subDir);
    try {
      const id = await readFile(path.join(absPath, ".yt-list-id.txt"), "utf8");
      return id.trimEnd();
    } catch {
      return;
    }
  }

  async ytProccess(subDir: string, id: string) {
    const actualId = await this.ytListId(subDir);
    if (actualId !== id) {
      throw new Error('incorrect list id');
    }
    const musicFolder = getEnv("MUSIC_FOLDER");
    const absPath = path.join(musicFolder, subDir);
    await downloadList(absPath, actualId);
  }
}


export const configureRoutes = (app: ReturnType<typeof express>) => {
  // @ts-ignore
  app.use(express.json());
  const routes = express.Router();
  const serverImpl = new ServerImpl();
  const proto = Object.getPrototypeOf(serverImpl);

  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === "constructor") continue;

    const valueFn = (proto as any)[name];
    if (typeof valueFn === "function") {
      const boundFn = valueFn.bind(serverImpl);
      routes.post(`/${name}`, async (req: any, res: express.Response) => {
        const params: unknown[] = req?.body ?? [];
        // @ts-ignore
        const result = await boundFn(...params);
        res.json(result);
      });
    }
  }
  app.use(apiPath, routes);
  const musicFolder = getEnv("MUSIC_FOLDER");
  app.use("/stream", express.static(musicFolder));
};
