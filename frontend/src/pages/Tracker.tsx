import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function Tracker() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tracker</h1>
        <p className="text-gray-600">
          Track your application progress and stay updated
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Technical University Munich
                </h3>
                <p className="text-sm text-gray-600">Computer Science MSc</p>
              </div>
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                Under Review
              </span>
            </div>
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">
                  University of Berlin
                </h3>
                <p className="text-sm text-gray-600">Data Science MSc</p>
              </div>
              <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full font-medium">
                Not Started
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tracker Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-700">
            <li>• Application status monitoring</li>
            <li>• Deadline reminders</li>
            <li>• Document checklist</li>
            <li>• Interview scheduling</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
