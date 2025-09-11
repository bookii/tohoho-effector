import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { SSEStreamingApi, streamSSE } from "hono/streaming";
import {
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

setInterval(() => {
  const now = Date.now();
  sessions.forEach((session, id) => {
    if (session.expiresAt < now) {
      sessions.delete(id);
    }
  });
  console.log(`Current session count: ${sessions.size}`);
}, 1000 * 60 * 10);

export const app = new Hono()
  .post("/sources", (c) => {
    const id = crypto.randomUUID();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24;
    const session: Session = {
      id,
      expiresAt,
      stream: undefined,
    };
    sessions.set(id, session);
    console.log(`Current session count: ${sessions.size}`);
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
      while (true) {
        await stream.writeSSE({ data: "ping", event: "ping" });
        await stream.sleep(30000);
      }
    });
  });

export type AppType = typeof app;

export default {
  fetch: app.fetch,
  port: import.meta.env.VITE_BACKEND_PORT,
};
