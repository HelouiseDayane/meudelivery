import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../App';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { admin } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin || admin.role !== 'staff') {
      navigate('/admin/login');
    }
  }, [admin, navigate]);

  if (!admin || admin.role !== 'staff') {
    return null;
  }

  return <>{children}</>;
}