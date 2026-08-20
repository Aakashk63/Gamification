import React, { useState, useEffect } from 'react';
import { Users, Trophy, Plus, CheckCircle, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { 
  apiGetMentorTeams, 
  apiCreateTeam, 
  apiGetUnassignedStudents, 
  apiAddStudentToTeam, 
  apiGetMentorTeamPerformance 
} from '../lib/api';
import { useProfile } from '../contexts/ProfileContext';
import { AvatarImage } from './ui/AvatarImage';

export const MentorVSBattle: React.FC = () => {
  const { profile } = useProfile();
  const [teams, setTeams] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTeamName, setNewTeamName] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [teamsData, studentsData, performanceData] = await Promise.all([
        apiGetMentorTeams(),
        apiGetUnassignedStudents(),
        apiGetMentorTeamPerformance()
      ]);
      setTeams(teamsData);
      setUnassignedStudents(studentsData);
      setTeamPerformance(performanceData);
    } catch (err: any) {
      setError(err.message || 'Failed to load mentor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && profile.role === 'mentor') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await apiCreateTeam(newTeamName);
      setNewTeamName('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    }
  };

  const handleAssignStudent = async (teamId: string, studentId: string) => {
    try {
      await apiAddStudentToTeam(teamId, studentId);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign student');
    }
  };

  if (!profile || profile.role !== 'mentor') {
    return (
      <div className="p-8 text-center text-slate-400">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-emerald-500/50" />
        <p>This portal is restricted to authorized Mentors only.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Mentor Portal...</div>;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Selector Box (Kept visual style) */}
      <div className="p-4 rounded-3xl bg-[#111622]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AvatarImage
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
            alt={profile.full_name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mentor Portal
              </span>
            </div>
            <h3 className="text-base font-black font-heading text-white">{profile.full_name}</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Team Management */}
        <div className="space-y-6">
          {/* Create Team Form */}
          <div className="p-5 rounded-3xl bg-[#10141f]/80 border border-white/[0.06] shadow-xl backdrop-blur-md">
            <h4 className="text-sm font-black font-heading text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Team Management
            </h4>
            <form onSubmit={handleCreateTeam} className="flex gap-2">
              <input
                type="text"
                placeholder="New Team Name..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!newTeamName.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create
              </button>
            </form>
          </div>

          {/* Teams and Unassigned Students */}
          <div className="space-y-4">
            {teams.map(team => (
              <div key={team.id} className="p-5 rounded-3xl bg-[#111622]/90 border border-white/[0.08] shadow-xl">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-bold text-white uppercase tracking-wide">{team.name}</h5>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (team.team_members?.length || 0) >= 4 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {team.team_members?.length || 0} / 4 Members
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {(team.team_members || []).map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-white/[0.02]">
                      <AvatarImage src={m.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-sm font-semibold text-slate-200">{m.profiles?.full_name}</span>
                    </div>
                  ))}
                  {(!team.team_members || team.team_members.length === 0) && (
                    <div className="text-xs text-slate-500 italic">No members yet</div>
                  )}
                </div>

                {/* Add Student Dropdown (Only if < 4) */}
                {(team.team_members?.length || 0) < 4 ? (
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignStudent(team.id, e.target.value);
                          e.target.value = ""; // reset
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>+ Add Unassigned Student...</option>
                      {unassignedStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-center p-2 rounded-lg bg-slate-900/50 border border-white/[0.02] text-xs font-bold text-slate-500 uppercase">
                    Team Full — 4 / 4
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Daily Task Performance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black font-heading text-white uppercase tracking-wider">
                Daily Task Monitor
              </h4>
              <p className="text-[10px] text-slate-400">Today's Team Progress</p>
            </div>
          </div>

          {teamPerformance.map(tp => (
            <div key={tp.id} className="p-5 rounded-3xl bg-[#10141f]/80 border border-white/[0.06] shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-end mb-4 border-b border-white/[0.06] pb-3">
                <div>
                  <h5 className="font-bold text-white uppercase">{tp.name}</h5>
                  <div className="text-xs text-slate-400 mt-1">
                    {tp.completedCount} / {tp.memberCount} Completed • {tp.totalPoints} PTS
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {tp.memberCount > 0 ? Math.round((tp.completedCount / tp.memberCount) * 100) : 0}%
                </div>
              </div>

              <div className="space-y-2">
                {tp.members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <AvatarImage src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                      <span className="text-sm font-bold text-slate-200">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.completed ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                          <XCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                      <div className="text-right min-w-[40px]">
                        <span className="text-sm font-black font-mono text-emerald-400">{m.points}</span>
                        <span className="text-[9px] text-slate-500 block font-semibold leading-none">PTS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {teamPerformance.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-[#10141f]/50 rounded-3xl border border-white/[0.04]">
              Create teams and assign students to monitor their daily tasks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
