import { motion } from 'framer-motion';
import { CheckCircle, Clock, Circle, Calendar } from 'lucide-react';

type Status = 'done' | 'active' | 'pending';

interface TimelineItem {
  phase: string;
  title: string;
  description: string;
  duration: string;
  status: Status;
  tasks: string[];
}

const timelineItems: TimelineItem[] = [
  {
    phase: 'Phase 1',
    title: 'Profile & Self-Assessment',
    duration: 'Month 1',
    status: 'done',
    description: 'Understand your academic standing and language requirements.',
    tasks: ['Complete academic profile', 'IELTS/TOEFL preparation', 'Set study goals'],
  },
  {
    phase: 'Phase 2',
    title: 'University Research',
    duration: 'Month 2',
    status: 'active',
    description: 'Use AI matching to identify the best universities and programs.',
    tasks: [
      'Generate AI recommendations',
      'Research shortlisted universities',
      'Check eligibility criteria',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Document Preparation',
    duration: 'Month 3–4',
    status: 'pending',
    description: 'Gather and prepare all required application documents.',
    tasks: [
      'Get transcripts attested',
      'Obtain language certificates',
      'Write Statement of Purpose',
      'Request 2 recommendation letters',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Application Submission',
    duration: 'Month 5–6',
    status: 'pending',
    description: 'Submit applications to selected universities via Uni-Assist or direct portals.',
    tasks: [
      'Register on Uni-Assist',
      'Upload documents',
      'Pay application fees',
      'Submit before deadlines',
    ],
  },
  {
    phase: 'Phase 5',
    title: 'Waiting & Follow-Up',
    duration: 'Month 7–8',
    status: 'pending',
    description: 'Track your applications and respond to any queries from universities.',
    tasks: [
      'Monitor application status',
      'Respond to university emails',
      'Prepare for possible interviews',
    ],
  },
  {
    phase: 'Phase 6',
    title: 'Admission & Visa',
    duration: 'Month 9–10',
    status: 'pending',
    description: 'Accept your offer and begin the German student visa process.',
    tasks: [
      'Accept admission offer',
      'Open blocked account (Sperrkonto)',
      'Book visa appointment',
      'Prepare visa documents',
    ],
  },
  {
    phase: 'Phase 7',
    title: 'Pre-Departure',
    duration: 'Month 11',
    status: 'pending',
    description: 'Final preparations before flying to Germany.',
    tasks: [
      'Book flights',
      'Arrange accommodation',
      'Join university Facebook/WhatsApp groups',
      'Pack essentials',
    ],
  },
  {
    phase: 'Phase 8',
    title: 'Arrival & Enrolment',
    duration: 'Month 12',
    status: 'pending',
    description: 'Arrive in Germany, register your address, and enrol at university.',
    tasks: [
      'Register at Einwohnermeldeamt',
      'Open German bank account',
      'Enrol at university',
      'Get health insurance',
    ],
  },
];

const statusConfig = {
  done: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
    line: 'bg-green-400',
  },
  active: {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    line: 'bg-blue-200',
  },
  pending: {
    icon: Circle,
    color: 'text-gray-300',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-500',
    line: 'bg-gray-200',
  },
};

const completedCount = timelineItems.filter((i) => i.status === 'done').length;
const progress = Math.round((completedCount / timelineItems.length) * 100);

export default function Timeline() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Application Timeline</h1>
        <p className="text-gray-500">Your personalized Germany study abroad roadmap</p>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-900">Overall Progress</span>
          </div>
          <span className="text-sm font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <motion.div
            className="bg-blue-600 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {completedCount} of {timelineItems.length} phases complete
        </p>
      </div>

      {/* ── Timeline ───────────────────────────────────────────────── */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200 hidden sm:block" />

        <div className="space-y-4">
          {timelineItems.map((item, i) => {
            const cfg = statusConfig[item.status];
            const IconComp = cfg.icon;
            return (
              <motion.div
                key={item.phase}
                className="relative flex gap-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                {/* Icon node */}
                <div
                  className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10 hidden sm:flex ${cfg.bg} border-4 border-white shadow-sm`}
                >
                  <IconComp size={20} className={cfg.color} />
                </div>

                {/* Card */}
                <div
                  className={`flex-1 bg-white rounded-2xl border shadow-sm p-5 ${item.status === 'active' ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        {item.phase}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                        {item.status === 'done'
                          ? 'Complete'
                          : item.status === 'active'
                            ? 'In Progress'
                            : 'Pending'}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {item.duration}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tasks.map((task) => (
                      <div
                        key={task}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${item.status === 'done' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {item.status === 'done' && <CheckCircle size={10} />}
                        {task}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
