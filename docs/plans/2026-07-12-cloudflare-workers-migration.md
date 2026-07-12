# Cloudflare Workers + Hono + D1 への全面移行

## 概要・やりたいこと

Rails 8.1 + SQLite + Kamal (VPS) で動いているチケット販売管理システムを、TypeScript (Hono) + D1 に全面書き換えして Cloudflare Workers に載せ替える。

- 目的: VPS (月額課金) を解約して月額 ¥0 化 + メンテフリー化（OSパッチ・Docker・kamal-proxy の運用を無くす）
- パフォーマンス向上は目的ではない（現状で十分速い）
- 今後の大幅な機能追加は想定しない。**現在の機能がそのまま動けばよい**
- URL `https://cassius-ticket.tools97.com` は維持する

## 前提・わかっていること

### 移行方針（会話で決定済み）

- スタック: **Cloudflare Workers + Hono + D1**（Vercel は DB が別サービスになるため不採用）
- このリポジトリ内の **`v2/` ディレクトリ**で新アプリを開発し、切替完了後にルートへ昇格させる（旧 Rails コードは git 履歴に残る）
- パスワードハッシュ: bcrypt は Workers 無料枠の CPU 制限 (10ms) を超えるため、**WebCrypto の PBKDF2 で作り直す**。管理者1名なのでパスワード再設定1回で済む
- **パスワードリセットメール機能は移植しない**（`PasswordsController` / `PasswordsMailer` は捨てる。忘れたら手動でハッシュを再設定）
- DB データ: 管理者ユーザー1名 + サンプルデータ程度。ほぼ同じデータを D1 に入れたいが、多少変わっても許容

### 現アプリの機能インベントリ（移植対象）

- **認証**: パスワードのみのログイン（`User.first` 固定・email 入力なし）。セッションは DB の `sessions` テーブル + signed cookie (`session_id`, permanent/httponly/lax)。ログインは 3分10回のレートリミットあり
- **管理画面**（要認証、URL パラメータはイベントの `token`）:
  - イベント一覧 `/events`（開催日降順）
  - イベント CRUD（チケット種別のネストフォーム付き。追加・削除・position 順）
  - 受付ステータストグル `PATCH /events/:token/toggle_status`（open ⇄ closed）
  - イベント詳細 = 注文管理: 注文一覧（作成日降順）、支払トグル・受渡トグル・注文削除
- **公開ページ**（認証不要、`/e/:token/...`）:
  - 注文フォーム `orders/new`: チケット種別ごとの枚数選択、氏名（必須）・電話番号（必須）・備考
  - 注文完了画面 `orders/:id`
  - 受付終了ページ `sales_closed`（closed 時に new/create からリダイレクト。open に戻ればフォームへ逆リダイレクト）
- **バリデーション**: Event(title/player_name/event_date 必須, token 一意)、Order(customer_name/phone_number 必須, 明細1件以上)、OrderItem(quantity > 0)、TicketType(name 必須, price >= 0)
- **JS の挙動** (Stimulus): clipboard（注文URLコピー）、dropdown、nested_form（チケット種別の動的追加・削除）、ticket_counter（枚数増減と合計金額表示）
- **その他**: Tailwind CSS v4、OGP メタタグ設定済み、レイアウト3種（管理/公開/ログイン）、PWA manifest（実質未使用なら捨ててよい）

### DB スキーマ（D1 へほぼそのまま移植）

`events` / `ticket_types` / `orders` / `order_items` / `sessions` / `users` の6テーブル。
enum は integer（event.status: 0=open/1=closed、order.payment_status: 0=unpaid/1=paid、order.delivery_status: 0=undelivered/1=delivered）。
`users.password_digest` のみ PBKDF2 形式の文字列に変わる。

### インフラの前提

- `tools97.com` のネームサーバーは既に Cloudflare（確認済み）。現在は A レコードで VPS `198.13.52.210` に直接向いている
- 本番データは VPS 上の Docker ボリューム `cassius_ticket_storage` 内の SQLite。SSH (root) + `kamal` alias または `docker exec` で取り出せる
- 使わない Rails 由来機能: Solid Queue / Solid Cache / Solid Cable / ActionMailer / ActiveJob（ジョブもメールも未使用のため移植不要）
- 移行期間中も本番 (VPS) は稼働し続ける。切替は最後にドメイン付け替えのみ

## 実装計画

### 事前準備 [人間👨‍💻]

- [ ] `wrangler login` を実行して Cloudflare アカウントに認証する（ブラウザ認証が必要なので `! npx wrangler login` で実行）
- [ ] 新しい管理者パスワードを決めておく（PBKDF2 で作り直すため）

### Phase 1: プロジェクト雛形と DB [AI🤖]

- [x] `v2/` に Hono + TypeScript の wrangler プロジェクトを作成（`wrangler.jsonc`、`package.json`、tsconfig）
- [x] D1 データベースを作成し binding を設定（本番用 + ローカルは Miniflare の自動ローカル D1）
- [x] D1 マイグレーション作成: 6テーブル（events / ticket_types / orders / order_items / sessions / users）+ 現行と同じインデックス・外部キー
- [x] PBKDF2 ハッシュ生成・検証ユーティリティ（WebCrypto、`pbkdf2$iters$salt$hash` 形式）とハッシュ生成スクリプトを作成。**反復回数はハッシュ文字列に埋め込み可変にしておく**（Phase 6 の本番実測で最終決定するため）
- [x] ローカル開発用 seed（イベント + チケット種別 + サンプル注文 + 管理者ユーザー）
- [x] `.mise.toml` に `v2:dev` / `v2:deploy` 等のタスクを追加
- [x] `.gitignore` に `v2/node_modules` `.wrangler` 等を追加

### Phase 2: 認証とセッション [AI🤖]

- [ ] セッション基盤: D1 の sessions テーブル + HMAC 署名付き cookie（`hono/cookie` の signed cookie、httponly/lax/永続）。secret は `COOKIE_SECRET` として wrangler secret 管理
- [x] **CSRF 対策**: Rails の標準保護が無くなるため、全 POST/PATCH/DELETE に Origin 検証を実装（`hono/csrf` ミドルウェアを全ルートに適用。フォームは同一オリジン送信のみなのでこれで足りる）
- [x] ログイン画面（パスワードのみ）/ ログイン / ログアウト。認証ミドルウェアで管理画面を保護し、未認証時はログイン画面へリダイレクト（ログイン後に元 URL へ復帰）
- [x] ログインのレートリミット: Workers の **Rate Limiting binding で 10回/60秒**（binding は period が 10s/60s しか選べず現行の「3分10回」は設定不可のため仕様変更。ログイン保護が残ればよい）

### Phase 3: 管理画面 [AI🤖]

- [x] 共通レイアウト（hono/jsx で SSR、Tailwind v4 をビルドして静的配信、フラッシュメッセージ、OGP メタタグ移植）
- [x] イベント一覧（開催日降順、ステータスバッジ）
- [x] イベント作成・編集フォーム（チケット種別のネストフォーム: 動的追加・削除 JS 含む）+ バリデーション（エラー表示は現行同等）
- [x] イベント削除・受付ステータストグル
- [x] イベント詳細 = 注文管理画面（注文一覧、合計金額、支払トグル・受渡トグル・注文削除、注文URLコピーの clipboard JS、dropdown JS）

### Phase 4: 公開ページ [AI🤖]

- [x] 注文フォーム `/e/:token/orders/new`（枚数ステッパー + 合計金額表示の JS、氏名・電話番号・備考、バリデーションエラー表示）
- [x] 注文作成（トランザクションで orders + order_items 保存、明細1件以上チェック）
- [x] 注文完了画面 `/e/:token/orders/:id`
- [x] 受付終了ページ `sales_closed` と open/closed のリダイレクト制御（現行と同じ挙動）

### Phase 5: ローカル動作確認 [AI🤖]

- [x] `wrangler dev` + agent-browser で全画面を実際に操作して確認（ログイン → イベントCRUD → 公開フォームから注文 → トグル操作 → ログアウト）
- [x] **CSRF 保護の確認**: 外部 Origin からの POST（curl で `Origin: https://evil.example` を付けた注文作成等）が拒否されることを1ケース確認
- [x] 旧アプリ (`docker compose up`) と画面・挙動を突き合わせ（ログイン・注文フォーム・イベント詳細のスクリーンショット比較で一致を確認）
- [x] `v2/` 用の確認手順を `VERIFY.md` に追記（新規作成）

### Phase 6: 本番構築とデータ移行 [AI🤖]

- [x] 本番 D1 にマイグレーション適用、`COOKIE_SECRET` を wrangler secret で投入
- [x] `wrangler deploy` で本番デプロイ（workers.dev URL: https://cassius-ticket.d0ne1s-todo.workers.dev）
- [x] **PBKDF2 の本番実測**: 一時 endpoint `/__bench/:iters` で実測。**100,000 に確定**（Workers の WebCrypto は PBKDF2 反復を 100,000 に制限しており 100,001 でエラー。100,000 は hash+verify の2倍負荷でも CPU 制限内 → ログイン1回の verify は余裕）。endpoint は削除して再デプロイ済み
- [x] VPS から本番 SQLite をダンプ（ssh root@198.13.52.210 → docker exec で JSON 取得）し、**カラム名明示のデータのみ INSERT 文**に変換して D1 へ投入（sessions/users は未投入。users は管理者の新パスワード決定後に投入する→切替前の確認セクション）
- [x] **移行データの整合確認**: 件数一致（events 2 / ticket_types 4 / orders 2 / order_items 2）、外部キー孤児ゼロを SQL で検証済み。workers.dev 上で実イベントの注文フォーム表示・closed リダイレクト・管理画面の認証ガードも確認済み

### 切替前の確認 [人間👨‍💻]

- [x] 新しい管理者パスワードのハッシュを生成して伝える: `cd v2 && node scripts/hash-password.ts`（プロンプトにパスワードを入力（画面非表示）→ 出力されたハッシュを Claude に渡す。パスワード自体は渡さなくてよい）→ 本番 D1 の users に投入済み（email は旧本番と同じ admin@example.com、誤パスワードで 303 が返ることも確認済み = verify 実行OK）
- [x] workers.dev URL で本番相当の動作を目視確認（ログイン・注文一連の流れ）: https://cassius-ticket.d0ne1s-todo.workers.dev
- [x] 新パスワードでログインできることを確認
- [x] **VPS に他サービスが載っている件の確認**: shuriken-note-api・n8n・postgres が同居 → ユーザー把握済み。n8n は停止、shuriken-note-api は別の安い VPS へ載せ替え予定とのことで、解約方針に変更なし

### Phase 7: ドメイン切替 [AI🤖]

- [x] Workers のカスタムドメインに `cassius-ticket.tools97.com` を設定（既存 A レコードが「externally managed」でエラー100117になるため、ユーザーがダッシュボードで A レコードを削除 → `wrangler deploy` で設定。wrangler の OAuth は zone:read のみで DNS 削除不可だった）
- [x] `https://cassius-ticket.tools97.com` で疎通確認（DNS が Cloudflare エッジに切替、/up 200、認証ガード 302、実イベントの注文フォーム 200、server: cloudflare）
- [x] 旧 VPS 側はそのまま数日残す（ロールバック用。ただし **DNS 戻しで復旧できるのは切替後に Workers 側で書き込みが発生する前だけ**。注文等の書き込みが1件でも入ったら旧 SQLite とデータが分岐するので、以降は DNS を戻さず Workers を正として障害対応する。戻す場合: A レコード `cassius-ticket` → 198.13.52.210 (DNS only) を再作成）

### 安定稼働確認後の後片付け [人間👨‍💻]

- [ ] 数日〜1週間、実運用（マネージャーの利用）で問題ないことを確認
- [ ] VPS を解約する

### Phase 8: リポジトリの完成形へ [AI🤖]

- [ ] ルートの Rails 一式を削除し、`v2/` の中身をルートへ移動
- [ ] CI (`.github/workflows/ci.yml`) を TS 用に書き換え（typecheck / lint 等）
- [ ] `.mise.toml` から kamal / docker compose 系タスクを削除し、タスク名を `dev` / `deploy` に整理
- [ ] README を新構成（Workers + Hono + D1）に全面更新
- [ ] `VERIFY.md` から旧手順を削除

## ログ

### 試したこと・わかったこと
- 旧 Rails は time_zone 未設定 (UTC) のため注文時刻を UTC で表示していた（潜在バグ）。ロケールも英語のままでバリデーションエラーは英語だった
- Tailwind CSS はビュー変更後に `build:css` の再実行が必要（devタスクは起動時に1回ビルドするだけ）。公開ページのクラスが CSS に入っておらず崩れた事例あり
- agent-browser の ref クリックはビューポート外の要素に空振りする（スクロールしない）。`set viewport 1280 1200` で回避
- Workers の WebCrypto は PBKDF2 反復回数がちょうど 100,000 でプラットフォーム上限（100,001 で 500）。CPU 制限より先にこの上限に当たる
- **VPS (198.13.52.210) には cassius-ticket 以外に shuriken-note-api・n8n・postgres が同居している**。「解約できる」前提と食い違うため、解約前に要確認
- confirm ダイアログは click コマンドをブロックする。click と `dialog accept` を同一シェルで連結するとデーモンごと詰まるので別呼び出しにする

### 方針変更
- 注文時刻の表示は UTC → JST に修正（旧アプリの潜在バグを踏襲しない）
- バリデーションメッセージは英語 → 日本語に変更
- HTTP メソッドは Rails の PATCH/DELETE (`_method` override) を使わず、POST + 専用パス（`/delete`, `/toggle_status` 等）に変更。GET の URL は旧アプリと完全互換を維持
- 削除確認は turbo_confirm → `data-confirm` 属性 + vanilla JS の confirm() に変更
