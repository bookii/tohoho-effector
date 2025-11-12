import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { SSEStreamingApi, streamSSE } from "hono/streaming";
import {
  deleteStreamQuerySchema,
  getStreamQuerySchema,
  irisOutEffectStateSchema,
  type IrisOutEffectState,
} from "shared";

type Session = {
  id: string;
  expiresAt: number;
  stream: SSEStreamingApi | undefined;
};

const sessions = new Map<string, Session>();

const logSessionCount = () => {
  const dateTime = new Date().toISOString();
  const streamCount = Array.from(sessions.values()).filter((s) => s.stream).length;
  console.log(`[${dateTime}] Current stream count: ${streamCount}`);
};

setInterval(() => {
  const now = Date.now();
  sessions.forEach((session, id) => {
    if (session.expiresAt < now) {
      sessions.delete(id);
    }
  });
  logSessionCount();
}, 1000 * 60 * 10);

export const app = new Hono()
  .use(
    "*",
    cors({
      origin: import.meta.env.VITE_ALLOWED_ORIGIN,
    })
  )
  .post("/sources", (c) => {
    const id = crypto.randomUUID();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24;
    const session: Session = {
      id,
      expiresAt,
      stream: undefined,
    };
    sessions.set(id, session);
    return c.json({
      id,
      url: `${c.req.header("origin")}/sources/${id}`,
      expiresAt: expiresAt,
    });
  })
  .post(
    "/effect-states/:id",
    zValidator("json", irisOutEffectStateSchema),
    (c) => {
      const source = sessions.get(c.req.param("id"));
      if (!source) {
        return c.json({ error: "Session not found or expired" }, 404);
      }
      const effectState: IrisOutEffectState = c.req.valid("json");
      if (source.stream) {
        source.stream.writeSSE({
          data: JSON.stringify(effectState),
          event: "effect-state",
        });
      }
      return c.body(null, 200);
    }
  )
  .get("/streams", zValidator("query", getStreamQuerySchema), (c) => {
    const { sourceId } = c.req.valid("query");
    const session = sessions.get(sourceId);
    if (!session || session.expiresAt < Date.now()) {
      return c.json({ error: "Session not found or expired" }, 404);
    }
    return streamSSE(c, async (stream) => {
      session.stream = stream;
      logSessionCount();
      while (true) {
        await stream.writeSSE({ data: "ping", event: "ping" });
        await stream.sleep(30000);
      }
    });
  })
  .delete("/streams", zValidator("query", deleteStreamQuerySchema), (c) => {
    const { sourceId } = c.req.valid("query");
    const session = sessions.get(sourceId);
    if (!session || session.expiresAt < Date.now()) {
      return c.json({ error: "Session not found or expired" }, 404);
    }
    sessions.delete(sourceId);
    logSessionCount();
    return c.body(null, 204);
  });

export type AppType = typeof app;

export default {
  fetch: app.fetch,
  port: import.meta.env.VITE_BACKEND_PORT,
};
