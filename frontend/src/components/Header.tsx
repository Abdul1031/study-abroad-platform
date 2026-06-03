import { Link } from 'react-router';
import { LogOut, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
      <div className="flex items-center justify-end gap-4 ml-16 md:ml-0">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings size={20} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <LogOut size={20} className="text-gray-600" />
        </button>
      </div>
    </header>
  );
}
