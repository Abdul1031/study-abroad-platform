import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function Universities() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Universities</h1>
        <p className="text-gray-600">
          Explore German universities and find your perfect match
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program
              </label>
              <input
                type="text"
                placeholder="Search programs..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="City or region..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg">
                <option>All</option>
                <option>English</option>
                <option>German</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured Universities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            University matching feature coming soon. Database will be populated
            with German universities and their programs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
