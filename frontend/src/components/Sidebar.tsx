import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  User,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

// ── Navigation config ────────────────────────────────────────────────────
const baseNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Universities', href: '/universities', icon: BookOpen },
  { label: 'Recommendations', href: '/recommendations', icon: Sparkles },
  { label: 'Timeline', href: '/timeline', icon: Calendar },
  { label: 'Tracker', href: '/tracker', icon: CheckCircle },
];

const adminNavItem = { label: 'Admin', href: '/admin', icon: ShieldCheck };

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navItems = user?.role === 'ADMIN' ? [...baseNavItems, adminNavItem] : baseNavItems;

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* ── Mobile hamburger ────────────────────────────────────────── */}
      <button
        className="fixed top-4 left-4 md:hidden z-50 p-2 bg-white shadow-md rounded-lg border border-gray-200"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* ── Mobile overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 md:hidden z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className={`
          fixed md:relative top-0 left-0 h-screen bg-white border-r border-gray-100 z-40 flex flex-col
          shadow-sm overflow-hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 md:transition-none
        `}
      >
        {/* Logo area */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 min-h-[68px] shrink-0 text-left hover:bg-gray-50 transition-colors w-full focus:outline-none"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="text-base font-bold text-gray-900 leading-none">StudyAbroad.de</p>
                <p className="text-xs text-gray-400 mt-0.5">Germany Study Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
                  ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-medium overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}
