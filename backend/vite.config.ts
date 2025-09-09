import devServer from "@hono/vite-dev-server";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      devServer({
        entry: "src/index.ts",
      }),
    ],
    server: {
      port: parseInt(env.VITE_BACKEND_PORT),
    },
    build: {
      lib: {
        entry: "src/index.ts",
        name: "index",
        fileName: "index",
        formats: ["es"],
      },
      rollupOptions: {
        external: ["@hono/node-server"],
      },
    },
  };
});
