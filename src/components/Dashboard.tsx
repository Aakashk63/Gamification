import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaderboard } from './Leaderboard';
import { MentorVSBattle } from './MentorVSBattle';
import { AnnouncementPage } from './AnnouncementPage';
import { FeedbackForm } from './FeedbackForm';
import { ProfilePage } from './ProfilePage';
import { TaskPage } from './TaskPage';
import { INITIAL_TEAMS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { apiGetDashboardStats, type ApiDashboardStats } from '../lib/api';
import { useProfile } from '../contexts/ProfileContext';
import {
  Flame,
  GraduationCap,
  Trophy,
  Megaphone,
  CheckSquare,
  Coins,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Sparkles,
  HeartHandshake,
  Users,
  Activity,
  Zap,
  Pencil
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'leaderboard', path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'announcement', path: '/announcement', label: 'Announcement', icon: Megaphone },
  { id: 'task', path: '/task', label: 'Task', icon: CheckSquare },
  { id: 'redeem', path: '/redeem', label: 'Redeem Point', icon: Coins },
  { id: 'profile', path: '/profile', label: 'Profile', icon: Users },
  { id: 'feedback', path: '/feedback', label: 'Feedback', icon: MessageSquare },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from current URL path
  const activeTab = NAV_ITEMS.find(n => n.path === location.pathname)?.id || 'leaderboard';

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { profile: globalProfile, loading: profileLoading } = useProfile();
  
  // Format global profile into the structure Dashboard expects
  const profile = globalProfile ? {
    name: globalProfile.full_name,
    role: globalProfile.role,
    collegeName: 'SNS Institution',
    department: 'B.E CSE',
    avatar: globalProfile.avatar_url || (globalProfile.role === 'mentor'
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80')
  } : null;
  const [dashboardStats, setDashboardStats] = useState<ApiDashboardStats | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Ref for the profile popup container to handle click outside
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click outside to close profile dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  React.useEffect(() => {


    apiGetDashboardStats().then(setDashboardStats).catch(console.error);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const defaultLeaderboard = {
    id: 'campus-cup-2026',
    title: 'Spring Campus Championship 2026',
    season: 'Season 4 • Live Standings',
    updatedAt: 'Just now (Live Sync)',
    teams: INITIAL_TEAMS,
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#0e1320]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 lg:px-12 xl:px-16 py-2.5 transition-all">
        <div className="w-full flex items-center justify-between">
          {/* Platform Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black font-heading tracking-tight text-white flex items-center gap-1">
                  Campus<span className="text-emerald-400">XP</span>
                </h1>
                <span className="hidden sm:inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 tracking-wider">
                  Collegiate League
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Profile + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* College badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/[0.08] text-xs text-slate-300 font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              {profileLoading || !profile ? (
                <div className="w-20 h-4 bg-slate-800 animate-pulse rounded"></div>
              ) : (
                <span>{profile.collegeName}</span>
              )}
            </div>

            {/* User info & Dropdown Trigger */}
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => profile && setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-white/[0.08] cursor-pointer hover:opacity-80 transition-opacity focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={profileLoading || !profile}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-sm shrink-0">
                  {profileLoading || !profile ? (
                    <div className="w-full h-full bg-slate-800 rounded-[6px] animate-pulse"></div>
                  ) : (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-[6px]"
                    />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  {profileLoading || !profile ? (
                    <>
                      <div className="h-3 w-16 bg-slate-800 animate-pulse rounded mb-1"></div>
                      <div className="h-2 w-12 bg-slate-800 animate-pulse rounded"></div>
                    </>
                  ) : (
                    <>
                      <div className="text-[11px] font-bold text-white leading-tight">{profile.name}</div>
                      <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                        <Trophy className="w-2 h-2" />
                        <span>{profile.role} Portal</span>
                      </div>
                    </>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-white/10 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="bg-slate-800/50 px-4 py-3 border-b border-white/5">
                      <span className="text-[13px] font-bold text-slate-200 tracking-wide">My Profile</span>
                    </div>
                    <div className="p-4 relative">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-emerald-500/50 shadow-sm">
                            {(profile?.avatar?.includes('http') || profile?.avatar?.includes('data:image')) ? (
                              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              profile?.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              navigate('/profile');
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 rounded-full border border-slate-700 shadow-sm flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-white">{profile?.name || ''}</div>
                          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                            {profile?.department || 'B.E CSE'}
                          </div>
                        </div>
                        
                        <div className="ml-auto">
                           <button 
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-[11px] transition-colors border border-red-500/20 disabled:opacity-50"
                           >
                            <LogOut className="w-3.5 h-3.5" />
                            Log out
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout containing Left Sidebar & Main Content */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Side Navigation Sidebar */}
        <aside
          className={`hidden md:flex flex-col justify-between bg-[#0c101a] border-r border-white/[0.06] transition-all duration-300 ${
            isSidebarExpanded ? 'w-60' : 'w-20'
          } shrink-0 p-4 min-h-[calc(100vh-53px)]`}
        >
          {/* Sidebar Menu Items */}
          <div className="space-y-6">
            <div className={`flex items-center justify-between ${isSidebarExpanded ? 'px-2' : 'justify-center'}`}>
              {isSidebarExpanded && (
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Navigation
                </span>
              )}
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5 font-bold'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                    } ${!isSidebarExpanded ? 'justify-center' : 'justify-start'}`}
                    title={item.label}
                  >
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {isSidebarExpanded && (
                      <span className="text-sm font-medium tracking-wide truncate">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Logout */}
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent transition-all cursor-pointer ${
                !isSidebarExpanded ? 'justify-center' : 'justify-start'
              }`}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              {isSidebarExpanded && <span className="text-sm font-medium">{loggingOut ? 'Signing out...' : 'Log out'}</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c101a]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex justify-around items-center">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={item.label}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-[9px] font-medium tracking-tight truncate max-w-[70px]">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
          {/* Mobile logout in bottom nav */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-red-400 cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-tight">Logout</span>
          </button>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 space-y-4 overflow-y-auto">
            {activeTab === 'leaderboard' ? (
              <div className="space-y-4">
                {/* Live Dashboard Stats Bar */}
                {dashboardStats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full rounded-2xl bg-[#111622] border border-white/[0.06] shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Overall Leader</p>
                        <p className="text-sm sm:text-base font-black text-amber-300 tracking-wide truncate">{dashboardStats.overallLeader}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full rounded-2xl bg-[#111622] border border-white/[0.06] shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Total Teams</p>
                        <p className="text-sm sm:text-base font-black text-emerald-300">{dashboardStats.totalTeams}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full rounded-2xl bg-[#111622] border border-white/[0.06] shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Mentors Active</p>
                        <p className="text-sm sm:text-base font-black text-blue-300">{dashboardStats.activeMentorsCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full rounded-2xl bg-[#111622] border border-white/[0.06] shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Announcements</p>
                        <p className="text-sm sm:text-base font-black text-purple-300">{dashboardStats.totalAnnouncementsCount}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-start">
                  <div className="lg:col-span-1 w-full">
                    <Leaderboard initialLeaderboard={defaultLeaderboard} />
                  </div>
                  <div className="lg:col-span-1 w-full">
                    <MentorVSBattle />
                  </div>
                </div>
              </div>
            ) : activeTab === 'announcement' ? (
              <AnnouncementPage />
            ) : activeTab === 'profile' ? (
              <ProfilePage />
            ) : activeTab === 'task' ? (
              <TaskPage />
            ) : activeTab === 'feedback' ? (
              <FeedbackForm />
            ) : (
              <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black font-heading text-white tracking-wide uppercase">
                    {NAV_ITEMS.find((n) => n.id === activeTab)?.label} Section
                  </h2>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Welcome to the {NAV_ITEMS.find((n) => n.id === activeTab)?.label} board. Real-time notifications and updates from SNS Institution will render here.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#111622]/90 border border-white/[0.08] max-w-md mx-auto flex items-center gap-3 text-left">
                  <Bell className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Upcoming Release</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Integrations for {NAV_ITEMS.find((n) => n.id === activeTab)?.label} dashboard are loading.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs tracking-wider shadow-lg shadow-emerald-500/10 transition-all cursor-pointer uppercase"
                >
                  Return to Leaderboard
                </button>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/[0.06] bg-[#090d15] py-3 text-center text-[11px] text-slate-500 mt-auto">
            <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col sm:flex-row items-center justify-between gap-1">
              <span>CampusXP Collegiate Gamification Platform &copy; 2026 • SNS Institution</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 justify-center">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                <span>Made for SNS Institution Student Community</span>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
