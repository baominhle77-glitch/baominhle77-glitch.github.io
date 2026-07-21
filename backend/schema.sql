-- schema.sql — bảng cho cổng duyệt truy cập (Cloudflare D1 / SQLite)
-- Áp dụng:  npx wrangler d1 execute baominh-gate --remote --file=backend/schema.sql

CREATE TABLE IF NOT EXISTS requests (
  id          TEXT PRIMARY KEY,
  app         TEXT,
  name        TEXT,
  note        TEXT,
  ip          TEXT,
  country     TEXT,
  ua          TEXT,
  device      TEXT,            -- JSON dấu vết thiết bị
  status      TEXT,            -- pending | approved | denied
  token       TEXT,            -- JWT cấp khi duyệt
  created_at  INTEGER,
  decided_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);

-- Nhật ký dữ liệu khách nhập trong web (tùy app gọi /api/log).
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  request_id  TEXT,
  app         TEXT,
  kind        TEXT,
  data        TEXT,            -- JSON dữ liệu đã nhập
  ip          TEXT,
  created_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
