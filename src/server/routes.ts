import express from "express";
import { type ServerApi } from "../common/interface";
import { musicFolder } from "./conf";
import { apiConfig, streamAuth } from "./auth";
import { configureApi } from "solid-vanilla-server";
import { readdir } from "fs/promises";
import path from "path";

const folder = () => musicFolder();

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
  // solid-vanilla middleware: logger + /api/login + Basic auth + API dispatch
  configureApi(app, apiConfig(serverImpl));
  // audio streams use the same Basic auth (with challenge so browsers prompt)
  app.use("/stream", streamAuth, express.static(folder()));
};
