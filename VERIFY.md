# 動作確認手順

## v2 (Cloudflare Workers 版)

### 起動

```bash
mise run v2:dev   # = cd v2 && npm run dev (Tailwindビルド + wrangler dev)
# http://localhost:8787 (ポートは wrangler dev の出力を確認)
```

ローカルD1の初期化（初回 or リセット時）:

```bash
cd v2
npx wrangler d1 migrations apply cassius-ticket --local
npx wrangler d1 execute cassius-ticket --local --file seed.sql
# 管理者パスワード (ローカル): password
```

### 型チェック

```bash
mise run v2:typecheck
```

### curl での主要フロー確認

POST には CSRF (Origin 検証) があるため `-H "Origin: http://localhost:8788"` が必須。
zsh では curl オプションを変数にまとめない（word splitting されず1トークンになる）。

```bash
PORT=8788 JAR=/tmp/cassius-jar.txt; command rm -f $JAR
# ログイン (303 → / なら成功)
curl -s -o /dev/null -w "%{http_code}\n" -c $JAR -b $JAR -X POST \
  -H "Origin: http://localhost:$PORT" -d "password=password" http://localhost:$PORT/session
# イベント一覧 (要ログインcookie)
curl -s -b $JAR http://localhost:$PORT/ | grep -c "イベント一覧"
# CSRF: 外部Origin POST は 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Origin: https://evil.example" \
  -d "password=password" http://localhost:$PORT/session
# 公開注文フォーム (認証不要)
curl -s http://localhost:$PORT/e/dev-open-event-token/orders/new | grep -c "注文する"
# 注文作成 (303 → /e/.../orders/:id なら成功)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -X POST \
  -H "Origin: http://localhost:$PORT" \
  --data-urlencode "customer_name=テスト" -d "phone_number=090-0000-0000&items[1]=1" \
  http://localhost:$PORT/e/dev-open-event-token/orders
```

### ブラウザ (agent-browser) での確認

JS挙動（枚数カウンター・チケット種別の動的追加削除・URLコピー・dropdown・削除confirm）はブラウザで確認する。

```bash
agent-browser --session cassius set viewport 1280 1200   # 重要: デフォルト720だと画面下のボタンをクリックできない
agent-browser --session cassius open http://localhost:8788/
# ログイン → 一覧 → 詳細 → トグル → 公開フォーム → 注文 の順に操作
```

注意点:
- **confirm ダイアログ**（注文削除・イベント削除）: click がブロックされるので、click を単独で投げてから別コマンドで `agent-browser --session cassius dialog accept` する。同一シェルで `click && dialog accept` と繋ぐとデーモンごと詰まる
- クリック後の flash (notice) 確認は、リダイレクト完了を待ってから `get text "#notice"` する（クリック直後だと旧ページを見る）
- DB検証: `npx wrangler d1 execute cassius-ticket --local --command "SELECT ..."`

### DBの後始末

テストで作ったデータはリセットできる:

```bash
cd v2
npx wrangler d1 execute cassius-ticket --local --command "DELETE FROM order_items; DELETE FROM orders; DELETE FROM ticket_types; DELETE FROM events; DELETE FROM sessions; DELETE FROM users; DELETE FROM sqlite_sequence;"
npx wrangler d1 execute cassius-ticket --local --file seed.sql
```

## 旧 Rails 版（切替完了まで）

```bash
mise run up   # docker compose up -d
# http://localhost:3001
```
