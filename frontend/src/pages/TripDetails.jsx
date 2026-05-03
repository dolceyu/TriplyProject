import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Plus, Calendar, Clock, X, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddLocationModal from '../components/Trip/AddLocationModal';

import TripHeader from '../components/Trip/TripHeader';
import ItineraryPanel from '../components/Trip/ItineraryPanel';
import LocationsPanel from '../components/Trip/LocationsPanel'; 
import CustomMapMarker from '../components/Trip/CustomMapMarker'; 

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
    if (!trip?.id) return;

    const wsUrl = `ws://localhost:8000/ws/${trip.id}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`Підключено до WebSocket для подорожі ${trip.id}`);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.action === "refresh_locations" || data.action === "refresh_itinerary") {
          console.log("Отримано сигнал Live-оновлення! Тихо завантажуємо дані...");
          
          axios.get(`http://localhost:8000/trips/${trip.id}/locations`)
            .then(response => setLocations(response.data))
            .catch(error => console.error("Помилка фонового оновлення локацій:", error));

          axios.get(`http://localhost:8000/trips/${trip.id}/itinerary`)
            .then(response => setItineraryItems(response.data))
            .catch(error => console.error("Помилка фонового оновлення розкладу:", error));
        }
      } catch (error) {
        console.error("Помилка обробки повідомлення WebSocket:", error);
      }
    };

    socket.onclose = () => {
      console.log("Відключено від WebSocket");
    };

    return () => {
      socket.close();
    };
  }, [trip?.id]);
  
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
      setLocations(prev => [...prev, response.data]);
      setMapCenter([response.data.lat, response.data.lng]);
      setIsAddModalOpen(false);
    } catch (error) { console.error(error); }
  };

  const handleAddFromAI = async (aiPlace) => {
    try {
      console.log("1. Починаємо додавати ШІ локацію:", aiPlace);
      
      let lat = parseFloat(aiPlace.lat);
      let lng = parseFloat(aiPlace.lng);
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
         console.warn("Координати не знайдені, ставимо дефолтні");
         lat = mapCenter[0];
         lng = mapCenter[1];
      }
      
      const newLocData = {
        name: aiPlace.name,
        type: aiPlace.type || 'Локація ШІ',
        lat: lat,
        lng: lng,
        author_name: 'ШІ (' + currentUserName + ')' 
      };

      console.log("2. Відправляємо на бекенд:", newLocData);
      const response = await axios.post(`http://localhost:8000/trips/${trip.id}/locations`, newLocData);
      
      console.log("3. Збережено успішно:", response.data);
      setLocations(prev => [...prev, response.data]); 
      
      if (response.data.lat && response.data.lng && !isNaN(response.data.lat)) {
        setMapCenter([parseFloat(response.data.lat), parseFloat(response.data.lng)]);
      }
      
    } catch (error) {
      console.error("Помилка при додаванні ШІ-локації:", error);
      toast.error("Не вдалося додати локацію");
    }
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

    try {
      const newItem = {
        title: selectedLocForTime.name,
        category: selectedLocForTime.type === 'Місто' ? 'city' : 'place',
        time: null, 
        day_number: dayNum,
        location_id: selectedLocForTime.id 
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

  const handleGenerateSmartItinerary = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/trips/${trip.id}/smart-itinerary`);
      const updatedItinerary = await axios.get(`http://localhost:8000/trips/${trip.id}/itinerary`);
      setItineraryItems(updatedItinerary.data);
      setSidebarTab('itinerary');
      setActiveDayOnMap(null); 
    } catch (error) {
      console.error("Помилка смарт-маршруту:", error);
      setErrorMessage(error.response?.data?.detail || "Помилка генерації маршруту");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  if (!trip) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-2xl text-black">🌍</div>;

  const visibleLocations = locations.filter(loc => 
    !itineraryItems.some(item => item.title === loc.name)
  );

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
        
        <LocationsPanel 
          locations={visibleLocations}
          isGuide={isGuide}
          onDelete={handleDelete}
          onApprove={handleApproveLocation}
          onVote={handleVote}
          onAddToItinerary={openTimeSelection}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

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
                <CustomMapMarker 
                  key={loc.id} 
                  loc={loc} 
                  opacity={opacity} 
                />
              );
            })}
            
          </MapContainer>
        </div>

        <ItineraryPanel 
          trip={trip}
          tripId={trip.id}
          sidebarTab={sidebarTab} 
          setSidebarTab={setSidebarTab} 
          itineraryItems={itineraryItems} 
          onDelete={handleDeleteItineraryItem}
          locations={locations}
          setActiveDayOnMap={setActiveDayOnMap}
          activeDayOnMap={activeDayOnMap}
          onGenerateSmartItinerary={handleGenerateSmartItinerary} 
          onAddFromAI={handleAddFromAI}
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
            
            <div className="mb-8 text-black font-black">
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