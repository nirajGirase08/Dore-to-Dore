ALTER TABLE requests ADD COLUMN IF NOT EXISTS target_gender VARCHAR(20);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS target_gender VARCHAR(20);

ALTER TABLE users ALTER COLUMN gender TYPE VARCHAR(20);

UPDATE users
SET gender = CASE
  WHEN LOWER(COALESCE(gender, '')) = 'male' THEN 'male'
  WHEN LOWER(COALESCE(gender, '')) = 'female' THEN 'female'
  ELSE 'prefer_not_to_answer'
END;

ALTER TABLE users ALTER COLUMN gender SET DEFAULT 'prefer_not_to_answer';

CREATE INDEX IF NOT EXISTS idx_requests_target_gender ON requests(target_gender);
CREATE INDEX IF NOT EXISTS idx_offers_target_gender ON offers(target_gender);
