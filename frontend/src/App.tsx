import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ErrorBoundary } from '@/lib/errorBoundary';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { ProtectedRoute } from '@/features/auth/guards/ProtectedRoute';
import { AdminRoute } from '@/features/auth/guards/AdminRoute';

// ── Route-level code splitting ──────────────────────────────────────────────
// Each page ships as its own chunk, so first paint only loads the shell +
// the page actually being visited.
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Tracker = lazy(() => import('./pages/Tracker'));
const UniversitiesPage = lazy(() =>
  import('@/features/universities/pages/UniversitiesPage').then((m) => ({
    default: m.UniversitiesPage,
  }))
);
const UniversityDetailPage = lazy(() =>
  import('@/features/universities/pages/UniversityDetailPage').then((m) => ({
    default: m.UniversityDetailPage,
  }))
);
const RecommendationsPage = lazy(() =>
  import('@/features/recommendations/pages/RecommendationsPage').then((m) => ({
    default: m.RecommendationsPage,
  }))
);
const AdminPage = lazy(() =>
  import('@/features/admin/pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);

/** Minimal centered spinner shown while a route chunk streams in. */
function PageLoader() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Public auth routes (no layout shell) ─────────────── */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* ── Root redirect ─────────────────────────────────────── */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* ── Authenticated app shell ───────────────────────────── */}
                <Route element={<Layout />}>
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/universities"
                    element={
                      <ProtectedRoute>
                        <UniversitiesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/universities/:id"
                    element={
                      <ProtectedRoute>
                        <UniversityDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recommendations"
                    element={
                      <ProtectedRoute>
                        <RecommendationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/timeline"
                    element={
                      <ProtectedRoute>
                        <Timeline />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tracker"
                    element={
                      <ProtectedRoute>
                        <Tracker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                </Route>

                {/* ── Catch-all ─────────────────────────────────────────── */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
