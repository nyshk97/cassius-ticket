-- ローカル開発用 seed（本番には流さない。本番データは VPS からの移行で投入する）
-- 適用: wrangler d1 execute cassius-ticket --local --file seed.sql
-- 管理者パスワード: password

INSERT INTO users (email_address, password_digest, created_at, updated_at) VALUES
  ('admin@example.com', 'pbkdf2-sha256$100000$iTC+09eYHbDUYaAlG5TO8A==$yEnBj3/Lst5yn39Lx9PzzwNa8bemKTYYq3Q3MvrOtvk=', datetime('now'), datetime('now'));

INSERT INTO events (title, player_name, event_date, venue, description, status, token, created_at, updated_at) VALUES
  ('第10回 カシアス興行', '山田 太郎', date('now', '+30 days'), '後楽園ホール', '山田太郎選手の10回戦です。応援よろしくお願いします!', 0, 'dev-open-event-token', datetime('now'), datetime('now')),
  ('第9回 カシアス興行', '鈴木 次郎', date('now', '-60 days'), '大田区総合体育館', NULL, 1, 'dev-closed-event-token', datetime('now'), datetime('now'));

INSERT INTO ticket_types (event_id, name, price, position, created_at, updated_at) VALUES
  (1, 'リングサイド', 15000, 0, datetime('now'), datetime('now')),
  (1, '指定席A', 10000, 1, datetime('now'), datetime('now')),
  (1, '自由席', 6000, 2, datetime('now'), datetime('now')),
  (2, '指定席', 8000, 0, datetime('now'), datetime('now')),
  (2, '自由席', 5000, 1, datetime('now'), datetime('now'));

INSERT INTO orders (event_id, customer_name, phone_number, note, payment_status, delivery_status, created_at, updated_at) VALUES
  (1, '佐藤 花子', '090-1234-5678', '当日受け取り希望です', 0, 0, datetime('now'), datetime('now')),
  (1, '田中 一郎', '080-9876-5432', NULL, 1, 0, datetime('now'), datetime('now')),
  (2, '高橋 三郎', '070-1111-2222', NULL, 1, 1, datetime('now'), datetime('now'));

INSERT INTO order_items (order_id, ticket_type_id, quantity, created_at, updated_at) VALUES
  (1, 1, 2, datetime('now'), datetime('now')),
  (1, 3, 1, datetime('now'), datetime('now')),
  (2, 2, 4, datetime('now'), datetime('now')),
  (3, 4, 2, datetime('now'), datetime('now'));
