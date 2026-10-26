export const apiPath = "/api";

export type Track = {
  title: string;
  path: string;
};
export type LoginResult = {
  ok: boolean;
  error?: string;
};
export type ServerApi = {
  list: (subDir?: string) => Promise<Track[]>;
};

const authKey = "auth.basic";

/** Remember login credentials for Basic auth (kept for the session only). */
export const storeAuth = (user: string, password: string) =>
  sessionStorage.setItem(authKey, btoa(`${user}:${password}`));
export const clearAuth = () => sessionStorage.removeItem(authKey);

const authHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const basic = sessionStorage.getItem(authKey);
  if (basic) headers["Authorization"] = `Basic ${basic}`;
  return headers;
};

/** POST /api/login — owned by the solid-vanilla-server middleware. */
export const postLogin = (
  user: string,
  password: string,
): Promise<LoginResult> =>
  fetch(`${apiPath}/login`, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([user, password]),
  }).then((res) => {
    if (!res.ok) throw new Error(`login failed: ${res.status}`);
    return res.json() as Promise<LoginResult>;
  });

export const fetchJson = <T extends keyof ServerApi>(
  key: T,
  ...params: Parameters<ServerApi[T]>
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };
  return fetch(`${apiPath}/${key}`, {
    method: "post",
    headers,
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
};
