import { h, div, vbox, signal, fragment } from "solid-vanilla";
import { fetchJson, Track } from "../../common/interface";
import { formatDuration } from "./components";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";

const audio = new Audio();

const filterText = signal("");
const allTracks = signal<Track[]>([]);
const currentIndex = signal(-1);
const isPlaying = signal(false);
const currentTime = signal(0);
const trackDuration = signal(0);
const volume = signal(0.7);

const filtered = () =>
  allTracks.get().filter((t) => {
    const q = filterText.get().toLowerCase();
    return (
      t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  });

const playTrack = (idx: number) => {
  const tracks = filtered();
  if (idx < 0 || idx >= tracks.length) return;
  currentIndex.set(idx);
  audio.src = `/api/stream/${encodeURIComponent(tracks[idx].path)}`;
  audio.volume = volume.get();
  audio.play();
  isPlaying.set(true);
};

audio.addEventListener("timeupdate", () => currentTime.set(audio.currentTime));
audio.addEventListener("loadedmetadata", () =>
  trackDuration.set(audio.duration),
);
audio.addEventListener("ended", () => {
  const tracks = filtered();
  if (tracks.length > 0) {
    playTrack((currentIndex.get() + 1) % tracks.length);
  }
});

const formatTime = (t: number) => {
  const s = Math.floor(t);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

export const PlayPage = () => {
  // Load tracks from server
  fragment().do(async (_node) => {
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
    .on("input", (e) => {
      filterText.set(e.target.value);
    });

  const playBtn = h("button")
    .on("click", () => {
      if (isPlaying.get()) {
        audio.pause();
        isPlaying.set(false);
        playBtn.inner("\u25B6");
      } else if (currentIndex.get() >= 0) {
        audio.play();
        isPlaying.set(true);
        playBtn.inner("\u23F8");
      } else if (filtered().length > 0) {
        playTrack(0);
        playBtn.inner("\u23F8");
      }
    })
    .inner("\u25B6");

  const prevBtn = h("button")
    .on("click", () => {
      if (currentIndex.get() > 0) playTrack(currentIndex.get() - 1);
    })
    .inner("\u23EE");

  const nextBtn = h("button")
    .on("click", () => {
      playTrack(currentIndex.get() + 1);
    })
    .inner("\u23ED");

  const volSlider = h("input")
    .attr("type", "range")
    .attr("min", "0")
    .attr("max", "1")
    .attr("step", "0.01")
    .attr("value", String(volume.get()))
    .on("input", (e) => {
      volume.set(parseFloat(e.target.value));
      audio.volume = volume.get();
    });

  const progressBar = h("div")
    .css("height", "3px")
    .css("background", "#333")
    .css("border-radius", "2px")
    .css("cursor", "pointer")
    .on("click", (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if (trackDuration.get()) audio.currentTime = pct * trackDuration.get();
    })
    .inner(
      h("div")
        .css("height", "100%")
        .css("background", "#1db954")
        .css("border-radius", "2px")
        .css("width", "0%")
        .watch([currentTime, trackDuration], (node) => {
          const dur = trackDuration.get();
          const cur = currentTime.get();
          node.css("width", dur ? `${(cur / dur) * 100}%` : "0%");
        }),
    );

  const timeDisplay = h("div")
    .css("display", "flex")
    .css("justify-content", "space-between")
    .css("font-size", "11px")
    .css("color", "#aaa")
    .watch([currentTime, trackDuration], (node) => {
      node.inner(
        `${formatTime(currentTime.get())} / ${formatTime(trackDuration.get())}`,
      );
    });

  const nowPlaying = h("div")
    .css("font-size", "13px")
    .css("white-space", "nowrap")
    .css("overflow", "hidden")
    .css("text-overflow", "ellipsis")
    .watch([currentIndex, allTracks], (node) => {
      const idx = currentIndex.get();
      const tracks = filtered();
      if (idx >= 0 && idx < tracks.length) {
        node.inner(`${tracks[idx].title} — ${tracks[idx].artist}`);
      } else {
        node.inner("No track selected");
      }
    });

  const tabContainer = div().css("height", "100%").css("overflow", "hidden");

  let table: Tabulator | undefined;

  // Initialize Tabulator after mount
  fragment().do((node) => {
    const el = node.el as HTMLElement;
    el.appendChild(tabContainer.el);

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
      const idx = filtered().indexOf(row.getData());
      if (idx >= 0) playTrack(idx);
    });
  });

  const trackList = tabContainer;
  trackList.watch([allTracks, filterText, currentIndex], (_node) => {
    if (table) {
      const tracks = filtered();
      table.replaceData(tracks);
      const idx = currentIndex.get();
      if (idx >= 0 && idx < tracks.length) {
        table.selectRow(idx);
      }
    }
  });

  const controlsSection = div()
    .css("display", "flex")
    .css("align-items", "center")
    .css("gap", "8px")
    .inner(prevBtn, playBtn, nextBtn, div().css("flex", "1"), volSlider);

  return vbox()
    .css("height", "100%")
    .css("padding", "0.5rem")
    .css("gap", "0.5rem")
    .inner(
      searchInput,
      trackList,
      div()
        .css("display", "flex")
        .css("flex-direction", "column")
        .css("gap", "6px")
        .inner(
          div()
            .css("display", "flex")
            .css("align-items", "center")
            .css("gap", "8px")
            .inner(controlsSection, div().css("flex", "1"), nowPlaying),
          progressBar,
          timeDisplay,
        ),
    );
};
