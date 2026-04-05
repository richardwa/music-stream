import { h, div, vbox, signal, fragment } from "solid-vanilla";
import { fetchJson, Track } from "../../common/interface";
import { formatDuration } from "./components";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";

const filterText = signal("");
const allTracks = signal<Track[]>([]);
const currentIndex = signal(-1);

const filtered = () =>
  allTracks.get().filter((t) => {
    const q = filterText.get().toLowerCase();
    return (
      t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  });

export const PlayPage = () => {
  // Load tracks from server
  fragment().do(async () => {
    try {
      const tracks = await fetchJson("getTracks");
      allTracks.set(tracks);
    } catch (e) {
      console.error("Failed to load tracks:", e);
    }
  });

  const searchInput = h("input")
    .attr("type", "text")
    .attr("placeholder", "Search tracks...")
    .on("input", (e: Event) => {
      filterText.set((e.target as HTMLInputElement).value);
    })
    .css("margin-bottom", "0.5rem");

  const audioPlayer = h("audio")
    .attr("controls")
    .css("width", "100%")
    .css("margin-top", "auto")
    .on("ended", () => {
      const tracks = filtered();
      if (tracks.length > 0 && currentIndex.get() < tracks.length - 1) {
        playTrack(currentIndex.get() + 1);
      }
    });

  const playTrack = (idx: number) => {
    const tracks = filtered();
    if (idx < 0 || idx >= tracks.length) return;
    currentIndex.set(idx);
    const el = audioPlayer.el as HTMLAudioElement;
    el.src = `/api/stream/${encodeURIComponent(tracks[idx].path)}`;
    el.play();
  };

  const tabContainer = div().css("height", "100%").css("overflow", "hidden");

  let table: Tabulator | undefined;

  fragment().do((node) => {
    (node.el as HTMLElement).appendChild(tabContainer.el);

    table = new Tabulator(tabContainer.el, {
      data: [],
      columns: [
        { title: "#", formatter: "rownum", width: 50, hozAlign: "right" },
        { title: "Title", field: "title" },
        { title: "Artist", field: "artist" },
        {
          title: "Duration",
          field: "duration",
          width: 80,
          hozAlign: "right",
          formatter: (cell: any) => formatDuration(cell.getValue() || 0),
        },
      ],
      layout: "fitColumns",
      height: "100%",
      selectableRows: 1,
    });

    table.on("rowClick", (_e: UIEvent, row: any) => {
      const data = row.getData();
      const tracks = filtered();
      const idx = tracks.findIndex((t) => t.id === data.id);
      if (idx >= 0) playTrack(idx);
    });
  });

  const trackList = tabContainer;
  trackList.watch([allTracks, filterText], () => {
    if (table) {
      table.replaceData(filtered());
    }
  });

  return vbox()
    .css("height", "100%")
    .css("padding", "0.5rem")
    .css("gap", "0.5rem")
    .inner(searchInput, trackList, audioPlayer);
};
