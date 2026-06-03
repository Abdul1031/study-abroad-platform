import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">
          Manage your student profile and academic details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                placeholder="Your country"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree Status
              </label>
              <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500">
                <option>Select status...</option>
                <option>Completed</option>
                <option>Ongoing</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
