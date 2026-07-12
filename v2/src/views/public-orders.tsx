import type { EventRow, TicketTypeRow } from "../types.ts";
import type { OrderWithItems } from "../lib/repo.ts";
import { formatDateJa, yen } from "../lib/format.ts";

// og:title 用の "選手名 M/D 会場" 表記
export function publicOgTitle(event: EventRow): string {
  const [, m, d] = event.event_date.split("-").map((s) => parseInt(s, 10));
  return `${event.player_name} ${m}/${d} ${event.venue ?? ""}`.trim();
}

function EventDateVenue({ event }: { event: EventRow }) {
  return (
    <div class="flex items-center justify-center gap-4 text-gray-500 text-sm">
      <span class="flex items-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {formatDateJa(event.event_date)}
      </span>
      {event.venue && (
        <span class="flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.venue}
        </span>
      )}
    </div>
  );
}

export type OrderFormValues = {
  customer_name: string;
  phone_number: string;
  note: string;
  quantities: Record<number, number>;
};

export function OrderFormPage({
  event,
  ticketTypes,
  values,
  errors,
}: {
  event: EventRow;
  ticketTypes: TicketTypeRow[];
  values: OrderFormValues;
  errors: string[];
}) {
  return (
    <>
      <header class="text-center mb-4" data-purpose="event-header">
        <h1 class="text-3xl font-bold font-gothic mb-1 text-gray-900 tracking-tight">{event.player_name}</h1>
        <p class="text-base text-gray-500 mb-2">{event.title}</p>
        <EventDateVenue event={event} />
      </header>

      <section class="bg-white rounded-2xl p-8 card-shadow" data-purpose="order-form-container">
        <form method="post" action={`/e/${event.token}/orders`} class="space-y-8">
          {errors.length > 0 && (
            <div class="bg-red-50 text-red-600 rounded-lg p-4 text-sm border border-red-100">
              <ul class="list-disc list-inside space-y-1">
                {errors.map((msg) => (
                  <li>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          <div data-purpose="form-section-name">
            <label for="customer_name" class="block text-base font-bold mb-3">
              お名前
            </label>
            <input
              type="text"
              name="customer_name"
              id="customer_name"
              value={values.customer_name}
              required
              class="w-full px-4 py-3 rounded-xl border border-gray-200 custom-focus text-gray-700 placeholder-gray-400 text-base"
              placeholder="例：山田太郎"
            />
            <p class="mt-2 text-xs text-gray-400">※LINEの登録名など、誰か分かる名前をお願いします</p>
          </div>

          <div data-purpose="form-section-phone">
            <label for="phone_number" class="block text-base font-bold mb-3">
              電話番号
            </label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              value={values.phone_number}
              required
              class="w-full px-4 py-3 rounded-xl border border-gray-200 custom-focus text-gray-700 placeholder-gray-400 text-base"
              placeholder="例：090-1234-5678"
            />
            <p class="mt-2 text-xs text-gray-400">※本人確認のため、電話番号のご記入をお願いします</p>
          </div>

          <div data-purpose="form-section-tickets">
            <label class="block text-base font-bold mb-4">チケット枚数</label>
            <div class="space-y-3">
              {ticketTypes.map((tt) => {
                const qty = values.quantities[tt.id] ?? 0;
                return (
                  <div
                    class="ticket-row bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm"
                    data-ticket-counter
                  >
                    <div>
                      <p class="font-bold text-gray-900">{tt.name}</p>
                      <p class="text-gray-500 text-sm">{yen(tt.price)}</p>
                    </div>
                    <div class="flex items-center gap-4">
                      <input
                        type="number"
                        name={`items[${tt.id}]`}
                        min={0}
                        value={String(qty)}
                        class="sr-only"
                        data-counter-input
                      />
                      <button
                        type="button"
                        class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                        data-counter-decrement
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <span class="text-base font-medium w-4 text-center" data-counter-display>
                        {qty}
                      </span>
                      <button
                        type="button"
                        class="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                        data-counter-increment
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div data-purpose="form-section-remarks">
            <label for="note" class="block text-base font-bold mb-3">
              備考（任意）
            </label>
            <textarea
              name="note"
              id="note"
              rows={3}
              class="w-full px-4 py-3 rounded-xl border border-gray-200 custom-focus text-gray-700 placeholder-gray-400 resize-none text-base"
              placeholder="連絡事項があればご記入ください"
            >
              {values.note}
            </textarea>
          </div>

          <div data-purpose="form-submit">
            <button
              type="submit"
              class="btn-order w-full text-white font-bold py-4 px-6 rounded-xl cursor-pointer text-base flex items-center justify-center gap-2"
            >
              <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
                />
              </svg>
              <span>注文する</span>
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export function OrderCompletePage({ event, order }: { event: EventRow; order: OrderWithItems }) {
  return (
    <>
      <header class="text-center mb-4" data-purpose="completion-header">
        <div class="inline-flex items-center justify-center p-2.5 rounded-full bg-emerald-50">
          <div class="inline-flex items-center justify-center p-2.5 rounded-full bg-emerald-100/60">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-200/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <h1 class="text-2xl font-bold font-gothic mb-3 text-gray-900 tracking-tight">注文が完了しました</h1>

        <section class="w-full bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-2 text-left">
          <div class="flex items-start gap-3">
            <div class="mt-1 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-blue-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="space-y-4 w-full">
              <p class="text-sm font-bold text-blue-800 leading-relaxed">
                ご注文内容の控えとして
                <br />
                この画面のスクリーンショットを保存してください
              </p>
              <hr class="border-blue-200" />
              <p class="text-sm font-bold text-blue-700 leading-relaxed">
                チケットの受け渡しとお支払いは
                <br />
                ジムにてマネージャーに直接ご確認ください
              </p>
            </div>
          </div>
        </section>
      </header>

      <section class="bg-white rounded-2xl p-8 card-shadow mb-8" data-purpose="order-details-container">
        <div class="border-b border-gray-100 pb-3 mb-4">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">注文内容</span>
        </div>

        <div class="space-y-4 mb-6">
          <div>
            <p class="text-xs text-gray-500 mb-1">選手名</p>
            <p class="text-xl font-bold text-gray-900">{event.player_name}</p>
          </div>

          <div>
            <p class="text-xs text-gray-500 mb-1">興行名</p>
            <p class="text-base text-gray-600">{event.title}</p>
          </div>

          <div>
            <p class="text-xs text-gray-500 mb-1">お名前</p>
            <p class="text-base font-bold text-gray-900">
              {order.customer_name} <span class="text-sm font-normal text-gray-500 ml-1">様</span>
            </p>
          </div>

          {order.phone_number && (
            <div>
              <p class="text-xs text-gray-500 mb-1">電話番号</p>
              <p class="text-base font-bold text-gray-900">{order.phone_number}</p>
            </div>
          )}
        </div>

        <div class="bg-gray-50 rounded-xl p-4 space-y-4 mb-6">
          {order.items.map((item) => (
            <div class="flex justify-between items-end border-b border-gray-200 pb-3 last:border-0 last:pb-0">
              <div>
                <p class="font-bold text-gray-900">{item.ticket_type_name}</p>
                <p class="text-sm text-gray-500">{yen(item.price)}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500 mb-1">× {item.quantity}</p>
                <p class="font-bold text-gray-900">{yen(item.quantity * item.price)}</p>
              </div>
            </div>
          ))}

          <div class="flex justify-between items-center pt-2">
            <span class="text-gray-500 font-medium">合計金額</span>
            <span class="text-xl font-black text-blue-600">{yen(order.total)}</span>
          </div>
        </div>

        {order.note && (
          <div>
            <p class="text-xs text-gray-500 mb-2">備考</p>
            <p class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 min-h-[60px]">{order.note}</p>
          </div>
        )}
      </section>
    </>
  );
}

export function SalesClosedPage({ event }: { event: EventRow }) {
  return (
    <>
      <header class="text-center mb-4" data-purpose="sales-closed-header">
        <div class="inline-flex items-center justify-center p-2.5 rounded-full bg-amber-50">
          <div class="inline-flex items-center justify-center p-2.5 rounded-full bg-amber-100/60">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
          </div>
        </div>
        <h1 class="text-2xl font-bold font-gothic mb-2 text-gray-900 tracking-tight">チケット申し込みは終了しました</h1>
        <p class="text-sm text-gray-500 mb-4">
          {event.player_name} — {event.title}
        </p>
        <div class="mb-6">
          <EventDateVenue event={event} />
        </div>
      </header>

      <section class="bg-white rounded-2xl p-8 card-shadow text-center" data-purpose="sales-closed-message">
        <p class="text-gray-700 text-sm leading-relaxed">
          本興行のチケット申し込み受付は終了しました
          <br />
          ご不明な点があればLINEにてご連絡ください
        </p>
      </section>
    </>
  );
}
