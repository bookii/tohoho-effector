import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { app } from "./app.js";

if (process.env.NODE_ENV === "production") {
  app.use("/assets/*", serveStatic({ root: "./frontend/dist" }));
  app.use("/cascades/*", serveStatic({ root: "./frontend/dist" }));
  app.use(
    "*",
    serveStatic({
      root: "./frontend/dist",
      rewriteRequestPath: () => "/index.html",
    })
  );
  serve({
    fetch: app.fetch,
    port: import.meta.env.VITE_BACKEND_PORT,
  });
  console.log(
    `Server is running on port: ${import.meta.env.VITE_BACKEND_PORT}`
  );
}

export default app;
