# Crisis Connect - Developer 2 Plan
## Crisis Features & Map Integration

---

## Your Responsibilities

You are responsible for building the **crisis-specific features** that differentiate this platform from a simple marketplace - weather alerts, blockage reporting, map visualization, routing, and authority notifications.

### Your Feature Set:
1. ✅ Weather Alert Integration (weather.gov API)
2. ✅ Blockage Reporting System
3. ✅ Interactive Map Visualization (Mapbox)
4. ✅ Route Display with Blockage Overlay
5. ✅ Authority Notification System (SendGrid Email)
6. ✅ Real-Time Alert Banner

### Developer 1's Feature Set (for context):
- User Authentication & Profiles
- Request/Offer CRUD
- Search & Filtering
- Smart Matching Algorithm
- Messaging System
- Dashboard

---

## Merge Conflict Prevention Strategy

### Your Files (You Own These):
```
backend/
├── models/
│   ├── Blockage.js
│   ├── WeatherAlert.js
│   └── Notification.js
├── routes/
│   ├── blockages.js
│   ├── weather.js
│   └── routes.js
├── services/
│   ├── weatherAlertService.js
│   ├── geocodingService.js
│   ├── emailService.js
│   └── routeService.js
└── jobs/
    └── weatherPoller.js

frontend/
├── components/
│   ├── crisis/
│   │   ├── BlockageReport.jsx
│   │   ├── BlockageCard.jsx
│   │   ├── BlockageList.jsx
│   │   └── WeatherAlertBanner.jsx
│   ├── map/
│   │   ├── MapView.jsx
│   │   ├── MapMarker.jsx
│   │   ├── RouteDisplay.jsx
│   │   └── BlockageLayer.jsx
│   └── routes/
│       ├── RouteCalculator.jsx
│       └── RouteSafety.jsx
├── pages/
│   ├── Map.jsx
│   ├── ReportBlockage.jsx
│   └── Routes.jsx
└── services/
    ├── mapService.js
    └── weatherService.js
```

### Shared Files (Coordinate Before Editing):
```
backend/
└── server.js (coordinate on route mounting)

frontend/
├── App.jsx (routing setup - coordinate)
└── index.css (basic styles - coordinate)

database/
└── schema.sql (coordinate on table creation)
```

### Files You Should NOT Touch:
- Anything in `backend/routes/auth.js`
- Anything in `backend/routes/requests.js`
- Anything in `backend/routes/offers.js`
- Anything in `backend/services/matchingAlgorithm.js`
- Anything in `frontend/components/marketplace/`
- Anything in `frontend/components/messaging/`
- Anything in `frontend/components/dashboard/`

---

## Technical Stack

### Backend:
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL
- **Job Scheduler**: node-cron (for weather polling)

### Frontend:
- **Framework**: React with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS (mobile-first)
- **HTTP Client**: Axios

### External APIs You'll Use:
1. **Weather.gov API** (FREE, no key needed)
   - https://api.weather.gov/alerts/active?area=TN
   - Provides weather alerts for Tennessee/Davidson County

2. **Mapbox** (FREE tier: 100k requests/month)
   - Sign up: https://www.mapbox.com
   - Get API key (free)
   - Services:
     - Mapbox GL JS (map display)
     - Geocoding API (address → lat/lng)
     - Directions API (route calculation)

3. **SendGrid** (FREE tier: 100 emails/day)
   - Sign up: https://sendgrid.com
   - Get API key (free)
   - Send emails to authorities

---

## API Keys Setup

### Step 1: Get Mapbox API Key
1. Go to https://www.mapbox.com
2. Sign up (free)
3. Create new access token
4. Copy token (starts with `pk.`)

### Step 2: Get SendGrid API Key
1. Go to https://sendgrid.com
2. Sign up (free)
3. Navigate to Settings → API Keys
4. Create new API key with "Mail Send" permission
5. Copy key (starts with `SG.`)

### Step 3: Create .env File
```bash
# In backend/.env
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
SENDGRID_API_KEY=your_sendgrid_key_here
AUTHORITY_EMAIL=vupdreports@vanderbilt.edu
```

---

## Database Schema (Your Tables)

### Blockages Table
```sql
CREATE TABLE blockages (
    blockage_id SERIAL PRIMARY KEY,
    reported_by INT REFERENCES users(user_id),
    blockage_type VARCHAR(50) NOT NULL, -- tree_down, flooding, ice, power_line, debris, road_closure, other
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_address TEXT,
    description TEXT,
    photo_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, expired
    authority_notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_blockages_location ON blockages(location_lat, location_lng);
CREATE INDEX idx_blockages_status ON blockages(status);
CREATE INDEX idx_blockages_type ON blockages(blockage_type);
```

### Weather_Alerts Table
```sql
CREATE TABLE weather_alerts (
    alert_id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE, -- ID from weather.gov
    event_type VARCHAR(100) NOT NULL, -- Ice Storm, Flood Warning, etc.
    severity VARCHAR(20) NOT NULL, -- minor, moderate, severe, extreme
    certainty VARCHAR(20), -- possible, likely, observed
    urgency VARCHAR(20), -- immediate, expected, future
    headline TEXT,
    description TEXT,
    instructions TEXT,
    area_affected TEXT,
    effective_time TIMESTAMP,
    expires_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weather_alerts_active ON weather_alerts(is_active);
CREATE INDEX idx_weather_alerts_severity ON weather_alerts(severity);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- weather_alert, blockage_nearby, route_warning
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_id INT, -- blockage_id or alert_id
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

### Blockage_Validations Table (for route validation feature)
```sql
CREATE TABLE blockage_validations (
    validation_id SERIAL PRIMARY KEY,
    blockage_id INT REFERENCES blockages(blockage_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id),
    is_still_blocked BOOLEAN NOT NULL,
    comment TEXT,
    validated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_validations_blockage ON blockage_validations(blockage_id);
```

---

## Day 1 Timeline (8 hours)

### Hour 1-2: Setup & Weather Integration
- [ ] Get Mapbox and SendGrid API keys
- [ ] Create .env file with keys
- [ ] Create Blockage, WeatherAlert, Notification models
- [ ] Setup node-cron for job scheduling
- [ ] Implement weatherAlertService.js:
  - Fetch from weather.gov API
  - Parse alerts for Davidson County
  - Store in database
- [ ] Create weather polling job (every 15 minutes)
- [ ] Test weather alert fetching

### Hour 3-4: Weather Alert System
- [ ] Create weather routes:
  - `GET /api/weather/alerts` - Get active alerts
  - `GET /api/weather/alerts/:id` - Get alert details
- [ ] Build WeatherAlertBanner component
  - Shows when severe alert active
  - Dismissible but persistent
  - Mobile-friendly design
- [ ] Integrate banner into main layout
- [ ] Create notifications when new alert detected
- [ ] Test alert display flow

### Hour 5-6: Blockage Reporting Backend
- [ ] Create blockages routes:
  - `POST /api/blockages` - Report new blockage
  - `GET /api/blockages` - Get all blockages (with filters)
  - `GET /api/blockages/:id` - Get single blockage
  - `PUT /api/blockages/:id` - Update blockage status
  - `DELETE /api/blockages/:id` - Delete blockage
- [ ] Implement geocodingService.js:
  - Address → lat/lng using Mapbox
  - Reverse geocoding (lat/lng → address)
- [ ] Test blockage creation with geocoding

### Hour 7-8: Blockage Reporting Frontend
- [ ] Build BlockageReport component (form):
  - Location input (address or current location)
  - Blockage type dropdown
  - Severity selector
  - Description textarea
  - "Notify Authorities" checkbox
  - Submit button (mobile-friendly)
- [ ] Build BlockageCard component
- [ ] Build BlockageList component
- [ ] Create /report-blockage page
- [ ] Test blockage reporting flow

---

## Day 2 Timeline (8 hours)

### Hour 1-3: Map Integration
- [ ] Install mapbox-gl and react-map-gl
- [ ] Build MapView component:
  - Initialize Mapbox map
  - User location marker
  - Zoom controls
  - Mobile-optimized controls
- [ ] Build MapMarker component:
  - Different icons for offers, requests, blockages
  - Click to show details popup
- [ ] Build BlockageLayer component:
  - Display all blockages as red markers
  - Cluster markers when zoomed out
  - Color-coded by severity
- [ ] Fetch and display:
  - Offers from Dev 1's API
  - Requests from Dev 1's API
  - Blockages from your API
- [ ] Create /map page
- [ ] Test map display with markers

### Hour 4-5: Authority Notification System
- [ ] Implement emailService.js using SendGrid:
  - Template for blockage report email
  - Send to hardcoded authority email
- [ ] Add authority notification logic to blockage creation
- [ ] Create endpoint `POST /api/blockages/:id/notify`
- [ ] Update BlockageCard to show "✓ Authorities Notified" badge
- [ ] Test email sending (use your own email for testing)

### Hour 6-7: Route Display System
- [ ] Create routeService.js:
  - Calculate route using Mapbox Directions API
  - Check route against blockages (within 100m buffer)
  - Return route with blockage warnings
- [ ] Create routes endpoints:
  - `POST /api/routes/calculate` - Calculate route
    - Input: { origin_lat, origin_lng, dest_lat, dest_lng }
    - Output: { route_geometry, distance, duration, blockages_on_route: [...] }
- [ ] Build RouteCalculator component:
  - Origin input (address or current location)
  - Destination input
  - "Calculate Route" button
  - Display route on map
  - Show blockage warnings
- [ ] Build RouteSafety component:
  - List blockages on route
  - Show warning count
  - Safety recommendations
- [ ] Create /routes page
- [ ] Test route calculation

### Hour 7-8: Integration & Polish
- [ ] Integrate weather banner with Dev 1's layout
- [ ] Add blockage notifications to Dev 1's notification system
- [ ] Mobile responsiveness review:
  - Test map on mobile viewport
  - Test forms on mobile
  - Ensure touch-friendly controls
- [ ] Create notification system:
  - When blockage reported near user → notify
  - When weather alert active → notify all users
- [ ] Bug fixes and testing
- [ ] Coordinate with Dev 1 on final integration

---

## API Endpoints Specification

### Weather Alerts
```javascript
// GET /api/weather/alerts
Query params: { is_active: boolean }
Response: [{
  alert_id, event_type, severity, headline,
  description, instructions, effective_time, expires_time
}]

// GET /api/weather/alerts/:id
Response: {
  alert: {...},
  affected_users_count: number
}
```

### Blockages
```javascript
// POST /api/blockages (protected)
Request: {
  blockage_type: string,
  severity: string,
  location_address: string, // OR lat/lng
  location_lat?: number,
  location_lng?: number,
  description: string,
  notify_authorities: boolean
}
Response: {
  blockage: {...},
  authority_notified: boolean
}

// GET /api/blockages
Query params: {
  lat?: number,
  lng?: number,
  radius?: number (km),
  status?: 'active' | 'resolved',
  blockage_type?: string,
  severity?: string
}
Response: [{
  blockage_id, blockage_type, severity,
  location_lat, location_lng, location_address,
  description, status, authority_notified,
  created_at, reported_by: { name, user_id }
}]

// GET /api/blockages/:id
Response: {
  blockage: {...},
  reported_by: {...},
  validations: [...]
}

// PUT /api/blockages/:id (protected, only creator)
Request: { status: 'resolved' | 'active', description: string }
Response: { blockage: {...} }

// DELETE /api/blockages/:id (protected, only creator or admin)
Response: { message: "Deleted" }

// POST /api/blockages/:id/notify (protected)
Response: { success: boolean, message: string }
```

### Routes
```javascript
// POST /api/routes/calculate
Request: {
  origin_lat: number,
  origin_lng: number,
  dest_lat: number,
  dest_lng: number,
  avoid_blockages?: boolean (default true)
}
Response: {
  route: {
    geometry: {...}, // GeoJSON
    distance_km: number,
    duration_minutes: number
  },
  blockages_on_route: [{
    blockage: {...},
    distance_from_route_m: number
  }],
  warning_count: number,
  safety_level: 'safe' | 'caution' | 'dangerous'
}
```

### Notifications
```javascript
// GET /api/notifications (protected)
Query params: { is_read: boolean, notification_type: string }
Response: [{
  notification_id, notification_type, title,
  message, is_read, created_at, related_id
}]

// PUT /api/notifications/:id/read (protected)
Response: { notification: {...} }
```

---

## Service Implementation Details

### weatherAlertService.js
```javascript
const axios = require('axios');
const WeatherAlert = require('../models/WeatherAlert');

const WEATHER_API_URL = 'https://api.weather.gov/alerts/active';

const fetchActiveAlerts = async () => {
  try {
    // Fetch alerts for Tennessee
    const response = await axios.get(`${WEATHER_API_URL}?area=TN`);
    const features = response.data.features || [];

    // Filter for Davidson County (Nashville/Vanderbilt area)
    const davidsonAlerts = features.filter(feature => {
      const areaDesc = feature.properties.areaDesc || '';
      return areaDesc.includes('Davidson');
    });

    // Process and store alerts
    for (const feature of davidsonAlerts) {
      const props = feature.properties;

      // Check if alert already exists
      const existing = await WeatherAlert.findOne({
        where: { external_id: props.id }
      });

      if (!existing) {
        // Create new alert
        await WeatherAlert.create({
          external_id: props.id,
          event_type: props.event,
          severity: props.severity.toLowerCase(),
          certainty: props.certainty.toLowerCase(),
          urgency: props.urgency.toLowerCase(),
          headline: props.headline,
          description: props.description,
          instructions: props.instruction,
          area_affected: props.areaDesc,
          effective_time: new Date(props.effective),
          expires_time: new Date(props.expires),
          is_active: true
        });

        // TODO: Trigger notifications to users
        console.log(`New weather alert: ${props.event}`);
      }
    }

    // Deactivate expired alerts
    await WeatherAlert.update(
      { is_active: false },
      {
        where: {
          expires_time: { $lt: new Date() },
          is_active: true
        }
      }
    );

  } catch (error) {
    console.error('Error fetching weather alerts:', error.message);
  }
};

const getActiveSevereAlerts = async () => {
  return await WeatherAlert.findAll({
    where: {
      is_active: true,
      severity: ['severe', 'extreme']
    },
    order: [['effective_time', 'DESC']]
  });
};

module.exports = {
  fetchActiveAlerts,
  getActiveSevereAlerts
};
```

### geocodingService.js
```javascript
const axios = require('axios');

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const GEOCODING_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

const geocodeAddress = async (address) => {
  try {
    // Add "Nashville, TN" to improve accuracy
    const query = `${address}, Nashville, TN`;
    const url = `${GEOCODING_BASE}/${encodeURIComponent(query)}.json`;

    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        limit: 1
      }
    });

    if (response.data.features.length > 0) {
      const feature = response.data.features[0];
      return {
        lat: feature.center[1],
        lng: feature.center[0],
        formatted_address: feature.place_name
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};

const reverseGeocode = async (lat, lng) => {
  try {
    const url = `${GEOCODING_BASE}/${lng},${lat}.json`;

    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        limit: 1
      }
    });

    if (response.data.features.length > 0) {
      return response.data.features[0].place_name;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode
};
```

### emailService.js
```javascript
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendBlockageNotification = async (blockage) => {
  const msg = {
    to: process.env.AUTHORITY_EMAIL, // VUPD or Metro Nashville
    from: 'crisisconnect@vanderbilt.edu', // Must be verified in SendGrid
    subject: `⚠️ Blockage Reported: ${blockage.blockage_type}`,
    text: `
Blockage Report from Crisis Connect Platform

TYPE: ${blockage.blockage_type.replace('_', ' ').toUpperCase()}
SEVERITY: ${blockage.severity.toUpperCase()}
LOCATION: ${blockage.location_address}
COORDINATES: ${blockage.location_lat}, ${blockage.location_lng}

DESCRIPTION:
${blockage.description}

REPORTED: ${blockage.created_at}
REPORTER ID: ${blockage.reported_by}

View on map: https://crisisconnect.vanderbilt.edu/map?blockage=${blockage.blockage_id}

---
This is an automated report from the Crisis Connect platform.
For questions, contact crisisconnect-support@vanderbilt.edu
    `,
    html: `
<h2>⚠️ Blockage Report from Crisis Connect</h2>
<table style="border-collapse: collapse; width: 100%;">
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${blockage.blockage_type.replace('_', ' ')}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Severity:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${blockage.severity}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${blockage.location_address}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Coordinates:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${blockage.location_lat}, ${blockage.location_lng}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Reported:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${blockage.created_at}</td></tr>
</table>

<h3>Description:</h3>
<p>${blockage.description}</p>

<p><a href="https://crisisconnect.vanderbilt.edu/map?blockage=${blockage.blockage_id}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View on Map</a></p>

<hr>
<p style="color: #666; font-size: 12px;">This is an automated report from the Crisis Connect platform.</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Authority notification sent');
    return true;
  } catch (error) {
    console.error('SendGrid error:', error.message);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

module.exports = {
  sendBlockageNotification
};
```

### routeService.js
```javascript
const axios = require('axios');

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/driving';

const calculateDistance = (lat1, lng1, lat2, lng2) => {
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

const calculateRoute = async (originLat, originLng, destLat, destLng, blockages = []) => {
  try {
    const coordinates = `${originLng},${originLat};${destLng},${destLat}`;
    const url = `${DIRECTIONS_BASE}/${coordinates}`;

    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        geometries: 'geojson',
        overview: 'full',
        steps: true
      }
    });

    if (response.data.routes.length === 0) {
      return null;
    }

    const route = response.data.routes[0];

    // Check for blockages along route
    const blockagesOnRoute = [];
    for (const blockage of blockages) {
      // Check if blockage is close to route path
      // Simplified: check distance from start/end
      const distFromOrigin = calculateDistance(originLat, originLng, blockage.location_lat, blockage.location_lng);
      const distFromDest = calculateDistance(destLat, destLng, blockage.location_lat, blockage.location_lng);

      // If blockage is somewhat close to either point, include it
      // In production, would check distance to actual route geometry
      if (distFromOrigin < 5 || distFromDest < 5) {
        blockagesOnRoute.push({
          ...blockage,
          distance_from_origin_km: distFromOrigin
        });
      }
    }

    // Determine safety level
    let safetyLevel = 'safe';
    const criticalBlockages = blockagesOnRoute.filter(b => b.severity === 'critical' || b.severity === 'high');
    if (criticalBlockages.length > 0) {
      safetyLevel = 'dangerous';
    } else if (blockagesOnRoute.length > 0) {
      safetyLevel = 'caution';
    }

    return {
      route: {
        geometry: route.geometry,
        distance_km: route.distance / 1000,
        duration_minutes: route.duration / 60
      },
      blockages_on_route: blockagesOnRoute,
      warning_count: blockagesOnRoute.length,
      safety_level: safetyLevel
    };

  } catch (error) {
    console.error('Route calculation error:', error.message);
    return null;
  }
};

module.exports = {
  calculateRoute
};
```

---

## Frontend Components Specification

### WeatherAlertBanner.jsx
```jsx
// Persistent banner at top of app
// - Only shows when severe/extreme alert active
// - Red background (#DC2626)
// - Shows: ⚠️ [Event Type]: [Headline]
// - Expandable to show full description
// - "Dismiss" button (but reappears on refresh if still active)
// - Mobile: collapsible to single line
```

### BlockageReport.jsx
```jsx
// Mobile-friendly form:
// - Location input:
//   - "Use Current Location" button
//   - OR address text input (with autocomplete suggestion)
// - Blockage type dropdown:
//   - Tree Down, Flooding, Ice, Power Line, Debris, Road Closure, Other
// - Severity selector (buttons):
//   - Low, Medium, High, Critical
// - Description textarea
// - Photo upload (optional, future feature)
// - "Notify Authorities" checkbox (checked by default)
// - Large submit button
// - Success confirmation with link to view on map
```

### MapView.jsx
```jsx
// Mapbox GL JS integration:
// - Full-screen map
// - User's current location (blue dot)
// - Three layers:
//   1. Green markers: Active offers
//   2. Orange markers: Active requests
//   3. Red markers: Active blockages
// - Click marker → popup with details
// - Legend in corner
// - Filter controls:
//   - Toggle offers
//   - Toggle requests
//   - Toggle blockages
// - Mobile: bottom drawer with marker details
// - Zoom to fit all markers on load
```

### BlockageCard.jsx
```jsx
// Display blockage info:
// - Blockage type icon
// - Severity badge (color-coded)
// - Location address
// - Description (truncated)
// - Time ago (e.g., "2 hours ago")
// - "✓ Authorities Notified" badge if applicable
// - "View on Map" button
// - If user's blockage: "Mark Resolved" button
```

### RouteCalculator.jsx
```jsx
// Two-input form:
// - Origin: address input or "Current Location"
// - Destination: address input or select from offers/requests
// - "Calculate Safest Route" button
// - Shows loading spinner during calculation
// - Results:
//   - Map with route drawn (blue line)
//   - Blockages shown as red markers along route
//   - Distance and estimated time
//   - Warning panel if blockages detected
//   - Safety level indicator
// - Mobile: scrollable results below map
```

### RouteSafety.jsx
```jsx
// Warning panel component:
// - Safety level badge:
//   - Green "SAFE" - no blockages
//   - Yellow "CAUTION" - minor blockages
//   - Red "DANGEROUS" - critical blockages
// - List of blockages on route:
//   - Type, severity, distance from origin
//   - "Avoid this area" recommendation
// - Alternative route suggestion (future)
// - "Report New Blockage" quick link
```

---

## Map Integration Setup

### Install Dependencies
```bash
npm install mapbox-gl react-map-gl
```

### MapView Implementation Example
```jsx
import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MapView = () => {
  const [viewState, setViewState] = useState({
    longitude: -86.8025,
    latitude: 36.1447, // Vanderbilt coordinates
    zoom: 13
  });

  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [blockages, setBlockages] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    // Fetch data from APIs
    fetchOffers();
    fetchRequests();
    fetchBlockages();
  }, []);

  return (
    <div className="w-full h-screen">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      >
        {/* Offer markers */}
        {offers.map(offer => (
          <Marker
            key={`offer-${offer.offer_id}`}
            longitude={offer.location_lng}
            latitude={offer.location_lat}
            color="#22C55E"
            onClick={() => setSelectedMarker({ type: 'offer', data: offer })}
          />
        ))}

        {/* Blockage markers */}
        {blockages.map(blockage => (
          <Marker
            key={`blockage-${blockage.blockage_id}`}
            longitude={blockage.location_lng}
            latitude={blockage.location_lat}
            color="#DC2626"
            onClick={() => setSelectedMarker({ type: 'blockage', data: blockage })}
          />
        ))}

        {/* Popup */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker.data.location_lng}
            latitude={selectedMarker.data.location_lat}
            onClose={() => setSelectedMarker(null)}
          >
            <div className="p-2">
              <h3 className="font-bold">{selectedMarker.data.title}</h3>
              <p className="text-sm">{selectedMarker.data.description}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapView;
```

---

## Mobile Responsiveness Guidelines

### Map Optimizations:
```jsx
// Mobile-specific map controls
<Map
  touchZoomRotate={true}
  touchPitch={false} // Disable 3D tilt on mobile
  dragPan={true}
  scrollZoom={false} // Prevent accidental zoom while scrolling
  doubleClickZoom={true}
/>

// Bottom sheet for mobile marker details
<div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-4 md:hidden">
  {selectedMarker && <MarkerDetails marker={selectedMarker} />}
</div>
```

### Touch-Friendly Forms:
```jsx
// Large tap targets
<button className="w-full py-4 text-lg font-semibold bg-red-600 text-white rounded-lg">
  Report Blockage
</button>

// Grouped radio buttons for severity
<div className="flex gap-2">
  {['Low', 'Medium', 'High', 'Critical'].map(level => (
    <button
      key={level}
      className="flex-1 py-3 rounded-lg border-2"
      onClick={() => setSeverity(level.toLowerCase())}
    >
      {level}
    </button>
  ))}
</div>
```

---

## Job Scheduler Setup

### weatherPoller.js
```javascript
const cron = require('node-cron');
const { fetchActiveAlerts } = require('../services/weatherAlertService');

// Run every 15 minutes
const startWeatherPolling = () => {
  cron.schedule('*/15 * * * *', async () => {
    console.log('Polling weather alerts...');
    await fetchActiveAlerts();
  });

  // Also run immediately on startup
  fetchActiveAlerts();
};

module.exports = { startWeatherPolling };
```

### In server.js:
```javascript
const { startWeatherPolling } = require('./jobs/weatherPoller');

// After database connection
startWeatherPolling();
```

---

## Testing Checklist

### Backend Testing:
- [ ] Weather alerts fetch from API successfully
- [ ] Blockage creation with address geocodes correctly
- [ ] Blockage creation with lat/lng works
- [ ] SendGrid email sends successfully
- [ ] Route calculation returns valid geometry
- [ ] Blockages within radius are found
- [ ] Weather polling job runs every 15 minutes

### Frontend Testing:
- [ ] Map loads with Mapbox token
- [ ] Markers display at correct locations
- [ ] Marker popups show correct data
- [ ] Blockage form submits successfully
- [ ] Weather banner shows when alert active
- [ ] Route displays on map correctly
- [ ] Mobile: Map controls work on touch
- [ ] Mobile: Forms are easy to fill
- [ ] Mobile: Bottom drawer works for marker details

### Integration Testing:
- [ ] Create blockage → appears on map immediately
- [ ] Create blockage with notify → email sent
- [ ] Weather alert → banner shows to all users
- [ ] Calculate route → blockages shown along route
- [ ] Mobile end-to-end flow works

---

## Integration Points with Developer 1

### Data You Need from Dev 1:
1. **Auth middleware** - Use for protected routes
2. **User data** - For linking blockages to users
3. **Offer/Request locations** - For displaying on map

### Data You Provide to Dev 1:
1. **Blockage counts** - For dashboard "X blockages reported"
2. **Weather alerts** - For dashboard alert banner
3. **Map component** - Dev 1 can embed your MapView

### Coordination Points:
```javascript
// Dev 1's endpoints you'll call:
GET /api/offers - for map markers
GET /api/requests - for map markers
GET /api/users/:id - for blockage reporter info

// Your endpoints Dev 1 will call:
GET /api/blockages - for showing nearby blockages in search
GET /api/weather/alerts - for dashboard banner
```

### Integration Timeline:
- **Day 1 End**: Share API routes and data schemas
- **Day 2 Morning**: Dev 1 uses your auth middleware
- **Day 2 Afternoon**: Final integration - show blockages on Dev 1's search results

### Communication Protocol:
- Commit messages: Use `[DEV2]` prefix
- Create separate branches: `dev2-feature-name`
- Merge to `main` only after coordination
- Use comments in code: `// DEV1: Please call this endpoint`

---

## Environment Variables Summary

```bash
# backend/.env
MAPBOX_ACCESS_TOKEN=pk.ey...your_token
SENDGRID_API_KEY=SG.your_key
AUTHORITY_EMAIL=vupdreports@vanderbilt.edu
```

```bash
# frontend/.env
VITE_MAPBOX_TOKEN=pk.ey...your_token
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Final Deliverables

By end of Day 2, you should have:
1. ✅ Weather alert system polling and displaying
2. ✅ Blockage reporting with geocoding
3. ✅ Interactive map with all markers
4. ✅ Authority email notification system
5. ✅ Route calculation with blockage warnings
6. ✅ Mobile-responsive map and forms
7. ✅ All features tested and working

---

## Demo Script (Your Parts)

**1. Weather Alert** (45 seconds)
- Show banner at top: "⚠️ Ice Storm Warning for Davidson County"
- Click to expand details
- "Our system polls weather.gov every 15 minutes"

**2. Blockage Reporting** (90 seconds)
- "User sees tree down on 21st Ave"
- Fill form quickly (use "Current Location" button)
- Select "Tree Down", severity "High"
- Check "Notify Authorities"
- Submit
- Show success + "Authorities have been emailed"

**3. Map Visualization** (90 seconds) ⭐⭐⭐
- Switch to map view
- "Green = offers, Orange = requests, Red = blockages"
- Zoom to show all markers
- Click blockage → popup with details
- "This gives real-time community intelligence"

**4. Safe Route** (60 seconds)
- "Sarah needs to get to volunteer's location"
- Enter origin/destination
- Calculate route
- Show: "⚠️ CAUTION: 2 blockages on this route"
- Display blockages with warnings

Total: ~4.5 minutes (balanced with Dev 1's demo time)

---

## Common Issues & Solutions

**Issue**: Mapbox map not showing
- Solution: Check MAPBOX_TOKEN in .env and frontend .env
- Solution: Check browser console for token errors

**Issue**: Geocoding returns null
- Solution: Add "Nashville, TN" to address for better results
- Solution: Check Mapbox API quota (free tier limits)

**Issue**: SendGrid email not sending
- Solution: Verify sender email in SendGrid dashboard
- Solution: Check API key permissions (needs "Mail Send")
- Solution: For testing, send to your own email first

**Issue**: Weather alerts not fetching
- Solution: Check weather.gov API is accessible (no auth needed)
- Solution: Davidson County alerts may be rare - test with "?area=TN" to see all TN alerts

**Issue**: Route calculation slow
- Solution: Mapbox Directions API has rate limits (consider caching)
- Solution: Add loading spinner to improve UX

---

## Post-Hackathon Enhancements

If time permits or for future:
- Photo uploads for blockages
- Blockage validation system (users confirm if still blocked)
- Push notifications for nearby blockages
- Historical blockage data and patterns
- Integration with city traffic APIs
- Crowd-sourced blockage severity voting
- AR view for blockages (point phone camera)

---

**Good luck! Focus on making the map impressive and mobile-friendly - that's what judges will remember!** 🗺️
