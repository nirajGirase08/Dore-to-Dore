-- Messaging compatibility migration
-- Supports both legacy participant_1_id/participant_2_id + sent_at
-- and newer user1_id/user2_id + created_at schemas.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS request_id INT REFERENCES requests(request_id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS offer_id INT REFERENCES offers(offer_id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_1_id INT REFERENCES users(user_id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_2_id INT REFERENCES users(user_id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_id INT REFERENCES users(user_id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_id INT REFERENCES users(user_id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE conversations
SET
  participant_1_id = COALESCE(participant_1_id, user1_id),
  participant_2_id = COALESCE(participant_2_id, user2_id),
  user1_id = COALESCE(user1_id, participant_1_id),
  user2_id = COALESCE(user2_id, participant_2_id),
  status = COALESCE(status, 'active'),
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP),
  last_message_at = COALESCE(last_message_at, created_at, CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE OR REPLACE FUNCTION sync_conversations_compatibility()
RETURNS TRIGGER AS $$
BEGIN
  NEW.participant_1_id := COALESCE(NEW.participant_1_id, NEW.user1_id);
  NEW.participant_2_id := COALESCE(NEW.participant_2_id, NEW.user2_id);
  NEW.user1_id := COALESCE(NEW.user1_id, NEW.participant_1_id);
  NEW.user2_id := COALESCE(NEW.user2_id, NEW.participant_2_id);
  NEW.status := COALESCE(NEW.status, 'active');
  NEW.created_at := COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
  NEW.updated_at := CURRENT_TIMESTAMP;
  NEW.last_message_at := COALESCE(NEW.last_message_at, NEW.created_at, CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_conversations_compatibility ON conversations;
CREATE TRIGGER trg_sync_conversations_compatibility
BEFORE INSERT OR UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION sync_conversations_compatibility();

ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id INT REFERENCES users(user_id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE messages
SET
  sent_at = COALESCE(sent_at, created_at, CURRENT_TIMESTAMP),
  created_at = COALESCE(created_at, sent_at, CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

CREATE OR REPLACE FUNCTION sync_messages_compatibility()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sent_at := COALESCE(NEW.sent_at, NEW.created_at, CURRENT_TIMESTAMP);
  NEW.created_at := COALESCE(NEW.created_at, NEW.sent_at, CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_messages_compatibility ON messages;
CREATE TRIGGER trg_sync_messages_compatibility
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION sync_messages_compatibility();
