import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { LandingPage } from './pages/LandingPage'
import { EmergencyPage } from './pages/EmergencyPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { UsersPage } from './pages/UsersPage'
import { GroupsPage } from './pages/GroupsPage'
import { EventsPage } from './pages/EventsPage'
import { DiocesesPage } from './pages/DiocesesPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="leader">
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/emergency" replace />} />
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
              <Route
                path="dioceses"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DiocesesPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
