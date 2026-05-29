CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  oauth_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
