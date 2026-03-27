import React, { useState } from 'react';
import { ArrowLeft, MapPin, Crown, X, AlertCircle, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripHeader = ({ 
  trip, 
  onBack, 
  currentUserName, 
  guideName, 
  setGuideName 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();

  const handleBecomeGuide = async () => {
    setIsLoading(true);
    try {
      await axios.patch(`http://localhost:8000/trips/${trip.id}/guide`, { guide_name: currentUserName });
      setGuideName(currentUserName); 
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setLocalError("Ой! Хтось інший вже став гідом 🏃💨");
        setGuideName(error.response.data.current_guide);
      } else {
        setLocalError("Помилка з'єднання з сервером.");
      }
      setTimeout(() => setLocalError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResignGuide = async () => {
    setIsLoading(true);
    try {
      await axios.patch(`http://localhost:8000/trips/${trip.id}/guide`, { guide_name: null });
      setGuideName(null); 
    } catch (error) {
      console.error("Помилка відміни ролі:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="h-20 bg-white border-b-4 border-black flex items-center justify-between px-6 shrink-0 z-20 text-black relative">
      
      {localError && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] flex items-center gap-2 animate-in slide-in-from-top-2">
          <AlertCircle className="text-red-500" size={18} />
          <span className="font-black text-xs uppercase">{localError}</span>
        </div>
      )}

      <div className="flex items-center gap-6">
        <button onClick={onBack} className="w-10 h-10 bg-gray-100 border-2 border-black rounded-xl flex items-center justify-center hover:bg-[#93E74F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">{trip?.title}</h1>
          <p className="text-sm font-bold text-gray-400 flex items-center gap-1"><MapPin size={14} /> {trip?.destination}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        {/* 🔴 НОВА КНОПКА БРОНЮВАНЬ */}
        <button 
          onClick={() => navigate(`/trip/${trip?.id}/bookings`)}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#93E74F] active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Ticket size={14} /> Бронювання та документи
        </button>

        {!guideName ? (
          <button 
            onClick={handleBecomeGuide}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#93E74F] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
          >
            <Crown size={14} /> Стати Гідом
          </button>
        ) : guideName === currentUserName ? (
          <div 
            onClick={handleResignGuide}
            className="flex items-center gap-2 px-4 py-2 bg-[#93E74F] border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer group hover:bg-red-400 hover:text-white transition-colors"
          >
            <Crown size={14} className="group-hover:hidden" />
            <X size={14} className="hidden group-hover:block" />
            <span className="group-hover:hidden">Гід: Ти</span>
            <span className="hidden group-hover:block">Відмовитись</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-70">
            <Crown size={14} /> Гід: {guideName}
          </div>
        )}

        <div className="w-10 h-10 rounded-full border-2 border-black bg-[#93E74F] flex items-center justify-center font-bold text-xs z-30 shadow-sm text-black uppercase">
          {currentUserName.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default TripHeader;