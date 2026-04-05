export const apiPath = "/api";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  path: string;
};

export type ServerApi = {
  getTracks: (folder?: string) => Promise<Track[]>;
  playTrack: (path: string) => Promise<{ message: string }>;
};

export const fetchJson = <T extends keyof ServerApi>(
  key: T,
  ...params: Parameters<ServerApi[T]>
) =>
  fetch(`${apiPath}/${key}`, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then((res) => res.json()) as ReturnType<ServerApi[T]>;
