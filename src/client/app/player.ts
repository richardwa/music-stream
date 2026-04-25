import {
  h,
  div,
  span,
  button,
  vbox,
  signal,
  fragment,
  Signal,
} from "solid-vanilla";
import { fetchJson } from "../../common/interface";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import { router } from "./routes";
import type { Track } from "../../common/interface";

const getTrackHref = (t?: Track) => (t ? `/stream${t.path}${t.title}` : "");

const PathLink = (title: string, path: string) =>
  h("span")
    .attr("class", "clickable")
    .css("padding", "0.1rem")
    .on("click", () => {
      router.navigate(path);
    })
    .inner(title);

const BreadCrumbs = (path: string) => {
  const paths = path.split("/").filter(Boolean);
  return fragment().inner(
    ...paths.map((path, i) =>
      PathLink(path, "/" + paths.slice(0, i + 1).join("/")),
    ),
  );
};

const highlightRow = (table: Tabulator, index: number) => {
  table.getRows().forEach((r) => {
    r.getElement().classList.remove("highlighted-row");
  });
  table.getRowFromPosition(index).getElement().classList.add("highlighted-row");
};

export const PlayPage = (subDir: Signal<string>) =>
  vbox()
    .css("gap", "0")
    .css("height", "100%")
    .do((node) => {
      let table: Tabulator | undefined;
      const current = signal<number>();
      node.watch(current, () => {
        const index = current.get();
        if (table == null || index == null) return;
        highlightRow(table, index);
      });
      const totalFiles = signal<number>(0);
      const getCurrentTrack = () => {
        const index = current.get();
        if (table == null || index == null) return;
        const track = table.getRowFromPosition(index).getData() as Track;
        return track;
      };

      const next = () => {
        const index = current.get() ?? 0;
        const nextIndex = (index + 1) % totalFiles.get();
        current.set(nextIndex);
      };

      const header = div()
        .css("padding", "0.5rem")
        .css("display", "flex")
        .css("gap", "0.5rem")
        .css("align-items", "center")
        .inner(
          PathLink("music", "/"),
          () => BreadCrumbs(subDir.get()),
          fragment().inner(() => `(${totalFiles.get()})`),
          button().on("click", next).inner("next"),
        );

      const footer = vbox()
        .css("padding", "0.5rem")
        .inner(
          div().inner(() => getCurrentTrack()?.title),
          h("audio")
            .css("width", "100%")
            .css("height", "3rem")
            .attr("controls")
            .attr("autoplay")
            .attr("src", () => getTrackHref(getCurrentTrack()))
            .on("ended", next),
        );

      const trackList = vbox()
        .css("height", "100%")
        .do(async (node) => {
          table = new Tabulator(node.el, {
            layout: "fitColumns",
            selectableRows: false,
            columns: [
              {
                title: "#",
                formatter: "rownum",
                width: 50,
                hozAlign: "right",
              },
              {
                title: "Title",
                widthGrow: 2,
                field: "title",
                formatter: (cell) => {
                  cell.getElement().classList.add("clickable");
                  return cell.getValue().replaceAll("_", " ");
                },
                cellClick: (ev, cell) => {
                  const index = cell.getRow().getPosition() as number;
                  current.set(index);
                },
              },
              {
                title: "Path",
                field: "path",
                formatter: (cell) => {
                  const data = cell.getData() as Track;
                  const paths = data.path.split("/").filter(Boolean);
                  return paths.length === 0
                    ? ""
                    : div()
                        .css("display", "flex")
                        .css("gap", "0.5rem")
                        .inner(BreadCrumbs(data.path)).el;
                },
              },
            ],
          });
          node.watch(subDir, async () => {
            const files = await fetchJson("list", subDir.get());
            table?.setData(files);
            totalFiles.set(files.length);
          });
        });

      node.inner(header, trackList, footer);
    });
