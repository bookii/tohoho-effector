import { hc } from "hono/client";
import { type AppType } from "./index.js";

export const createClient = (baseUrl = "", fetcher?: typeof fetch) => {
  return hc<AppType>(baseUrl, { fetch: fetcher });
};
