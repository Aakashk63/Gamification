import React from 'react';
import type { Team, TeamMember } from '../types';
import { ChevronUp, ChevronDown, Minus, Shield } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  isHovered?: boolean;
  onSelect?: (team: Team) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onSelect }) => {
  const members = (Array.isArray(team.members) ? team.members : []) as (TeamMember | string)[];

  // Calculate rank trend
  const getRankTrend = () => {
    if (!team.previousRank || team.previousRank === team.rank) {
      return { icon: <Minus className="w-3.5 h-3.5 text-slate-500" />, text: 'Same' };
    }
    if (team.previousRank > team.rank) {
      return {
        icon: <ChevronUp className="w-4 h-4 text-emerald-400 font-bold" />,
        text: `+${team.previousRank - team.rank}`,
      };
    }
    return {
      icon: <ChevronDown className="w-4 h-4 text-rose-400 font-bold" />,
      text: `-${team.rank - team.previousRank}`,
    };
  };

  const trend = getRankTrend();

  return (
    <div
      onClick={() => onSelect?.(team)}
      className="group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-[#131825]/90 hover:bg-[#182032] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer backdrop-blur-md"
    >
      {/* Left side: Rank & Identity */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {/* Rank Number Badge */}
        <div className="flex items-center justify-center min-w-[2rem] text-slate-300 group-hover:text-white transition-colors">
          <span className="font-rank text-base font-black tracking-wider">
            #{team.rank}
          </span>
        </div>

        {/* Team Avatar Crest */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-xl shadow-md group-hover:scale-105 group-hover:border-amber-400/40 transition-all duration-300">
            {team.avatar}
          </div>
        </div>

        {/* Team Name & Department / Tagline */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-heading text-white tracking-wide group-hover:text-amber-300 transition-colors uppercase truncate">
              {team.name}
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
            {team.department || team.tagline || 'Collegiate Contender'}
          </p>
        </div>
      </div>

      {/* Right side: Trend indicator */}
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        {/* Rank Trend Badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/60 border border-white/[0.06] text-[10px] font-semibold"
          title="Rank shift since last update"
        >
          {trend.icon}
          <span className="text-slate-300 font-mono">{trend.text}</span>
        </div>
      </div>
    </div>
  );
};
