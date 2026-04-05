import express from "express";
import path from "path";
import { createReadStream, existsSync, statSync } from "fs";
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

  // Audio streaming endpoint with Range support for seeking
  app.get(
    `${apiPath}/stream/{*filePath}`,
    (req: any, res: express.Response) => {
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

      if (!existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const stat = statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      const mimeType = mimeMap[ext] || "audio/mpeg";

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": mimeType,
        });

        createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Accept-Ranges": "bytes",
          "Content-Type": mimeType,
        });

        createReadStream(filePath).pipe(res);
      }
    },
  );
};
