import { button, div, signal, vbox } from "solid-vanilla";
import { postLogin, storeAuth } from "../../common/interface";
import { TextInput } from "./components";
import { router } from "./routes";

export const LoginPage = () => {
  const user = signal("");
  const password = signal("");
  const error = signal("");

  const submit = async () => {
    try {
      const result = await postLogin(user.get(), password.get());
      if (result.ok) {
        storeAuth(user.get(), password.get());
        router.navigate("/");
        return;
      }
      error.set(result.error ?? "Wrong username or password");
    } catch {
      error.set("Wrong username or password");
    }
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
