import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  TrendingUp,
  BookOpen,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Star,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useProfileStatus } from '@/features/profile/hooks/useProfileStatus';
import { ProgramShowcase } from '@/features/dashboard/components/ProgramShowcase';

// ── Animated number counter ──────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 50;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, end);
      setCount(Math.floor(current));
      if (current >= end) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, end]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Shared section reveal wrapper ────────────────────────────────────────
function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ── Static data ──────────────────────────────────────────────────────────
const stats = [
  {
    icon: Users,
    value: 2400,
    suffix: '+',
    label: 'Students Helped',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: GraduationCap,
    value: 94,
    suffix: '%',
    label: 'Acceptance Rate',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: BookOpen,
    value: 80,
    suffix: '+',
    label: 'Partner Universities',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: TrendingUp,
    value: 4,
    suffix: '+',
    label: 'Years of Excellence',
    color: 'bg-orange-50 text-orange-600',
  },
];

const reviews = [
  {
    name: 'Arjun Sharma',
    university: 'TU Munich — CS MSc',
    rating: 5,
    avatar: 'A',
    color: 'bg-blue-500',
    text: 'StudyAbroad.de made my dream of studying in Germany a reality. The AI recommendations were incredibly accurate and saved me months of research.',
  },
  {
    name: 'Fatima Al-Rashid',
    university: 'LMU Munich — Data Science',
    rating: 5,
    avatar: 'F',
    color: 'bg-green-500',
    text: 'The personalized timeline feature kept me on track every step of the way. I got accepted to my first-choice university!',
  },
  {
    name: 'Carlos Mendez',
    university: 'RWTH Aachen — Engineering',
    rating: 5,
    avatar: 'C',
    color: 'bg-purple-500',
    text: 'From document preparation to final admission, the platform guided me through everything. Could not have done it without this amazing team.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Complete Your Profile',
    desc: 'Tell us your academic background, language scores, and study goals.',
    icon: User,
  },
  {
    step: '02',
    title: 'Get Matched',
    desc: 'Our AI matches you with universities where you have the highest acceptance probability.',
    icon: Sparkle,
  },
  {
    step: '03',
    title: 'Track & Apply',
    desc: 'Use the timeline and tracker to stay on top of deadlines and submissions.',
    icon: CheckCircle,
  },
];

// Placeholder icons for step items
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function Sparkle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profileStatus } = useProfileStatus();
  const profileComplete = profileStatus?.isComplete ?? false;

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-16">
      {/* ── Hero Welcome ──────────────────────────────────────────────── */}
      <motion.div
        className="relative rounded-3xl overflow-hidden animated-gradient p-10 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Decorative blur circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-300 opacity-10 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-2">Welcome back 👋</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Hello, {user?.fullName?.split(' ')[0] ?? 'Student'}!
            </h1>
            <p className="text-blue-100 text-lg max-w-xl">
              Your journey to studying in Germany is progressing. Here&apos;s what&apos;s next for
              you.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/profile"
              className="px-5 py-2.5 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition"
            >
              {profileComplete ? 'Update Profile' : 'Complete Profile'}
            </Link>
            <Link
              to="/recommendations"
              className="px-5 py-2.5 glass rounded-xl font-semibold text-sm text-white hover:bg-white/20 transition flex items-center gap-2"
            >
              View Matches <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <RevealSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map(({ icon: Icon, value, suffix, label, color }, i) => (
            <motion.div
              key={label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition card-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}
              >
                <Icon size={22} />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                <AnimatedCounter end={value} suffix={suffix} />
              </p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* ── Featured Programs (fluid cards) ───────────────────────────── */}
      <RevealSection>
        <ProgramShowcase />
      </RevealSection>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <RevealSection>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Three simple steps to your German university admission
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ step, title, desc, icon: Icon }, i) => (
            <motion.div
              key={step}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <div className="absolute top-4 right-4 text-6xl font-black text-gray-100 select-none leading-none">
                {step}
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-5 relative z-10">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2 relative z-10">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed relative z-10">{desc}</p>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* ── Student Reviews ───────────────────────────────────────────── */}
      <RevealSection>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Student Success Stories</h2>
          <p className="text-gray-500">Real results from real students</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ y: -4 }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, j) => (
                  <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed italic flex-1 mb-5">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div
                  className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center text-white font-bold`}
                >
                  {review.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                  <p className="text-xs text-gray-400">{review.university}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* ── About Us ──────────────────────────────────────────────────── */}
      <RevealSection>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Text */}
            <div className="p-10">
              <p className="text-blue-600 font-semibold text-sm mb-3 uppercase tracking-widest">
                About Us
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                Helping Students Reach Germany Since 2020
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                StudyAbroad.de is an AI-powered study abroad platform specializing in German
                university admissions. We combine cutting-edge technology with expert counselling to
                give every student the best chance of admission into their dream program.
              </p>
              <div className="space-y-3">
                {[
                  'Personalized university matching algorithm',
                  'End-to-end application support',
                  'Document preparation & verification',
                  'Visa guidance & pre-arrival support',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Gradient panel */}
            <div className="animated-gradient flex items-center justify-center p-10">
              <div className="text-center text-white">
                <GraduationCap size={64} className="mx-auto mb-4 opacity-90" />
                <p className="text-4xl font-black mb-2">2,400+</p>
                <p className="text-blue-200 text-lg">Dreams Fulfilled</p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Contact / Address ─────────────────────────────────────────── */}
      <RevealSection>
        <div className="bg-gray-900 rounded-3xl p-10 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Get In Touch</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Our team is ready to answer any questions about the application process.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Office</p>
                  <p className="text-gray-400 text-sm">
                    Maximilianstraße 12, 80539 Munich, Germany
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-blue-400 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <p className="text-gray-400 text-sm">hello@studyabroad.de</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-blue-400 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Phone</p>
                  <p className="text-gray-400 text-sm">+49 89 1234 5678</p>
                </div>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
              >
                Start Your Journey <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
