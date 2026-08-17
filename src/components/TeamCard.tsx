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
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 md:py-4.5 rounded-2xl bg-[#131825]/90 hover:bg-[#182032] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer backdrop-blur-md"
    >
      {/* Left side: Rank & Team Identity */}
      <div className="flex items-center gap-4 md:gap-5 min-w-0">
        {/* Rank Number Badge */}
        <div className="flex flex-col items-center justify-center min-w-[2.75rem] h-11 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-inner">
          <span className="font-rank text-xl font-black tracking-wider text-slate-300 group-hover:text-white transition-colors">
            #{team.rank}
          </span>
        </div>

        {/* Team Avatar Crest */}
        <div className="relative flex-shrink-0">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 group-hover:border-amber-400/40 transition-all duration-300">
            {team.avatar}
          </div>
          {team.rank <= 5 && (
            <div className="absolute -bottom-1 -right-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 rounded-full p-0.5">
              <Shield className="w-3 h-3 text-indigo-400" />
            </div>
          )}
        </div>

        {/* Team Name & Department / Tagline */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base md:text-lg font-bold font-heading text-white tracking-wide group-hover:text-amber-300 transition-colors uppercase truncate">
              {team.name}
            </h3>
            {team.badge && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                {team.badge}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-400 truncate mt-0.5">
            {team.department || team.tagline || 'Collegiate Contender'}
          </p>
        </div>
      </div>

      {/* Right side: Member Avatars & Trend indicator */}
      <div className="flex items-center justify-between md:justify-end gap-5 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
        {/* Team Member Avatars Stack */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden lg:inline font-medium">Roster</span>
          <div className="flex items-center -space-x-2.5 overflow-hidden">
            {members.slice(0, 4).map((member, idx) => {
              const memberAvatar = typeof member === 'string' ? '' : member.avatar;
              const memberName = typeof member === 'string' ? member : member.name;
              return (
                <div
                  key={idx}
                  title={memberName}
                  className="relative inline-block w-8 h-8 rounded-full ring-2 ring-[#131825] bg-slate-800 overflow-hidden shadow"
                >
                  {memberAvatar ? (
                    <img
                      src={memberAvatar}
                      alt={memberName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {memberName.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })}
            {members.length > 4 && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-[#131825] bg-slate-800 text-[11px] font-semibold text-slate-400">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Rank Trend Badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs font-semibold"
          title="Rank shift since last update"
        >
          {trend.icon}
          <span className="text-slate-300 text-xs font-mono">{trend.text}</span>
        </div>
      </div>
    </div>
  );
};
