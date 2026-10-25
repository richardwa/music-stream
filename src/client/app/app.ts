import { div } from "solid-vanilla";
import { router } from "./routes";

export const App = () => div().css("height", "100%").inner(router.getRoot());
