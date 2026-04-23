if (process.env.MUSIC_FOLDER == null) {
  throw new Error("MUSIC_FOLDER not defined");
}
export const musicFolder = process.env.MUSIC_FOLDER;
