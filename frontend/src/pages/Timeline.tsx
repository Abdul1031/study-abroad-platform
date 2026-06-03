import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function Timeline() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Timeline</h1>
        <p className="text-gray-600">
          Your personalized Germany application timeline
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: 'Profile Setup',
                date: 'Month 0',
                status: 'In Progress',
              },
              {
                step: 'University Research',
                date: 'Month 1',
                status: 'Pending',
              },
              {
                step: 'Document Preparation',
                date: 'Month 2-3',
                status: 'Pending',
              },
              {
                step: 'Application Submission',
                date: 'Month 4-5',
                status: 'Pending',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.step}</h3>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-700">
            <li>• Personalized timeline based on your profile</li>
            <li>• Key milestones and deadlines</li>
            <li>• Document preparation checklist</li>
            <li>• Application submission schedule</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
