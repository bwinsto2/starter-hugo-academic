PRAGMA foreign_keys = ON;
CREATE TABLE participants (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 token_version INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE weeks (friday TEXT PRIMARY KEY, created_at TEXT NOT NULL);
CREATE TABLE responses (
 friday TEXT NOT NULL REFERENCES weeks(friday), participant_id TEXT NOT NULL REFERENCES participants(id),
 slots TEXT NOT NULL, unavailable INTEGER NOT NULL CHECK(unavailable IN (0,1)), updated_at TEXT NOT NULL,
 PRIMARY KEY(friday, participant_id)
);
CREATE TABLE jobs (id TEXT PRIMARY KEY, friday TEXT NOT NULL, kind TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE deliveries (
 id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES jobs(id), participant_id TEXT REFERENCES participants(id),
 kind TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
 next_at TEXT NOT NULL, lease_until TEXT, first_attempt_at TEXT, sent_at TEXT, provider_id TEXT, error TEXT
);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings VALUES ('mail_paused','true');
CREATE INDEX deliveries_due ON deliveries(state,next_at);
