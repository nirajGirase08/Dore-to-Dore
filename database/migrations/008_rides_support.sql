CREATE TABLE IF NOT EXISTS ride_requests (
    ride_request_id SERIAL PRIMARY KEY,
    requester_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    driver_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT,
    destination_lat DECIMAL(10, 8) NOT NULL,
    destination_lng DECIMAL(11, 8) NOT NULL,
    destination_address TEXT,
    urgency VARCHAR(20) DEFAULT 'urgent',
    notes TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP
);

ALTER TABLE ride_requests
    ADD COLUMN IF NOT EXISTS requester_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS driver_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS pickup_address TEXT,
    ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS destination_address TEXT,
    ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'urgent',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_ride_requests_requester ON ride_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver ON ride_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
