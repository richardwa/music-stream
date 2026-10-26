export const apiPath = "/api";

export type Track = {
  title: string;
  path: string;
};
export type LoginResult = {
  ok: boolean;
  user?: string;
};
export type ServerApi = {
  login: (user: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<boolean>;
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
  }).then((res) => {
    if (res.status === 401) {
      // session expired / not logged in: show the login page
      window.location.hash = "#/login";
      throw new Error("unauthorized");
    }
    if (!res.ok) throw new Error(`${key} failed: ${res.status}`);
    return res.json();
  }) as ReturnType<ServerApi[T]>;
