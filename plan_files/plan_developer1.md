# Crisis Connect - Developer 1 Plan
## Core Marketplace & Matching System

---

## Your Responsibilities

You are responsible for building the **core marketplace functionality** - the foundation that allows users to create requests, create offers, search for help, and get matched efficiently.

### Your Feature Set:
1. ✅ User Authentication & Profiles
2. ✅ Request System (CRUD)
3. ✅ Offer System (CRUD)
4. ✅ Search & Filtering
5. ✅ Smart Matching Algorithm
6. ✅ Basic Messaging System
7. ✅ Dashboard & User Management

### Developer 2's Feature Set (for context):
- Weather Alert Integration
- Blockage Reporting System
- Map Visualization
- Route Display
- Authority Notification System

---

## Merge Conflict Prevention Strategy

### Your Files (You Own These):
```
backend/
├── models/
│   ├── User.js
│   ├── Request.js
│   ├── Offer.js
│   ├── Message.js
│   └── Transaction.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── requests.js
│   ├── offers.js
│   ├── search.js
│   └── messages.js
├── services/
│   ├── matchingAlgorithm.js
│   └── authService.js
└── middleware/
    └── authMiddleware.js

frontend/
├── components/
│   ├── marketplace/
│   │   ├── RequestForm.jsx
│   │   ├── OfferForm.jsx
│   │   ├── RequestCard.jsx
│   │   ├── OfferCard.jsx
│   │   ├── SearchBar.jsx
│   │   ├── FilterPanel.jsx
│   │   └── MatchBadge.jsx
│   ├── messaging/
│   │   ├── ChatBox.jsx
│   │   ├── MessageList.jsx
│   │   └── Conversation.jsx
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── MyRequests.jsx
│   │   └── MyOffers.jsx
│   └── shared/
│       ├── Navbar.jsx
│       ├── Layout.jsx
│       └── ProfileCard.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Search.jsx
│   ├── CreateRequest.jsx
│   └── CreateOffer.jsx
└── services/
    ├── api.js (your endpoints)
    └── authContext.js
```

### Shared Files (Coordinate Before Editing):
```
backend/
└── server.js (initial setup only, then mostly hands-off)

frontend/
├── App.jsx (routing setup - coordinate)
└── index.css (basic styles - coordinate)

database/
└── schema.sql (coordinate on table creation)
```

### Files You Should NOT Touch:
- Anything in `backend/routes/blockages.js`
- Anything in `backend/routes/weather.js`
- Anything in `backend/services/weatherAlert.js`
- Anything in `backend/services/geocoding.js`
- Anything in `frontend/components/crisis/`
- Anything in `frontend/components/map/`

---

## Technical Stack

### Backend:
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (or MongoDB if team prefers)
- **Authentication**: Simplified mock auth (full Vanderbilt SSO post-hackathon)
- **ORM**: Sequelize (PostgreSQL) or Mongoose (MongoDB)

### Frontend:
- **Framework**: React with Vite
- **Routing**: React Router v6
- **State Management**: Context API (simple) or Redux (if team prefers)
- **Styling**: Tailwind CSS (mobile-first)
- **HTTP Client**: Axios

### Your APIs (No external dependencies):
- All functionality uses your own backend APIs
- No external API keys needed for your features

---

## Database Schema (Your Tables)

### Users Table
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(20),
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
```

### Requests Table
```sql
CREATE TABLE requests (
    request_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    urgency_level VARCHAR(20), -- low, medium, high, critical
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_address TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, partially_fulfilled, fulfilled, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_location ON requests(location_lat, location_lng);
```

### Request_Items Table
```sql
CREATE TABLE request_items (
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
```

### Offers Table
```sql
CREATE TABLE offers (
    offer_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_address TEXT,
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
```

### Offer_Items Table
```sql
CREATE TABLE offer_items (
    item_id SERIAL PRIMARY KEY,
    offer_id INT REFERENCES offers(offer_id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    quantity_total INT NOT NULL,
    quantity_remaining INT NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, claimed, given
    notes TEXT
);

CREATE INDEX idx_offer_items_offer ON offer_items(offer_id);
CREATE INDEX idx_offer_items_type ON offer_items(resource_type);
```

### Messages Table
```sql
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT REFERENCES users(user_id),
    recipient_id INT REFERENCES users(user_id),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
```

### Conversations Table
```sql
CREATE TABLE conversations (
    conversation_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES requests(request_id),
    offer_id INT REFERENCES offers(offer_id),
    participant_1_id INT REFERENCES users(user_id),
    participant_2_id INT REFERENCES users(user_id),
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, archived
    created_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
```

### Transactions Table
```sql
CREATE TABLE transactions (
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
```

---

## Day 1 Timeline (8 hours)

### Hour 1-2: Project Setup
- [ ] Initialize Node.js + Express backend
- [ ] Initialize React + Vite frontend
- [ ] Setup PostgreSQL database
- [ ] Create database schema (your tables only)
- [ ] Setup Tailwind CSS
- [ ] Create basic folder structure
- [ ] Setup CORS and middleware

### Hour 3-4: Authentication System
- [ ] Create User model
- [ ] Implement registration endpoint (`POST /api/auth/register`)
- [ ] Implement login endpoint (`POST /api/auth/login`)
- [ ] Create JWT middleware
- [ ] Build Login/Register UI (simple, mobile-responsive)
- [ ] Setup AuthContext in frontend
- [ ] Protected route wrapper

### Hour 5-6: Request System
- [ ] Create Request and RequestItem models
- [ ] Implement endpoints:
  - `POST /api/requests` - Create request
  - `GET /api/requests/:id` - Get single request
  - `GET /api/requests/my` - Get user's requests
  - `PUT /api/requests/:id` - Update request
  - `DELETE /api/requests/:id` - Delete request
- [ ] Build RequestForm component (mobile-friendly)
- [ ] Build MyRequests component
- [ ] Test request creation flow

### Hour 7-8: Offer System
- [ ] Create Offer and OfferItem models
- [ ] Implement endpoints:
  - `POST /api/offers` - Create offer
  - `GET /api/offers/:id` - Get single offer
  - `GET /api/offers/my` - Get user's offers
  - `PUT /api/offers/:id` - Update offer
  - `DELETE /api/offers/:id` - Delete offer
- [ ] Build OfferForm component (mobile-friendly)
- [ ] Build MyOffers component
- [ ] Test offer creation flow

---

## Day 2 Timeline (8 hours)

### Hour 1-2: Search & Discovery
- [ ] Implement search endpoint `GET /api/search`
  - Filter by resource_type
  - Filter by location (radius)
  - Filter by urgency
  - Sort by distance, date
- [ ] Build SearchBar component
- [ ] Build FilterPanel component
- [ ] Build SearchResults component (list view)
- [ ] Build OfferCard/RequestCard components
- [ ] Test search with various filters

### Hour 3-4: Smart Matching Algorithm
- [ ] Create `matchingAlgorithm.js` service
- [ ] Implement scoring function:
  ```javascript
  calculateMatchScore(request, offer) {
    // Distance score (0-40 points)
    // Resource type match (0-30 points)
    // Volunteer reputation (0-20 points)
    // Availability overlap (0-10 points)
    // Return total score
  }
  ```
- [ ] Implement endpoint `GET /api/requests/:id/best-matches`
- [ ] Build MatchBadge component (shows match score)
- [ ] Add "Best Matches" section to search results
- [ ] Highlight top 3 matches with badges

### Hour 5-6: Messaging System
- [ ] Create Message and Conversation models
- [ ] Implement endpoints:
  - `POST /api/conversations` - Start conversation
  - `GET /api/conversations` - Get user's conversations
  - `POST /api/messages` - Send message
  - `GET /api/conversations/:id/messages` - Get messages
  - `PUT /api/messages/:id/read` - Mark as read
- [ ] Build ChatBox component
- [ ] Build MessageList component
- [ ] Build Conversation component
- [ ] Test messaging flow

### Hour 7-8: Dashboard & Polish
- [ ] Build Dashboard component
  - Show user's active requests
  - Show user's active offers
  - Show recent messages
  - Show match suggestions
- [ ] Build Navbar with navigation
- [ ] Build Layout wrapper
- [ ] Mobile responsiveness review
  - Test on mobile viewport
  - Fix any layout issues
  - Ensure buttons are touch-friendly
- [ ] Integration testing
- [ ] Bug fixes

---

## API Endpoints Specification

### Authentication
```javascript
// POST /api/auth/register
Request: { email, password, name, phone, location_address, user_type }
Response: { token, user: {...} }

// POST /api/auth/login
Request: { email, password }
Response: { token, user: {...} }

// GET /api/auth/me (protected)
Response: { user: {...} }
```

### Requests
```javascript
// POST /api/requests (protected)
Request: {
  title, description, urgency_level,
  location_lat, location_lng, location_address,
  items: [{ resource_type, quantity_needed, notes }]
}
Response: { request: {...}, items: [...] }

// GET /api/requests/:id
Response: { request: {...}, items: [...], user: {...} }

// GET /api/requests/my (protected)
Response: [{ request: {...}, items: [...] }]

// PUT /api/requests/:id (protected)
Request: { title, description, status, items: [...] }
Response: { request: {...} }

// DELETE /api/requests/:id (protected)
Response: { message: "Deleted" }

// PUT /api/requests/:id/items/:itemId (protected)
Request: { quantity_fulfilled, status }
Response: { item: {...} }
```

### Offers
```javascript
// POST /api/offers (protected)
Request: {
  title, description, delivery_available,
  location_lat, location_lng, location_address,
  available_from, available_until,
  items: [{ resource_type, quantity_total, notes }]
}
Response: { offer: {...}, items: [...] }

// GET /api/offers/:id
Response: { offer: {...}, items: [...], user: {...} }

// GET /api/offers/my (protected)
Response: [{ offer: {...}, items: [...] }]

// PUT /api/offers/:id (protected)
Request: { title, description, status, items: [...] }
Response: { offer: {...} }

// DELETE /api/offers/:id (protected)
Response: { message: "Deleted" }

// PUT /api/offers/:id/items/:itemId (protected)
Request: { quantity_remaining, status }
Response: { item: {...} }
```

### Search
```javascript
// GET /api/search
Query params: {
  type: 'offers' | 'requests',
  resource_type: string,
  lat: number,
  lng: number,
  radius: number (in km),
  urgency: string,
  sort: 'distance' | 'date' | 'urgency'
}
Response: [{
  id, title, description, location, distance_km,
  items: [...], user: {...}, match_score (if applicable)
}]
```

### Matching
```javascript
// GET /api/requests/:id/best-matches (protected)
Response: [{
  offer: {...},
  items: [...],
  user: {...},
  match_score: number,
  distance_km: number,
  matching_resources: [...]
}]

// GET /api/offers/:id/best-matches (protected)
Response: [{
  request: {...},
  items: [...],
  user: {...},
  match_score: number,
  distance_km: number,
  matching_resources: [...]
}]
```

### Messages
```javascript
// POST /api/conversations (protected)
Request: {
  participant_id: number,
  request_id?: number,
  offer_id?: number
}
Response: { conversation: {...} }

// GET /api/conversations (protected)
Response: [{
  conversation: {...},
  last_message: {...},
  unread_count: number,
  other_participant: {...}
}]

// POST /api/messages (protected)
Request: {
  conversation_id: number,
  recipient_id: number,
  message_text: string
}
Response: { message: {...} }

// GET /api/conversations/:id/messages (protected)
Response: [{ message: {...}, sender: {...} }]

// PUT /api/messages/:id/read (protected)
Response: { message: {...} }
```

---

## Matching Algorithm Implementation

```javascript
// backend/services/matchingAlgorithm.js

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateMatchScore = (request, offer, requestItems, offerItems, volunteerReputation) => {
  let score = 0;

  // 1. Distance Score (0-40 points)
  const distance = calculateDistance(
    request.location_lat, request.location_lng,
    offer.location_lat, offer.location_lng
  );

  if (distance < 1) score += 40;
  else if (distance < 3) score += 35;
  else if (distance < 5) score += 25;
  else if (distance < 10) score += 15;
  else score += 5;

  // 2. Resource Type Match (0-30 points)
  const requestTypes = requestItems.map(item => item.resource_type);
  const offerTypes = offerItems.map(item => item.resource_type);
  const matchingTypes = requestTypes.filter(type => offerTypes.includes(type));

  const matchPercentage = matchingTypes.length / requestTypes.length;
  score += Math.round(matchPercentage * 30);

  // 3. Volunteer Reputation (0-20 points)
  const reputationScore = Math.min(volunteerReputation * 2, 20);
  score += reputationScore;

  // 4. Availability (0-10 points)
  const now = new Date();
  if (offer.available_from <= now && offer.available_until >= now) {
    score += 10;
  } else if (offer.available_until >= now) {
    score += 5;
  }

  return {
    score,
    distance_km: Math.round(distance * 10) / 10,
    matching_resources: matchingTypes
  };
};

const findBestMatches = async (request, requestItems) => {
  // Find all active offers
  const offers = await Offer.findAll({
    where: { status: 'active' },
    include: [
      { model: OfferItem, where: { status: 'available' } },
      { model: User }
    ]
  });

  // Calculate scores
  const matches = offers.map(offer => {
    const matchData = calculateMatchScore(
      request,
      offer,
      requestItems,
      offer.offer_items,
      offer.user.reputation_score
    );

    return {
      offer,
      ...matchData
    };
  });

  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

module.exports = {
  calculateDistance,
  calculateMatchScore,
  findBestMatches
};
```

---

## Frontend Components Specification

### RequestForm.jsx
```jsx
// Mobile-friendly form with:
// - Title input
// - Description textarea
// - Urgency level dropdown (low, medium, high, critical)
// - Location input (address with autocomplete or lat/lng)
// - Dynamic item list:
//   - Resource type dropdown
//   - Quantity input
//   - Notes input
//   - Add/Remove item buttons
// - Submit button (large, touch-friendly)
// - Cancel button

// Form validation:
// - Title required
// - At least one item required
// - Location required
```

### OfferForm.jsx
```jsx
// Similar to RequestForm with:
// - Title input
// - Description textarea
// - Location input
// - Delivery available checkbox
// - Availability date/time range
// - Dynamic item list:
//   - Resource type dropdown
//   - Quantity total input
//   - Notes input
//   - Add/Remove item buttons
// - Submit button
// - Cancel button
```

### SearchBar.jsx
```jsx
// Simple search interface:
// - Search input (resource type)
// - Location input (or use current location)
// - Radius slider (1km - 20km)
// - "Search Offers" / "Search Requests" toggle
// - Search button
```

### FilterPanel.jsx
```jsx
// Collapsible filter panel:
// - Resource type checkboxes (food, water, shelter, etc.)
// - Urgency level checkboxes (for requests)
// - Availability filter (for offers)
// - Sort dropdown (distance, date, urgency)
// - Apply/Clear filters buttons
```

### MatchBadge.jsx
```jsx
// Visual indicator for match quality:
// - Display match score as percentage
// - Color-coded: green (80+), yellow (50-79), gray (<50)
// - Show "Best Match" label for top 3
// - Tooltip with breakdown:
//   - Distance: X km
//   - Matching resources: [list]
//   - Volunteer reputation: X
```

### Dashboard.jsx
```jsx
// User's home screen:
// - Welcome message with name
// - Quick stats:
//   - Active requests count
//   - Active offers count
//   - Messages unread count
// - "My Requests" section (summary)
// - "My Offers" section (summary)
// - "Recent Messages" section
// - Quick action buttons:
//   - Create Request
//   - Create Offer
//   - Search Help
```

---

## Mobile Responsiveness Guidelines

### Breakpoints (using Tailwind):
```css
/* Mobile-first approach */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
```

### Touch-Friendly UI:
- Minimum button size: 44x44px
- Generous padding on tap targets
- Large form inputs (min-height: 48px)
- Bottom navigation for mobile
- Swipe gestures for lists

### Layout Patterns:
```jsx
// Use Tailwind responsive classes
<div className="container mx-auto px-4 py-6">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards stack on mobile, side-by-side on desktop */}
  </div>
</div>

// Mobile-friendly form layout
<form className="space-y-4">
  <input className="w-full p-3 text-base border rounded-lg" />
  <button className="w-full py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg">
    Submit
  </button>
</form>
```

---

## Testing Checklist

### Backend Testing:
- [ ] User registration with valid data
- [ ] Login with correct credentials
- [ ] Create request with multiple items
- [ ] Create offer with multiple items
- [ ] Search offers by resource type
- [ ] Filter by location radius
- [ ] Calculate match scores correctly
- [ ] Send and receive messages
- [ ] Mark items as fulfilled/given
- [ ] Update request/offer status

### Frontend Testing:
- [ ] Forms validate correctly
- [ ] Error messages display properly
- [ ] Search results display correctly
- [ ] Match badges show accurate scores
- [ ] Dashboard shows correct counts
- [ ] Mobile layout works on iPhone/Android sizes
- [ ] Touch interactions work smoothly
- [ ] Navigation flows logically

### Integration Testing:
- [ ] Complete flow: Register → Create Request → Search Offers → Message
- [ ] Complete flow: Register → Create Offer → View Matches → Respond
- [ ] Mobile responsiveness across devices

---

## Integration Points with Developer 2

### Data You Provide to Dev 2:
1. **User location data** - Dev 2 needs lat/lng for map markers
2. **Offer/Request IDs** - Dev 2 links blockages to relevant offers/requests
3. **User authentication** - Dev 2 uses your auth middleware

### Data Dev 2 Provides to You:
1. **Blockage data** - You'll display blockages on search results
2. **Weather alerts** - You'll show alert banner on dashboard
3. **Route info** - You'll link to route view from offer details

### Integration Timeline:
- **Day 1 End**: Share API base structure and auth middleware
- **Day 2 Morning**: Coordinate on shared layout components
- **Day 2 Afternoon**: Final integration and testing

### Communication Protocol:
- Commit messages: Use `[DEV1]` prefix
- Create separate branches: `dev1-feature-name`
- Merge to `main` only after coordination
- Use comments in code: `// DEV2: Please integrate here`

---

## Code Quality Standards

### Backend:
- Use async/await (not callbacks)
- Proper error handling with try/catch
- Consistent response format:
  ```javascript
  // Success
  res.json({ success: true, data: {...} })

  // Error
  res.status(400).json({ success: false, error: "Message" })
  ```
- Validate all inputs
- Use middleware for repeated logic

### Frontend:
- Functional components with hooks
- PropTypes or TypeScript for type safety
- Consistent naming: PascalCase for components
- Extract reusable logic into custom hooks
- Clean up useEffect dependencies

---

## Final Deliverables

By end of Day 2, you should have:
1. ✅ Working authentication system
2. ✅ Request CRUD functionality
3. ✅ Offer CRUD functionality
4. ✅ Search with filters
5. ✅ Smart matching algorithm showing top matches
6. ✅ Basic messaging system
7. ✅ Dashboard with user's data
8. ✅ Mobile-responsive UI
9. ✅ All features tested and working

---

## Demo Script (Your Parts)

**1. Show Registration/Login** (30 seconds)
- "Users log in with email/password"
- Show clean, mobile-friendly login screen

**2. Create Request** (60 seconds)
- "Sarah needs food and blankets after ice storm"
- Fill form quickly, show multiple items
- Submit and show confirmation

**3. Search & Match** (90 seconds)
- "Sarah searches for help nearby"
- Apply filters, show results
- **Highlight "Best Matches" feature** ⭐
- Show match score badges
- "Our algorithm ranks offers by distance, resource match, and volunteer reputation"

**4. Messaging** (45 seconds)
- Click "Contact Volunteer"
- Send message
- Show conversation thread

**5. Dashboard** (30 seconds)
- Show user's requests and offers
- Quick stats
- Clean, organized interface

Total: ~4.5 minutes (leaves time for Dev 2's features)

---

## Emergency Contacts

**If you get stuck:**
- Backend issues: Check Express middleware order
- Database issues: Check Sequelize relationships
- Frontend issues: Check React DevTools for state
- Auth issues: Verify JWT token in headers

**Common Pitfalls:**
- CORS errors: Configure CORS in server.js properly
- Database connections: Don't forget to sync models
- Frontend routing: Use `<BrowserRouter>` not `<HashRouter>`
- Mobile issues: Test with browser dev tools mobile view

---

## Post-Hackathon Enhancements

If time permits or for future:
- Real-time messaging with Socket.io
- Photo uploads for offers
- User ratings and reviews
- Transaction history
- Advanced filters (gender preference, etc.)
- Notification system
- Email confirmations

---

**Good luck! Focus on core functionality first, polish later. Mobile-friendly is key!** 📱
