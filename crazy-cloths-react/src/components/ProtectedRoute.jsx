import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg, #080808)' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--color-border, #1a1a1a)',
          borderTop: '3px solid var(--color-accent, #ff4e50)',
          borderRadius: '50%',
          animation: 'button-spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login page and save the current location we tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Redirect to home page if admin is required but user is not admin
    return <Navigate to="/" replace />;
  }

  return children;
}
