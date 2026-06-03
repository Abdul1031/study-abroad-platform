import { Link, useLocation } from 'react-router-dom';
import { Home, User, BookOpen, Calendar, CheckCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Universities', href: '/universities', icon: BookOpen },
  { label: 'Timeline', href: '/timeline', icon: Calendar },
  { label: 'Tracker', href: '/tracker', icon: CheckCircle },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 md:hidden z-50 p-2 hover:bg-gray-200 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative md:translate-x-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 h-screen bg-white border-r border-gray-200 p-6 z-40`}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">StudyAbroad.de</h1>
          <p className="text-sm text-gray-600">Germany Study Platform</p>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(href) ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-600 px-4">Phase 2: Profile Module</p>
        </div>
      </aside>
    </>
  );
}
