import { Hono } from "hono";
import { findEventByToken, findOrderWithItems, ticketTypesForEvent } from "../lib/repo.ts";
import { PublicLayout } from "../views/layouts.tsx";
import {
  OrderCompletePage,
  OrderFormPage,
  publicOgTitle,
  SalesClosedPage,
  type OrderFormValues,
} from "../views/public-orders.tsx";
import type { AppEnv, EventRow } from "../types.ts";

// 会員向け公開ページ（認証不要）。旧 Public::OrdersController の移植
const app = new Hono<AppEnv>();

app.get("/e/:token/orders/new", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  if (event.status !== 0) return c.redirect(`/e/${event.token}/sales_closed`);

  const ticketTypes = await ticketTypesForEvent(c.env.DB, event.id);
  return c.html(
    <PublicLayout
      title={`Ticket Order - ${event.title}`}
      ogTitle={publicOgTitle(event)}
      ogDescription={`${event.player_name}のチケット注文ページ`}
      flash={c.get("flash")}
    >
      <OrderFormPage
        event={event}
        ticketTypes={ticketTypes}
        values={{ customer_name: "", phone_number: "", note: "", quantities: {} }}
        errors={[]}
      />
    </PublicLayout>,
  );
});

app.post("/e/:token/orders", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  if (event.status !== 0) return c.redirect(`/e/${event.token}/sales_closed`, 303);

  const ticketTypes = await ticketTypesForEvent(c.env.DB, event.id);
  const fd = await c.req.formData();
  const str = (key: string) => {
    const v = fd.get(key);
    return typeof v === "string" ? v.trim() : "";
  };

  // items[<ticket_type_id>] = quantity。イベントに属する種別のみ受け付ける
  const quantities: Record<number, number> = {};
  for (const tt of ticketTypes) {
    const raw = fd.get(`items[${tt.id}]`);
    const qty = typeof raw === "string" ? parseInt(raw, 10) : 0;
    if (Number.isFinite(qty) && qty > 0) quantities[tt.id] = qty;
  }

  const values: OrderFormValues = {
    customer_name: str("customer_name"),
    phone_number: str("phone_number"),
    note: str("note"),
    quantities,
  };

  const errors: string[] = [];
  if (!values.customer_name) errors.push("お名前を入力してください");
  if (!values.phone_number) errors.push("電話番号を入力してください");
  if (Object.keys(quantities).length === 0) errors.push("チケットを1枚以上選択してください");

  if (errors.length > 0) {
    return c.html(
      <PublicLayout
        title={`Ticket Order - ${event.title}`}
        ogTitle={publicOgTitle(event)}
        ogDescription={`${event.player_name}のチケット注文ページ`}
        flash={c.get("flash")}
      >
        <OrderFormPage event={event} ticketTypes={ticketTypes} values={values} errors={errors} />
      </PublicLayout>,
      422,
    );
  }

  const orderResult = await c.env.DB.prepare(
    `INSERT INTO orders (event_id, customer_name, phone_number, note, payment_status, delivery_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))`,
  )
    .bind(event.id, values.customer_name, values.phone_number, values.note || null)
    .run();
  const orderId = orderResult.meta.last_row_id;

  try {
    await c.env.DB.batch(
      Object.entries(quantities).map(([ttId, qty]) =>
        c.env.DB.prepare(
          `INSERT INTO order_items (order_id, ticket_type_id, quantity, created_at, updated_at)
           VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        ).bind(orderId, Number(ttId), qty),
      ),
    );
  } catch (e) {
    // 明細の作成に失敗したら注文本体も残さない
    await c.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(orderId).run();
    throw e;
  }

  return c.redirect(`/e/${event.token}/orders/${orderId}`, 303);
});

app.get("/e/:token/orders/:id", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  const order = await findOrderWithItems(c.env.DB, event.id, parseInt(c.req.param("id"), 10) || 0);
  if (!order) return c.notFound();
  return c.html(
    <PublicLayout
      title={`Order Completed - ${event.title}`}
      ogTitle={`注文完了 - ${event.player_name}`}
      ogDescription="チケット注文が完了しました"
      flash={c.get("flash")}
    >
      <OrderCompletePage event={event} order={order} />
    </PublicLayout>,
  );
});

app.get("/e/:token/sales_closed", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  if (event.status === 0) return c.redirect(`/e/${event.token}/orders/new`);
  return c.html(
    <PublicLayout
      title={`受付終了 - ${event.title}`}
      ogTitle={publicOgTitle(event)}
      ogDescription="この興行のチケット申し込みは終了しました"
      flash={c.get("flash")}
    >
      <SalesClosedPage event={event} />
    </PublicLayout>,
  );
});

export default app;
