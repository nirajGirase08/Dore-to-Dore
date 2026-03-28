# Blockage Reporting

## Dependencies
- Mapbox API key for geocoding (`MAPBOX_ACCESS_TOKEN`)
- Dev1's auth middleware (`backend/middleware/authMiddleware.js`)
- `users` table must exist before running blockage migrations

## Backend

### Model — `backend/models/Blockage.js`
Fields: `blockage_id`, `reported_by` (FK → users), `blockage_type`, `severity`, `location_lat`, `location_lng`, `location_address`, `description`, `photo_url`, `status`, `authority_notified`, `notified_at`, `created_at`, `updated_at`, `expires_at`

### Service — `backend/services/geocodingService.js`
- [ ] `geocodeAddress(address)`
  - Append `', Nashville, TN'` to query for better accuracy
  - GET Mapbox Geocoding API
  - Return `{ lat, lng, formatted_address }` or `null`
- [ ] `reverseGeocode(lat, lng)`
  - GET Mapbox Geocoding API with `lng,lat`
  - Return address string or `null`

### Routes — `backend/routes/blockages.js`
- [ ] `POST /api/blockages` (protected)
  - Accept `{ blockage_type, severity, description, location_address?, location_lat?, location_lng?, notify_authorities }`
  - If `location_address` given and no lat/lng: geocode it first
  - If `notify_authorities` is true: call `sendBlockageNotification()` and set `authority_notified = true`
  - Return `{ blockage, authority_notified }`
- [ ] `GET /api/blockages`
  - Query params: `lat`, `lng`, `radius` (km), `status`, `blockage_type`, `severity`
  - Return blockage list with reporter's `name` and `user_id`
- [ ] `GET /api/blockages/:id`
  - Return blockage + reporter info + validations array
- [ ] `PUT /api/blockages/:id` (protected, creator only)
  - Accept `{ status, description }`
- [ ] `DELETE /api/blockages/:id` (protected, creator or admin)
- [ ] `POST /api/blockages/:id/notify` (protected)
  - Trigger `sendBlockageNotification()` if not already notified
  - Update `authority_notified = true`, set `notified_at`
- [ ] Mount in `server.js`: `app.use('/api/blockages', blockagesRouter)` (coordinate with Dev1)

---

## Frontend

### Component — `frontend/components/crisis/BlockageReport.jsx`
- [ ] Location input:
  - "Use Current Location" button (browser geolocation API)
  - OR text input for address
- [ ] Blockage type dropdown: `tree_down`, `flooding`, `ice`, `power_line`, `debris`, `road_closure`, `other`
- [ ] Severity button group: Low / Medium / High / Critical
- [ ] Description textarea
- [ ] "Notify Authorities" checkbox — checked by default
- [ ] Submit button (full width, large, touch-friendly)
- [ ] On success: show confirmation + "View on Map" link

### Component — `frontend/components/crisis/BlockageCard.jsx`
- [ ] Show: blockage type icon, severity badge (color-coded), location address, time ago
- [ ] Show `✓ Authorities Notified` badge if `authority_notified = true`
- [ ] "View on Map" button
- [ ] If current user is the reporter: show "Mark Resolved" button
  - Calls `PUT /api/blockages/:id` with `{ status: 'resolved' }`

### Component — `frontend/components/crisis/BlockageList.jsx`
- [ ] Fetch `GET /api/blockages` on mount
- [ ] Render list of `BlockageCard` components
- [ ] Filter controls: by type, severity, status

### Page — `frontend/pages/ReportBlockage.jsx`
- [ ] Render `BlockageReport` form
- [ ] On submit success: redirect or show `BlockageList`

### Service — `frontend/services/blockageService.js` (or add to existing service file)
- [ ] `createBlockage(data)` — POST `/api/blockages`
- [ ] `getBlockages(params)` — GET `/api/blockages`
- [ ] `getBlockageById(id)` — GET `/api/blockages/:id`
- [ ] `updateBlockage(id, data)` — PUT `/api/blockages/:id`
- [ ] `notifyAuthorities(id)` — POST `/api/blockages/:id/notify`

### Routing
- [ ] Add `/report-blockage` to `App.jsx` (coordinate with Dev1)

---

## Test Checklist
- [ ] Create blockage with address → geocodes correctly to lat/lng
- [ ] Create blockage with lat/lng directly → skips geocoding
- [ ] `notify_authorities: true` on create → email sent, `authority_notified` set
- [ ] `GET /api/blockages` with `lat/lng/radius` filters returns correct results
- [ ] Only creator can update or delete their blockage
- [ ] "Use Current Location" works on mobile (requires HTTPS or localhost)
- [ ] BlockageCard shows "Authorities Notified" badge correctly
- [ ] "Mark Resolved" updates status and re-renders card
