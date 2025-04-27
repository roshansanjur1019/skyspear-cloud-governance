// src/layouts/DashboardLayout.tsx
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
// Import other necessary components

interface DashboardLayoutProps {
  children?: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="dashboard-layout">
      {/* Add navigation, sidebar, header components here */}
      <div className="dashboard-content">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default DashboardLayout;