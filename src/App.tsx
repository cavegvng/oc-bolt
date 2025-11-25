import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DiscussionsPage } from './pages/DiscussionsPage';
import { DiscussionDetailPage } from './pages/DiscussionDetailPage';
import { NewDiscussionPage } from './pages/NewDiscussionPage';
import { EditDiscussionPage } from './pages/EditDiscussionPage';
import { DebatesPage } from './pages/DebatesPage';
import { DebateDetailPage } from './pages/DebateDetailPage';
import { NewDebatePage } from './pages/NewDebatePage';
import { HotTopicsPage } from './pages/HotTopicsPage';
import { EnhancedProfilePage } from './pages/EnhancedProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { DashboardPage } from './admin/pages/dashboard-page';
import { ModerationQueuePage } from './admin/pages/moderation-queue-page';
import { ReportsPage } from './admin/pages/reports-page';
import { DiscussionsManagementPage } from './admin/pages/discussions-management-page';
import { HomepageControlsPage } from './admin/pages/homepage-controls-page';
import { UsersManagementPage } from './admin/pages/users-management-page';

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute requiredRole="moderator">
              <DashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <AdminRoute requiredRole="moderator">
              <ModerationQueuePage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute requiredRole="moderator">
              <ReportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/discussions"
          element={
            <AdminRoute requiredRole="moderator">
              <DiscussionsManagementPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/homepage-controls"
          element={
            <AdminRoute requiredRole="admin">
              <HomepageControlsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute requiredRole="moderator">
              <UsersManagementPage />
            </AdminRoute>
          }
        />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discussions" element={<DiscussionsPage />} />
        <Route
          path="/discussions/new"
          element={
            <ProtectedRoute>
              <NewDiscussionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
        <Route
          path="/discussions/:id/edit"
          element={
            <ProtectedRoute>
              <EditDiscussionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/debates" element={<DebatesPage />} />
        <Route
          path="/debates/new"
          element={
            <ProtectedRoute>
              <NewDebatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/debates/:id" element={<DebateDetailPage />} />
        <Route path="/hot-topics" element={<HotTopicsPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <EnhancedProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:userId" element={<EnhancedProfilePage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
