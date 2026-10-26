import { HashRouter, Signal, div } from "solid-vanilla";
import { PlayPage } from "./player";
import { LoginPage } from "./login";

const root = div().css("height", "100%").attr("id", "router");

const router = new HashRouter(root);

const subDir = new Signal("");
// register /login before the catch-all /:path route
router.addRoute("/login", () => LoginPage());
router.addRoute("/:path", ({ path }) => {
  subDir.set(path);
  return root.memo(1, () => PlayPage(subDir));
});

export { router };
