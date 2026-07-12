// イベントフォーム (新規/編集) の入力パースとバリデーション。
// Rails の accepts_nested_attributes_for (reject_if: :all_blank, allow_destroy: true) を移植

export type TicketTypeInput = {
  id: number | null;
  name: string;
  price: string;
  position: string;
  destroy: boolean;
};

export type EventInput = {
  title: string;
  player_name: string;
  event_date: string;
  venue: string;
  description: string;
  status: number;
  ticketTypes: TicketTypeInput[];
};

export function parseEventForm(fd: FormData): EventInput {
  const str = (key: string) => {
    const v = fd.get(key);
    return typeof v === "string" ? v.trim() : "";
  };

  const ttMap = new Map<string, Partial<Record<string, string>>>();
  for (const [key, value] of fd.entries()) {
    const m = key.match(/^tt\[([^\]]+)\]\[([^\]]+)\]$/);
    if (!m || typeof value !== "string") continue;
    const [, idx, field] = m;
    if (!ttMap.has(idx)) ttMap.set(idx, {});
    ttMap.get(idx)![field] = value;
  }

  const ticketTypes: TicketTypeInput[] = [...ttMap.values()]
    .map((row) => ({
      id: row.id ? parseInt(row.id, 10) : null,
      name: (row.name ?? "").trim(),
      price: (row.price ?? "").trim(),
      position: (row.position ?? "").trim(),
      destroy: row._destroy === "1",
    }))
    // Rails の reject_if: :all_blank 相当（id/_destroy 以外がすべて空なら行ごと無視）
    .filter((tt) => tt.id !== null || tt.name !== "" || tt.price !== "" || tt.position !== "");

  return {
    title: str("title"),
    player_name: str("player_name"),
    event_date: str("event_date"),
    venue: str("venue"),
    description: str("description"),
    status: str("status") === "closed" ? 1 : 0,
    ticketTypes,
  };
}

export function validateEvent(input: EventInput): string[] {
  const errors: string[] = [];
  if (!input.title) errors.push("興行名を入力してください");
  if (!input.player_name) errors.push("選手名を入力してください");
  if (!input.event_date) errors.push("開催日を入力してください");

  for (const tt of input.ticketTypes) {
    if (tt.destroy) continue;
    if (!tt.name) errors.push("チケット種別の種別名を入力してください");
    const price = Number(tt.price);
    if (tt.price === "" || !Number.isFinite(price) || price < 0) {
      errors.push(`チケット種別${tt.name ? `「${tt.name}」` : ""}の価格は0以上の数値で入力してください`);
    }
  }
  return errors;
}
