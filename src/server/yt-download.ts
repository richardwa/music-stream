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
  listId: string
): Promise<void> => {

  const now = (): string =>
    new Date().toISOString().replace("T", " ").substring(0, 19);

  console.log(`${now()} download to: ${dlDirectory}`);

  await runCommand("yt-dlp", [
    "-k",
    "--extract-audio",
    "--restrict-filenames",
    "--audio-format", "mp3",
    "--audio-quality", "0",
    "--cache-dir", "/home/public/app_data/yt-download/.cache",
    "--download-archive", "/home/public/app_data/yt-download/.cache/download.txt",
    "--output", `${dlDirectory}/%(title)s-%(id)s.%(ext)s`,
    "-i",
    listId
  ]);

  await runCommand("find", [
    dlDirectory,
    "-type", "f",
    "-not", "(",
    "-iname", "*.mp3",
    "-o", "-iname", "*.wma",
    ")",
    "-exec", "mv",
    "-t", "/home/public/videos/youtube/",
    "{}", "+"
  ]);
};

