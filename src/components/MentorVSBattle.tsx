import React, { useState } from 'react';
import { MOCK_MENTORS } from '../data/mockData';
import { Users, Trophy, Swords, Star } from 'lucide-react';

export const MentorVSBattle: React.FC = () => {
  const [selectedMentorId, setSelectedMentorId] = useState<string>(MOCK_MENTORS[0].id);

  const selectedMentor = MOCK_MENTORS.find((m) => m.id === selectedMentorId) || MOCK_MENTORS[0];
  const { team1, team2 } = selectedMentor;

  // Combine and sort members of both teams by points for comparison table
  const allStudents = [
    ...team1.members.map((m) => ({ ...m, teamName: team1.name, teamAvatar: team1.avatar })),
    ...team2.members.map((m) => ({ ...m, teamName: team2.name, teamAvatar: team2.avatar })),
  ].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="w-full space-y-4">
      {/* Header Selector Box */}
      <div className="p-4 rounded-3xl bg-[#111622]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mentor Info */}
        <div className="flex items-center gap-3">
          <img
            src={selectedMentor.avatar}
            alt={selectedMentor.name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mentor Challenge
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {selectedMentor.department}
              </span>
            </div>
            <h3 className="text-base font-black font-heading text-white">{selectedMentor.name}</h3>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide hidden lg:inline">
            Select Mentor:
          </span>
          <select
            value={selectedMentorId}
            onChange={(e) => setSelectedMentorId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-semibold text-white focus:outline-none focus:border-emerald-400/50 cursor-pointer transition-colors"
          >
            {MOCK_MENTORS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VS Battle Arena Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#131826]/90 via-[#10141f]/95 to-[#0b0f19] border border-white/[0.08] p-5 shadow-xl backdrop-blur-xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative flex items-center justify-between gap-2 max-w-2xl mx-auto py-2">
          {/* Team 1 Side (Left) */}
          <div className="flex-1 flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/50 border border-white/[0.04]">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow">
              {team1.avatar}
            </div>
            <h4 className="mt-2 text-xs sm:text-sm font-black font-heading text-white tracking-wider uppercase">
              {team1.name}
            </h4>
            <span className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-widest">
              Team A
            </span>
          </div>

          {/* VS Divider in Center */}
          <div className="flex flex-col items-center justify-center px-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/5">
              <Swords className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 mt-1">VS</span>
          </div>

          {/* Team 2 Side (Right) */}
          <div className="flex-1 flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/50 border border-white/[0.04]">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-3xl shadow">
              {team2.avatar}
            </div>
            <h4 className="mt-2 text-xs sm:text-sm font-black font-heading text-white tracking-wider uppercase">
              {team2.name}
            </h4>
            <span className="text-[10px] font-bold text-purple-400 mt-1 uppercase tracking-widest">
              Team B
            </span>
          </div>
        </div>
      </div>

      {/* Points Table both Team 1 & Team 2 */}
      <div className="rounded-3xl bg-[#10141f]/80 border border-white/[0.06] p-4.5 shadow-xl backdrop-blur-md space-y-3">
        {/* Table Title */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black font-heading text-white uppercase tracking-wider">
                Student Points Comparison
              </h4>
              <p className="text-[10px] text-slate-400">
                Performance battle between both team members
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
            <Users className="w-3 h-3" />
            {allStudents.length} Students
          </span>
        </div>

        {/* Student Scoreboard List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {allStudents.map((student, idx) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] hover:border-emerald-500/20 transition-all duration-150"
            >
              {/* Student Identity */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Ranking Index */}
                <span className="w-4 text-[10px] font-bold text-slate-500 text-center font-mono">
                  {idx + 1}
                </span>

                <div className="relative">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                  />
                  {idx === 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow">
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate leading-tight">
                    {student.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {student.role || 'Contributor'}
                  </span>
                </div>
              </div>

              {/* Team representation & Points */}
              <div className="flex items-center gap-3">
                {/* Team Tag */}
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[100px] flex items-center gap-1 ${
                    student.teamName === team1.name
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}
                >
                  <span>{student.teamAvatar}</span>
                  <span className="hidden sm:inline">{student.teamName}</span>
                </span>

                {/* Score */}
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-emerald-400">
                    {student.points}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-semibold">PTS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
