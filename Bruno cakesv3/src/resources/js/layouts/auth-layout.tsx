import { Outlet, Navigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function AuthLayout() {
  const { isAuthenticated } = useApp();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Outlet />
    </div>
  );
}