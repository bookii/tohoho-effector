import { serve } from "@hono/node-server";
import { app } from "./app.js";

serve({
  fetch: app.fetch,
  port: import.meta.env.VITE_BACKEND_PORT,
});

console.log(`Server is running on port: ${import.meta.env.VITE_BACKEND_PORT}`);
