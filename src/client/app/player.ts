import { h, div, vbox, signal, fragment } from "solid-vanilla";
import { fetchJson, Track } from "../../common/interface";
import { formatDuration } from "./components";

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

  const trackList = div()
    .css("flex", "1")
    .css("overflow-y", "auto")
    .css("overflow-x", "hidden")
    .watch([allTracks, filterText], (node) => {
      const tracks = filtered();
      if (tracks.length === 0) {
        node
          .css("display", "flex")
          .css("align-items", "center")
          .css("justify-content", "center")
          .css("color", "#888")
          .inner("No tracks found. Add music files to your music folder.");
        return;
      }
      // Header row
      const header = div()
        .css("display", "grid")
        .css("grid-template-columns", "40px 1fr 1fr 60px")
        .css("padding", "4px 16px")
        .css("color", "#888")
        .css("font-size", "12px")
        .css("border-bottom", "1px solid #333")
        .css("position", "sticky")
        .css("top", "0")
        .css("background", "#121212")
        .inner(
          "#",
          div().inner("Title"),
          div().inner("Artist"),
          div().inner("Duration"),
        );

      const rows = tracks.map((t, i) =>
        div()
          .css("display", "grid")
          .css("grid-template-columns", "40px 1fr 1fr 60px")
          .css("padding", "8px 16px")
          .css("gap", "8px")
          .css("align-items", "center")
          .css("border-radius", "4px")
          .css("cursor", "pointer")
          .css("color", () => (i === currentIndex.get() ? "#1db954" : ""))
          .css("background", () =>
            i === currentIndex.get() ? "#1a3a1a" : "transparent",
          )
          .on("click", () => playTrack(i))
          .inner(
            div()
              .css("color", "#888")
              .css("text-align", "right")
              .inner(`${i + 1}`),
            div()
              .css("overflow", "hidden")
              .css("text-overflow", "ellipsis")
              .css("white-space", "nowrap")
              .inner(t.title),
            div()
              .css("color", "#aaa")
              .css("overflow", "hidden")
              .css("text-overflow", "ellipsis")
              .css("white-space", "nowrap")
              .inner(t.artist),
            div()
              .css("color", "#888")
              .css("text-align", "right")
              .inner(formatDuration(t.duration || 0)),
          ),
      );

      node.inner(header, ...rows);
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
