DROP TABLE IF EXISTS letters;

CREATE TABLE letters (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  delivery_date INTEGER, -- Unix Timestamp, UTC
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
  is_public INTEGER DEFAULT 0 CHECK(is_public IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
