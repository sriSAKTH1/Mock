import React, { useEffect, useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { Coffee, SkipForward } from 'lucide-react';

const BreakOverlay: React.FC = () => {
  const { isHost, endBreak, breakEndTime } = useAuction();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!breakEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((breakEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // If we are host, we might want to auto-end, but let's rely on the manual check or effect in context
        // Actually, for visual sync, hitting 0 is enough here. Context handles the logic.
      }
    }, 100);

    return () => clearInterval(interval);
  }, [breakEndTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-10 bg-ipl-gold/20 rounded-full blur-[100px] animate-pulse"></div>
        
        <div className="relative flex flex-col items-center gap-8">
            <div className="flex items-center gap-4 text-ipl-gold animate-bounce-subtle">
                <Coffee size={64} strokeWidth={1.5} />
                <h1 className="text-6xl md:text-8xl font-teko font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-ipl-gold via-yellow-200 to-ipl-gold drop-shadow-[0_0_15px_rgba(209,171,62,0.5)]">
                    Strategic Timeout
                </h1>
            </div>

            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-700/50 rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="text-9xl font-mono font-bold text-white tracking-tighter tabular-nums mb-2 text-glow">
                    {formattedTime}
                </div>
                <div className="text-slate-400 uppercase tracking-[0.5em] text-sm">Remaining</div>
            </div>

            {isHost && (
                <button 
                    onClick={endBreak}
                    className="group mt-8 flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
                >
                    <SkipForward size={24} className="group-hover:translate-x-1 transition-transform" />
                    Skip Break
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BreakOverlay;
