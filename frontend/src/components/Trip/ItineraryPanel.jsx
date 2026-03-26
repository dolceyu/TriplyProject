import React from 'react';
import { Calendar, Sparkles, Trash2, Clock, Car, Footprints, MapPin } from 'lucide-react';

const calculateLogistics = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = (R * c) * 1.35; 
  const walkMinutes = Math.round((distanceKm / 4.8) * 60); 
  const driveMinutes = Math.round((distanceKm / 35) * 60) + 3;

  return {
    dist: distanceKm.toFixed(1),
    walk: walkMinutes > 60 ? `${Math.floor(walkMinutes/60)}г ${walkMinutes%60}хв` : `${walkMinutes}хв`,
    drive: driveMinutes > 60 ? `${Math.floor(driveMinutes/60)}г ${driveMinutes%60}хв` : `${driveMinutes}хв`
  };
};

const ItineraryPanel = ({ sidebarTab, setSidebarTab, itineraryItems = [], locations = [], onDelete, setActiveDayOnMap, activeDayOnMap }) => {
  const items = Array.isArray(itineraryItems) ? itineraryItems : [];
  const grouped = items.reduce((acc, item) => {
    if (!item) return acc;
    const day = item.day_number || 1; 
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="w-[30%] min-w-[400px] bg-gray-950 text-white flex flex-col border-l-2 border-white/10 z-10 shadow-2xl font-sans h-full">
      
      <div className="p-8 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#93E74F] italic">Маршрут</h2>
          <div className="flex bg-gray-900 rounded-2xl p-1.5 border border-white/10 shadow-inner">
            <button 
              onClick={() => setSidebarTab('itinerary')} 
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all ${sidebarTab === 'itinerary' ? 'bg-[#93E74F] text-black shadow-lg shadow-[#93E74F]/20' : 'text-gray-500 hover:text-white'}`}
            >
              План
            </button>
            <button 
              onClick={() => setSidebarTab('smart')} 
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all ${sidebarTab === 'smart' ? 'bg-[#93E74F] text-black shadow-lg shadow-[#93E74F]/20' : 'text-gray-500 hover:text-white'}`}
            >
              AI
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
        {sortedDays.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
            <MapPin size={60} className="mb-4" />
            <p className="font-bold uppercase tracking-widest text-sm">Планів поки немає</p>
          </div>
        ) : (
          sortedDays.map(day => {
            const dayNum = parseInt(day);
            const dayItems = [...grouped[day]].sort((a, b) => (a?.time || "").localeCompare(b?.time || ""));
            const isDayActive = activeDayOnMap === dayNum;

            return (
              <div key={day} className="mb-12">
                
                <div 
                  onClick={() => setActiveDayOnMap(dayNum)}
                  className={`flex items-center justify-between mb-8 cursor-pointer group p-3 rounded-2xl transition-all ${isDayActive ? 'bg-[#93E74F]/10 border border-[#93E74F]/30' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`${isDayActive ? 'bg-[#93E74F]' : 'bg-white/20'} h-8 w-1.5 rounded-full transition-colors`}></div>
                    <span className={`text-xl font-black uppercase tracking-tighter transition-colors ${isDayActive ? 'text-[#93E74F]' : 'text-white'}`}>
                      День {day}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDayActive ? (
                      <span className="text-[9px] font-black text-gray-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Sparkles size={10} /> Побудувати маршрут
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-[#93E74F] uppercase tracking-widest animate-pulse flex items-center gap-1">
                        <MapPin size={10} /> На карті
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {dayItems.map((item, idx) => {
                    const currentLoc = locations.find(l => l.name === item.title);
                    const nextItem = dayItems[idx + 1];
                    const nextLoc = nextItem ? locations.find(l => l.name === nextItem.title) : null;
                    const log = currentLoc && nextLoc ? calculateLogistics(currentLoc.lat, currentLoc.lng, nextLoc.lat, nextLoc.lng) : null;

                    return (
                      <React.Fragment key={item.id || idx}>
                        <div className={`group relative bg-gray-900/50 border transition-all duration-300 p-6 rounded-[24px] shadow-lg ${isDayActive ? 'border-[#93E74F]/30 shadow-[#93E74F]/5' : 'border-white/10'}`}>
                          <button 
                            onClick={() => onDelete(item.id)} 
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20 shadow-xl"
                          >
                            <Trash2 size={14} strokeWidth={3} />
                          </button>
                          
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-lg font-bold leading-tight truncate uppercase tracking-tight">{item.title}</h4>
                            <div className={`px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-2 flex-shrink-0 transition-colors ${isDayActive ? 'bg-[#93E74F] text-black shadow-[0_0_15px_rgba(147,231,79,0.4)]' : 'bg-[#93E74F]/10 text-[#93E74F] border border-[#93E74F]/30'}`}>
                              <Clock size={14} strokeWidth={3}/> {item.time}
                            </div>
                          </div>
                        </div>

                        {log && (
                          <div className="flex flex-col items-start ml-12 py-2 relative">
                            <div className={`absolute left-[-21px] top-0 bottom-0 w-[2px] bg-gradient-to-b ${isDayActive ? 'from-[#93E74F]/50 via-[#93E74F]/10 to-[#93E74F]/50' : 'from-white/20 via-white/5 to-white/20'}`}></div>
                            
                            <div className="flex items-center gap-6 text-gray-500">
                              <div className="flex items-center gap-2 hover:text-[#93E74F] transition-colors cursor-default">
                                <Car size={16} />
                                <span className="text-xs font-black italic">{log.drive}</span>
                              </div>
                              <div className="flex items-center gap-2 hover:text-[#93E74F] transition-colors cursor-default">
                                <Footprints size={16} />
                                <span className="text-xs font-black italic">{log.walk}</span>
                              </div>
                              <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{log.dist} км</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ItineraryPanel;