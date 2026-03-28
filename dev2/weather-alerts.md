# Weather Alerts

## Dependencies
- No external API key needed (weather.gov is free)
- `node-cron` package in backend
- `axios` package in backend

## Backend

### Model — `backend/models/WeatherAlert.js`
Fields: `alert_id`, `external_id` (unique, from weather.gov), `event_type`, `severity`, `certainty`, `urgency`, `headline`, `description`, `instructions`, `area_affected`, `effective_time`, `expires_time`, `is_active`, `created_at`

### Service — `backend/services/weatherAlertService.js`
- [ ] `fetchActiveAlerts()`
  - GET `https://api.weather.gov/alerts/active?area=TN`
  - Filter features where `areaDesc` includes `'Davidson'`
  - For each alert: insert if `external_id` not already in DB
  - After insert: deactivate any alerts where `expires_time` < now
- [ ] `getActiveSevereAlerts()`
  - Return alerts where `is_active = true` and severity in `['severe', 'extreme']`

### Job — `backend/jobs/weatherPoller.js`
- [ ] Schedule with node-cron: `'*/15 * * * *'` (every 15 min)
- [ ] Also call `fetchActiveAlerts()` once immediately on startup
- [ ] Export `startWeatherPolling()`
- [ ] Call `startWeatherPolling()` from `server.js` after DB connects

### Routes — `backend/routes/weather.js`
- [ ] `GET /api/weather/alerts` — query param `is_active` (boolean), return alert list
- [ ] `GET /api/weather/alerts/:id` — return single alert + affected user count
- [ ] Mount in `server.js`: `app.use('/api/weather', weatherRouter)` (coordinate with Dev1)

---

## Frontend

### Component — `frontend/components/crisis/WeatherAlertBanner.jsx`
- [ ] On mount: fetch `GET /api/weather/alerts?is_active=true`
- [ ] Only render if any alert has severity `severe` or `extreme`
- [ ] Red background (`bg-red-600`), white text
- [ ] Shows: `⚠️ [event_type]: [headline]`
- [ ] Expand/collapse to show full `description` and `instructions`
- [ ] Dismiss button — hide for session (reappears on refresh if still active)
- [ ] Mobile: collapsed single line by default, tap to expand

### Service — `frontend/services/weatherService.js`
- [ ] `getActiveAlerts()` — GET `/api/weather/alerts?is_active=true`
- [ ] `getAlertById(id)` — GET `/api/weather/alerts/:id`

### Integration
- [ ] Import `WeatherAlertBanner` into `frontend/components/shared/Layout.jsx` (coordinate with Dev1)
- [ ] Place banner above all page content

---

## Test Checklist
- [ ] Weather alerts fetch from weather.gov without errors
- [ ] Davidson County filter works (or falls back to all TN when no Davidson alerts)
- [ ] Duplicate alerts are not inserted on repeat polls
- [ ] Expired alerts are deactivated
- [ ] Poller runs every 15 minutes (check server logs)
- [ ] Banner renders when severe/extreme alert exists
- [ ] Banner does not render when no active severe alerts
- [ ] Dismiss hides banner for the session
