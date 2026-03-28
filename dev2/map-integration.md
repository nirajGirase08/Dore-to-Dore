# Map Integration

## Dependencies
- Mapbox API key (`VITE_MAPBOX_TOKEN` in frontend `.env`)
- `mapbox-gl` and `react-map-gl` packages installed in frontend
- Dev1's `GET /api/offers` and `GET /api/requests` must return `location_lat` and `location_lng`
- Blockage routes must be complete (`GET /api/blockages`)

## Install
```
npm install mapbox-gl react-map-gl
```
in the `frontend/` directory.

---

## Frontend

### Component — `frontend/components/map/MapView.jsx`
- [ ] Initialize Mapbox map:
  - Center: `longitude: -86.8025, latitude: 36.1447` (Vanderbilt)
  - Zoom: 13
  - Style: `mapbox://styles/mapbox/streets-v11`
  - Mobile settings: `touchZoomRotate={true}`, `touchPitch={false}`, `scrollZoom={false}`
- [ ] Fetch on mount (parallel):
  - `GET /api/offers` → green markers
  - `GET /api/requests` → orange markers
  - `GET /api/blockages?status=active` → red markers
- [ ] User's current location dot (blue) via browser geolocation
- [ ] Layer toggle controls (show/hide offers, requests, blockages)
- [ ] Map legend in corner: green = offers, orange = requests, red = blockages
- [ ] On marker click: set `selectedMarker` state → show popup
- [ ] Mobile: bottom drawer (fixed, rounded top) replaces popup for marker details

### Component — `frontend/components/map/MapMarker.jsx`
- [ ] Accept `type` prop: `'offer'` | `'request'` | `'blockage'`
- [ ] Color by type: green `#22C55E` / orange `#F97316` / red `#DC2626`
- [ ] Accept `onClick` handler

### Component — `frontend/components/map/BlockageLayer.jsx`
- [ ] Render blockage markers from blockages array
- [ ] Color-code marker by severity:
  - low → yellow
  - medium → orange
  - high → red
  - critical → dark red / pulsing
- [ ] Cluster markers when zoomed out (use Mapbox cluster source or manual grouping)

### Component — `frontend/components/map/RouteDisplay.jsx`
- [ ] Accept `routeGeometry` (GeoJSON) prop
- [ ] Draw route as blue line layer on map
- [ ] Used by Route Calculator (Phase 4)

### Page — `frontend/pages/Map.jsx`
- [ ] Full-screen layout (`h-screen w-full`)
- [ ] Render `MapView`
- [ ] Optional search/filter bar overlay at top

### Service — `frontend/services/mapService.js`
- [ ] `getOffers()` — GET `/api/offers`
- [ ] `getRequests()` — GET `/api/requests`
- [ ] `getBlockages(params)` — GET `/api/blockages`

### Routing
- [ ] Add `/map` to `App.jsx` (coordinate with Dev1)
- [ ] Add map link to Navbar (coordinate with Dev1)

---

## Test Checklist
- [ ] Map loads without token errors in browser console
- [ ] All three marker types render at correct coordinates
- [ ] Clicking a marker opens popup (desktop) or bottom drawer (mobile)
- [ ] Layer toggles show/hide correct markers
- [ ] User location dot appears after granting geolocation permission
- [ ] Map is usable on mobile (touch zoom, tap markers)
- [ ] Blockage markers are color-coded by severity
- [ ] Map zooms to fit all markers on initial load
