import React, { useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';

const AddLocationModal = ({ isOpen, onClose, onAdd, destination }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const smartQuery = `${searchQuery}, ${destination || ''}`;
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(smartQuery)}&limit=5&accept-language=uk`);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Помилка пошуку:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, destination]);

  if (!isOpen) return null;

  const handleSelectPlace = (place) => {
    onAdd(place);
    setSearchQuery(''); 
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white border-4 border-black rounded-[30px] p-8 max-w-lg w-full shadow-[12px_12px_0px_0px_rgba(163,230,53,1)] flex flex-col max-h-[80vh] zoom-in-95">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-black uppercase tracking-tight">Знайти локацію 🔍</h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-xl border-2 border-transparent hover:border-black transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-3 mb-6 shrink-0">
          <input 
            type="text" 
            placeholder="Напр. Водоспад Шипіт..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 border-2 border-black focus:bg-white rounded-xl font-bold outline-none transition-all shadow-inner text-black placeholder:text-gray-400"
            autoFocus
          />
          <div className="px-6 py-3 bg-[#A3E635] border-2 border-black rounded-xl font-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
            {isSearching ? <span className="animate-spin text-xl">⏳</span> : <Search size={20} />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
          {searchResults.length > 0 ? (
            searchResults.map((place, idx) => (
              <div key={idx} className="p-4 border-2 border-gray-200 bg-gray-50 rounded-xl hover:border-black hover:bg-white flex justify-between items-center group transition-all">
                <div className="flex-1 pr-4 overflow-hidden">
                  <h4 className="font-black text-black text-sm truncate">{place.name || place.display_name.split(',')[0]}</h4>
                  <p className="text-xs text-gray-500 truncate mt-1" title={place.display_name}>{place.display_name}</p>
                </div>
                <button 
                  onClick={() => handleSelectPlace(place)}
                  className="w-10 h-10 shrink-0 bg-white border-2 border-black rounded-lg flex items-center justify-center group-hover:bg-[#A3E635] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all text-black"
                >
                  <Plus size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
              {isSearching ? 'Шукаємо по всій планеті...' : 'Почніть вводити назву місця...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddLocationModal;