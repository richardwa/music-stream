import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { configureRoutes } from "./routes";

const app = express();
const port = process.env.PORT || 5177;

configureRoutes(app);

// Serve frontend from built Vite dist
const distPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../dist",
);

app.use(express.static(distPath));

// SPA fallback for client side routes without #
app.use((req: express.Request, res: express.Response) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
