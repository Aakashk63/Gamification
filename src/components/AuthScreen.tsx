import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<ApiMentor | null>(null);
  const [collegeName, setCollegeName] = useState('SNS College of Technology');
  const [dept, setDept] = useState('');
  const [registerNo, setRegisterNo] = useState('');

  // Mentor list fetched from backend API
  const [mentorList, setMentorList] = useState<ApiMentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [mentorFetchError, setMentorFetchError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch mentor list via SECURITY DEFINER RPC — works even when user is not authenticated.
  // Falls back to direct query if the RPC doesn't exist yet (before db_functions.sql is run).
  useEffect(() => {
    const fetchMentors = async () => {
      setMentorsLoading(true);
      setMentorFetchError(null);
      try {
        // Primary: use the SECURITY DEFINER RPC that bypasses RLS
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_mentor_list');

        if (!rpcError && rpcData) {
          const mapped = (rpcData as any[]).map((p) => ({
            id: p.id,
            name: p.full_name || 'Unnamed Mentor',
            avatar: p.avatar_url || '',
            role: 'mentor',
            department: ''
          }));
          setMentorFetchError(null);
          setMentorList(mapped);
          if (mapped.length === 0) {
            console.warn('get_mentor_list() returned 0 mentors. Check public.profiles.');
          }
          return;
        }

        // Fallback: direct query (requires RLS policy "Public can read mentor profiles")
        console.warn('get_mentor_list RPC not available, falling back to direct query:', rpcError?.message);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('role', 'mentor')
          .order('full_name', { ascending: true });

        if (error) {
          console.error('Mentor fetch FAILED — run src/db_functions.sql in Supabase SQL Editor:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          setMentorFetchError(`Unable to load mentors. ${error.message || 'Please try again.'}`);
          setMentorList([]);
          return;
        }

        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Unnamed Mentor',
          avatar: p.avatar_url || '',
          role: 'mentor',
          department: ''
        }));
        setMentorFetchError(null);
        setMentorList(mapped);

        if (mapped.length === 0) {
          console.warn('Mentor list empty. Run src/db_functions.sql in Supabase SQL Editor.');
        }
      } catch (err: any) {
        console.error('Mentor fetch exception:', err);
        setMentorFetchError('Unable to load mentors. Please try again.');
        setMentorList([]);
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
        // --- LOGIN via Supabase native ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailTrim,
          password: password,
        });
        
        if (error) throw error;

        // Role verification
        const userRole = data.user?.user_metadata?.role;
        if (role === 'mentor' && userRole !== 'mentor') {
          await supabase.auth.signOut();
          setErrorMsg('Authentication Error: This account is registered as a Student.');
          setLoading(false);
          return;
        }
        if (role === 'student' && userRole === 'mentor') {
          await supabase.auth.signOut();
          setErrorMsg('Authentication Error: This account is registered as a Mentor. Please log in through the Mentor screen.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Successfully Authenticated!');
        setTimeout(() => {
          onAuthSuccess(data.session);
        }, 800);

      } else {
        // --- SIGNUP via Supabase native ---
        const metadata: any = {
          name: name.trim(),
          role: effectiveRole
        };

        if (effectiveRole === 'student') {
          if (!selectedMentorId) {
            setErrorMsg("Please select your mentor before creating your account.");
            setLoading(false);
            return;
          }

          const selectedMentorObj = mentorList.find(m => m.id === selectedMentorId);
          if (!selectedMentorObj) {
            setErrorMsg("Selected mentor could not be found. Please select a valid mentor.");
            setLoading(false);
            return;
          }

          if (!dept.trim() || !registerNo.trim()) {
            setErrorMsg('All signup fields are required for Student Registration.');
            setLoading(false);
            return;
          }

          metadata.mentorName = selectedMentorObj.name;
          metadata.mentorId = selectedMentorObj.id;
          metadata.collegeName = collegeName.trim();
          metadata.department = dept.trim();
          metadata.registerNo = registerNo.trim();
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email: emailTrim,
          password: password,
          options: {
            data: metadata,
          }
        });
        
        if (signupError) throw signupError;

        // If signup was successful (new user), create the profile via SECURITY DEFINER RPC.
        // This bypasses RLS and atomically: inserts the student profile WITH mentor_id
        // AND syncs the mentor's students[] JSONB — all in one DB transaction.
        if (data.user && data.user.identities && data.user.identities.length > 0) {

          if (effectiveRole === 'student') {
            // The mentor ID was already validated above before signUp() was called.
            // resolvedMentorId is guaranteed to be a valid UUID at this point.
            const resolvedMentorId = selectedMentorId;
            const resolvedMentorName = mentorList.find(m => m.id === resolvedMentorId)?.name || '';
            const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

            // Call the SECURITY DEFINER database function.
            // This runs as the DB function owner — bypasses RLS entirely.
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              'create_student_profile',
              {
                p_user_id:     data.user.id,
                p_full_name:   name.trim(),
                p_avatar_url:  avatarUrl,
                p_mentor_id:   resolvedMentorId,
                p_department:  dept.trim() || null,
                p_college:     collegeName.trim() || null,
                p_register_no: registerNo.trim() || null
              }
            );

            if (rpcError) {
              console.error('create_student_profile RPC error:', rpcError);
              // RPC not deployed yet — fall back to direct upsert
              if (rpcError.code === 'PGRST202' || rpcError.message?.includes('Could not find the function')) {
                console.warn('Falling back to direct upsert — deploy src/db_functions.sql for reliability.');
                const { error: profileError } = await supabase
                  .from('profiles')
                  .upsert({
                    id:          data.user.id,
                    full_name:   name.trim(),
                    role:        'student',
                    avatar_url:  avatarUrl,
                    mentor_id:   resolvedMentorId,
                    mentor_name: resolvedMentorName,
                    department:  dept.trim() || null,
                    college:     collegeName.trim() || null,
                    register_no: registerNo.trim() || null,
                    students:    []
                  });

                if (profileError) {
                  console.error('Fallback upsert failed:', profileError);
                  setErrorMsg(`Profile creation failed: ${profileError.message}`);
                  setLoading(false);
                  return;
                }
              } else {
                setErrorMsg(`Profile creation failed: ${rpcError.message}`);
                setLoading(false);
                return;
              }
            } else {
              const result = rpcResult as any;
              if (result && result.success === false) {
                console.error('create_student_profile returned error:', result.error);
                setErrorMsg(result.error || 'Profile creation failed at database level.');
                setLoading(false);
                return;
              }
              console.log('Student profile created via RPC:', result);
            }

          } else {
            // MENTOR signup — use create_mentor_profile RPC
            const mentorAvatarUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80';
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              'create_mentor_profile',
              {
                p_user_id:    data.user.id,
                p_full_name:  name.trim(),
                p_avatar_url: mentorAvatarUrl
              }
            );

            if (rpcError) {
              console.warn('create_mentor_profile RPC error, falling back to direct upsert:', rpcError.message);
              await supabase.from('profiles').upsert({
                id:        data.user.id,
                full_name: name.trim(),
                role:      'mentor',
                avatar_url: mentorAvatarUrl,
                students:  []
              });
            } else {
              console.log('Mentor profile created via RPC:', rpcResult);
            }
          }

        } else {
          setErrorMsg('User already exists. Please log in.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onAuthSuccess(data.session);
        }, 800);
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

              {/* Mentor Selector — dynamically fetched from public.profiles */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select Mentor</span>
                  {mentorsLoading && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin ml-1" />}
                </label>

                {/* Show fetch error separately from empty list */}
                {mentorFetchError ? (
                  <div className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    {mentorFetchError}
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="ml-2 underline text-red-300 hover:text-red-200 cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedMentorId}
                    onChange={(e) => {
                      const mentorId = e.target.value;
                      setSelectedMentorId(mentorId);
                      const matched = mentorList.find((m) => m.id === mentorId) || null;
                      setSelectedMentor(matched);
                    }}
                    required
                    disabled={mentorsLoading}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-400/50 transition-colors disabled:opacity-60"
                  >
                    <option value="">
                      {mentorsLoading
                        ? 'Loading mentors from database...'
                        : mentorList.length === 0
                        ? 'No mentors found in database'
                        : '-- Select Your Mentor --'}
                    </option>
                    {mentorList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}

                {selectedMentor && (
                  <div className="mt-2.5 flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] backdrop-blur-xl shadow-lg">
                    <img
                      src={selectedMentor.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                      alt={selectedMentor.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/20"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{selectedMentor.name}</div>
                      <div className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider">Selected Mentor</div>
                    </div>
                  </div>
                )}
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
