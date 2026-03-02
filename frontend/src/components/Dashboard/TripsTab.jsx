import React from 'react';

const TripsTab = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black">Мої подорожі</h1>
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-white border-2 border-black rounded-2xl font-bold text-lg hover:bg-gray-50 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
            # Приєднатися за кодом
          </button>
          <button className="px-8 py-4 bg-[#A3E635] border-2 border-black rounded-2xl font-bold text-lg hover:bg-[#92d624] transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
            + Створити подорож
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-20 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
        <div className="w-64 h-64 bg-gray-50 rounded-full mb-8 flex items-center justify-center">
          <span className="text-6xl">✈️</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Ще немає активних подорожей</h2>
        <p className="text-gray-500 max-w-sm">Створіть свою першу подорож і запросіть друзів, щоб почати планування!</p>
      </div>
    </div>
  );
};

export default TripsTab;