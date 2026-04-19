import { HashRouter, Signal, div } from "solid-vanilla";
import { PlayPage } from "./player";

const root = div().css("height", "100%").attr("id", "router");

const router = new HashRouter(root);

const subDir = new Signal("");
router.addRoute("/:path", ({ path }) => {
  subDir.set(path);
  return root.memo(1, () => PlayPage(subDir));
});

export { router };
