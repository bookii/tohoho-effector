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
  };
});
