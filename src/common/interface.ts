export const apiPath = "/api";

export type Track = {
  title: string;
  path: string;
};
export type ServerApi = {
  list: (subDir?: string) => Promise<Track[]>;
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
