import { h, div, vbox, signal, fragment, Signal } from "solid-vanilla";
import { fetchJson } from "../../common/interface";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import { router } from "./routes";
import type { Track } from "../../common/interface";

const getTrackHref = (t?: Track) => t ? `/stream${t.path}${t.title}` : '';

export const PlayPage = (subDir: Signal<string>) =>
  vbox()
    .css("gap", "0")
    .css("height", "100%")
    .do((node) => {
      const selected = signal<Track>();

      const header = () => div().css("padding", "1rem")
        .inner(() => selected.get()?.title ?? 'none');

      const footer = () =>
        h('audio')
          .css("width", "100%")
          .css("height", "3rem")
          .css("padding", "0.5rem")
          .attr('controls')
          .attr('autoplay')
          .attr('src', () => getTrackHref(selected.get()));

      const trackList = () =>
        vbox().do(async (node) => {
          const table = new Tabulator(node.el, {
            columns: [
              { title: "#", formatter: "rownum", width: 50, hozAlign: "right" },
              { title: "Title", field: "title" },
              { title: "Path", field: "path" },
            ],
            selectableRows: 1,
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
          });
        });


      node.inner(header(), trackList(), footer());
    });
