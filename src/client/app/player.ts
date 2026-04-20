import { h, div, span, vbox, signal, fragment, Signal } from "solid-vanilla";
import { fetchJson } from "../../common/interface";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import { router } from "./routes";
import type { Track } from "../../common/interface";

const getTrackHref = (t?: Track) => (t ? `/stream${t.path}${t.title}` : "");

export const PlayPage = (subDir: Signal<string>) =>
  vbox()
    .css("gap", "0")
    .css("height", "100%")
    .do((node) => {
      const selected = signal<Track>();
      const totalFiles = signal<number>(0);

      const header = () =>
        div()
          .css("padding", "0.5rem")
          .inner(() => `Files: ${totalFiles.get()}`);

      const footer = () =>
        vbox()
          .css("padding", "0.5rem")
          .inner(
            div().inner(() => selected.get()?.title),
            h("audio")
              .css("width", "100%")
              .css("height", "3rem")
              .attr("controls")
              .attr("autoplay")
              .attr("src", () => getTrackHref(selected.get())),
          );

      const trackList = () =>
        vbox()
          .css("height", "100%")
          .do(async (node) => {
            const table = new Tabulator(node.el, {
              layout: "fitColumns",
              columns: [
                {
                  title: "#",
                  formatter: "rownum",
                  width: 50,
                  hozAlign: "right",
                },
                {
                  title: "Title", widthGrow: 2, field: "title", formatter: (cell) => {

                    return h('a').j(


                    ).el;

                  }
                },
                { title: "Path", field: "path" },
              ],
            });
            table.on("rowClick", (event, row) => {
              const cell = event.target;
              const data = row.getData() as Track;
              if (row.getCell("path").getElement() === cell) {
                router.navigate(data.path);
              } else {
                selected.set(data);
              }
            });
            node.watch(subDir, async () => {
              const files = await fetchJson("list", subDir.get());
              table.setData(files);
              totalFiles.set(files.length);
            });
          });

      node.inner(header(), trackList(), footer());
    });
