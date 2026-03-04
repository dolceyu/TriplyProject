import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, ThumbsUp, ThumbsDown, Plus, Sparkles, Trash2, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import AddLocationModal from '../components/Trip/AddLocationModal';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 1.5 });
  }, [center, map]);
  return null;
};

const getDist = (p1, p2) => Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2));

const TripDetails = ({ trip, onBack }) => {
  const [mapCenter, setMapCenter] = useState([48.3794, 31.1656]); 
  const [locations, setLocations] = useState([]);
  const [routeData, setRouteData] = useState([]); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (trip?.id) {
      axios.get(`http://localhost:8000/trips/${trip.id}/locations`)
        .then(response => {
          setLocations(response.data);
        })
        .catch(error => {
          console.error("Помилка завантаження локацій з бази:", error);
        });
    }
  }, [trip]);

  useEffect(() => {
    if (trip?.destination) {
      const fetchCoordinates = async () => {
        try {
          let query = trip.destination;
          if (query.toLowerCase().includes('карпати')) query += ', Україна'; 
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=uk`);
          const data = await response.json();
          if (data?.[0] && locations.length === 0) {
            setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        } catch (error) { console.error(error); }
      };
      fetchCoordinates();
    }
  }, [trip, locations.length]);

  useEffect(() => {
    const fetchRealRoute = async () => {
      const approved = locations.filter(loc => loc.status === 'approved');
      if (approved.length < 2) {
        setRouteData([]);
        return;
      }

      let unvisited = [...approved];
      let sorted = [unvisited.shift()];
      while (unvisited.length > 0) {
        let last = sorted[sorted.length - 1];
        unvisited.sort((a, b) => getDist(last, a) - getDist(last, b));
        sorted.push(unvisited.shift());
      }

      const coordsString = sorted.map(loc => `${loc.lng},${loc.lat}`).join(';');
      
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/walking/${coordsString}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes?.[0]) {
          const coordinates = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteData(coordinates);
        }
      } catch (error) {
        console.error("Помилка маршруту:", error);
      }
    };

    fetchRealRoute();
  }, [locations]);

  const handleAddLocation = async (place) => {
    const newLocData = {
      name: place.name || place.display_name.split(',')[0],
      type: place.type === 'administrative' ? 'Місто' : 'Локація',
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    };

    try {
      const response = await axios.post(`http://localhost:8000/trips/${trip.id}/locations`, newLocData);
      const savedLocation = response.data;
      
      setLocations([...locations, savedLocation]);
      setMapCenter([savedLocation.lat, savedLocation.lng]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Помилка збереження локації:", error);
      alert("Не вдалося зберегти локацію. Перевірте, чи працює бекенд!");
    }
  };

  const handleVote = async (id, type) => {
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email'); 

    if (!userEmail) {
      alert("Помилка: Не можемо знайти ваш Email! Спробуйте вийти з акаунту і зайти знову.");
      return;
    }

    try {
      const response = await axios.put(`http://localhost:8000/trips/locations/${id}/vote?type=${type}&email=${userEmail}`);
      const updatedLocation = response.data;

      setLocations(prev => prev.map(loc => loc.id === id ? updatedLocation : loc));
    } catch (error) {
      console.error("Помилка голосування:", error);
      alert("Не вдалося проголосувати. Перевірте, чи працює сервер.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/trips/locations/${id}`);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Помилка видалення:", error);
      alert("Не вдалося видалити. Сервер не відповідає.");
    }
  };

  if (!trip) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-2xl text-black">🌍</div>;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden animate-in fade-in duration-300">
      <header className="h-20 bg-white border-b-4 border-black flex items-center justify-between px-6 shrink-0 z-20 text-black">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 border-2 border-black rounded-xl flex items-center justify-center hover:bg-[#A3E635] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">{trip.title}</h1>
            <p className="text-sm font-bold text-gray-400 flex items-center gap-1"><MapPin size={14} /> {trip.destination}</p>
          </div>
        </div>
        <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-[#A3E635] flex items-center justify-center font-bold text-xs z-30 shadow-sm text-black uppercase">Ти</div>
            <div className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-bold text-xs z-20 shadow-sm text-black uppercase tracking-tighter">Сф</div>
            <div className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-bold text-xs z-10 shadow-sm text-black uppercase tracking-tighter">Рм</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[30%] bg-white border-r-4 border-black flex flex-col shrink-0 z-10 shadow-[4px_0px_15px_rgba(0,0,0,0.05)]">
          <div className="p-6 border-b-2 border-gray-100 flex justify-between items-center bg-gray-50 text-black">
            <h2 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">Пропозиції 📋</h2>
            <span className="bg-black text-[#A3E635] text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {locations.map((loc) => {
              const forVotes = loc.votes_for || 0;
              const againstVotes = loc.votes_against || 0;
              const total = forVotes + againstVotes;
              const percent = total === 0 ? 0 : Math.round((forVotes / total) * 100);

              return (
                <div key={loc.id} className={`relative p-5 border-2 rounded-2xl transition-all ${loc.status === 'approved' ? 'bg-[#A3E635]/10 border-[#A3E635]' : 'bg-red-50 border-red-200'}`}>
                  
                  {loc.status === 'approved' && (
                     <span className="absolute -top-3 -right-3 bg-[#A3E635] border-2 border-black text-black text-[10px] font-black px-2 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-12 z-10 uppercase tracking-tighter">ЗАТВЕРДЖЕНО</span>
                  )}

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(loc.id); }} 
                    className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none z-20"
                  >
                    <Trash2 size={16} strokeWidth={3} />
                  </button>

                  <h3 className="font-black text-lg text-black pr-2 leading-tight">{loc.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{loc.type}</p>
                  
                  <div className="mb-4">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex border border-gray-200">
                      {total === 0 ? (
                        <div className="h-full w-full bg-gray-300"></div>
                      ) : (
                        <>
                          <div style={{ width: `${percent}%` }} className="h-full bg-[#A3E635] transition-all duration-500"></div>
                          <div style={{ width: `${100 - percent}%` }} className="h-full bg-red-400 transition-all duration-500"></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleVote(loc.id, 'up')} className="flex-1 py-2 bg-white border-2 border-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#A3E635] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black transition-all active:translate-y-0.5 active:shadow-none">
                      <ThumbsUp size={16} /> {forVotes}
                    </button>
                    <button onClick={() => handleVote(loc.id, 'down')} className="flex-1 py-2 bg-white border-2 border-black rounded-xl flex items-center justify-center gap-2 hover:bg-red-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black transition-all active:translate-y-0.5 active:shadow-none">
                      <ThumbsDown size={16} /> {againstVotes}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-white border-t-2 border-gray-100">
            <button onClick={() => setIsAddModalOpen(true)} className="w-full py-4 bg-black text-[#A3E635] border-2 border-black rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] active:translate-y-1 active:shadow-none transition-all">
              <Plus size={24} /> Додати локацію
            </button>
          </div>
        </div>

        <div className="flex-1 relative z-0">
          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
            <MapUpdater center={mapCenter} />
            
            {routeData.length > 0 && (
              <Polyline positions={routeData} color="#000" weight={5} opacity={0.8} lineJoin="round" />
            )}

            {locations.map((loc) => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                <Popup className="font-bold text-black">
                  <span className="block font-black">{loc.name}</span>
                  <span className="block text-[10px] uppercase text-gray-500">{loc.status === 'approved' ? '✅ В маршруті' : '⌛ Голосування'}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="w-[20%] bg-gray-900 text-white flex flex-col p-6 border-l-4 border-black">
          <div className="flex items-center gap-2 mb-8 text-[#A3E635]"><Sparkles size={20}/><h2 className="font-black uppercase text-white">Smart Поради</h2></div>
          <div className="mt-auto bg-[#A3E635]/10 border-2 border-[#A3E635]/30 p-4 rounded-2xl text-center">
             <p className="text-[10px] text-[#A3E635] font-black uppercase tracking-widest">Оптимізовано для прогулянок</p>
          </div>
        </div>
      </div>
      <AddLocationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddLocation} 
        destination={trip?.destination} 
      />
    </div>
  );
};

export default TripDetails;