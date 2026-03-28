-- Crisis Connect - Seed Data
-- Realistic dummy data for Nashville/Vanderbilt area
-- Can be used by both Developer 1 and Developer 2

-- ============================================
-- USERS (Mix of volunteers and people in need)
-- ============================================

-- Clear existing data (careful in production!)
-- TRUNCATE TABLE transactions, messages, conversations, offer_items, request_items, offers, requests, users RESTART IDENTITY CASCADE;

-- Volunteers and Users
INSERT INTO users (email, password_hash, name, phone, gender, location_lat, location_lng, location_address, user_type, reputation_score) VALUES
-- Password for all: password123 (hashed with bcrypt)
('sarah.johnson@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Sarah Johnson', '(615) 555-0101', 'Female', 36.1447, -86.8027, 'Vanderbilt Commons Center, Nashville, TN', 'student', 5),
('mike.chen@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Mike Chen', '(615) 555-0102', 'Male', 36.1433, -86.8015, 'Kissam Center, Vanderbilt University', 'student', 8),
('emma.rodriguez@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Emma Rodriguez', '(615) 555-0103', 'Female', 36.1373, -86.7970, 'Hillsboro Village, Nashville, TN', 'faculty', 12),
('james.williams@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'James Williams', '(615) 555-0104', 'Male', 36.1462, -86.8025, 'Vanderbilt Medical Center, Nashville, TN', 'staff', 6),
('ashley.patel@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Ashley Patel', '(615) 555-0105', 'Female', 36.1439, -86.8055, 'Branscomb Quad, Vanderbilt University', 'student', 3),
('david.kim@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'David Kim', '(615) 555-0106', 'Male', 36.1484, -86.8003, 'West End Avenue, Nashville, TN', 'student', 10),
('maria.garcia@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Maria Garcia', '(615) 555-0107', 'Female', 36.1394, -86.8015, '21st Avenue South, Nashville, TN', 'staff', 7),
('chris.thompson@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Chris Thompson', '(615) 555-0108', 'Male', 36.1627, -86.7816, 'Downtown Nashville, TN', 'faculty', 9),
('rachel.lee@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Rachel Lee', '(615) 555-0109', 'Female', 36.1493, -86.7977, 'Music Row, Nashville, TN', 'student', 4),
('alex.brown@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Alex Brown', '(615) 555-0110', 'Non-binary', 36.1426, -86.8038, 'Vanderbilt Commons, Nashville, TN', 'student', 6),
('jessica.miller@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Jessica Miller', '(615) 555-0111', 'Female', 36.1450, -86.8010, 'Alumni Lawn, Vanderbilt University', 'student', 2),
('ryan.anderson@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Ryan Anderson', '(615) 555-0112', 'Male', 36.1420, -86.8045, 'Peabody Campus, Vanderbilt University', 'student', 5),
('sophia.nguyen@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Sophia Nguyen', '(615) 555-0113', 'Female', 36.1380, -86.7985, 'Edgehill Village, Nashville, TN', 'faculty', 11),
('tyler.davis@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Tyler Davis', '(615) 555-0114', 'Male', 36.1455, -86.8020, 'Stevenson Center, Vanderbilt University', 'student', 3),
('olivia.martinez@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'Olivia Martinez', '(615) 555-0115', 'Female', 36.1445, -86.8000, 'Blair School of Music, Vanderbilt', 'student', 7);

-- ============================================
-- OFFERS (Resources volunteers can provide)
-- ============================================

INSERT INTO offers (user_id, title, description, location_lat, location_lng, location_address, delivery_available, status, available_from, available_until) VALUES
-- Offer 1: Sarah - Food and blankets
(1, 'Hot Meals & Warm Blankets Available', 'Have extra food and blankets from emergency prep kit. Can help multiple people!', 36.1447, -86.8027, 'Vanderbilt Commons Center', true, 'active', NOW(), NOW() + INTERVAL '3 days'),
-- Offer 2: Mike - Charging station and WiFi
(2, 'Power Bank Charging & WiFi Access', 'Have multiple power banks and home WiFi. Come by anytime!', 36.1433, -86.8015, 'Kissam Center', false, 'active', NOW(), NOW() + INTERVAL '2 days'),
-- Offer 3: Emma - Temporary shelter
(3, 'Spare Room Available for Emergency Stay', 'Have a spare bedroom and bathroom. Safe space for 1-2 people.', 36.1373, -86.7970, 'Hillsboro Village', false, 'active', NOW(), NOW() + INTERVAL '5 days'),
-- Offer 4: James - Medical supplies
(4, 'First Aid & Medical Supplies', 'Work at med center. Have extra first aid supplies, medications (OTC), and medical advice.', 36.1462, -86.8025, 'Vanderbilt Medical Center', true, 'active', NOW(), NOW() + INTERVAL '7 days'),
-- Offer 5: David - Transportation
(5, 'Car Rides Around Nashville Area', 'Can provide rides to grocery stores, pharmacies, or shelters. Have SUV with space.', 36.1484, -86.8003, 'West End Avenue', true, 'active', NOW(), NOW() + INTERVAL '2 days'),
-- Offer 6: Maria - Clothes and toiletries
(6, 'Winter Clothes & Toiletries', 'Cleaned out closet - have coats, sweaters, hygiene products. All sizes available.', 36.1394, -86.8015, '21st Avenue South', true, 'active', NOW(), NOW() + INTERVAL '4 days'),
-- Offer 7: Chris - Hot showers and laundry
(7, 'Hot Shower & Laundry Access', 'Have working water heater and washer/dryer. Can accommodate a few people per day.', 36.1627, -86.7816, 'Downtown Nashville', false, 'active', NOW(), NOW() + INTERVAL '3 days'),
-- Offer 8: Sophia - Groceries and water
(8, 'Groceries, Bottled Water & Snacks', 'Stocked up before storm. Have way too much - happy to share!', 36.1380, -86.7985, 'Edgehill Village', true, 'active', NOW() + INTERVAL '1 day', NOW() + INTERVAL '6 days'),
-- Offer 9: Alex - Phone charging and internet
(9, 'Device Charging Station + Internet', 'Set up charging station with multiple outlets. Fast WiFi available too.', 36.1426, -86.8038, 'Vanderbilt Commons', false, 'active', NOW(), NOW() + INTERVAL '2 days'),
-- Offer 10: Ryan - Baby supplies
(10, 'Baby Formula, Diapers & Supplies', 'Have extra baby supplies from our emergency kit. Sizes newborn to 2T.', 36.1420, -86.8045, 'Peabody Campus', true, 'active', NOW(), NOW() + INTERVAL '5 days');

-- ============================================
-- OFFER ITEMS (What's in each offer)
-- ============================================

INSERT INTO offer_items (offer_id, resource_type, quantity_total, quantity_remaining, status, notes) VALUES
-- Offer 1 items (Sarah)
(1, 'food', 15, 15, 'available', 'Hot soup, sandwiches, and fruit'),
(1, 'blankets', 8, 8, 'available', 'Clean wool and fleece blankets'),
(1, 'water', 20, 20, 'available', 'Bottled water'),
-- Offer 2 items (Mike)
(2, 'power', 10, 10, 'available', 'Fully charged power banks (10,000mAh)'),
(2, 'other', 5, 5, 'available', 'WiFi access - password provided'),
-- Offer 3 items (Emma)
(3, 'shelter', 2, 2, 'available', 'Private room with bed and bathroom'),
(3, 'food', 6, 6, 'available', 'Kitchen access for meals'),
-- Offer 4 items (James)
(4, 'medical', 20, 20, 'available', 'Band-aids, pain relievers, cold medicine'),
(4, 'other', 10, 10, 'available', 'Medical consultation and advice'),
-- Offer 5 items (David)
(5, 'transport', 15, 15, 'available', 'Rides within 10 mile radius'),
-- Offer 6 items (Maria)
(6, 'clothes', 25, 25, 'available', 'Winter coats (sizes S-XL)'),
(6, 'clothes', 30, 30, 'available', 'Sweaters and warm clothes'),
(6, 'other', 15, 15, 'available', 'Toiletries - shampoo, soap, toothpaste'),
-- Offer 7 items (Chris)
(7, 'other', 5, 5, 'available', 'Hot shower access (30 min slots)'),
(7, 'other', 3, 3, 'available', 'Washer/dryer use'),
-- Offer 8 items (Sophia)
(8, 'food', 30, 30, 'available', 'Canned goods, pasta, rice'),
(8, 'water', 48, 48, 'available', 'Cases of bottled water'),
(8, 'other', 20, 20, 'available', 'Snacks and granola bars'),
-- Offer 9 items (Alex)
(9, 'power', 20, 20, 'available', 'Multiple charging cables (USB-C, Lightning, Micro-USB)'),
(9, 'other', 10, 10, 'available', 'High-speed WiFi access'),
-- Offer 10 items (Ryan)
(10, 'other', 12, 12, 'available', 'Baby formula (various brands)'),
(10, 'other', 50, 50, 'available', 'Diapers (newborn, size 1, size 2)'),
(10, 'other', 10, 10, 'available', 'Baby wipes and supplies');

-- ============================================
-- REQUESTS (People needing help)
-- ============================================

INSERT INTO requests (user_id, title, description, urgency_level, location_lat, location_lng, location_address, status) VALUES
-- Request 1: Ashley - Critical - No power, need food
(5, 'URGENT: No Power, Need Food & Water', 'Been without power for 2 days. Running low on food and water. Have two elderly roommates.', 'critical', 36.1439, -86.8055, 'Branscomb Quad, Vanderbilt', 'active'),
-- Request 2: Rachel - High - Need transportation to pharmacy
(9, 'Need Ride to Pharmacy ASAP', 'Need to pick up prescription medication. Cannot walk due to injury. Pharmacy on West End.', 'high', 36.1493, -86.7977, 'Music Row', 'active'),
-- Request 3: Jessica - Medium - Need warm clothes
(11, 'Need Winter Clothes for Family', 'Lost power and heating. Need warm clothes and blankets for family of 3 (2 adults, 1 child).', 'medium', 36.1450, -86.8010, 'Alumni Lawn, Vanderbilt', 'active'),
-- Request 4: Tyler - High - Need phone charging
(14, 'Phone Battery Dead - Need Charging', 'Phone is my only communication with family. Need place to charge ASAP.', 'high', 36.1455, -86.8020, 'Stevenson Center', 'active'),
-- Request 5: Olivia - Critical - Need baby supplies
(15, 'CRITICAL: Need Baby Formula & Diapers', 'Running out of formula and diapers for 6-month-old baby. Stores are closed.', 'critical', 36.1445, -86.8000, 'Blair School of Music', 'active'),
-- Request 6: Sarah - Low - Need laundry access
(1, 'Looking for Laundry Facilities', 'Power out, need to wash clothes. Not urgent but would be helpful.', 'low', 36.1447, -86.8027, 'Vanderbilt Commons Center', 'active'),
-- Request 7: Mike - Medium - Need hot meals
(2, 'Need Hot Food for Group', 'Hosting 5 students without power. Need hot meals or access to working kitchen.', 'medium', 36.1433, -86.8015, 'Kissam Center', 'active'),
-- Request 8: Ashley - High - Need medical supplies
(5, 'Need First Aid Supplies', 'Minor injury needs attention. Need bandages, antiseptic, pain relievers.', 'high', 36.1439, -86.8055, 'Branscomb Quad, Vanderbilt', 'active'),
-- Request 9: Rachel - Medium - Need temporary shelter
(9, 'Need Place to Stay for 1-2 Nights', 'Apartment has no heat or water. Looking for temporary shelter until repairs done.', 'medium', 36.1493, -86.7977, 'Music Row', 'active'),
-- Request 10: Tyler - Low - Need WiFi access
(14, 'Need Internet to Submit Assignment', 'Need WiFi access to submit online coursework. Deadline in 2 days.', 'low', 36.1455, -86.8020, 'Stevenson Center', 'active'),
-- Request 11: Olivia - Critical - Multiple needs
(15, 'CRITICAL: Multiple Urgent Needs', 'Single parent with 2 kids. Need food, water, blankets, and warmth. Power been out 3 days.', 'critical', 36.1445, -86.8000, 'Blair School of Music', 'active'),
-- Request 12: Jessica - High - Transportation to shelter
(11, 'Need Ride to Emergency Shelter', 'Family needs transport to warming shelter downtown. Have luggage and pet carrier.', 'high', 36.1450, -86.8010, 'Alumni Lawn, Vanderbilt', 'active');

-- ============================================
-- REQUEST ITEMS (What people need)
-- ============================================

INSERT INTO request_items (request_id, resource_type, quantity_needed, quantity_fulfilled, status, notes) VALUES
-- Request 1 items (Ashley - critical)
(1, 'food', 10, 0, 'pending', 'Non-perishable or ready-to-eat meals'),
(1, 'water', 15, 0, 'pending', 'Bottled water for 3 people'),
(1, 'blankets', 3, 0, 'pending', 'Need warm blankets urgently'),
-- Request 2 items (Rachel - high)
(2, 'transport', 1, 0, 'pending', 'Round trip to CVS on West End Ave'),
-- Request 3 items (Jessica - medium)
(3, 'clothes', 5, 0, 'pending', 'Adult sizes M-L, child size 6'),
(3, 'blankets', 4, 0, 'pending', 'Any warm blankets appreciated'),
-- Request 4 items (Tyler - high)
(4, 'power', 1, 0, 'pending', 'Just need to charge phone for a few hours'),
-- Request 5 items (Olivia - critical)
(5, 'other', 6, 0, 'pending', 'Baby formula - any brand'),
(5, 'other', 30, 0, 'pending', 'Size 2 diapers'),
(5, 'other', 2, 0, 'pending', 'Baby wipes'),
-- Request 6 items (Sarah - low)
(6, 'other', 2, 0, 'pending', 'Access to washer and dryer'),
-- Request 7 items (Mike - medium)
(7, 'food', 10, 0, 'pending', 'Hot meals for 5 people'),
(7, 'water', 10, 0, 'pending', 'Drinking water'),
-- Request 8 items (Ashley - high)
(8, 'medical', 1, 0, 'pending', 'First aid kit or basic supplies'),
-- Request 9 items (Rachel - medium)
(9, 'shelter', 1, 0, 'pending', 'Room for 1 person, 1-2 nights'),
-- Request 10 items (Tyler - low)
(10, 'other', 1, 0, 'pending', 'WiFi access for a few hours'),
-- Request 11 items (Olivia - critical multiple)
(11, 'food', 15, 0, 'pending', 'Meals for 3 people (1 adult, 2 kids)'),
(11, 'water', 20, 0, 'pending', 'Drinking water urgently needed'),
(11, 'blankets', 5, 0, 'pending', 'Warm blankets for family'),
(11, 'power', 2, 0, 'pending', 'Need to charge phones'),
-- Request 12 items (Jessica - high transport)
(12, 'transport', 1, 0, 'pending', 'Transport for 3 people + luggage to downtown shelter');

-- ============================================
-- SOME SAMPLE CONVERSATIONS (optional)
-- ============================================

INSERT INTO conversations (request_id, offer_id, participant_1_id, participant_2_id, status) VALUES
(1, 1, 5, 1, 'active'),  -- Ashley requesting from Sarah's offer
(2, 5, 9, 5, 'active'),  -- Rachel requesting from David's transport
(5, 10, 15, 10, 'active'); -- Olivia requesting from Ryan's baby supplies

-- ============================================
-- SAMPLE MESSAGES
-- ============================================

INSERT INTO messages (conversation_id, sender_id, recipient_id, message_text, is_read) VALUES
(1, 5, 1, 'Hi Sarah! I saw your offer for food and blankets. We really need help - been without power for 2 days.', true),
(1, 1, 5, 'Hi Ashley! Of course I can help. I have hot soup, sandwiches, and several blankets. When can you pick up?', true),
(1, 5, 1, 'That would be amazing! Can I come by in about 30 minutes?', false),
(2, 9, 5, 'Hi David, I need a ride to the pharmacy on West End. My prescription is ready. Can you help?', true),
(2, 5, 9, 'Sure! I can pick you up in 20 minutes. Text me when you are ready.', false),
(3, 15, 10, 'Hi Ryan! I desperately need baby formula and diapers. Do you still have them available?', true),
(3, 10, 15, 'Yes! I have plenty. What size diapers do you need? I have size 1 and 2.', false);

-- ============================================
-- Update user reputation based on activity
-- ============================================

UPDATE users SET reputation_score = reputation_score + 2 WHERE user_id IN (1, 5, 10);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check data was inserted
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as offer_count FROM offers;
-- SELECT COUNT(*) as request_count FROM requests;
-- SELECT COUNT(*) as offer_items_count FROM offer_items;
-- SELECT COUNT(*) as request_items_count FROM request_items;

-- View sample offers with items
-- SELECT o.title, o.location_address, oi.resource_type, oi.quantity_remaining
-- FROM offers o
-- JOIN offer_items oi ON o.offer_id = oi.offer_id
-- LIMIT 10;

-- View sample requests with items
-- SELECT r.title, r.urgency_level, r.location_address, ri.resource_type, ri.quantity_needed
-- FROM requests r
-- JOIN request_items ri ON r.request_id = ri.request_id
-- LIMIT 10;
