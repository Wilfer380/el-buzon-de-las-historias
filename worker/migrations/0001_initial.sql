PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  join_code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title TEXT NOT NULL,
  active_stage TEXT NOT NULL DEFAULT 'contributions' CHECK (active_stage IN ('lobby','icebreaker','contributions','poll','story','complete')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  pseudonym TEXT CHECK (pseudonym IS NULL OR length(pseudonym) <= 80),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('experience','difficulty','hope','idea')),
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderated_at TEXT
);

CREATE INDEX IF NOT EXISTS contributions_workshop_status ON contributions(workshop_id, status, created_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO workshops (id, join_code, title, active_stage)
VALUES ('workshop-historia', 'HISTORIA', 'El Buzón de las Historias', 'contributions');
