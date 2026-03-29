CREATE TABLE IF NOT EXISTS assistance_transactions (
    transaction_id SERIAL PRIMARY KEY,
    conversation_id INT,
    request_id INT,
    request_item_id INT,
    offer_id INT,
    offer_item_id INT,
    helper_user_id INT NOT NULL REFERENCES users(user_id),
    recipient_user_id INT NOT NULL REFERENCES users(user_id),
    resource_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    completion_source VARCHAR(20) NOT NULL DEFAULT 'manual',
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistance_transactions_helper
ON assistance_transactions(helper_user_id);

CREATE INDEX IF NOT EXISTS idx_assistance_transactions_recipient
ON assistance_transactions(recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_assistance_transactions_conversation
ON assistance_transactions(conversation_id);

CREATE INDEX IF NOT EXISTS idx_assistance_transactions_request
ON assistance_transactions(request_id);

CREATE INDEX IF NOT EXISTS idx_assistance_transactions_offer
ON assistance_transactions(offer_id);
