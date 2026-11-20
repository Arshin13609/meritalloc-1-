import { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { UserRole } from '../types';

interface AuthGateProps {
  onSubmitCredentials: (params: {
    mode: 'signin' | 'signup';
    username: string;
    password: string;
    role: UserRole;
  }) => Promise<void>;
  authError: string | null;
}

export function AuthGate({ onSubmitCredentials, authError }: AuthGateProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      setLocalError('Username must be at least 3 characters.');
      return;
    }
    if (!cleanUser.includes('@') && !/^[a-zA-Z0-9._-]+$/.test(cleanUser)) {
      setLocalError(
        'Username may only contain letters, numbers, dots, underscores, or hyphens.'
      );
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);
    try {
      await onSubmitCredentials({
        mode,
        username: cleanUser,
        password,
        role: selectedRole,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-8 space-y-6">
        <div className="space-y-1.5 border-b border-slate-200 pb-5">
          <p className="font-display text-xl font-bold tracking-tight text-slate-900">
            MeritAlloc
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 text-balance">
            Skill-Based AI Internship Allocation
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Choose your role and sign in or create an account with a username and password.
          </p>
        </div>

        {/* Role Selector */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-slate-700">1. Select Your Role</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`text-left p-4 rounded-lg border transition-colors cursor-pointer space-y-1.5 ${
                selectedRole === 'student'
                  ? 'border-blue-700 bg-blue-50/40 ring-1 ring-blue-700'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <GraduationCap
                  className={`w-4 h-4 ${
                    selectedRole === 'student' ? 'text-blue-700' : 'text-slate-600'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    selectedRole === 'student' ? 'text-blue-700' : 'text-slate-400'
                  }`}
                >
                  {selectedRole === 'student' ? 'Selected' : 'Choose'}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Student</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Save your info &amp; skills to view internships with capability %.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('recruiter')}
              className={`text-left p-4 rounded-lg border transition-colors cursor-pointer space-y-1.5 ${
                selectedRole === 'recruiter'
                  ? 'border-blue-700 bg-blue-50/40 ring-1 ring-blue-700'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Briefcase
                  className={`w-4 h-4 ${
                    selectedRole === 'recruiter' ? 'text-blue-700' : 'text-slate-600'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    selectedRole === 'recruiter' ? 'text-blue-700' : 'text-slate-400'
                  }`}
                >
                  {selectedRole === 'recruiter' ? 'Selected' : 'Choose'}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Recruiter</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Post roles and see students ranked by capability % for your role.
              </p>
            </button>
          </div>
        </div>

        {/* Sign In / Create Account Tabs */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">2. Account Credentials</p>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setLocalError(null);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setLocalError(null);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  selectedRole === 'student' ? 'e.g., ananya_cs' : 'e.g., recruiter_alex'
                }
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-sm border border-slate-300 rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {displayError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5 text-xs text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">{displayError}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              {mode === 'signin' ? 'Signing in' : 'Registering'} as{' '}
              <span className="font-semibold text-slate-800">
                {selectedRole === 'student' ? 'Student' : 'Recruiter'}
              </span>
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>
                {isSubmitting
                  ? mode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
