import { createMiddleware } from "hono/factory";
import { resumeSession } from "../lib/session.ts";
import { takeFlash } from "../lib/flash.ts";
import type { AppEnv } from "../types.ts";

// 全リクエスト共通: セッション復元と flash の読み出し
export const loadSession = createMiddleware<AppEnv>(async (c, next) => {
  c.set("flash", takeFlash(c));
  const user = await resumeSession(c);
  if (user) c.set("currentUser", user);
  await next();
});

// 管理画面用: 未認証ならログイン画面へ（ログイン後に元のURLへ戻す）
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("currentUser")) {
    const returnTo = new URL(c.req.url);
    const query =
      c.req.method === "GET" && returnTo.pathname !== "/"
        ? `?return_to=${encodeURIComponent(returnTo.pathname + returnTo.search)}`
        : "";
    return c.redirect(`/session/new${query}`);
  }
  await next();
});

// open redirect 防止: サイト内の絶対パスのみ許可
export function safeReturnTo(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}
