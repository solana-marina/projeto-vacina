import { Navigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/api';

interface RoleRouteProps {
  allowed: UserRole[];
  children: JSX.Element;
}

export function RoleRoute({ allowed, children }: RoleRouteProps) {
  const { isAuthenticated, hasAnyRole, getDefaultRoute } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!hasAnyRole(allowed)) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}
