import { div, fragment, span, signal } from "solid-vanilla";
import { fetchJson, type AuthUser } from "../../common/interface";
import { router } from "./routes";

const user = signal<AuthUser | null | undefined>(undefined);
const authEnabled = signal(false);

void fetchJson("me")
  .then((u) => user.set(u))
  .catch(() => user.set(null));
void fetchJson("authEnabled")
  .then((enabled) => authEnabled.set(enabled))
  .catch(() => authEnabled.set(false));

const AuthBar = () => {
  const el = div()
    .css("display", "flex")
    .css("justify-content", "flex-end")
    .css("padding", "0.5rem 1rem")
    .css("gap", "0.75rem")
    .css("align-items", "center");
  el.watch([user, authEnabled], () => {
    const u = user.get();
    if (u == null) {
      el.inner(
        authEnabled.get()
          ? span()
              .attr("class", "clickable")
              .on("click", () => (window.location.href = "/auth/login"))
              .inner("Login")
          : fragment(),
      );
    } else {
      el.inner(
        span().inner(u.name ?? u.email ?? u.sub),
        span()
          .attr("class", "clickable")
          .on("click", () => {
            user.set(null);
            window.location.href = "/auth/logout";
          })
          .inner("Logout"),
      );
    }
  });
  return el;
};

export const App = () =>
  div()
    .css("height", "100%")
    .css("display", "flex")
    .css("flex-direction", "column")
    .inner(
      AuthBar(),
      div().css("flex", "1").css("min-height", "0").inner(router.getRoot()),
    );
