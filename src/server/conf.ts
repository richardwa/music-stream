type Key = "MUSIC_FOLDER" | "VIDEO_FOLDER" | "DL_TEMP";

export const getEnv = (key: Key) => {
  const val = process.env[key];
  if (val == null) {
    throw new Error(`${key} not defined`);
  }
  return val;
};
