# Cassius Ticket

ボクシングジム「カシアス」のチケット販売管理システム。
LINE経由の手動やりとりで行っていたチケット販売を、Webアプリで効率化する。

## 背景

- マネージャーがLINEで興行チケットの販売案内・注文受付・支払い/受渡し管理を手動で行っている
- 注文の集計ミスや対応漏れが発生しやすい
- 既存VPS（2GB RAM）を活用し、低コスト・低メンテで運用したい

## 機能

### 管理者（マネージャー）
- パスワード認証によるログイン（ユーザー1名のみ）
- イベント（興行）のCRUD、受付開始/終了の切り替え
- チケット種別の設定（席種・価格）
- 注文一覧の閲覧、支払い/受渡しステータスのトグル管理
- 注文ページURLのコピー（LINE等で会員に共有）

### 会員（注文者）
- 共有URLから注文フォームにアクセス（ログイン不要）
- チケット種別ごとの枚数を選択して注文
- 注文完了画面の表示

## 技術構成

| 項目               | 選定                                |
| ------------------ | ----------------------------------- |
| フレームワーク     | Rails 8.1 (MPA / ERB)               |
| DB                 | SQLite3                             |
| CSS                | Tailwind CSS v4                     |
| JS                 | Hotwire (Turbo + Stimulus)          |
| Web サーバー       | Puma + Thruster                     |
| デプロイ           | Kamal 2                             |
| コンテナレジストリ | GitHub Container Registry (ghcr.io) |
| 本番サーバー       | VPS (2GB RAM / amd64)               |

## DB 構成

```
events          チケット販売イベント（興行）
├── ticket_types  チケット種別（席種・価格）
└── orders        注文
    └── order_items  注文明細（種別ごとの枚数）

users           管理者（1名）
└── sessions    ログインセッション
```

## ローカル開発

```bash
docker compose up
# http://localhost:3001 でアクセス
```

初回のみDB作成とシードデータ投入:

```bash
docker compose exec web bin/rails db:setup
```

## デプロイ

Kamal 2 でVPSにデプロイ。kamal-proxy が SSL (Let's Encrypt) を自動管理し、`tools97.com` でアクセス可能。

```bash
# KAMAL_REGISTRY_PASSWORD に GitHub PAT を設定
export KAMAL_REGISTRY_PASSWORD=ghp_xxxxx

# デプロイ（ローカルにRubyがない場合はDocker経由）
docker run --rm \
  -v "$(pwd)":/rails \
  -v "$HOME/.ssh:/root/.ssh:ro" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /rails \
  -e KAMAL_REGISTRY_PASSWORD \
  ruby:3.4 bash -c 'apt-get update -qq && apt-get install -y docker.io > /dev/null 2>&1 && gem install kamal -q && kamal deploy'
```

## URL 構成

本番: `https://tools97.com`

| パス                   | 用途                             |
| ---------------------- | -------------------------------- |
| `/`                    | 管理者ログイン / イベント一覧    |
| `/events/:id`          | イベント詳細・注文管理           |
| `/e/:token/orders/new` | 会員向け注文フォーム（認証不要） |
| `/e/:token/orders/:id` | 注文完了画面                     |
