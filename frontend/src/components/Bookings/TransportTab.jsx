import React from 'react';

const TransportTab = () => {
  return (
    <div className="flex-1 bg-white border-4 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center gap-4 p-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-4xl grayscale opacity-50 mb-4">
        ✈️
      </div>
      <h2 className="text-2xl font-black text-black uppercase text-center">Квитки на транспорт</h2>
      <p className="text-gray-400 font-bold text-center max-w-md">
        Додавайте сюди авіаквитки, броні на потяг, автобуси або оренду авто. Всі учасники бачитимуть час відправлення.
      </p>
    </div>
  );
};

export default TransportTab;