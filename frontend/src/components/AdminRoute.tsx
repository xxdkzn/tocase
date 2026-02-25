import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';

interface AdminRouteProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

const AdminRoute = ({ children, isAdmin }: AdminRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
