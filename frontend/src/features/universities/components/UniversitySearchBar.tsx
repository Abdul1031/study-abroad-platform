import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface UniversitySearchBarProps {
  onSearch: (query: string) => void;
}

export function UniversitySearchBar({ onSearch }: UniversitySearchBarProps) {
  const [query, setQuery] = useState('');
  // useUniversitySearch is imported but not used directly here since we don't display a dropdown yet.
  // It could be used to prepopulate suggestions.

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.length > 2) {
        onSearch(value);
      } else if (value.length === 0) {
        onSearch('');
      }
    },
    [onSearch]
  );

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search universities by name or city..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-10 pr-10 py-3"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search results dropdown could be added here later */}
    </div>
  );
}
