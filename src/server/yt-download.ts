import { spawn } from "child_process";
import path from "path";
import { getEnv } from "./conf";
import { formatDate } from "../common/util";

const runCommand = (cmd: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });

    proc.on("close", (code) => {
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} exited with code ${code}`));
    });
  });

export const downloadList = async (
  dlDirectory: string,
  listId: string,
): Promise<void> => {
  const now = formatDate(new Date());

  console.log(`${now} download to: ${dlDirectory}`);

  await runCommand("yt-dlp", [
    "-k",
    "--extract-audio",
    "--restrict-filenames",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "--cache-dir",
    path.join(getEnv("DL_TEMP"), ".cache"),
    "--download-archive",
    path.join(dlDirectory, ".downloaded.txt"),
    "--output",
    path.join(dlDirectory, "%(title)s-%(id)s.%(ext)s"),
    "-i",
    listId,
  ]);

  await runCommand("find", [
    dlDirectory,
    "-type",
    "f",
    "-not",
    "(",
    "-iname",
    "*.mp3",
    "-o",
    "-iname",
    "*.wma",
    ")",
    "-exec",
    "mv",
    "-t",
    getEnv("VIDEO_FOLDER"),
    "{}",
    "+",
  ]);
};
