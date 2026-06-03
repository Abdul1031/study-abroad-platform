import { ProfileWizard } from '@/features/profile/components/ProfileWizard';

export default function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Student Profile</h1>
        <p className="text-gray-500">
          Complete your profile to get personalized German university recommendations.
        </p>
      </div>
      <ProfileWizard />
    </div>
  );
}
