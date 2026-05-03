export const apiPath = "/api";

export type Track = {
  title: string;
  path: string;
};
export type ServerApi = {
  list: (subDir?: string) => Promise<Track[]>;
  ytListId: (subDir: string) => Promise<string | undefined>;
  ytBusy: () => Promise<boolean>;
  ytProccess: (subDir: string, id: string) => Promise<void>;
};

export const fetchJson = async <T extends keyof ServerApi>(
  key: T,
  ...params: Parameters<ServerApi[T]>
): Promise<ReturnType<ServerApi[T]>> => {
  const resp = await fetch(`${apiPath}/${key}`, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  try {
    return await resp.json();
  } catch {
    return undefined as any;
  }
};
