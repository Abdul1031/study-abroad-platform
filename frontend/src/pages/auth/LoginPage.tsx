import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, GraduationCap, Users, Globe } from 'lucide-react';

// ── Animated stats for the brand panel ──────────────────────────────────
const brandStats = [
  { label: 'Students Helped', value: '2,400+' },
  { label: 'Universities', value: '80+' },
  { label: 'Success Rate', value: '94%' },
];

// ── Floating badge component ─────────────────────────────────────────────
function FloatingBadge({
  text,
  icon: Icon,
  delay,
  position,
}: {
  text: string;
  icon: React.ElementType;
  delay: number;
  position: string;
}) {
  return (
    <motion.div
      className={`absolute ${position} glass rounded-xl px-3 py-2 flex items-center gap-2 text-white text-sm font-medium shadow-lg`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
    >
      <Icon size={16} className="text-blue-300" />
      <span>{text}</span>
    </motion.div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT: Brand Panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 animated-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-300 opacity-10 rounded-full translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <GraduationCap className="text-blue-600" size={22} />
            </div>
            <h1 className="text-white text-2xl font-bold font-outfit">StudyAbroad.de</h1>
          </div>
          <p className="text-blue-200 text-sm">Your AI-powered gateway to German universities</p>
        </motion.div>

        {/* Main hero text */}
        <motion.div
          className="relative z-10 space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <div>
            <h2 className="text-white text-5xl font-bold leading-tight mb-4">
              Begin Your
              <br />
              <span className="text-blue-200">German Journey</span>
              <br />
              Today
            </h2>
            <p className="text-blue-100 text-lg max-w-sm leading-relaxed">
              Join thousands of students who secured their dream university in Germany with
              personalized AI guidance.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {brandStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="glass rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Floating badges */}
        <FloatingBadge
          text="TU Munich Accepted!"
          icon={GraduationCap}
          delay={0.8}
          position="top-32 right-12"
        />
        <FloatingBadge text="2,400+ Students" icon={Users} delay={1.0} position="top-56 right-8" />
        <FloatingBadge
          text="80+ Universities"
          icon={Globe}
          delay={1.2}
          position="bottom-40 right-12"
        />

        {/* Review quote */}
        <motion.div
          className="relative z-10 glass rounded-2xl p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-white text-sm italic leading-relaxed mb-3">
            &ldquo;StudyAbroad.de made my dream of studying Computer Science at TU Munich a reality.
            The AI recommendations were spot-on!&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-blue-900 font-bold text-sm">
              A
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Arjun Sharma</p>
              <p className="text-blue-300 text-xs">TU Munich, CS MSc</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT: Login Form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <GraduationCap className="text-blue-600" size={28} />
            <span className="text-2xl font-bold text-gray-900">StudyAbroad.de</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500">Sign in to continue your study abroad journey</p>
          </div>

          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="text-blue-600 font-semibold hover:text-blue-700 transition"
            >
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
