import { Navigate, Outlet } from 'react-router-dom';
import LoadingScreen from '../components/common/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

export default function GuestRoute() {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen label="Checking your session" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
