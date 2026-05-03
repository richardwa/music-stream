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
  const cacheDir = getEnv("YT_CACHE");
  const tmpDir = getEnv("YT_TMP");
  const downloadArchiveTxt = getEnv("YT_DOWNLOADED_TXT");
  const videoDir = getEnv("VIDEO_FOLDER");


  await runCommand("yt-dlp", [
    "-k",
    "--extract-audio",
    "--restrict-filenames",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "--cache-dir", cacheDir,
    "--download-archive", downloadArchiveTxt,
    "--output",
    path.join(tmpDir, "%(title)s-%(id)s.%(ext)s"),
    "-i",
    listId,
  ]);

  // move audio files to dlDirectory
  await runCommand("find", [
    tmpDir,
    "-type",
    "f",
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
    dlDirectory,
    "{}",
    "+",
  ]);

  // move remaining to VIDEO_FOLDER
  await runCommand("find", [
    tmpDir,
    "-type",
    "f",
    "-exec",
    "mv",
    "-t",
    videoDir,
    "{}",
    "+",
  ]);
};
