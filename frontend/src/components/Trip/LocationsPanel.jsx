import React from 'react';
import { ThumbsUp, ThumbsDown, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const LocationsPanel = ({ 
  locations = [], 
  isGuide, 
  onDelete, 
  onApprove, 
  onVote, 
  onAddToItinerary, 
  onOpenAddModal 
}) => {
  return (
    <div className="w-[30%] bg-white border-r-4 border-black flex flex-col shrink-0 z-10 shadow-[4px_0px_15px_rgba(0,0,0,0.05)]">
      
      <div className="p-6 border-b-2 border-gray-100 flex justify-between items-center bg-gray-50 text-black">
        <h2 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">Пропозиції 📋</h2>
        <span className="bg-black text-[#93E74F] text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm">Live</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {locations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
            <CheckCircle2 size={56} className="mb-4 text-[#93E74F]" />
            <p className="font-black uppercase tracking-widest text-sm text-black">Всі пропозиції в маршруті!</p>
            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">Додайте нові локації</p>
          </div>
        ) : (
          locations.map((loc) => {
            const forVotes = loc.votes_for || 0;
            const againstVotes = loc.votes_against || 0;
            const total = forVotes + againstVotes;
            const percent = total === 0 ? 0 : Math.round((forVotes / total) * 100);

            return (
              <div key={loc.id} className={`relative p-5 border-2 rounded-2xl transition-all ${loc.status === 'approved' ? 'bg-[#93E74F]/10 border-[#93E74F]' : 'bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                
                {loc.status === 'approved' && (
                   <span className="absolute -top-3 -right-3 bg-[#93E74F] border-2 border-black text-black text-[10px] font-black px-2 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-12 z-10 uppercase tracking-tighter">ЗАТВЕРДЖЕНО</span>
                )}

                {isGuide && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(loc.id); }} 
                    className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none z-20"
                  >
                    <Trash2 size={16} strokeWidth={3} />
                  </button>
                )}

                <h3 className="font-black text-lg text-black pr-2 leading-tight">{loc.name}</h3>
                
                <div className="flex items-center gap-1.5 mt-1 mb-2 opacity-80">
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-[8px] text-[#93E74F] font-black border border-black uppercase italic">{loc.author_name?.charAt(0) || 'Ю'}</div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Додано: <span className="text-black font-black">{loc.author_name || 'Гість'}</span></p>
                </div>
                
                <div className="flex justify-between items-start mb-2 text-black">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{loc.type}</p>
                  
                  <div className="flex items-center gap-2">
                    {loc.status !== 'approved' && isGuide && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onApprove(loc.id); }}
                        className="flex items-center gap-1 text-[10px] font-black uppercase text-black bg-white px-2 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#93E74F] transition-all active:translate-y-0.5 active:shadow-none"
                      >
                        <CheckCircle2 size={12} /> Затвердити
                      </button>
                    )}

                    {loc.status === 'approved' && isGuide && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAddToItinerary(loc); }}
                        className="flex items-center gap-1 text-[10px] font-black uppercase text-black bg-[#93E74F] px-2 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#93E74F] transition-all active:translate-y-0.5 active:shadow-none"
                      >
                        <Plus size={12} /> В розклад
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex border border-black">
                    {total === 0 ? (
                      <div className="h-full w-full bg-gray-300"></div>
                    ) : (
                      <>
                        <div style={{ width: `${percent}%` }} className="h-full bg-[#93E74F] transition-all duration-500"></div>
                        <div style={{ width: `${100 - percent}%` }} className="h-full bg-red-400 transition-all duration-500"></div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onVote(loc.id, 'up')} className="flex-1 py-2 bg-white border-2 border-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#93E74F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black transition-all active:translate-y-0.5 active:shadow-none">
                    <ThumbsUp size={16} /> {forVotes}
                  </button>
                  <button onClick={() => onVote(loc.id, 'down')} className="flex-1 py-2 bg-white border-2 border-black rounded-xl flex items-center justify-center gap-2 hover:bg-red-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black transition-all active:translate-y-0.5 active:shadow-none">
                    <ThumbsDown size={16} /> {againstVotes}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-6 bg-white border-t-2 border-gray-100">
        <button onClick={onOpenAddModal} className="w-full py-4 bg-black text-[#93E74F] border-2 border-black rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(147,231,79,1)] active:translate-y-1 active:shadow-none transition-all">
          <Plus size={24} /> Додати локацію
        </button>
      </div>
    </div>
  );
};

export default LocationsPanel;