import { button, div, signal, vbox } from "solid-vanilla";
import { fetchJson } from "../../common/interface";
import { TextInput } from "./components";
import { router } from "./routes";

export const LoginPage = () => {
  const user = signal("");
  const password = signal("");
  const error = signal("");

  const submit = async () => {
    try {
      const result = await fetchJson("login", user.get(), password.get());
      if (result.ok) {
        router.navigate("/");
        return;
      }
    } catch {
      // fall through to error message
    }
    error.set("Wrong username or password");
  };

  return div()
    .css("height", "100%")
    .css("display", "flex")
    .css("align-items", "center")
    .css("justify-content", "center")
    .inner(
      vbox()
        .css("width", "min(20rem, 90vw)")
        .css("padding", "1rem")
        .inner(
          div()
            .css("font-size", "1.2rem")
            .css("margin-bottom", "0.5rem")
            .inner("music"),
          TextInput(user).attr("placeholder", "username"),
          TextInput(password, "password")
            .attr("placeholder", "password")
            .on("keydown", (e) => {
              if ((e as KeyboardEvent).key === "Enter") submit();
            }),
          button()
            .css("margin-top", "0.25rem")
            .on("click", submit)
            .inner("login"),
          div()
            .css("color", "tomato")
            .css("min-height", "1.5rem")
            .inner(() => error.get()),
        ),
    );
};
