import { BookOpen, MapPin, Euro, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { MatchScore, EligibilityStatus } from '../types/recommendation.types';

interface RecommendationCardProps {
  recommendation: MatchScore;
  onSave?: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
}

const statusColors: Record<EligibilityStatus, string> = {
  ELIGIBLE: 'bg-green-100 text-green-800 border-green-200',
  BORDERLINE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  STRETCH: 'bg-orange-100 text-orange-800 border-orange-200',
  INELIGIBLE: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<EligibilityStatus, string> = {
  ELIGIBLE: 'Eligible',
  BORDERLINE: 'Borderline',
  STRETCH: 'Stretch Goal',
  INELIGIBLE: 'Ineligible',
};

export function RecommendationCard({
  recommendation,
  onSave,
  onViewDetails,
}: RecommendationCardProps) {
  const { courseName, universityName, totalScore, eligibilityStatus, breakdown, courseDetails } =
    recommendation;

  return (
    <Card className="hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
      <CardHeader
        className={`border-b ${statusColors[eligibilityStatus].replace('text-', 'bg-opacity-50 text-')}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-1 rounded text-xs font-bold border ${statusColors[eligibilityStatus]}`}
              >
                {statusLabels[eligibilityStatus]}
              </span>
              <span className="text-sm font-semibold text-gray-700 bg-white px-2 py-1 rounded shadow-sm border">
                Match: {totalScore}%
              </span>
            </div>
            <CardTitle className="text-xl text-gray-900 line-clamp-2">{courseName}</CardTitle>
            <p className="text-gray-600 flex items-center gap-1 mt-1 font-medium">
              <MapPin className="w-4 h-4" />
              {universityName}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Match Breakdown Bars */}
        <div className="mb-6 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-4 h-4" /> Score Breakdown
          </h4>

          <div className="space-y-2">
            <ScoreBar label="Academic Fit (GPA)" score={breakdown.academicFit} max={30} />
            <ScoreBar label="Language (IELTS)" score={breakdown.languageEligibility} max={25} />
            <ScoreBar label="Budget Fit" score={breakdown.budgetFit} max={20} />
            <ScoreBar label="Intake Match" score={breakdown.intakeMatch} max={15} />
            <ScoreBar label="Field Alignment" score={breakdown.fieldAlignment} max={10} />
          </div>
        </div>

        {/* Quick Facts */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Tuition Fee</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Euro className="w-3 h-3 text-gray-400" />
              {courseDetails.tuitionFeeEuros === 0
                ? 'Free'
                : `${courseDetails.tuitionFeeEuros} / sem`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Degree</p>
            <p className="text-sm font-medium">{courseDetails.degree}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Language</p>
            <p className="text-sm font-medium">{courseDetails.language}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Min IELTS</p>
            <p className="text-sm font-medium">{courseDetails.ieltsMinimum || 'N/A'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onViewDetails && onViewDetails(recommendation.courseId)}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Course Details
          </Button>
          <Button
            variant="outline"
            className="px-4 border-gray-300"
            onClick={() => onSave && onSave(recommendation.courseId)}
          >
            ⭐ Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {Math.round(score)}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
