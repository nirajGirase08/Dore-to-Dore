-- Fix messaging tables structure

-- Drop existing tables and recreate with correct structure
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Create conversations table with correct structure
CREATE TABLE conversations (
  conversation_id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table with correct structure
CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Add some test data from seed conversations
INSERT INTO conversations (user1_id, user2_id, last_message_at, created_at)
SELECT DISTINCT
  LEAST(c.user1_id, c.user2_id) as user1_id,
  GREATEST(c.user1_id, c.user2_id) as user2_id,
  c.last_message_at,
  c.created_at
FROM (
  SELECT 1 as user1_id, 2 as user2_id, CURRENT_TIMESTAMP as last_message_at, CURRENT_TIMESTAMP as created_at
  UNION
  SELECT 3, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  UNION
  SELECT 5, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) c
WHERE EXISTS (SELECT 1 FROM users WHERE user_id = c.user1_id)
  AND EXISTS (SELECT 1 FROM users WHERE user_id = c.user2_id);
