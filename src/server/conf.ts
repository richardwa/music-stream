type Key = "MUSIC_FOLDER" | "VIDEO_FOLDER" | "YT_CACHE" | "YT_TMP" | "YT_DOWNLOADED_TXT";

export const getEnv = (key: Key) => {
  const val = process.env[key];
  if (val == null) {
    throw new Error(`${key} not defined`);
  }
  return val;
};
