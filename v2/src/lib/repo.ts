import type { EventRow, OrderItemRow, OrderRow, TicketTypeRow } from "../types.ts";

export type OrderItemWithType = OrderItemRow & { ticket_type_name: string; price: number };
export type OrderWithItems = OrderRow & { items: OrderItemWithType[]; total: number };

export async function findEventByToken(db: D1Database, token: string): Promise<EventRow | null> {
  return db.prepare("SELECT * FROM events WHERE token = ?").bind(token).first<EventRow>();
}

export async function listEventsWithOrderCount(
  db: D1Database,
): Promise<(EventRow & { orders_count: number })[]> {
  const { results } = await db
    .prepare(
      `SELECT events.*,
              (SELECT count(*) FROM orders WHERE orders.event_id = events.id) AS orders_count
       FROM events ORDER BY event_date DESC`,
    )
    .all<EventRow & { orders_count: number }>();
  return results;
}

export async function ticketTypesForEvent(
  db: D1Database,
  eventId: number,
): Promise<TicketTypeRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM ticket_types WHERE event_id = ? ORDER BY position, id")
    .bind(eventId)
    .all<TicketTypeRow>();
  return results;
}

export async function ordersWithItemsForEvent(
  db: D1Database,
  eventId: number,
): Promise<OrderWithItems[]> {
  const [ordersResult, itemsResult] = await db.batch<Record<string, unknown>>([
    db
      .prepare("SELECT * FROM orders WHERE event_id = ? ORDER BY created_at DESC, id DESC")
      .bind(eventId),
    db
      .prepare(
        `SELECT oi.*, tt.name AS ticket_type_name, tt.price
         FROM order_items oi
         JOIN ticket_types tt ON tt.id = oi.ticket_type_id
         WHERE oi.order_id IN (SELECT id FROM orders WHERE event_id = ?)
         ORDER BY tt.position, tt.id`,
      )
      .bind(eventId),
  ]);
  const orders = ordersResult.results as unknown as OrderRow[];
  const items = itemsResult.results as unknown as OrderItemWithType[];
  return orders.map((o) => {
    const own = items.filter((i) => i.order_id === o.id);
    return { ...o, items: own, total: own.reduce((sum, i) => sum + i.quantity * i.price, 0) };
  });
}

export async function findOrderWithItems(
  db: D1Database,
  eventId: number,
  orderId: number,
): Promise<OrderWithItems | null> {
  const order = await db
    .prepare("SELECT * FROM orders WHERE id = ? AND event_id = ?")
    .bind(orderId, eventId)
    .first<OrderRow>();
  if (!order) return null;
  const { results } = await db
    .prepare(
      `SELECT oi.*, tt.name AS ticket_type_name, tt.price
       FROM order_items oi
       JOIN ticket_types tt ON tt.id = oi.ticket_type_id
       WHERE oi.order_id = ?
       ORDER BY tt.position, tt.id`,
    )
    .bind(orderId)
    .all<OrderItemWithType>();
  return {
    ...order,
    items: results,
    total: results.reduce((sum, i) => sum + i.quantity * i.price, 0),
  };
}

// SecureRandom.urlsafe_base64(16) 相当
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
