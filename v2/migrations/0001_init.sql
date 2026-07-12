-- Migration number: 0001 	 init
-- Rails の schema.rb (version 2026_03_18_100000) を D1 に移植したもの。
-- カラム名・インデックス名は旧 Rails スキーマと揃えてデータ移行を単純にしている。
-- sessions.id のみ TEXT（ランダムトークン）に変更。セッションデータは移行しない。

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_address TEXT NOT NULL,
  password_digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX index_users_on_email_address ON users (email_address);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id),
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX index_sessions_on_user_id ON sessions (user_id);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  player_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  venue TEXT,
  description TEXT,
  status INTEGER NOT NULL DEFAULT 0, -- 0=open, 1=closed
  token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX index_events_on_token ON events (token);

CREATE TABLE ticket_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events (id),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX index_ticket_types_on_event_id ON ticket_types (event_id);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events (id),
  customer_name TEXT NOT NULL,
  phone_number TEXT,
  note TEXT,
  payment_status INTEGER NOT NULL DEFAULT 0, -- 0=unpaid, 1=paid
  delivery_status INTEGER NOT NULL DEFAULT 0, -- 0=undelivered, 1=delivered
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX index_orders_on_event_id ON orders (event_id);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders (id),
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types (id),
  quantity INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX index_order_items_on_order_id ON order_items (order_id);
CREATE INDEX index_order_items_on_ticket_type_id ON order_items (ticket_type_id);
