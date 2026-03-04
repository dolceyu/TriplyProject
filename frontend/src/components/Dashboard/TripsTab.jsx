import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TripDetails from '../../pages/TripDetails';

const UserAvatar = ({ email, name, size = "w-8 h-8", textSize = "text-xs", customClass = "" }) => {
  const [imgError, setImgError] = useState(false);
  
  const isValidEmail = email && email !== "undefined";
  const avatarSrc = isValidEmail ? `http://127.0.0.1:8000/get-avatar/${email}?t=${Date.now()}` : null;
  
  const initial = name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`${size} rounded-full flex items-center justify-center overflow-hidden border-2 border-inherit shrink-0 bg-gray-100 ${customClass}`}>
      {!imgError && avatarSrc ? (
        <img 
          src={avatarSrc} 
          alt={initial} 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${textSize} font-bold text-gray-500 select-none`}>
          {initial}
        </span>
      )}
    </div>
  );
};

const TripsTab = () => {
  const userEmail = localStorage.getItem('userEmail');
  
  const [selectedTrip, setSelectedTrip] = useState(() => {
    const saved = localStorage.getItem('currentTrip');
    return saved ? JSON.parse(saved) : null;
  });
  useEffect(() => {
    if (selectedTrip) {
      localStorage.setItem('currentTrip', JSON.stringify(selectedTrip));
    } else {
      localStorage.removeItem('currentTrip');
    }
  }, [selectedTrip]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false); 
  
  const [friends, setFriends] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  
  const [editingTripId, setEditingTripId] = useState(null);
  const [tripInfo, setTripInfo] = useState({ title: '', destination: '', start: '', end: '' });
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [tripCode, setTripCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState(''); 

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const fetchTrips = async () => {
    setIsLoadingTrips(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/get-trips/${userEmail}`);
      if (res.ok) {
        const data = await res.json();
        
        const sortedData = data.sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date) : new Date('9999-12-31');
          const dateB = b.start_date ? new Date(b.start_date) : new Date('9999-12-31');
          return dateA - dateB;
        });

        setTrips(sortedData);
      }
    } catch (err) {
      console.error("Помилка завантаження подорожей:", err);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchTrips();
      fetch(`http://127.0.0.1:8000/get-friends/${userEmail}`)
        .then(res => res.json())
        .then(data => setFriends(data))
        .catch(err => console.error("Помилка завантаження друзів:", err));
    }
  }, [userEmail]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const toggleFriend = (email) => {
    setSelectedFriends(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleOpenCreateModal = () => {
    setEditingTripId(null); 
    setTripCode(generateCode()); 
    setTripInfo({ title: '', destination: '', start: '', end: '' });
    setSelectedFriends([]);
    setSelectedFile(null);
    setPreview(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (trip, e) => {
    e.stopPropagation(); 
    setEditingTripId(trip.id);
    setTripCode(trip.trip_code); 
    setTripInfo({ 
      title: trip.title, 
      destination: trip.destination, 
      start: trip.start_date || '', 
      end: trip.end_date || '' 
    });
    
    const participantEmails = trip.participants 
      ? trip.participants.map(p => typeof p === 'string' ? p : p.email) 
      : [];
    setSelectedFriends(participantEmails);
    
    if (trip.has_image) {
      setPreview(`http://127.0.0.1:8000/get-trip-image/${trip.id}?t=${Date.now()}`);
    } else {
      setPreview(null);
    }
    
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (tripId, e) => {
    e.stopPropagation();
    if (window.confirm("Ви впевнені, що хочете видалити цю подорож назавжди?")) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/delete-trip/${tripId}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success("Подорож видалено! 🗑️");
          fetchTrips();
        } else {
          toast.error("Помилка видалення");
        }
      } catch (err) {
        toast.error("Сервер не відповідає");
      }
    }
  };

  const handleSave = async () => {
    if (!tripInfo.title || !tripInfo.destination || !tripInfo.start || !tripInfo.end) {
      toast.error("Заповніть всі обов'язкові поля!");
      return;
    }

    setIsCreating(true);
    const formData = new FormData();
    
    const data = {
      title: tripInfo.title,
      destination: tripInfo.destination,
      start_date: tripInfo.start,
      end_date: tripInfo.end,
      trip_code: tripCode, 
      creator_email: userEmail,
      participants: selectedFriends
    };
    
    formData.append('trip_data', JSON.stringify(data));
    if (selectedFile) formData.append('file', selectedFile);

    const url = editingTripId 
      ? `http://127.0.0.1:8000/update-trip/${editingTripId}` 
      : 'http://127.0.0.1:8000/create-trip';
    const method = editingTripId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, body: formData });

      if (res.ok) {
        toast.success(editingTripId ? "Зміни збережено! 💾" : `Подорож створена! Код: ${tripCode} ✈️`);
        setIsModalOpen(false);
        fetchTrips(); 
      } else {
        const error = await res.json();
        toast.error(error.detail || "Помилка при збереженні");
      }
    } catch (err) {
      toast.error("Сервер не відповідає");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTrip = async () => {
    if (joinCodeInput.length !== 6) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/join-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, trip_code: joinCodeInput })
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        setIsJoinModalOpen(false);
        setJoinCodeInput('');
        fetchTrips(); 
      } else {
        toast.error(data.detail);
      }
    } catch (err) {
      toast.error("Сервер не відповідає");
    }
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(`Код ${code} скопійовано! 📋`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (selectedTrip) {
    return <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-black">Мої подорожі</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="px-8 py-4 bg-white border-2 border-black rounded-2xl font-bold text-lg hover:bg-gray-50 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
          >
            # Приєднатися за кодом
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="px-8 py-4 bg-[#A3E635] border-2 border-black rounded-2xl font-bold text-lg hover:bg-[#92d624] transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
          >
            + Створити подорож
          </button>
        </div>
      </div>

      {isLoadingTrips ? (
        <div className="flex justify-center py-20">
          <span className="text-4xl animate-bounce">✈️</span>
        </div>
      ) : trips.length > 0 ? (
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trips.map(trip => {
            const isCreator = trip.creator_email && userEmail && 
                              String(trip.creator_email).toLowerCase().trim() === String(userEmail).toLowerCase().trim();
            
            const canEdit = true;

            return (
              <div 
                key={trip.id} 
                onClick={() => setSelectedTrip(trip)} 
                className="bg-white border-4 border-black rounded-[30px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
              >
                <div className="h-56 bg-gray-100 border-b-4 border-black relative overflow-hidden">
                  {trip.has_image ? (
                    <img 
                      src={`http://127.0.0.1:8000/get-trip-image/${trip.id}?t=${Date.now()}`} 
                      alt={trip.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#A3E635]/20">
                      <span className="text-6xl">🌍</span>
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    {canEdit && (
                      <button 
                        onClick={(e) => handleEditClick(trip, e)} 
                        className="w-11 h-11 bg-white border-2 border-black rounded-xl hover:bg-[#A3E635] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-lg active:translate-y-0.5 active:shadow-none transition-all"
                        title="Редагувати"
                      >
                        ✏️
                      </button>
                    )}
                    {isCreator && (
                      <button 
                        onClick={(e) => handleDeleteClick(trip.id, e)} 
                        className="w-11 h-11 bg-white border-2 border-black rounded-xl hover:bg-red-500 hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-lg active:translate-y-0.5 active:shadow-none transition-all"
                        title="Видалити"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={(e) => handleCopyCode(trip.trip_code, e)}
                    className="absolute top-4 right-4 bg-white border-2 border-black px-3 py-1.5 rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#A3E635] transition-colors active:translate-y-0.5 active:shadow-none z-10 cursor-pointer"
                    title="Натисніть, щоб скопіювати код"
                  >
                    КОД: {trip.trip_code}
                  </button>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-black text-black leading-tight mb-1 flex items-center gap-2">
                        {trip.title}
                        {isCreator && (
                          <span className="text-xl" title="Ви організатор цієї подорожі">👑</span>
                        )}
                      </h3>
                      <p className="font-bold text-gray-500 flex items-center gap-1">
                        <span>📍</span> {trip.destination}
                      </p>
                    </div>
                  </div>

                  {trip.participants && trip.participants.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Їдуть:</span>
                      <div className="flex -space-x-2">
                        {trip.participants.map((p, index) => {
                          const pEmail = typeof p === 'string' ? p : p.email;
                          const pName = typeof p === 'string' ? p : p.name;
                          
                          return (
                            <div key={index} title={pName} className="relative z-10">
                               <UserAvatar 
                                 email={pEmail} 
                                 name={pName} 
                                 size="w-7 h-7" 
                                 textSize="text-[10px]" 
                                 customClass="border-2 border-white"
                               />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-dashed border-gray-200">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Дати</span>
                      <span className="font-bold text-sm text-black">
                        {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                      </span>
                    </div>
                    <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#A3E635] hover:text-black transition-colors">
                      →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        <div className="bg-white rounded-[40px] p-20 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center animate-in fade-in">
          <div className="w-64 h-64 bg-gray-50 rounded-full mb-8 flex items-center justify-center">
            <span className="text-6xl">✈️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Ще немає активних подорожей</h2>
          <p className="text-gray-500 max-w-sm">Створіть свою першу подорож і запросіть друзів, щоб почати планування!</p>
        </div>
      )}

      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white border-4 border-black rounded-[40px] p-10 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(163,230,53,1)] slide-in-from-bottom-4">
            <h2 className="text-3xl font-black text-black mb-6 text-center">Введіть код 🎟️</h2>
            <p className="text-gray-500 font-medium text-center mb-6">
              Запитайте 6-значний код у організатора подорожі.
            </p>
            <input 
              type="text" 
              maxLength={6}
              placeholder="НАПР. 1Z92S1" 
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="w-full px-6 py-5 bg-gray-50 border-2 border-black focus:bg-white rounded-2xl font-black text-2xl outline-none transition-all shadow-inner text-black text-center tracking-widest uppercase mb-8"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => { setIsJoinModalOpen(false); setJoinCodeInput(''); }} 
                className="w-1/2 py-4 bg-gray-100 hover:bg-gray-200 border-2 border-transparent rounded-2xl font-black text-lg text-gray-500 transition-all active:scale-95"
              >
                Скасувати
              </button>
              <button 
                onClick={handleJoinTrip} 
                disabled={joinCodeInput.length < 6}
                className="w-1/2 py-4 bg-black hover:bg-gray-800 border-2 border-black rounded-2xl font-black text-lg text-[#A3E635] transition-all shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Увійти
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white border-4 border-black rounded-[40px] p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(163,230,53,1)] slide-in-from-bottom-4">
            
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-black text-black">
                {editingTripId ? 'Редагувати подорож ✍️' : 'Створити нову пригоду 🌍'}
              </h2>

              <div 
                className="bg-gray-100 hover:bg-[#A3E635] cursor-pointer px-5 py-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-colors active:translate-y-0.5 active:shadow-none"
                onClick={(e) => handleCopyCode(tripCode, e)}
                title="Натисніть, щоб скопіювати"
              >
                <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Код:</span>
                <span className="text-xl font-black text-black tracking-widest">{tripCode}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
              <div className="md:col-span-2 flex flex-col gap-4">
                <div 
                  className="w-full h-72 bg-gray-50 border-4 border-dashed border-gray-300 rounded-[30px] overflow-hidden relative group cursor-pointer hover:border-[#A3E635] transition-all"
                  onClick={() => document.getElementById('trip-photo').click()}
                >
                  {preview ? (
                    <div className="relative w-full h-full">
                      <img src={preview} alt="Trip preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-white font-bold text-lg">Змінити фото</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-[#A3E635] transition-colors p-6 text-center">
                      <span className="text-6xl mb-4">📸</span>
                      <span className="font-bold text-lg">Обкладинка подорожі</span>
                    </div>
                  )}
                  <input id="trip-photo" type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col gap-5">
                <input 
                  type="text" 
                  placeholder="Назва подорожі" 
                  value={tripInfo.title}
                  onChange={(e) => setTripInfo({...tripInfo, title: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#A3E635] focus:bg-white rounded-2xl font-bold text-lg outline-none transition-all shadow-inner text-black"
                />
                <input 
                  type="text" 
                  placeholder="Локація" 
                  value={tripInfo.destination}
                  onChange={(e) => setTripInfo({...tripInfo, destination: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#A3E635] focus:bg-white rounded-2xl font-bold text-lg outline-none transition-all shadow-inner text-black"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="date" 
                    value={tripInfo.start}
                    onChange={(e) => setTripInfo({...tripInfo, start: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#A3E635] focus:bg-white rounded-2xl font-bold text-lg outline-none transition-all shadow-inner" 
                  />
                  <input 
                    type="date" 
                    value={tripInfo.end}
                    onChange={(e) => setTripInfo({...tripInfo, end: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#A3E635] focus:bg-white rounded-2xl font-bold text-lg outline-none transition-all shadow-inner" 
                  />
                </div>

                {friends.length > 0 && (
                  <div className="mt-2 bg-gray-50 p-5 rounded-[25px] border-2 border-gray-100">
                    <h3 className="font-black mb-4 text-sm text-gray-500 uppercase tracking-widest text-center">Взяти з собою:</h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {friends.map(friend => {
                        const isSelected = selectedFriends.includes(friend.email);
                        return (
                          <button 
                            key={friend.email}
                            onClick={() => toggleFriend(friend.email)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-[20px] font-bold text-sm transition-all border-2 
                              ${isSelected 
                                ? 'bg-black border-black text-white shadow-[3px_3px_0px_0px_rgba(163,230,53,1)]' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:-translate-y-0.5'}`}
                          >
                            <UserAvatar email={friend.email} name={friend.name} />
                            {friend.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t-2 border-dashed border-gray-200">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-1/3 py-5 bg-gray-100 hover:bg-gray-200 border-2 border-transparent rounded-2xl font-black text-lg text-gray-500 transition-all"
              >
                Скасувати
              </button>
              <button 
                onClick={handleSave} 
                disabled={isCreating}
                className="w-2/3 py-5 bg-[#A3E635] hover:bg-[#92d624] border-2 border-black rounded-2xl font-black text-lg text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-50"
              >
                {isCreating ? 'Збереження...' : (editingTripId ? 'Зберегти зміни' : 'Створити подорож')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsTab;