import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTelegramWebApp } from './utils/telegram';
import { authenticateWithTelegram } from './services/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoadingPage from './pages/LoadingPage';
import ErrorPage from './pages/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/Toast';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

interface User {
  id: number;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
}

function App() {
  const { initData, isReady } = useTelegramWebApp();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const authenticate = async () => {
      if (!isReady) return;

      try {
        // In development mode, use mock initData if not available
        const authData = initData || 'dev_mode';
        
        if (!initData && import.meta.env.DEV) {
          console.warn('Running in development mode without Telegram WebApp');
          // Skip authentication in dev mode without Telegram
          setIsAuthenticating(false);
          return;
        }

        const response = await authenticateWithTelegram(authData);
        setUser(response.user);
        setAuthError(null);
      } catch (error) {
        console.error('Authentication error:', error);
        setAuthError('Failed to authenticate. Please try again.');
      } finally {
        setIsAuthenticating(false);
      }
    };

    authenticate();
  }, [initData, isReady]);

  // Show loading screen during initialization and authentication
  if (!isReady || isAuthenticating) {
    return <LoadingPage />;
  }

  // Show error page if authentication failed
  if (authError) {
    return <ErrorPage message={authError} />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Toast />
        <BrowserRouter>
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              {/* Public routes with layout */}
              <Route element={<Layout balance={user?.balance || 0} />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/case/:id" element={<CaseDetailPage />} />
                
                {/* Protected routes */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/verify"
                  element={
                    <ProtectedRoute>
                      <VerificationPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Admin routes - separate layout */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute isAdmin={user?.isAdmin || false}>
                    <AdminPage />
                  </AdminRoute>
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
