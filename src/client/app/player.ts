import { h, div, vbox, signal, fragment, Signal } from "solid-vanilla";
import { fetchJson } from "../../common/interface";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import { router } from './routes';
import type { Track } from '../../common/interface';


export const trackList = (subDir: Signal<string>) =>
  vbox().do(async (node) => {
    const table = new Tabulator(node.el, {
      columns: [
        { title: "#", formatter: "rownum", width: 50, hozAlign: "right" },
        { title: "Title", field: "title" },
        { title: "Path", field: "path" },
      ],
      height: "100%",
      selectableRows: 1
    });
    table.on('rowClick', (event, row) => {
      const cell = event.target;
      if (row.getCell('path').getElement() === cell) {
        const data = row.getData() as Track;
        console.log('path clicked');
        router.navigate(data.path);
      } else {
        console.log('other fields clicked');
      }
    })
    node.watch(subDir, async () => {
      const files = await fetchJson("list", subDir.get());
      table.setData(files);
    })
  });

export const PlayPage = (subDir: Signal<string>) => trackList(subDir);
