# Crisis Connect - Setup & Developer Guide

## Project Overview

**Crisis Connect** is a Vanderbilt Community Resource Matching Platform built during a hackathon. The platform connects community members in need with volunteers during crisis situations.

### Developer Responsibilities

- **Developer 1**: Core Marketplace & Matching System (Authentication, Requests, Offers, Search, Messaging)
- **Developer 2**: Crisis Management System (Weather Alerts, Blockage Reporting, Maps, Routes, Authority Notifications)

---

## Common Infrastructure Setup (COMPLETED by Developer 1)

The following common infrastructure has been set up and is ready for both developers to use:

### ✅ Backend Infrastructure
- Express server with CORS configured (`backend/server.js`)
- PostgreSQL database schema (`database/schema.sql`)
- Sequelize ORM configuration (`backend/config/database.js`)
- JWT authentication middleware (`backend/middleware/authMiddleware.js`)
- User model and authentication routes (`backend/models/User.js`, `backend/routes/auth.js`)
- Environment configuration (`.env` files)

### ✅ Frontend Infrastructure
- React + Vite setup with Tailwind CSS
- React Router v6 configuration
- Authentication Context (`frontend/src/contexts/AuthContext.jsx`)
- API service with Axios interceptors (`frontend/src/services/api.js`)
- Shared components (Layout, Navbar)
- Login and Register pages

---

## Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v16 or higher recommended, currently v18.20.8)
- **npm** (comes with Node.js)
- **PostgreSQL** (for database)
- **Git** (for version control)

### Step 1: Clone and Navigate

```bash
cd /Users/sanjanadas/Dore-to-Dore
```

### Step 2: Install PostgreSQL

If PostgreSQL is not installed:

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 3: Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE crisis_connect;

# Create user (optional, if needed)
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE crisis_connect TO postgres;

# Exit
\q
```

### Step 4: Initialize Database Schema

```bash
psql -U postgres -d crisis_connect -f database/schema.sql
```

### Step 5: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 6: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 7: Configure Environment Variables

Backend `.env` file is already created at `backend/.env`. Update if needed:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=crisis_connect
DB_USER=postgres
DB_PASSWORD=password

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

Frontend `.env` file is at `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:5000`

Expected output:
```
===========================================
🚀 Crisis Connect Backend Server Running
📡 Port: 5000
🌍 Environment: development
🗄️  Database: Connected ✓
===========================================
```

### Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:5173`

### Test the Application

1. Open browser to `http://localhost:5173`
2. Click "Register here" to create an account
3. Fill in registration form
4. You should be redirected to the Dashboard
5. Test logout and login

---

## Project Structure

```
Dore-to-Dore/
├── backend/
│   ├── config/
│   │   └── database.js          # Sequelize configuration
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT authentication (USE THIS!)
│   ├── models/
│   │   └── User.js              # User model (DEV1)
│   ├── routes/
│   │   └── auth.js              # Authentication routes (DEV1)
│   ├── services/
│   │   └── (your services here)
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── server.js                # Main server file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── Layout.jsx   # Main layout wrapper (USE THIS!)
│   │   │   │   └── Navbar.jsx   # Navigation bar (CUSTOMIZE THIS!)
│   │   │   ├── marketplace/     # DEV1 components
│   │   │   ├── messaging/       # DEV1 components
│   │   │   ├── dashboard/       # DEV1 components
│   │   │   ├── crisis/          # DEV2 components (you create these)
│   │   │   └── map/             # DEV2 components (you create these)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # Authentication state (USE THIS!)
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js           # API functions (ADD YOUR ENDPOINTS!)
│   │   ├── App.jsx              # Main app with routes (ADD YOUR ROUTES!)
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind styles
│   ├── .env                     # Frontend environment variables
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
└── database/
    └── schema.sql               # Complete database schema
```

---

## For Developer 2: How to Use Common Infrastructure

### 1. Using Authentication Middleware

In your backend routes, import and use the authentication middleware:

```javascript
// backend/routes/blockages.js
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected route example
router.post('/blockages', authenticate, async (req, res) => {
  // req.user contains the authenticated user
  // req.userId contains the user's ID
  console.log('User:', req.user);

  // Your blockage creation logic here
});

export default router;
```

Then add your routes to `backend/server.js`:

```javascript
// In server.js, uncomment and add:
import blockageRoutes from './routes/blockages.js';
app.use('/api/blockages', blockageRoutes);
```

### 2. Adding Frontend API Functions

In `frontend/src/services/api.js`, add your API functions:

```javascript
// Add to the file
export const blockagesAPI = {
  create: async (blockageData) => {
    const response = await api.post('/blockages', blockageData);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/blockages', { params });
    return response.data;
  },
};
```

### 3. Adding Navigation Links

Update `frontend/src/components/shared/Navbar.jsx`:

```jsx
// Add your links in the Desktop Navigation section
<Link
  to="/blockages"
  className="hover:text-primary-200 transition-colors"
>
  Blockages
</Link>
<Link
  to="/map"
  className="hover:text-primary-200 transition-colors"
>
  Map
</Link>
```

### 4. Adding New Routes

Update `frontend/src/App.jsx`:

```jsx
// Import your pages
import BlockagesPage from './pages/BlockagesPage';
import MapPage from './pages/MapPage';

// Add routes
<Route
  path="/blockages"
  element={
    <ProtectedRoute>
      <Layout>
        <BlockagesPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### 5. Using Authentication in Components

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
    </div>
  );
}
```

---

## Database Tables Available

### Tables for Developer 1 (already defined):
- `users` - User accounts
- `requests` - Help requests
- `request_items` - Items needed in requests
- `offers` - Help offers
- `offer_items` - Items offered
- `conversations` - Chat conversations
- `messages` - Individual messages
- `transactions` - Transaction records

### Tables for Developer 2 (defined, need implementation):
- `blockages` - Road/area blockages
- `weather_alerts` - Weather alert information
- `routes` - Route data and calculations
- `authorities` - Authority contacts
- `authority_notifications` - Notifications to authorities

All tables are already created in the database when you run the schema.sql file.

---

## Creating New Models (Developer 2)

Example for Blockage model:

```javascript
// backend/models/Blockage.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Blockage = sequelize.define('Blockage', {
  blockage_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reported_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  location_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  location_address: {
    type: DataTypes.TEXT,
  },
  blockage_type: {
    type: DataTypes.STRING(100),
  },
  severity: {
    type: DataTypes.STRING(20),
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
  },
  image_url: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  resolved_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'blockages',
  timestamps: false,
});

export default Blockage;
```

---

## API Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Git Workflow

### Branch Naming Convention

- **Developer 1**: `dev1-feature-name`
- **Developer 2**: `dev2-feature-name`

### Commit Message Prefix

- **Developer 1**: `[DEV1] Feature description`
- **Developer 2**: `[DEV2] Feature description`

### Example Workflow

```bash
# Create your feature branch
git checkout -b dev2-blockage-reporting

# Make changes
git add .
git commit -m "[DEV2] Add blockage reporting system"

# Push to remote
git push origin dev2-blockage-reporting

# Create pull request when ready
```

---

## Environment Variables for Developer 2

Add these to `backend/.env` if you need external APIs:

```env
# Weather API (example: OpenWeatherMap)
WEATHER_API_KEY=your_api_key_here
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Geocoding API (example: Google Maps or Mapbox)
GEOCODING_API_KEY=your_api_key_here
MAPS_API_KEY=your_maps_api_key
```

Add to `frontend/.env`:

```env
VITE_MAPS_API_KEY=your_frontend_maps_api_key
```

---

## Troubleshooting

### Backend won't start

1. Check PostgreSQL is running:
   ```bash
   brew services list  # macOS
   sudo systemctl status postgresql  # Linux
   ```

2. Check database credentials in `backend/.env`

3. Test database connection:
   ```bash
   psql -U postgres -d crisis_connect
   ```

### Frontend won't start

1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check `.env` file has correct API URL

### Authentication not working

1. Check backend is running on port 5000
2. Check JWT_SECRET is set in backend/.env
3. Clear browser localStorage and try again
4. Check browser console and network tab for errors

### CORS errors

1. Verify FRONTEND_URL in backend/.env matches your frontend URL
2. Check server.js has CORS middleware configured

---

## Useful Commands

```bash
# Backend
npm run dev          # Start backend with nodemon
npm start            # Start backend with node

# Frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
psql -U postgres -d crisis_connect          # Connect to database
psql -U postgres -d crisis_connect -f database/schema.sql  # Reset schema
```

---

## Next Steps

### Developer 1 (Next Features to Implement):
1. Request CRUD operations (backend models, routes, frontend components)
2. Offer CRUD operations
3. Search and filtering system
4. Matching algorithm
5. Messaging system

### Developer 2 (Your Tasks):
1. Weather Alert Integration
2. Blockage Reporting System
3. Map Visualization
4. Route Display
5. Authority Notification System

---

## Testing Credentials

After setting up, register a test account:
- Email: test@vanderbilt.edu
- Password: password123
- Name: Test User

---

## Support & Communication

- Check `plan_files/plan_developer1.md` for Developer 1 detailed plan
- Check `plan_files/plan_developer2.md` for Developer 2 detailed plan (if exists)
- Use git commit messages to communicate progress
- Leave code comments like `// DEV2: Please integrate here` when needed

---

## Success Checklist

- [ ] PostgreSQL is running
- [ ] Database schema is loaded
- [ ] Backend server starts successfully
- [ ] Frontend dev server starts
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Dashboard displays correctly
- [ ] Can logout and login again

---

**Last Updated**: March 28, 2024
**Setup Completed By**: Developer 1
**Status**: ✅ Ready for both developers to start feature implementation
