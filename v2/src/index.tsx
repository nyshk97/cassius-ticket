import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { loadSession } from "./middleware/auth.ts";
import events from "./routes/events.tsx";
import publicOrders from "./routes/public-orders.tsx";
import sessions from "./routes/sessions.tsx";
import type { AppEnv } from "./types.ts";

const app = new Hono<AppEnv>();

app.get("/up", (c) => c.text("ok"));

app.use(csrf());
app.use(loadSession);

app.route("/", sessions);
app.route("/", publicOrders);
app.route("/", events);

app.notFound(async (c) => {
  const res = await c.env.ASSETS.fetch(new URL("/404.html", c.req.url));
  return c.html(await res.text(), 404);
});

export default app;
