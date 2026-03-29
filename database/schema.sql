-- Crisis Connect Database Schema
-- Developer 1: Core Marketplace Tables
-- Developer 2: Crisis Management Tables (placeholders)

-- ============================================
-- DEVELOPER 1 TABLES: Core Marketplace
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(20) DEFAULT 'prefer_not_to_answer',
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    user_type VARCHAR(50), -- student, staff, faculty
    profile_image_url TEXT,
    reputation_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_location ON users(location_lat, location_lng);

-- Requests Table
CREATE TABLE IF NOT EXISTS requests (
    request_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    urgency_level VARCHAR(20), -- low, medium, high, critical
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_address TEXT,
    target_gender VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active', -- active, partially_fulfilled, fulfilled, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_location ON requests(location_lat, location_lng);
CREATE INDEX idx_requests_urgency ON requests(urgency_level);
CREATE INDEX idx_requests_target_gender ON requests(target_gender);

-- Request Items Table
CREATE TABLE IF NOT EXISTS request_items (
    item_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES requests(request_id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL, -- food, water, shelter, blankets, medical, transport, power, other
    quantity_needed INT DEFAULT 1,
    quantity_fulfilled INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, fulfilled
    notes TEXT
);

CREATE INDEX idx_request_items_request ON request_items(request_id);
CREATE INDEX idx_request_items_type ON request_items(resource_type);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
    offer_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_address TEXT,
    target_gender VARCHAR(20),
    delivery_available BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active', -- active, partially_claimed, fulfilled, cancelled
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_offers_user ON offers(user_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_location ON offers(location_lat, location_lng);
CREATE INDEX idx_offers_target_gender ON offers(target_gender);

-- Offer Items Table
CREATE TABLE IF NOT EXISTS offer_items (
    item_id SERIAL PRIMARY KEY,
    offer_id INT REFERENCES offers(offer_id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    quantity_total INT NOT NULL,
    quantity_remaining INT NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, claimed, given
    notes TEXT,
    image_url TEXT
);

CREATE INDEX idx_offer_items_offer ON offer_items(offer_id);
CREATE INDEX idx_offer_items_type ON offer_items(resource_type);

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

CREATE INDEX idx_assistance_transactions_helper ON assistance_transactions(helper_user_id);
CREATE INDEX idx_assistance_transactions_recipient ON assistance_transactions(recipient_user_id);
CREATE INDEX idx_assistance_transactions_conversation ON assistance_transactions(conversation_id);
CREATE INDEX idx_assistance_transactions_request ON assistance_transactions(request_id);
CREATE INDEX idx_assistance_transactions_offer ON assistance_transactions(offer_id);

CREATE TABLE IF NOT EXISTS assistance_feedback (
    feedback_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL UNIQUE REFERENCES assistance_transactions(transaction_id) ON DELETE CASCADE,
    reviewer_user_id INT NOT NULL REFERENCES users(user_id),
    reviewee_user_id INT NOT NULL REFERENCES users(user_id),
    was_helpful BOOLEAN NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assistance_feedback_reviewer ON assistance_feedback(reviewer_user_id);
CREATE INDEX idx_assistance_feedback_reviewee ON assistance_feedback(reviewee_user_id);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES requests(request_id),
    offer_id INT REFERENCES offers(offer_id),
    participant_1_id INT REFERENCES users(user_id),
    participant_2_id INT REFERENCES users(user_id),
    user1_id INT REFERENCES users(user_id),
    user2_id INT REFERENCES users(user_id),
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, archived
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_request ON conversations(request_id);
CREATE INDEX idx_conversations_offer ON conversations(offer_id);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(user_id),
    recipient_id INT REFERENCES users(user_id),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Messaging compatibility triggers
CREATE OR REPLACE FUNCTION sync_conversations_compatibility()
RETURNS TRIGGER AS $$
BEGIN
    NEW.participant_1_id := COALESCE(NEW.participant_1_id, NEW.user1_id);
    NEW.participant_2_id := COALESCE(NEW.participant_2_id, NEW.user2_id);
    NEW.user1_id := COALESCE(NEW.user1_id, NEW.participant_1_id);
    NEW.user2_id := COALESCE(NEW.user2_id, NEW.participant_2_id);
    NEW.status := COALESCE(NEW.status, 'active');
    NEW.created_at := COALESCE(NEW.created_at, NOW());
    NEW.updated_at := COALESCE(NEW.updated_at, NOW());
    NEW.last_message_at := COALESCE(NEW.last_message_at, NEW.created_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_conversations_compatibility ON conversations;
CREATE TRIGGER trg_sync_conversations_compatibility
BEFORE INSERT OR UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION sync_conversations_compatibility();

CREATE OR REPLACE FUNCTION sync_messages_compatibility()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sent_at := COALESCE(NEW.sent_at, NEW.created_at, NOW());
    NEW.created_at := COALESCE(NEW.created_at, NEW.sent_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_messages_compatibility ON messages;
CREATE TRIGGER trg_sync_messages_compatibility
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION sync_messages_compatibility();

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES requests(request_id),
    offer_id INT REFERENCES offers(offer_id),
    requester_id INT REFERENCES users(user_id),
    volunteer_id INT REFERENCES users(user_id),
    resource_type VARCHAR(100),
    quantity INT,
    status VARCHAR(50) DEFAULT 'initiated', -- initiated, confirmed_by_volunteer, confirmed_by_requester, completed, cancelled
    scheduled_time TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_requester ON transactions(requester_id);
CREATE INDEX idx_transactions_volunteer ON transactions(volunteer_id);
CREATE INDEX idx_transactions_request ON transactions(request_id);
CREATE INDEX idx_transactions_offer ON transactions(offer_id);

-- ============================================
-- DEVELOPER 2 TABLES: Crisis Management
-- (Placeholders - Developer 2 will implement)
-- ============================================

-- Blockages Table (Developer 2)
CREATE TABLE IF NOT EXISTS blockages (
    blockage_id SERIAL PRIMARY KEY,
    reported_by INT REFERENCES users(user_id),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    blockage_type VARCHAR(100), -- tree_down, flooding, ice, power_line, debris, road_closure, other
    severity VARCHAR(20), -- low, medium, high, critical
    description TEXT,
    photo_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, verified
    authority_notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_blockages_location ON blockages(location_lat, location_lng);
CREATE INDEX idx_blockages_status ON blockages(status);
CREATE INDEX idx_blockages_type ON blockages(blockage_type);

-- Weather Alerts Table (Developer 2)
CREATE TABLE IF NOT EXISTS weather_alerts (
    alert_id SERIAL PRIMARY KEY,
    alert_type VARCHAR(100), -- storm, ice, flood, wind, etc.
    severity VARCHAR(20), -- minor, moderate, severe, extreme
    title VARCHAR(255),
    description TEXT,
    affected_area TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_weather_alerts_active ON weather_alerts(is_active);
CREATE INDEX idx_weather_alerts_severity ON weather_alerts(severity);

-- Routes Table (Developer 2)
CREATE TABLE IF NOT EXISTS routes (
    route_id SERIAL PRIMARY KEY,
    start_lat DECIMAL(10, 8) NOT NULL,
    start_lng DECIMAL(11, 8) NOT NULL,
    end_lat DECIMAL(10, 8) NOT NULL,
    end_lng DECIMAL(11, 8) NOT NULL,
    route_data JSONB, -- Store route coordinates and metadata
    distance_km DECIMAL(10, 2),
    estimated_time_minutes INT,
    has_blockages BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Authorities Table (Developer 2)
CREATE TABLE IF NOT EXISTS authorities (
    authority_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- police, fire, medical, utilities, campus_security
    email VARCHAR(255),
    phone VARCHAR(20),
    jurisdiction TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- In-App Notifications Table (Developer 2)
-- blockage_alert  → high/critical severity, shown as banner to ALL users
-- blockage_nearby → low/medium severity, shown in bell dropdown to users within 1 mile
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT,
    related_id      INT,
    severity        VARCHAR(20),
    is_read         BOOLEAN DEFAULT false,
    is_dismissed    BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Authority Notifications Table (Developer 2)
CREATE TABLE IF NOT EXISTS authority_notifications (
    notification_id SERIAL PRIMARY KEY,
    authority_id INT REFERENCES authorities(authority_id),
    blockage_id INT REFERENCES blockages(blockage_id),
    notification_type VARCHAR(100),
    message TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'sent' -- sent, acknowledged, resolved
);

CREATE INDEX idx_authority_notifications_authority ON authority_notifications(authority_id);
CREATE INDEX idx_authority_notifications_blockage ON authority_notifications(blockage_id);

-- Ride Requests Table
CREATE TABLE IF NOT EXISTS ride_requests (
    ride_request_id SERIAL PRIMARY KEY,
    requester_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    driver_id INT REFERENCES users(user_id),
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT,
    destination_lat DECIMAL(10, 8) NOT NULL,
    destination_lng DECIMAL(11, 8) NOT NULL,
    destination_address TEXT,
    urgency VARCHAR(20) DEFAULT 'urgent', -- emergency, urgent, normal
    notes TEXT,
    status VARCHAR(30) DEFAULT 'pending', -- pending, accepted, en_route, picked_up, completed, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_ride_requests_requester ON ride_requests(requester_id);
CREATE INDEX idx_ride_requests_driver ON ride_requests(driver_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert a test user (password: password123)
-- Note: In production, passwords should be properly hashed
-- INSERT INTO users (email, password_hash, name, user_type, location_lat, location_lng, location_address)
-- VALUES ('test@vanderbilt.edu', '$2a$10$...', 'Test User', 'student', 36.1447, -86.8027, 'Vanderbilt University');
