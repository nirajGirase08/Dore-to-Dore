CREATE TABLE IF NOT EXISTS assistance_feedback (
    feedback_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL UNIQUE REFERENCES assistance_transactions(transaction_id) ON DELETE CASCADE,
    reviewer_user_id INT NOT NULL REFERENCES users(user_id),
    reviewee_user_id INT NOT NULL REFERENCES users(user_id),
    was_helpful BOOLEAN NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistance_feedback_reviewer
ON assistance_feedback(reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_assistance_feedback_reviewee
ON assistance_feedback(reviewee_user_id);
