import express from "express";
import path from "path";
import { apiPath, type ServerApi } from "../common/interface";
import { getTracks } from "./resources/music";

export const configureRoutes = (app: ReturnType<typeof express>) => {
  // @ts-ignore
  app.use(express.json());

  const defaultMusicDir =
    process.env.MUSIC_FOLDER ||
    path.resolve(__dirname, "../../../music-sample");

  const serverImpl: ServerApi = {
    getTracks: async (folder?: string) => getTracks(folder || defaultMusicDir),
    playTrack: async (trackPath: string) => ({
      message: `Now playing: ${path.basename(trackPath)}`,
    }),
  };

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

  // Audio streaming endpoint
  app.get(
    `${apiPath}/stream/{*filePath}`,
    async (req: any, res: express.Response) => {
      const filePath = decodeURIComponent(req.params.filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
        ".flac": "audio/flac",
        ".wma": "audio/x-ms-wma",
      };
      res.setHeader("Content-Type", mimeMap[ext] || "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes");

      const readStream = require("fs").createReadStream(filePath);
      readStream.on("error", () => {
        res.status(404).json({ error: "File not found" });
      });
      readStream.pipe(res);
    },
  );
};
