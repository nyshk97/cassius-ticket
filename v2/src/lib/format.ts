// 表示用フォーマッタ。
// 旧 Rails は time_zone 未設定 (UTC) のまま注文時刻を表示していたが、v2 では JST で表示する

export function yen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

// "2026-08-11" → "2026年8月11日"
export function formatDateJa(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((s) => parseInt(s, 10));
  return `${y}年${m}月${d}日`;
}

// UTC の "2026-07-12 12:34:56" → JST の "7/12 21:34"
export function formatDateTimeJst(datetimeStr: string): string {
  const utc = new Date(datetimeStr.replace(" ", "T") + "Z");
  const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jst.getUTCMonth() + 1}/${jst.getUTCDate()} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
}

export function eventStatusLabel(status: number): string {
  return status === 0 ? "受付中" : "締切";
}

export function truncateText(s: string, length: number): string {
  return s.length > length ? s.slice(0, length - 1) + "…" : s;
}
