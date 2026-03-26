import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, ThumbsUp, ThumbsDown, Plus, Trash2, Calendar, Clock, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import AddLocationModal from '../components/Trip/AddLocationModal';

import TripHeader from '../components/Trip/TripHeader';
import ItineraryPanel from '../components/Trip/ItineraryPanel';

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

const TripDetails = ({ trip, onBack }) => {
  const currentUserName = localStorage.getItem('userName') || localStorage.getItem('user_name') || 'Юліана';

  const [mapCenter, setMapCenter] = useState([48.3794, 31.1656]); 
  const [locations, setLocations] = useState([]);
  const [routeData, setRouteData] = useState([]); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('itinerary'); 
  const [itineraryItems, setItineraryItems] = useState([]);

  const [guideName, setGuideName] = useState(trip?.guide_name || null);
  const isGuide = guideName === currentUserName;

  const [activeDayOnMap, setActiveDayOnMap] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedLocForTime, setSelectedLocForTime] = useState(null);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [selectedDay, setSelectedDay] = useState("1"); 

  useEffect(() => {
    if (trip?.id) {
      axios.get(`http://localhost:8000/trips/${trip.id}/locations`)
        .then(response => setLocations(response.data))
        .catch(error => console.error("Помилка локацій:", error));
        
      axios.get(`http://localhost:8000/trips/${trip.id}/itinerary`)
        .then(response => setItineraryItems(response.data))
        .catch(error => console.error("Помилка розкладу:", error));
      
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email');
      if (userEmail) {
        axios.get(`http://localhost:8000/get-trips/${userEmail}`)
          .then(response => {
             const freshTrip = response.data.find(t => t.id === trip.id);
             if (freshTrip && freshTrip.guide_name !== undefined) {
                 setGuideName(freshTrip.guide_name); 
             }
          })
          .catch(error => console.error("Помилка оновлення гіда:", error));
      }
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
    const fetchOptimalRoute = async () => {
      if (!activeDayOnMap) {
        setRouteData([]);
        return;
      }

      const dayItems = itineraryItems
        .filter(item => item.day_number === parseInt(activeDayOnMap))
        .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

      if (dayItems.length < 2) {
        setRouteData([]);
        return;
      }

      const coords = dayItems.map(item => {
        const loc = locations.find(l => l.name === item.title);
        return loc ? `${loc.lng},${loc.lat}` : null;
      }).filter(c => c !== null);

      if (coords.length < 2) {
        setRouteData([]);
        return;
      }

      try {
        const response = await fetch(
          `https://router.project-osrm.org/trip/v1/walking/${coords.join(';')}?roundtrip=false&source=first&geometries=geojson`
        );
        const data = await response.json();
        if (data.trips?.[0]) {
          const coordinates = data.trips[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteData(coordinates);
        }
      } catch (error) { console.error("Помилка маршруту:", error); }
    };

    fetchOptimalRoute();
  }, [activeDayOnMap, itineraryItems, locations]);

  const handleAddLocation = async (place) => {
    const newLocData = {
      name: place.name || place.display_name.split(',')[0],
      type: place.type === 'administrative' ? 'Місто' : 'Локація',
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      author_name: currentUserName
    };
    try {
      const response = await axios.post(`http://localhost:8000/trips/${trip.id}/locations`, newLocData);
      setLocations([...locations, response.data]);
      setMapCenter([response.data.lat, response.data.lng]);
      setIsAddModalOpen(false);
    } catch (error) { console.error(error); }
  };

  const handleVote = async (id, type) => {
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email'); 
    if (!userEmail) return alert("Email не знайдено");
    try {
      const response = await axios.put(`http://localhost:8000/trips/locations/${id}/vote?type=${type}&email=${userEmail}`);
      setLocations(prev => prev.map(loc => loc.id === id ? response.data : loc));
    } catch (error) { console.error(error); }
  };

  const handleApproveLocation = async (id) => {
    try {
      setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, status: 'approved' } : loc));
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/trips/locations/${id}`);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (error) { console.error(error); }
  };

  const openTimeSelection = (loc) => {
    setSelectedLocForTime(loc);
    setSelectedDay("1"); 
    setIsTimeModalOpen(true);
  };

  const handleConfirmAddToItinerary = async () => {
    if (!selectedLocForTime) return;
    const dayNum = parseInt(selectedDay, 10) || 1;
    const isConflict = itineraryItems.some(item => item.day_number === dayNum && item.time === selectedTime);

    if (isConflict) {
      setErrorMessage(`На цей час (${selectedTime}) вже є плани!`);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      const newItem = {
        title: selectedLocForTime.name,
        category: selectedLocForTime.type === 'Місто' ? 'city' : 'place',
        time: selectedTime,
        day_number: dayNum
      };
      const response = await axios.post(`http://localhost:8000/trips/${trip.id}/itinerary`, newItem);
      setItineraryItems([...itineraryItems, response.data]);
      setIsTimeModalOpen(false);
      setSidebarTab('itinerary');
      setActiveDayOnMap(dayNum); 
    } catch (error) { console.error(error); }
  };

  const handleDeleteItineraryItem = async (itemId) => {
    try {
      await axios.delete(`http://localhost:8000/trips/itinerary/${itemId}`);
      setItineraryItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) { console.error(error); }
  };

  if (!trip) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-2xl text-black">🌍</div>;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden animate-in fade-in duration-300 font-sans text-black">
      
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-white border-4 border-black px-8 py-4 rounded-2xl shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] flex items-center gap-4 animate-in slide-in-from-top-4">
          <AlertCircle className="text-red-500" size={28} />
          <span className="font-black text-lg uppercase">{errorMessage}</span>
        </div>
      )}

      <TripHeader 
        trip={trip}
        onBack={onBack}
        activeDayOnMap={activeDayOnMap}
        setActiveDayOnMap={setActiveDayOnMap}
        currentUserName={currentUserName}
        guideName={guideName}
        setGuideName={setGuideName}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[30%] bg-white border-r-4 border-black flex flex-col shrink-0 z-10 shadow-[4px_0px_15px_rgba(0,0,0,0.05)]">
          <div className="p-6 border-b-2 border-gray-100 flex justify-between items-center bg-gray-50 text-black">
            <h2 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">Пропозиції 📋</h2>
            <span className="bg-black text-[#93E74F] text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {locations.map((loc) => {
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
                      onClick={(e) => { e.stopPropagation(); handleDelete(loc.id); }} 
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
                          onClick={(e) => { e.stopPropagation(); handleApproveLocation(loc.id); }}
                          className="flex items-center gap-1 text-[10px] font-black uppercase text-black bg-white px-2 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#93E74F] transition-all active:translate-y-0.5 active:shadow-none"
                        >
                          <CheckCircle2 size={12} /> Затвердити
                        </button>
                      )}

                      {loc.status === 'approved' && isGuide && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openTimeSelection(loc); }}
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
                    <button onClick={() => handleVote(loc.id, 'up')} className="flex-1 py-2 bg-white border-2 border-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#93E74F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black transition-all active:translate-y-0.5 active:shadow-none">
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
            <button onClick={() => setIsAddModalOpen(true)} className="w-full py-4 bg-black text-[#93E74F] border-2 border-black rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(147,231,79,1)] active:translate-y-1 active:shadow-none transition-all">
              <Plus size={24} /> Додати локацію
            </button>
          </div>
        </div>

        <div className="flex-1 relative z-0">
          {activeDayOnMap && (
            <button 
              onClick={() => setActiveDayOnMap(null)}
              className="absolute top-6 right-6 bg-black text-[#93E74F] px-5 py-3 border-2 border-black rounded-xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-gray-900"
              style={{ zIndex: 1000 }}
            >
              Всі локації
            </button>
          )}

          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
            <MapUpdater center={mapCenter} />
            {routeData.length > 0 && <Polyline positions={routeData} color="#000" weight={5} opacity={0.8} lineJoin="round" />}
            {locations.map((loc) => {
              const isInDay = itineraryItems.some(i => i.title === loc.name && i.day_number === activeDayOnMap);
              const opacity = activeDayOnMap && !isInDay ? 0.3 : 1;

              return (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} opacity={opacity}>
                  <Popup className="font-bold text-black uppercase italic">
                    <span className="block font-black">{loc.name}</span>
                    <span className="block text-[10px] text-gray-500">{loc.status === 'approved' ? '✅ В маршруті' : '⌛ Голосування'}</span>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <ItineraryPanel 
          sidebarTab={sidebarTab} 
          setSidebarTab={setSidebarTab} 
          itineraryItems={itineraryItems} 
          onDelete={handleDeleteItineraryItem}
          locations={locations}
          setActiveDayOnMap={setActiveDayOnMap}
          activeDayOnMap={activeDayOnMap}
        />
      </div>

      {isTimeModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full relative shadow-2xl border-4 border-black text-black">
            <button 
              onClick={() => setIsTimeModalOpen(false)} 
              className="absolute top-6 right-6 text-gray-500 hover:rotate-90 transition-all"
            >
              <X size={24} strokeWidth={2.5} />
            </button>

            <div className="mb-8 pr-10">
              <span className="text-[#93E74F] font-bold text-xs uppercase tracking-wider mb-2 block text-black">Додати в розклад</span>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight italic">{selectedLocForTime?.name}</h2>
            </div>
            
            <div className="flex items-center gap-4 mb-8 text-black font-black">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 italic">День подорожі</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-black text-xl text-black"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 italic">Час</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-black text-xl text-black cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleConfirmAddToItinerary}
              className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
            >
              Зберегти план
            </button>
          </div>
        </div>
      )}

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