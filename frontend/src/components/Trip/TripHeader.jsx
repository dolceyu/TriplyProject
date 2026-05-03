import React, { useState } from 'react';
import { ArrowLeft, MapPin, AlertCircle, Ticket, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import SmartMatchModal from './SmartMatchModal'; 

const TripHeader = ({ 
  trip, 
  onBack, 
  currentUserName, 
  guideName, 
  setGuideName 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showBirthdayBanner, setShowBirthdayBanner] = useState(true);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false); 
  
  const navigate = useNavigate();

  const currentUserEmail = localStorage.getItem('userEmail')?.replace(/['"]+/g, '').trim().toLowerCase();
  const isCreator = trip?.creator_email && currentUserEmail && trip.creator_email.toLowerCase() === currentUserEmail;

  const handleLeaveClick = () => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <span className="font-bold text-sm text-center text-black">Ви точно хочете покинути цю подорож? 😢</span>
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeLeave();
            }}
            className="px-4 py-2 bg-red-500 text-white border-2 border-black rounded-xl font-black text-xs hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
          >
            ТАК, ВИЙТИ
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 text-black border-2 border-black rounded-xl font-black text-xs hover:bg-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
          >
            СКАСУВАТИ
          </button>
        </div>
      </div>
    ), { duration: 10000, position: 'top-center' }); 
  };

  const executeLeave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/leave-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail, trip_id: trip.id })
      });
      
      if (res.ok) {
        toast.success("Ви успішно покинули подорож 👋");
        
        localStorage.removeItem('currentTrip');
        
        setTimeout(() => {
          navigate('/'); 
        }, 1500);
      } else {
        const error = await res.json();
        toast.error(error.detail || "Помилка при виході");
      }
    } catch (err) {
      toast.error("Сервер не відповідає");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBecomeGuide = async () => {
    setIsLoading(true);
    try {
      await axios.patch(`http://127.0.0.1:8000/trips/${trip.id}/guide`, { guide_name: currentUserName });
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
      await axios.patch(`http://127.0.0.1:8000/trips/${trip.id}/guide`, { guide_name: null });
      setGuideName(null); 
    } catch (error) {
      console.error("Помилка відміни ролі:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseDate = (d) => {
    if (!d) return null;
    if (typeof d === 'string' && d.includes('.')) {
      const parts = d.split('.');
      return new Date(parts[2] || 2000, parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const parsed = new Date(d);
    return isNaN(parsed) ? null : parsed;
  };

  const getBirthdayFriends = () => {
    if (!trip?.participants || !trip?.start_date || !trip?.end_date) return [];
    const start = parseDate(trip.start_date);
    const end = parseDate(trip.end_date);
    if (!start || !end) return [];

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return trip.participants
      .map(person => {
        const dobRaw = person.date_of_birth || person.dob || person.birth_date;
        const dob = parseDate(dobRaw);
        if (!dob) return null;

        const bdayThisYear = new Date(start.getFullYear(), dob.getMonth(), dob.getDate());
        
        if (bdayThisYear >= start && bdayThisYear <= end) {
          const day = dob.getDate();
          const monthNames = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
          const formattedDate = `${day} ${monthNames[dob.getMonth()]}`;
          return { name: person.name || person.first_name, date: formattedDate };
        }
        return null;
      })
      .filter(Boolean);
  };

  const birthdayFriends = getBirthdayFriends();

  return (
    <div className="flex flex-col w-full shrink-0 z-20">
      <header className="h-20 bg-white border-b-4 border-black flex items-center justify-between px-6 text-black relative">
        {localError && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] flex items-center gap-2">
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
          <button 
            onClick={() => navigate(`/trip/${trip?.id}/bookings`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#93E74F] active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Ticket size={14} /> Бронювання
          </button>

          {!guideName ? (
            <button 
              onClick={handleBecomeGuide} 
              disabled={isLoading} 
              className="px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#93E74F] active:translate-y-0.5 active:shadow-none transition-all"
            >
              Стати Гідом
            </button>
          ) : (
            <div 
              onClick={guideName === currentUserName ? handleResignGuide : undefined} 
              className={`px-4 py-2 border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                guideName === currentUserName 
                  ? 'bg-[#93E74F] cursor-pointer hover:bg-red-400 hover:text-white active:translate-y-0.5 active:shadow-none' 
                  : 'bg-gray-100 text-gray-500 cursor-default'
              }`}
              title={guideName === currentUserName ? "Натисніть, щоб відмовитись від ролі гіда" : `Гід цієї подорожі: ${guideName}`}
            >
              Гід: {guideName === currentUserName ? "Ти" : guideName}
            </div>
          )}

          {guideName === currentUserName && (
            <button 
              onClick={() => setIsMatchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-[#93E74F] border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:bg-gray-800 transition-all active:translate-y-0.5 active:shadow-none"
            >
              <Sparkles size={14} /> ІДЕАЛЬНА КОМПАНІЯ
            </button>
          )}

          {!isCreator && (
            <button 
              onClick={handleLeaveClick}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white hover:bg-red-600 border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
              title="Покинути подорож"
            >
              🚪 Вийти
            </button>
          )}

          <div className="w-10 h-10 rounded-full border-2 border-black bg-[#93E74F] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {currentUserName?.charAt(0)}
          </div>
        </div>
      </header>

      {showBirthdayBanner && birthdayFriends.length > 0 && (
        <div className="relative h-11 flex items-center justify-center bg-[#93E74F]/50 backdrop-blur-md border-b border-black px-6">
          <p className="text-[13px] font-black uppercase tracking-widest text-black">
            🎂 {birthdayFriends.map(f => `${f.date} у цій поїздці ${f.name} святкує свій день народження`).join(' | ')}
          </p>
          
          <button 
            onClick={() => setShowBirthdayBanner(false)}
            className="absolute right-6 text-black hover:scale-110 transition-transform"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      )}

      <SmartMatchModal 
        isOpen={isMatchModalOpen} 
        onClose={() => setIsMatchModalOpen(false)} 
        tripId={trip?.id} 
      />
    </div>
  );
};

export default TripHeader;