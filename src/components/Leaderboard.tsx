import React, { useState, useMemo } from 'react';
import type { Team, Leaderboard as LeaderboardType } from '../types';
import { LeaderboardPodium } from './LeaderboardPodium';
import { LeaderboardList } from './LeaderboardList';
import { Search, Users, X, Sparkles, ShieldCheck, Flame } from 'lucide-react';

interface LeaderboardProps {
  initialLeaderboard: LeaderboardType;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ initialLeaderboard }) => {
  const [teamsState] = useState<Team[]>(initialLeaderboard.teams);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Sort teams automatically by rank
  const sortedTeams = useMemo(() => {
    return [...teamsState].sort((a, b) => a.rank - b.rank);
  }, [teamsState]);

  // Extract Top 3 for podium
  const top3Teams = useMemo(() => {
    return sortedTeams.slice(0, 3);
  }, [sortedTeams]);

  // Filter remaining teams based on search query
  const remainingTeams = useMemo(() => {
    const remaining = sortedTeams.slice(3);
    if (!searchQuery.trim()) return remaining;
    return remaining.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedTeams, searchQuery]);

  return (
    <div className="w-full space-y-3.5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:px-5 sm:py-2.5 rounded-2xl bg-[#111622]/90 border border-white/[0.08] backdrop-blur-xl shadow-md">
        {/* Left: Championship Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black font-heading text-white tracking-wide">
              Campus Championship Standings
            </h2>
            <p className="text-[10px] text-slate-400">
              Live ranking updates across all collegiate teams
            </p>
          </div>
        </div>

        {/* Right: Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-900/80 border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 w-full sm:w-56 transition-all"
          />
        </div>
      </div>

      {/* Main Focus: The Top 3 Podium (#2 Left, #1 Center Elevated, #3 Right) - Fits without scrolling */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#131826]/90 via-[#10141f]/95 to-[#0b0f19] border border-white/[0.08] p-3 sm:p-5 shadow-xl overflow-hidden backdrop-blur-xl">
        {/* Header subtitle */}
        <div className="text-center mb-1 sm:mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest mb-1">
            <Sparkles className="w-2.5 h-2.5" />
            Top 3 Collegiate Podium
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black font-heading text-white tracking-tight">
            Current Championship Leaders
          </h2>
        </div>

        {/* Top 3 Podium Component */}
        <LeaderboardPodium topTeams={top3Teams} onSelectTeam={(team) => setSelectedTeam(team)} />
      </section>

      {/* Remaining Teams Rankings (#4 and below) */}
      <section className="rounded-3xl bg-[#10141f]/80 border border-white/[0.06] p-3.5 sm:p-5 shadow-lg backdrop-blur-md">
        <LeaderboardList teams={remainingTeams} onSelectTeam={(team) => setSelectedTeam(team)} />
      </section>

      {/* Team Roster / Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#131826] border border-white/10 p-6 shadow-2xl space-y-5">
            {/* Close button */}
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Team Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-3xl shadow">
                {selectedTeam.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-rank text-lg font-black text-amber-400">
                    Rank #{selectedTeam.rank}
                  </span>
                  {selectedTeam.badge && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                      {selectedTeam.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black font-heading text-white">{selectedTeam.name}</h3>
                <p className="text-xs text-slate-400">{selectedTeam.department}</p>
              </div>
            </div>

            {/* Roster List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Team Roster ({selectedTeam.members.length} Members)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Collegiate Team</span>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedTeam.members.map((member, idx) => {
                  const avatar = typeof member === 'string' ? '' : member.avatar;
                  const name = typeof member === 'string' ? member : member.name;
                  const role = typeof member === 'string' ? 'Member' : member.role || 'Member';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 ring-1 ring-white/10">
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                              {name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-200">{name}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                        {role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setSelectedTeam(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Close Roster
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
