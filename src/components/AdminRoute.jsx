import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminUnauthorizedAlert />;
  }

  return children;
};

const AdminUnauthorizedAlert = () => {
  const { showToast } = useApp();
  const location = useLocation();

  useEffect(() => {
    showToast('Unauthorized: You do not have admin access.', 'error');
  }, [showToast]);

  return <Navigate to="/" state={{ from: location }} replace />;
};
