import { raw } from "hono/html";
import type { Child } from "hono/jsx";
import type { Flash } from "../types.ts";

type HeadProps = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  lang?: boolean;
};

function SharedHead({ title, description, ogTitle, ogDescription }: HeadProps) {
  const ogT = ogTitle ?? title;
  const ogD = ogDescription ?? description;
  return (
    <head>
      <title>{title}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="Cassius Ticket" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="description" content={description} />
      <meta property="og:title" content={ogT} />
      <meta property="og:description" content={ogD} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/images/logo.jpeg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogT} />
      <meta name="twitter:description" content={ogD} />
      <meta name="twitter:image" content="/images/logo.jpeg" />
      <link rel="icon" href="/icon.png" type="image/png" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/icon.png" />
      <link rel="stylesheet" href="/assets/app.css" />
    </head>
  );
}

export function FlashMessages({ flash }: { flash: Flash }) {
  return (
    <>
      {flash.notice && (
        <p
          class="mb-5 py-3 px-4 bg-gray-900 text-white rounded-lg text-sm font-medium shadow-md animate-fade-in-down"
          id="notice"
        >
          {flash.notice}
        </p>
      )}
      {flash.alert && (
        <p
          class="mb-5 py-3 px-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium shadow-sm animate-fade-in-down"
          id="alert"
        >
          {flash.alert}
        </p>
      )}
    </>
  );
}

export function AdminLayout({
  title = "Cassius Ticket",
  flash,
  children,
}: {
  title?: string;
  flash: Flash;
  children: Child;
}) {
  return (
    <>
      {raw("<!DOCTYPE html>")}
      <html>
        <SharedHead title={title} description="チケット管理システム" ogTitle="Cassius Ticket" ogDescription="チケット管理システム" />
        <body class="min-h-screen bg-gray-50 text-gray-800 antialiased font-sans">
          <nav class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div class="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
              <div class="flex items-center gap-6">
                <a href="/" class="font-bold text-lg tracking-tight text-gray-900">
                  Cassius Ticket
                </a>
              </div>
              <form method="post" action="/session/delete">
                <button
                  type="submit"
                  class="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1 cursor-pointer"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </nav>

          <main class="max-w-md mx-auto px-4 py-6 pb-20">
            <FlashMessages flash={flash} />
            {children}
          </main>
          <script src="/js/admin.js" defer></script>
        </body>
      </html>
    </>
  );
}

export function SessionsLayout({ children }: { children: Child }) {
  return (
    <>
      {raw("<!DOCTYPE html>")}
      <html>
        <SharedHead
          title="Cassius Ticket - 管理者ログイン"
          description="Cassius Ticket 管理者ログイン"
          ogTitle="Cassius Ticket"
        />
        <body class="min-h-screen bg-gray-50 text-gray-800 antialiased font-sans flex items-center justify-center">
          <div class="w-full">{children}</div>
        </body>
      </html>
    </>
  );
}

export function PublicLayout({
  title = "チケット注文",
  ogTitle,
  ogDescription,
  flash,
  children,
}: {
  title?: string;
  ogTitle?: string;
  ogDescription?: string;
  flash: Flash;
  children: Child;
}) {
  return (
    <>
      {raw("<!DOCTYPE html>")}
      <html lang="ja">
        <SharedHead
          title={title}
          description={ogDescription ?? "チケット注文ページ"}
          ogTitle={ogTitle ?? title}
          ogDescription={ogDescription ?? "チケット注文ページ"}
        />
        <body class="min-h-screen bg-brand-bg flex items-center justify-center p-4 font-gothic text-gray-800 antialiased">
          <main class="w-full max-w-lg">
            <FlashMessages flash={flash} />
            {children}
          </main>
          <script src="/js/public.js" defer></script>
        </body>
      </html>
    </>
  );
}
