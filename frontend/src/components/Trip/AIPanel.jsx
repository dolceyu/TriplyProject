import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, MapPin, Plus, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = [
  { id: 'culture', icon: '🏛️', label: 'Культура', value: 'музеї, архітектура, історія' },
  { id: 'food', icon: '🍕', label: 'Їжа', value: 'ресторани, кафе, вулична їжа' },
  { id: 'nature', icon: '🌳', label: 'Природа', value: 'парки, сади, набережні' },
  { id: 'fun', icon: '🎉', label: 'Розваги', value: 'нічне життя, атракціони' },
];

const AIPanel = ({ tripId, onAddFromAI, destination }) => { // ДОДАВ destination В ПРОПСИ
  const [recommendations, setRecommendations] = useState(() => {
    const saved = localStorage.getItem(`ai_recs_dict_${tripId}`);
    return saved ? JSON.parse(saved) : { culture: [], food: [], nature: [], fun: [] };
  });
  
  const [activeCat, setActiveCat] = useState(() => {
    return localStorage.getItem(`ai_cat_${tripId}`) || 'culture';
  });
  
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`ai_recs_dict_${tripId}`, JSON.stringify(recommendations));
    localStorage.setItem(`ai_cat_${tripId}`, activeCat);
  }, [recommendations, activeCat, tripId]);

  const fetchIdeas = async (catId) => {
    const categoryCfg = categories.find(c => c.id === catId);
    if (!categoryCfg) return;

    setLoading(true);
    try {
      const allCurrentTitles = Object.values(recommendations).flat().map(r => r.title).join('||');
      const b_url = "http://localhost:8000";
      const a_path = `/trips/${tripId}/ai-recommendations`;
      const full_url = `${b_url}${a_path}?category=${encodeURIComponent(categoryCfg.value)}&current=${encodeURIComponent(allCurrentTitles)}`;
        
      const res = await axios.get(full_url);

      setRecommendations(prev => ({
        ...prev,
        [catId]: [...(prev[catId] || []), ...res.data]
      }));

      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 150);
    } catch (err) {
      console.error("AI Error:", err);
      toast.error("ШІ перевантажений. Спробуй ще раз.");
    } finally {
      setLoading(false);
    }
  };

  const clearCategory = () => {
    setRecommendations(prev => ({
      ...prev,
      [activeCat]: []
    }));
    toast.success(`Категорію очищено`, {
      style: { background: '#333', color: '#fff' }
    });
  };

  const handleSuggest = async (place) => {
    const toastId = toast.loading('Шукаємо локацію на карті...', { style: { background: '#333', color: '#fff' }});
    
    try {
      let lat = null;
      let lng = null;
      const smartQuery = `${place.title}, ${destination || ''}`;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(smartQuery)}&limit=1&accept-language=uk`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon); 
        }
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
      }

      await onAddFromAI({
        name: place.title,
        description: place.description,
        type: place.category,
        lat: lat, 
        lng: lng  
      });
      
      toast.success(`"${place.title}" додано на карту!`, { id: toastId, style: { background: '#333', color: '#fff' } });
      
      setRecommendations(prev => ({
        ...prev,
        [activeCat]: prev[activeCat].filter(p => p.title !== place.title)
      }));
    } catch (error) {
      toast.error("Помилка при додаванні.", { id: toastId });
    }
  };

  const activeCards = recommendations[activeCat] || [];
  const hasItems = activeCards.length > 0;

  return (
    <div className="flex flex-col h-full text-white bg-transparent p-4">
      
      <style>{`
        .custom-dark-scroll::-webkit-scrollbar { width: 5px; }
        .custom-dark-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-dark-scroll::-webkit-scrollbar-thumb { background: #1A1D24; border-radius: 10px; border: 1px solid #2D3139; }
        .custom-dark-scroll::-webkit-scrollbar-thumb:hover { background: #93E74F; }
      `}</style>

      <div className="flex justify-between items-start mb-6 shrink-0 h-[65px]">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[#93E74F] font-black text-2xl uppercase tracking-widest flex items-center gap-2 leading-none">
            <Sparkles size={24} />
            ШІ ІДЕЇ
          </h2>
          
          <div className="h-[28px] flex items-center">
            {hasItems && !loading ? (
              <button 
                onClick={clearCategory}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800 hover:border-red-500/40 hover:bg-red-500/5 transition-all"
              >
                <Trash2 size={12} className="text-gray-500 group-hover:text-red-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-red-500 transition-colors">
                  Очистити категорію
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                  Виберіть категорію
                </span>
              </div>
            )}
          </div>
        </div>
        
        {hasItems && (
          <button 
            onClick={() => fetchIdeas(activeCat)}
            disabled={loading}
            className="group flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#93E74F] bg-[#93E74F]/5 hover:bg-[#93E74F] transition-all disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(147,231,79,0.2)] hover:shadow-none mt-0.5"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-[#93E74F] group-hover:text-black" /> : <RefreshCw size={18} className="text-[#93E74F] group-hover:text-black" />}
            <span className="text-xs font-black uppercase tracking-widest text-[#93E74F] group-hover:text-black">
              {loading ? "ШУКАЮ..." : "ЩЕ ІДЕЙ"}
            </span>
          </button>
        )}
      </div>

      <div className="bg-[#1A1D24] p-1.5 rounded-2xl border-2 border-gray-800 flex gap-1 mb-6 shrink-0">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all relative ${
              activeCat === cat.id ? 'bg-[#93E74F] text-black scale-[1.02] shadow-lg' : 'text-gray-500 hover:text-white'
            }`}
          >
            <span className="text-xl mb-1">{cat.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
            {recommendations[cat.id]?.length > 0 && activeCat !== cat.id && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#93E74F] rounded-full border-2 border-[#1A1D24]"></div>
            )}
          </button>
        ))}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-2 flex flex-col custom-dark-scroll min-h-0"
      >
        {!hasItems && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-300">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#93E74F] blur-[50px] opacity-10"></div>
                <Sparkles size={60} className="text-[#93E74F] relative z-10 opacity-40 animate-pulse" />
            </div>
            <p className="font-bold uppercase tracking-[0.3em] text-[10px] mb-8 text-gray-500">У цій категорії ще порожньо</p>
            <button 
              onClick={() => fetchIdeas(activeCat)}
              className="group relative flex items-center gap-4 px-8 py-4 bg-transparent border-2 border-[#93E74F] rounded-2xl overflow-hidden transition-all duration-300 hover:bg-[#93E74F] hover:shadow-[0_0_30px_rgba(147,231,79,0.2)]"
            >
              <div className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <span className="relative z-10 font-black uppercase tracking-[0.15em] text-sm text-[#93E74F] group-hover:text-black transition-colors">Знайти ідеї</span>
              <div className="relative z-10 p-1 bg-[#93E74F] rounded-lg text-black group-hover:bg-black group-hover:text-[#93E74F] transition-colors"><Plus size={18} strokeWidth={3} /></div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            {activeCards.map((place, idx) => (
              <div key={`${activeCat}-${idx}`} className="shrink-0 bg-[#1A1D24] border-2 border-gray-800 p-6 rounded-[28px] flex justify-between items-start group hover:border-[#93E74F] transition-all shadow-lg relative overflow-hidden">
                <div className="flex-1 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <MapPin size={18} className="text-[#93E74F] shrink-0 mt-1" />
                    <h3 className="font-black text-xl uppercase tracking-tight leading-tight">{place.title}</h3>
                  </div>
                  <span className="inline-block text-[9px] bg-gray-900 border border-gray-700 px-2.5 py-1 rounded-lg text-[#93E74F] uppercase font-black mb-4 tracking-widest">{place.category}</span>
                  <p className="text-[14px] text-gray-300 font-bold leading-relaxed">{place.description}</p>
                </div>
                <button 
                  onClick={() => handleSuggest(place)}
                  className="w-12 h-12 shrink-0 bg-gray-900 border-2 border-gray-700 rounded-xl flex items-center justify-center text-white hover:bg-[#93E74F] hover:text-black transition-all shadow-md active:scale-95"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            ))}
            
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[300px]">
                 <Loader2 size={40} className="animate-spin text-[#93E74F] mb-4" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#93E74F] animate-pulse">Шукаю цікаві місця...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;