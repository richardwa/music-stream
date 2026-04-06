import path from "path";
export const musicFolder =
  process.env.MUSIC_FOLDER || path.resolve(__dirname, "../../../music-sample");
