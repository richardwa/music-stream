import { HashRouter, div } from "solid-vanilla";
import { PlayPage } from "./player";

const root = div().css("height", "100%").attr("id", "router");

const router = new HashRouter(root);

router.addRoute("/", () => PlayPage());

export { router };
