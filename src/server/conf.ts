let cached: string | undefined;

/** MUSIC_FOLDER is only required when the server actually runs. */
export const musicFolder = (): string => {
  if (cached == null) {
    if (process.env.MUSIC_FOLDER == null) {
      throw new Error("MUSIC_FOLDER not defined");
    }
    cached = process.env.MUSIC_FOLDER;
  }
  return cached;
};
