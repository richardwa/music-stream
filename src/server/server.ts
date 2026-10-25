import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { configureRoutes } from "./routes";
import { configureAuthRoutes, authConfig } from "./auth";

const app = express();
const port = process.env.PORT || 5177;

configureRoutes(app);

// Optional OIDC login (enabled when OIDC_CLIENT_ID/SECRET are set).
void configureAuthRoutes(app).then(() => {
  const cfg = authConfig();
  if (cfg == null)
    console.log("Login: disabled (set OIDC_CLIENT_ID/SECRET to enable)");
});

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
