import React, { useState } from 'react';
import { ExternalLink, Plus, X, Upload } from 'lucide-react';

const HousingTab = ({ trip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const destination = trip?.destination || "Париж";
  const airbnbLink = `https://www.airbnb.com/s/${destination}/homes`;
  const bookingLink = `https://www.booking.com/searchresults.html?ss=${destination}`;

  return (
    <div className="flex-1 w-full bg-white border-2 border-black rounded-[30px] flex flex-col items-center justify-center p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[500px] relative">
      
      {/* Акуратна іконка */}
      <div className="w-20 h-20 bg-[#93E74F]/20 border-2 border-dashed border-[#93E74F] rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">🏨</span>
      </div>

      <h2 className="text-2xl font-black uppercase text-black mb-3">Житло ще не додано</h2>
      
      <p className="text-gray-500 font-bold text-center text-sm max-w-sm mb-8 leading-relaxed">
        Знайдіть варіанти для групи або додайте вже існуюче бронювання, щоб усі учасники мали до нього доступ.
      </p>

      {/* Компактні кнопки-посилання */}
      <div className="flex gap-4 mb-8">
        <a href={bookingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-black rounded-xl hover:-translate-y-1 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
          <span className="font-black text-[#003B95] text-lg">B.</span>
          <span className="font-bold text-sm text-black">Booking.com</span>
          <ExternalLink size={14} className="text-gray-300 group-hover:text-black transition-colors" />
        </a>

        <a href={airbnbLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-black rounded-xl hover:-translate-y-1 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
          <span className="font-black text-[#FF5A5F] text-lg tracking-tighter">ab</span>
          <span className="font-bold text-sm text-black">Airbnb</span>
          <ExternalLink size={14} className="text-gray-300 group-hover:text-black transition-colors" />
        </a>
      </div>

      {/* 🔴 НОВА КНОПКА ДЛЯ ВИКЛИКУ МОДАЛКИ */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-8 py-4 bg-[#93E74F] text-black border-2 border-black rounded-2xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#93E74F] active:translate-y-1 active:shadow-none transition-all"
      >
        <Plus size={20} /> Завантажити бронювання
      </button>


      {/* 🔴 МОДАЛЬНЕ ВІКНО */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-[30px] p-8 w-full max-w-lg shadow-[12px_12px_0px_0px_rgba(147,231,79,1)] animate-in fade-in zoom-in-95 relative">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center hover:bg-red-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black uppercase text-black mb-6">Додати житло</h3>

            <div className="flex flex-col gap-5">
              
              {/* Назва */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase text-gray-500">Назва (наприклад, Готель Hilton)</label>
                <input type="text" placeholder="Введіть назву..." className="px-5 py-4 border-2 border-black rounded-xl outline-none focus:border-[#93E74F] font-bold" />
              </div>

              {/* Лінк на бронь */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase text-gray-500">Посилання на Booking / Airbnb (необов'язково)</label>
                <input type="text" placeholder="https://..." className="px-5 py-4 border-2 border-black rounded-xl outline-none focus:border-[#93E74F] font-bold text-sm" />
              </div>

              {/* Завантаження файлу */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="font-bold text-sm uppercase text-gray-500">Або завантажте PDF / Скріншот</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center group-hover:bg-[#93E74F] transition-colors">
                     <Upload size={20} className="text-black" />
                  </div>
                  <span className="font-bold text-sm text-gray-600">Натисніть, щоб обрати файл</span>
                </div>
              </div>

              {/* Кнопка збереження */}
              <button 
                onClick={() => setIsModalOpen(false)} // Поки просто закриває, потім прикрутимо бекенд
                className="mt-4 w-full px-6 py-4 bg-black text-[#93E74F] border-2 border-black rounded-xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(147,231,79,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                Зберегти в сейф
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HousingTab;