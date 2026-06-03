import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useHealth } from '@/hooks/useHealth';

export default function Dashboard() {
  const { data: health, isLoading, error } = useHealth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your study abroad journey</p>
      </div>

      {/* API Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>API Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-gray-600">Checking API status...</div>
          ) : error ? (
            <div className="text-red-600">API connection failed</div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-green-600 font-medium">API is healthy</span>
              </div>
              <p className="text-sm text-gray-600">{health?.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(health?.timestamp || '').toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Start by creating your student profile to get personalized
              recommendations.
            </p>
            <Button className="w-full">Create Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Explore Universities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Browse German universities and programs that match your profile.
            </p>
            <Button variant="outline" className="w-full">
              Explore
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                1
              </span>
              <span className="text-gray-700">
                Complete your student profile with academic details
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                2
              </span>
              <span className="text-gray-700">
                Browse and filter German universities by program and location
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                3
              </span>
              <span className="text-gray-700">
                Generate a personalized application timeline
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                4
              </span>
              <span className="text-gray-700">
                Track your applications and stay updated
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
