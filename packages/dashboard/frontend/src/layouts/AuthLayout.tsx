// src/layouts/AuthLayout.tsx
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
// Import other necessary components

interface AuthLayoutProps {
  children?: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-layout">
      {/* Add logo, branding, etc. */}
      <div className="auth-content">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AuthLayout;