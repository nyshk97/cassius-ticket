import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Flash } from "../types.ts";

// Rails の flash 相当。リダイレクト時に cookie へ積み、次の描画で読み捨てる
const COOKIE_NAME = "flash";

export function setFlash(c: Context, flash: Flash): void {
  setCookie(c, COOKIE_NAME, JSON.stringify(flash), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });
}

export function takeFlash(c: Context): Flash {
  const raw = getCookie(c, COOKIE_NAME);
  if (!raw) return {};
  deleteCookie(c, COOKIE_NAME, { path: "/" });
  try {
    return JSON.parse(raw) as Flash;
  } catch {
    return {};
  }
}
