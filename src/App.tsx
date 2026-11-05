import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { useAuth } from './context/AuthContext'

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const EmergencyPage = lazy(() => import('./pages/EmergencyPage').then(m => ({ default: m.EmergencyPage })))
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })))
const GroupsPage = lazy(() => import('./pages/GroupsPage').then(m => ({ default: m.GroupsPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })))
const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then(m => ({ default: m.AuditLogPage })))

const queryClient = new QueryClient()

function AdminIndexRedirect() {
  const { appUser } = useAuth()
  return (
    <Navigate
      to={appUser?.role === 'malteser' ? '/admin/emergency' : '/admin/overview'}
      replace
    />
  )
}

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
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminIndexRedirect />} />
              <Route
                path="overview"
                element={
                  <ProtectedRoute requiredRole="leader">
                    <OverviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="emergency"
                element={
                  <ProtectedRoute requiredRole="emergency">
                    <EmergencyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="announcements"
                element={
                  <ProtectedRoute requiredRole="leader">
                    <AnnouncementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="events"
                element={
                  <ProtectedRoute requiredRole="leader">
                    <EventsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="locations" element={<Navigate to="/admin/events" replace />} />
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
              <Route
                path="activity"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
