import React from 'react';
import type { Team, TeamMember } from '../types';
import { Crown, Sparkles, Award } from 'lucide-react';

interface LeaderboardPodiumProps {
  topTeams: Team[];
  onSelectTeam?: (team: Team) => void;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  topTeams,
  onSelectTeam,
}) => {
  // Sort and extract #1, #2, #3 safely
  const first = topTeams.find((t) => t.rank === 1) || topTeams[0];
  const second = topTeams.find((t) => t.rank === 2) || topTeams[1];
  const third = topTeams.find((t) => t.rank === 3) || topTeams[2];

  if (!first || !second || !third) {
    return null;
  }

  const renderMembers = (membersList: (TeamMember | string)[], max = 3) => {
    const list = membersList || [];
    return (
      <div className="flex items-center justify-center -space-x-1.5 my-1">
        {list.slice(0, max).map((m, idx) => {
          const avatar = typeof m === 'string' ? '' : m.avatar;
          const name = typeof m === 'string' ? m : m.name;
          return (
            <div
              key={idx}
              title={name}
              className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 rounded-full ring-1.5 ring-slate-900 overflow-hidden bg-slate-800 shadow-sm"
            >
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[8px] text-slate-300 font-bold">
                  {name.charAt(0)}
                </span>
              )}
            </div>
          );
        })}
        {list.length > max && (
          <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 rounded-full ring-1.5 ring-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
            +{list.length - max}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full relative py-1 sm:py-2">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-36 bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 blur-2xl pointer-events-none rounded-full" />

      {/* Top 3 Podium Grid Layout: #2 Left, #1 Center (Elevated), #3 Right - Compact & Fits in Viewport */}
      <div className="relative grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 items-end w-full max-w-3xl mx-auto px-1 sm:px-2">
        
        {/* ======================= #2 RANK - LEFT (SILVER) ======================= */}
        <div
          onClick={() => onSelectTeam?.(second)}
          className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
        >
          {/* Representation above pedestal */}
          <div className="relative flex flex-col items-center mb-1.5 w-full">
            {/* Rank 2 Tag */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/95 border border-slate-500/50 shadow-sm text-slate-200 text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Award className="w-2.5 h-2.5 text-slate-300" />
              <span className="font-rank text-[11px] font-black">#2</span>
            </div>

            {/* Team Crest Avatar */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-0.5 ring-2 ring-slate-400/40 shadow-md glow-silver flex items-center justify-center text-xl sm:text-2xl md:text-3xl group-hover:scale-105 transition-transform">
                <span>{second.avatar}</span>
              </div>
            </div>

            {/* Team Name */}
            <h3 className="mt-1 text-xs sm:text-sm font-black font-heading text-slate-100 uppercase tracking-wide text-center px-1 truncate max-w-full">
              {second.name}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-slate-400 text-center truncate max-w-full">
              {second.department?.split(' ')[0] || 'Engineering'}
            </p>

            {/* Team Members */}
            {renderMembers(second.members, 3)}
          </div>

          {/* Pedestal Block - Height Compact */}
          <div className="w-full h-24 sm:h-28 md:h-32 rounded-t-xl bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-[#0e1320] border-t-2 border-x border-slate-400/50 flex flex-col items-center justify-between p-1.5 sm:p-2 shadow-lg relative overflow-hidden backdrop-blur-md">
            <div className="absolute inset-0 flex justify-center items-start pt-2">
              <span className="font-rank text-4xl sm:text-5xl md:text-6xl font-black text-slate-500/20 group-hover:text-slate-400/30 transition-colors leading-none">
                2
              </span>
            </div>
            <div className="flex-1"></div>
            <div className="w-full flex flex-col items-center pb-1 z-10">
              <span className="text-xl sm:text-2xl font-black text-slate-300 tracking-wider leading-none">
                900
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">
                POINTS
              </span>
            </div>
            {/* Top edge highlight */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          </div>
        </div>

        {/* ======================= #1 RANK - CENTER (GOLD, ELEVATED) ======================= */}
        <div
          onClick={() => onSelectTeam?.(first)}
          className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-1 z-10"
        >
          {/* Crown & Elevated representation above pedestal */}
          <div className="relative flex flex-col items-center mb-1.5 w-full">
            {/* Animated Crown on Top */}
            <div className="animate-float mb-0.5">
              <div className="p-1 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 shadow-sm shadow-amber-500/30 text-slate-950 flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              </div>
            </div>

            {/* Rank 1 Tag */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-sm text-[10px] uppercase tracking-wider mb-1">
              <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
              <span className="font-rank text-xs font-black">#1 CHAMPION</span>
            </div>

            {/* Team Crest Avatar with Gold Glow Ring */}
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-gradient-to-b from-amber-400/20 via-slate-900 to-slate-950 p-1 ring-3 ring-amber-400 shadow-lg glow-gold flex items-center justify-center text-2xl sm:text-3xl md:text-4xl group-hover:scale-105 transition-transform">
                <span className="relative z-10">{first.avatar}</span>
                <div className="absolute inset-0 rounded-2xl bg-amber-400/10 blur-sm pointer-events-none" />
              </div>
            </div>

            {/* Team Name */}
            <h3 className="mt-1 text-xs sm:text-sm md:text-base font-black font-heading text-amber-300 uppercase tracking-wider text-center px-1 truncate max-w-full">
              {first.name}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-amber-200/80 font-medium text-center truncate max-w-full">
              {first.department?.split(' ')[0] || 'Champions'}
            </p>

            {/* Team Members */}
            {renderMembers(first.members, 4)}
          </div>

          {/* Pedestal Block - Highest Elevation */}
          <div className="w-full h-32 sm:h-36 md:h-44 rounded-t-xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-[#0e1320] border-t-3 border-x border-amber-400/70 flex flex-col items-center justify-between p-1.5 sm:p-2 shadow-lg relative overflow-hidden backdrop-blur-md">
            <div className="absolute inset-0 flex justify-center items-start pt-3">
              <span className="font-rank text-5xl sm:text-6xl md:text-8xl font-black text-amber-500/10 group-hover:text-amber-500/20 transition-colors leading-none">
                1
              </span>
            </div>
            <div className="flex-1"></div>
            <div className="w-full flex flex-col items-center pb-3 z-10">
              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-400 tracking-wider leading-none">
                950
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-amber-500 mt-1">
                POINTS
              </span>
            </div>
            {/* Top edge golden highlight */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 shadow-[0_0_6px_#f59e0b]" />
          </div>
        </div>

        {/* ======================= #3 RANK - RIGHT (BRONZE) ======================= */}
        <div
          onClick={() => onSelectTeam?.(third)}
          className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
        >
          {/* Representation above pedestal */}
          <div className="relative flex flex-col items-center mb-1.5 w-full">
            {/* Rank 3 Tag */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/95 border border-amber-700/50 shadow-sm text-amber-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Award className="w-2.5 h-2.5 text-amber-600" />
              <span className="font-rank text-[11px] font-black">#3</span>
            </div>

            {/* Team Crest Avatar */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-b from-amber-900/40 via-slate-800 to-slate-900 p-0.5 ring-2 ring-amber-700/50 shadow-md glow-bronze flex items-center justify-center text-xl sm:text-2xl md:text-3xl group-hover:scale-105 transition-transform">
                <span>{third.avatar}</span>
              </div>
            </div>

            {/* Team Name */}
            <h3 className="mt-1 text-xs sm:text-sm font-black font-heading text-slate-100 uppercase tracking-wide text-center px-1 truncate max-w-full">
              {third.name}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-slate-400 text-center truncate max-w-full">
              {third.department?.split(' ')[0] || 'Robotics'}
            </p>

            {/* Team Members */}
            {renderMembers(third.members, 3)}
          </div>

          {/* Pedestal Block - Height Lower */}
          <div className="w-full h-20 sm:h-24 md:h-28 rounded-t-xl bg-gradient-to-b from-amber-950/30 via-slate-900/95 to-[#0e1320] border-t-2 border-x border-amber-700/50 flex flex-col items-center justify-between p-1.5 sm:p-2 shadow-lg relative overflow-hidden backdrop-blur-md">
            <div className="absolute inset-0 flex justify-center items-start pt-2">
              <span className="font-rank text-4xl sm:text-5xl md:text-6xl font-black text-amber-700/20 group-hover:text-amber-600/30 transition-colors leading-none">
                3
              </span>
            </div>
            <div className="flex-1"></div>
            <div className="w-full flex flex-col items-center pb-1 z-10">
              <span className="text-xl sm:text-2xl font-black text-amber-600 tracking-wider leading-none">
                890
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-amber-700 mt-1">
                POINTS
              </span>
            </div>
            {/* Top edge highlight */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
          </div>
        </div>

      </div>
    </div>
  );
};
