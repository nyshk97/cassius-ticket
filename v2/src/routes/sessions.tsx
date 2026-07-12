import { Hono } from "hono";
import { setFlash } from "../lib/flash.ts";
import { verifyPassword } from "../lib/password.ts";
import { startNewSession, terminateSession } from "../lib/session.ts";
import { safeReturnTo } from "../middleware/auth.ts";
import { SessionsLayout } from "../views/layouts.tsx";
import { LoginPage } from "../views/sessions.tsx";
import type { AppEnv, UserRow } from "../types.ts";

const app = new Hono<AppEnv>();

app.get("/session/new", (c) => {
  if (c.get("currentUser")) return c.redirect("/");
  const returnTo = c.req.query("return_to");
  return c.html(
    <SessionsLayout>
      <LoginPage alert={c.get("flash").alert} returnTo={returnTo} />
    </SessionsLayout>,
  );
});

app.post("/session", async (c) => {
  // レートリミット: 10回/60秒（IP単位）。binding の period 制約により旧 Rails の3分10回から変更
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await c.env.LOGIN_RATE_LIMITER.limit({ key: ip });
  if (!success) {
    setFlash(c, { alert: "しばらく待ってから再度お試しください。" });
    return c.redirect("/session/new", 303);
  }

  const body = await c.req.parseBody();
  const password = typeof body.password === "string" ? body.password : "";
  const user = await c.env.DB.prepare("SELECT * FROM users ORDER BY id LIMIT 1").first<UserRow>();

  if (user && (await verifyPassword(password, user.password_digest))) {
    await startNewSession(c, user.id);
    const returnTo = typeof body.return_to === "string" ? body.return_to : undefined;
    return c.redirect(safeReturnTo(returnTo), 303);
  }

  setFlash(c, { alert: "パスワードが正しくありません。" });
  return c.redirect("/session/new", 303);
});

app.post("/session/delete", async (c) => {
  await terminateSession(c);
  return c.redirect("/session/new", 303);
});

export default app;
