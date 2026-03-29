import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VolunteerPage from './pages/VolunteerPage';
import NeedHelpPage from './pages/NeedHelpPage';
import MessagesPage from './pages/MessagesPage';
import ReportBlockage from './pages/ReportBlockage';
import ProfilePage from './pages/ProfilePage';
import OfferDetailPage from './pages/OfferDetailPage';
import RequestDetailPage from './pages/RequestDetailPage';
import UserPostsPage from './pages/UserPostsPage';
import AvailableRidesPage from './pages/AvailableRidesPage';
import RideTrackingPage from './pages/RideTrackingPage';
import Layout from './components/shared/Layout';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/volunteer"
            element={
              <ProtectedRoute>
                <Layout>
                  <VolunteerPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/need-help"
            element={
              <ProtectedRoute>
                <Layout>
                  <NeedHelpPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Messages routes */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Layout>
                  <MessagesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:conversationId"
            element={
              <ProtectedRoute>
                <Layout>
                  <MessagesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/offers/:offerId"
            element={
              <ProtectedRoute>
                <Layout>
                  <OfferDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests/:requestId"
            element={
              <ProtectedRoute>
                <Layout>
                  <RequestDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:userId"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserPostsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Rides */}
          <Route
            path="/rides"
            element={
              <ProtectedRoute>
                <Layout>
                  <AvailableRidesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rides/:rideId"
            element={
              <ProtectedRoute>
                <Layout>
                  <RideTrackingPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* DEV2: Blockage reporting */}
          <Route
            path="/report-blockage"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportBlockage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Page not found</p>
                  <a href="/dashboard" className="text-primary-600 hover:underline">
                    Go to Dashboard
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
