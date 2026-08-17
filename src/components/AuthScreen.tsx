import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { apiLogin, apiSignup } from '../lib/api';

// Mentor shape as fetched from Supabase profiles table
interface ApiMentor {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
}
import {
  Flame,
  User,
  GraduationCap,
  Mail,
  Lock,
  Building,
  Hash,
  ArrowRight,
  ShieldCheck,
  Activity,
  UserCheck,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'mentor'>('student');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mentorName, setMentorName] = useState('');
  const [collegeName, setCollegeName] = useState('SNS College of Technology');
  const [dept, setDept] = useState('');
  const [registerNo, setRegisterNo] = useState('');

  // Mentor list fetched from backend API
  const [mentorList, setMentorList] = useState<ApiMentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch mentor list using the Supabase RPC function get_mentors()
  useEffect(() => {
    const fetchMentors = async () => {
      setMentorsLoading(true);
      try {
        // Call the SQL function: select * from public.get_mentors()
        const { data, error } = await supabase.rpc('get_mentors');

        if (error) throw error;

        // Map RPC result rows to ApiMentor shape
        // The get_mentors() function may return: id, full_name, avatar_url, etc.
        setMentorList(
          (data || []).map((p: any) => ({
            id: p.id || p.user_id || String(Math.random()),
            name: p.full_name || p.name || 'Unnamed Mentor',
            avatar: p.avatar_url || '',
            role: 'Mentor',
            department: p.department || ''
          }))
        );
      } catch (err) {
        console.warn('Could not fetch mentors from Supabase:', err);
        setMentorList([]); // Empty — no mock fallback
      } finally {
        setMentorsLoading(false);
      }
    };
    fetchMentors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const emailTrim = email.trim();
    const emailDomain = emailTrim.split('@')[1]?.toLowerCase() || '';

    // Auto-detect mentor role from email domain
    const effectiveRole = emailDomain.endsWith('snsgroups.com') ? 'mentor' : role;

    // Mentor tab login domain check
    if (role === 'mentor' && !emailDomain.endsWith('snsgroups.com')) {
      setErrorMsg('Mentor access is restricted to @snsgroups.com email domain.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // --- LOGIN via backend API proxy → Supabase ---
        const data = await apiLogin(emailTrim, password);

        // Derive role from email domain (snsgroups.com = mentor)
        const derivedRole = emailDomain.endsWith('snsgroups.com') ? 'mentor' : 'student';
        const userRole = data.user?.user_metadata?.role || derivedRole;

        if (role === 'mentor' && userRole !== 'mentor') {
          setErrorMsg('Authentication Error: This account is registered as a Student.');
          setLoading(false);
          return;
        }
        if (role === 'student' && userRole === 'mentor') {
          setErrorMsg('Authentication Error: This account is registered as a Mentor. Please log in through the Mentor screen.');
          setLoading(false);
          return;
        }

        // Restore session in Supabase client so auth state listeners fire
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }

        setSuccessMsg('Successfully Authenticated!');
        setTimeout(() => {
          onAuthSuccess(data.session);
        }, 800);

      } else {
        // --- SIGNUP via backend API proxy → Supabase ---
        // effectiveRole is 'mentor' if email ends with @snsgroups.com, else 'student'
        const metadata: any = {
          name: name.trim(),
          role: effectiveRole
        };

        if (effectiveRole === 'student') {
          if (!mentorName.trim() || !dept.trim() || !registerNo.trim()) {
            setErrorMsg('All signup fields are required for Student Registration.');
            setLoading(false);
            return;
          }
          metadata.mentorName = mentorName.trim();
          metadata.collegeName = collegeName.trim();
          metadata.department = dept.trim();
          metadata.registerNo = registerNo.trim();
        }

        const data = await apiSignup(emailTrim, password, { data: metadata });

        // If signup was successful (new user), upsert profile into public.profiles
        if (data.user && data.user.identities && data.user.identities.length > 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: name.trim(),
              role: effectiveRole,
              avatar_url: null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (profileError) {
            console.warn('Profile upsert failed:', profileError.message);
          }
        }

        setSuccessMsg(
          data.user?.identities?.length === 0
            ? 'Account already exists. Try logging in!'
            : `Registration Successful as ${effectiveRole === 'mentor' ? 'Mentor' : 'Student'}! Please check your email to verify your account.`
        );
        setIsLogin(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      
      {/* Visual background ambient glow highlights */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-lg rounded-3xl bg-[#0f1424] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-emerald-400 fill-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-white tracking-wide uppercase">
              Campus<span className="text-emerald-400">XP</span>
            </h1>
            <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mt-0.5">
              Collegiate Gamification Portal
            </p>
          </div>
        </div>

        {/* Tab Selector: Student vs Mentor */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 rounded-2xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => { setRole('student'); setErrorMsg(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'student'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('mentor'); setErrorMsg(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'mentor'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mentor</span>
          </button>
        </div>

        {/* Form Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black font-heading text-white uppercase tracking-wide">
            {isLogin ? 'Login to Portal' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {role === 'mentor'
              ? 'Authorized SNS Groups Mentor Access Portal'
              : 'SNS Institution Student Engagement Dashboard'}
          </p>
        </div>

        {/* System messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SIGNUP ONLY: Name */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aakash K"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email ID</span>
            </label>
            <input
              type="email"
              placeholder={role === 'mentor' ? 'username@snsgroups.com' : 'username@college.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 transition-colors"
            />
          </div>

          {/* Password — with eye toggle */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* STUDENT SIGNUP ONLY FIELDS */}
          {!isLogin && role === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              {/* Register No */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Register No</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 71762104001"
                  value={registerNo}
                  onChange={(e) => setRegisterNo(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Department</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ECE / CSE / IT"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>

              {/* College Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>College Name</span>
                </label>
                <select
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                >
                  <option value="SNS College of Technology">SNS College of Technology</option>
                  <option value="SNS College of Engineering">SNS College of Engineering</option>
                  <option value="Dr. SNS Rajalakshmi College of Arts and Science">Dr. SNS Rajalakshmi College of Arts and Science</option>
                  <option value="SNS Institution">SNS Institution</option>
                </select>
              </div>

              {/* Mentor Name — dynamically fetched */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mentor Name</span>
                  {mentorsLoading && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin ml-1" />}
                </label>
                <select
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  required
                  disabled={mentorsLoading}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-400/50 transition-colors disabled:opacity-60"
                >
                  <option value="">
                    {mentorsLoading ? 'Loading mentors from DB...' : mentorList.length === 0 ? 'No mentors found' : '-- Select Your Mentor --'}
                  </option>
                  {mentorList.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing Auth...</span></>
              : <><span>{isLogin ? 'Authenticate Access' : 'Register Account'}</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        {/* Toggle between login / signup */}
        <div className="text-center pt-2 border-t border-white/[0.04]">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-slate-400 hover:text-emerald-400 text-xs font-semibold cursor-pointer transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up here" : 'Already have an account? Log in here'}
          </button>
        </div>

      </div>
    </div>
  );
};
