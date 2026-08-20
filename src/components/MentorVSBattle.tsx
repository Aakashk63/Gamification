import React, { useState, useEffect } from 'react';
import { Users, Trophy, Plus, CheckCircle, XCircle, AlertCircle, ShieldAlert, Loader2, Trash2, UserMinus, ChevronDown } from 'lucide-react';
import { 
  apiGetMentorTeams, 
  apiCreateTeam, 
  apiGetUnassignedStudents, 
  apiAddStudentToTeam, 
  apiGetMentorTeamPerformance,
  apiDeleteTeam,
  apiRemoveStudentFromTeam
} from '../lib/api';
import { useProfile } from '../contexts/ProfileContext';
import { AvatarImage } from './ui/AvatarImage';
import { supabase } from '../lib/supabase';

// Module-level cache to prevent full-page reload flashes when switching tabs
let cachedTeams: any[] | null = null;
let cachedStudents: any[] | null = null;
let cachedPerformance: any[] | null = null;

export const MentorVSBattle: React.FC = () => {
  const { profile } = useProfile();
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>(() => cachedTeams || []);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>(() => cachedStudents || []);
  const [teamPerformance, setTeamPerformance] = useState<any[]>(() => cachedPerformance || []);
  const [initialLoading, setInitialLoading] = useState(() => !cachedTeams);
  
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [assigningTeamId, setAssigningTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [orphanedCount, setOrphanedCount] = useState(0);

  // Modal states for delete / remove confirmation
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [removeStudentInfo, setRemoveStudentInfo] = useState<{ teamId: string; studentId: string; studentName: string } | null>(null);

  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const loadData = async (showInitialLoader = false) => {
    if (showInitialLoader && teams.length === 0) {
      setInitialLoading(true);
    }
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated. Please log in again.");

      // Fetch the mentor's profile from profiles
      const { data: mProfile, error: mError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, students')
        .eq('id', user.id)
        .eq('role', 'mentor')
        .single();

      if (mError) {
        console.error("Error fetching mentor profile:", mError);
        throw new Error("Unable to identify mentor profile.");
      }

      setMentorProfile(mProfile);

      // Check orphaned teams count
      try {
        const { count } = await supabase
          .from('teams')
          .select('*', { count: 'exact', head: true })
          .is('mentor_id', null);
        setOrphanedCount(count || 0);
      } catch (e) {}

      const [teamsData, studentsData, performanceData] = await Promise.all([
        apiGetMentorTeams(),
        apiGetUnassignedStudents(),
        apiGetMentorTeamPerformance()
      ]);
      setTeams(teamsData);
      setUnassignedStudents(studentsData);
      setTeamPerformance(performanceData);
      cachedTeams = teamsData;
      cachedStudents = studentsData;
      cachedPerformance = performanceData;
    } catch (err: any) {
      console.error("MentorVSBattle loadData error:", err);
      setError(err.message || 'Failed to load mentor data from Supabase.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      const user = res.data?.user;
      if (user) {
        setAuthUserId(user.id);
      } else {
        setInitialLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (authUserId) {
      loadData(!cachedTeams);
    }
  }, [authUserId]);

  useEffect(() => {
    const handleUpdate = () => {
      loadData(false);
    };
    window.addEventListener('team-invitation-status-changed', handleUpdate);
    return () => {
      window.removeEventListener('team-invitation-status-changed', handleUpdate);
    };
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || creatingTeam) return;

    const teamNameToCreate = newTeamName.trim();
    setCreatingTeam(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in again.");
        setCreatingTeam(false);
        return;
      }

      const created = await apiCreateTeam(teamNameToCreate);
      console.log("Team creation result:", created);
      setNewTeamName('');
      
      const newTeamEntry = {
        ...created,
        team_members: []
      };

      setTeams(prev => [...prev, newTeamEntry]);
      cachedTeams = [...(cachedTeams || []), newTeamEntry];

      // Add to Daily Task Monitor immediately
      const newPerformanceEntry = {
        id: created.id,
        name: created.name,
        memberCount: 0,
        members: [],
        completedCount: 0,
        totalPoints: 0
      };

      setTeamPerformance(prev => [...prev, newPerformanceEntry]);
      cachedPerformance = [...(cachedPerformance || []), newPerformanceEntry];

      // Silently refresh in background to ensure performance sync
      loadData(false);
    } catch (err: any) {
      console.error("handleCreateTeam error:", err);
      setError(err.message || 'Unable to create team. Please try again.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleAssignStudent = async (teamId: string, studentId: string) => {
    if (!studentId || assigningTeamId) return;

    setAssigningTeamId(teamId);
    setError(null);

    const student = unassignedStudents.find(s => s.id === studentId);

    try {
      await apiAddStudentToTeam(teamId, studentId);

      // Optimistically update teams and unassigned students
      if (student) {
        setUnassignedStudents(prev => {
          const updated = prev.filter(s => s.id !== studentId);
          cachedStudents = updated;
          return updated;
        });

        setTeams(prev => {
          const updated = prev.map(t => {
            if (t.id === teamId) {
              const currentMembers = t.team_members || [];
              return {
                ...t,
                team_members: [
                  ...currentMembers,
                  {
                    id: String(Math.random()),
                    team_id: teamId,
                    student_id: studentId,
                    profiles: {
                      id: student.id,
                      full_name: student.full_name,
                      avatar_url: student.avatar_url,
                      role: student.role
                    }
                  }
                ]
              };
            }
            return t;
          });
          cachedTeams = updated;
          return updated;
        });
      }

      // Background sync to update task performance
      loadData(false);
    } catch (err: any) {
      console.error("handleAssignStudent error:", err);
      setError(err.message || 'Unable to add student to team.');
    } finally {
      setAssigningTeamId(null);
    }
  };

  const handleDeleteTeamConfirm = async () => {
    if (!deleteTeamId) return;
    const teamId = deleteTeamId;
    setDeleteTeamId(null);
    try {
      await apiDeleteTeam(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      loadData(false);
    } catch (err: any) {
      console.error("handleDeleteTeam error:", err);
      setError(err.message || 'Failed to delete team.');
    }
  };

  const handleRemoveStudentConfirm = async () => {
    if (!removeStudentInfo) return;
    const { teamId, studentId } = removeStudentInfo;
    setRemoveStudentInfo(null);
    try {
      await apiRemoveStudentFromTeam(teamId, studentId);
      loadData(false);
    } catch (err: any) {
      console.error("handleRemoveStudent error:", err);
      setError(err.message || 'Failed to remove student from team.');
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

  if (initialLoading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Mentor Portal...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Selector Box (Kept visual style) */}
      <div className="p-4 rounded-3xl bg-[#111622]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AvatarImage
            src={mentorProfile?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
            alt={mentorProfile?.full_name || 'Mentor'}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mentor Portal
              </span>
            </div>
            <h3 className="text-base font-black font-heading text-white">{mentorProfile?.full_name || 'Mentor'}</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {orphanedCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Database Notice: {orphanedCount} orphaned teams (mentor_id is NULL) detected in the database. These records are excluded from your workspace.</span>
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
                disabled={creatingTeam}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!newTeamName.trim() || creatingTeam}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold text-sm disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {creatingTeam ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Teams and Unassigned Students */}
          <div className="space-y-4">
            {teams.map(team => {
              const acceptedMembers = (team.team_members || []).filter((m: any) => !m.status || m.status === 'accepted');
              const pendingMembers = (team.team_members || []).filter((m: any) => m.status === 'pending');
              const declinedMembers = (team.team_members || []).filter((m: any) => m.status === 'declined');

              return (
                <div key={team.id} className="p-5 rounded-3xl bg-[#111622]/90 border border-white/[0.08] shadow-xl relative">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-white uppercase tracking-wide">{team.name}</h5>
                      <button
                        type="button"
                        onClick={() => setDeleteTeamId(team.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      acceptedMembers.length >= 4 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {acceptedMembers.length} / 4 Members
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {/* Accepted Members */}
                    {acceptedMembers.map((m: any) => (
                      <div 
                        key={m.id || m.student_id} 
                        className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-white/[0.02] hover:border-white/[0.05] hover:bg-slate-900/80 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <AvatarImage 
                            src={m.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
                            alt={m.profiles?.full_name || 'Student'} 
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10" 
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-200">{m.profiles?.full_name || 'Student'}</div>
                            <div className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider">ACCEPTED</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRemoveStudentInfo({ teamId: team.id, studentId: m.student_id, studentName: m.profiles?.full_name || 'Student' })}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer"
                          title="Remove Student"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {acceptedMembers.length === 0 && pendingMembers.length === 0 && declinedMembers.length === 0 && (
                      <div className="text-xs text-slate-500 italic py-2">No members yet</div>
                    )}

                    {/* Pending Invitations */}
                    {pendingMembers.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Pending Invitations
                        </div>
                        {pendingMembers.map((m: any) => (
                          <div 
                            key={m.id || m.student_id} 
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/30 border border-dashed border-white/[0.06]"
                          >
                            <div className="flex items-center gap-3">
                              <AvatarImage 
                                src={m.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
                                alt={m.profiles?.full_name || 'Student'} 
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10 opacity-60" 
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-400">{m.profiles?.full_name || 'Student'}</div>
                                <div className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider">PENDING</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold text-amber-500/80 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              Invited
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Declined Invitations */}
                    {declinedMembers.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Declined Invitations
                        </div>
                        {declinedMembers.map((m: any) => (
                          <div 
                            key={m.id || m.student_id} 
                            className="flex items-center justify-between p-2.5 rounded-xl bg-red-950/10 border border-red-500/10"
                          >
                            <div className="flex items-center gap-3">
                              <AvatarImage 
                                src={m.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
                                alt={m.profiles?.full_name || 'Student'} 
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10 opacity-50" 
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-500 line-through">{m.profiles?.full_name || 'Student'}</div>
                                <div className="text-[9px] text-red-500 font-extrabold uppercase tracking-wider">DECLINED</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRemoveStudentInfo({ teamId: team.id, studentId: m.student_id, studentName: m.profiles?.full_name || 'Student' })}
                              className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                              title="Remove Declined Invite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Student Dropdown (Only if accepted + pending < 4) */}
                  {(acceptedMembers.length + pendingMembers.length) < 4 ? (
                    <CustomDropdown
                      teamId={team.id}
                      unassignedStudents={unassignedStudents}
                      assigningTeamId={assigningTeamId}
                      onSelect={(val) => handleAssignStudent(team.id, val)}
                    />
                  ) : (
                    <div className="text-center p-2.5 rounded-xl bg-slate-900/50 border border-white/[0.02] text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Team Full — 4 / 4 Members
                    </div>
                  )}
                </div>
              );
            })}

            {teams.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-[#10141f]/50 rounded-3xl border border-white/[0.04]">
                No teams created yet. Enter a name above and click Create.
              </div>
            )}
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
                      <AvatarImage 
                        src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
                        alt={m.name} 
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" 
                      />
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
                {tp.members.length === 0 && (
                  <div className="text-xs text-slate-500 italic py-2">No students assigned to this team yet</div>
                )}
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

      {/* Delete Team Confirm Modal */}
      {deleteTeamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111622] border border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wide">Delete Team?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                This will remove the team and all of its team-member assignments. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTeamId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.06] hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeamConfirm}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold transition-all text-sm cursor-pointer shadow-lg shadow-red-500/20"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Confirm Modal */}
      {removeStudentInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111622] border border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wide">Remove Student?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Are you sure you want to remove <span className="text-white font-bold">{removeStudentInfo.studentName}</span> from this team?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemoveStudentInfo(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.06] hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveStudentConfirm}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold transition-all text-sm cursor-pointer shadow-lg shadow-red-500/20"
              >
                Remove Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomDropdown: React.FC<{
  teamId: string;
  unassignedStudents: any[];
  assigningTeamId: string | null;
  onSelect: (studentIdOrName: string) => void;
}> = ({ teamId, unassignedStudents, assigningTeamId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={assigningTeamId === teamId}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-950/65 border border-white/[0.08] hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all focus:outline-none cursor-pointer backdrop-blur-md shadow-md"
      >
        <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add Student</span>
        </span>
        {assigningTeamId === teamId ? (
          <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0c101a]/95 backdrop-blur-xl shadow-2xl p-1.5 animate-in fade-in duration-150 ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 18px 2px rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {unassignedStudents.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 italic font-semibold">
              No unassigned students
            </div>
          ) : (
            unassignedStudents.map(student => (
              <button
                type="button"
                key={student.id || student.full_name}
                onClick={() => {
                  onSelect(student.id || student.full_name);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-500/10 text-left transition-colors cursor-pointer group"
              >
                <AvatarImage
                  src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={student.full_name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                    {student.full_name}
                  </div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    Student
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

