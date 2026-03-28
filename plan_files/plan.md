# Crisis Connect - Vanderbilt Community Resource Matching Platform

## Project Overview

### Mission
Create a centralized platform that connects Vanderbilt community members in need with volunteers during crisis situations, inspired by the Nashville ice storm that left many without power, food, shelter, and transportation for days.

### Core Problem
During emergencies, there is no unified platform for matching people who need help with those who can provide it. Resources and volunteers exist, but discovery and coordination are fragmented.

### Solution
A web application that allows Vanderbilt community members (students, staff, faculty) to:
- Post requests for help with specific needs
- Offer resources and volunteer services
- Search and discover available help
- Connect directly through messaging
- Track and manage transactions
---

## User Personas

### 1. Person in Need
- Has one or more urgent needs (food, shelter, blankets, transportation, etc.)
- May have limited mobility or resources
- Needs quick, easy way to find help
- May have preferences for who helps them (location, gender, etc.)

### 2. Volunteer
- Has resources to share (items, services, transportation, etc.)
- Wants to help community members efficiently
- May offer multiple different items/services
- Needs to manage what's still available vs. fulfilled

### 3. Dual Role User
- Can both request help AND volunteer
- Needs clear separation between their requests and offers
- May switch between roles frequently

---

## Core Features

### Authentication & Access Control
- **Vanderbilt SSO Integration**
  - Single sign-on for all Vanderbilt community members
  - Automatic role assignment (student, staff, faculty)
  - Profile creation on first login
  - Secure session management

### User Profile Management
- **Profile Information**
  - Name, contact information
  - Location (dorm, building, address)
  - Preferred contact method
  - User type (student, staff, faculty)
  - Gender (optional, for filtering preferences)
  - Active requests count
  - Active offers count

### Request System (For People in Need)
- **Create Request**
  - Form-based request creation
  - Resource type selection (multi-select)
    - Food
    - Water
    - Shelter
    - Blankets/Clothing
    - Medical supplies
    - Transportation
    - Power/Charging
    - Other (custom)
  - Urgency level (Low, Medium, High, Critical)
  - Description/notes field
  - Location information
  - Volunteer preferences (optional)
    - Gender preference
    - Location proximity
    - Availability time
  - Quantity/details for each resource type

- **Request States**
  - Active: Request is open and visible
  - Partially Fulfilled: Some items fulfilled, others still needed
  - Fulfilled: All needs met
  - Cancelled: User cancelled the request
  - Expired: Auto-expire after certain time period

- **Request Management**
  - View all my requests
  - Edit active requests
  - Mark individual items as fulfilled
  - Mark entire request as fulfilled
  - Cancel requests
  - View who responded to requests
  - Request history

### Offer System (For Volunteers)
- **Create Offer**
  - Form-based offer creation
  - Resource type selection (multi-select)
    - Same categories as requests
  - Quantity available for each item
  - Availability window (date/time range)
  - Location for pickup/delivery
  - Delivery capability (yes/no)
  - Description/notes
  - Photos (optional)

- **Offer States**
  - Active: Offer is available
  - Partially Claimed: Some items taken, others available
  - Fulfilled: All items claimed
  - Cancelled: Volunteer cancelled
  - Expired: Outside availability window

- **Offer Management**
  - View all my offers
  - Edit active offers
  - Mark individual items as given
  - Update quantities
  - Mark entire offer as fulfilled
  - Cancel offers
  - View who contacted me
  - Offer history

### Search & Discovery

#### Search-Based View
- **Search Functionality**
  - Keyword search across offers
  - Filter by resource type
  - Filter by location/proximity
  - Filter by volunteer gender (if specified in offer)
  - Filter by availability
  - Sort by distance, urgency, date posted

- **Results Display**
  - Card-based layout
  - Show resource types offered
  - Location information
  - Volunteer name/basic info
  - Distance from user
  - Availability window
  - Quick "Contact" button

#### Map-Based View
- **Interactive Map**
  - Display all active offers as markers
  - Color-coded by resource type
  - Cluster markers in dense areas
  - Click marker to see offer details
  - Filter markers by resource type
  - Show user's current location
  - Calculate distances

#### List View
- **Simplified Display**
  - Table/list format
  - Quick scan of all available resources
  - Sortable columns
  - Inline filters

### Messaging & Communication
- **Direct Messaging**
  - One-on-one chat between requester and volunteer
  - Real-time messaging
  - Message history
  - Notification system
  - Share location/contact info
  - Mark conversation as resolved
  - Block/report users (safety feature)

- **Conversation Management**
  - Inbox view
  - Unread message indicators
  - Archive conversations
  - Search conversation history

### Transaction & Fulfillment System
- **Transaction Flow**
  1. Requester finds offer and initiates contact
  2. Both parties communicate via messaging
  3. Agree on details (time, location, etc.)
  4. Meet and complete transaction
  5. Both parties confirm completion
  6. Database updates automatically

- **Fulfillment Mechanisms**
  - Volunteer marks item(s) as given
  - Requester marks item(s) as received
  - Both confirmations required for full closure
  - Partial fulfillment supported
  - Automatic database updates

- **Edge Case Handling**
  - Multiple items in one offer: Track each separately
  - Partial completion: Update only fulfilled items
  - Cancellation: Release claimed resources
  - No-show: Report and re-list
  - Dispute resolution: Admin review

---

## Technical Architecture (High-Level)

### Frontend
- **Technology Stack**
  - React or Vue.js for UI
  - Responsive design (mobile-first)
  - Real-time updates (WebSockets or polling)
  - Map integration (Google Maps or Mapbox)

- **Key Pages**
  - Login/Landing
  - Dashboard (my requests + my offers)
  - Search/Browse (with filters)
  - Map View
  - Create Request
  - Create Offer
  - Profile Management
  - Messaging Inbox
  - Request/Offer Details

### Backend
- **Technology Stack**
  - Node.js + Express or Python + Flask/Django
  - RESTful API design
  - WebSocket server for real-time messaging
  - Vanderbilt SSO integration

- **Core Services**
  - Authentication service
  - User management
  - Request/Offer CRUD operations
  - Search and filtering
  - Messaging service
  - Notification service
  - Geolocation service

### Database
- **Database Choice**
  - PostgreSQL or MongoDB
  - Consider scaling for real crisis situations

- **Key Entities**
  - Users
  - Requests
  - Offers
  - Messages
  - Transactions
  - Notifications

### Authentication
- **Vanderbilt SSO**
  - SAML or OAuth integration
  - Automatic user provisioning
  - Role-based access control

---

## Database Schema Considerations

### Users Table
- user_id (primary key)
- vanderbilt_id (unique)
- email
- name
- phone
- gender
- location (latitude, longitude, address)
- user_type (student, staff, faculty)
- created_at
- last_login

### Requests Table
- request_id (primary key)
- user_id (foreign key)
- title
- description
- urgency_level
- location_latitude
- location_longitude
- location_address
- status (active, partially_fulfilled, fulfilled, cancelled, expired)
- created_at
- updated_at
- expires_at

### Request_Items Table (for multiple resources per request)
- item_id (primary key)
- request_id (foreign key)
- resource_type
- quantity_needed
- quantity_fulfilled
- status (pending, fulfilled)
- notes

### Request_Preferences Table
- preference_id (primary key)
- request_id (foreign key)
- gender_preference
- max_distance
- availability_start
- availability_end

### Offers Table
- offer_id (primary key)
- user_id (foreign key)
- title
- description
- location_latitude
- location_longitude
- location_address
- delivery_available (boolean)
- status (active, partially_claimed, fulfilled, cancelled, expired)
- available_from
- available_until
- created_at
- updated_at

### Offer_Items Table
- item_id (primary key)
- offer_id (foreign key)
- resource_type
- quantity_total
- quantity_remaining
- status (available, claimed, given)
- notes

### Transactions Table
- transaction_id (primary key)
- request_id (foreign key, nullable)
- offer_id (foreign key)
- requester_id (foreign key to Users)
- volunteer_id (foreign key to Users)
- resource_type
- quantity
- status (initiated, confirmed_by_volunteer, confirmed_by_requester, completed, cancelled)
- scheduled_time
- completed_at
- created_at

### Messages Table
- message_id (primary key)
- conversation_id
- sender_id (foreign key to Users)
- recipient_id (foreign key to Users)
- message_text
- is_read (boolean)
- sent_at

### Conversations Table
- conversation_id (primary key)
- request_id (foreign key, nullable)
- offer_id (foreign key, nullable)
- participant_1_id (foreign key to Users)
- participant_2_id (foreign key to Users)
- status (active, resolved, archived)
- created_at
- last_message_at

---

## Key User Flows

### Flow 1: Person in Need Searches for Help
1. User logs in via Vanderbilt SSO
2. Navigates to Search/Browse page
3. Enters keyword (e.g., "food", "blankets")
4. Applies filters (location, gender preference)
5. Views results in list or map view
6. Clicks on offer that matches need
7. Views offer details
8. Clicks "Contact Volunteer"
9. Sends message via chat
10. Coordinates pickup/delivery
11. Meets volunteer and receives help
12. Marks item as received
13. System updates database (decrements offer quantity)

### Flow 2: Person Creates a Request
1. User logs in
2. Clicks "Create Request"
3. Fills out form:
   - Selects resource types needed
   - Specifies quantities
   - Sets urgency level
   - Adds location
   - Sets preferences (optional)
   - Adds description
4. Submits request
5. Request becomes visible to volunteers
6. Volunteers search and find request
7. Volunteer contacts requester
8. They coordinate and complete transaction
9. Requester marks items as fulfilled
10. System updates request status

### Flow 3: Volunteer Creates an Offer
1. User logs in
2. Clicks "Create Offer"
3. Fills out form:
   - Selects resource types to offer
   - Specifies quantities for each
   - Sets availability window
   - Adds location
   - Indicates delivery capability
   - Adds photos/description
4. Submits offer
5. Offer becomes searchable
6. People in need find and contact volunteer
7. Volunteer responds via messaging
8. They coordinate transaction
9. Volunteer marks items as given
10. System updates offer (decrements quantity or marks as fulfilled)

### Flow 4: Partial Fulfillment
1. Volunteer offers 3 items: food, blankets, water
2. Requester A contacts for food
3. They complete transaction for food
4. Volunteer marks "food" as given (quantity 1)
5. System updates: food removed from offer, blankets and water still visible
6. Requester B finds and contacts for blankets
7. Transaction completes for blankets
8. System updates: only water remains in offer
9. Requester C takes water
10. All items fulfilled, offer marked as complete

---

## Edge Cases & Important Considerations

### Inventory Management
- **Problem**: Volunteer offers 5 blankets, 3 people claim them
- **Solution**:
  - Track quantity_total and quantity_remaining
  - First-come-first-served or volunteer chooses
  - Real-time updates when quantities change
  - Lock mechanism during transaction negotiation

### Partial Fulfillment Tracking
- **Problem**: Request has 3 items, only 1 is fulfilled
- **Solution**:
  - Track each item separately in Request_Items table
  - Individual status for each item
  - Request overall status = partially_fulfilled
  - UI shows which items still needed

### Transaction Confirmation
- **Problem**: Who confirms completion?
- **Solution**:
  - Both parties should confirm
  - Volunteer marks as "given"
  - Requester marks as "received"
  - Transaction only fully closed when both confirm
  - Prevents fraud/miscommunication

### No-Show Scenarios
- **Problem**: Parties agree to meet but one doesn't show
- **Solution**:
  - Transaction status remains "initiated"
  - After time limit, either party can cancel
  - Resources automatically released back
  - Optional reporting mechanism

### Duplicate Requests/Offers
- **Problem**: Same person posts multiple identical requests
- **Solution**:
  - Warning when creating similar requests
  - Merge suggestion
  - Admin review for spam

### Privacy & Safety
- **Problem**: Sharing personal information with strangers
- **Solution**:
  - Vanderbilt authentication ensures verified users
  - Option to hide exact address until connection made
  - Block/report functionality
  - Safety guidelines and tips
  - Emergency contact information

### Stale Data
- **Problem**: Offers/requests remain active when no longer valid
- **Solution**:
  - Auto-expire after set time period
  - Reminders to update or close
  - "Is this still active?" prompt
  - Inactive user cleanup

### Simultaneous Claims
- **Problem**: Two people try to claim last item simultaneously
- **Solution**:
  - Optimistic locking or pessimistic locking
  - Transaction-level database operations
  - First successful commit wins
  - Notify second user item no longer available

### Location Privacy
- **Problem**: Users don't want exact location public
- **Solution**:
  - Show approximate location (building, area)
  - Reveal exact address only after agreement
  - Allow users to set custom meeting points

### Scalability During Crisis
- **Problem**: Sudden surge of users during emergency
- **Solution**:
  - Design for scale from start
  - Caching for search results
  - Database indexing
  - Load balancing
  - Consider CDN for static assets

---

## MVP Features (For Hackathon)

### Must-Have
1. Vanderbilt SSO authentication
2. User profile creation
3. Create request (basic form)
4. Create offer (basic form)
5. Search functionality with filters
6. View offers/requests in list format
7. Basic messaging between users
8. Mark items as fulfilled/given
9. Dashboard showing my requests and offers

### Nice-to-Have
1. Map view
2. Real-time messaging
3. Photo uploads
4. Advanced filtering
5. Notification system
6. Transaction history
7. Rating/review system

### Post-Hackathon
1. Mobile app
2. Push notifications
3. Admin dashboard
4. Analytics and reporting
5. Multi-university expansion
6. SMS integration for accessibility
7. Integration with emergency services

---

## User Interface Considerations

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatible
- Keyboard navigation
- High contrast mode
- Text size adjustment
- Clear, simple language

### Mobile Responsiveness
- Mobile-first design
- Touch-friendly buttons
- Simplified navigation
- Offline capability (service workers)
- Fast loading times

### User Experience
- Minimal clicks to complete actions
- Clear call-to-action buttons
- Progress indicators
- Success/error messaging
- Intuitive navigation
- Search autocomplete
- Smart defaults in forms

---

## Safety & Moderation

### User Verification
- Vanderbilt SSO ensures verified community members
- Profile completion requirements
- Email/phone verification

### Content Moderation
- Report inappropriate content
- Block users
- Admin review queue
- Automated flagging of suspicious activity
- Community guidelines

### Transaction Safety
- Meeting in public places encouraged
- Safety tips on platform
- Emergency contact information
- Option to bring a friend
- Time-limited offers/requests

---

## Notification System

### Notification Types
1. New message received
2. Your offer matched with request
3. Someone interested in your request
4. Transaction confirmed
5. Item marked as fulfilled
6. Request/offer expiring soon
7. Request/offer cancelled

### Notification Channels
- In-app notifications
- Email notifications
- SMS (optional, post-MVP)
- Push notifications (mobile app)

### Notification Preferences
- User can customize which notifications to receive
- Quiet hours
- Notification frequency (immediate, digest)

---

## Analytics & Insights

### For Users
- Impact dashboard (items given/received)
- Transaction history
- Community contribution score

### For Admins
- Active users count
- Most requested resources
- Geographic heat maps
- Response times
- Fulfillment rates
- User engagement metrics
- Crisis activity timeline

---

## Future Enhancements

### Gamification
- Badges for helping others
- Leaderboard for most helpful
- Verified helper status
- Community recognition

### Advanced Matching
- AI-powered matching algorithm
- Automatic suggestions
- Route optimization for deliveries
- Batch matching for efficiency

### Integrations
- Calendar integration for scheduling
- Payment processing (for non-free items)
- Social media sharing
- University emergency alert system
- Campus transportation integration

### Expansion
- Multi-university network
- City-wide implementation
- Integration with official emergency response
- Partner with local organizations (Red Cross, food banks)

### Additional Features
- Recurring offers (weekly food donations)
- Group requests/offers
- Event coordination (shelter opening)
- Resource forecasting
- Skill-based volunteering (not just items)
- Language translation support
- Accessibility features for disabilities

---

## Technical Challenges to Consider

### Real-Time Updates
- Keep offer/request availability current
- Prevent overselling resources
- Synchronize across multiple users

### Search Performance
- Fast search with multiple filters
- Geospatial queries for location
- Caching strategies
- Database indexing

### Data Consistency
- Transaction isolation
- Race condition handling
- Eventual consistency vs strong consistency

### Security
- Prevent SQL injection
- XSS protection
- CSRF tokens
- Rate limiting
- Input validation
- Secure messaging

### Scalability
- Handle spike during emergencies
- Database scaling strategy
- Caching layer
- Async processing for heavy operations

---

## Testing Strategy

### Unit Tests
- Individual functions and components
- Database operations
- Business logic

### Integration Tests
- API endpoints
- SSO authentication flow
- Database transactions
- Messaging system

### End-to-End Tests
- Complete user flows
- Cross-browser compatibility
- Mobile responsiveness

### User Testing
- Usability testing with Vanderbilt students
- Accessibility testing
- Load testing
- Security testing

---

## Deployment & DevOps

### Hosting
- Cloud provider (AWS, Google Cloud, Azure)
- Containerization (Docker)
- Orchestration (Kubernetes) for scale

### CI/CD
- Automated testing
- Continuous deployment
- Version control (Git)
- Code review process

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Server health checks
- Database monitoring

### Backup & Recovery
- Regular database backups
- Disaster recovery plan
- Data retention policy

---

## Success Metrics

### User Adoption
- Number of registered users
- Active daily/weekly users
- User retention rate

### Engagement
- Requests created
- Offers created
- Messages sent
- Search queries
- Time spent on platform

### Impact
- Successful transactions
- Items/services provided
- People helped
- Response time
- Fulfillment rate

### Quality
- User satisfaction rating
- Platform reliability (uptime)
- Bug/error rate
- Support ticket volume

---

## Timeline (2-Day Hackathon)

### Day 1 Morning
- Setup development environment
- Design database schema
- Setup authentication with Vanderbilt SSO
- Create basic UI mockups

### Day 1 Afternoon
- Implement user registration/profile
- Build request creation form
- Build offer creation form
- Setup database and API endpoints

### Day 1 Evening
- Implement search functionality
- Build results display
- Basic filtering

### Day 2 Morning
- Implement messaging system
- Build dashboard
- Fulfillment mechanism
- Testing and bug fixes

### Day 2 Afternoon
- Polish UI/UX
- Final testing
- Prepare demo
- Documentation

---

## Conclusion

This platform addresses a real need demonstrated during the Nashville ice storm. By creating a centralized, trusted platform for the Vanderbilt community, we can ensure that during future crises, those who need help can quickly find it, and those who want to help can easily offer their resources. The key to success is balancing simplicity (for quick adoption during emergencies) with robust functionality (to handle complex matching and transaction scenarios).
