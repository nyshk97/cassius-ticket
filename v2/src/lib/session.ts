import type { Context } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import type { AppEnv, UserRow } from "../types.ts";

const COOKIE_NAME = "session_id";
// Rails の cookies.permanent (20年) 相当。ブラウザ上限の400日にしておく
const MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

type C = Context<AppEnv>;

export async function startNewSession(c: C, userId: number): Promise<void> {
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO sessions (id, user_id, ip_address, user_agent, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
  )
    .bind(id, userId, c.req.header("CF-Connecting-IP") ?? null, c.req.header("User-Agent") ?? null)
    .run();
  await setSignedCookie(c, COOKIE_NAME, id, c.env.COOKIE_SECRET, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: isHttps(c),
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function resumeSession(c: C): Promise<UserRow | null> {
  const id = await getSignedCookie(c, c.env.COOKIE_SECRET, COOKIE_NAME);
  if (!id) return null;
  const row = await c.env.DB.prepare(
    "SELECT users.*, sessions.id AS session_id FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ?",
  )
    .bind(id)
    .first<UserRow & { session_id: string }>();
  if (!row) return null;
  c.set("sessionId", row.session_id);
  const { session_id, ...user } = row;
  return user as UserRow;
}

export async function terminateSession(c: C): Promise<void> {
  const id = c.get("sessionId");
  if (id) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  }
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

function isHttps(c: C): boolean {
  return new URL(c.req.url).protocol === "https:";
}
