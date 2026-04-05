import { h, Signal } from "solid-vanilla";

export const TextInput = (val: Signal<string>) =>
  h("input")
    .attr("type", "text")
    .on("input", (e) => val.set(e.target.value))
    .attr("value", val);

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};
