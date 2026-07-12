import type { EventRow } from "../types.ts";
import type { OrderWithItems } from "../lib/repo.ts";
import type { TicketTypeRow } from "../types.ts";
import { eventStatusLabel, formatDateJa, formatDateTimeJst, truncateText, yen } from "../lib/format.ts";

const CalendarIcon = ({ class: cls }: { class: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class={cls}>
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

const PlusIcon = ({ class: cls }: { class: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class={cls}>
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = ({ class: cls }: { class: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class={cls}>
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

export function EventIndexPage({ events }: { events: (EventRow & { orders_count: number })[] }) {
  return (
    <>
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-bold text-2xl tracking-tight">イベント一覧</h1>
        <a
          href="/events/new"
          class="rounded-full bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 flex items-center justify-center shadow-sm transition active:scale-95"
        >
          <PlusIcon class="w-5 h-5" />
        </a>
      </div>

      {events.length > 0 ? (
        <div class="space-y-4">
          {events.map((event) => (
            <a
              href={`/events/${event.token}`}
              class="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all active:bg-gray-50"
            >
              <div class="flex justify-between items-start mb-2">
                <span
                  class={`text-xs px-2.5 py-1 rounded-full font-semibold tracking-wide ${
                    event.status === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {eventStatusLabel(event.status)}
                </span>
                <span class="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  注文 {event.orders_count} 件
                </span>
              </div>

              <h2 class="font-bold text-lg text-gray-900 leading-snug mb-0.5 line-clamp-2">{event.player_name}</h2>
              <p class="text-base text-gray-500 mb-1.5 line-clamp-2">{event.title}</p>

              <div class="flex items-center text-sm text-gray-500">
                <CalendarIcon class="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
                {formatDateJa(event.event_date)}
                {event.venue && (
                  <>
                    <span class="mx-1.5">・</span>
                    <span class="truncate">{event.venue}</span>
                  </>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div class="bg-white rounded-xl border border-gray-200 border-dashed text-center py-16 px-6">
          <div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon class="w-6 h-6 text-gray-400" />
          </div>
          <h3 class="text-gray-900 font-semibold mb-1">イベントがありません</h3>
          <p class="text-sm text-gray-500 mb-6">
            右上の「＋」ボタンから
            <br />
            新しいイベントを作成してください
          </p>
        </div>
      )}
    </>
  );
}

function TicketTypeSummary({ ticketTypes, orders }: { ticketTypes: TicketTypeRow[]; orders: OrderWithItems[] }) {
  return (
    <div class="space-y-1">
      {ticketTypes.map((tt) => {
        const totalQty = orders.reduce(
          (sum, o) => sum + o.items.filter((i) => i.ticket_type_id === tt.id).reduce((s, i) => s + i.quantity, 0),
          0,
        );
        return (
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-700 font-medium">
              {tt.name} <span class="text-xs text-gray-400 font-normal ml-1">({yen(tt.price)})</span>
            </span>
            <span class="font-bold text-gray-900">{totalQty}枚</span>
          </div>
        );
      })}
    </div>
  );
}

export function EventShowPage({
  event,
  ticketTypes,
  orders,
  orderUrl,
}: {
  event: EventRow;
  ticketTypes: TicketTypeRow[];
  orders: OrderWithItems[];
  orderUrl: string;
}) {
  const isOpen = event.status === 0;
  return (
    <>
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="font-bold text-2xl tracking-tight text-gray-900">{event.player_name}</h1>
            <p class="text-base text-gray-500 mt-0.5">{event.title}</p>
          </div>
          <a href={`/events/${event.token}/edit`} class="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full shadow-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
          </a>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
          <div class="flex items-center gap-1.5">
            <CalendarIcon class="w-4 h-4 text-gray-400" />
            {formatDateJa(event.event_date)}
          </div>
          {event.venue && (
            <div class="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {event.venue}
            </div>
          )}
          <form method="post" action={`/events/${event.token}/toggle_status`} class="ml-auto">
            <button type="submit" class="cursor-pointer">
              <span
                class={`text-xs px-2.5 py-1 rounded-full font-semibold tracking-wide border ${
                  isOpen ? "border-green-200 bg-green-100 text-green-700" : "border-gray-200 bg-gray-200 text-gray-600"
                }`}
              >
                {eventStatusLabel(event.status)}
              </span>
            </button>
          </form>
        </div>

        <div class="bg-gray-100/80 rounded-xl border border-gray-200/50 p-4" data-clipboard>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">注文ページURL</p>
          <div class="flex items-center gap-2">
            <input
              type="text"
              value={orderUrl}
              readonly
              data-clipboard-source
              class="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-0 w-full px-3 py-2 truncate"
              onclick="this.select()"
            />
            <button
              type="button"
              data-clipboard-copy
              class="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 active:bg-gray-900 rounded-lg transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4" data-clipboard-icon>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                />
              </svg>
              <span data-clipboard-label>コピー</span>
            </button>
          </div>
        </div>
      </div>

      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-lg text-gray-900">注文管理</h2>
          <span class="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{orders.length}件</span>
        </div>

        {orders.length > 0 ? (
          <>
            <div class="bg-gray-100/80 rounded-xl p-4 mb-5 border border-gray-200/50">
              <div class="flex justify-between items-center mb-3">
                <span class="text-sm font-medium text-gray-600">合計売上</span>
                <span class="font-bold text-xl text-gray-900">{yen(orders.reduce((s, o) => s + o.total, 0))}</span>
              </div>
              <div class="flex gap-4 text-sm pt-3 border-t border-gray-200/60 mb-4">
                <div class="flex-1">
                  <p class="text-xs font-medium text-gray-500 mb-1">支払済</p>
                  <p class="font-semibold text-green-600">
                    {orders.filter((o) => o.payment_status === 1).length}
                    <span class="text-xs text-gray-400 font-normal"> / {orders.length}</span>
                  </p>
                </div>
                <div class="flex-1 border-l border-gray-200/60 pl-4">
                  <p class="text-xs font-medium text-gray-500 mb-1">受渡済</p>
                  <p class="font-semibold text-blue-600">
                    {orders.filter((o) => o.delivery_status === 1).length}
                    <span class="text-xs text-gray-400 font-normal"> / {orders.length}</span>
                  </p>
                </div>
              </div>
              {ticketTypes.length > 0 && (
                <div class="pt-3 border-t border-gray-200/60">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">チケット種別集計</p>
                  <TicketTypeSummary ticketTypes={ticketTypes} orders={orders} />
                </div>
              )}
            </div>

            <div class="space-y-2">
              {orders.map((order) => (
                <div class="bg-white rounded-lg border border-gray-200 px-3 py-2.5 shadow-sm hover:border-gray-300 transition-colors">
                  <div class="flex justify-between items-baseline gap-2 mb-1.5">
                    <div class="flex items-baseline gap-2 min-w-0">
                      <span class="font-semibold text-gray-900 text-sm truncate">{order.customer_name}</span>
                      <span class="text-xs text-gray-400 shrink-0">{formatDateTimeJst(order.created_at)}</span>
                    </div>
                    <span class="font-semibold text-gray-900 text-sm shrink-0">{yen(order.total)}</span>
                  </div>
                  <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                    <div class="flex flex-wrap items-center gap-x-2 min-w-0">
                      <span class="text-xs text-gray-600">
                        {order.items.map((item, i) => `${i > 0 ? " " : ""}${item.ticket_type_name} ${item.quantity}枚`).join("")}
                      </span>
                      {order.note && (
                        <span class="text-xs text-gray-400 truncate max-w-[120px]" title={order.note}>
                          ・{truncateText(order.note, 12)}
                        </span>
                      )}
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <form method="post" action={`/events/${event.token}/orders/${order.id}/toggle_payment`} class="inline-block">
                        <button type="submit" class="cursor-pointer">
                          <span
                            class={`text-[11px] px-2 py-1 rounded-full font-medium border transition-colors inline-block ${
                              order.payment_status === 1
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-white border-gray-300 text-gray-500"
                            }`}
                          >
                            {order.payment_status === 1 ? "支払済" : "未払い"}
                          </span>
                        </button>
                      </form>
                      <form method="post" action={`/events/${event.token}/orders/${order.id}/toggle_delivery`} class="inline-block">
                        <button type="submit" class="cursor-pointer">
                          <span
                            class={`text-[11px] px-2 py-1 rounded-full font-medium border transition-colors inline-block ${
                              order.delivery_status === 1
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-white border-gray-300 text-gray-500"
                            }`}
                          >
                            {order.delivery_status === 1 ? "受渡済" : "未受渡"}
                          </span>
                        </button>
                      </form>
                      <details class="relative inline-block shrink-0" data-dropdown>
                        <summary class="list-none cursor-pointer p-1.5 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors inline-flex items-center justify-center [&::-webkit-details-marker]:hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                            />
                          </svg>
                        </summary>
                        <div class="absolute right-0 z-10 mt-0.5 py-1 min-w-[120px] bg-white rounded-lg shadow-lg border border-gray-200">
                          <form method="post" action={`/events/${event.token}/orders/${order.id}/delete`} data-confirm="この注文を削除しますか？">
                            <button
                              type="submit"
                              class="w-full text-left text-sm px-3 py-2 text-red-600 hover:bg-red-50 rounded-none first:rounded-t-lg last:rounded-b-lg cursor-pointer border-0 bg-transparent"
                            >
                              削除
                            </button>
                          </form>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div class="bg-gray-50 rounded-xl border border-gray-200 border-dashed text-center py-12 px-6 mb-5">
              <p class="text-gray-500 text-sm font-medium">まだ注文はありません</p>
            </div>
            {ticketTypes.length > 0 && (
              <div class="bg-gray-100/80 rounded-xl border border-gray-200/50 p-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">チケット種別集計</p>
                <TicketTypeSummary ticketTypes={ticketTypes} orders={orders} />
              </div>
            )}
          </>
        )}
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-gray-200">
        <a href="/events" class="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 mr-1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          一覧に戻る
        </a>

        <form
          method="post"
          action={`/events/${event.token}/delete`}
          data-confirm={"本当に削除しますか？\n（関連する注文もすべて削除されます）"}
        >
          <button type="submit" class="text-xs font-semibold text-red-400 hover:text-red-600 px-3 py-2 bg-red-50 rounded-lg cursor-pointer">
            イベントを削除
          </button>
        </form>
      </div>
    </>
  );
}

// フォームの再描画に使う値（DB行 or 送信された入力値のどちらからでも作る）
export type EventFormValues = {
  title: string;
  player_name: string;
  event_date: string;
  venue: string;
  description: string;
  status: number;
  ticketTypes: { id: number | null; name: string; price: string; position: string; destroy: boolean }[];
};

function TicketTypeFields({
  idx,
  tt,
}: {
  idx: string;
  tt: EventFormValues["ticketTypes"][number];
}) {
  return (
    <div
      class="nested-fields bg-gray-50 rounded-lg border border-gray-200 p-3 relative"
      data-nested-field
      style={tt.destroy ? "display: none" : undefined}
    >
      {tt.id !== null && <input type="hidden" name={`tt[${idx}][id]`} value={String(tt.id)} />}
      <input type="hidden" name={`tt[${idx}][_destroy]`} value={tt.destroy ? "1" : "0"} data-destroy-flag />

      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="col-span-2">
          <label class="block text-xs font-semibold text-gray-600 mb-1">種別名</label>
          <input
            type="text"
            name={`tt[${idx}][name]`}
            value={tt.name}
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="例：S席"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">価格（円）</label>
          <input
            type="number"
            name={`tt[${idx}][price]`}
            value={tt.price}
            min={0}
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="5000"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">並び順</label>
          <input
            type="number"
            name={`tt[${idx}][position]`}
            value={tt.position || "0"}
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>
      </div>

      <div class="flex justify-end border-t border-gray-200 pt-2">
        <button
          type="button"
          data-nested-remove
          class="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer px-2 py-1 rounded hover:bg-red-50"
        >
          <TrashIcon class="w-3.5 h-3.5" />
          削除
        </button>
      </div>
    </div>
  );
}

export function EventFormPage({
  heading,
  action,
  cancelPath,
  submitLabel,
  values,
  errors,
}: {
  heading: string;
  action: string;
  cancelPath: string;
  submitLabel: string;
  values: EventFormValues;
  errors: string[];
}) {
  return (
    <>
      <h1 class="font-bold text-2xl mb-6">{heading}</h1>
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <form method="post" action={action} class="space-y-5">
          {errors.length > 0 && (
            <div class="bg-red-50 text-red-600 rounded-lg p-4 text-sm shadow-sm border border-red-100">
              <p class="font-semibold mb-2">{errors.length}件のエラーがあります:</p>
              <ul class="list-disc list-inside space-y-1">
                {errors.map((msg) => (
                  <li>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div>
              <label for="title" class="block text-sm font-bold text-gray-700 mb-1.5">
                興行名
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={values.title}
                required
                class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base focus:border-blue-500 focus:ring focus:ring-blue-200 transition-shadow"
                placeholder="例：PHOENIX BATTLE 150"
              />
            </div>

            <div>
              <label for="player_name" class="block text-sm font-bold text-gray-700 mb-1.5">
                選手名
              </label>
              <input
                type="text"
                name="player_name"
                id="player_name"
                value={values.player_name}
                required
                class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base focus:border-blue-500 focus:ring focus:ring-blue-200 transition-shadow"
                placeholder="例：栗原宗太郎"
              />
            </div>

            <div>
              <label for="event_date" class="block text-sm font-bold text-gray-700 mb-1.5">
                開催日
              </label>
              <input
                type="date"
                name="event_date"
                id="event_date"
                value={values.event_date}
                required
                class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base focus:border-blue-500 focus:ring focus:ring-blue-200 transition-shadow"
              />
            </div>

            <div>
              <label for="venue" class="block text-sm font-bold text-gray-700 mb-1.5">
                会場
              </label>
              <input
                type="text"
                name="venue"
                id="venue"
                value={values.venue}
                class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base focus:border-blue-500 focus:ring focus:ring-blue-200 transition-shadow"
                placeholder="例: 後楽園ホール"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-bold text-gray-700 mb-1.5">
                説明・備考
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base focus:border-blue-500 focus:ring focus:ring-blue-200 transition-shadow"
                placeholder="任意"
              >
                {values.description}
              </textarea>
            </div>

            <div>
              <label for="status" class="block text-sm font-bold text-gray-700 mb-1.5">
                受付状況
              </label>
              <select
                name="status"
                id="status"
                class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base focus:border-blue-500 focus:ring focus:ring-blue-200 transition-shadow bg-white"
              >
                <option value="open" selected={values.status === 0}>
                  受付中
                </option>
                <option value="closed" selected={values.status === 1}>
                  締切
                </option>
              </select>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm" data-nested-form>
            <h3 class="text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
              <span>チケット種別</span>
            </h3>

            <div data-nested-container class="space-y-4 mb-4">
              {values.ticketTypes.map((tt, i) => (
                <TicketTypeFields idx={String(i)} tt={tt} />
              ))}
            </div>

            <template data-nested-template>
              <TicketTypeFields
                idx="NEW_RECORD"
                tt={{ id: null, name: "", price: "", position: "0", destroy: false }}
              />
            </template>

            <button
              type="button"
              data-nested-add
              class="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <PlusIcon class="w-5 h-5" />
              チケット種別を追加
            </button>
          </div>

          <div class="pt-4 sticky bottom-4">
            <button
              type="submit"
              class="w-full rounded-xl px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              {submitLabel}
            </button>
            <div class="text-center mt-4">
              <a href={cancelPath} class="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2">
                キャンセル
              </a>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
