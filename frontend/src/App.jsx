import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLanguage } from './i18n';
import LoadingScreen from './components/common/LoadingScreen';
import AppShell from './components/layout/AppShell';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import GuestRoute from './routes/GuestRoute';
import ProtectedRoute from './routes/ProtectedRoute';

const Budgets = lazy(() => import('./pages/Budgets'));
const Categories = lazy(() => import('./pages/Categories'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Income = lazy(() => import('./pages/Income'));
const Insights = lazy(() => import('./pages/Insights'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const RecurringExpenses = lazy(() => import('./pages/RecurringExpenses'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  useLanguage();

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<LazyPage page={Dashboard} />} />
          <Route path="/expenses" element={<LazyPage page={Expenses} />} />
          <Route path="/income" element={<LazyPage page={Income} />} />
          <Route path="/categories" element={<LazyPage page={Categories} />} />
          <Route path="/budgets" element={<LazyPage page={Budgets} />} />
          <Route path="/reports" element={<LazyPage page={Reports} />} />
          <Route path="/insights" element={<LazyPage page={Insights} />} />
          <Route path="/notifications" element={<LazyPage page={Notifications} />} />
          <Route path="/recurring-expenses" element={<LazyPage page={RecurringExpenses} />} />
          <Route path="/profile" element={<LazyPage page={Profile} />} />
          <Route path="/settings" element={<LazyPage page={Settings} />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function HomeRedirect() {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen label="Checking your session" />;
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function LazyPage({ page: Page }) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-lg border border-border bg-surface" role="status" aria-label="Loading" />}>
      <Page />
    </Suspense>
  );
}
