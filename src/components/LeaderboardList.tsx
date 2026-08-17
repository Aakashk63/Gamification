import React from 'react';
import type { Team } from '../types';
import { TeamCard } from './TeamCard';
import { Layers } from 'lucide-react';

interface LeaderboardListProps {
  teams: Team[];
  onSelectTeam?: (team: Team) => void;
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({
  teams,
  onSelectTeam,
}) => {
  if (teams.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#131825]/60 border border-white/[0.06] text-slate-400">
        <p>No remaining teams match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white tracking-wide">
              Challengers Standings
            </h2>
            <p className="text-xs text-slate-400">
              Rank #{teams[0]?.rank || 4} to #{teams[teams.length - 1]?.rank || 10}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
          {teams.length} Teams Competing
        </span>
      </div>

      {/* Team Cards List: Responsive 2-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} onSelect={onSelectTeam} />
        ))}
      </div>
    </div>
  );
};
