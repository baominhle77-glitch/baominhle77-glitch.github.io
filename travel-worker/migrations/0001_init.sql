CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT DEFAULT '',
  region TEXT DEFAULT '',
  category TEXT NOT NULL,
  summary TEXT DEFAULT '',
  description TEXT DEFAULT '',
  highlights TEXT DEFAULT '',
  experiences TEXT DEFAULT '',
  best_time TEXT DEFAULT '',
  suggested_duration TEXT DEFAULT '',
  ticket_info TEXT DEFAULT '',
  opening_hours TEXT DEFAULT '',
  travel_notes TEXT DEFAULT '',
  latitude REAL,
  longitude REAL,
  map_url TEXT DEFAULT '',
  official_url TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  source_name TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  source_checked_at TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_places_status_featured ON places(status, featured DESC);
CREATE INDEX IF NOT EXISTS idx_places_province ON places(province);
CREATE INDEX IF NOT EXISTS idx_places_region ON places(region);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);
