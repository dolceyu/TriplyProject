import React from 'react';

const ProfileTab = ({ 
  userName, profileName, setProfileName, dob, setDob, 
  isEditingProfile, setIsEditingProfile, handleSaveProfile, 
  preferences, togglePreference, formatDate 
}) => {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-black mb-12">Мій профіль</h1>
      <div className="flex flex-col gap-10">
        <div className="bg-white rounded-[40px] p-12 shadow-sm flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-10 items-start w-full">
            <div className="relative group flex-shrink-0">
              <div className="w-36 h-36 bg-[#A3E635] rounded-full flex items-center justify-center text-6xl font-black text-black select-none shadow-sm">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <button className="absolute bottom-0 right-0 bg-black text-white p-2.5 rounded-full border-4 border-white hover:scale-105 transition-transform active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex-grow w-full">
              {!isEditingProfile ? (
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-bold text-black">{userName}</h2>
                    <p className="text-gray-500 text-lg">Мандрівник Triply</p>
                    <div className="mt-4 flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-2">День народження</span>
                      <div className="flex items-center gap-3 text-gray-700 bg-gray-50 px-5 py-3 rounded-2xl w-max border border-gray-100 shadow-sm">
                        <span className="text-xl">🎂</span>
                        <span className={`text-lg ${dob ? 'font-bold' : 'text-gray-400'}`}>{formatDate(dob)}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsEditingProfile(true)} className="px-6 py-3 bg-gray-100 text-gray-800 rounded-2xl font-bold hover:bg-gray-200 transition text-lg active:scale-95">
                    Редагувати
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6 w-full max-w-lg">
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-gray-700 text-base ml-2">Ім'я</label>
                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="px-5 py-3.5 text-lg font-bold rounded-2xl bg-[#F9FAFB] border-2 border-transparent focus:border-[#A3E635] focus:bg-white outline-none transition" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-gray-700 text-base ml-2">Дата народження</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-5 py-3.5 text-lg font-bold rounded-2xl bg-[#F9FAFB] border-2 border-transparent focus:border-[#A3E635] focus:bg-white outline-none transition text-gray-800 cursor-pointer [&::-webkit-calendar-picker-indicator]:scale-150 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:mr-1" />
                    <p className="text-sm text-gray-500 ml-2 mt-1 leading-snug">* За бажанням. Щоб друзі отримали нагадування і змогли вчасно вас привітати 🎉</p>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <button onClick={handleSaveProfile} className="px-8 py-3.5 bg-[#A3E635] text-black rounded-2xl font-bold text-lg hover:bg-[#92d624] transition active:scale-95">Зберегти</button>
                    <button onClick={() => setIsEditingProfile(false)} className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition active:scale-95">Скасувати</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[40px] p-12 shadow-sm flex flex-col gap-8 border-2 border-dashed border-[#A3E635]">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-black">Стиль подорожей</h2>
            <p className="text-gray-500 text-lg">Ці дані допоможуть алгоритму Triply створювати ідеальні спільні маршрути для вас та ваших друзів.</p>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {Object.keys(preferences).map((key) => (
              <button 
                key={key} 
                onClick={() => togglePreference(key)} 
                // Залишаємо технічне блокування, але забираємо візуальну "сірість"
                disabled={!isEditingProfile}
                className={`px-6 py-3 rounded-full font-bold text-lg transition-all border-2 
                  ${preferences[key] ? 'bg-[#A3E635] border-[#A3E635] text-black shadow-md' : 'bg-transparent border-gray-200 text-gray-500 hover:border-gray-300'}
                  ${!isEditingProfile ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
              >
                {key === 'mountains' && '🏔️ Гори'}
                {key === 'sea' && '🏖️ Море та релакс'}
                {key === 'active' && '🏃‍♀️ Активний відпочинок'}
                {key === 'museums' && '🏛️ Музеї та архітектура'}
                {key === 'coffee' && '☕ Кав\'ярні'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;