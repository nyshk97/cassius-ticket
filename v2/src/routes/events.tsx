import { Hono, type Context } from "hono";
import { setFlash } from "../lib/flash.ts";
import { parseEventForm, validateEvent, type EventInput } from "../lib/event-form.ts";
import {
  findEventByToken,
  generateToken,
  listEventsWithOrderCount,
  ordersWithItemsForEvent,
  ticketTypesForEvent,
} from "../lib/repo.ts";
import { requireAuth } from "../middleware/auth.ts";
import { AdminLayout } from "../views/layouts.tsx";
import { EventFormPage, EventIndexPage, EventShowPage, type EventFormValues } from "../views/events.tsx";
import type { AppEnv, EventRow, TicketTypeRow } from "../types.ts";

const app = new Hono<AppEnv>();

app.use("/", requireAuth);
app.use("/events", requireAuth);
app.use("/events/*", requireAuth);

const NOW = "datetime('now')";

async function index(c: Context<AppEnv>) {
  const events = await listEventsWithOrderCount(c.env.DB);
  return c.html(
    <AdminLayout flash={c.get("flash")}>
      <EventIndexPage events={events} />
    </AdminLayout>,
  );
}

app.get("/", index);
app.get("/events", index);

app.get("/events/new", (c) => {
  return c.html(
    <AdminLayout flash={c.get("flash")}>
      <EventFormPage
        heading="イベント作成"
        action="/events"
        cancelPath="/events"
        submitLabel="作成する"
        values={emptyFormValues()}
        errors={[]}
      />
    </AdminLayout>,
  );
});

app.post("/events", async (c) => {
  const input = parseEventForm(await c.req.formData());
  const errors = validateEvent(input);
  if (errors.length > 0) {
    return c.html(
      <AdminLayout flash={c.get("flash")}>
        <EventFormPage
          heading="イベント作成"
          action="/events"
          cancelPath="/events"
          submitLabel="作成する"
          values={inputToFormValues(input)}
          errors={errors}
        />
      </AdminLayout>,
      422,
    );
  }

  const token = generateToken();
  const result = await c.env.DB.prepare(
    `INSERT INTO events (title, player_name, event_date, venue, description, status, token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ${NOW}, ${NOW})`,
  )
    .bind(
      input.title,
      input.player_name,
      input.event_date,
      input.venue || null,
      input.description || null,
      input.status,
      token,
    )
    .run();
  const eventId = result.meta.last_row_id;

  const inserts = input.ticketTypes
    .filter((tt) => !tt.destroy)
    .map((tt) =>
      c.env.DB.prepare(
        `INSERT INTO ticket_types (event_id, name, price, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ${NOW}, ${NOW})`,
      ).bind(eventId, tt.name, Number(tt.price), Number(tt.position) || 0),
    );
  if (inserts.length > 0) await c.env.DB.batch(inserts);

  setFlash(c, { notice: "イベントを作成しました。" });
  return c.redirect(`/events/${token}`, 303);
});

app.get("/events/:token", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  const [ticketTypes, orders] = await Promise.all([
    ticketTypesForEvent(c.env.DB, event.id),
    ordersWithItemsForEvent(c.env.DB, event.id),
  ]);
  const orderUrl = `${new URL(c.req.url).origin}/e/${event.token}/orders/new`;
  return c.html(
    <AdminLayout flash={c.get("flash")}>
      <EventShowPage event={event} ticketTypes={ticketTypes} orders={orders} orderUrl={orderUrl} />
    </AdminLayout>,
  );
});

app.get("/events/:token/edit", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  const ticketTypes = await ticketTypesForEvent(c.env.DB, event.id);
  return c.html(
    <AdminLayout flash={c.get("flash")}>
      <EventFormPage
        heading="イベント編集"
        action={`/events/${event.token}`}
        cancelPath={`/events/${event.token}`}
        submitLabel="更新する"
        values={rowsToFormValues(event, ticketTypes)}
        errors={[]}
      />
    </AdminLayout>,
  );
});

app.post("/events/:token", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();

  const input = parseEventForm(await c.req.formData());
  const errors = validateEvent(input);

  // 注文があるチケット種別は削除不可 (Rails: dependent: :restrict_with_error)
  const destroyIds = input.ticketTypes.filter((tt) => tt.destroy && tt.id !== null).map((tt) => tt.id!);
  if (destroyIds.length > 0) {
    const placeholders = destroyIds.map(() => "?").join(",");
    const { results } = await c.env.DB.prepare(
      `SELECT DISTINCT tt.name FROM ticket_types tt
       JOIN order_items oi ON oi.ticket_type_id = tt.id
       WHERE tt.id IN (${placeholders}) AND tt.event_id = ?`,
    )
      .bind(...destroyIds, event.id)
      .all<{ name: string }>();
    for (const row of results) {
      errors.push(`チケット種別「${row.name}」は注文があるため削除できません`);
    }
  }

  if (errors.length > 0) {
    return c.html(
      <AdminLayout flash={c.get("flash")}>
        <EventFormPage
          heading="イベント編集"
          action={`/events/${event.token}`}
          cancelPath={`/events/${event.token}`}
          submitLabel="更新する"
          values={inputToFormValues(input)}
          errors={errors}
        />
      </AdminLayout>,
      422,
    );
  }

  const statements = [
    c.env.DB.prepare(
      `UPDATE events SET title = ?, player_name = ?, event_date = ?, venue = ?, description = ?, status = ?, updated_at = ${NOW}
       WHERE id = ?`,
    ).bind(
      input.title,
      input.player_name,
      input.event_date,
      input.venue || null,
      input.description || null,
      input.status,
      event.id,
    ),
  ];
  for (const tt of input.ticketTypes) {
    if (tt.destroy) {
      if (tt.id !== null) {
        statements.push(
          c.env.DB.prepare("DELETE FROM ticket_types WHERE id = ? AND event_id = ?").bind(tt.id, event.id),
        );
      }
    } else if (tt.id !== null) {
      statements.push(
        c.env.DB.prepare(
          `UPDATE ticket_types SET name = ?, price = ?, position = ?, updated_at = ${NOW}
           WHERE id = ? AND event_id = ?`,
        ).bind(tt.name, Number(tt.price), Number(tt.position) || 0, tt.id, event.id),
      );
    } else {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO ticket_types (event_id, name, price, position, created_at, updated_at)
           VALUES (?, ?, ?, ?, ${NOW}, ${NOW})`,
        ).bind(event.id, tt.name, Number(tt.price), Number(tt.position) || 0),
      );
    }
  }
  await c.env.DB.batch(statements);

  setFlash(c, { notice: "イベントを更新しました。" });
  return c.redirect(`/events/${event.token}`, 303);
});

app.post("/events/:token/toggle_status", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  const newStatus = event.status === 0 ? 1 : 0;
  await c.env.DB.prepare(`UPDATE events SET status = ?, updated_at = ${NOW} WHERE id = ?`)
    .bind(newStatus, event.id)
    .run();
  setFlash(c, { notice: `ステータスを「${newStatus === 0 ? "受付中" : "締切"}」に変更しました。` });
  return c.redirect(`/events/${event.token}`, 303);
});

app.post("/events/:token/delete", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  await c.env.DB.batch([
    c.env.DB.prepare(
      "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE event_id = ?)",
    ).bind(event.id),
    c.env.DB.prepare("DELETE FROM orders WHERE event_id = ?").bind(event.id),
    c.env.DB.prepare("DELETE FROM ticket_types WHERE event_id = ?").bind(event.id),
    c.env.DB.prepare("DELETE FROM events WHERE id = ?").bind(event.id),
  ]);
  setFlash(c, { notice: "イベントを削除しました。" });
  return c.redirect("/events", 303);
});

// --- 注文管理 (旧 Admin::OrdersController) ---

async function findOrder(c: { env: Env }, eventId: number, orderId: string) {
  return c.env.DB.prepare("SELECT * FROM orders WHERE id = ? AND event_id = ?")
    .bind(parseInt(orderId, 10) || 0, eventId)
    .first<{ id: number; customer_name: string; payment_status: number; delivery_status: number }>();
}

app.post("/events/:token/orders/:id/toggle_payment", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  const order = await findOrder(c, event.id, c.req.param("id"));
  if (!order) return c.notFound();
  const newStatus = order.payment_status === 0 ? 1 : 0;
  await c.env.DB.prepare(`UPDATE orders SET payment_status = ?, updated_at = ${NOW} WHERE id = ?`)
    .bind(newStatus, order.id)
    .run();
  setFlash(c, {
    notice: `${order.customer_name}の支払い状況を「${newStatus === 1 ? "支払済" : "未払い"}」に変更しました。`,
  });
  return c.redirect(`/events/${event.token}`, 303);
});

app.post("/events/:token/orders/:id/toggle_delivery", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  const order = await findOrder(c, event.id, c.req.param("id"));
  if (!order) return c.notFound();
  const newStatus = order.delivery_status === 0 ? 1 : 0;
  await c.env.DB.prepare(`UPDATE orders SET delivery_status = ?, updated_at = ${NOW} WHERE id = ?`)
    .bind(newStatus, order.id)
    .run();
  setFlash(c, {
    notice: `${order.customer_name}の受渡状況を「${newStatus === 1 ? "受渡済" : "未受渡"}」に変更しました。`,
  });
  return c.redirect(`/events/${event.token}`, 303);
});

app.post("/events/:token/orders/:id/delete", async (c) => {
  const event = await findEventByToken(c.env.DB, c.req.param("token"));
  if (!event) return c.notFound();
  const order = await findOrder(c, event.id, c.req.param("id"));
  if (!order) return c.notFound();
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(order.id),
    c.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(order.id),
  ]);
  setFlash(c, { notice: "注文を削除しました。" });
  return c.redirect(`/events/${event.token}`, 303);
});

// --- フォーム値変換 ---

function emptyFormValues(): EventFormValues {
  return {
    title: "",
    player_name: "",
    event_date: "",
    venue: "",
    description: "",
    status: 0,
    // Rails: new では空のチケット種別を1行用意する
    ticketTypes: [{ id: null, name: "", price: "", position: "0", destroy: false }],
  };
}

function rowsToFormValues(event: EventRow, ticketTypes: TicketTypeRow[]): EventFormValues {
  const tts = ticketTypes.map((tt) => ({
    id: tt.id,
    name: tt.name,
    price: String(tt.price),
    position: String(tt.position),
    destroy: false,
  }));
  // Rails: edit でチケット種別が無ければ空行を1行用意する
  if (tts.length === 0) tts.push({ id: null as unknown as number, name: "", price: "", position: "0", destroy: false });
  return {
    title: event.title,
    player_name: event.player_name,
    event_date: event.event_date,
    venue: event.venue ?? "",
    description: event.description ?? "",
    status: event.status,
    ticketTypes: tts as EventFormValues["ticketTypes"],
  };
}

function inputToFormValues(input: EventInput): EventFormValues {
  return {
    title: input.title,
    player_name: input.player_name,
    event_date: input.event_date,
    venue: input.venue,
    description: input.description,
    status: input.status,
    ticketTypes: input.ticketTypes.map((tt) => ({
      id: tt.id,
      name: tt.name,
      price: tt.price,
      position: tt.position,
      destroy: tt.destroy,
    })),
  };
}

export default app;
