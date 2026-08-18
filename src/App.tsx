import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { AuthScreen } from './components/AuthScreen';
import { supabase } from './lib/supabase';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Loading CampusXP Secure Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthSuccess={(s) => setSession(s)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to /leaderboard */}
        <Route path="/" element={<Navigate to="/leaderboard" replace />} />
        {/* All dashboard tabs as routes */}
        <Route path="/leaderboard" element={<Dashboard key={session.user.id} />} />
        <Route path="/announcement" element={<Dashboard key={session.user.id} />} />
        <Route path="/task" element={<Dashboard key={session.user.id} />} />
        <Route path="/redeem" element={<Dashboard key={session.user.id} />} />
        <Route path="/profile" element={<Dashboard key={session.user.id} />} />
        <Route path="/feedback" element={<Dashboard key={session.user.id} />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/leaderboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
