import { Outlet, Navigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import AppSidebar from '../components/app-sidebar';
import AppHeader from '../components/app-header';

export default function AppLayout() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <AppHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <AppSidebar />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}