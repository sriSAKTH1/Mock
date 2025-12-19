import React from 'react';
import { Team, Player, PlayerCategory } from '../types';
import { formatCurrency } from '../constants';
import { X } from 'lucide-react';
import { SERVER_ORIGIN } from '../services/socket';

interface TeamDetailModalProps {
  team: Team;
  allPlayers: Player[];
  onClose: () => void;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ team, allPlayers, onClose }) => {
  // Filter players belonging to this team
  // The team.players array contains player IDs
  const teamPlayers = allPlayers.filter(p => team.players.includes(p.id));

  // Group by role
  const batters = teamPlayers.filter(p => p.role === PlayerCategory.BATSMAN);
  const bowlers = teamPlayers.filter(p => p.role === PlayerCategory.BOWLER);
  const wks = teamPlayers.filter(p => p.role === PlayerCategory.WICKET_KEEPER);
  const allRounders = teamPlayers.filter(p => p.role === PlayerCategory.ALL_ROUNDER);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Header - colored based on team color */}
        <div className={`relative p-6 md:p-8 overflow-hidden ${team.color.replace('text-', 'bg-').split(' ')[0] || 'bg-blue-600'}`}>
           {/* Close Button */}
           <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20">
             <X size={24} />
           </button>
           
           {/* Background Pattern/Glow */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

           <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Logo */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-2 md:p-4 shadow-xl flex items-center justify-center shrink-0">
                  {team.logoUrl ? (
                      <img src={`${SERVER_ORIGIN}/proxy?url=${encodeURIComponent(team.logoUrl)}`} alt={team.shortName} className="w-full h-full object-contain" />
                  ) : (
                      <span className="text-3xl md:text-4xl font-bold text-black">{team.shortName}</span>
                  )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left text-white">
                  <h2 className="text-4xl md:text-7xl font-teko font-bold uppercase tracking-wide drop-shadow-lg mb-4">{team.name}</h2>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                      <div className="px-4 py-2 md:px-6 md:py-3 bg-black/30 backdrop-blur rounded-xl border border-white/10">
                          <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-70 mb-1">Purse Remaining</div>
                          <div className="text-xl md:text-2xl font-mono font-bold">{formatCurrency(team.purseRemaining)}</div>
                      </div>
                      <div className="px-4 py-2 md:px-6 md:py-3 bg-black/30 backdrop-blur rounded-xl border border-white/10">
                          <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-70 mb-1">Squad Size</div>
                          <div className="text-xl md:text-2xl font-mono font-bold">{team.squadCount}/25</div>
                      </div>
                      <div className="px-4 py-2 md:px-6 md:py-3 bg-black/30 backdrop-blur rounded-xl border border-white/10">
                          <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-70 mb-1">Overseas</div>
                          <div className="text-xl md:text-2xl font-mono font-bold">{team.overseasCount}/8</div>
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* Body - Player Lists */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                <PlayerColumn title="Batters" players={batters} count={batters.length} getInitials={getInitials} />
                <PlayerColumn title="WicketKeepers" players={wks} count={wks.length} getInitials={getInitials} />
                <PlayerColumn title="All-Rounders" players={allRounders} count={allRounders.length} getInitials={getInitials} />
                <PlayerColumn title="Bowlers" players={bowlers} count={bowlers.length} getInitials={getInitials} />
            </div>
        </div>
      </div>
    </div>
  );
};

const PlayerColumn = ({ title, players, count, getInitials }: { title: string, players: Player[], count: number, getInitials: (name: string) => string }) => (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur sticky top-0 z-10">
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs md:text-sm">{title}</h3>
            <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-full border border-slate-700">{count}</span>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
            {players.map(p => (
                <div key={p.id} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3 group hover:border-slate-500 hover:bg-slate-800 transition-all">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 text-xs font-bold text-slate-500 overflow-hidden shrink-0">
                        {p.imgUrl ? <img src={`${SERVER_ORIGIN}/proxy?url=${encodeURIComponent(p.imgUrl)}`} className="w-full h-full object-cover" /> : getInitials(p.name)}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-white text-sm leading-tight truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                             {p.soldPrice ? formatCurrency(p.soldPrice) : <span className="text-blue-400">Retained</span>}
                        </div>
                    </div>
                </div>
            ))}
            {players.length === 0 && (
                <div className="text-center py-12 text-slate-700 text-xs italic uppercase tracking-wider">Empty Slot</div>
            )}
        </div>
    </div>
);

export default TeamDetailModal;
