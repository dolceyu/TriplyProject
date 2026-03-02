import React from 'react';

const FriendsTab = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-black mb-12">Друзі</h1>

      <div className="flex flex-col gap-10">
        <div className="bg-white rounded-[40px] p-12 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-black">Знайти друга</h2>
            <p className="text-gray-500 text-lg">Введіть електронну пошту друга, щоб надіслати запит.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6 mt-2">
            <input 
              type="email" 
              placeholder="Введіть email..." 
              className="flex-grow px-6 py-4 rounded-2xl bg-[#F9FAFB] border-2 border-transparent focus:border-[#A3E635] focus:bg-white outline-none transition text-lg shadow-sm"
            />
            <button className="px-10 py-4 bg-[#A3E635] border-2 border-black rounded-2xl font-bold text-lg hover:bg-[#92d624] transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none whitespace-nowrap">
              Надіслати запит
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-20 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="w-48 h-48 bg-gray-50 rounded-full mb-8 flex items-center justify-center">
            <span className="text-6xl">🕵️‍♀️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Ваш список друзів порожній</h2>
          <p className="text-gray-500 max-w-md text-lg leading-relaxed">
            Додавайте друзів, щоб разом створювати спільні маршрути та планувати ідеальні подорожі!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FriendsTab;