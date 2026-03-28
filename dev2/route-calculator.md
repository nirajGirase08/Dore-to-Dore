# Route Calculator

## Dependencies
- Mapbox API key (`MAPBOX_ACCESS_TOKEN` backend, `VITE_MAPBOX_TOKEN` frontend)
- Blockage routes must be complete (`GET /api/blockages`)
- Map integration must be complete (route drawn on `MapView`)
- `axios` in backend

---

## Backend

### Service — `backend/services/routeService.js`
- [ ] `calculateRoute(originLat, originLng, destLat, destLng, blockages)`
  - Call Mapbox Directions API: `GET /directions/v5/mapbox/driving/{lng,lat};{lng,lat}`
  - Params: `geometries=geojson`, `overview=full`, `steps=true`
  - For each active blockage: check if it falls within ~100m of route
    - Simple approach: check Haversine distance from blockage to origin and destination
    - Return blockages that are within 5km of either endpoint
  - Determine `safety_level`:
    - `'dangerous'` if any blockage is `critical` or `high`
    - `'caution'` if any blockages present
    - `'safe'` if no blockages
  - Return:
    ```
    {
      route: { geometry (GeoJSON), distance_km, duration_minutes },
      blockages_on_route: [{ ...blockage, distance_from_origin_km }],
      warning_count,
      safety_level
    }
    ```

### Routes — `backend/routes/routes.js`
- [ ] `POST /api/routes/calculate`
  - Body: `{ origin_lat, origin_lng, dest_lat, dest_lng, avoid_blockages? }`
  - Fetch active blockages from DB
  - Call `routeService.calculateRoute()`
  - Return full route response
- [ ] Mount in `server.js`: `app.use('/api/routes', routesRouter)` (coordinate with Dev1)

---

## Frontend

### Component — `frontend/components/routes/RouteCalculator.jsx`
- [ ] Origin input: address text field OR "Use Current Location" button
- [ ] Destination input: address text field
- [ ] "Calculate Safest Route" button
- [ ] Loading spinner while awaiting API response
- [ ] On success:
  - Pass `routeGeometry` to `MapView` → draws blue line via `RouteDisplay`
  - Show distance (km) and estimated time (minutes)
  - Render `RouteSafety` component with results
- [ ] On error: show friendly error message

### Component — `frontend/components/routes/RouteSafety.jsx`
- [ ] Safety level badge:
  - `safe` → green `SAFE`
  - `caution` → yellow `CAUTION`
  - `dangerous` → red `DANGEROUS`
- [ ] If `warning_count > 0`: list each blockage on route
  - Show: type, severity, distance from origin
  - "Avoid this area" note for high/critical blockages
- [ ] "Report New Blockage" quick link → `/report-blockage`

### Page — `frontend/pages/Routes.jsx`
- [ ] Split layout: map on top (or side on desktop), inputs + results below
- [ ] Render `RouteCalculator` and embed `MapView` with route overlay
- [ ] Mobile: stacked layout, scrollable results below map

### Routing
- [ ] Add `/routes` to `App.jsx` (coordinate with Dev1)

---

## Test Checklist
- [ ] Route calculates between two Nashville addresses
- [ ] Route geometry draws as blue line on map
- [ ] Distance and duration display correctly
- [ ] Blockages near route appear in warnings list
- [ ] Safety level badge matches blockage severity
- [ ] "Use Current Location" populates origin correctly
- [ ] Loading spinner shows during API call
- [ ] Error state shows if Mapbox API fails
- [ ] Mobile layout is usable and scrollable
