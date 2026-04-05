import fs from "fs";
import path from "path";
import { Database } from "bun:sqlite";
import type { Track } from "../../common/interface";

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".flac",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".wma",
]);

const guessMetadata = (filename: string) => {
  const name = path.parse(filename).name;

  const patterns = [
    /^(.+?)\s*-\s*(.+?)(?:\s*(?:[-_]\s*\w+\.mp3|_|\(|\[|$))/,
    /^(.+?)\s*[-_]\s*(.+)/,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      const title = match[2].replace(/_/g, " ").trim();
      const artist = match[1].replace(/_/g, " ").trim();
      if (title && artist) {
        return { title, artist };
      }
    }
  }

  return { title: name.replace(/_/g, " "), artist: "Unknown Artist" };
};

const DB_FILE = ".music.db";

const initDb = (dbPath: string) => {
  const db = new Database(dbPath);
  db.run(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      path TEXT UNIQUE NOT NULL,
      title TEXT,
      artist TEXT,
      album TEXT DEFAULT 'Unknown Album',
      duration INTEGER DEFAULT 0,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  return db;
};

export const getTracks = (folder: string): Track[] => {
  if (!fs.existsSync(folder)) return [];

  const dbPath = path.join(folder, DB_FILE);
  const db = initDb(dbPath);

  try {
    let tracks = db
      .query("SELECT id, path, title, artist, album, duration FROM tracks")
      .all();

    if (!tracks || tracks.length === 0 || tracks[0] === null) {
      // First scan — index the folder
      const entries = scanFiles(folder);
      if (entries.length > 0) {
        const stmt = db.prepare(
          "INSERT INTO tracks (id, path, title, artist, album, duration) VALUES (?, ?, ?, ?, ?, ?)",
        );
        const tx = db.transaction((txEntries: typeof entries) => {
          for (const t of txEntries) {
            stmt.run(
              crypto.randomUUID(),
              t.path,
              t.title,
              t.artist,
              t.album,
              t.duration,
            );
          }
        });
        tx(entries);

        tracks = db
          .query("SELECT id, path, title, artist, album, duration FROM tracks")
          .all();
      }
    }

    return (tracks || []) as Track[];
  } finally {
    db.close();
  }
};

const scanFiles = (folder: string): Omit<Track, "id">[] => {
  const tracks: Omit<Track, "id">[] = [];

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        const meta = guessMetadata(entry.name);
        tracks.push({
          path: full,
          title: meta.title,
          artist: meta.artist,
          album: "Unknown Album",
          duration: 0,
        });
      }
    }
  };

  walk(folder);
  return tracks;
};

export const getTrackById = (folder: string, trackId: string): Track | null => {
  if (!fs.existsSync(folder)) return null;
  const db = initDb(path.join(folder, DB_FILE));
  try {
    return db
      .query(
        "SELECT id, path, title, artist, album, duration FROM tracks WHERE id = $id",
      )
      .get(trackId) as Track | null;
  } finally {
    db.close();
  }
};

export const removeTrack = (folder: string, trackPath: string) => {
  if (!fs.existsSync(folder)) return;
  const db = initDb(path.join(folder, DB_FILE));
  try {
    db.query("DELETE FROM tracks WHERE path = $path").run({ path: trackPath });
  } finally {
    db.close();
  }
};
