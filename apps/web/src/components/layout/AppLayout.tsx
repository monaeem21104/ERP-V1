import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../auth/AuthContext';
import { ChangePasswordModal } from '../../pages/auth/ChangePasswordModal';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { user } = useAuth();

  const isEnforcedChange = Boolean(user?.mustChangePassword);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      {/* Industrial Dark Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onChangePasswordClick={() => setChangePasswordOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mandatory or voluntary password change modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen || isEnforcedChange}
        onClose={() => setChangePasswordOpen(false)}
        enforced={isEnforcedChange}
      />
    </div>
  );
}
