# Notifications

## Two Types
1. **Authority Email** — SendGrid email to VUPD/Metro when a blockage is reported
2. **In-App Notifications** — alerts stored in DB and shown to users (if time permits)

---

## Authority Email (P2 — Do After Blockage Backend)

### Dependencies
- SendGrid API key (`SENDGRID_API_KEY`)
- `@sendgrid/mail` package installed in backend
- Sender email must be verified in SendGrid dashboard

### Install
```
npm install @sendgrid/mail
```
in the `backend/` directory.

### Service — `backend/services/emailService.js`
- [ ] Init SendGrid: `sgMail.setApiKey(process.env.SENDGRID_API_KEY)`
- [ ] `sendBlockageNotification(blockage)`
  - To: `process.env.AUTHORITY_EMAIL`
  - From: verified sender email set up in SendGrid
  - Subject: `⚠️ Blockage Reported: [blockage_type]`
  - Plain text body: type, severity, address, coordinates, description, reporter ID, timestamp
  - HTML body: formatted table + "View on Map" button link
  - Return `true` on success, `false` on failure (log error but don't crash)

### Integration Points
- [ ] Called from `POST /api/blockages` when `notify_authorities: true`
- [ ] Called from `POST /api/blockages/:id/notify` endpoint
- [ ] On success: set `authority_notified = true` and `notified_at = NOW()` in DB

### Test Checklist
- [ ] Send test email to your own address first before using authority email
- [ ] Verify sender email in SendGrid dashboard or emails will be rejected
- [ ] Email delivers with correct blockage details
- [ ] `authority_notified` flag updates in DB after send
- [ ] Failed send does not crash the blockage creation request

---

## In-App Notifications (P3 — If Time Permits)

### Dependencies
- `users` table, `blockages` table, `weather_alerts` table must exist
- Dev1's auth middleware

### Model — `backend/models/Notification.js`
Fields: `notification_id`, `user_id` (FK → users), `notification_type` (`weather_alert` | `blockage_nearby` | `route_warning`), `title`, `message`, `related_id`, `is_read`, `is_dismissed`, `created_at`

### When to Create Notifications
- [ ] New severe/extreme weather alert detected by poller → create notification for all users
- [ ] New blockage reported → create notifications for users within a set radius (e.g. 2km)

### Routes — (add to existing notification handling or new file)
- [ ] `GET /api/notifications` (protected)
  - Query params: `is_read` (boolean), `notification_type`
  - Return notifications for the logged-in user
- [ ] `PUT /api/notifications/:id/read` (protected)
  - Set `is_read = true`

### Frontend Integration (coordinate with Dev1)
- [ ] Surface unread notification count in Dev1's `Navbar.jsx`
  - Poll `GET /api/notifications?is_read=false` every 30–60 seconds, or on page focus
- [ ] Notification dot/badge on nav icon when unread count > 0
- [ ] Clicking opens a dropdown or notification list page

### Test Checklist
- [ ] Weather alert creation triggers notifications for users
- [ ] Nearby blockage triggers notifications only for users within radius
- [ ] `GET /api/notifications` returns only the logged-in user's notifications
- [ ] Marking as read updates `is_read` and removes badge
