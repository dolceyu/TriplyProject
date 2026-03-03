import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ProfileTab = ({ 
  userName, profileName, setProfileName, dob, setDob, 
  isEditingProfile, setIsEditingProfile, handleSaveProfile, 
  preferences, togglePreference, formatDate 
}) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    if (userEmail) {
      const url = `http://127.0.0.1:8000/get-avatar/${userEmail}?t=${Date.now()}`;
      setAvatarUrl(url);
    }
  }, [userEmail]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://127.0.0.1:8000/upload-avatar/${userEmail}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success("Фото профілю оновлено! 📸");
        setAvatarUrl(`http://127.0.0.1:8000/get-avatar/${userEmail}?t=${Date.now()}`);
      } else {
        const error = await response.json();
        toast.error(error.detail || "Помилка завантаження");
      }
    } catch (err) {
      toast.error("Сервер не відповідає");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/delete-avatar/${userEmail}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Фото видалено");
        setAvatarUrl(null); 
      } else {
        toast.error("Не вдалося видалити фото");
      }
    } catch (err) {
      toast.error("Помилка зв'язку з сервером");
    }
  };

  const preferenceLabels = {
    mountains: '🏔️ Гори',
    sea: '🏖️ Море та пляж',
    museums: '🏛️ Музеї та архітектура',
    nature: '🌲 Природа та еко-туризм',
    foodie: '🍕 Гастротури та ресторани',
    nightlife: '🪩 Вечірки та клуби',
    shopping: '🛍️ Шопінг',
    active: '🏃‍♀️ Активний відпочинок',
    relax: '🧘‍♀️ Спокійний відпочинок / SPA',
    roadtrips: '🚗 Подорожі на авто'
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-black">Мій профіль</h1>
        
        {!isEditingProfile ? (
          <button 
            onClick={() => setIsEditingProfile(true)} 
            className="px-8 py-4 bg-white border-2 border-black rounded-2xl font-bold text-lg hover:bg-gray-50 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
          >
            Редагувати профіль
          </button>
        ) : (
          <div className="flex gap-4">
             <button 
              onClick={() => setIsEditingProfile(false)} 
              className="px-8 py-4 bg-gray-100 border-2 border-transparent rounded-2xl font-bold text-lg hover:bg-gray-200 transition active:scale-95"
            >
              Скасувати
            </button>
            <button 
              onClick={handleSaveProfile} 
              className="px-10 py-4 bg-[#A3E635] border-2 border-black rounded-2xl font-bold text-lg hover:bg-[#92d624] transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              Зберегти всі зміни
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-10">
        <div className={`bg-white rounded-[40px] p-12 shadow-sm border-2 transition-all ${isEditingProfile ? 'border-[#A3E635]' : 'border-transparent'}`}>
          <div className="flex flex-col md:flex-row gap-10 items-start w-full">
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 bg-[#A3E635] rounded-full flex items-center justify-center border-2 border-black shadow-sm overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null; 
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <span className="text-6xl font-black text-black select-none">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              
              {isEditingProfile && (
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <label className="bg-black text-white p-2.5 rounded-full border-4 border-white hover:scale-110 transition shadow-lg cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>

                  {avatarUrl && (
                    <button 
                      onClick={handleDeleteAvatar}
                      className="bg-red-500 text-white p-2.5 rounded-full border-4 border-white hover:scale-110 transition shadow-lg active:scale-90"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-grow w-full">
              {!isEditingProfile ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-bold text-black tracking-tight">{userName}</h2>
                    <p className="text-gray-500 font-medium text-lg">Мандрівник Triply</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-8 mt-2">
                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Електронна пошта</span>
                      <div className="flex items-center gap-4 text-gray-700 bg-gray-50 px-6 py-4 rounded-3xl border-2 border-gray-100 shadow-inner">
                        <span className="text-xl">📧</span>
                        <span className="text-lg font-bold">{userEmail}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Дата народження</span>
                      <div className="flex items-center gap-4 text-gray-700 bg-gray-50 px-6 py-4 rounded-3xl border-2 border-gray-100 shadow-inner">
                        <span className="text-xl">🎂</span>
                        <span className="text-lg font-bold">{formatDate(dob)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-8 w-full max-w-xl">
                  <div className="flex flex-col gap-3">
                    <label className="font-bold text-gray-800 text-lg ml-2 uppercase tracking-wide">Ваше Ім'я</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      className="px-6 py-5 text-xl font-bold rounded-[25px] bg-gray-50 border-2 border-gray-100 focus:border-[#A3E635] focus:bg-white outline-none transition-all shadow-inner" 
                    />
                  </div>

                  <div className="flex flex-col gap-3 opacity-60 cursor-not-allowed">
                    <label className="font-bold text-gray-400 text-lg ml-2 uppercase tracking-wide">Електронна пошта (не змінюється)</label>
                    <div className="px-6 py-5 text-xl font-bold rounded-[25px] bg-gray-200 border-2 border-transparent text-gray-500 shadow-inner">
                      {userEmail}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <label className="font-bold text-gray-800 text-lg ml-2 uppercase tracking-wide">Дата народження</label>
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)} 
                      className="w-full px-6 py-5 text-xl font-bold rounded-[25px] bg-gray-50 border-2 border-gray-100 focus:border-[#A3E635] focus:bg-white outline-none transition-all text-gray-800 cursor-pointer" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-[40px] p-12 shadow-sm flex flex-col gap-8 border-2 transition-all ${isEditingProfile ? 'border-[#A3E635] border-solid' : 'border-gray-100 border-dashed'}`}>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-black">Мій стиль подорожей</h2>
            <p className="text-gray-500 text-xl font-medium">Виберіть ваші вподобання для ідеальних маршрутів.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-2">
            {Object.keys(preferences)
              .filter(key => key !== 'coffee')
              .map((key) => {
              const label = preferenceLabels[key] || key;
              return (
                <button 
                  key={key} 
                  onClick={() => togglePreference(key)} 
                  disabled={!isEditingProfile}
                  className={`px-8 py-4 rounded-[20px] font-bold text-lg transition-all border-2 
                    ${preferences[key] 
                      ? 'bg-[#A3E635] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}
                    ${!isEditingProfile ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 active:translate-y-0 active:shadow-none'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;