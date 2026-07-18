import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 h-[68px] flex items-center justify-between shrink-0">
      {/* Left: Page breadcrumb area (intentionally minimal — sidebar handles nav) */}
      <div className="flex-1 ml-8 md:ml-0" />

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 relative"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* User avatar + name */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition cursor-default">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
              {user.fullName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user.fullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition border border-red-100"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Exit</span>
        </motion.button>
      </div>
    </header>
  );
}
