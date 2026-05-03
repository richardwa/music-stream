import { button, fragment, signal, Signal } from "solid-vanilla";
import { fetchJson } from "../../common/interface";

export const ytButton = (subDir: Signal<string>) => {
  const busy = signal(false);
  const node = fragment();
  const refreshBusy = async () => {
    const status = await fetchJson("ytBusy");
    busy.set(status);
  };

  node.watch([subDir, busy], async (node) => {
    const id = await fetchJson("ytListId", subDir.get());
    if (id == null) {
      node.inner("");
      return;
    }

    refreshBusy();
    node.setInterval(refreshBusy, 3000);

    if (busy.get()) {
      node.inner("yt-dlp processing");
      return;
    }
    node.inner(
      button()
        .on("click", async () => {
          await fetchJson("ytProccess", subDir.get(), id);
        })
        .inner("refresh " + id),
    );
  });

  return node;
};
