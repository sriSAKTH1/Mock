import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { SERVER_ORIGIN } from '../services/socket';
import { LogIn } from 'lucide-react';

const TeamLogo = ({ team, className }: { team: any, className?: string }) => {
  const [error, setError] = useState(false);
  
  // Extract a hex color approximation based on team ID for the placeholder
  const getTeamColorHex = (id: string) => {
    switch(id) {
      case 't1': return 'FACC15'; // CSK Yellow
      case 't2': return '3B82F6'; // MI Blue
      case 't3': return 'DC2626'; // RCB Red
      case 't4': return '9333EA'; // KKR Purple
      case 't5': return 'F97316'; // SRH Orange
      case 't6': return 'DB2777'; // RR Pink
      case 't7': return '60A5FA'; // DC Blue
      case 't8': return '0D9488'; // GT Teal
      case 't9': return '06B6D4'; // LSG Cyan
      case 't10': return 'EF4444'; // PBKS Red
      default: return '64748B';
    }
  };

  if (error || !team.logoUrl) {
    const placeholderUrl = `https://ui-avatars.com/api/?name=${team.shortName}&background=${getTeamColorHex(team.id)}&color=fff&size=256&font-size=0.33&bold=true&length=3`;
    return <img src={placeholderUrl} alt={team.shortName} className={`${className} rounded-full`} />;
  }

  return (
    <img 
      src={`${SERVER_ORIGIN}/proxy?url=${encodeURIComponent(team.logoUrl)}`} 
      alt={team.shortName} 
      className={className} 
      onError={() => setError(true)} 
    />
  );
};

const JoinWaitingPage: React.FC = () => {
    const { teams, connectedUsers, selectTeam, enterStartedAuction, userTeamId } = useAuction();

    const handleJoin = () => {
        if (userTeamId) {
            enterStartedAuction();
        }
    };

    return (
        <div className="min-h-screen bg-ipl-dark text-white flex flex-col items-center justify-center p-4 font-roboto relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[100px] rounded-full"></div>
            </div>

            <div className="z-10 w-full max-w-4xl">
                <div className="text-center mb-12">
                     <h1 className="text-5xl md:text-7xl font-teko font-bold text-white mb-4 uppercase tracking-wider drop-shadow-lg">
                        Auction in Progress
                     </h1>
                     <p className="text-xl text-slate-300 font-light tracking-wide">
                        The auction has already started. Please select a team to join the room.
                     </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    {teams.map(team => {
                        const takenUser = connectedUsers.find(u => u.selectedTeamId === team.id);
                        const isTaken = !!takenUser;
                        const isSelected = userTeamId === team.id;

                        return (
                            <button
                                key={team.id}
                                disabled={isTaken}
                                onClick={() => selectTeam(team.id)}
                                className={`relative group p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3
                                    ${isTaken 
                                        ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed grayscale' 
                                        : isSelected 
                                            ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)] transform scale-105' 
                                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-700 hover:border-slate-500 hover:transform hover:scale-105'
                                    }
                                `}
                            >
                                <TeamLogo team={team} className="w-16 h-16 shadow-lg rounded-full" />
                                
                                <div className="text-center">
                                    <div className="font-bold text-lg leading-none mb-1">{team.shortName}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">{team.name}</div>
                                </div>

                                {isTaken && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]">
                                        <div className="bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            Taken
                                        </div>
                                    </div>
                                )}
                                
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleJoin}
                        disabled={!userTeamId}
                        className={`
                            group relative px-8 py-4 rounded-full font-bold text-xl uppercase tracking-widest transition-all duration-300 flex items-center gap-3
                            ${userTeamId 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_rgba(37,99,235,0.7)] hover:scale-105' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }
                        `}
                    >
                        <span>Join Auction Room</span>
                        <LogIn size={24} className={userTeamId ? "animate-pulse" : ""} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinWaitingPage;
