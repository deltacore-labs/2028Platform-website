import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const EmergencyPage = lazy(() => import('./pages/EmergencyPage').then(m => ({ default: m.EmergencyPage })))
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })))
const GroupsPage = lazy(() => import('./pages/GroupsPage').then(m => ({ default: m.GroupsPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })))
const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))
const LocationsPage = lazy(() => import('./pages/LocationsPage').then(m => ({ default: m.LocationsPage })))

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen grid place-items-center text-gray-500">Wird geladen…</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/datenschutz" element={<LegalPage kind="privacy" />} />
            <Route path="/impressum" element={<LegalPage kind="imprint" />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="leader">
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route
                path="emergency"
                element={
                  <ProtectedRoute requiredRole="miniteam">
                    <EmergencyPage />
                  </ProtectedRoute>
                }
              />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route
                path="locations"
                element={
                  <ProtectedRoute requiredRole="miniteam">
                    <LocationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRole="miniteam">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="groups"
                element={
                  <ProtectedRoute requiredRole="miniteam">
                    <GroupsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="dioceses" element={<Navigate to="/admin/overview" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
