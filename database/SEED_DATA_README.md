# Seed Data for Crisis Connect

## Overview

This seed data provides **realistic dummy data** for testing and development. It includes users, offers, requests, and messages based on real Nashville and Vanderbilt University locations.

## What's Included

### 📊 Data Summary

- **15 Users** (students, staff, faculty)
- **10 Offers** (volunteers providing help)
- **23 Offer Items** (resources available)
- **12 Requests** (people needing help)
- **21 Request Items** (resources needed)
- **3 Conversations** (sample chats)
- **7 Messages** (sample communication)

### 🗺️ Locations Used

All locations are **real Nashville/Vanderbilt area addresses**:

- Vanderbilt Commons Center
- Kissam Center, Vanderbilt
- Hillsboro Village
- Vanderbilt Medical Center
- Branscomb Quad
- West End Avenue
- 21st Avenue South
- Downtown Nashville
- Music Row
- Peabody Campus
- Alumni Lawn
- Stevenson Center
- Blair School of Music
- Edgehill Village

### 📦 Resource Types Available

**Offers include:**
- Food (meals, groceries, canned goods)
- Water (bottled water)
- Blankets (wool, fleece)
- Clothes (winter coats, sweaters)
- Medical supplies (first aid, OTC medications)
- Transportation (car rides)
- Shelter (temporary rooms)
- Power (charging stations, power banks)
- WiFi/Internet access
- Laundry facilities
- Baby supplies (formula, diapers)
- Toiletries

**Requests include:**
- Same categories as offers
- Various urgency levels (low, medium, high, critical)
- Single and multiple item requests
- Different quantities

## 🚀 How to Load the Data

### Method 1: Using psql (Recommended)

```bash
# From the project root
psql -d crisis_connect -f database/seed_data.sql
```

### Method 2: Using SQL client

1. Connect to the `crisis_connect` database
2. Run the entire `database/seed_data.sql` file

### Method 3: Reload Fresh Data

If you want to clear existing data and reload:

```bash
# Warning: This will delete ALL existing data!
psql -d crisis_connect -c "TRUNCATE TABLE transactions, messages, conversations, offer_items, request_items, offers, requests, users RESTART IDENTITY CASCADE;"

# Then load seed data
psql -d crisis_connect -f database/seed_data.sql
```

## 👥 Sample Users (All password: password123)

| Name | Email | Type | Location | Reputation |
|------|-------|------|----------|------------|
| Sarah Johnson | sarah.johnson@vanderbilt.edu | Student | Commons Center | 5 |
| Mike Chen | mike.chen@vanderbilt.edu | Student | Kissam Center | 8 |
| Emma Rodriguez | emma.rodriguez@vanderbilt.edu | Faculty | Hillsboro Village | 12 |
| James Williams | james.williams@vanderbilt.edu | Staff | Medical Center | 6 |
| Ashley Patel | ashley.patel@vanderbilt.edu | Student | Branscomb Quad | 3 |
| David Kim | david.kim@vanderbilt.edu | Student | West End | 10 |
| Maria Garcia | maria.garcia@vanderbilt.edu | Staff | 21st Ave | 7 |
| Chris Thompson | chris.thompson@vanderbilt.edu | Faculty | Downtown | 9 |
| Rachel Lee | rachel.lee@vanderbilt.edu | Student | Music Row | 4 |
| Alex Brown | alex.brown@vanderbilt.edu | Student | Commons | 6 |
| Jessica Miller | jessica.miller@vanderbilt.edu | Student | Alumni Lawn | 2 |
| Ryan Anderson | ryan.anderson@vanderbilt.edu | Student | Peabody | 5 |
| Sophia Nguyen | sophia.nguyen@vanderbilt.edu | Faculty | Edgehill | 11 |
| Tyler Davis | tyler.davis@vanderbilt.edu | Student | Stevenson | 3 |
| Olivia Martinez | olivia.martinez@vanderbilt.edu | Student | Blair School | 7 |

## 📋 Sample Offers

1. **Sarah**: Hot meals, blankets, water
2. **Mike**: Power banks, WiFi access
3. **Emma**: Spare room for emergency shelter
4. **James**: Medical supplies and advice
5. **David**: Transportation/car rides
6. **Maria**: Winter clothes and toiletries
7. **Chris**: Hot shower and laundry access
8. **Sophia**: Groceries and water
9. **Alex**: Device charging and internet
10. **Ryan**: Baby formula and diapers

## 🆘 Sample Requests

1. **Ashley** (CRITICAL): No power, need food & water
2. **Rachel** (HIGH): Need ride to pharmacy
3. **Jessica** (MEDIUM): Need winter clothes
4. **Tyler** (HIGH): Phone battery dead, need charging
5. **Olivia** (CRITICAL): Need baby formula & diapers
6. **Sarah** (LOW): Looking for laundry facilities
7. **Mike** (MEDIUM): Need hot meals for group
8. **Ashley** (HIGH): Need medical supplies
9. **Rachel** (MEDIUM): Need temporary shelter
10. **Tyler** (LOW): Need WiFi for assignment
11. **Olivia** (CRITICAL): Multiple urgent needs (family with kids)
12. **Jessica** (HIGH): Need ride to shelter

## 🔍 Verification Queries

After loading, verify the data:

```sql
-- Count records
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM offers) as offers,
  (SELECT COUNT(*) FROM requests) as requests,
  (SELECT COUNT(*) FROM offer_items) as offer_items,
  (SELECT COUNT(*) FROM request_items) as request_items;

-- View all offers with their items
SELECT
  u.name as volunteer,
  o.title,
  o.location_address,
  oi.resource_type,
  oi.quantity_remaining,
  o.available_until
FROM offers o
JOIN users u ON o.user_id = u.user_id
JOIN offer_items oi ON o.offer_id = oi.offer_id
ORDER BY o.offer_id;

-- View all requests with urgency
SELECT
  u.name as requester,
  r.title,
  r.urgency_level,
  r.location_address,
  ri.resource_type,
  ri.quantity_needed
FROM requests r
JOIN users u ON r.user_id = u.user_id
JOIN request_items ri ON r.request_id = ri.request_id
ORDER BY
  CASE r.urgency_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  r.request_id;

-- View conversations and messages
SELECT
  u1.name as sender,
  u2.name as recipient,
  m.message_text,
  m.sent_at,
  m.is_read
FROM messages m
JOIN users u1 ON m.sender_id = u1.user_id
JOIN users u2 ON m.recipient_id = u2.user_id
ORDER BY m.sent_at;
```

## 🧪 Testing Scenarios

### Scenario 1: Volunteer Offering Multiple Resources
- Login as `mike.chen@vanderbilt.edu`
- View "My Offers" - should see power banks and WiFi offer
- Edit or manage offer items

### Scenario 2: Critical Request
- Login as `ashley.patel@vanderbilt.edu`
- View "My Requests" - should see critical food/water request
- See matching offers from Sarah (food & blankets)

### Scenario 3: Transportation Request
- Login as `rachel.lee@vanderbilt.edu`
- View high-priority ride request to pharmacy
- Should match with David's transportation offer

### Scenario 4: Messaging
- Login as `ashley.patel@vanderbilt.edu`
- View messages with Sarah about food delivery
- Continue conversation

### Scenario 5: Baby Supplies Emergency
- Login as `olivia.martinez@vanderbilt.edu`
- View critical request for baby supplies
- Should match with Ryan's baby supplies offer

## 📍 For Developer 2: Map Integration

All offers and requests have **real coordinates**:

```javascript
// Example: Get all offers for map markers
SELECT
  offer_id,
  title,
  location_lat,
  location_lng,
  location_address,
  user_id
FROM offers
WHERE status = 'active';

// Example: Get all requests for map markers
SELECT
  request_id,
  title,
  urgency_level,
  location_lat,
  location_lng,
  location_address,
  user_id
FROM requests
WHERE status = 'active';
```

### Coordinate Ranges
- Latitude: 36.13 to 36.17 (Nashville area)
- Longitude: -86.81 to -86.78 (Vanderbilt/West End area)

## 🔧 Customization

To add more data:

1. Open `database/seed_data.sql`
2. Add new INSERT statements following the existing format
3. Reload the file: `psql -d crisis_connect -f database/seed_data.sql`

### Example: Add New Offer

```sql
-- Add user first
INSERT INTO users (email, password_hash, name, location_lat, location_lng, location_address, user_type)
VALUES ('new.user@vanderbilt.edu', '$2a$10$rZ5JKzFQ7gE8qKvN0eX5KumFZhGdacHJkKqYvYiHxGxQRPzLwxXBa', 'New User', 36.1447, -86.8027, 'Vanderbilt', 'student');

-- Add offer
INSERT INTO offers (user_id, title, description, location_lat, location_lng, location_address, delivery_available, status, available_from, available_until)
VALUES (16, 'My New Offer', 'Description', 36.1447, -86.8027, 'Location', true, 'active', NOW(), NOW() + INTERVAL '3 days');

-- Add items
INSERT INTO offer_items (offer_id, resource_type, quantity_total, quantity_remaining, status)
VALUES (11, 'food', 10, 10, 'available');
```

## ⚠️ Important Notes

1. **Password for all users**: `password123` (bcrypt hashed in database)
2. **All data is dummy data** - safe to delete/modify
3. **Coordinates are real** - but addresses are approximated
4. **Available dates** - offers expire 2-7 days from creation
5. **Conversations** - only 3 sample conversations included (add more as needed)

## 🔄 Reset Data

To completely reset and reload:

```bash
# Delete everything
psql -d crisis_connect -c "TRUNCATE TABLE transactions, messages, conversations, offer_items, request_items, offers, requests, users RESTART IDENTITY CASCADE;"

# Reload schema
psql -d crisis_connect -f database/schema.sql

# Reload seed data
psql -d crisis_connect -f database/seed_data.sql
```

## 📊 Statistics

Run this to see data distribution:

```sql
-- Resource type distribution in offers
SELECT resource_type, COUNT(*) as count, SUM(quantity_remaining) as total_available
FROM offer_items
GROUP BY resource_type
ORDER BY count DESC;

-- Resource type distribution in requests
SELECT resource_type, COUNT(*) as count, SUM(quantity_needed) as total_needed
FROM request_items
GROUP BY resource_type
ORDER BY count DESC;

-- Urgency level distribution
SELECT urgency_level, COUNT(*) as count
FROM requests
GROUP BY urgency_level
ORDER BY
  CASE urgency_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;
```

---

**Created**: March 28, 2024
**For**: Developer 1 and Developer 2
**Location**: `/database/seed_data.sql`
